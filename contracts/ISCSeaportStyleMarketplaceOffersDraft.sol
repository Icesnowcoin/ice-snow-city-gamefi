// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ISCSeaportStyleMarketplaceOffersDraft
 * @notice Seaport-inspired fixed-price listings and buyer offers.
 *
 * This is a non-upgradeable draft. ISC remains an ordinary ERC-20 and this
 * contract has no mint, pause, tax, proxy, or token-owner control surface.
 * Listing settlement: seller signs; buyer pays and receives the NFT.
 * Offer settlement: buyer signs; the NFT owner explicitly calls acceptBuyOffer;
 * buyer pays and receives the NFT. Both paths require user-managed approvals.
 */
contract ISCSeaportStyleMarketplaceOffersDraft is EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    IERC20 public immutable iscToken;
    address public immutable treasury;
    uint256 public constant COMMISSION_BPS = 1_000;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    enum ItemType { ERC721, ERC1155 }
    enum OrderType { SELL, BUY_OFFER }

    struct Order {
        address offerer;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        uint256 expiration;
        uint256 nonce;
        uint8 itemType;
        uint8 orderType;
        bytes32 salt;
    }

    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,uint8 orderType,bytes32 salt)"
    );

    mapping(bytes32 => bool) public settled;
    mapping(address => mapping(uint256 => bool)) public cancelledNonces;

    error InvalidAddress();
    error InvalidOrder();
    error InvalidItemType();
    error InvalidOrderType();
    error OrderExpired();
    error OrderIsCancelled();
    error OrderAlreadySettled();
    error InvalidSignature();
    error SelfPurchase();
    error PaymentFailed();
    error AssetTransferFailed();
    error OfferNotAcceptedByOwner();

    event OrderSettled(bytes32 indexed orderHash, address indexed offerer, address indexed counterparty, uint8 orderType, uint256 price, uint256 commission);
    event OrderNonceCancelled(address indexed offerer, uint256 indexed nonce);
    event OrderCancelled(bytes32 indexed orderHash, address indexed offerer);

    constructor(address iscTokenAddress, address treasuryAddress) EIP712("Ice Snow City Seaport Style Marketplace", "2") {
        if (iscTokenAddress == address(0) || treasuryAddress == address(0)) revert InvalidAddress();
        iscToken = IERC20(iscTokenAddress);
        treasury = treasuryAddress;
    }

    function hashOrder(Order calldata order) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
            ORDER_TYPEHASH,
            order.offerer,
            order.nftContract,
            order.tokenId,
            order.amount,
            order.price,
            order.expiration,
            order.nonce,
            order.itemType,
            order.orderType,
            order.salt
        )));
    }

    function cancelNonce(uint256 nonce) external {
        cancelledNonces[msg.sender][nonce] = true;
        emit OrderNonceCancelled(msg.sender, nonce);
    }

    function cancelOrder(Order calldata order) external {
        if (order.offerer != msg.sender) revert InvalidOrder();
        bytes32 orderHash = hashOrder(order);
        settled[orderHash] = true;
        emit OrderCancelled(orderHash, msg.sender);
    }

    function executeSellOrder(Order calldata order, bytes calldata signature) external nonReentrant {
        _validateOrder(order, OrderType.SELL);
        if (msg.sender == order.offerer) revert SelfPurchase();
        bytes32 orderHash = _authorize(order, signature);
        settled[orderHash] = true;
        uint256 commission = (order.price * COMMISSION_BPS) / BPS_DENOMINATOR;
        _collectPayment(msg.sender, order.offerer, commission, order.price - commission);
        _transferAsset(order, order.offerer, msg.sender);
        emit OrderSettled(orderHash, order.offerer, msg.sender, uint8(OrderType.SELL), order.price, commission);
    }

    function acceptBuyOffer(Order calldata order, bytes calldata signature) external nonReentrant {
        _validateOrder(order, OrderType.BUY_OFFER);
        if (msg.sender == order.offerer) revert SelfPurchase();
        bytes32 orderHash = _authorize(order, signature);
        if (!_ownsAsset(order, msg.sender)) revert OfferNotAcceptedByOwner();
        settled[orderHash] = true;
        uint256 commission = (order.price * COMMISSION_BPS) / BPS_DENOMINATOR;
        _collectPayment(order.offerer, msg.sender, commission, order.price - commission);
        _transferAsset(order, msg.sender, order.offerer);
        emit OrderSettled(orderHash, order.offerer, msg.sender, uint8(OrderType.BUY_OFFER), order.price, commission);
    }

    function _authorize(Order calldata order, bytes calldata signature) internal view returns (bytes32 orderHash) {
        orderHash = hashOrder(order);
        if (settled[orderHash]) revert OrderAlreadySettled();
        if (cancelledNonces[order.offerer][order.nonce]) revert OrderIsCancelled();
        if (order.expiration <= block.timestamp) revert OrderExpired();
        if (orderHash.recover(signature) != order.offerer) revert InvalidSignature();
    }

    function _validateOrder(Order calldata order, OrderType expectedType) internal pure {
        if (order.offerer == address(0) || order.nftContract == address(0) || order.price == 0 || order.expiration == 0) revert InvalidOrder();
        if (order.itemType > uint8(ItemType.ERC1155)) revert InvalidItemType();
        if (order.orderType != uint8(expectedType)) revert InvalidOrderType();
        if (order.itemType == uint8(ItemType.ERC721) && order.amount != 1) revert InvalidOrder();
        if (order.itemType == uint8(ItemType.ERC1155) && order.amount == 0) revert InvalidOrder();
    }

    function _collectPayment(address payer, address recipient, uint256 commission, uint256 sellerAmount) internal {
        if (!iscToken.transferFrom(payer, recipient, sellerAmount)) revert PaymentFailed();
        if (!iscToken.transferFrom(payer, treasury, commission)) revert PaymentFailed();
    }

    function _ownsAsset(Order calldata order, address owner) internal view returns (bool) {
        if (order.itemType == uint8(ItemType.ERC721)) return IERC721(order.nftContract).ownerOf(order.tokenId) == owner;
        return IERC1155(order.nftContract).balanceOf(owner, order.tokenId) >= order.amount;
    }

    function _transferAsset(Order calldata order, address from, address to) internal {
        if (order.itemType == uint8(ItemType.ERC721)) {
            IERC721(order.nftContract).safeTransferFrom(from, to, order.tokenId);
        } else {
            IERC1155(order.nftContract).safeTransferFrom(from, to, order.tokenId, order.amount, "");
        }
    }
}
