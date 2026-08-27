# NFT 与 ISC 代币集成逻辑设计

## 概述

《冰雪城市》中的所有 NFT（房产、企业、地皮）都需要与 ISC 代币紧密集成，形成一个统一的经济系统。本文档详细阐述了 NFT 与 ISC 的集成逻辑、交互流程和技术实现方案。

---

## 第一部分：NFT 与 ISC 的集成原则

### 1. 统一的价值体系

**原则**：所有 NFT 资产的价值都用 ISC 代币来衡量和交易

**实现方式**：
- NFT 购买价格 → ISC 支付
- NFT 租金收益 → ISC 收取
- NFT 交易佣金 → ISC 扣除
- NFT 抵押贷款 → ISC 借入

**示例**：
```
玩家购买房产 NFT：
  房产价格 = 100,000 ISC
  玩家账户 - 100,000 ISC
  房产所有者账户 + 90,000 ISC（扣除 10% 佣金）
  国库账户 + 10,000 ISC（10% 佣金）
```

---

### 2. NFT 收益与 ISC 支付

**原则**：NFT 的所有收益都以 ISC 形式自动支付给所有者

**收益类型**：
- **房产租金**：租户每月支付 ISC 租金 → 房产所有者
- **企业利润**：企业日收入 - 日成本 → 企业所有者（ISC）
- **农场产出**：蔬菜大棚产出 → 物流中心 → 摊贩 → ISC 收入

**自动支付机制**：
```solidity
// 每日自动计算并支付收益
function collectDailyRevenue(uint256 nftId) external {
    uint256 revenue = calculateRevenue(nftId);
    ISCToken.transfer(owner, revenue);
    emit RevenueCollected(nftId, owner, revenue);
}
```

---

### 3. NFT 交易与 ISC 流转

**原则**：所有 NFT 交易都通过 ISC 进行，并自动扣除 10% 国库佣金

**交易流程**：
```
买方 → ISCTradingCenter.buyNow(NFT_ID, price)
  ↓
检查买方 ISC 余额 ≥ price
  ↓
ISCToken.transferFrom(买方, 卖方, price * 0.9)
ISCToken.transferFrom(买方, 国库, price * 0.1)
  ↓
NFT.transferFrom(卖方, 买方, NFT_ID)
  ↓
事件触发：NFTTransferred(NFT_ID, 卖方, 买方, price)
```

---

## 第二部分：NFT 类型与 ISC 集成

### 1. RealEstateNFT（房产 NFT）

#### 购买流程
```
玩家选择房产 → 查看价格（ISC）
  ↓
玩家确认购买 → 支付 ISC
  ↓
ISCTradingCenter 扣除 10% 佣金
  ↓
房产 NFT 转移给玩家
  ↓
玩家成为房产所有者
```

#### 收益流程
```
房产被租赁 → 租户每月支付租金（ISC）
  ↓
ISCToken 自动转账至房产所有者
  ↓
房产所有者可随时查看累积收益
  ↓
房产所有者可选择提现至链上钱包
```

#### 税收流程
```
房产所有者每年需要支付房产税（房产价值的 0.5%）
  ↓
TaxSystem 自动计算税额
  ↓
ISCToken 自动从房产所有者账户扣除
  ↓
税款转入国库（ISC）
```

#### 抵押贷款流程
```
房产所有者需要资金 → 抵押房产
  ↓
LoanSystem 评估房产价值（ISC）
  ↓
玩家获得 ISC 贷款（最多房产价值的 70%）
  ↓
房产被冻结（不能交易）
  ↓
玩家每月支付利息（ISC）
  ↓
玩家还清贷款 → 房产解冻
```

---

### 2. BusinessNFT（企业 NFT）

#### 购买流程
```
玩家选择企业 → 查看价格（ISC）
  ↓
玩家支付 ISC → 企业 NFT 转移
  ↓
玩家成为企业所有者
  ↓
企业开始自动生成收入（ISC）
```

#### 运营流程
```
企业每日自动计算收入：
  日收入 = 基础收入 × 企业等级 × 员工效率
  ↓
企业每日自动计算成本：
  日成本 = 员工工资 + 电费 + 水费 + 原材料成本
  ↓
企业净利润 = 日收入 - 日成本
  ↓
企业所有者可随时 collectProfit()
  ↓
ISCToken 转账至企业所有者
```

#### 员工薪资流程
```
企业所有者雇佣员工 → 设置月薪（ISC）
  ↓
每月自动从企业账户扣除薪资（ISC）
  ↓
ISCToken 转账至员工账户
  ↓
员工可随时查看累积薪资
  ↓
员工可选择提现至链上钱包
```

#### 企业升级流程
```
企业所有者支付升级费用（ISC）
  ↓
企业等级 +1
  ↓
日收入增加（每级增加 20%）
  ↓
升级费用转入国库
```

---

### 3. CommodityToken（商品代币）

#### 商品交易流程
```
农场生产蔬菜 → CommodityToken 铸造
  ↓
蔬菜运输至物流中心 → 库存增加
  ↓
摊贩从物流中心采购 → 支付 ISC
  ↓
ISCToken 转账至农场所有者
  ↓
蔬菜库存减少，摊贩库存增加
  ↓
摊贩出售蔬菜给玩家 → 收取 ISC
  ↓
玩家获得蔬菜 Token
```

#### 商品消耗流程
```
玩家建造房屋 → 需要建材
  ↓
系统计算所需建材（ISC 价值）
  ↓
玩家支付 ISC 或提供建材 Token
  ↓
建材 Token 被销毁
  ↓
房屋建造完成 → 生成房产 NFT
```

---

## 第三部分：技术实现方案

### 1. ISC 代币集成接口

所有 NFT 合约都需要实现以下接口来与 ISC 代币交互：

```solidity
// IERC20 接口（ISC 代币）
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

// NFT 与 ISC 集成接口
interface INFTISCIntegration {
    // 价格查询（以 ISC 计价）
    function getPriceInISC(uint256 nftId) external view returns (uint256);
    
    // 收益计算（以 ISC 计价）
    function calculateRevenueInISC(uint256 nftId) external view returns (uint256);
    
    // 收益支付（以 ISC 支付）
    function payRevenueInISC(uint256 nftId, address recipient, uint256 amount) external;
    
    // 税费计算（以 ISC 计价）
    function calculateTaxInISC(uint256 nftId) external view returns (uint256);
    
    // 税费支付（以 ISC 支付）
    function payTaxInISC(uint256 nftId, address taxpayer, uint256 amount) external;
}
```

### 2. NFT 购买流程（完整代码示例）

```solidity
// RealEstateNFT 合约中的购买函数
function buyRealEstate(uint256 nftId, uint256 priceInISC) external {
    require(exists(nftId), "NFT does not exist");
    require(priceInISC > 0, "Price must be greater than 0");
    
    address seller = ownerOf(nftId);
    address buyer = msg.sender;
    
    // 1. 检查买方 ISC 余额
    require(
        iscToken.balanceOf(buyer) >= priceInISC,
        "Insufficient ISC balance"
    );
    
    // 2. 计算佣金
    uint256 commission = (priceInISC * 10) / 100;  // 10% 佣金
    uint256 sellerAmount = priceInISC - commission;
    
    // 3. 转账 ISC
    require(
        iscToken.transferFrom(buyer, seller, sellerAmount),
        "Transfer to seller failed"
    );
    require(
        iscToken.transferFrom(buyer, treasury, commission),
        "Transfer to treasury failed"
    );
    
    // 4. 转移 NFT
    _transfer(seller, buyer, nftId);
    
    // 5. 发出事件
    emit RealEstateSold(nftId, seller, buyer, priceInISC);
}
```

### 3. 收益支付流程（完整代码示例）

```solidity
// BusinessNFT 合约中的收益支付函数
function collectProfitInISC(uint256 businessId) external {
    require(exists(businessId), "Business does not exist");
    
    address owner = ownerOf(businessId);
    require(msg.sender == owner, "Only owner can collect profit");
    
    // 1. 计算日收入
    uint256 dailyRevenue = calculateDailyRevenueInISC(businessId);
    
    // 2. 计算日成本
    uint256 dailyCost = calculateDailyCostInISC(businessId);
    
    // 3. 计算净利润
    uint256 profit = dailyRevenue > dailyCost ? dailyRevenue - dailyCost : 0;
    
    require(profit > 0, "No profit to collect");
    
    // 4. 从企业账户转账 ISC 给所有者
    require(
        iscToken.transfer(owner, profit),
        "Transfer failed"
    );
    
    // 5. 重置收益计数
    lastProfitCollection[businessId] = block.timestamp;
    
    // 6. 发出事件
    emit ProfitCollected(businessId, owner, profit);
}
```

### 4. 税费支付流程（完整代码示例）

```solidity
// TaxSystem 合约中的税费扣除函数
function deductPropertyTaxInISC(uint256 nftId) external {
    require(realEstateNFT.exists(nftId), "Property does not exist");
    
    address owner = realEstateNFT.ownerOf(nftId);
    
    // 1. 获取房产价值
    uint256 propertyValue = realEstateNFT.getPriceInISC(nftId);
    
    // 2. 计算年税（0.5%）
    uint256 annualTax = (propertyValue * 5) / 1000;
    
    // 3. 计算月税
    uint256 monthlyTax = annualTax / 12;
    
    // 4. 检查所有者 ISC 余额
    require(
        iscToken.balanceOf(owner) >= monthlyTax,
        "Insufficient ISC for tax payment"
    );
    
    // 5. 扣除税款
    require(
        iscToken.transferFrom(owner, treasury, monthlyTax),
        "Tax payment failed"
    );
    
    // 6. 发出事件
    emit PropertyTaxDeducted(nftId, owner, monthlyTax);
}
```

---

## 第四部分：ISC 账户管理

### 1. 游戏内账户 vs 链上钱包

```
玩家的 ISC 资产有两个位置：

1. 游戏内账户（GameAccount）
   - 用于游戏内交易、购买、支付
   - 存储在 GameStateManager 合约中
   - 快速、便宜、即时结算
   - 示例：购买房产、支付员工工资

2. 链上钱包（On-Chain Wallet）
   - 玩家的真实钱包地址
   - ISC 代币真实存储位置
   - 可提现至交易所
   - 示例：提现收益、充值游戏账户
```

### 2. 充值流程（链上钱包 → 游戏内账户）

```solidity
function depositISCToGameAccount(uint256 amount) external {
    require(amount > 0, "Amount must be greater than 0");
    
    // 1. 从玩家钱包转账 ISC 到游戏合约
    require(
        iscToken.transferFrom(msg.sender, address(this), amount),
        "Transfer failed"
    );
    
    // 2. 增加玩家游戏内账户余额
    gameAccounts[msg.sender].balance += amount;
    
    // 3. 发出事件
    emit DepositedToGameAccount(msg.sender, amount);
}
```

### 3. 提现流程（游戏内账户 → 链上钱包）

```solidity
function withdrawISCFromGameAccount(uint256 amount) external {
    require(amount > 0, "Amount must be greater than 0");
    require(gameAccounts[msg.sender].balance >= amount, "Insufficient balance");
    
    // 1. 减少玩家游戏内账户余额
    gameAccounts[msg.sender].balance -= amount;
    
    // 2. 从游戏合约转账 ISC 到玩家钱包
    require(
        iscToken.transfer(msg.sender, amount),
        "Transfer failed"
    );
    
    // 3. 发出事件
    emit WithdrawnFromGameAccount(msg.sender, amount);
}
```

---

## 第五部分：ISC 流动性管理

### 1. ISC 流动性来源

| 来源 | 描述 | ISC 流向 |
| :--- | :--- | :--- |
| **玩家充值** | 玩家从交易所购买 ISC 并充值到游戏 | 玩家游戏账户 |
| **企业收入** | 企业经营产生的利润 | 企业所有者 |
| **房产租金** | 房产被租赁产生的租金 | 房产所有者 |
| **工作收入** | 玩家通过工作赚取的薪资 | 员工账户 |
| **商品交易** | 玩家交易商品产生的收入 | 卖方账户 |

### 2. ISC 流动性去向

| 去向 | 描述 | ISC 来源 |
| :--- | :--- | :--- |
| **购买 NFT** | 玩家购买房产、企业等 NFT | 玩家账户 |
| **支付税费** | 玩家支付房产税、企业税等 | 玩家账户 → 国库 |
| **支付员工工资** | 企业所有者支付员工薪资 | 企业账户 → 员工账户 |
| **购买商品** | 玩家购买游戏内商品 | 玩家账户 → 卖方账户 |
| **交易佣金** | ISC 交易中心的 10% 佣金 | 玩家账户 → 国库 |
| **提现** | 玩家提现至链上钱包 | 玩家游戏账户 → 链上钱包 |

### 3. ISC 经济平衡

```
ISC 总供应量 = 固定值（已在交易所上市）

游戏内 ISC 流动：
  充值 ISC（玩家购买）
    ↓
  游戏内消费（购买、税费、交易）
    ↓
  国库积累（10% 佣金）
    ↓
  提现 ISC（玩家获利）

平衡机制：
  - 国库积累的 ISC 可用于游戏内投资（如基础设施建设）
  - 可通过 DAO 治理决定国库资金用途
  - 防止通货膨胀（ISC 总供应量固定）
```

---

## 第六部分：安全考虑

### 1. 重入攻击防护

所有涉及 ISC 转账的函数都需要使用 `ReentrancyGuard`：

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RealEstateNFT is ERC721, ReentrancyGuard {
    function buyRealEstate(uint256 nftId, uint256 priceInISC) 
        external 
        nonReentrant  // 防止重入攻击
    {
        // ... 购买逻辑
    }
}
```

### 2. 溢出/下溢防护

使用 Solidity ^0.8.0（自动检查）或 SafeMath 库：

```solidity
// Solidity ^0.8.0 自动检查
uint256 profit = dailyRevenue - dailyCost;  // 自动检查下溢

// 或使用 SafeMath
uint256 profit = dailyRevenue.sub(dailyCost);
```

### 3. 访问控制

使用 OpenZeppelin 的 AccessControl：

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RealEstateNFT is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    function mintRealEstate(address to, uint256 nftId) 
        external 
        onlyRole(MINTER_ROLE)
    {
        // ... 铸造逻辑
    }
}
```

### 4. ISC 代币验证

确保合约使用的是正确的 ISC 代币地址：

```solidity
constructor(address _iscTokenAddress) {
    require(_iscTokenAddress != address(0), "Invalid token address");
    require(
        IERC20(_iscTokenAddress).totalSupply() > 0,
        "Token not valid"
    );
    iscToken = IERC20(_iscTokenAddress);
}
```

---

## 总结

所有 NFT 都能完全符合 ISC 的逻辑，通过以下方式实现：

1. ✅ **统一的价值体系**：所有 NFT 资产用 ISC 计价和交易
2. ✅ **自动收益支付**：NFT 收益自动以 ISC 形式支付
3. ✅ **自动税费扣除**：税费自动从 ISC 账户扣除
4. ✅ **完整的交易流程**：NFT 买卖通过 ISC 完成
5. ✅ **账户管理**：游戏内账户与链上钱包无缝对接
6. ✅ **安全防护**：完整的安全机制防止攻击

**所有 NFT 合约都将遵循这套集成逻辑进行设计和实现。**
