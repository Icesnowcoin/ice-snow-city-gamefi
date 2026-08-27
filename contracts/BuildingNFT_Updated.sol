// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BuildingNFT
 * @dev 冰雪城市房产 NFT 合约
 * ISC 消耗分配：1% 销毁 + 39% 国库 + 30% 营销 + 30% 预留
 * Gas 费用由玩家承担
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BuildingNFT is ERC721, Ownable, ReentrancyGuard {
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
    
    // 建筑类型枚举
    enum BuildingType {
        RESIDENTIAL,      // 住宅
        COMMERCIAL,       // 商业
        INDUSTRIAL,       // 工业
        ENTERTAINMENT,    // 娱乐
        HOSPITAL,         // 医院
        SCHOOL,           // 学校
        RESTAURANT,       // 餐厅
        SHOP,             // 商店
        FACTORY,          // 工厂
        OTHER             // 其他
    }
    
    // 建筑信息结构
    struct Building {
        uint256 tokenId;
        address owner;
        BuildingType buildingType;
        uint256 purchasePrice;
        uint256 dailyIncome;
        uint256 totalIncome;
        uint256 createdAt;
        uint256 lastClaimTime;
        bool isOperating;
        uint256 employeeCount;
    }
    
    // 建筑映射
    mapping(uint256 => Building) public buildings;
    mapping(address => uint256[]) public playerBuildings;
    mapping(uint256 => bool) public buildingExists;
    
    // 计数器
    uint256 private tokenIdCounter;
    
    // 事件
    event BuildingMinted(
        uint256 indexed tokenId,
        address indexed minter,
        BuildingType buildingType,
        uint256 iscCost,
        uint256 burnAmount,
        uint256 treasuryAmount,
        uint256 marketingAmount,
        uint256 timestamp
    );
    
    event BuildingOperationStarted(
        uint256 indexed tokenId,
        uint256 dailyIncome,
        uint256 timestamp
    );
    
    event IncomeCollected(
        uint256 indexed tokenId,
        uint256 amount,
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
    modifier buildingMustExist(uint256 tokenId) {
        require(buildingExists[tokenId], "Building does not exist");
        _;
    }
    
    modifier onlyBuildingOwner(uint256 tokenId) {
        require(buildings[tokenId].owner == msg.sender, "Only building owner can call this");
        _;
    }
    
    /**
     * @dev 构造函数
     * @param _iscToken ISC 代币合约地址
     */
    constructor(address _iscToken) ERC721("IceSnowCityBuilding", "BUILDING") {
        require(_iscToken != address(0), "Invalid ISC token address");
        iscToken = IERC20(_iscToken);
    }
    
    /**
     * @dev 铸造房产 NFT
     * ISC 消耗分配：1% 销毁 + 39% 国库 + 30% 营销 + 30% 预留
     * @param buildingType 建筑类型
     * @param iscCost 消耗的 ISC 数量
     * @param dailyIncome 日收入
     * @return tokenId 新铸造的 NFT ID
     */
    function mintBuilding(
        BuildingType buildingType,
        uint256 iscCost,
        uint256 dailyIncome
    ) external nonReentrant returns (uint256) {
        require(iscCost > 0, "ISC cost must be greater than 0");
        require(dailyIncome > 0, "Daily income must be greater than 0");
        require(iscToken.balanceOf(msg.sender) >= iscCost, "Insufficient ISC balance");
        require(iscToken.allowance(msg.sender, address(this)) >= iscCost, "Insufficient allowance");
        
        // 计算 ISC 分配金额
        uint256 burnAmount = (iscCost * BURN_PERCENTAGE) / 100;
        uint256 treasuryAmount = (iscCost * TREASURY_PERCENTAGE) / 100;
        uint256 marketingAmount = (iscCost * MARKETING_PERCENTAGE) / 100;
        
        // 验证分配总和
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
        // 1. 销毁 1%
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
        
        // 5. 记录建筑信息
        buildings[tokenId] = Building({
            tokenId: tokenId,
            owner: msg.sender,
            buildingType: buildingType,
            purchasePrice: iscCost,
            dailyIncome: dailyIncome,
            totalIncome: 0,
            createdAt: block.timestamp,
            lastClaimTime: block.timestamp,
            isOperating: true,
            employeeCount: 0
        });
        
        buildingExists[tokenId] = true;
        playerBuildings[msg.sender].push(tokenId);
        
        // 6. 发出事件
        emit BuildingMinted(
            tokenId,
            msg.sender,
            buildingType,
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
        
        emit BuildingOperationStarted(
            tokenId,
            dailyIncome,
            block.timestamp
        );
        
        return tokenId;
    }
    
    /**
     * @dev 获取玩家拥有的所有房产
     * @param player 玩家地址
     * @return 房产 ID 数组
     */
    function getPlayerBuildings(address player) external view returns (uint256[] memory) {
        return playerBuildings[player];
    }
    
    /**
     * @dev 获取房产信息
     * @param tokenId 房产 ID
     * @return 房产信息结构
     */
    function getBuildingInfo(uint256 tokenId) external view buildingMustExist(tokenId) returns (Building memory) {
        return buildings[tokenId];
    }
    
    /**
     * @dev 获取玩家拥有的房产数量
     * @param player 玩家地址
     * @return 房产数量
     */
    function getPlayerBuildingCount(address player) external view returns (uint256) {
        return playerBuildings[player].length;
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
    
    /**
     * @dev 获取建筑类型名称
     * @param buildingType 建筑类型
     * @return 建筑类型名称
     */
    function getBuildingTypeName(BuildingType buildingType) external pure returns (string memory) {
        if (buildingType == BuildingType.RESIDENTIAL) return "Residential";
        if (buildingType == BuildingType.COMMERCIAL) return "Commercial";
        if (buildingType == BuildingType.INDUSTRIAL) return "Industrial";
        if (buildingType == BuildingType.ENTERTAINMENT) return "Entertainment";
        if (buildingType == BuildingType.HOSPITAL) return "Hospital";
        if (buildingType == BuildingType.SCHOOL) return "School";
        if (buildingType == BuildingType.RESTAURANT) return "Restaurant";
        if (buildingType == BuildingType.SHOP) return "Shop";
        if (buildingType == BuildingType.FACTORY) return "Factory";
        return "Other";
    }
}
