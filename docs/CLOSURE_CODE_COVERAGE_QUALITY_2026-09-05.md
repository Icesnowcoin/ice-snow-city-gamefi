# Ice Snow City 收口代码覆盖率与质量分析

**分析日期：** 2026-09-05  
**分析范围：** 资产 Manifest/交付门禁、AssetReadinessPage、GLB/Babylon 加载框架、雪层性能报告、限流修复和 GameScene 回归模块。

## 结论摘要

当前收口代码的测试质量呈现明显分层。资产交付门禁、资产清单、雪层性能报告和 GameScene 的核心纯逻辑覆盖较好；AssetReadinessPage 的默认渲染路径已覆盖，但分支和交互状态仍不充分；BabylonGameEngine、snowLayerPerfHarness 和 rateLimiter 的覆盖率偏低，不能仅凭当前数字宣称这些模块已经完成全面自动化验证。

本次覆盖率运行包含 9 个测试文件、60 项测试，使用 V8 provider，覆盖 8 个收口源文件。新增 harness 生命周期测试和 Express middleware 请求级测试后，结果为：语句覆盖率 **56.90%**、分支覆盖率 **63.08%**、函数覆盖率 **65.97%**、行覆盖率 **58.56%**。这个总数是“选定收口模块集合”的覆盖率，不是整个项目的全局覆盖率，也不是 2,124 项全量测试的覆盖率。

## 1. 收口模块覆盖率

| 模块 | 行覆盖率 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 评价 |
|---|---:|---:|---:|---:|---|
| `assetDeliveryGate.ts` | 100.00% | 85.71% | 74.28% | 100.00% | 核心验收路径较强；仍有少量分支未覆盖 |
| `assetManifest.ts` | 90.90% | 80.00% | 77.14% | 83.33% | 八项资产 ID 与规格主要路径已覆盖 |
| `AssetReadinessPage.tsx` | 100.00% | 100.00% | 50.00% | 100.00% | 默认 pending 页面已覆盖；可运行/异常状态分支不足 |
| `snowLayerPerfReport.ts` | 100.00% | 100.00% | 92.10% | 100.00% | 报告归一化和真机待测字段保护较强 |
| `gameScenes.ts` | 91.74% | 91.81% | 80.39% | 94.11% | 资源奖励、场景状态和主要动作路径较强 |
| `BabylonGameEngine.ts` | 16.10% | 15.44% | 19.29% | 16.66% | 当前测试主要覆盖 GLB loader 契约，不足以覆盖完整场景生命周期 |
| `rateLimiter.ts` | 46.37% | 45.71% | 58.06% | 63.15% | 已覆盖 Express middleware、动态额度、OAuth 例外和 production headers；Redis 错误/清理分支仍待补测 |
| `snowLayerPerfHarness.ts` | 53.03% | 54.79% | 58.33% | 75.00% | 已覆盖选项归一化、帧统计、稳定帧等待、进度、P95、掉帧比例和 render loop 清理；真实 WebGL benchmark 仍需浏览器/真机 |
| **合计** | **58.56%** | **56.90%** | **63.08%** | **65.97%** | 9 个定向测试文件、60 项测试；不代表全项目覆盖率 |

## 2. 已完成的质量门禁

最新全量回归为 **193 个测试文件、2,132 项测试全部通过**。资产 manifest 扩展后暴露的 4 项陈旧断言已经修复：资产交付测试已对齐八项目标资产，GameScene mining 断言已对齐当前 `gold/energy/isc` 配置。定向收口测试为 60 项，覆盖资产、页面、GLB、雪层报告、harness、限流 middleware 和 GameScene。

`pnpm check` 的 TypeScript 检查通过，`pnpm build` 的前端 Vite 构建和后端 esbuild 构建通过，开发预览此前已完成桌面与 16:9 移动横屏核验。开发环境的 429 白屏问题已通过 development-only 限流豁免修复，production 仍保留限流逻辑。GitHub 最新同步入口为 PR #14 的 sanitized 分支，远程树已验证不包含 `SESSION_PROGRESS.md`、`.env` 或 `node_modules`。

## 3. 质量风险与解释

### 3.1 中风险：雪层性能 harness 的真实 WebGL 路径仍需外部验证

`snowLayerPerfHarness.ts` 当前行覆盖率为 53.03%、函数覆盖率为 75.00%。新增测试覆盖了选项归一化、帧统计、稳定帧等待、进度回调、P95、掉帧比例和 render loop 清理；但没有在真实浏览器中创建 WebGL Engine，也没有执行完整 baseline/snow 双组 benchmark。软件基线与真实设备字段仍需继续严格分开。

### 3.2 中风险：限流器 Redis 与耗尽路径仍未覆盖

`rateLimiter.ts` 当前行覆盖率为 46.37%、分支覆盖率为 58.06%。新增请求级测试已覆盖 development 豁免、production 标准 headers、API 敏感路径动态额度、OAuth callback 例外和用户限流路径；Redis 连接失败、Redis Store、窗口耗尽响应和 closeRedisClient 仍未覆盖。

### 3.3 中高风险：BabylonGameEngine 只覆盖 GLB loader 契约

引擎文件的行覆盖率为 16.10%。现有 NullEngine 测试验证了进度回调、100% 完成、根节点选择、AbortSignal 和销毁，但没有覆盖完整场景初始化、相机/光源生命周期、材质创建、场景 dispose、加载失败恢复和低硬件质量档位。真实浏览器截图只能证明某条运行时路径可见，不能替代全部引擎分支测试。

### 3.4 中风险：AssetReadinessPage 只有默认状态

页面行覆盖率为 100%，但分支覆盖率为 50%。测试覆盖了八项资产全部 pending 的当前真实状态和新增三类外部门禁卡片，没有覆盖资产全部 verified、部分 rejected、加载异常、移动端滚动布局和用户导航后的返回路径。由于真实文件尚未交付，verified 分支暂时只能用合成 evidence 做纯逻辑测试，不能宣称真实资产验收完成。

### 3.5 工具链与构建信号

项目目前已经加入 `@vitest/coverage-v8@4.1.10` 以生成本次覆盖率。运行期间仍有 pnpm override 警告、部分 peer dependency 警告，以及 jsdom 的 `HTMLCanvasElement.getContext()` 未实现提示；这些没有导致当前测试失败，但应在 CI 中记录为可见的工具链维护项。生产构建还提示存在超过 500 KB 的 chunk，入口 bundle 约 7.96 MB；这不是功能回归，但对移动端首屏和内存预算构成性能风险。

## 4. 建议优先级

| 优先级 | 建议 | 目标 |
|---|---|---|
| P0 | 在真实浏览器/设备中执行 `snowLayerPerfHarness.ts` baseline/snow 双组采样 | 将当前软件单元测试与真实 WebGL 性能证据连接起来 |
| P1 | 为 `rateLimiter.ts` 增加 Redis 失败、窗口耗尽和 closeRedisClient 测试 | 完成基础设施异常路径覆盖 |
| P1 | 为 BabylonGameEngine 增加场景初始化、dispose、加载失败和质量档位测试 | 防止 GLB loader 通过但场景生命周期回归 |
| P1 | 为 AssetReadinessPage 增加 rejected/verified 合成状态测试 | 覆盖当前 50% 分支缺口 |
| P1 | 在 package scripts 增加固定 coverage 命令和最低阈值 | 防止覆盖率随迭代静默下降 |
| P2 | 拆分 Babylon/Three.js 大 bundle 并进行移动端真实设备测量 | 解决构建中的大 chunk 警告 |
| 外部 | 交付真实 GLB/PBR/动画、真机性能报告并轮换旧 GitHub Token | 完成当前无法由沙箱伪造的发布门禁 |

## 最终质量判断

以当前证据判断，收口代码可评为 **“核心纯逻辑较稳、基础设施异常路径仍有缺口、外部发布门禁未完成”**。新增测试后选定模块行覆盖率提升到 58.56%，harness 和 rateLimiter 的可控逻辑已有可复现覆盖；但 Babylon 完整场景生命周期、真实 WebGL benchmark、Redis 异常路径和真实资产/真机/Token 证据仍不足，因此仍不适合称为“全面覆盖”或“真机上线就绪”。真实资产、真机性能和账户侧 Token 轮换必须在获得外部证据后重新执行对应验收。

## 5. 运行时预览核验

在开发服务器重启后，`/asset-readiness` 页面已通过桌面 1280×720 与 16:9 移动横屏 812×375 截图核验。桌面视图能够完整显示资产总览、八项待导入资产和外部发布门禁区域；移动横屏视图能够显示页面标题、返回入口和核心资产门禁卡片，侧边导航保持可用。该结果证明门禁摘要的默认 pending 视觉路径可运行，但不替代真实 GLB 导入、设备云采样或账户 Token 轮换。

## 6. 覆盖率口径限制

本报告的 V8 覆盖率是针对选定收口源文件与其定向测试的白盒覆盖率。全量 2,132 项测试通过是回归稳定性指标，两者不能相加，也不能将测试通过率直接当作代码覆盖率。由于完整 Babylon 场景生命周期、真实 WebGL benchmark、Redis 异常路径和外部发布证据尚未完成，当前更适合使用“核心逻辑已验证、部分基础设施路径待补”的质量结论，而不是全面覆盖或上线就绪结论。

## 雪层优化后选择性覆盖率复核

优化后针对雪层、WeatherSystem、harness、报告和限流器运行 7 个测试文件、23 项测试，V8 选择性报告结果为：语句 34.50%、分支 49.46%、函数 50.00%、行 33.94%。该数字包含被导入但未逐行驱动的 `WeatherSystem.ts`，因此不能与前文收口模块聚合覆盖率直接比较。

关键文件结果为：`IceSnowSnowLayerMaterialPlugin.ts` 行 83.78%、函数 76.92%；`snowLayerPerfHarness.ts` 行 53.03%、函数 75.00%；`snowLayerPerfReport.ts` 行 100%、函数 100%；`rateLimiter.ts` 行 46.37%、函数 63.15%。`WeatherSystem.ts` 当前为行 4.69%，原因是本轮测试覆盖了预算与资源回收纯函数，而没有启动真实 Babylon 粒子系统；这是真实的剩余缺口，不应使用 fake particle 数值替代。

完整项目质量门禁仍以全量 193 个测试文件、2,135 项测试、TypeScript 和生产构建为准；选择性 V8 报告用于定位雪层性能优化的高风险路径。

## 本地替代门禁最新回归

在 GLB magic/version/声明长度校验和三类本地替代门禁测试加入后，最新全量回归为 **198 个测试文件、2,146 项测试通过**；TypeScript 检查和生产构建通过。该更新不改变真实资产、真实设备或账户侧 Token 的外部 pending 状态。

## 7. 当前最终收口更新

NPC 角色预览现已保持真实 GLB 优先：当真实 `modelAssetUrl` 不存在时，才加载明确标记为开发预览的 `baselineGlbUrl`，并提供独立加载进度、失败回退和销毁路径。该基线 GLB 不会改变真实资产的 `glbUrl=null`、`pending-import` 或 `readyForRuntime=false` 语义。

GameHub 已完成第二阶段代码分割：`AgriculturalMapViewer` 独立为约 3,957.01 kB、gzip 818.25 kB 的异步 chunk；GameHub 自身约 313.90 kB、gzip 56.44 kB；主入口约 1,054.96 kB、gzip 314.12 kB。这样降低了首屏同步载荷，但 Babylon 地图首次进入仍有独立异步下载成本，Vite 的大 chunk 警告仍需后续评估。

NPC 预览/地图懒加载定向 5 项测试、TypeScript 和生产构建通过；当前全量回归为 **199 个测试文件、2,150 项测试通过**。当前 release-gate 仍应解释为 `local-ready-external-pending`：程序化基线可运行，真实高保真 GLB/PBR/动画、真实设备性能和账户 Token 轮换均未被本地结果替代。
