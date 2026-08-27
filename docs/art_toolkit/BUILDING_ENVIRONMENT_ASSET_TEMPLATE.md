# 建筑/环境资产卡模板

## 资产身份

| 字段 | 内容 |
|---|---|
| Asset ID | `building-<category>-<name>-<version>` |
| 类别 | residential / commercial / production / public / environment |
| 功能 | 住宅、交易、生产、公共服务或装饰 |
| 升级等级 | level 1 / level 2 / level 3 |
| 资产状态 | catalogued / pending-import / verified |

## 视觉与玩法规格

| 项目 | 记录内容 |
|---|---|
| 等距轮廓 | 说明远景可识别的屋顶、入口和主色块 |
| 升级差异 | 说明灯带、幕墙、绿化、招牌、设备或公共空间变化 |
| 入口/交互点 | 标记门、生产点、收获点和玩家站位 |
| 可走区域 | walkable / non-walkable / interactive |
| 材质 | glass、metal、concrete、ice、snow、vegetation 等 PBR 预设 |
| 环境变体 | day、night、snow-fog 的光照和特效差异 |

## 技术交付

| 检查项 | 目标 |
|---|---|
| GLB | `building-<category>-<name>-lod0.glb`，并提供 LOD1/LOD2 |
| 面数 | 建筑 5k–15k tris；环境道具按距离预算 |
| 纹理 | 建筑 2K–4K；运行时优先 KTX2/WebP、压缩并保留 mipmap |
| 碰撞体 | 盒体/凸包组合，不把高模网格直接作为碰撞体 |
| 动画 | door-open、production、harvest，目标 30 FPS |
| 特效 | smoke、ice-blue-pulse；需提供粒子数量和生命周期 |
| 性能 | 运行时纹理和内存预算通过 textureOptimization |
| 导航 | 与地图 walkable 标记、路径网格和区块边界一致 |

## 验收签名

设计：____　技术美术：____　客户端：____　关卡：____　日期：____　最终状态：____
