# Ice Snow City 高保真资产与真机性能手动验证方案

## 1. 目的与证据边界

本方案用于在真实 GLB/PBR 资产和 iOS/Android 设备到位后，由美术、开发或 QA 人员进行受控手动验收。它也提供了在资产尚未交付时可执行的模拟演练流程，用来验证表格、采样、报告生成和问题归档是否完整。

> **重要边界：** procedural-baseline GLB、NullEngine、桌面浏览器、`ci-software` 或 `ci-gpu` 结果只能证明本地流程可运行，不能把高保真资产状态提升为 `verified`，也不能替代 `ios-real`/`android-real` 真机证据。模拟测试通过后，canonical 门禁仍应保持 `pending-import` 或 `pending-device`。

建议所有测试使用同一版本号、同一 commit SHA 和同一浏览器构建记录。每次测试都应保存原始截图、屏幕录制或导出的 JSON，不要只填写手工结论。

## 2. 测试前准备

手动测试前，先准备以下信息：游戏版本或 commit SHA、测试人员、日期与时区、GLB 文件 SHA-256、文件大小和 MIME、设备型号、操作系统版本、浏览器版本、GPU/渲染器、屏幕分辨率、横屏方向和 devicePixelRatio。资产文件应放在项目外的受控目录，禁止把原始大文件、`.env` 或账户凭据复制进仓库。

推荐测试矩阵如下：

| 组别 | 目标 | 最低样本 |
|---|---|---:|
| 资产静态验收 | 结构、预算、贴图、LOD、碰撞、动画 | 8 个真实目标资产逐项验收 |
| 运行时验收 | Babylon 加载、进度、交互、销毁 | 每个资产至少 3 次加载/卸载 |
| 真机基线 | 不启用雪层的 FPS、内存、Draw Call | 每台设备 3 次，每次 60 秒 |
| 真机雪层 | 启用雪层后的同场景指标 | 每台设备 3 次，每次 60 秒 |
| 长时稳定性 | 内存增长、资源泄漏、降级行为 | 每台设备连续 10 分钟 |

## 3. 高保真 GLB 静态检查清单

每个资产应建立一行证据记录，并使用项目中的 Asset ID。缺少任何必填字段时，状态只能是 `pending-evidence`；证据齐全但不符合预算或契约时，状态为 `rejected`；只有所有规则通过且 manifest 同步为真实 GLB URL 与 `verified` 后，才能标记 `accepted`。

| Asset ID | 必查内容 | 验收标准 |
|---|---|---|
| `player-main` | 网格、骨骼、动画、PBR、LOD | 15k–25k 面；60–80 根骨骼；30 FPS；idle/walk/run/work/sleep/celebrate/sad/talk 全部存在；2K PBR；LOD0/1/2；碰撞体 |
| `npc-quest-guild` | NPC 网格、对话与移动动画 | 10k–20k 面；NPC 骨骼范围符合登记；30 FPS；idle/walk/talk/work；PBR；碰撞包围体 |
| `landmark-city-core` | 地标结构与交互根节点 | 5k–15k 面预算；baseColor/normal/metallicRoughness；至少 1 个 LOD；碰撞体；可点击根节点 |
| `landmark-bank` | 银行地标结构与入口 | PBR、LOD、碰撞/可点击根节点；无缺失纹理 |
| `landmark-market` | 商业中心结构与入口 | PBR、LOD、碰撞/可点击根节点；材质槽命名稳定 |
| `landmark-production` | 生产区结构与交互 | PBR、LOD、碰撞/可点击根节点；升级版本可区分 |
| `environment-road` | 道路、路灯和模块化拼接 | 低面数、可拼接、碰撞正确；移动端实例化或合批方案明确 |
| `environment-vegetation` | 植被、水渠与实例化 | PBR、低面数、实例化兼容；遮挡和碰撞符合玩法需要 |

每个 GLB 都应执行以下顺序。首先用文件工具或资产检查器确认 SHA-256、MIME 为 `model/gltf-binary`、glTF 版本为 2.0，文件能被解析且没有截断。其次检查网格数量、顶点/三角形数量、根节点层级、材质槽和纹理相对路径。再次确认 PBR 至少包含 Base Color、Normal、Metallic-Roughness；Occlusion 若交付则记录其色彩空间和通道。最后检查 LOD0/LOD1/LOD2、碰撞网格、导出版本、授权说明和文件命名。

## 4. 动画与角色验收

角色资产载入后，在 0.5x、1x、2x 播放速度下分别检查 idle、walk、run、work、sleep、celebrate、sad、talk。每个循环至少播放 20 秒，观察首尾是否跳帧、脚底是否滑动、骨骼是否拉伸、手指/衣物是否穿模、过渡是否约 0.3 秒。动画必须标记为 30 FPS；不得仅凭视觉“看起来流畅”替代帧率记录。

应特别检查玩家角色的 60–80 根骨骼和 NPC 的登记范围，确认根骨骼方向、单位尺度、T-pose/绑定姿势、动画命名和 Babylon `Skeleton`/`AnimationGroup` 数量。对话动画要在任务大厅触发一次，工作动画要在生产区触发一次，庆祝/悲伤动画要由任务完成与失败路径分别触发一次。

## 5. Babylon 运行时验收

进入 16:9 横屏 GameHub，打开资产加载入口。每个资产至少执行三轮：点击加载，确认进度从 0% 单调推进并最终达到 100%；加载完成后确认模型根节点位置、缩放、材质、阴影、碰撞和点击交互；随后执行卸载或切换场景，确认模型、材质、纹理、骨骼和粒子没有残留。重复加载同一资产三次，记录是否出现重复节点、内存增长、控制台错误或事件监听器累积。

主动测试取消路径：在进度未完成时点击取消或触发 `AbortSignal`，确认已经加载的临时网格会被销毁，界面回到可重试状态，不出现半模型或永久 loading。若资产缺失纹理、GLB 损坏、动画缺失或碰撞体不存在，界面应显示可理解的错误，并保持门禁为 `rejected` 或 `pending-evidence`，不能静默回退成已验证真实资产。

## 6. 真机性能手动测试

### 6.1 设备与环境记录

每台设备先清理后台应用，接入稳定电源或记录电量，关闭屏幕录制以外的无关调试工具，使用同一浏览器版本和同一横屏方向。记录设备型号、OS、浏览器、GPU/渲染器、分辨率、devicePixelRatio、温度/电量状态和网络延迟。网络不是本次 FPS 结论的替代指标，但网络异常应单独标记。

### 6.2 场景与采样流程

加载同一个初始地图、相机位置和 NPC 数量。先关闭雪层运行 60 秒 baseline，再清理场景并以相同状态开启 low、medium、high 三个雪层档位，每档运行 60 秒。前 10 秒作为预热，不纳入统计；后 50 秒记录帧时间或 FPS、P95 帧时间、掉帧比例、内存峰值、Draw Call、三角形数和加载错误。每个条件重复 3 次，取中位数，并保留每次原始数据。

建议最低通过阈值按产品目标分层，而不是把模拟结果冒充统一硬门槛：

| 指标 | 建议观察线 | 处理规则 |
|---|---:|---|
| baseline 平均 FPS | ≥ 55 | 低于 55 先优化基础场景，不进入雪层结论 |
| snow 平均 FPS | ≥ 45，目标接近 60 | 低于 45 需降档、减粒子或减少 Draw Call |
| P95 帧时间 | ≤ 33.3 ms | 超过 33.3 ms 说明长尾卡顿明显 |
| 掉帧比例 | ≤ 5% | 超过 5% 记录为体验风险，超过 10% 不建议发布 |
| 峰值内存 | 无持续增长 | 10 分钟曲线持续上升视为泄漏候选 |
| Draw Call 增量 | 相对 baseline 尽量 ≤ 20% | 超过 20% 检查合批、实例化和材质数量 |

这些是手动 QA 的建议观察线，不会覆盖项目现有的外部发布门禁。正式报告必须使用 `source: "ios-real"` 或 `source: "android-real"`；桌面或模拟器只能使用 `ci-software`/`ci-gpu`。

### 6.3 真机降级与稳定性

分别验证 low、medium、high 三档质量切换。确认低端设备可以在不刷新页面的情况下切换到 low，粒子数量、纹理档位和更新频率下降，但地图、建筑点击、任务交互和 UI 不消失。断开网络后确认只读地图与已加载资源仍能显示，网络提示不会阻塞渲染；WebGL 不可用时确认降级页、错误报告和 FAQ 可用。

连续运行 10 分钟，期间每 2 分钟执行一次镜头移动、建筑点击、NPC 交互、任务面板打开/关闭和雪层质量切换。若 FPS 逐步下降、内存不回落、粒子重复叠加、模型重复出现或浏览器被系统杀死，记录最后 60 秒日志和屏幕录制，不得只记录“失败”。

## 7. 证据记录模板

### 7.1 资产证据 JSON

```json
{
  "assetId": "player-main",
  "source": "real-art-delivery",
  "file": {
    "relativeName": "player/player-main.glb",
    "sha256": "<sha256>",
    "mime": "model/gltf-binary",
    "gltfVersion": "2.0",
    "bytes": 0
  },
  "polygonCount": 0,
  "pbrMaps": ["baseColor", "normal", "metallicRoughness", "occlusion"],
  "lodCount": 3,
  "hasCollisionMesh": true,
  "skeletonCount": 0,
  "animationFps": 30,
  "animationClips": ["idle", "walk", "run", "work", "sleep", "celebrate", "sad", "talk"],
  "babylonLoad": {"progressReached100": true, "cancelClean": true, "disposeClean": true},
  "screenshots": ["<path-or-url>"],
  "reviewer": "<name>",
  "reviewedAt": "2026-09-06T00:00:00Z",
  "status": "pending-import"
}
```

### 7.2 真机性能 JSON

```json
{
  "schemaVersion": 1,
  "source": "ios-real",
  "generatedAt": "2026-09-06T00:00:00Z",
  "device": {
    "platform": "ios",
    "model": "<exact model>",
    "os": "<version>",
    "browser": "<version>",
    "renderer": "<GPU/WebGL renderer>",
    "devicePixelRatio": 3
  },
  "orientation": "landscape",
  "scene": {"map": "initial-city", "camera": "spawn-default", "npcCount": 6},
  "samples": [
    {"mode": "baseline", "durationSec": 60, "warmupSec": 10, "averageFps": 0, "p95FrameMs": 0, "droppedFrameRatio": 0, "peakMemoryMb": 0, "drawCalls": 0},
    {"mode": "snow", "quality": "medium", "durationSec": 60, "warmupSec": 10, "averageFps": 0, "p95FrameMs": 0, "droppedFrameRatio": 0, "peakMemoryMb": 0, "drawCalls": 0}
  ],
  "comparison": {"averageFrameDeltaMs": 0, "p95FrameDeltaMs": 0, "droppedFrameRatioDelta": 0, "snowFps": 0},
  "validation": {"status": "real-device-pending", "realDeviceEvidenceRequired": true},
  "attachments": ["<screen-recording>", "<raw-export>"]
}
```

提交前检查 `source` 是否正确。模拟或桌面结果不能填写 `ios-real`/`android-real`；没有真实设备时应使用 `createPendingRealDeviceReport()` 的 pending 语义，保留空字段而不是填估算值。

## 8. 缺陷分级与最终判定

阻断级问题包括：GLB 无法解析、真实 URL 缺失、核心 PBR 贴图缺失、骨骼或必需动画缺失、碰撞体导致角色穿墙、LOD 缺失、加载取消后资源泄漏、真机雪层导致页面崩溃或平均 FPS 低于 30。高风险问题包括 P95 帧时间超过 33.3ms、掉帧比例超过 10%、10 分钟内存持续上升、关键地标无法点击或质量切换无法恢复。一般问题包括轻微材质色差、局部穿模、非核心装饰缺失或提示文案问题。

只有当八项真实资产都有完整交付证据、所有运行时和美术 QA 条件通过，并且每个目标设备的 baseline/snow JSON 使用 `ios-real` 或 `android-real` 且重复采样合格时，才可以分别推进 `pending-import` 和 `pending-device`。在此之前，release gate 应继续显示外部 pending。

## 9. 手动执行后的归档结构

建议将结果按以下结构存放在项目外部或受控存储中，再只把小型 JSON、哈希和报告摘要纳入版本控制：

```text
manual-validation/<run-id>/
  asset-evidence/
    player-main.json
    npc-quest-guild.json
    ...
  device-performance/
    ios-<model>-baseline-snow.json
    android-<model>-baseline-snow.json
  screenshots/
  screen-recordings/
  console-logs/
  summary.md
```

所有未通过项都要同时写入 `issues`、复现步骤、影响范围、责任人和复测条件。不要通过修改 manifest、source 标签或阈值来掩盖失败，也不要把演练报告直接提交为真实发布证据。
