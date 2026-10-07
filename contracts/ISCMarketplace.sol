// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ISCMarketplace
 * @dev 冰雪城市游戏 NFT 与资产市场交易合约
 * 
 * 功能：
 * - 房产/企业 NFT (ERC721) 挂单与交易
 * - 商品代币 (ERC1155) 挂单与交易
 * - 自动扣除 10% 国库佣金
 * - ISC 代币结算
 */
contract ISCMarketplace is Ownable, ReentrancyGuard {
    
    IERC20 public immutable iscToken;
    address public immutable treasury;
    uint256 public constant COMMISSION_RATE = 10; // 10% 佣金
    
    enum ListingType { ERC721, ERC1155 }
    
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 amount; // 用于 ERC1155
        uint256 price;  // 以 ISC 计价
        ListingType listingType;
        bool isActive;
        uint256 createdAt;
    }
    
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId = 1;
    
    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    );
    
    event ItemSold(
        uint256 indexed listingId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 commission
    );
    
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    
    constructor(address _iscToken, address _treasury) {
        require(_iscToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        iscToken = IERC20(_iscToken);
        treasury = _treasury;
    }
    
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        ListingType listingType
    ) external nonReentrant returns (uint256) {
        require(nftContract != address(0), "Invalid contract");
        require(price > 0, "Price must be > 0");
        
        if (listingType == ListingType.ERC721) {
            require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");
            require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)), "Not approved");
            amount = 1;
        } else {
            require(IERC1155(nftContract).balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
            require(IERC1155(nftContract).isApprovedForAll(msg.sender, address(this)), "Not approved");
        }
        
        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: amount,
            price: price,
            listingType: listingType,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit ItemListed(listingId, msg.sender, nftContract, tokenId, amount, price);
        return listingId;
    }
    
    function buyItem(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(msg.sender != listing.seller, "Cannot buy own item");
        
        uint256 price = listing.price;
        require(iscToken.balanceOf(msg.sender) >= price, "Insufficient ISC balance");
        
        uint256 commission = (price * COMMISSION_RATE) / 100;
        uint256 sellerAmount = price - commission;
        
        listing.isActive = false;
        
        require(iscToken.transferFrom(msg.sender, listing.seller, sellerAmount), "Payment to seller failed");
        require(iscToken.transferFrom(msg.sender, treasury, commission), "Payment to treasury failed");
        
        if (listing.listingType == ListingType.ERC721) {
            IERC721(listing.nftContract).safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        } else {
            IERC1155(listing.nftContract).safeTransferFrom(listing.seller, msg.sender, listing.tokenId, listing.amount, "");
        }
        
        emit ItemSold(listingId, listing.seller, msg.sender, price, commission);
    }
    
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(msg.sender == listing.seller, "Not seller");
        
        listing.isActive = false;
        emit ListingCancelled(listingId, msg.sender);
    }
}
