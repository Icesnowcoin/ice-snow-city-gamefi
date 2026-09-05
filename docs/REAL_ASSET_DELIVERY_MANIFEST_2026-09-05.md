# Ice Snow City 真实资产交付清单

本清单只登记**待交付或已验证的文件证据**，不把程序化占位模型、概念图或元数据登记视为真实 GLB/PBR 资产。当前仓库未包含这些真实美术文件，因此所有条目均为 `pending-import`。

| Asset ID | 类型 | 目标文件 | 运行时用途 | 必需验收 | 当前状态 |
|---|---|---|---|---|---|
| player-main | 玩家角色 | `player/player-main.glb` | GameHub 玩家展示与角色预览 | SkinnedMesh、60–80 骨骼、idle/walk、PBR、LOD0/1/2 | pending-import |
| npc-quest-guild | NPC | `npc/quest-guild.glb` | 任务大厅荣光使者 | SkinnedMesh、对话待机、walk、PBR、碰撞包围体 | pending-import |
| landmark-city-core | 地标建筑 | `landmarks/city-core.glb` | 城市核心与金融区漫游目标 | PBR、碰撞体、LOD、可点击根节点 | pending-import |
| landmark-bank | 地标建筑 | `landmarks/bank.glb` | 银行/金融区入口 | PBR、LOD、可点击根节点 | pending-import |
| landmark-market | 地标建筑 | `landmarks/market.glb` | 商业中心 | PBR、LOD、可点击根节点 | pending-import |
| landmark-production | 地标建筑 | `landmarks/production.glb` | 生产区 | PBR、LOD、可点击根节点 | pending-import |
| environment-road | 环境 | `environment/road-kit.glb` | 道路与路灯布置 | 模块化拼接、碰撞、低面数 | pending-import |
| environment-vegetation | 环境 | `environment/vegetation-kit.glb` | 农业区植被与水渠 | PBR、实例化兼容、低面数 | pending-import |

## 交付后验证顺序

美术文件交付后，先执行文件哈希、MIME、GLB 解析、根节点和网格数量检查，再通过 `BabylonGameEngine.loadModel` 的 `onProgress`、`AbortSignal`、根节点选择和 `disposeLoadedModel` 契约完成运行时验证。角色资产还必须验证骨骼和动画组；建筑与环境资产必须验证碰撞体、LOD 和材质槽。

任何缺失文件、空网格、骨骼数量超限、动画组缺失、纹理路径失效或无法释放的资源都保持 `pending-import`/`rejected`，不得标记为 `verified`。真实设备性能、艺术评审和最终发布验收分别由性能报告和美术 QA 门禁负责。
