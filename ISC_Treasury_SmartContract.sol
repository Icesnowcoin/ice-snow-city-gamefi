// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ISCTradingCenter
 * @dev ISC 交易中心智能合约，实现 10% 国库税收机制
 * 
 * 核心功能：
 * 1. 买卖订单撮合与成交
 * 2. 自动计算并扣除 10% 国库佣金
 * 3. 国库资金管理与透明公示
 * 4. 交易历史记录与审计
 */

contract ISCTradingCenter is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // ==================== 常量与状态变量 ====================

    IERC20 public iscToken; // ISC ERC20 代币合约
    address public treasuryAddress; // 国库地址
    uint256 public constant TREASURY_FEE_PERCENT = 10; // 国库佣金百分比（10%）
    uint256 public constant PERCENT_DIVISOR = 100; // 百分比除数

    // 交易对结构体
    struct TradingPair {
        string name; // 商品名称（如 "VEG", "SAND", "HOUSE"）
        string symbol; // 商品代码
        uint256 lastPrice; // 最新成交价
        uint256 totalVolume; // 累计交易量
        bool isActive; // 是否活跃
    }

    // 订单结构体
    struct Order {
        uint256 orderId; // 订单号
        address trader; // 交易者地址
        string pairSymbol; // 交易对代码
        bool isBuyOrder; // true=买单，false=卖单
        uint256 quantity; // 数量
        uint256 price; // 单价（ISC）
        uint256 totalAmount; // 总金额（未含佣金）
        uint256 treasuryFee; // 国库佣金
        uint256 netAmount; // 净金额（含佣金）
        uint256 createdAt; // 创建时间
        uint256 filledAt; // 成交时间（0 表示未成交）
        bool isFilled; // 是否已成交
        bool isCancelled; // 是否已取消
    }

    // 交易记录结构体
    struct TradeRecord {
        uint256 tradeId; // 交易ID
        uint256 buyOrderId; // 买单ID
        uint256 sellOrderId; // 卖单ID
        string pairSymbol; // 交易对
        uint256 quantity; // 成交数量
        uint256 price; // 成交价格
        uint256 totalAmount; // 成交总额
        uint256 treasuryFee; // 国库佣金
        uint256 timestamp; // 成交时间
        bytes32 txHash; // 交易哈希
    }

    // 映射表
    mapping(string => TradingPair) public tradingPairs; // 交易对映射
    mapping(uint256 => Order) public orders; // 订单映射
    mapping(uint256 => TradeRecord) public tradeRecords; // 交易记录映射
    mapping(address => uint256[]) public userOrders; // 用户订单列表
    mapping(address => uint256[]) public userTrades; // 用户交易列表
    mapping(address => uint256) public userBalances; // 用户 ISC 余额（游戏内积分）
    mapping(address => uint256) public userFrozenBalances; // 用户冻结余额（待成交订单）

    // 计数器
    uint256 public orderCounter = 0; // 订单计数器
    uint256 public tradeCounter = 0; // 交易计数器
    uint256 public treasuryBalance = 0; // 国库余额

    // ==================== 事件 ====================

    event TradingPairAdded(string indexed symbol, string name);
    event OrderCreated(
        uint256 indexed orderId,
        address indexed trader,
        string pairSymbol,
        bool isBuyOrder,
        uint256 quantity,
        uint256 price
    );
    event OrderFilled(
        uint256 indexed orderId,
        uint256 quantity,
        uint256 price,
        uint256 treasuryFee
    );
    event OrderCancelled(uint256 indexed orderId);
    event TradeExecuted(
        uint256 indexed tradeId,
        uint256 buyOrderId,
        uint256 sellOrderId,
        string pairSymbol,
        uint256 quantity,
        uint256 price,
        uint256 treasuryFee
    );
    event TreasuryFeeCollected(uint256 indexed tradeId, uint256 amount);
    event TreasuryWithdrawal(address indexed recipient, uint256 amount);
    event DepositISC(address indexed user, uint256 amount);
    event WithdrawISC(address indexed user, uint256 amount);

    // ==================== 修饰符 ====================

    modifier onlyValidPair(string memory _pairSymbol) {
        require(tradingPairs[_pairSymbol].isActive, "Invalid trading pair");
        _;
    }

    modifier onlyOrderOwner(uint256 _orderId) {
        require(orders[_orderId].trader == msg.sender, "Not order owner");
        _;
    }

    // ==================== 管理员函数 ====================

    /**
     * @dev 设置 ISC 代币合约地址
     */
    function setISCToken(address _iscTokenAddress) external onlyOwner {
        require(_iscTokenAddress != address(0), "Invalid token address");
        iscToken = IERC20(_iscTokenAddress);
    }

    /**
     * @dev 设置国库地址
     */
    function setTreasuryAddress(address _treasuryAddress) external onlyOwner {
        require(_treasuryAddress != address(0), "Invalid treasury address");
        treasuryAddress = _treasuryAddress;
    }

    /**
     * @dev 添加交易对
     */
    function addTradingPair(
        string memory _symbol,
        string memory _name
    ) external onlyOwner {
        require(bytes(_symbol).length > 0, "Invalid symbol");
        require(!tradingPairs[_symbol].isActive, "Pair already exists");

        tradingPairs[_symbol] = TradingPair({
            name: _name,
            symbol: _symbol,
            lastPrice: 0,
            totalVolume: 0,
            isActive: true
        });

        emit TradingPairAdded(_symbol, _name);
    }

    /**
     * @dev 禁用交易对
     */
    function disableTradingPair(string memory _pairSymbol) external onlyOwner {
        require(tradingPairs[_pairSymbol].isActive, "Pair not active");
        tradingPairs[_pairSymbol].isActive = false;
    }

    // ==================== 用户充值与提现 ====================

    /**
     * @dev 用户充值 ISC 到游戏内账户
     * @param _amount 充值金额
     */
    function depositISC(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            iscToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        userBalances[msg.sender] = userBalances[msg.sender].add(_amount);
        emit DepositISC(msg.sender, _amount);
    }

    /**
     * @dev 用户从游戏内账户提现 ISC 到链上钱包
     * @param _amount 提现金额
     */
    function withdrawISC(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            userBalances[msg.sender] >= _amount,
            "Insufficient balance"
        );

        userBalances[msg.sender] = userBalances[msg.sender].sub(_amount);
        require(iscToken.transfer(msg.sender, _amount), "Transfer failed");

        emit WithdrawISC(msg.sender, _amount);
    }

    /**
     * @dev 查询用户可用余额
     */
    function getAvailableBalance(address _user) external view returns (uint256) {
        uint256 total = userBalances[_user];
        uint256 frozen = userFrozenBalances[_user];
        return total > frozen ? total.sub(frozen) : 0;
    }

    // ==================== 核心交易函数 ====================

    /**
     * @dev 创建买单
     * @param _pairSymbol 交易对代码
     * @param _quantity 购买数量
     * @param _price 单价（ISC）
     */
    function createBuyOrder(
        string memory _pairSymbol,
        uint256 _quantity,
        uint256 _price
    ) external onlyValidPair(_pairSymbol) nonReentrant returns (uint256) {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_price > 0, "Price must be greater than 0");

        // 计算总金额与佣金
        uint256 totalAmount = _quantity.mul(_price);
        uint256 treasuryFee = totalAmount.mul(TREASURY_FEE_PERCENT).div(
            PERCENT_DIVISOR
        );
        uint256 netAmount = totalAmount.add(treasuryFee);

        // 检查用户余额
        uint256 availableBalance = userBalances[msg.sender].sub(
            userFrozenBalances[msg.sender]
        );
        require(availableBalance >= netAmount, "Insufficient balance");

        // 冻结资金
        userFrozenBalances[msg.sender] = userFrozenBalances[msg.sender].add(
            netAmount
        );

        // 创建订单
        uint256 orderId = ++orderCounter;
        orders[orderId] = Order({
            orderId: orderId,
            trader: msg.sender,
            pairSymbol: _pairSymbol,
            isBuyOrder: true,
            quantity: _quantity,
            price: _price,
            totalAmount: totalAmount,
            treasuryFee: treasuryFee,
            netAmount: netAmount,
            createdAt: block.timestamp,
            filledAt: 0,
            isFilled: false,
            isCancelled: false
        });

        userOrders[msg.sender].push(orderId);

        emit OrderCreated(
            orderId,
            msg.sender,
            _pairSymbol,
            true,
            _quantity,
            _price
        );

        // 自动撮合
        _matchOrders(_pairSymbol, orderId);

        return orderId;
    }

    /**
     * @dev 创建卖单
     * @param _pairSymbol 交易对代码
     * @param _quantity 销售数量
     * @param _price 单价（ISC）
     */
    function createSellOrder(
        string memory _pairSymbol,
        uint256 _quantity,
        uint256 _price
    ) external onlyValidPair(_pairSymbol) nonReentrant returns (uint256) {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_price > 0, "Price must be greater than 0");

        // 计算总金额与佣金
        uint256 totalAmount = _quantity.mul(_price);
        uint256 treasuryFee = totalAmount.mul(TREASURY_FEE_PERCENT).div(
            PERCENT_DIVISOR
        );

        // 注意：卖单的佣金从收入中扣除，不需要预先冻结

        // 创建订单
        uint256 orderId = ++orderCounter;
        orders[orderId] = Order({
            orderId: orderId,
            trader: msg.sender,
            pairSymbol: _pairSymbol,
            isBuyOrder: false,
            quantity: _quantity,
            price: _price,
            totalAmount: totalAmount,
            treasuryFee: treasuryFee,
            netAmount: totalAmount.sub(treasuryFee),
            createdAt: block.timestamp,
            filledAt: 0,
            isFilled: false,
            isCancelled: false
        });

        userOrders[msg.sender].push(orderId);

        emit OrderCreated(
            orderId,
            msg.sender,
            _pairSymbol,
            false,
            _quantity,
            _price
        );

        // 自动撮合
        _matchOrders(_pairSymbol, orderId);

        return orderId;
    }

    /**
     * @dev 订单撮合引擎
     * 简化版：按价格优先、时间优先的原则进行撮合
     */
    function _matchOrders(string memory _pairSymbol, uint256 _newOrderId)
        internal
    {
        Order storage newOrder = orders[_newOrderId];

        if (newOrder.isBuyOrder) {
            // 买单撮合逻辑：寻找价格 <= 买单价格的卖单
            for (uint256 i = 1; i < orderCounter; i++) {
                if (
                    i == _newOrderId ||
                    orders[i].isCancelled ||
                    orders[i].isFilled ||
                    !orders[i].isBuyOrder == false // 确保是卖单
                ) {
                    continue;
                }

                Order storage sellOrder = orders[i];

                if (
                    keccak256(abi.encodePacked(sellOrder.pairSymbol)) ==
                    keccak256(abi.encodePacked(_pairSymbol)) &&
                    sellOrder.price <= newOrder.price &&
                    sellOrder.quantity > 0 &&
                    newOrder.quantity > 0
                ) {
                    // 执行交易
                    uint256 matchQuantity = sellOrder.quantity <
                        newOrder.quantity
                        ? sellOrder.quantity
                        : newOrder.quantity;
                    uint256 matchPrice = sellOrder.price; // 按卖单价格成交

                    _executeTrade(
                        newOrder.orderId,
                        sellOrder.orderId,
                        _pairSymbol,
                        matchQuantity,
                        matchPrice
                    );

                    if (newOrder.quantity == 0) {
                        break;
                    }
                }
            }
        } else {
            // 卖单撮合逻辑：寻找价格 >= 卖单价格的买单
            for (uint256 i = 1; i < orderCounter; i++) {
                if (
                    i == _newOrderId ||
                    orders[i].isCancelled ||
                    orders[i].isFilled ||
                    orders[i].isBuyOrder == false // 确保是买单
                ) {
                    continue;
                }

                Order storage buyOrder = orders[i];

                if (
                    keccak256(abi.encodePacked(buyOrder.pairSymbol)) ==
                    keccak256(abi.encodePacked(_pairSymbol)) &&
                    buyOrder.price >= newOrder.price &&
                    buyOrder.quantity > 0 &&
                    newOrder.quantity > 0
                ) {
                    // 执行交易
                    uint256 matchQuantity = buyOrder.quantity <
                        newOrder.quantity
                        ? buyOrder.quantity
                        : newOrder.quantity;
                    uint256 matchPrice = buyOrder.price; // 按买单价格成交

                    _executeTrade(
                        buyOrder.orderId,
                        newOrder.orderId,
                        _pairSymbol,
                        matchQuantity,
                        matchPrice
                    );

                    if (newOrder.quantity == 0) {
                        break;
                    }
                }
            }
        }
    }

    /**
     * @dev 执行交易并处理资金与佣金
     */
    function _executeTrade(
        uint256 _buyOrderId,
        uint256 _sellOrderId,
        string memory _pairSymbol,
        uint256 _quantity,
        uint256 _price
    ) internal {
        Order storage buyOrder = orders[_buyOrderId];
        Order storage sellOrder = orders[_sellOrderId];

        uint256 totalAmount = _quantity.mul(_price);
        uint256 treasuryFee = totalAmount.mul(TREASURY_FEE_PERCENT).div(
            PERCENT_DIVISOR
        );
        uint256 buyerPayment = totalAmount.add(treasuryFee);
        uint256 sellerRevenue = totalAmount.sub(treasuryFee);

        // 更新订单数量
        buyOrder.quantity = buyOrder.quantity.sub(_quantity);
        sellOrder.quantity = sellOrder.quantity.sub(_quantity);

        // 标记订单为已成交（如果全部成交）
        if (buyOrder.quantity == 0) {
            buyOrder.isFilled = true;
            buyOrder.filledAt = block.timestamp;
        }
        if (sellOrder.quantity == 0) {
            sellOrder.isFilled = true;
            sellOrder.filledAt = block.timestamp;
        }

        // 处理买方资金
        userFrozenBalances[buyOrder.trader] = userFrozenBalances[
            buyOrder.trader
        ].sub(buyerPayment);

        // 处理卖方资金
        userBalances[sellOrder.trader] = userBalances[sellOrder.trader].add(
            sellerRevenue
        );

        // 国库佣金
        treasuryBalance = treasuryBalance.add(treasuryFee.mul(2)); // 买卖双方各 10%

        // 创建交易记录
        uint256 tradeId = ++tradeCounter;
        tradeRecords[tradeId] = TradeRecord({
            tradeId: tradeId,
            buyOrderId: _buyOrderId,
            sellOrderId: _sellOrderId,
            pairSymbol: _pairSymbol,
            quantity: _quantity,
            price: _price,
            totalAmount: totalAmount,
            treasuryFee: treasuryFee.mul(2),
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1)
        });

        userTrades[buyOrder.trader].push(tradeId);
        userTrades[sellOrder.trader].push(tradeId);

        // 更新交易对信息
        tradingPairs[_pairSymbol].lastPrice = _price;
        tradingPairs[_pairSymbol].totalVolume = tradingPairs[_pairSymbol]
            .totalVolume
            .add(totalAmount);

        // 发出事件
        emit TradeExecuted(
            tradeId,
            _buyOrderId,
            _sellOrderId,
            _pairSymbol,
            _quantity,
            _price,
            treasuryFee.mul(2)
        );
        emit TreasuryFeeCollected(tradeId, treasuryFee.mul(2));
    }

    /**
     * @dev 取消订单
     */
    function cancelOrder(uint256 _orderId)
        external
        onlyOrderOwner(_orderId)
        nonReentrant
    {
        Order storage order = orders[_orderId];
        require(!order.isFilled, "Order already filled");
        require(!order.isCancelled, "Order already cancelled");

        order.isCancelled = true;

        // 解冻资金（仅适用于买单）
        if (order.isBuyOrder) {
            userFrozenBalances[msg.sender] = userFrozenBalances[msg.sender]
                .sub(order.netAmount);
        }

        emit OrderCancelled(_orderId);
    }

    // ==================== 国库管理函数 ====================

    /**
     * @dev 国库提现（仅限合约所有者或授权地址）
     */
    function withdrawFromTreasury(address _recipient, uint256 _amount)
        external
        onlyOwner
        nonReentrant
    {
        require(_amount > 0, "Amount must be greater than 0");
        require(treasuryBalance >= _amount, "Insufficient treasury balance");
        require(_recipient != address(0), "Invalid recipient");

        treasuryBalance = treasuryBalance.sub(_amount);
        require(iscToken.transfer(_recipient, _amount), "Transfer failed");

        emit TreasuryWithdrawal(_recipient, _amount);
    }

    /**
     * @dev 查询国库余额
     */
    function getTreasuryBalance() external view returns (uint256) {
        return treasuryBalance;
    }

    // ==================== 查询函数 ====================

    /**
     * @dev 获取订单详情
     */
    function getOrder(uint256 _orderId)
        external
        view
        returns (Order memory)
    {
        return orders[_orderId];
    }

    /**
     * @dev 获取交易记录
     */
    function getTradeRecord(uint256 _tradeId)
        external
        view
        returns (TradeRecord memory)
    {
        return tradeRecords[_tradeId];
    }

    /**
     * @dev 获取用户订单列表
     */
    function getUserOrders(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userOrders[_user];
    }

    /**
     * @dev 获取用户交易列表
     */
    function getUserTrades(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userTrades[_user];
    }

    /**
     * @dev 获取交易对信息
     */
    function getTradingPair(string memory _symbol)
        external
        view
        returns (TradingPair memory)
    {
        return tradingPairs[_symbol];
    }

    /**
     * @dev 获取用户余额信息
     */
    function getUserBalance(address _user)
        external
        view
        returns (
            uint256 total,
            uint256 frozen,
            uint256 available
        )
    {
        total = userBalances[_user];
        frozen = userFrozenBalances[_user];
        available = total > frozen ? total.sub(frozen) : 0;
    }
}
