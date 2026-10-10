# Snow Layer Mobile Performance Test

## Purpose

`client/src/game/snowLayerPerfHarness.ts` runs a controlled browser benchmark that renders the same scene first with a baseline PBR material and then with `IceSnowSnowLayerMaterialPlugin`. It is intended for real iOS Safari and Android Chromium devices. It is not a substitute for GPU vendor profiling or a real gameplay session.

## Running on a device

Expose the harness through a development or staging page that creates a same-origin canvas and calls:

```ts
const samples = await runSnowLayerPerfBenchmark(canvas, {
  durationMs: 10000,
  quality: "medium",
  meshCount: 24,
  onProgress: (mode, elapsed, total) => {
    status.textContent = `${mode}: ${Math.round((elapsed / total) * 100)}%`;
  },
});
console.table(samples);
```

Run each device after a cold page load, after one warm-up run, and with the same orientation, browser tab state, brightness policy and power mode. Do not compare results when the device is thermally throttling or when another WebGL tab is active.

## Recorded metrics

| Metric | Meaning |
|---|---|
| `engineFps` | FPS derived from average measured frame time |
| `averageFrameMs` | Mean time between rendered frames |
| `p95FrameMs` | 95th-percentile frame time; useful for stutter detection |
| `droppedFrameRatio` | Share of samples above 33.34 ms, approximately below 30 FPS |
| `frames` | Number of frame samples collected |
| `renderer` | WebGL1/WebGL2 context level used by the harness |
| `devicePixelRatio` | Device pixel ratio at test time |

The important comparison is `snow.averageFrameMs - baseline.averageFrameMs`, together with the change in `p95FrameMs` and `droppedFrameRatio`. A higher average FPS with a worse P95 is not an acceptable quality improvement.

## Suggested acceptance gates

These are starting engineering gates, not guarantees for every device. The final values must be calibrated against the intended supported-device matrix.

| Device tier | Target | Warning | Action |
|---|---:|---:|---|
| High | Snow layer remains at or above 50 FPS | P95 above 25 ms | Reduce shadow/Bloom before removing PBR |
| Medium | Snow layer remains at or above 40 FPS | P95 above 30 ms | Switch from High to Medium or reduce texture scale |
| Low | Snow layer remains at or above 30 FPS | Dropped ratio above 20% | Use Low quality: no normal map, no real-time shadow, no Bloom |

## Interpretation rules

The harness measures rendering overhead only. It does not measure GLB download time, texture upload spikes, garbage collection, UI work, network calls or the full GameHub scene. Before release, repeat the test with the real four-building vertical slice, real textures, camera movement, LOD switching and the actual notification/UI overlay.

The test must also verify that disabling the snow plugin does not change game economy values, NFT state, transaction state or the 60/40 fee split. The plugin is a visual layer only.

## 测试阶段性能监控 UI

访问游戏路由时添加 `?perf=1` 可显示 `PerformanceMonitorPanel`。面板以低频间隔采样 Babylon `Engine.getFps()`、帧时间和引擎 Draw Calls，并在浏览器支持 `performance.memory` 时显示 JS Heap 估算；没有 Babylon Engine 时显示“等待场景注册”，不会伪造数值。面板默认不显示在正式游戏 UI 中，可通过关闭按钮隐藏。

生产场景接入时，应将真实 `Engine` 与可选 `Scene` 传入 `PerformanceMonitorPanel`，不要创建第二个 Engine 或第二个 render loop。内存字段不等于 GPU 显存，Draw Calls 是 Babylon 当前引擎统计值；最终 iOS/Android 性能结论仍需使用真实设备云或真机采样。

## CSV 性能记录导出

测试模式下的性能监控面板会保留最近最多 1,200 条 Babylon 采样记录。点击“导出 CSV”后，浏览器直接生成并下载 `isc-performance-<timestamp>.csv`，不会向服务器上传性能数据；没有真实 Babylon 采样时，按钮会显示“暂无可导出的性能记录”。

CSV 包含 `timestamp_iso`、`fps`、`frame_time_ms`、`draw_calls`、`js_heap_used_mb`、`js_heap_limit_mb` 和 `source` 字段。JS Heap 字段为空表示浏览器未提供该估算能力，不应解释为零；时间戳使用 ISO 8601 UTC 格式。导出记录仅用于测试、回归和设备对比，不可替代真实设备云或真机 GPU 性能结论。

面板的“清除数据”按钮仅重置当前页面内存中的性能采样历史，不会删除已下载的 CSV，也不会影响游戏进度、交易数据、链上模拟状态或服务器数据。按钮在有采样记录时可用，点击后必须通过二次确认；选择“取消”不会改变记录，确认后记录计数归零并显示短暂的成功状态。

面板统计区的“平均 FPS”是当前记录窗口内所有 FPS 采样的算术平均值；“峰值内存”是窗口内可用 JS Heap 已使用值的最大值。没有采样时平均 FPS 显示“暂无数据”；浏览器未提供任何 JS Heap 估算时峰值内存显示“不可用”。清除采样记录会同步重置两项统计。

统计区默认在平均 FPS 严格低于 30 时显示红色高亮和“低于 30 FPS”告警；平均 FPS 等于 30 不告警。峰值 JS Heap 默认超过 512 MB 时显示红色高亮，并标注实际配置阈值；等于 512 MB 不告警。`PerformanceMonitorPanel` 支持通过 `peakMemoryWarningMb` 覆盖内存阈值。不可用内存不会被当作超限值。

## 可复现报告归一化

`client/src/game/snowLayerPerfReport.ts` 将 harness 的 baseline/snow 样本转换为版本化报告结构，计算平均帧时间、P95 帧时间、掉帧率和雪层 FPS 差值。报告来源必须显式标记为 `ci-software`、`ci-gpu`、`ios-real` 或 `android-real`；只有明确标记的真实 iOS/Android 运行才会进入 `validated` 状态。

没有真实设备数据时应使用 `createPendingRealDeviceReport()`，该报告的样本和雪层 FPS 为 `null`/空数组，并将 `realDeviceEvidenceRequired` 设为 `true`。禁止用 CI 软件渲染结果填充 iOS/Android 设备字段。对应的 3 项报告测试覆盖差值计算、来源分类和无数据待测状态。

## 2026-09-05 移动端渲染优化

本轮优化不改变雪层参数契约，而是按 `WeatherQuality` 对天气粒子设置预算：`low` 使用 600 个雪粒子/900 个雨粒子和 32px 动态纹理，`medium` 使用 1,500/2,500 和 48px，`high` 保留 3,000/5,000 和 64px。雪粒子发射率由原先的 200–500 调整为 80–240，雨粒子发射率调整为 220–500；强度仍会被限制在 0–1 范围内。

`WeatherSystem.update()` 现在复用单个发射器 `Vector3`，仅当相机在 X/Z 任一方向移动至少 0.5 个世界单位时才更新发射器引用，避免静止镜头下每帧创建对象和重复赋值。`setQuality()` 会重新应用当前天气，使质量档位切换能够立即更新粒子预算。

`IceSnowSnowLayerMaterialPlugin` 的片元 shader 增加质量预处理分支：High 保留坡度和高度双平滑遮罩，Medium 使用一个平滑坡度遮罩与阶梯高度遮罩，Low 使用单次 `step` 坡度判断。该优化减少低端设备的片元指令数量，但没有在本地测试中虚构 GPU FPS 提升；真实收益必须由 iOS/Android WebGL 设备重新采样确认。

本轮代码级门禁包括雪层 shader 分支与 WeatherSystem 粒子预算回归、TypeScript、全量测试、生产构建，以及桌面 1280×720 和 16:9 移动横屏预览。预览证明布局和场景入口仍可渲染，不等价于真实设备 FPS 结论。

### 2026-09-05 资源生命周期补充

天气系统现在为雪/雨动态纹理保留显式句柄，并在天气切换、`stop()` 和 `dispose()` 路径中与粒子系统成对释放。该处理避免长期天气切换过程中动态纹理对象脱离粒子系统后继续占用资源。对应的纯资源回收契约测试覆盖正常对象和空句柄两种路径；它验证的是销毁责任，不伪造 GPU 内存回收量。

本轮优化后的代码门禁为 12 项雪层/天气定向测试、TypeScript 检查、全量 193 个测试文件/2,135 项测试和生产构建通过。真实设备 FPS、GPU 显存和热降频仍必须在目标 iOS/Android 设备或设备云中测量。
