# Ice Snow City iOS / Android 真机性能采集指南

## 1. 目标与原则

本指南用于采集真实 iOS 与 Android 设备上的 WebGL 游戏性能证据，重点指标包括平均 FPS、平均帧时间、P95 帧时间、掉帧比例、内存、Draw Call、渲染器和 devicePixelRatio。采样必须在真实设备的横屏浏览器中完成，并保留原始记录、设备信息和测试版本。

> **证据边界：** 桌面浏览器、Android 模拟器、iOS Simulator、CPU 降速模拟和 `ci-software`/`ci-gpu` 只能作为开发基线；只有真实设备报告使用 `source: "ios-real"` 或 `source: "android-real"` 时，才可作为 `pending-device` 的候选证据。项目现有 harness 会自动生成 baseline 与 snow 两组样本，但不会替代设备、浏览器和系统级内存证据。

Apple 的 Safari Web Inspector Timelines 可以同时查看网络、布局、渲染、JavaScript、内存和 CPU 活动，并支持导出时间线记录。[1] WebKit 的 CPU Timeline 以 500ms 为采样间隔，适合观察 CPU 峰值与能耗趋势，但它不是逐帧 FPS 的替代物。[2] Android Chrome 可通过 `chrome://inspect#devices` 连接真实设备并打开 Performance 面板；官方文档特别提醒，设备 screencast 会降低帧率，测量动画时必须关闭 screencast。[3] Chrome Performance 面板可以查看 FPS 图、Frames、CPU、主线程和长任务，并提供 Rendering 面板的实时 FPS 估计。[4]

## 2. 固定测试条件

### 2.1 设备登记

每一台设备都必须生成唯一的 `runId`，登记准确型号而不是营销名称。例如记录 `iPhone15,4` 或 `Pixel 8 Pro`，同时记录系统版本、浏览器版本、GPU/渲染器、屏幕分辨率、devicePixelRatio、网络类型、电量和设备温度。测试期间关闭后台应用、自动锁屏、低电量模式、系统录屏和不必要的通知；若为了连接调试器必须打开开发者选项，应在结果中说明。

| 字段 | iOS 示例 | Android 示例 |
|---|---|---|
| platform | `ios` | `android` |
| model | `iPhone15,4` | `Pixel 8 Pro` |
| OS | `iOS 18.x` | `Android 15` |
| browser | `Safari 18.x` | `Chrome 1xx.x` |
| renderer | WebGL renderer 字符串 | WebGL renderer 字符串 |
| orientation | `landscape` | `landscape` |
| dpr | `3` | `2.75` |
| source | `ios-real` | `android-real` |

### 2.2 固定软件与场景

每次对比必须使用相同的 commit SHA、构建产物、初始地图、相机位置、NPC 数量、建筑数量、天气档位和窗口尺寸。不要在 baseline 运行后重新加载另一份构建再运行 snow；正确顺序是同一页面、同一场景、稳定预热后先 baseline，再 snow，再按需要重复整个序列。

项目 `runSnowLayerPerfBenchmark` 默认最短采样时间为 3 秒，默认时间为 10 秒；正式真机采样建议将每个条件设置为 60 秒，前 10 秒作为预热，后 50 秒纳入统计。每台设备、每个条件至少执行 3 次，保留每次原始结果，不只保存平均值。

## 3. iOS 真机采集

### 3.1 连接 Safari Web Inspector

在 iPhone 或 iPad 上打开“设置 → Safari → 高级 → Web 检查器”。使用数据线连接 Mac，在 Mac Safari 的“开发”菜单中选择设备和当前 Safari 页面。Apple 将 Web Inspector 的 Timelines、Console、Network、Graphics、Layers 和 Storage 作为网页调试入口；Timelines 用于观察内存、CPU、布局、渲染和脚本活动。[1]

在正式采样前，先关闭 Safari Web Inspector 的 screencast 或不必要的实时面板，只保留连接和记录能力。若工具窗口会改变页面负载，应采用两次采样：第一轮用 Web Inspector 观察问题，第二轮断开调试工具或尽量减少面板干预，第二轮才作为正式 FPS 数字。Safari 的 Timeline 记录应导出并与 JSON 一起归档。

### 3.2 iOS FPS 与帧时间

游戏页面内部使用 `requestAnimationFrame` 或 Babylon `scene.onAfterRenderObservable` 采集每一帧的时间戳。不要从肉眼感受或单次 FPS overlay 读数推算 P95。推荐流程如下：

1. 打开横屏游戏页面，等待地图、GLB、材质和 NPC 完成加载。
2. 保持相机与场景状态，预热 10 秒，排除首次 shader 编译、纹理上传和 GLB 解码影响。
3. 运行 baseline 50 秒，保存每帧的 `frameMs` 或聚合后的帧时间数组。
4. 使用完全相同的场景开启 snow，分别运行 low、medium、high；每档预热 10 秒后采样 50 秒。
5. 在同一设备至少重复 3 次。若 Safari 页面被切到后台、设备锁屏、来电或系统弹窗出现，该次样本作废并重新执行。

Safari Web Inspector 的 Timelines 适合定位长任务、CPU/内存峰值和渲染活动；逐帧统计应以页面内 harness 的原始帧时间为主，二者必须保留同一时间段的时间戳或 recording 文件以便互相解释。

### 3.3 iOS 内存

Safari 网页不能可靠地使用一个跨版本、跨设备统一的 JavaScript API 代表“整个页面内存”或 GPU 内存。因此至少记录两类数据：页面内部可获取的 JS heap 指标（如果该版本暴露）和 Web Inspector Timelines/Memory 的系统观察值。若 Safari Web Inspector 只给出曲线而不给出稳定的 MB 数字，应保存导出的 Timeline，并在 JSON 中将 `memoryMb` 填为 `null`，把曲线截图或 recording 路径放入 `attachments`，不要估算。

重点不是单个瞬时值，而是：首次加载峰值、baseline 稳态、snow 稳态、切换质量档位后是否回落、卸载资产后是否回落，以及连续 10 分钟是否持续上升。iOS 浏览器被系统终止、页面白屏或出现 WebGL context lost，应记录为阻断级稳定性问题。

## 4. Android 真机采集

### 4.1 连接 Chrome DevTools

在 Android 设备开启开发者选项和 USB 调试，用数据线连接开发机。在桌面 Chrome 打开 `chrome://inspect#devices`，开启 Discover USB devices，确认设备授权，然后在设备页面旁点击 Inspect。[3] Chrome 官方文档说明，远程调试可检查设备上的实时页面；但 screencast 会降低帧率，所以测量动画和滚动时应关闭 screencast。[3]

正式采样时只保留必要的 DevTools 连接。若使用 Chrome Performance 面板记录，应在结果中标记“调试器影响可能存在”，并再做一轮关闭 screencast、只用页面 harness 的正式采样。Chrome Performance 面板可以查看 FPS chart、Frames、CPU 和主线程长任务；Rendering 面板的 FPS meter 适合现场观察，不应作为唯一归档数字。[4]

### 4.2 Android FPS、P95 和渲染负载

Android Chrome 的采样流程与 iOS 相同：固定横屏、同一 URL/build、预热、baseline、snow、重复三次。通过 Performance 录制确认是否存在长任务、强制布局、shader 编译或纹理上传尖峰；通过页面 harness 导出逐帧时间；通过 Babylon 的 `engine.webGLVersion` 和渲染器字符串记录 WebGL1/2 与 GPU。

如果使用 ADB 或设备云进行辅助记录，保存命令版本和设备序列号。ADB 连接本身不应把 screencast 或高频日志持续打开，否则会污染结果。Android 系统级 `dumpsys meminfo` 可作为设备/进程级辅助证据，但对 Chrome 多进程浏览器并不等价于单一网页的 GPU 内存；必须记录包名、采样时间和口径，不能把整个 Chrome 的内存直接当作游戏页面内存。

## 5. 指标计算口径

### 5.1 FPS 与平均帧时间

设正式窗口内的帧时间为 `dt[1..n]`，单位为毫秒。项目 harness 当前使用所有有效相邻时间戳计算平均帧时间：

```text
averageFrameMs = sum(dt) / n
engineFps = 1000 / averageFrameMs
```

为了避免采样窗口边界影响，也建议同时记录墙钟口径：

```text
wallClockFps = frameCount / (windowDurationMs / 1000)
```

如果 `engineFps` 与 `wallClockFps` 差异超过 5%，检查是否把预热帧、页面暂停、长时间后台或最后一个不完整窗口纳入了样本。正式报告必须注明使用哪一种作为主指标；本项目 `SnowLayerPerfSample` 的主字段是 `engineFps`。

### 5.2 P95 帧时间

将有效 `dt` 从小到大排序。为与项目 `summarizeSnowLayerFrameTimes` 保持一致，当前 P95 使用下标 `floor(n × 0.95)`，并限制在最后一个元素以内：

```text
sorted = sortAscending(dt)
p95FrameMs = sorted[min(sorted.length - 1, floor(sorted.length * 0.95))]
```

这不是“95% 的 FPS”，而是 95% 帧时间不超过的近似边界；数值越低越好。报告中同时填写平均帧时间和 P95，不能只写 FPS。若团队决定改用 nearest-rank 或线性插值，必须整体切换口径并在报告版本中注明，不能混合比较。

### 5.3 掉帧比例

项目当前把 `frameMs > 33.34` 作为掉帧样本，即明显低于 30 FPS 的长帧：

```text
droppedFrameRatio = count(dt > 33.34) / max(1, n)
```

这与“低于 60 FPS 的所有帧”不同。若额外报告 60 FPS 预算违约率，可单独增加 `dt > 16.67` 字段，不能覆盖项目现有 `droppedFrameRatio` 定义。

### 5.4 内存

内存必须标记来源和范围。建议分开记录 `jsHeapUsedMb`、`jsHeapTotalMb`、`browserProcessMb`、`webglResourceNotes` 和 `peakObservedMb`，并在字段旁写明是页面 JS heap、浏览器进程、WebView 进程还是 Web Inspector 曲线。不要把 JS heap 当作纹理/GPU 内存，也不要把 Android Chrome 整个进程组或 iOS 系统曲线直接伪装为页面 heap。

在 10 分钟稳定性测试中，记录每 30 秒一个点。若执行 GC 或切换场景后内存回落，记录回落后的稳态；若每轮加载/卸载都抬高基线，标记为疑似资源泄漏。系统因为内存压力杀死页面时，记录最后一次可读数据、系统日志和复现步骤。

### 5.5 Draw Call 与 GPU 负载

Draw Call、三角形数、材质数和纹理数量应在同一相机和场景下比较 baseline/snow。Babylon 的统计面板或引擎 instrumentation 可记录渲染统计；Chrome/Safari Timeline 负责定位 CPU、主线程和渲染活动。雪层质量切换后至少比较：Draw Call 增量、粒子数量、材质数量、纹理分辨率和 GPU frame time。若浏览器无法提供可靠的 GPU 时间，使用 `null` 并保存 Timeline，而不是填估算值。

## 6. 推荐判定线

下表是项目 QA 的建议观察线，不会替代外部发布门禁。正式门禁仍要求真实设备来源标签、原始 JSON 和完整设备元数据。

| 指标 | 建议观察线 | 处理方式 |
|---|---:|---|
| baseline 平均 FPS | ≥ 55 | 低于 55 先处理基础场景，暂不评价雪层增量 |
| snow 平均 FPS | ≥ 45，目标接近 60 | 低于 45 先降粒子、纹理或质量档位 |
| P95 帧时间 | ≤ 33.3 ms | 超出说明存在明显长尾卡顿 |
| 掉帧比例 | ≤ 5% | 5%–10% 记录为风险，>10% 不建议发布 |
| 内存曲线 | 10 分钟无持续增长 | 每次加载/卸载后基线持续上升视为泄漏候选 |
| Draw Call 增量 | 相对 baseline 尽量 ≤ 20% | 超出检查实例化、合批和材质复用 |

每个指标至少使用 3 次有效样本。建议以中位数作为设备条件的主值，同时保留最差样本；不要只取最好的一次。若三次结果变异系数明显过大，先排查温度、后台任务、网络、shader 首次编译、调试器和电量模式，再决定是否重测。

## 7. 原始数据采集建议

页面内可放置一个仅测试环境显示的 Performance HUD，但 HUD 本身会产生少量开销。正式采样可采用两段式：第一段开启 HUD/DevTools 定位问题，第二段关闭 HUD 和 screencast，只保留数据导出。每个样本至少导出以下字段：`runId`、`commitSha`、`source`、`platform`、`model`、`os`、`browser`、`renderer`、`devicePixelRatio`、`orientation`、`scene`、`quality`、`mode`、`warmupSec`、`durationSec`、`frames`、`averageFrameMs`、`p95FrameMs`、`engineFps`、`wallClockFps`、`droppedFrameRatio`、`jsHeapUsedMb`、`peakObservedMb`、`drawCalls`、`triangleCount`、`temperatureNote` 和附件路径。

建议每台设备保存如下目录：

```text
real-device-runs/<run-id>/
  metadata.json
  ios-or-android-baseline-01.json
  ios-or-android-snow-low-01.json
  ios-or-android-snow-medium-01.json
  ios-or-android-snow-high-01.json
  raw-frame-times/
  safari-timelines-or-chrome-traces/
  screenshots/
  screen-recordings/
  console-logs/
  summary.md
```

## 8. 质量控制与常见误差

首先，不能把 Chrome DevTools screencast、iOS 屏幕镜像、持续录屏或高频 Console 日志与正式样本混用；它们会增加通信、编码或日志负载。其次，不能把 CPU throttling、浏览器模拟器或桌面窗口缩放当成真机结果。再次，首次加载的 shader 编译、GLB 解码、纹理上传和缓存命中必须通过预热和重复试验隔离。

如果设备温度明显升高，后续样本可能出现热降频，应记录温度状态并把受影响样本单独归档。若网络请求造成场景状态变化，预加载资源后再进行采样，或将网络事件单独标记。若页面进入后台、锁屏、切换应用或设备出现系统弹窗，该样本作废。若 WebGL context lost、Safari/Chrome 标签崩溃、页面被系统杀死或内存持续增长，测试结果应判为稳定性失败，而不是删掉异常点后继续平均。

## 9. 项目报告字段与提交前检查

项目 `SnowLayerPerfReport` 要求 `schemaVersion`、`generatedAt`、`source`、设备平台/浏览器/渲染器/DPR/型号、samples、平均帧时间差、P95 帧时间差、掉帧比例差、snow FPS 和 validation 状态。真实设备报告应满足：`source` 为 `ios-real` 或 `android-real`；`validation.status` 为 `validated`；`realDeviceEvidenceRequired` 为 `false`；设备型号、浏览器、渲染器和采样附件齐全。若任一条件不满足，保持 `real-device-pending`，不修改门禁状态。

提交前逐项确认：同一 commit、同一场景、横屏、每个条件 3 次有效样本、预热已排除、baseline/snow 对照完整、P95 使用统一公式、内存范围已标注、调试器干扰已说明、原始 recording/JSON 可打开、异常样本有原因、没有把估算值写进真实设备字段。最终报告应同时附带最差样本和中位数，不只附带平均值。

## References

[1]: <https://developer.apple.com/safari/tools/> "Apple Safari Developer Tools"

[2]: <https://webkit.org/blog/8993/cpu-timeline-in-web-inspector/> "WebKit CPU Timeline in Web Inspector"

[3]: <https://developer.chrome.com/docs/devtools/remote-debugging> "Chrome DevTools Remote Debugging on Android"

[4]: <https://developer.chrome.com/docs/devtools/performance> "Chrome DevTools Performance panel"
