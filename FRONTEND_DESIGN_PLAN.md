# Ice Snow City - 前端设计完整方案

## 📋 项目概述

**项目名称**: Ice Snow City Backend Agent  
**游戏类型**: 城市经营模拟游戏 + 社交分享  
**目标平台**: Web (手游优先)  
**技术栈**: React 19 + Babylon.js/Three.js + Tailwind CSS 4  
**设计风格**: 3D 半写实卡通风格 (Semi-realistic 3D Cartoon)

---

## 🎨 设计系统架构

### 1. 游戏动画系统 (Phase 1)

#### 1.1 技术选型
- **主引擎**: Babylon.js (推荐) 或 Three.js
- **原因**: 
  - Babylon.js: 更好的手机性能、内置物理引擎、更简单的 API
  - Three.js: 更多社区资源、更灵活的自定义

#### 1.2 核心动画类型

| 动画类型 | 描述 | 优先级 | 技术方案 |
|--------|------|-------|--------|
| **角色行走** | 玩家角色在地图上移动 | P0 | 骨骼动画 + IK |
| **角色交互** | NPC 互动、打招呼、工作 | P0 | 关键帧动画 |
| **建筑动画** | 建筑升级、生产、收获 | P1 | Tween + 粒子效果 |
| **天气效果** | 下雪、下雨、日出日落 | P1 | 粒子系统 + 后处理 |
| **UI 动画** | 按钮、弹窗、通知 | P2 | CSS/Framer Motion |
| **过渡动画** | 场景切换、加载 | P2 | Fade/Slide 过渡 |

#### 1.3 动画资源清单

```
animations/
├── characters/
│   ├── idle.glb          # 待机动画
│   ├── walk.glb          # 行走动画
│   ├── run.glb           # 跑步动画
│   ├── work.glb          # 工作动画
│   ├── sleep.glb         # 睡眠动画
│   └── celebrate.glb     # 庆祝动画
├── buildings/
│   ├── farm_harvest.glb  # 农场收获
│   ├── factory_work.glb  # 工厂运作
│   └── shop_open.glb     # 商店营业
└── effects/
    ├── snow.glb          # 下雪粒子
    ├── coins.glb         # 金币飘落
    └── level_up.glb      # 升级特效
```

#### 1.4 实现时间表
- Week 1: Babylon.js 集成 + 基础角色模型加载
- Week 2: 角色行走/交互动画实现
- Week 3: 建筑和环境动画
- Week 4: 特效和优化

---

### 2. 交互式地图系统 (Phase 2)

#### 2.1 地图架构

```
MapSystem/
├── TileMap (网格系统)
│   ├── 宽度: 100 格
│   ├── 高度: 100 格
│   └── 格子大小: 5m × 5m
├── Zones (区域划分)
│   ├── 商业区
│   ├── 住宅区
│   ├── 工业区
│   ├── 农业区
│   ├── 娱乐区
│   └── 中心广场
└── POI (兴趣点)
    ├── NPC 位置
    ├── 建筑位置
    └── 传送点
```

#### 2.2 地图功能清单

| 功能 | 描述 | 实现方式 |
|-----|------|--------|
| **缩放** | 支持 0.5x - 3x 缩放 | 鼠标滚轮/双指捏合 |
| **拖拽** | 平移地图视角 | 鼠标拖拽/触摸滑动 |
| **点击交互** | 选中建筑/NPC | Raycasting 点击检测 |
| **路径规划** | A* 寻路算法 | Babylon.js 路径库 |
| **天气系统** | 动态天气效果 | 粒子系统 + 后处理 |
| **昼夜循环** | 100 倍加速昼夜 | 动态光照 + 天空盒 |
| **小地图** | 右上角小地图 | Canvas 绘制 |

#### 2.3 地图优化策略

- **LOD (细节级别)**: 远处建筑降低模型复杂度
- **视锥剔除**: 只渲染可见区域
- **对象池**: 复用 NPC 和建筑模型
- **纹理压缩**: 使用 WebP 和 ASTC 格式

#### 2.4 实现时间表
- Week 1: 基础地图网格 + 区域划分
- Week 2: 相机控制和缩放
- Week 3: 天气系统和昼夜循环
- Week 4: 优化和小地图

---

### 3. NPC 系统 (Phase 3)

#### 3.1 NPC 数据结构

```typescript
interface NPC {
  id: string;
  name: string;
  avatar: string;              // 3D 模型
  profession: string;          // 职业
  location: Vector3;           // 当前位置
  homeLocation: Vector3;       // 家位置
  workLocation: Vector3;       // 工作位置
  schedule: DailySchedule;     // 日程表
  relationship: number;        // 好感度 (0-100)
  inventory: Item[];           // 背包
  state: NPCState;             // 状态
  dialogue: DialogueTree;      // 对话树
}

interface DailySchedule {
  [time: string]: {
    location: Vector3;
    action: string;
    animation: string;
  };
}
```

#### 3.2 NPC 功能清单

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| **日程系统** | NPC 按时间表活动 | P0 |
| **对话系统** | 多分支对话树 | P0 |
| **任务系统** | NPC 发布日常任务 | P1 |
| **交易系统** | NPC 买卖物品 | P1 |
| **关系系统** | 好感度影响对话 | P1 |
| **AI 行为** | 自主行动和决策 | P2 |
| **表情系统** | 根据情绪显示表情 | P2 |

#### 3.3 NPC 类型 (至少 200 个)

```
分类:
├── 商人 (30 个)
│   ├── 布料商人
│   ├── 食品商人
│   └── 工具商人
├── 工人 (50 个)
│   ├── 农民
│   ├── 工厂工人
│   └── 建筑工人
├── 服务人员 (40 个)
│   ├── 医生
│   ├── 教师
│   └── 餐厅员工
├── 艺术家 (30 个)
│   ├── 画家
│   ├── 音乐家
│   └── 舞蹈家
├── 管理人员 (20 个)
│   ├── 市长
│   ├── 警察
│   └── 消防员
└── 其他 (30 个)
    ├── 旅客
    ├── 学生
    └── 退休人员
```

#### 3.4 实现时间表
- Week 1: NPC 数据结构 + 基础模型加载
- Week 2: 日程系统 + 路径规划
- Week 3: 对话系统 + 交易系统
- Week 4: 关系系统 + AI 行为

---

### 4. 游戏场景和角色系统 (Phase 4)

#### 4.1 游戏场景类型

| 场景类型 | 描述 | 玩法 | 奖励 |
|--------|------|------|------|
| **采矿** | 在矿山采集矿石 | 点击挖矿 | 矿石 + 经验 |
| **农业** | 种植和收获作物 | 管理农场 | 粮食 + 金币 |
| **制造** | 在工厂生产物品 | 管理生产线 | 成品 + 金币 |
| **冒险** | 探索地下城 | 战斗系统 | 宝藏 + 经验 |
| **钓鱼** | 在河边钓鱼 | 时间管理 | 鱼 + 金币 |
| **烹饪** | 在厨房烹饪 | 配方系统 | 食物 + 经验 |

#### 4.2 角色系统

```typescript
interface PlayerCharacter {
  id: string;
  name: string;
  level: number;
  experience: number;
  
  // 属性
  stats: {
    strength: number;      // 力量
    agility: number;       // 敏捷
    intelligence: number;  // 智力
    endurance: number;     // 耐力
  };
  
  // 状态
  health: number;
  stamina: number;         // 体力 (需要食物/水补充)
  hunger: number;
  thirst: number;
  
  // 装备
  equipment: Equipment[];
  inventory: Item[];
  
  // 技能
  skills: Skill[];
  
  // 外观
  appearance: {
    model: string;
    clothing: string;
    accessories: string[];
  };
}
```

#### 4.3 角色自定义

- **头部**: 脸型、肤色、发型、眼睛
- **身体**: 身材、肤色
- **服装**: 衣服、鞋子、配饰
- **表情**: 微笑、严肃、惊讶等

#### 4.4 实现时间表
- Week 1: 场景框架 + 采矿场景
- Week 2: 农业和制造场景
- Week 3: 角色自定义系统
- Week 4: 场景优化和平衡

---

### 5. UI/UX 设计系统 (贯穿所有 Phase)

#### 5.1 UI 层级

```
├── 世界 UI (3D 世界中)
│   ├── NPC 名字标签
│   ├── 建筑信息气泡
│   └── 浮动数字 (伤害/治疗)
├── 屏幕 UI (固定在屏幕上)
│   ├── 顶部栏 (金币、经验、时间)
│   ├── 底部导航 (快捷菜单)
│   ├── 右侧面板 (小地图、任务)
│   └── 中央弹窗 (对话、商店)
└── 系统 UI
    ├── 菜单 (暂停、设置)
    ├── 通知 (任务完成、获得物品)
    └── 加载界面
```

#### 5.2 设计规范

- **颜色**: 冷色调 (蓝白) + 暖色强调
- **字体**: 现代无衬线字体 (Inter, Poppins)
- **间距**: 8px 网格系统
- **圆角**: 8px 标准圆角
- **阴影**: 柔和阴影，增强深度感
- **动画**: 200-300ms 过渡时间

#### 5.3 响应式设计

```
├── 手机 (< 768px)
│   ├── 竖屏优化
│   ├── 大按钮 (最小 48px)
│   └── 简化 UI
├── 平板 (768px - 1024px)
│   ├── 两栏布局
│   └── 平衡的 UI
└── 桌面 (> 1024px)
    ├── 三栏布局
    └── 完整功能
```

---

## 🛠️ 技术实现细节

### 前端文件结构

```
client/src/
├── game/
│   ├── scenes/
│   │   ├── MainScene.tsx        # 主游戏场景
│   │   ├── MiningScene.tsx      # 采矿场景
│   │   └── FarmScene.tsx        # 农业场景
│   ├── characters/
│   │   ├── PlayerCharacter.ts   # 玩家角色
│   │   ├── NPCCharacter.ts      # NPC 角色
│   │   └── CharacterAnimator.ts # 动画控制
│   ├── map/
│   │   ├── GameMap.ts           # 地图系统
│   │   ├── TileManager.ts       # 网格管理
│   │   └── MapRenderer.ts       # 地图渲染
│   ├── npc/
│   │   ├── NPCManager.ts        # NPC 管理
│   │   ├── NPCSchedule.ts       # 日程系统
│   │   └── DialogueSystem.ts    # 对话系统
│   ├── animations/
│   │   ├── AnimationManager.ts  # 动画管理
│   │   ├── ParticleSystem.ts    # 粒子系统
│   │   └── EffectManager.ts     # 特效管理
│   └── physics/
│       ├── PhysicsEngine.ts     # 物理引擎
│       └── Pathfinding.ts       # 寻路算法
├── components/
│   ├── GameCanvas.tsx           # 游戏画布
│   ├── GameUI.tsx               # 游戏 UI 容器
│   ├── HUD/
│   │   ├── Minimap.tsx          # 小地图
│   │   ├── StatusBar.tsx        # 状态栏
│   │   └── QuickMenu.tsx        # 快捷菜单
│   ├── Dialogs/
│   │   ├── NPCDialog.tsx        # NPC 对话框
│   │   ├── ShopDialog.tsx       # 商店对话框
│   │   └── QuestDialog.tsx      # 任务对话框
│   └── Effects/
│       ├── FloatingText.tsx     # 浮动文字
│       └── Notifications.tsx    # 通知系统
└── hooks/
    ├── useGameEngine.ts         # 游戏引擎 Hook
    ├── useCharacter.ts          # 角色 Hook
    ├── useNPC.ts                # NPC Hook
    └── useMap.ts                # 地图 Hook
```

### 后端 API 设计

```typescript
// tRPC 路由
router
  // 游戏场景
  .query('scene.getMiningScene', async ({ ctx }) => {})
  .mutation('scene.mineSomething', async ({ input, ctx }) => {})
  
  // NPC 系统
  .query('npc.getList', async ({ ctx }) => {})
  .query('npc.getSchedule', async ({ input, ctx }) => {})
  .mutation('npc.interact', async ({ input, ctx }) => {})
  .mutation('npc.trade', async ({ input, ctx }) => {})
  
  // 角色系统
  .query('character.getPlayer', async ({ ctx }) => {})
  .mutation('character.updateAppearance', async ({ input, ctx }) => {})
  .mutation('character.levelUp', async ({ input, ctx }) => {})
  
  // 地图系统
  .query('map.getTiles', async ({ input, ctx }) => {})
  .query('map.getWeather', async ({ ctx }) => {})
  .mutation('map.movePlayer', async ({ input, ctx }) => {})
```

---

## 📊 项目时间表

| Phase | 任务 | 预计时间 | 优先级 |
|-------|------|--------|-------|
| 1 | 游戏动画系统 | 4 周 | P0 |
| 2 | 交互式地图 | 4 周 | P0 |
| 3 | NPC 系统 | 4 周 | P0 |
| 4 | 游戏场景和角色 | 4 周 | P1 |
| 5 | 整合和优化 | 2 周 | P1 |
| **总计** | | **18 周** | |

---

## 🎯 成功指标

- ✅ 60+ FPS 帧率 (手机)
- ✅ < 2s 初始加载时间
- ✅ 200+ NPC 角色
- ✅ 6+ 可玩场景
- ✅ 完整的日程系统
- ✅ 流畅的角色动画
- ✅ 响应式 UI 设计

---

## 📝 设计规范文档

### 3D 半写实卡通风格指南

**特征**:
- Q 版比例改良 (头部偏大、身体相对缩小)
- 亚洲审美 (五官精致、眼睛较大)
- 高品质渲染 (现代光照和材质)
- 时尚造型 (现代都市潮流风格)

**参考作品**:
- 《原神》的角色设计
- 《崩坏 3》的 3D 模型
- 《最终幻想 XIV》的美型风格

---

## 🚀 下一步行动

1. **确认设计方案** - 与团队讨论并获得批准
2. **资源采购** - 获取 3D 模型和动画资源
3. **技术选型** - 最终确定 Babylon.js 或 Three.js
4. **原型开发** - 开发 Phase 1 的原型
5. **美术审核** - 所有场景和角色设计需通过美术审核

---

**文档版本**: 1.0  
**最后更新**: 2026-08-02  
**作者**: Manus AI Agent
