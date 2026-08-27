# Ice Snow City - 游戏前端架构设计

## 概述

Ice Snow City 是一款现代化都市模拟经营游戏，玩家可以购买土地、开店、经商、进行房地产开发、种植农作物等。前端架构需要支持复杂的游戏系统、实时数据同步和丰富的交互体验。

## 系统架构

### 1. 核心模块结构

```
client/src/
├── pages/                    # 页面组件
│   ├── GameDashboard.tsx    # 游戏主仪表板
│   ├── PlayerProfile.tsx    # 玩家资料
│   ├── Wallet.tsx           # 钱包管理
│   ├── NPCInteraction.tsx   # NPC 交互
│   ├── TaskSystem.tsx       # 任务系统
│   ├── Shop.tsx             # 商城
│   ├── RealEstate.tsx       # 房地产系统
│   ├── Agriculture.tsx      # 农业系统
│   ├── Banking.tsx          # 银行系统
│   ├── Trading.tsx          # 交易系统
│   └── Settings.tsx         # 设置
├── components/
│   ├── game/                # 游戏特定组件
│   │   ├── NPCCard.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── TaskCard.tsx
│   │   ├── CropCard.tsx
│   │   └── NPCRelationshipGraph.tsx
│   ├── ui/                  # UI 基础组件
│   ├── layout/              # 布局组件
│   │   └── GameLayout.tsx
│   └── common/              # 通用组件
├── contexts/
│   ├── GameContext.tsx      # 游戏全局状态
│   ├── PlayerContext.tsx    # 玩家状态
│   ├── EconomyContext.tsx   # 经济系统状态
│   └── NPCContext.tsx       # NPC 系统状态
├── hooks/
│   ├── usePlayer.ts         # 玩家数据 hook
│   ├── useWallet.ts         # 钱包 hook
│   ├── useNPC.ts            # NPC 交互 hook
│   ├── useTask.ts           # 任务系统 hook
│   ├── useEconomy.ts        # 经济数据 hook
│   └── useRealTime.ts       # 实时数据同步 hook
├── lib/
│   ├── gameEngine.ts        # 游戏引擎
│   ├── economyCalculator.ts # 经济计算
│   └── npcAI.ts             # NPC AI 逻辑
└── constants/
    ├── gameConfig.ts        # 游戏配置
    ├── economyRules.ts      # 经济规则
    └── npcData.ts           # NPC 数据
```

### 2. 数据流架构

```
玩家操作 → React 组件 → tRPC 调用 → 后端服务 → 数据库
   ↑                                              ↓
   └──────── WebSocket 实时更新 ←──────────────┘
```

### 3. 状态管理

使用 React Context + tRPC 的组合方案：

- **全局状态**：GameContext（游戏配置、系统状态）
- **玩家状态**：PlayerContext（玩家信息、资产、成就）
- **经济状态**：EconomyContext（市场价格、供需、指数）
- **NPC 状态**：NPCContext（NPC 列表、关系、状态）
- **实时数据**：通过 tRPC 查询和 WebSocket 订阅

## 页面设计

### 1. 游戏主仪表板 (GameDashboard)

**功能**：
- 玩家资产概览（ISC 余额、房产、农场等）
- 快速导航到各个系统
- 实时经济数据展示
- NPC 活动提示

**组件**：
- 资产卡片（总资产、ISC 余额、房产数量）
- 快速操作按钮
- 经济指数图表
- NPC 活动列表

### 2. 玩家资料 (PlayerProfile)

**功能**：
- 玩家基本信息
- 成就和排名
- 社交信息
- 游戏统计

**组件**：
- 玩家头像和基本信息
- 成就徽章
- 排名展示
- 社交关系

### 3. 钱包管理 (Wallet)

**功能**：
- ISC 余额显示
- 充值和提现
- 交易历史
- Gas 费用管理

**组件**：
- 余额卡片
- 充值/提现表单
- 交易记录表格
- Gas 费用计算器

### 4. NPC 交互 (NPCInteraction)

**功能**：
- NPC 列表和搜索
- NPC 详情页面
- NPC 任务发布
- NPC 商业交易

**组件**：
- NPC 列表卡片
- NPC 详情模态框
- 对话系统
- 交易界面

### 5. 任务系统 (TaskSystem)

**功能**：
- 任务列表
- 任务详情
- 任务完成
- 奖励领取

**组件**：
- 任务卡片
- 任务详情页面
- 进度条
- 奖励展示

### 6. 商城 (Shop)

**功能**：
- 商品列表
- 商品搜索和筛选
- 购买流程
- 库存管理

**组件**：
- 商品卡片
- 购物车
- 结账流程
- 订单历史

### 7. 房地产系统 (RealEstate)

**功能**：
- 土地购买
- 建筑建设
- 房产出租
- 房产管理

**组件**：
- 地图视图
- 房产卡片
- 建筑选择
- 出租管理

### 8. 农业系统 (Agriculture)

**功能**：
- 农作物种植
- 收获管理
- 农产品销售
- 农场统计

**组件**：
- 农场视图
- 作物卡片
- 种植界面
- 销售界面

### 9. 银行系统 (Banking)

**功能**：
- ISC 存入
- 利息计算
- 提取资金
- 投资管理

**组件**：
- 账户信息
- 存取界面
- 利息计算器
- 投资组合

### 10. 交易系统 (Trading)

**功能**：
- 玩家间交易
- 市场价格
- 交易历史
- 交易统计

**组件**：
- 交易列表
- 价格图表
- 交易表单
- 交易确认

## 核心 Hook 设计

### usePlayer Hook

```typescript
interface UsePlayerReturn {
  player: Player | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (data: Partial<Player>) => Promise<void>;
  getAchievements: () => Promise<Achievement[]>;
  getRanking: () => Promise<Ranking>;
}
```

### useWallet Hook

```typescript
interface UseWalletReturn {
  balance: string;
  transactions: Transaction[];
  loading: boolean;
  deposit: (amount: string) => Promise<void>;
  withdraw: (amount: string) => Promise<void>;
  getTransactionHistory: () => Promise<Transaction[]>;
}
```

### useNPC Hook

```typescript
interface UseNPCReturn {
  npcs: NPC[];
  selectedNPC: NPC | null;
  loading: boolean;
  getNPCList: () => Promise<NPC[]>;
  selectNPC: (id: string) => void;
  interactWithNPC: (action: string) => Promise<void>;
  getRelationship: (npcId: string) => Promise<Relationship>;
}
```

### useTask Hook

```typescript
interface UseTaskReturn {
  tasks: Task[];
  loading: boolean;
  getTasks: () => Promise<Task[]>;
  completeTask: (taskId: string) => Promise<void>;
  claimReward: (taskId: string) => Promise<void>;
}
```

### useEconomy Hook

```typescript
interface UseEconomyReturn {
  prices: PriceData;
  indices: EconomyIndex;
  loading: boolean;
  getPrices: () => Promise<PriceData>;
  getIndices: () => Promise<EconomyIndex>;
  getMarketTrends: () => Promise<MarketTrend[]>;
}
```

## 数据模型

### Player

```typescript
interface Player {
  id: string;
  name: string;
  avatar: string;
  level: number;
  experience: number;
  iscBalance: string;
  totalAssets: string;
  joinedAt: Date;
  lastActiveAt: Date;
  achievements: Achievement[];
  statistics: PlayerStatistics;
}
```

### NPC

```typescript
interface NPC {
  id: string;
  name: string;
  avatar: string;
  profession: string;
  location: string;
  relationship: number;
  status: "available" | "busy" | "offline";
  dailyTasks: Task[];
  tradingGoods: TradeGood[];
}
```

### Task

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  type: "npc" | "daily" | "achievement";
  reward: Reward;
  progress: number;
  status: "available" | "in_progress" | "completed";
  deadline?: Date;
}
```

### Property

```typescript
interface Property {
  id: string;
  location: string;
  type: "residential" | "commercial" | "agricultural";
  size: number;
  owner: string;
  rentalIncome?: string;
  status: "owned" | "rented" | "available";
  buildings: Building[];
}
```

### Crop

```typescript
interface Crop {
  id: string;
  name: string;
  type: string;
  plantedAt: Date;
  harvestAt: Date;
  quantity: number;
  status: "growing" | "ready" | "harvested";
  yield: number;
}
```

## UI 主题系统

### 色彩方案

**深色主题**（默认）：
- 背景：#0f0f0f
- 卡片：#1a1a1a
- 文本：#ffffff
- 强调色：#00d4ff（冰蓝）

**浅色主题**：
- 背景：#ffffff
- 卡片：#f5f5f5
- 文本：#000000
- 强调色：#0099cc（深蓝）

### 字体系统

- 标题：Inter Bold 24px
- 副标题：Inter SemiBold 18px
- 正文：Inter Regular 14px
- 标签：Inter Medium 12px

## 国际化系统

支持中文和英文，使用 i18n 库管理翻译。

**翻译文件结构**：
```
locales/
├── zh.json
└── en.json
```

## 性能优化

1. **代码分割**：每个页面使用 React.lazy 进行动态导入
2. **缓存策略**：使用 tRPC 的缓存机制减少 API 调用
3. **虚拟滚动**：长列表使用虚拟滚动提高性能
4. **图片优化**：使用 WebP 格式和响应式图片
5. **状态优化**：使用 Context 而不是全局状态管理库

## 安全考虑

1. **认证**：使用 Manus OAuth 进行用户认证
2. **授权**：在前端和后端都进行权限检查
3. **数据验证**：使用 Zod 进行输入验证
4. **加密**：敏感数据使用 HTTPS 传输
5. **XSS 防护**：使用 React 的自动转义

## 开发流程

### 1. 创建新页面

```bash
# 1. 在 pages/ 目录创建新文件
# 2. 定义页面组件和数据模型
# 3. 在 App.tsx 中添加路由
# 4. 编写对应的 Hook
# 5. 创建相关的 UI 组件
# 6. 编写测试
```

### 2. 添加新功能

```bash
# 1. 在后端定义 tRPC 路由
# 2. 在前端创建对应的 Hook
# 3. 在页面中使用 Hook
# 4. 添加 UI 组件
# 5. 测试集成
```

### 3. 测试

- 单元测试：Vitest
- 集成测试：Vitest + React Testing Library
- E2E 测试：Playwright

## 下一步

1. ✅ 创建游戏前端架构文档（本文档）
2. ⏳ 创建游戏主布局和导航
3. ⏳ 实现玩家仪表板
4. ⏳ 实现钱包管理系统
5. ⏳ 实现 NPC 交互系统
6. ⏳ 实现任务系统
7. ⏳ 实现商城系统
8. ⏳ 实现房地产系统
9. ⏳ 实现农业系统
10. ⏳ 实现银行系统
