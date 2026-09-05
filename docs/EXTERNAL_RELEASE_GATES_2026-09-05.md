# Ice Snow City 外部发布门禁责任矩阵

> 本文只记录真实外部证据的交付边界，不把程序化占位模型、软件性能基线或仓库清洁提交误认为真实资产、真机结果或账户凭据轮换已完成。

## 当前结论

仓库内的资产 manifest、GLB 加载器、资产交付门禁、雪层性能报告归一化工具、开发预览限流修复、TypeScript、生产构建和 2,124 项测试已经具备可复核证据。以下门禁仍依赖用户、美术团队、设备云或 GitHub 账户侧操作，因此继续保持 `pending`。

## 责任矩阵

| 门禁类别 | 当前状态 | 外部输入 | 可接受的验收输出 | 负责方 |
| --- | --- | --- | --- | --- |
| 玩家角色 GLB | pending-import | 玩家 GLB、SkinnedMesh、60–80 根骨骼、idle/walk/run/work/sleep/celebrate/sad/talk 动画、2K PBR 贴图 | 文件 SHA-256、MIME、网格/骨骼/动画报告、Babylon 加载截图与回归日志 | 美术交付方 + 开发验收 |
| NPC 角色 GLB | pending-import | 任务大厅 NPC 及核心职业 NPC GLB、骨骼、idle/walk/talk/work 动画、2K PBR 贴图 | 每个资产的 manifest ID、哈希、动画剪辑清单、LOD/碰撞报告 | 美术交付方 + 开发验收 |
| 核心地标 GLB | pending-import | 城市核心、ISC 银行总部、冰晶商业中心、霜线生产区 GLB、2K–4K PBR 贴图、LOD、碰撞体 | 四个 `landmark-*` ID 均有真实文件、材质/LOD/碰撞检查通过，运行时加载无错误 | 美术交付方 + 开发验收 |
| 道路与环境资产 | pending-import | 道路、路灯、植被、水渠、气象特效模型与贴图 | `environment-road` 与 `environment-vegetation` 资产证据、移动端实例化/Draw Call 记录 | 美术交付方 + 性能验收 |
| 纹理库与 PBR | pending-import | 角色 2K、建筑 2K–4K、Base Color/Normal/Metallic-Roughness/Occlusion 贴图、许可证信息 | 纹理尺寸/MIME/色彩空间检查、压缩格式记录、无缺图报告 | 美术交付方 |
| 资产优化与评审 | pending-import | LOD0/LOD1/LOD2、碰撞网格、命名规范、导出版本、授权说明 | `REAL_ASSET_DELIVERY_MANIFEST` 全部目标从 `pending-import` 转为 verified，并通过 `assetDeliveryGate` | 开发验收 + 美术评审 |
| iOS/Android 真机性能 | pending-device | 真机或设备云、浏览器版本、GPU/渲染器、屏幕方向、baseline/snow 两组采样 | JSON 中填写设备型号、渲染器、FPS、P95、掉帧率、内存和 draw calls；来源标签必须为 `ios-real` 或 `android-real` | QA/设备云负责人 |
| GitHub Token 轮换 | pending-account-action | GitHub 账户侧撤销曾进入 `SESSION_PROGRESS.md` 的旧 Token 并生成新凭据 | 旧 Token 已撤销的账户侧确认；仓库树和 PR 不得出现 Token、`.env` 或会话文件；不得在聊天中提交新 Token | 仓库所有者 |

## 资产验收顺序

美术交付后，先把原始文件放在项目外部的受控交付目录，生成 SHA-256 和 MIME 清单，再逐项填充 `docs/REAL_ASSET_DELIVERY_MANIFEST_2026-09-05.md`。随后使用现有 GLB 加载器的进度、取消、根节点和销毁契约进行运行时导入，最后运行 `assetDeliveryGate`、全量测试、生产构建和桌面/移动横屏预览。任何缺少 PBR、LOD、碰撞体、30 FPS 动画或授权记录的资产都不得标记为 verified。

## 真机验收规则

软件基线只能标记为 `ci-software` 或 `ci-gpu`，不能替代真实设备结果。真实设备报告必须保留原始采样 JSON、设备型号、操作系统、浏览器、GPU/渲染器、测试方向、雪层开关、采样时长和统计口径；不能用估算值填充 iOS/Android 字段。若设备云不可用，应保留空字段和 `pending-device`，而不是降低门槛。

## 账户安全规则

旧 Token 必须由账户所有者在 GitHub 设置中撤销/轮换，系统不会要求用户把新 Token 粘贴到聊天中。PR #14 的 sanitized 分支基于 GitHub main 的共同祖先创建，当前工作树不包含 `SESSION_PROGRESS.md`、环境文件或依赖目录；该仓库侧清理不能替代账户侧撤销旧凭据。

## 关联实现与证据

当前实现入口包括 `client/src/lib/assetManifest.ts`、`client/src/lib/assetDeliveryGate.ts`、`client/src/game/engine/BabylonGameEngine.ts`、`client/src/game/snowLayerPerfReport.ts` 和 `docs/REAL_ASSET_DELIVERY_MANIFEST_2026-09-05.md`。真实资产到达前，所有八项目标资产均应保持 `pending-import`，真实设备到达前，性能报告的设备字段应保持 `pending-device`。

## Canonical pending 索引与历史 TODO 去重规则

历史 TODO 中重复出现的玩家/NPC/建筑/环境模型、角色与建筑纹理、纹理库、真实 GLB 导入和 GitHub Token 轮换条目，不代表已交付。它们仅作为历史引用保留，实际状态由本表和以下 canonical 条目统一管理：真实资产由 `pending-import` manifest 与 `assetDeliveryGate` 管理；真实 GLB 骨骼、动画、LOD、碰撞和 PBR 运行时验收由资产导入门禁管理；真机性能由 `pending-device` 报告管理；账户侧 Token 撤销由 `pending-account-action` 管理。程序化 baseline GLB、`baselineGlbUrl`、`ci-software` 性能和 sanitized 仓库扫描只证明本地可运行与仓库侧清洁，不得提升任何 canonical 外部状态。

TODO 的历史重复项可以标记为“已归并引用”，但不能使用 `[x]` 表示原始真实交付已完成；只有规格、验证器、模拟门禁和文档本身完成时，才可单独标记对应本地任务完成。真实资产或账户证据缺失时，canonical pending 必须保持未完成。 

## 当前快照校正（最终本地质量门禁）

文档中的历史回归数字仅代表当时检查点；当前最新本地快照为 **199 个测试文件、2,150 项测试通过**，TypeScript 与生产构建通过。PR #14 sanitized 分支当前 head 为 `b2f93255c38f02535ddbe5ac51efe1b6108cad07`，仓库侧安全扫描通过；账户侧 Token 轮换仍为 `pending-account-action`。八项 procedural-baseline 仅用于开发预览，真实高保真资产仍为 `pending-import`，真机性能仍为 `pending-device`。

## Closure Coverage Gate（本地代码质量门禁）

除真实资产、真实设备和账户凭据门禁外，发布汇总现在纳入固定 closure coverage 证据。`pnpm test:coverage:closure` 产生 `coverage/closure/coverage-summary.json`，由 release-gate 汇总器记录报告路径以及行、语句、分支、函数四项百分比，并分别要求至少 50%、50%、50%、55%。任一指标低于阈值时，`gates.closureCoverage.status` 为 `rejected`，整体状态为 `blocked`；因此不得将 coverage 不达标的构建报告为 `local-ready-external-pending`。

当前基线为行 75.49%、语句 73.90%、分支 73.51%、函数 81.39%，满足本地 closure gate。该门禁只证明选定收口模块的自动化覆盖率，不替代真实 iOS/Android FPS、真实 GLB/PBR/动画资产验收、链上审计或 GitHub 账户侧 Token 撤销/轮换。
