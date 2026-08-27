# 合约复用研究记录

## 已核验来源

### Seaport
官方仓库：https://github.com/ProjectOpenSea/seaport
README 的 Audits 段落明确记载：OpenSea 委托 Trail of Bits 对 Seaport 进行安全审查，审查时间为 2022-04-18 至 2022-05-12，并提供 Trail of Bits 完整报告链接：https://github.com/trailofbits/publications/blob/master/reviews/SeaportProtocol.pdf。

仓库定位是安全、高效买卖 NFT 的市场协议。可重点复用其订单/签名/资产转移设计思想，但不能直接把 Seaport 当作 Ice Snow City 的税收、NFT 铸造分账或业务权限合约；其许可、版本、部署地址、接口和费用模型必须逐项核对。

### Safe Smart Account
官方仓库：https://github.com/safe-fndn/safe-smart-account
当前仓库页面显示 Safe v1.3.0 Certora audit 相关提交，README/仓库历史中可见 Certora 审计线索。Safe 适合用作国库多签/智能账户基础设施，而不是 NFT 市场或 ISC 税费合约。

仓库页面还展示了部署和区块浏览器验证流程示例，说明源码、编译和部署版本必须保持一致。Safe 的可复用边界是多签执行、阈值签名和国库权限隔离；仍需独立核对目标网络部署地址、版本和审计范围。

## 初步结论

“官方仓库 + 公开审计报告”是必要条件，不是安全保证。后续必须交叉核验审计报告对应的 commit/tag、审计范围、已修复问题、目标网络部署字节码和升级/管理员权限。

## 追加核验

### Trail of Bits：Seaport
审计机构页面：https://trailofbits.com/library/seaport-protocol/
该页面将项目标记为 Blockchain / Ethereum-EVM 安全审查，客户为 OpenSea，日期为 2022-05，投入约 4 周。页面列出 11 项发现：2 项 Low、7 项 Informational、2 项 Undetermined，并提供公开报告链接。这说明 Seaport 的“经过审计”是有一手机构页面和报告支撑的，但审计结论并不等于零缺陷，也不代表后续版本自动继承审计结论。

### Certora：Safe v1.5.0
审计机构页面：https://www.certora.com/reports/safe-v1.5.0
Certora 页面明确写明 Safe Smart Account v1.5.0 的报告日期为 2025-06-16，审计/形式化验证执行时间为 2024-12-10 至 2025-01-14，范围覆盖 40 多个合约，包括核心逻辑、fallback、扩展和 proxy，并提供最终验证报告 PDF。该证据适合支持 Safe 作为国库多签/智能账户候选，但不能外推到 Safe 其他版本或 Ice Snow City 自定义合约。

## 重要核验原则

审计必须绑定到具体 commit/tag、编译器和部署字节码。即使官方仓库和大型机构报告都存在，也必须确认待复用代码没有超出审计范围、已修复报告中的问题，并重新评估自定义参数、权限、升级代理和目标链部署差异。

### Uniswap v4 Core
官方仓库：https://github.com/Uniswap/v4-core
仓库页面显示其 `docs` 目录包含 ABDK、Spearbit、Certora、OpenZeppelin 和 Trail of Bits 审计材料，并明确说明项目曾处于公开构建的早期阶段。该项目是 AMM 核心流动性协议，不是 NFT 市场或游戏税收模块，因此只能借鉴测试、权限和数学安全工程，不能直接作为 Ice Snow City 的业务合约。

### OpenZeppelin：Uniswap v4 Core Audit
机构页面：https://www.openzeppelin.com/news/uniswap-v4-core-audit
OpenZeppelin 页面将审计绑定到 `Uniswap/v4-core` commit `d5d4957`，时间线为 2024-05-27 至 2024-06-21，共 24 项问题，其中 1 项 Critical、3 项 Medium 等；页面内容还说明部分问题已通过具体 pull request 修复。该案例证明即便大型机构审计，仍可能发现严重问题，且必须跟踪修复 commit 后再使用。

## 研究阶段性判断

当前最适合 Ice Snow City 的成熟组件候选是：Safe Smart Account 用于国库多签权限隔离，Seaport 用于研究 NFT 订单/签名/资产转移模型。Uniswap v4 更适合作为安全工程和 fuzz/formal verification 参考，不适合直接用于 NFT 市场。任何候选都不能直接继承 ISC 的铸造分账或社交消费 60/40 规则。
