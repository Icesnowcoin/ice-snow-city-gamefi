# landmark-city-core v001 参考图清单

**用途：** 供城市核心高保真建模、材质和移动端场景构图使用。  
**状态：** reference-only，不是 GLB/PBR 交付证据。

## 用户提供参考

大媒体已上传到 WebDev 私有存储；项目运行时或文档引用应使用下列存储路径，而不是把图片重新放回仓库。

| 文件 | 用途 | 观察结论 |
|---|---|---|
| `reference-city-overview.png` → `/manus-storage/reference-city-overview_1b0c675a.png` | 城市总体构图 | 冰雪城市采用蓝白主调、密集地标、农业区与交通线路共存；城市核心应承担远景视觉锚点。 |
| `reference-immersive-ui.png` → `/manus-storage/reference-immersive-ui_c7fb16e7.png` | 移动横屏交互参考 | 交互按钮、任务、地图、背包和消息入口集中在边缘安全区；建筑本体不能占用 HUD 安全区。 |
| `reference-daylight.png` → `/manus-storage/reference-daylight_841dc8eb.png` | 日景材质与环境光参考 | 日景需要可读的深蓝结构、雪白屋顶和低饱和环境；不能依赖 bloom 才能识别。 |
| `reference-night.png` → `/manus-storage/reference-night_0510cd30.png` | 夜景灯光参考 | 夜景允许蓝紫环境光和暖色功能灯，但功能灯必须分层控制，避免移动端过度发光。 |

## 本轮生成概念参考

| 文件 | 用途 | 结论 |
|---|---|---|
| `city-core-hero.png` → `/manus-storage/city-core-hero_0b6cd13b.png` | 英雄角度 | 确认三层能源环、中央冰晶塔、金色灯带和高台广场的主轮廓。 |
| `city-core-daylight.png` → `/manus-storage/city-core-daylight_3026202a.png` | 建模正向比例 | 确认入口、台阶、环梁、外围雪地和可压缩的模块化基座。 |
| `city-core-levels.png` → `/manus-storage/city-core-levels_80a2d05d.png` | Lv.1–Lv.3 视觉差异 | 确认等级差异应由能源环数量、晶体冠冕和灯光节点表达。 |

## 证据边界

- 参考图和生成概念图只能用于视觉方向、比例讨论和建模验收，不能替代 `landmarks/city-core.glb`。
- 本地大图归档在 `/home/ubuntu/webdev-static-assets/ice-snow-city/landmark-city-core/v001/`，未提交到项目仓库。
- 不得从这些图片生成伪造 SHA-256、设备性能、碰撞、LOD 或许可证证据。
- 真实 GLB 到位后，仍需运行 `pnpm validate:external-delivery`，并保持缺失证据 fail-closed。
