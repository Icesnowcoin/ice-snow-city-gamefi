// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ISCSeaportStyleMarketplaceDraft
 * @notice Ice Snow City 的最小 Seaport 风格固定价 NFT 市场草案。
 *
 * 设计来源：借鉴 Seaport 的订单哈希、EIP-712 签名、nonce/取消和原子结算思想，
 * 但不复制 Seaport 的复杂 consideration、criteria、zone、conduit 或批量订单系统。
 *
 * 重要边界：
 * - ISC 只是普通 ERC-20；本合约不会暂停、升级、增发、改税或控制 ISC。
 * - 卖家必须批准 NFT，买家必须批准 ISC；两者都由用户自行签名并承担 Gas。
 * - 本草案的 10% 佣金只属于本市场交易，不适用于 NFT 铸造或社交消费。
 * - NFT 铸造的 1%销毁/69%国库/30%营销由独立铸造合约处理。
 */
contract ISCSeaportStyleMarketplaceDraft is EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    IERC20 public immutable iscToken;
    address public immutable treasury;
    uint256 public constant COMMISSION_BPS = 1_000; // 10% of this market sale
    uint256 public constant BPS_DENOMINATOR = 10_000;

    enum ItemType {
        ERC721,
        ERC1155
    }

    struct Order {
        address offerer;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        uint256 expiration;
        uint256 nonce;
        uint8 itemType;
        bytes32 salt;
    }

    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,bytes32 salt)"
    );

    mapping(bytes32 => bool) public fulfilled;
    mapping(address => mapping(uint256 => bool)) public cancelledNonces;

    error InvalidAddress();
    error InvalidOrder();
    error InvalidItemType();
    error OrderExpired();
    error OrderIsCancelled();
    error OrderAlreadyFulfilled();
    error InvalidSignature();
    error SelfPurchase();
    error PaymentFailed();
    error AssetTransferFailed();

    event OrderFulfilled(
        bytes32 indexed orderHash,
        address indexed offerer,
        address indexed buyer,
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        uint256 commission
    );

    event OrderNonceCancelled(address indexed offerer, uint256 indexed nonce);
    event OrderCancelled(bytes32 indexed orderHash, address indexed offerer);

    constructor(address iscTokenAddress, address treasuryAddress)
        EIP712("Ice Snow City Seaport Style Marketplace", "1")
    {
        if (iscTokenAddress == address(0) || treasuryAddress == address(0)) {
            revert InvalidAddress();
        }
        iscToken = IERC20(iscTokenAddress);
        treasury = treasuryAddress;
    }

    function hashOrder(Order calldata order) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    order.offerer,
                    order.nftContract,
                    order.tokenId,
                    order.amount,
                    order.price,
                    order.expiration,
                    order.nonce,
                    order.itemType,
                    order.salt
                )
            )
        );
    }

    function cancelNonce(uint256 nonce) external {
        cancelledNonces[msg.sender][nonce] = true;
        emit OrderNonceCancelled(msg.sender, nonce);
    }

    function cancelOrder(Order calldata order) external {
        if (order.offerer != msg.sender) revert InvalidOrder();
        bytes32 orderHash = hashOrder(order);
        fulfilled[orderHash] = true;
        emit OrderCancelled(orderHash, msg.sender);
    }

    function executeOrder(Order calldata order, bytes calldata signature)
        external
        nonReentrant
    {
        _validateOrder(order);
        bytes32 orderHash = hashOrder(order);
        if (fulfilled[orderHash]) revert OrderAlreadyFulfilled();
        if (cancelledNonces[order.offerer][order.nonce]) revert OrderIsCancelled();

        address recovered = orderHash.recover(signature);
        if (recovered != order.offerer) revert InvalidSignature();
        if (msg.sender == order.offerer) revert SelfPurchase();

        // Checks-effects-interactions: mark first so external NFT/ERC20 calls cannot replay it.
        fulfilled[orderHash] = true;
        uint256 commission = (order.price * COMMISSION_BPS) / BPS_DENOMINATOR;
        uint256 sellerAmount = order.price - commission;

        if (!iscToken.transferFrom(msg.sender, order.offerer, sellerAmount)) {
            revert PaymentFailed();
        }
        if (!iscToken.transferFrom(msg.sender, treasury, commission)) {
            revert PaymentFailed();
        }

        if (order.itemType == uint8(ItemType.ERC721)) {
            IERC721(order.nftContract).safeTransferFrom(
                order.offerer,
                msg.sender,
                order.tokenId
            );
        } else {
            IERC1155(order.nftContract).safeTransferFrom(
                order.offerer,
                msg.sender,
                order.tokenId,
                order.amount,
                ""
            );
        }

        emit OrderFulfilled(
            orderHash,
            order.offerer,
            msg.sender,
            order.nftContract,
            order.tokenId,
            order.amount,
            order.price,
            commission
        );
    }

    function _validateOrder(Order calldata order) internal view {
        if (
            order.offerer == address(0) ||
            order.nftContract == address(0) ||
            order.price == 0 ||
            order.expiration <= block.timestamp
        ) revert InvalidOrder();
        if (order.itemType > uint8(ItemType.ERC1155)) revert InvalidItemType();
        if (order.itemType == uint8(ItemType.ERC721)) {
            if (order.amount != 1) revert InvalidOrder();
        } else if (order.amount == 0) {
            revert InvalidOrder();
        }
    }
}
