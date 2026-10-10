# Ice Snow City 外部准备项目清单

**更新时间：2026-09-13**  
**目的：**列出当前仍不能仅凭程序化 baseline、桌面浏览器、CI 软件样例或代码测试完成的项目，便于提前准备真实美术文件、真实 iOS/Android 设备和账户侧证据。

> **结论：**当前有两类核心外部门禁仍未完成：真实高保真资产导入验收，以及真实 iOS/Android 设备性能验收。CI 样例、procedural-baseline GLB 和桌面浏览器结果只能证明本地流程可运行，不能提升 `pending-import` 或 `pending-device` 状态。

## 1. 优先级总览

| 优先级 | 类别 | 当前状态 | 需要准备 | 完成后可解除的门禁 |
| --- | --- | --- | --- | --- |
| P0 | 玩家与 NPC 真实角色资产 | `pending-import` | 2 个真实 GLB、骨骼、动画、PBR 贴图、LOD、碰撞 | 角色资产与角色动画门禁 |
| P0 | 四个核心地标建筑 | `pending-import` | 城市核心、银行、商业中心、生产区 GLB、PBR、LOD、碰撞、交互根节点 | 核心地图地标资产门禁 |
| P1 | 道路与环境资产 | `pending-import` | 道路/路灯模块、植被/水渠模块、PBR、低面数、碰撞/实例化方案 | 环境资产与移动渲染门禁 |
| P1 | 统一纹理与 PBR 交付 | `pending-import` | Base Color、Normal、Metallic-Roughness、Occlusion、压缩格式和许可证 | 材质完整性与授权门禁 |
| P0 | iOS 真机性能 | `pending-device` | 真实 iPhone/iPad、Safari 版本、GPU/渲染器和原始采样 JSON | `ios-real` 性能证据 |
| P0 | Android 真机性能 | `pending-device` | 真实 Android 设备、Chrome 版本、GPU/渲染器和原始采样 JSON | `android-real` 性能证据 |
| P1 | 账户侧旧 Token 轮换 | `pending-account-action` | 账户所有者撤销历史 Token 的确认 | 账户安全门禁；它不是资产或设备门禁 |

## 2. 真实高保真资产清单

项目当前 canonical manifest 登记 8 个真实目标 Asset ID。下面的“共享交付物”不是额外 Asset ID，而是每个相关资产必须随文件一并提供的验收证据。

| Asset ID | 文件名 | 运行时用途 | 必须准备的真实内容 | 关键验收标准 |
| --- | --- | --- | --- | --- |
| `player-main` | `player/player-main.glb` | GameHub 玩家展示、角色预览和玩家动画 | SkinnedMesh、60–80 根骨骼、idle/walk/run/work/sleep/celebrate/sad/talk、2K PBR、LOD0/1/2、碰撞体 | 网格预算约 15k–25k 面；动画标记 30 FPS；三档播放速度下无跳帧、脚滑、严重穿模或骨骼拉伸 |
| `npc-quest-guild` | `npc/quest-guild.glb` | 任务大厅 NPC、接任务和对话 | NPC 骨骼、idle/walk/talk/work、2K PBR、碰撞包围体 | 任务大厅可加载、点击、对话和工作动画可触发；动画组命名稳定 |
| `landmark-city-core` | `landmarks/city-core.glb` | 城市核心、金融区漫游目标 | PBR 材质、LOD、碰撞体、可点击根节点 | 约 5k–15k 面预算；加载、点击、相机漫游和卸载无错误 |
| `landmark-bank` | `landmarks/bank.glb` | 银行与金融区入口 | PBR、LOD、碰撞体、可点击根节点 | 无缺失纹理；可点击并打开地标详情面板 |
| `landmark-market` | `landmarks/market.glb` | 商业中心 | PBR、LOD、碰撞体、稳定材质槽和可点击根节点 | 商业中心交互、材质、LOD 切换和销毁通过 |
| `landmark-production` | `landmarks/production.glb` | 生产区与生产玩法 | PBR、LOD、碰撞体、可点击根节点和可区分升级版本 | 生产区可点击；升级状态可展示；卸载后无残留节点 |
| `environment-road` | `environment/road-kit.glb` | 道路、路灯和地图拼接 | 模块化道路/路灯、低面数、碰撞、实例化或合批方案 | 模块可重复拼接；移动端 Draw Call 增量受控；碰撞不穿透 |
| `environment-vegetation` | `environment/vegetation-kit.glb` | 农业区植被与水渠 | 植被、水渠、低面数、PBR、实例化兼容和必要碰撞 | 多实例显示稳定；遮挡、碰撞和农业区玩法位置正确 |

### 2.1 每个 GLB 必须附带的交付证据

美术团队交付时应同时提供原始 GLB、文件 SHA-256、MIME、文件大小、glTF 版本、导出工具/版本、授权说明和纹理相对路径清单。角色还要附骨骼数量、AnimationGroup/动画剪辑清单与 30 FPS 说明；建筑和环境要附网格面数、LOD0/1/2、碰撞网格和材质槽报告。

每个文件应先在项目外部的受控交付目录中保存，不要直接把大文件、`.env`、账户凭据或未经审核的原始采样复制进仓库。若文件损坏、缺纹理、缺动画、无碰撞体、无法解析或无法销毁，状态必须保持 `pending-import` 或标记 `rejected`。

## 3. 资产验收顺序

第一步是静态文件验收：确认 SHA-256、MIME 为 `model/gltf-binary`、glTF 版本为 2.0、文件没有截断，且网格、根节点、材质槽和纹理路径均可解析。第二步是视觉和结构验收：检查 PBR 的 Base Color、Normal、Metallic-Roughness，必要时检查 Occlusion、颜色空间、压缩格式、LOD 和碰撞网格。第三步是 Babylon 运行时验收：每个资产至少执行 3 次加载、取消/重试、交互、切换和销毁，确认进度能从 0% 到 100%，取消后没有半模型或永久 loading，卸载后没有节点、纹理、骨骼或粒子残留。

角色需要在 0.5x、1x、2x 下检查 idle、walk、run、work、sleep、celebrate、sad、talk；任务大厅应触发对话动画，生产区应触发工作动画，任务完成和失败应分别触发庆祝与悲伤动画。只有 8 个 Asset ID 都有真实文件、完整证据和运行时回归通过，才能把 manifest 的真实 URL 和状态更新为 `verified`。

## 4. iOS/Android 真机准备清单

### 4.1 设备与软件

每个平台至少准备一台目标真实设备进行首轮验收；正式发布建议增加高端和中低端代表设备，以覆盖不同 GPU 和内存水平。每台设备需要记录准确型号、OS 版本、浏览器版本、GPU/WebGL renderer、屏幕分辨率、devicePixelRatio、横屏方向、电量/温度状态和网络延迟。测试前应关闭无关后台应用，保持电源或记录电量变化，并固定同一游戏 commit、地图、相机位置、NPC 数量和浏览器构建。

| 平台 | 必须准备 | 推荐采集工具 | 报告 source |
| --- | --- | --- | --- |
| iOS/iPadOS | 真实 iPhone 或 iPad、Safari 版本、GPU/renderer、Mac 连接环境 | Safari Web Inspector、项目性能面板、原始 JSON/录屏 | `ios-real` |
| Android | 真实 Android 手机或平板、Chrome 版本、GPU/renderer、USB 调试环境 | Chrome DevTools 远程调试、ADB/系统性能工具、原始 JSON/录屏 | `android-real` |

模拟器、桌面浏览器、`ci-software` 和 `ci-gpu` 结果只能作为流程演练，不能填写成 `ios-real` 或 `android-real`。

### 4.2 每台设备的最低采样矩阵

每个条件至少运行 60 秒，前 10 秒预热，后 50 秒纳入统计。每个条件重复 3 次，并保留每次原始 JSON；最终按中位数汇总。

| 条件 | 采样内容 | 最低重复次数 |
| --- | --- | ---: |
| baseline | 雪层关闭、初始地图、固定相机、固定 NPC 数量 | 3 |
| snow-low | 雪层 low | 3 |
| snow-medium | 雪层 medium | 3 |
| snow-high | 雪层 high | 3 |
| 长时稳定性 | 正常交互、镜头移动、建筑点击、NPC 交互和质量切换 | 连续 10 分钟 |

每次报告应包含平均 FPS、P95 帧时间、掉帧比例、峰值内存、Draw Call、三角形数、加载错误和温度/电量观察。项目建议观察线为 baseline 平均 FPS ≥55、snow 平均 FPS ≥45、P95 帧时间 ≤33.3ms、掉帧比例 ≤5%，并且 10 分钟内存不能持续增长；这些指标必须使用真实设备原始采样支持，不能用估算值填充。

### 4.3 真机验收时必须检查的功能

测试期间需要确认 16:9 横屏布局没有裁切，low/medium/high 可以在不刷新页面的情况下切换，低档位会降低粒子数量、纹理档位和更新频率但不隐藏地图与核心交互。还要验证建筑点击、任务面板、NPC 交互、数据档案、场景切换、网络提示、WebGL 降级页和加载取消路径。若 FPS 逐步下降、内存持续上升、粒子重复叠加、模型重复出现或浏览器被系统杀死，应记录最后 60 秒原始数据和屏幕录制并保持 `pending-device` 或标记失败。

## 5. 推荐准备顺序

最先准备 `player-main`、`npc-quest-guild` 和四个核心地标，因为它们直接决定角色展示、任务大厅、城市导航、银行入口、商业中心和生产区是否能够从占位模型切换到真实资产。随后准备道路、植被和统一纹理库，完成环境密度和移动渲染验证。资产进入稳定验收后，优先在一台 iOS 和一台 Android 真实设备上完成 baseline、snow-low、snow-medium、snow-high 的三轮采样，再扩展到更多代表设备和 10 分钟稳定性测试。

账户侧 Token 轮换不依赖资产或设备，但仍是正式发布安全门禁：旧 Token 必须由账户所有者在 GitHub 设置中撤销，且新凭据不能出现在聊天、仓库、`.env` 或报告中。用户已明确选择不使用 Slack，因此 Slack 不属于当前准备清单。

## 6. 最终完成判定

| 门禁 | 可以标记完成的条件 | 不能替代的证据 |
| --- | --- | --- |
| 真实资产 | 8 个真实 Asset ID 均有真实文件、哈希、PBR/LOD/碰撞/动画或环境证据，Babylon 加载取消销毁回归通过，manifest 更新为真实 URL 和 `verified` | procedural baseline、概念图、CI 测试、桌面截图 |
| iOS 真机 | 每个目标 iOS 设备有 `ios-real` JSON、三轮 baseline/snow 原始采样、设备元数据、P95/FPS/内存/Draw Call 和稳定性记录 | iOS 模拟器、桌面 Safari、`ci-software` |
| Android 真机 | 每个目标 Android 设备有 `android-real` JSON、三轮 baseline/snow 原始采样、设备元数据、P95/FPS/内存/Draw Call 和稳定性记录 | Android 模拟器、桌面 Chrome、`ci-software` |
| 账户安全 | 旧 Token 已撤销，仓库和 PR 无 Token、`.env` 或会话文件 | 仓库扫描通过、sanitized 分支清洁 |

在上述证据全部准备好前，release gate 应继续显示真实资产 `pending-import`、真机性能 `pending-device` 和账户安全 `pending-account-action`。这不是代码故障，而是为了避免把模拟证据误报为正式发布证据。

## 7. 建议的交付包目录

```text
manual-validation/<run-id>/
  asset-evidence/
    player-main.json
    npc-quest-guild.json
    landmark-city-core.json
    landmark-bank.json
    landmark-market.json
    landmark-production.json
    environment-road.json
    environment-vegetation.json
  device-performance/
    ios-<model>-baseline-snow.json
    android-<model>-baseline-snow.json
  screenshots/
  screen-recordings/
  console-logs/
  summary.md
```

原始大文件、屏幕录制和设备调试日志应放在受控外部存储；仓库只保留小型 JSON、哈希、摘要和必要的审计链接。

## 8. 交付包自动校验入口

真实资产和设备证据到位后，可在受控交付目录执行：

```bash
node scripts/validateExternalDeliveryBundle.mjs manual-validation/<run-id>/bundle.json coverage/external-delivery-validation.json
```

校验器要求 8 个 canonical Asset ID 均有真实 GLB、SHA-256、MIME、glTF 2.0、PBR、LOD、碰撞和角色动画证据；同时要求 `ios-real` 与 `android-real` 各自提供 baseline、snow-low、snow-medium、snow-high 四种条件、每种条件 3 次原始样本。缺失文件、路径越界、哈希不匹配、`ci-software` 来源、重复样本或缺少任一条件都会返回非零退出码，并保持 `external-pending`。只有完整证据包通过后，才进入人工 Babylon 运行时复核，校验器本身不会自动修改 manifest 或解除发布门禁。

当前本地验证覆盖完整证据 fixture、缺失设备证据、路径遍历、哈希错误和重复采样；fixture 仅用于测试校验逻辑，不构成真实资产或真实设备证据。

## 9. 交付包安全扫描

校验器还会递归检查证据 JSON 的字段名和值，拒绝 GitHub Token、Slack Webhook、Bearer 凭据、设备序列号/UDID/IMEI、密码、`.env`、`SESSION_PROGRESS.md`、SSH key 和 credentials 文件路径。命中任何敏感模式时，输出只包含字段位置和通用错误，不回显敏感值，并以非零退出码结束。该扫描是上传前的本地安全门禁，不会把真实凭据写入报告或提交历史。
