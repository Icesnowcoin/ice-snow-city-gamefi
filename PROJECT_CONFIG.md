# 《冰雪城市》项目配置与关键信息

## 项目基本信息

**项目名称**：冰雪城市 (Ice Snow City)  
**项目类型**：现代化都市模拟经营游戏 + 链上经济系统  
**开发状态**：设计与开发中  
**最后更新**：2024-06-01

---

## 核心代币信息

### ISC 代币（游戏内通证）

| 项目 | 信息 |
| :--- | :--- |
| **合约地址** | `0x11229a3f976566FA8a3ba462C432122f3B8876f6` |
| **代币名称** | ISC (Ice Snow Coin) |
| **代币符号** | ISC |
| **区块链** | BSC (Binance Smart Chain) |
| **小数位数** | 18 |
| **状态** | ✅ 已在交易所上市 |
| **合约所有权** | ❌ 已放弃（Ownership Renounced） |
| **代理合约** | ❌ 已放弃（Proxy Renounced） |
| **控制权** | ❌ 完全放弃（No Admin Control） |
| **代币类型** | 普通 ERC-20 Meme 币 |
| **重要说明** | ISC 是完全去中心化的 ERC-20 代币，没有任何中央控制权。所有游戏合约只能作为外部调用者使用 ISC，无法修改 ISC 代币本身。
| **用途** | 游戏内通证、交易媒介、价值存储 |

**重要说明**：
- ✅ ISC 代币已在交易所上市，无需创建新的代币合约
- ✅ 所有游戏合约将直接集成此代币地址
- ✅ 代币支持充值到游戏账户和提现到链上钱包
- ⚠️ **ISC 是完全去中心化的 ERC-20 Meme 币**
- ⚠️ **合约所有权已放弃**（Ownership Renounced）
- ⚠️ **代理合约已放弃**（Proxy Renounced）
- ⚠️ **所有控制权已放弃**（No Admin Control）
- ⚠️ **游戏合约只能作为外部调用者，无法修改 ISC 代币本身**

---

## 国库地址

| 项目 | 信息 |
| :--- | :--- |
| **国库地址** | `待确认` |
| **用途** | 接收 10% 交易佣金、管理公共资金 |
| **管理方式** | DAO 治理 / 多签钱包 / 其他 |
| **提现权限** | 待定 |

**待确认项**：
- [ ] 国库地址是否已创建
- [ ] 国库是否使用多签钱包
- [ ] 国库管理权限如何设置
- [ ] 是否需要创建 TreasuryDAO 合约

---

## 区块链网络配置

| 网络 | 用途 | 状态 |
| :--- | :--- | :--- |
| **BSC 主网** | 生产环境 | 待部署 |
| **BSC 测试网** | 测试环境 | 待部署 |
| **其他链** | 跨链支持 | 待评估 |

**当前配置**：
- 主要运营链：BSC 主网
- 测试链：BSC 测试网 (Testnet)
- 代币所在链：BSC 主网

---

## 智能合约部署清单

### 已设计的合约

| 合约名称 | 文件名 | 状态 | 说明 |
| :--- | :--- | :--- | :--- |
| ISCTradingCenter | ISC_Treasury_SmartContract.sol | ✅ 已设计 | 商品交易 + 10% 国库税 |

### 待设计的合约

| 合约名称 | 优先级 | 说明 |
| :--- | :--- | :--- |
| RealEstateNFT | 🔴 高 | 房产、建筑、地皮 NFT |
| BusinessNFT | 🔴 高 | 企业、店铺 NFT |
| CommodityToken | 🔴 高 | 农产品、建材、工业品代币 |
| ISCMarketplace | 🟠 中 | NFT 市场交易 |
| TreasuryDAO | 🟠 中 | 国库管理 + DAO 治理 |
| TaxSystem | 🟠 中 | 电费、水费、房产税、所得税 |
| JobSystem | 🟠 中 | 劳务中心、求职、招聘 |
| SupplyChainManager | 🟠 中 | 生产、物流、库存管理 |
| EventSystem | 🟡 低 | 暴风雪、火灾、价格波动事件 |
| GameStateManager | 🟡 低 | 全局状态管理 |
| PriceOracle | 🟡 低 | 商品价格预言机 |

---

## 关键配置参数

### ISCTradingCenter 配置

```solidity
// 部署参数
ISC_TOKEN_ADDRESS = "0x11229a3f976566FA8a3ba462C432122f3B8876f6"
TREASURY_ADDRESS = "待确认"
TREASURY_FEE_PERCENT = 10  // 10% 国库佣金
```

### 游戏经济参数

| 参数 | 值 | 说明 |
| :--- | :--- | :--- |
| **交易佣金率** | 10% | 每笔交易扣除 10% ISC 至国库 |
| **房产税率** | 0.5% | 年房产税 |
| **企业所得税率** | 10% | 年企业利润税 |
| **电费基础价格** | 待定 | 每单位电力的价格 |
| **水费基础价格** | 待定 | 每单位水的价格 |
| **暴风雪电费增幅** | 待定 | 暴风雪期间电费增加百分比 |

---

## 项目文档清单

| 文档名称 | 文件名 | 完成度 |
| :--- | :--- | :--- |
| 美术DNA文档 | Art_DNA_Document.md | ✅ 100% |
| 概念艺术参考 | Concept_Art_References.md | ✅ 100% |
| 高保真设计规范 | ice_snow_city_hifi_design_specification.png | ✅ 100% |
| 游戏设计白皮书 | Game_Design_Document.md | ✅ 100% |
| 3D建模指南 | 3D_MODELING_GUIDE.md | ✅ 100% |
| ISC交易中心UI设计 | ISC_Trading_Center_UI_Design.md | ✅ 100% |
| 智能合约架构 | SmartContract_Architecture.md | ✅ 100% |
| 项目配置 | PROJECT_CONFIG.md | ✅ 100% |

---

## 后续开发计划

### Phase 1：核心合约设计与部署（优先级：🔴 高）

- [ ] RealEstateNFT 合约设计与部署
- [ ] BusinessNFT 合约设计与部署
- [ ] CommodityToken 合约设计与部署
- [ ] ISCTradingCenter 合约部署与测试
- [ ] 合约审计与安全验证

### Phase 2：经济系统合约（优先级：🟠 中）

- [ ] ISCMarketplace 合约设计与部署
- [ ] TreasuryDAO 合约设计与部署
- [ ] TaxSystem 合约设计与部署
- [ ] 经济模型验证与调整

### Phase 3：游戏机制合约（优先级：🟠 中）

- [ ] JobSystem 合约设计与部署
- [ ] SupplyChainManager 合约设计与部署
- [ ] EventSystem 合约设计与部署

### Phase 4：基础设施合约（优先级：🟡 低）

- [ ] GameStateManager 合约设计与部署
- [ ] PriceOracle 合约设计与部署
- [ ] 跨合约通信测试

### Phase 5：前端开发

- [ ] ISC交易中心前端实现
- [ ] 玩家资产管理界面
- [ ] 国库公示页面
- [ ] 游戏地图与建筑交互

### Phase 6：后端开发

- [ ] tRPC 接口实现
- [ ] 数据库设计与实现
- [ ] 用户认证与授权
- [ ] 游戏状态同步

### Phase 7：集成与测试

- [ ] 合约集成测试
- [ ] 前后端集成测试
- [ ] 性能测试与优化
- [ ] 安全审计

### Phase 8：上线与运营

- [ ] 测试网部署与验证
- [ ] 主网部署
- [ ] 运营与维护
- [ ] 社区管理

---

## 重要联系信息与资源

### 开发工具

- **Solidity 编译器**：^0.8.20
- **开发框架**：Hardhat / Truffle
- **测试框架**：Hardhat Test / Truffle Test
- **前端框架**：React 19 + Tailwind CSS 4
- **后端框架**：Express 4 + tRPC 11
- **3D 引擎**：Babylon.js

### 测试网络

- **BSC 测试网**：https://testnet.bscscan.com
- **Faucet**：https://testnet.binance.org/faucet

### 主网信息

- **BSC 主网 RPC**：https://bsc-dataseed.binance.org
- **区块浏览器**：https://bscscan.com

---

## 版本历史

| 版本 | 日期 | 更新内容 |
| :--- | :--- | :--- |
| v1.0 | 2024-06-01 | 初始配置，记录 ISC 代币地址 |

---

## 注意事项

1. **ISC 代币地址确认**：`0x11229a3f976566FA8a3ba462C432122f3B8876f6` 已永久记录
2. **国库地址待确认**：请提供国库地址以完成配置
3. **所有合约部署前必须在测试网验证**
4. **建议进行第三方安全审计**
5. **遵守相关法律法规和监管要求**

---

**文档维护者**：Manus AI  
**最后更新**：2024-06-01  
**下次更新**：待定
