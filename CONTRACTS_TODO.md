# 《冰雪城市》智能合约设计任务清单

## 已完成的合约

| 合约名称 | 文件名 | 完成度 | 说明 |
| :--- | :--- | :--- | :--- |
| ISCTradingCenter | ISC_Treasury_SmartContract.sol | ✅ 100% | 商品交易 + 10% 国库税收 |

---

## 待设计的核心合约

### 第一优先级（🔴 高）- 核心资产与基础设施

#### 1. RealEstateNFT (房产与地皮 NFT)

**重要性**：⭐⭐⭐⭐⭐ 最高

**职责**：
- 管理所有房产、建筑、地皮的所有权
- 支持买卖、租赁、抵押
- 计算日收益（租金、商业收入）

**关键功能**：
- `mintRealEstate()` - 铸造房产 NFT
- `transferOwnership()` - 转移所有权
- `setRent()` - 设置租金
- `collectRevenue()` - 收取日收益
- `mortgageProperty()` - 抵押房产
- `redeemMortgage()` - 赎回抵押

**数据结构**：
```solidity
struct RealEstate {
    uint256 tokenId;
    string name;           // 房产名称
    string location;       // 位置
    string propertyType;   // 类型（民居、学区房、商业地产等）
    uint256 purchasePrice; // 购买价格
    uint256 dailyRevenue;  // 日收益
    address owner;         // 所有者
    address mortgagee;     // 抵押权人
    uint256 mortgageAmount;// 抵押金额
    bool isRented;         // 是否出租
    address tenant;        // 租户地址
    uint256 rentPrice;     // 租金
    uint256 createdAt;     // 创建时间
}
```

**集成点**：
- ISCTradingCenter（交易）
- ISCMarketplace（NFT 市场）
- TaxSystem（房产税）
- GameStateManager（状态同步）

**预计工作量**：3-4 天

---

#### 2. BusinessNFT (企业与店铺 NFT)

**重要性**：⭐⭐⭐⭐⭐ 最高

**职责**：
- 管理所有企业、店铺、工厂、农场的所有权
- 支持经营、员工管理、收益计算
- 支持升级与扩建

**关键功能**：
- `mintBusiness()` - 创建企业 NFT
- `hireEmployee()` - 雇佣员工
- `fireEmployee()` - 解雇员工
- `calculateDailyRevenue()` - 计算日收入
- `upgradeBusiness()` - 升级企业等级
- `collectProfit()` - 收取利润

**业务类型**：
- 快递站、外卖站
- 五金店、玩具店
- 蔬菜大棚、养殖基地
- 医院、学校、滑雪场
- 消防站、银行、摊贩

**数据结构**：
```solidity
struct Business {
    uint256 tokenId;
    string name;           // 企业名称
    string businessType;   // 类型
    address owner;         // 所有者
    uint256 purchasePrice; // 购买价格
    uint256 dailyRevenue;  // 日收入
    uint256 dailyCost;     // 日成本
    uint256 inventory;     // 库存
    address[] employees;   // 员工列表
    uint256 level;         // 企业等级
    uint256 createdAt;     // 创建时间
}
```

**集成点**：
- ISCTradingCenter（交易）
- ISCMarketplace（NFT 市场）
- JobSystem（员工管理）
- TaxSystem（企业税）
- SupplyChainManager（库存）

**预计工作量**：3-4 天

---

#### 3. CommodityToken (商品代币)

**重要性**：⭐⭐⭐⭐ 很高

**职责**：
- 定义和管理所有可交易的商品
- 支持商品的铸造、销毁、转移
- 支持商品消耗（如建造时消耗建材）

**商品分类**：
- **农产品**：蔬菜、肉类、粮食
- **建材**：砂石、木材、金属、玻璃、水泥
- **工业品**：电子产品、日用品、家具
- **能源**：电力、水

**关键功能**：
- `mint()` - 铸造商品
- `burn()` - 销毁商品
- `transfer()` - 转移商品
- `setPrice()` - 设置商品价格
- `batchTransfer()` - 批量转移

**数据结构**（ERC1155）：
```solidity
// 商品 ID 映射
mapping(uint256 => Commodity) public commodities;

struct Commodity {
    string name;           // 商品名称
    string category;       // 分类
    uint256 basePrice;     // 基础价格
    uint256 totalSupply;   // 总供应量
    bool isConsumable;     // 是否可消耗
}
```

**集成点**：
- ISCTradingCenter（交易）
- SupplyChainManager（流转）
- BusinessNFT（库存）

**预计工作量**：2-3 天

---

### 第二优先级（🟠 中）- 经济系统

#### 4. ISCMarketplace (NFT 市场)

**重要性**：⭐⭐⭐⭐

**职责**：
- 提供 NFT 资产（房产、企业）的交易市场
- 支持固定价格、拍卖等交易方式
- 实现版税机制

**交易方式**：
- 固定价格买卖
- 荷兰式拍卖（价格递减）
- 英式拍卖（价格递增）

**关键功能**：
- `listForSale()` - 挂单出售
- `buyNow()` - 立即购买
- `startAuction()` - 开始拍卖
- `placeBid()` - 出价
- `endAuction()` - 结束拍卖
- `cancelListing()` - 取消挂单

**集成点**：
- RealEstateNFT（房产交易）
- BusinessNFT（企业交易）
- ISCToken（支付）

**预计工作量**：2-3 天

---

#### 5. TreasuryDAO (国库与 DAO 治理)

**重要性**：⭐⭐⭐⭐

**职责**：
- 管理国库资金（来自 10% 交易佣金）
- 支持支出提案与投票
- 实现 DAO 治理机制
- 财务透明公示

**关键功能**：
- `proposeExpenditure()` - 提议支出
- `vote()` - 投票
- `executeProposal()` - 执行提案
- `withdrawFromTreasury()` - 国库提现
- `getTreasuryBalance()` - 查询国库余额
- `publishFinancialReport()` - 发布财务报告

**治理机制**：
- 多签管理（初期）
- DAO 投票（后期）
- 提案冷却期
- 投票权重

**集成点**：
- ISCTradingCenter（佣金收入）
- ISCToken（投票权）

**预计工作量**：2-3 天

---

#### 6. TaxSystem (税收系统)

**重要性**：⭐⭐⭐⭐

**职责**：
- 自动计算各类税费
- 自动从玩家账户扣税
- 支持税收豁免与减免

**税收类型**：
- **电费**：按使用量计算（冬季暴风雪时增加 50%）
- **水费**：按使用量计算
- **房产税**：按房产价值的 0.5% 年税
- **企业所得税**：按利润的 10% 年税
- **交易税**：已由交易中心的 10% 佣金覆盖

**关键功能**：
- `calculateElectricityFee()` - 计算电费
- `calculateWaterFee()` - 计算水费
- `calculatePropertyTax()` - 计算房产税
- `calculateIncomeTax()` - 计算所得税
- `collectTaxes()` - 自动扣税
- `getTaxReport()` - 获取税收报告

**集成点**：
- RealEstateNFT（房产税）
- BusinessNFT（企业税）
- EventSystem（暴风雪增加电费）

**预计工作量**：2-3 天

---

### 第三优先级（🟠 中）- 游戏机制

#### 7. JobSystem (劳务与招聘系统)

**重要性**：⭐⭐⭐⭐

**职责**：
- 管理职位发布、求职申请、招聘
- 支持薪资支付与员工管理
- 实现评价与解雇机制

**职位类型**：
- 快递员、外卖员
- 医生、护士
- 教师、校长
- 建筑工人、蓝领
- 环卫工人、消防员
- 银行柜员、摊贩

**关键功能**：
- `postJob()` - 发布职位
- `applyForJob()` - 申请职位
- `hireEmployee()` - 聘用员工
- `payWage()` - 支付薪资
- `fireEmployee()` - 解雇员工
- `getJobListings()` - 查询职位列表

**数据结构**：
```solidity
struct Job {
    uint256 jobId;
    address employer;      // 雇主
    string jobTitle;       // 职位名称
    uint256 salary;        // 薪资
    uint256 openings;      // 招聘人数
    bool isActive;         // 是否活跃
}

struct Employee {
    uint256 employeeId;
    address employee;      // 员工
    address employer;      // 雇主
    uint256 salary;        // 薪资
    uint256 startDate;     // 开始日期
    uint256 rating;        // 评分
}
```

**集成点**：
- BusinessNFT（员工管理）
- ISCToken（薪资支付）

**预计工作量**：2-3 天

---

#### 8. SupplyChainManager (供应链管理)

**重要性**：⭐⭐⭐

**职责**：
- 管理生产、物流、库存
- 实现供应链自动流转
- 支持生产链追踪

**生产链示例**：
```
蔬菜大棚 (生产) 
  → 物流中心 (运输) 
  → 商业街摊贩/超市 (零售) 
  → 终端消费者/玩家
```

**关键功能**：
- `startProduction()` - 开始生产
- `completeProduction()` - 完成生产
- `shipToLogistics()` - 运输至物流中心
- `distributeToRetailer()` - 分配至零售商
- `trackSupplyChain()` - 追踪供应链

**集成点**：
- BusinessNFT（农场、工厂、物流中心）
- CommodityToken（商品流转）
- EventSystem（暴风雪延迟物流）

**预计工作量**：2-3 天

---

#### 9. EventSystem (事件系统)

**重要性**：⭐⭐⭐

**职责**：
- 管理游戏内的随机事件
- 实现事件的影响与奖励

**事件类型**：
- **暴风雪事件**：降低交通速度、增加电费 50%、可能导致供应链中断
- **火灾险情**：随机发生在老旧建筑，需要消防员救援，可能导致资产受损
- **经济波动**：商品价格随机波动（±20%）
- **奖励事件**：完成特定任务获得奖励

**关键功能**：
- `triggerEvent()` - 触发事件
- `handleBlizzard()` - 处理暴风雪
- `handleFire()` - 处理火灾
- `handlePriceFluctuation()` - 处理价格波动
- `awardReward()` - 发放奖励

**集成点**：
- TaxSystem（增加电费）
- SupplyChainManager（延迟物流）
- PriceOracle（价格波动）
- RealEstateNFT（火灾损害）

**预计工作量**：2 天

---

### 第四优先级（🟡 低）- 基础设施

#### 10. GameStateManager (游戏状态管理)

**重要性**：⭐⭐⭐

**职责**：
- 管理全局游戏状态
- 实现跨合约通信
- 保证数据一致性

**关键功能**：
- `updatePlayerState()` - 更新玩家状态
- `getGlobalState()` - 获取全局状态
- `syncData()` - 同步数据
- `callExternalContract()` - 调用外部合约

**集成点**：
- 所有其他合约

**预计工作量**：1-2 天

---

#### 11. PriceOracle (价格预言机)

**重要性**：⭐⭐⭐

**职责**：
- 提供链上商品价格数据
- 防止价格操纵
- 实时价格更新

**关键功能**：
- `updatePrice()` - 更新价格
- `getPrice()` - 获取当前价格
- `getPriceHistory()` - 获取价格历史
- `calculateAveragePrice()` - 计算平均价格

**集成点**：
- ISCTradingCenter（商品价格）
- EventSystem（价格波动）

**预计工作量**：1-2 天

---

## 部署顺序建议

```
第 1 阶段（第 1-2 周）：核心资产
  1. RealEstateNFT
  2. BusinessNFT
  3. CommodityToken

第 2 阶段（第 2-3 周）：经济系统
  4. ISCMarketplace
  5. TreasuryDAO
  6. TaxSystem

第 3 阶段（第 3-4 周）：游戏机制
  7. JobSystem
  8. SupplyChainManager
  9. EventSystem

第 4 阶段（第 4 周）：基础设施
  10. GameStateManager
  11. PriceOracle
```

---

## 总体工作量估计

| 阶段 | 合约数 | 预计工作量 | 优先级 |
| :--- | :--- | :--- | :--- |
| 第 1 阶段 | 3 | 8-11 天 | 🔴 高 |
| 第 2 阶段 | 3 | 6-9 天 | 🟠 中 |
| 第 3 阶段 | 3 | 6-8 天 | 🟠 中 |
| 第 4 阶段 | 2 | 2-4 天 | 🟡 低 |
| **总计** | **11** | **22-32 天** | - |

---

## 下一步行动

**建议优先级**：
1. ✅ 立即开始设计 **RealEstateNFT**（最关键）
2. ✅ 同时设计 **BusinessNFT**（最关键）
3. ✅ 然后设计 **CommodityToken**（基础）

**您希望我按照这个顺序进行吗？还是有其他优先级调整？**
