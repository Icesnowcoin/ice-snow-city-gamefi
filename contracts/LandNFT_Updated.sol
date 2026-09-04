// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LandNFT
 * @dev 冰雪城市土地 NFT 合约
 * ISC 消耗分配：1% 销毁 + 39% 国库 + 30% 营销 + 30% 预留
 * Gas 费用由玩家承担
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LandNFT is ERC721, Ownable, ReentrancyGuard {
    // ISC 代币接口
    IERC20 public immutable iscToken;
    
    // ISC 分配地址（永久记录）
    address public constant TREASURY_ADDRESS = 0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019;
    address public constant MARKETING_WALLET = 0xF8A408495941ea30451Da613dC846Dcae47890f0;
    address public constant BURN_ADDRESS = 0x0000000000000000000000000000000000000000;
    
    // ISC 分配比例（基数 100）
    uint256 public constant BURN_PERCENTAGE = 1;      // 1% 永久销毁
    uint256 public constant TREASURY_PERCENTAGE = 69;  // 69% 国库分配
    uint256 public constant MARKETING_PERCENTAGE = 30; // 30% 营销钱包
    // 合计 100%（1% + 69% + 30%）
    
    // 土地信息结构
    struct Land {
        uint256 tokenId;
        address owner;
        uint256 purchasePrice;
        uint256 rentIncome;
        uint256 createdAt;
        bool isRented;
        address renter;
    }
    
    // 土地映射
    mapping(uint256 => Land) public lands;
    mapping(address => uint256[]) public playerLands;
    mapping(uint256 => bool) public landExists;
    
    // 计数器
    uint256 private tokenIdCounter;
    
    // 事件
    event LandMinted(
        uint256 indexed tokenId,
        address indexed minter,
        uint256 iscCost,
        uint256 burnAmount,
        uint256 treasuryAmount,
        uint256 marketingAmount,
        uint256 timestamp
    );
    
    event LandPurchased(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 timestamp
    );
    
    event LandRented(
        uint256 indexed tokenId,
        address indexed renter,
        uint256 dailyRent,
        uint256 timestamp
    );
    
    event ISCDistributed(
        uint256 indexed tokenId,
        uint256 burnAmount,
        uint256 treasuryAmount,
        uint256 marketingAmount,
        uint256 timestamp
    );
    
    // 修饰符
    modifier landMustExist(uint256 tokenId) {
        require(landExists[tokenId], "Land does not exist");
        _;
    }
    
    modifier onlyLandOwner(uint256 tokenId) {
        require(lands[tokenId].owner == msg.sender, "Only land owner can call this");
        _;
    }
    
    /**
     * @dev 构造函数
     * @param _iscToken ISC 代币合约地址
     */
    constructor(address _iscToken) ERC721("IceSnowCityLand", "LAND") {
        require(_iscToken != address(0), "Invalid ISC token address");
        iscToken = IERC20(_iscToken);
    }
    
    /**
     * @dev 铸造土地 NFT
     * ISC 消耗分配：1% 销毁 + 39% 国库 + 30% 营销 + 30% 预留
     * @param iscCost 消耗的 ISC 数量
     * @return tokenId 新铸造的 NFT ID
     */
    function mintLand(uint256 iscCost) external nonReentrant returns (uint256) {
        require(iscCost > 0, "ISC cost must be greater than 0");
        require(iscToken.balanceOf(msg.sender) >= iscCost, "Insufficient ISC balance");
        require(iscToken.allowance(msg.sender, address(this)) >= iscCost, "Insufficient allowance");
        
        // 计算 ISC 分配金额
        uint256 burnAmount = (iscCost * BURN_PERCENTAGE) / 100;
        uint256 treasuryAmount = (iscCost * TREASURY_PERCENTAGE) / 100;
        uint256 marketingAmount = (iscCost * MARKETING_PERCENTAGE) / 100;
        
        // 验证分配总和（防止精度丢失）
        require(
            burnAmount + treasuryAmount + marketingAmount <= iscCost,
            "Distribution amount exceeds total cost"
        );
        
        // 从玩家转账 ISC 到合约
        require(
            iscToken.transferFrom(msg.sender, address(this), iscCost),
            "ISC transfer from player failed"
        );
        
        // 分配 ISC
        // 1. 销毁 1% - 发送到销毁地址（永久销毁）
        if (burnAmount > 0) {
            require(
                iscToken.transfer(BURN_ADDRESS, burnAmount),
                "Burn transfer failed"
            );
        }
        
        // 2. 转账到国库 39%
        if (treasuryAmount > 0) {
            require(
                iscToken.transfer(TREASURY_ADDRESS, treasuryAmount),
                "Treasury transfer failed"
            );
        }
        
        // 3. 转账到营销钱包 30%
        if (marketingAmount > 0) {
            require(
                iscToken.transfer(MARKETING_WALLET, marketingAmount),
                "Marketing transfer failed"
            );
        }
        
        // 4. 铸造 NFT
        uint256 tokenId = tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        
        // 5. 记录土地信息
        lands[tokenId] = Land({
            tokenId: tokenId,
            owner: msg.sender,
            purchasePrice: iscCost,
            rentIncome: 0,
            createdAt: block.timestamp,
            isRented: false,
            renter: address(0)
        });
        
        landExists[tokenId] = true;
        playerLands[msg.sender].push(tokenId);
        
        // 6. 发出事件
        emit LandMinted(
            tokenId,
            msg.sender,
            iscCost,
            burnAmount,
            treasuryAmount,
            marketingAmount,
            block.timestamp
        );
        
        emit ISCDistributed(
            tokenId,
            burnAmount,
            treasuryAmount,
            marketingAmount,
            block.timestamp
        );
        
        return tokenId;
    }
    
    /**
     * @dev 获取玩家拥有的所有土地
     * @param player 玩家地址
     * @return 土地 ID 数组
     */
    function getPlayerLands(address player) external view returns (uint256[] memory) {
        return playerLands[player];
    }
    
    /**
     * @dev 获取土地信息
     * @param tokenId 土地 ID
     * @return 土地信息结构
     */
    function getLandInfo(uint256 tokenId) external view landMustExist(tokenId) returns (Land memory) {
        return lands[tokenId];
    }
    
    /**
     * @dev 获取玩家拥有的土地数量
     * @param player 玩家地址
     * @return 土地数量
     */
    function getPlayerLandCount(address player) external view returns (uint256) {
        return playerLands[player].length;
    }
    
    /**
     * @dev 检查土地是否存在
     * @param tokenId 土地 ID
     * @return 是否存在
     */
    function isLandExists(uint256 tokenId) external view returns (bool) {
        return landExists[tokenId];
    }
    
    /**
     * @dev 获取 ISC 分配信息
     * @param iscCost 总消耗 ISC
     * @return 分配信息
     */
    function getISCDistribution(uint256 iscCost) external pure returns (
        uint256 burnAmount,
        uint256 treasuryAmount,
        uint256 marketingAmount,
        uint256 reserveAmount
    ) {
        burnAmount = (iscCost * BURN_PERCENTAGE) / 100;
        treasuryAmount = (iscCost * TREASURY_PERCENTAGE) / 100;
        marketingAmount = (iscCost * MARKETING_PERCENTAGE) / 100;
        reserveAmount = iscCost - burnAmount - treasuryAmount - marketingAmount;
    }
}
