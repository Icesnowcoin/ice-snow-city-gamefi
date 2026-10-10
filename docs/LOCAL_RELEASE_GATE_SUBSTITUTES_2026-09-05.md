# 本地发布门禁替代流程

在没有真实 GLB/PBR/动画文件、iOS/Android 设备和 GitHub 账户操作输入时，项目使用三类本地替代门禁推进工程工作，但不把替代结果当成外部验收证据。

## 真实资产交付包验证器

`client/src/lib/assetPackageValidator.ts` 以八项 `CORE_ASSET_MANIFEST` 为基准。缺少文件时返回 `pending-import`；存在交付元数据时校验 GLB 文件路径、MIME、SHA-256、PBR 贴图、LOD、碰撞体、动画帧率和动画片段。只有 manifest 已同步为 `verified` 且所有运行时证据满足要求时，结果才可能为 `accepted`。本地测试中的 verified 条目是合成逻辑夹具，不代表真实艺术资产已交付。

## 模拟设备性能报告

`client/src/game/snowLayerPerfSimulation.ts` 提供 low、medium、high 三个软件档位。生成的报告固定使用 `source=ci-software`、`status=software-baseline` 和 `realDeviceEvidenceRequired=true`，模型名使用 `simulated-*`。它只包装 harness 提供的样本，不生成或推断真实 iOS/Android FPS、GPU、热降频或显存数据。

## GitHub 安全证据检查

`scripts/githubSafetyEvidence.mjs` 扫描受控路径和传入文件内容中的敏感模式，检查 `SESSION_PROGRESS.md`、`.env`、`node_modules`、GitHub Token 和私钥模式。检查结果只证明当前扫描输入的仓库侧安全状态；除非显式传入外部确认，否则 `accountRotationStatus` 保持 `pending-account-action`，不会宣称账户侧旧 Token 已撤销。

## 验收边界

这三类门禁可以在本地持续运行、进入 CI 并阻止不完整证据误标为 ready，但不能替代真实美术文件验收、目标设备性能采样或 GitHub 账户安全操作。真实输入到位后，应将验证器输出与对应的外部证据一并归档。

## GLB 二进制结构校验补充

资产验证器现在在 MIME、哈希和运行时证据之外检查 GLB 二进制头：magic 必须为 `glTF`，版本必须为 2，声明长度必须等于实际字节长度。损坏文件、非 GLB 文件和长度不一致文件都会进入 rejected；缺少文件仍进入 pending-import。该检查只验证文件结构，不等价于真实艺术质量、PBR 视觉质量或设备加载验收。

## 最新回归状态

加入 GLB 二进制头校验后，资产验证器、模拟设备报告和 GitHub 安全证据门禁仍保持通过；全量回归为 198 个测试文件、2,146 项测试，TypeScript 检查和生产构建通过。

## 统一 release-gate 汇总

`client/src/lib/releaseGateSummary.ts` 将资产导入、ci-software 性能、仓库安全、真实设备性能和账户轮换汇总为统一 JSON。没有真实资产时保持 `pending-import`，没有真机报告时保持 `pending-device`，没有账户侧确认时保持 `pending-account-action`；本地替代结果固定声明 `localSubstitutesDoNotProveExternalEvidence=true`。资产、模拟性能、安全证据和汇总器共 11 项替代测试通过。

## 最新全量回归与隔离修复

release-gate 汇总器加入后，shareStatistics E2E 暴露的随机 userId 碰撞已改为进程/时间/计数器隔离夹具。最新全量回归为 **199 个测试文件、2,148 项测试通过**，TypeScript 和生产构建通过。

## GitHub 安全证据 CLI

安全扫描器现在默认读取当前仓库 `git ls-files` 和不超过 2 MiB 的可读文本文件，输出可归档 JSON。当前工作树扫描结果为 `workingTreeSafe=true`、无敏感路径、无敏感内容；`accountRotationStatus` 仍为 `pending-account-action`，因为仓库扫描不能证明账户侧历史 Token 已撤销。

## Blockchain failover 测试隔离

`BlockchainService` 现在支持注入 `BlockchainProviderFactory`。failover 错误路径测试使用即时失败 provider，不再依赖公网 RPC 重试；最新定向 failover/安全测试 10 项通过，最终全量回归为 **199 个测试文件、2,149 项测试通过**，TypeScript 和生产构建通过。

## 归档 Release Gate

当前可归档状态文件已生成并上传至 `/manus-storage/release-gate_9e62a5f4.json`。摘要为 `local-ready-external-pending`：8 个 procedural-baseline GLB 的结构有效但资产状态仍为 `pending-import`；软件性能状态为 `ready` 且来源为 `ci-software`；仓库安全为 `ready`；真实设备性能为 `pending-device`；账户 Token 轮换为 `pending-account-action`。该文件明确本地替代结果不证明外部验收。

## 当前最终快照校正

前文的 2,146、2,148 和 2,149 项分别对应历史检查点；当前最终本地快照为 **199 个测试文件、2,150 项测试通过**，TypeScript 与生产构建通过。PR #14 sanitized head 为 `b2f93255c38f02535ddbe5ac51efe1b6108cad07`，仓库安全扫描通过。当前 release-gate 仍为 `local-ready-external-pending`：procedural-baseline 可开发预览但真实资产为 `pending-import`，真实设备为 `pending-device`，账户 Token 轮换为 `pending-account-action`。
