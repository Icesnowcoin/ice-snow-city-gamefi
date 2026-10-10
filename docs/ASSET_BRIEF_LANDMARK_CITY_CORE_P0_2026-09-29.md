# P0 高保真资产 Brief：城市核心地标

**Asset ID：** `landmark-city-core`  
**目标文件：** `landmarks/city-core.glb`  
**运行时用途：** GameHub 初始区域城市核心、城市第一条路线任务的视觉锚点、金融区漫游目标  
**状态：** `brief-ready / external-asset-pending`  
**证据边界：** 本文是可执行设计与验收规格，不代表真实 GLB、PBR 贴图或真机验证已经交付。

## 1. 资产目标

让玩家在移动横屏、轻微俯视的 16:9 镜头下，能够在 1–2 秒内识别城市核心的位置、功能和升级等级。地标应成为全场景的视觉中心，但不能依赖高面数或大量透明材质才能成立。

**核心识别点：**

- 冰晶六角核心塔 + 环形城市能源光环；
- 深蓝金属结构、雪白屋顶积雪、少量 ISC 金色导航灯；
- 面向主广场的可点击入口和任务交互点；
- 夜景暖色功能灯与冰蓝环境光形成冷暖对比；
- Lv.1–Lv.3 通过塔顶结构、光环层数和金色功能灯密度体现升级，不通过简单整体变色代替。

## 2. 视觉与比例规格

| 项目 | 规格 |
|---|---|
| 风格 | 3D 半写实卡通，干净切面，适度夸张轮廓 |
| 建议占地 | 18m × 18m，主塔高度 22m |
| 建议镜头 | 轻微俯视、移动横屏、场景远景仍可读 |
| 主色 | 冰蓝、雪白、蓝灰；功能灯使用金色/暖橙 |
| 雪层 | 屋顶、檐口、环梁上表面积雪；边缘有厚度和方向性，不做全表面白色覆盖 |
| PBR | Base Color、Normal、Roughness、Metallic、AO；透明材质数量受控 |
| 轮廓 | 远景保留六角塔顶、环形光环和主入口三组识别形状 |

## 3. 几何与移动端预算

| 版本 | 三角形预算 | 用途 |
|---|---:|---|
| LOD0 | 12k–15k | 近距离查看、点击建筑、升级展示 |
| LOD1 | 6k–8k | 主场景常规距离 |
| LOD2 | 2k–3k | 远景与小地图附近 |
| 碰撞体 | 6–10 个简化体 | 主塔、环梁、入口台阶和不可穿越边界 |
| 材质槽 | ≤ 4 | 结构、玻璃/冰、雪、发光功能灯 |
| 纹理 | 2–3 张 2048 或图集 | 尽量共享城市建筑材质库 |

**禁止：** 高模直接作为碰撞体；将每一盏灯拆成独立材质；使用无用途的默认节点；在 LOD1/LOD2 保留近景装饰小件。

## 4. 节点与命名契约

```text
landmark_city_core_root
├── landmark_city_core_lod0
├── landmark_city_core_lod1
├── landmark_city_core_lod2
├── landmark_city_core_collision
│   ├── collision_core
│   ├── collision_ring
│   └── collision_entry
├── landmark_city_core_interaction
│   ├── interaction_main
│   └── spawn_camera_city_core
├── landmark_city_core_fx
│   ├── fx_energy_ring
│   └── fx_warm_lights
└── landmark_city_core_socket
    ├── socket_quest_marker
    └── socket_upgrade_effect
```

根节点必须可被 Babylon.js 点击流程稳定识别；LOD、碰撞、交互点和特效挂点不能依赖导出器生成的随机编号。

## 5. 材质与雪层要求

- **结构材质：** 蓝灰金属，Metallic 约 0.75–0.9，Roughness 约 0.28–0.42；避免镜面高光吞没轮廓。
- **冰晶/玻璃材质：** 冷蓝半透明或折射效果只用于核心塔少量区域；必须提供不透明降级表现。
- **雪材质：** 雪白偏冷，Roughness 约 0.78–0.92，Normal 细节低频优先；积雪边界遵循屋顶法线和重力方向。
- **功能灯：** 金色/暖橙发光，仅用于入口、能源环和任务挂点；必须可在低质量模式关闭 bloom。
- **纹理命名：** `city_core_struct_*`、`city_core_ice_*`、`city_core_snow_*`、`city_core_fx_*`。

## 6. 等级变体

| 等级 | 外观差异 | 运行时反馈 |
|---|---|---|
| Lv.1 | 单层能源环、基础入口灯、少量雪檐 | 基础城市核心状态 |
| Lv.2 | 双层能源环、塔顶增加晶体翼、入口灯增强 | 升级成功粒子与等级飘字 |
| Lv.3 | 三层能源环、塔顶完整冠冕、主广场暖光增强 | 完工/满级光环，但不能遮挡交互 UI |

升级差异必须来自独立网格或材质参数，确保可在移动端按等级切换，不重复加载三份完整高模。

## 7. 交互与动画挂点

- 点击根节点打开地标详情面板；
- `interaction_main` 作为任务/金融区入口命中点；
- `socket_quest_marker` 用于“点亮城市第一条路线”任务标记；
- `socket_upgrade_effect` 用于建筑升级视觉反馈；
- `fx_energy_ring` 支持启用、停机、危机状态的低成本开关；
- 若 GLB 不含建筑动画，允许由 Babylon.js 运行时驱动光环旋转、灯光脉冲和门部件开合，但必须保留静态降级画面。

## 8. 交付包结构

```text
art-delivery/landmark-city-core/v001-brief/
├── city-core.glb
├── textures/
├── screenshots/
├── technical-report.json
├── license-record.md
├── sha256.json
└── asset-brief.md
```

真实文件交付前不得创建伪造的 `city-core.glb`、哈希或设备报告来关闭门禁。可以继续使用现有 procedural-baseline 进行 UI、交互和加载流程开发，但必须保持 `procedural-baseline` 标签。

## 9. 验收矩阵

### 艺术验收

- [ ] 远景轮廓能识别六角核心塔、能源环和入口；
- [ ] 色彩符合冰蓝/雪白/蓝灰主色与少量金色功能灯规范；
- [ ] 雪层有结构逻辑、厚度和方向性；
- [ ] Lv.1–Lv.3 有可解释的几何/灯光差异；
- [ ] 与银行、商业中心和生产设施形成清晰轮廓差异。

### 技术验收

- [ ] GLB/glTF 2.0 可解析，MIME、SHA-256 和来源记录完整；
- [ ] LOD0/LOD1/LOD2、材质槽、纹理尺寸和节点命名符合预算；
- [ ] 碰撞体简化且不使用高模网格；
- [ ] Babylon.js 可加载、点击、切换 LOD、挂载特效并释放；
- [ ] 缺失纹理、关闭 bloom、低质量模式存在可用降级；
- [ ] 无 Token、Webhook、设备序列号、个人路径或未授权第三方素材。

### 设备验收

- [ ] 在真实 iOS/Android 或设备云上采集 baseline/snow 对比；
- [ ] 记录 FPS、P95 帧时间、内存、Draw Calls、首屏和稳定性；
- [ ] 设备证据通过 schema、敏感字段扫描和性能分析器；
- [ ] 只有完成设备证据后，才可申请 `device-validated` 或 `verified`。

## 10. 下一步执行

1. 将本 Brief 发给建模/技术美术执行，先产出灰盒和比例截图。
2. 在 Babylon.js 中用现有 baseline 验证入口、交互点、摄像机目标和升级特效挂点。
3. 收到真实 GLB 后运行 `pnpm validate:external-delivery`，补充 SHA-256、技术报告和验收证据。
4. 真实资产、真实设备和许可证证据齐全前，保持 manifest 为 `pending-import`。
