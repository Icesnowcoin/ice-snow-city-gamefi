# Ice Snow City 本地模拟主网运行报告

**运行模式**：隔离 Hardhat 本地链，RPC 为 `http://127.0.0.1:8545`，chain ID 为 `31337`。本报告只记录本地模拟，不代表测试网或主网部署，也不构成第三方安全审计。

## 部署结果

本次使用离线 `solc-js 0.8.26` 编译目标合约，避免依赖远程编译器下载。部署顺序为 MockISC、MockLand、TaxSystem 和 `ISCSeaportStyleMarketplaceOffersDraft`。Hardhat 账户和随机 treasury/marketing 地址仅用于本地测试，链重启后地址会变化。

| 合约 | 本地地址 |
|---|---|
| MockISC | `0x68B1D87F95878fE05B998F19b66F4baba5De1aed` |
| MockLand | `0x3Aa5ebB10DC797CAC828524e59A333d0A371443c` |
| TaxSystem | `0xc6e7DF5E7b4f2A278906862b61205850344D4e7d` |
| Marketplace Draft | `0x59b670e9fA9D0A427751Af201D676719a970857b` |

## 交互验证

部署后向本地 seller 和 buyer 账户发放 MockISC，并完成市场授权。随后使用与 Draft 合约一致的 EIP-712 域：名称为 `Ice Snow City Seaport Style Marketplace`，版本为 `2`，chain ID 为 `31337`，验证合约为本地 Marketplace Draft。

| 场景 | 结果 |
|---|---|
| SELL 订单签名、成交与 ERC-721 转移 | 通过 |
| BUY_OFFER 签名、卖方接受与 ERC-721 转移 | 通过 |
| `cancelNonce` 写入与读取 | 通过 |
| TaxSystem 预览及 60% 国库 / 40% 营销分配 | 通过 |
| Marketplace `COMMISSION_BPS` | `1000`，即 10% |
| 前端适配层 EIP-712 签名恢复 | 通过 |
| 前端适配层余额读取 | 通过 |
| 前端适配层取消 nonce 读取 | 通过 |

关键交互回执包括 SELL `0x9153189d839ecf509144f72087660902b13e3871937e216b9b83683899aee258`、BUY_OFFER `0x29934ca33f3cdf6d4e6bb27b980ea610004a97c091d8d8c55b14e3fed8a2b585`。这些哈希只属于一次本地链运行，不能用于区块浏览器或真实网络证明。

## 前端适配与安全隔离

前端新增 `client/src/lib/iscMarketplaceDraft.ts`，统一管理 Draft 订单 ABI、EIP-712 类型、域构造、订单标准化、模拟链断言、签名、成交、接受报价、取消 nonce、授权和余额读取。适配层在 `simulatedOnly` 默认开启时拒绝非 `31337` chain ID；生产配置未写入模拟地址，模拟脚本固定使用回环 RPC。

新增单元测试覆盖域参数、非本地链拒绝和签名恢复，测试结果为 **3/3**。与持仓和审计准备相关的定向回归为 **11/11**，384MB 内存上限下生产构建通过。

## 调试记录

首次运行时，SELL 路径已通过，但 BUY_OFFER 测试夹具把报价 NFT 错误铸给了买方，合约正确返回 `OfferNotAcceptedByOwner`。修正夹具将资产铸给卖方，并将最终断言改为资产转移至报价买方后，SELL 与 BUY_OFFER 均通过。该修正属于测试场景修正，不是对合约安全性的背书。

## 审计边界

本地模拟证明的是：在当前 ABI、EIP-712 域、账户授权和订单结构下，指定路径能够在隔离链执行。它**不能证明**合约已经完成第三方审计、字节码验证、测试网部署、主网部署、经济模型压力测试或生产环境密钥管理。Draft 合约仍必须在真实部署前经过独立审计、编译参数锁定、字节码验证和部署审批。
