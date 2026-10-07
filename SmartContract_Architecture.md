# 《冰雪城市》完整智能合约架构设计

## 概述

《冰雪城市》是一个复杂的链上游戏经济系统，需要多个相互配合的智能合约来支撑其核心功能。本文档详细阐述了游戏所需的完整合约体系、各合约的职责、交互关系以及部署顺序。

---

## 第一部分：当前已设计的合约

### 1. ISCTradingCenter（ISC交易中心合约）

**位置**：`ISC_Treasury_SmartContract.sol`

**职责**：
- 管理全品类商品的自由买卖（订单簿模式）
- 自动撮合买卖订单
- 计算并扣除 10% 国库佣金
- 管理用户游戏内账户余额（ISC）
- 记录交易历史与审计追踪

**核心功能**：
- `createBuyOrder()` - 创建买单
- `createSellOrder()` - 创建卖单
- `_matchOrders()` - 订单撮合引擎
- `_executeTrade()` - 交易执行与佣金扣除
- `depositISC()` - 充值ISC到游戏账户
- `withdrawISC()` - 提现ISC到链上钱包
- `getTreasuryBalance()` - 查询国库余额

**国库机制**：
- 每笔交易自动扣除 10% ISC 作为国库佣金
- 国库余额实时累计
- 支持透明查询与提现

---

## 第二部分：完整的合约体系架构

### 合约体系全景图

```
┌─────────────────────────────────────────────────────────────────────┐
│                    《冰雪城市》智能合约生态系统                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【核心代币层】                                                      │
│  ├─ ISCToken (ERC20)                                               │
│  │  └─ 游戏内通证，支持跨链桥接                                      │
│  │                                                                 │
│  【交易与经济层】                                                    │
│  ├─ ISCTradingCenter (已设计)                                      │
│  │  ├─ 订单簿撮合                                                   │
│  │  ├─ 10% 国库佣金                                                │
│  │  └─ 用户账户管理                                                 │
│  │                                                                 │
│  ├─ ISCMarketplace (新增)                                          │
│  │  ├─ NFT 资产交易（房产、地皮）                                   │
│  │  ├─ 版税机制                                                    │
│  │  └─ 拍卖功能                                                    │
│  │                                                                 │
│  【资产与所有权层】                                                  │
│  ├─ RealEstateNFT (新增)                                           │
│  │  ├─ 房产 NFT（民居、学区房、商业地产）                            │
│  │  ├─ 建筑 NFT（医院、学校、滑雪场等）                             │
│  │  ├─ 地皮 NFT（可建造的土地）                                     │
│  │  └─ 所有权与收益权分离                                           │
│  │                                                                 │
│  ├─ BusinessNFT (新增)                                             │
│  │  ├─ 企业 NFT（店铺、工厂、农场）                                 │
│  │  ├─ 经营权与收益权                                               │
│  │  └─ 员工管理                                                    │
│  │                                                                 │
│  ├─ CommodityToken (新增)                                          │
│  │  ├─ 农产品 Token（蔬菜、肉类、粮食）                             │
│  │  ├─ 建材 Token（砂石、木材、金属）                               │
│  │  ├─ 工业品 Token（电子产品、日用品）                             │
│  │  └─ 可交易、可消耗                                               │
│  │                                                                 │
│  【经济管理层】                                                      │
│  ├─ TreasuryDAO (新增)                                             │
│  │  ├─ 国库资金管理                                                 │
│  │  ├─ 支出审批与公示                                               │
│  │  ├─ DAO 治理投票                                                │
│  │  └─ 财政政策制定                                                 │
│  │                                                                 │
│  ├─ TaxSystem (新增)                                               │
│  │  ├─ 电费与水费计算                                               │
│  │  ├─ 房产税收                                                    │
│  │  ├─ 企业所得税                                                  │
│  │  └─ 自动扣款                                                    │
│  │                                                                 │
│  【游戏机制层】                                                      │
│  ├─ JobSystem (新增)                                               │
│  │  ├─ 劳务中心                                                    │
│  │  ├─ 求职与招聘                                                  │
│  │  ├─ 薪资支付                                                    │
│  │  └─ 员工管理                                                    │
│  │                                                                 │
│  ├─ SupplyChainManager (新增)                                      │
│  │  ├─ 生产链管理（农场、工厂）                                      │
│  │  ├─ 物流中心                                                    │
│  │  ├─ 库存管理                                                    │
│  │  └─ 自动分配                                                    │
│  │                                                                 │
│  ├─ EventSystem (新增)                                             │
│  │  ├─ 暴风雪事件                                                  │
│  │  ├─ 火灾险情                                                    │
│  │  ├─ 经济波动                                                    │
│  │  └─ 奖励机制                                                    │
│  │                                                                 │
│  【基础设施层】                                                      │
│  ├─ GameStateManager (新增)                                        │
│  │  ├─ 全局游戏状态                                                 │
│  │  ├─ 玩家数据同步                                                 │
│  │  └─ 跨合约通信                                                  │
│  │                                                                 │
│  ├─ AccessControl (已有)                                           │
│  │  ├─ 角色权限管理                                                 │
│  │  └─ 管理员控制                                                  │
│  │                                                                 │
│  └─ PriceOracle (新增)                                             │
│     ├─ 商品价格预言机                                               │
│     ├─ 链上数据聚合                                                 │
│     └─ 价格波动管理                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 第三部分：详细合约设计

### 1. ISCToken (ERC20 代币合约)

**职责**：游戏内通证的基础层

**功能**：
- 标准 ERC20 接口
- 铸造与销毁
- 跨链桥接支持
- 暂停机制（紧急情况）

**关键参数**：
- 初始供应量：1,000,000,000 ISC
- 小数位数：18
- 支持跨链（如 BSC、Polygon 等）

---

### 2. RealEstateNFT (房产与地皮 NFT 合约)

**职责**：管理所有房产、建筑、地皮的所有权与收益权

**功能**：
- 铸造房产 NFT（民居、学区房、商业地产、工业地产）
- 铸造建筑 NFT（医院、学校、滑雪场、消防站等）
- 铸造地皮 NFT（可建造的土地）
- 所有权转移（买卖）
- 收益权管理（日租金、月租金）
- 抵押机制（用于贷款）

**数据结构**：
```solidity
struct RealEstate {
    uint256 tokenId;
    string name;           // 房产名称
    string location;       // 位置
    uint256 purchasePrice; // 购买价格
    uint256 dailyRevenue;  // 日收益
    address owner;         // 所有者
    address mortgagee;     // 抵押权人（如有）
    uint256 mortgageAmount;// 抵押金额
    bool isRented;         // 是否出租
    address tenant;        // 租户地址
    uint256 rentPrice;     // 租金
    uint256 createdAt;     // 创建时间
}
```

**关键方法**：
- `mintRealEstate()` - 铸造房产
- `transferOwnership()` - 转移所有权
- `setRent()` - 设置租金
- `collectRevenue()` - 收取收益
- `mortgageProperty()` - 抵押房产
- `redeemMortgage()` - 赎回抵押

---

### 3. BusinessNFT (企业与店铺 NFT 合约)

**职责**：管理所有企业、店铺、工厂、农场的所有权与运营

**功能**：
- 铸造企业 NFT（快递站、外卖站、五金店、玩具店等）
- 企业经营权管理
- 员工招聘与管理
- 日常收入与成本计算
- 企业升级与扩建

**数据结构**：
```solidity
struct Business {
    uint256 tokenId;
    string name;           // 企业名称
    string businessType;   // 类型（快递、外卖、零售等）
    address owner;         // 所有者
    uint256 purchasePrice; // 购买价格
    uint256 dailyRevenue;  // 日收入
    uint256 dailyCost;     // 日成本（员工工资、电费等）
    uint256 inventory;     // 库存
    address[] employees;   // 员工列表
    uint256 level;         // 企业等级（影响收入）
    uint256 createdAt;     // 创建时间
}
```

**关键方法**：
- `mintBusiness()` - 创建企业
- `hireEmployee()` - 雇佣员工
- `fireEmployee()` - 解雇员工
- `calculateDailyRevenue()` - 计算日收入
- `upgradeBusiness()` - 升级企业
- `collectProfit()` - 收取利润

---

### 4. CommodityToken (商品代币合约)

**职责**：管理游戏内所有可交易的商品（农产品、建材、工业品等）

**功能**：
- 定义多种商品类型（ERC1155 标准）
- 商品铸造与销毁
- 商品交易与流转
- 商品消耗（如建造时消耗建材）
- 商品价格管理

**商品分类**：
- 农产品：蔬菜、肉类、粮食
- 建材：砂石、木材、金属、玻璃
- 工业品：电子产品、日用品
- 特殊商品：能源（电、水）

**关键方法**：
- `mint()` - 铸造商品
- `burn()` - 销毁商品
- `transfer()` - 转移商品
- `setPrice()` - 设置商品价格
- `batchTransfer()` - 批量转移

---

### 5. ISCMarketplace (NFT 市场合约)

**职责**：房产、企业、地皮等 NFT 资产的交易市场

**功能**：
- 挂单与取消挂单
- 固定价格买卖
- 荷兰式拍卖
- 英式拍卖
- 版税机制（原创者获得后续交易的分成）
- 交易历史记录

**关键方法**：
- `listForSale()` - 挂单出售
- `buyNow()` - 立即购买
- `startAuction()` - 开始拍卖
- `placeBid()` - 出价
- `endAuction()` - 结束拍卖
- `cancelListing()` - 取消挂单

---

### 6. TreasuryDAO (国库与 DAO 治理合约)

**职责**：管理国库资金、财政支出、DAO 治理投票

**功能**：
- 国库资金管理
- 支出提案与投票
- 财政政策制定
- 透明公示
- 多签管理

**关键方法**：
- `proposeExpenditure()` - 提议支出
- `vote()` - 投票
- `executeProposal()` - 执行提案
- `withdrawFromTreasury()` - 国库提现
- `getTreasuryBalance()` - 查询国库余额
- `publishFinancialReport()` - 发布财务报告

---

### 7. TaxSystem (税收系统合约)

**职责**：自动计算与扣除各类税费

**功能**：
- 电费与水费计算
- 房产税收
- 企业所得税
- 自动扣款
- 税收豁免与减免

**税收类型**：
- 电费：按使用量计算（冬季暴风雪时增加）
- 水费：按使用量计算
- 房产税：按房产价值的 0.5% 年税
- 企业所得税：按利润的 10% 年税
- 交易税：已由交易中心的 10% 佣金覆盖

**关键方法**：
- `calculateElectricityFee()` - 计算电费
- `calculateWaterFee()` - 计算水费
- `calculatePropertyTax()` - 计算房产税
- `calculateIncomeTax()` - 计算所得税
- `collectTaxes()` - 自动扣税

---

### 8. JobSystem (劳务与招聘系统合约)

**职责**：管理求职、招聘、薪资支付

**功能**：
- 职位发布
- 求职申请
- 招聘管理
- 薪资支付
- 员工评价与解雇

**职位类型**：
- 快递员、外卖员
- 医生、护士
- 教师、校长
- 建筑工人、蓝领
- 环卫工人
- 消防员
- 银行柜员
- 摊贩

**关键方法**：
- `postJob()` - 发布职位
- `applyForJob()` - 申请职位
- `hireEmployee()` - 聘用员工
- `payWage()` - 支付薪资
- `fireEmployee()` - 解雇员工
- `getJobListings()` - 查询职位列表

---

### 9. SupplyChainManager (供应链管理合约)

**职责**：管理生产、物流、库存

**功能**：
- 农场与工厂的生产管理
- 物流中心的运输管理
- 库存管理与自动分配
- 生产链追踪

**生产链示例**：
```
蔬菜大棚 (生产) 
  → 物流中心 (运输) 
  → 商业街摊贩/超市 (零售) 
  → 终端消费者/玩家
```

**关键方法**：
- `startProduction()` - 开始生产
- `completeProduction()` - 完成生产
- `shipToLogistics()` - 运输至物流中心
- `distributeToRetailer()` - 分配至零售商
- `trackSupplyChain()` - 追踪供应链

---

### 10. EventSystem (事件系统合约)

**职责**：管理游戏内的随机事件与突发情况

**事件类型**：
- **暴风雪事件**：降低交通速度、增加电费、可能导致供应链中断
- **火灾险情**：随机发生在老旧建筑，需要消防员救援，可能导致资产受损
- **经济波动**：商品价格随机波动
- **奖励事件**：完成特定任务获得奖励

**关键方法**：
- `triggerEvent()` - 触发事件
- `handleBlizzard()` - 处理暴风雪
- `handleFire()` - 处理火灾
- `handlePriceFluctuation()` - 处理价格波动
- `awardReward()` - 发放奖励

---

### 11. GameStateManager (游戏状态管理合约)

**职责**：管理全局游戏状态与跨合约通信

**功能**：
- 玩家数据同步
- 全局状态管理
- 跨合约调用协调
- 数据一致性保证

**关键方法**：
- `updatePlayerState()` - 更新玩家状态
- `getGlobalState()` - 获取全局状态
- `syncData()` - 同步数据
- `callExternalContract()` - 调用外部合约

---

### 12. PriceOracle (价格预言机合约)

**职责**：提供链上商品价格数据

**功能**：
- 聚合多个数据源的价格
- 防止价格操纵
- 实时价格更新
- 价格历史记录

**关键方法**：
- `updatePrice()` - 更新价格
- `getPrice()` - 获取当前价格
- `getPriceHistory()` - 获取价格历史
- `calculateAveragePrice()` - 计算平均价格

---

## 第四部分：合约部署顺序与依赖关系

### 部署顺序（推荐）

```
第 1 层：基础代币
  1. ISCToken (ERC20)
     └─ 部署参数：初始供应量、名称、符号

第 2 层：资产 NFT
  2. RealEstateNFT (ERC721)
     └─ 依赖：ISCToken
  3. BusinessNFT (ERC721)
     └─ 依赖：ISCToken
  4. CommodityToken (ERC1155)
     └─ 依赖：ISCToken

第 3 层：核心经济系统
  5. ISCTradingCenter
     └─ 依赖：ISCToken、CommodityToken
  6. ISCMarketplace
     └─ 依赖：ISCToken、RealEstateNFT、BusinessNFT
  7. TreasuryDAO
     └─ 依赖：ISCToken
  8. TaxSystem
     └─ 依赖：ISCToken、RealEstateNFT、BusinessNFT

第 4 层：游戏机制
  9. JobSystem
     └─ 依赖：ISCToken、BusinessNFT
  10. SupplyChainManager
      └─ 依赖：CommodityToken、BusinessNFT
  11. EventSystem
      └─ 依赖：ISCToken、RealEstateNFT、BusinessNFT、CommodityToken

第 5 层：基础设施
  12. GameStateManager
      └─ 依赖：所有上述合约
  13. PriceOracle
      └─ 依赖：CommodityToken、ISCTradingCenter
```

---

## 第五部分：合约间交互流程示例

### 示例 1：玩家购买房产

```
玩家 → ISCMarketplace.buyNow(房产NFT)
  ↓
ISCMarketplace 检查玩家 ISC 余额
  ↓
ISCMarketplace 调用 ISCToken.transferFrom()
  ↓
ISCMarketplace 调用 RealEstateNFT.transferFrom()
  ↓
ISCMarketplace 计算 10% 佣金
  ↓
ISCMarketplace 调用 TreasuryDAO.depositFee()
  ↓
ISCMarketplace 发出 PurchaseCompleted 事件
  ↓
GameStateManager 同步玩家资产状态
```

### 示例 2：玩家经营企业并支付税费

```
玩家 → BusinessNFT.collectProfit()
  ↓
BusinessNFT 计算日收入 - 日成本
  ↓
BusinessNFT 调用 TaxSystem.calculateIncomeTax()
  ↓
TaxSystem 计算应缴税额（利润的 10%）
  ↓
TaxSystem 从玩家账户扣除税款
  ↓
TaxSystem 将税款转入 TreasuryDAO
  ↓
玩家收到净利润
```

### 示例 3：暴风雪事件触发

```
EventSystem 触发 BlizzardEvent
  ↓
EventSystem 调用 TaxSystem.increaseElectricityFee()
  ↓
EventSystem 调用 SupplyChainManager.delayShipment()
  ↓
EventSystem 调用 PriceOracle.fluctuatePrice()
  ↓
所有受影响的玩家收到事件通知
  ↓
GameStateManager 更新全局游戏状态
```

---

## 第六部分：安全与审计建议

### 安全考虑

1. **ReentrancyGuard**：所有涉及资金转移的函数都应使用 `nonReentrant` 修饰符
2. **Access Control**：使用 OpenZeppelin 的 `AccessControl` 进行角色权限管理
3. **Pausable**：在紧急情况下暂停合约功能
4. **Upgradeable Proxy**：使用代理模式便于合约升级

### 审计建议

1. **第三方审计**：在主网部署前进行专业安全审计
2. **测试网部署**：在 BSC 测试网进行充分测试
3. **Bug Bounty**：发布 Bug Bounty 计划吸引安全研究者
4. **监控与告警**：部署链上监控系统，及时发现异常

---

## 总结

《冰雪城市》的完整智能合约体系包含 **13 个核心合约**，涵盖代币、资产、交易、经济、游戏机制等多个层面。这些合约相互配合，构建了一个完整的链上游戏经济生态。

当前已设计的 **ISCTradingCenter** 合约是整个系统的核心经济枢纽，负责商品交易与 10% 国库税收。其他合约需要按照依赖关系逐步设计与部署，确保系统的完整性与安全性。
