# 冰雪城市 GameFi 项目 - 完整知识库

## 📋 项目概述

**项目名称：** Ice Snow City (ISC) - 模拟人生 + 模拟经营 + GameFi  
**项目路径：** `/home/ubuntu/ice_snow_city_agent`  
**技术栈：** React 19 + Tailwind 4 + Express 4 + tRPC 11 + Solidity  
**目标链：** BSC (Binance Smart Chain)  
**当前版本：** Phase 1 MVP  

---

## ✅ 已完成的核心工作

### 1. 游戏逻辑架构（完成度：100%）
- **文件：** `server/game-logic/types.ts`, `reducer.ts`, `services.ts`
- **特点：**
  - 中央 GameState 管理（Reducer 模式）
  - 30+ 游戏操作（工作、消费、升级、交易等）
  - 8 个 Service 类（玩家、NPC、经济、任务、房地产、农业、商城、时间）
  - 85 个单元测试 + 集成测试全部通过
  - 完整的游戏时间循环系统

### 2. 后端 API 集成（完成度：100%）
- **文件：** `server/routers/gameCore.ts`, `server/routers.ts`
- **特点：**
  - tRPC 路由完整集成（15+ 操作）
  - 游戏状态查询接口
  - 游戏操作变更接口
  - 玩家数据接口
  - NPC 交互接口

### 3. 前端 UI 框架（完成度：95%）
- **文件：** `client/src/pages/`, `client/src/components/`
- **已完成：**
  - GameDashboard（游戏仪表板）
  - PlayerProfile（玩家资料）
  - WalletPage（钱包系统）
  - NPCInteraction（NPC 交互）
  - TasksPage（任务系统）
  - ShopPage（商城系统）
  - RealEstatePage（房地产系统）
  - AgriculturePage（农业系统）
  - SplashScreen（开场动画 - 需要重新生成）

### 4. 游戏系统实现（完成度：80%）
- **工作系统：** 5 种职业，每种职业有不同的工资和工作时间
- **消费系统：** 日常消费（食物、娱乐、医疗等），消耗 > 产出驱动质押
- **升级系统：** 经验升级，每级提升属性
- **银行系统：** 存款、取款、利息（ISC 质押收益）
- **NPC 系统：** 200+ NPC 设计，交互系统
- **任务系统：** 任务接受、完成、奖励
- **游戏时间：** 日/月/年循环，影响游戏事件

### 5. 美术资源（完成度：40%）
- **已生成（P0）：**
  - 4 个场景：冰雪城市、街道、农场、住宅区
  - 5 个玩家角色：商人、农民、工人、医生、工程师
  - 所有资源已上传到 S3 CDN

- **待生成（P1）：**
  - 20+ NPC 角色
  - 6 个建筑
  - 30+ UI 图标
  - 15 个消费品

- **待生成（P2）：**
  - 动画和特效
  - 音效和音乐

---

## ⚠️ 待完成的关键工作

### Phase 1 MVP（优先级：P0）

#### 1. 开场动画重新生成
**状态：** 需要重新生成  
**参数：**
- 视角：等距视图 3D（Isometric）
- 风格：卡通现代（类似《原神》《崩坏星穹铁道》）
- 人物：
  - 地产大亨（男性，西装，自信气质）
  - 美女秘书 × 2（专业装扮，亚洲审美）
- 背景：冰雪城市 + 现代建筑 + 极光 + 霓虹灯
- 配置：豪车（兰博基尼风格）
- 文本：ISC Logo + "ICE SNOW CITY" + "BUILD YOUR EMPIRE" + 进度条
- 分辨率：16:9 横屏（手机横屏优化）
- 颜色：青色 + 白色 + 深蓝色 + 霓虹粉色

**实现步骤：**
1. 使用 `generate_image` 生成新的开场动画
2. 上传到 S3（使用 `manus-upload-file --webdev`）
3. 更新 `client/src/components/SplashScreen.tsx` 中的图片 URL
4. 测试显示效果

#### 2. 修复部署错误
**状态：** pnpm lockfile 配置不匹配  
**解决方案：**
```bash
cd /home/ubuntu/ice_snow_city_agent
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
```

#### 3. 游戏状态数据库持久化
**状态：** 未开始  
**需要完成：**
- 创建 `game_states` 表（保存玩家的完整游戏状态）
- 实现 `saveGameState()` 函数
- 实现 `loadGameState()` 函数
- 实现自动保存中间件（每 5-10 分钟）
- 实现游戏状态版本控制

**数据库表结构：**
```sql
CREATE TABLE game_states (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  state_json LONGTEXT NOT NULL,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (user_id)
);
```

#### 4. 智能合约部署
**状态：** 未开始  
**需要完成：**
- GameCoin (GC) ERC20 合约
- CharacterNFT ERC721 合约
- 部署到 BSC 测试网
- 前端钱包集成

**合约参数：**
- GameCoin 总供应：无限增发
- CharacterNFT 初始供应：100 个创世角色
- 目标链：BSC 测试网（https://testnet.bscscan.com）

### Phase 2（优先级：P1）
- 玩家间交易系统
- NFT 市场
- 质押挖矿
- 社交系统（结婚、合伙经营）

### Phase 3（优先级：P2）
- UGC 内容系统
- DAO 治理
- 跨链资产互通

---

## 🎨 视觉设计指南

### 色彩方案
```
主色：Cyan (#00D9FF)
辅色：Deep Blue (#001A4D)
强调色：Neon Pink (#FF00FF)
背景：Black (#000000)
文字：White (#FFFFFF)
```

### 字体
- 标题：Bold Sans-serif
- 正文：Regular Sans-serif
- 数字：Monospace

### 图标风格
- 等距视图
- 现代极简
- 3D 卡通

---

## 📁 项目文件结构

```
ice_snow_city_agent/
├── client/
│   ├── src/
│   │   ├── pages/           # 游戏页面
│   │   ├── components/      # UI 组件
│   │   ├── hooks/           # React Hooks
│   │   ├── contexts/        # React Context
│   │   ├── lib/             # 工具函数
│   │   └── App.tsx          # 主应用
│   ├── index.html           # HTML 入口
│   └── public/              # 静态资源
├── server/
│   ├── game-logic/          # 游戏逻辑核心
│   │   ├── types.ts         # 类型定义
│   │   ├── reducer.ts       # 状态管理
│   │   ├── services.ts      # 业务逻辑
│   │   ├── workSystem.ts    # 工作系统
│   │   ├── consumptionSystem.ts # 消费系统
│   │   └── *.test.ts        # 测试文件
│   ├── routers/             # tRPC 路由
│   │   ├── gameCore.ts      # 游戏核心路由
│   │   └── index.ts         # 路由聚合
│   ├── db.ts                # 数据库查询
│   ├── storage.ts           # 文件存储
│   └── _core/               # 框架代码
├── drizzle/
│   ├── schema.ts            # 数据库 schema
│   └── migrations/          # 数据库迁移
├── shared/                  # 共享代码
├── webdev-static-assets/    # 美术资源
│   ├── scenes/              # 场景图片
│   ├── characters/          # 角色图片
│   └── splash_opening_*.png # 开场动画
├── todo.md                  # 任务清单
├── GAMEFI_DEVELOPMENT_ROADMAP.md  # 开发路线图
├── ART_GENERATION_PLAN.md   # 美术计划
└── package.json             # 项目配置
```

---

## 🔧 关键 tRPC 路由

```typescript
// 游戏状态查询
trpc.game.core.getState.query()
trpc.game.core.getPlayerStats.query()
trpc.game.core.getWalletBalance.query()

// 游戏操作
trpc.game.core.gainExperience.mutate({ amount })
trpc.game.core.interactWithNPC.mutate({ npcId, type })
trpc.game.core.bankDeposit.mutate({ amount })
trpc.game.core.bankWithdraw.mutate({ amount })
trpc.game.core.claimInterest.mutate()
trpc.game.core.acceptTask.mutate({ taskId })
trpc.game.core.completeTask.mutate({ taskId })
trpc.game.core.advanceTime.mutate({ minutes })
```

---

## 📊 经济模型参数

### 双代币系统
- **ISC（治理代币）：** 总供应 202.6M，用于质押、分红、投票
- **GC（游戏币）：** 无限增发，用于日常消费

### 消费与产出
- **日常消费：** 120 GC/天（食物、娱乐、医疗等）
- **工作收入：** 100 GC/天（平均）
- **设计目的：** 消费 > 产出，驱动玩家质押 ISC 获得利息

### 质押收益
- **质押 ISC：** 获得 GC 利息
- **利息计算：** 基础利息 + ISC 质押量加成
- **最小利息：** 1 ISC

---

## 🚀 部署步骤

### 1. 修复部署错误
```bash
cd /home/ubuntu/ice_snow_city_agent
pnpm install --no-frozen-lockfile
```

### 2. 重新生成开场动画
- 使用 `generate_image` 工具生成新的开场动画
- 上传到 S3：`manus-upload-file --webdev splash_opening_final.png`
- 更新 SplashScreen.tsx 中的 URL

### 3. 运行测试
```bash
pnpm test
```

### 4. 发布到生产
- 点击 Manus UI 中的 "Publish" 按钮
- 等待部署完成（2-5 分钟）
- 访问生产 URL

---

## 📝 重要笔记

### 已知问题
1. **开场动画不符合参数** - 需要重新生成（等距视图 + 地产大亨 + 美女秘书）
2. **部署失败** - pnpm lockfile 配置不匹配（需要 `--no-frozen-lockfile`）
3. **API 错误** - 某些字符串验证错误（需要调查）

### 设计决策
1. **链上链下平衡：**
   - 链下：日常交互（移动、工作、社交）< 100ms
   - 链上：资产交易（购买房产、交易物品）3-5s
   - 锚定：每日/周批量上链

2. **经济防护：**
   - 消费 > 产出（120 > 100）
   - 强制储蓄 → ISC 质押 → 利息收益
   - 土地/房产限量发行 → 资产升值预期

3. **美术风格：**
   - 等距视图（Isometric）
   - 3D 卡通风格
   - 统一的人物设计（亚洲审美 + 现代时尚）

---

## 🔗 相关资源

- **GitHub 参考项目：**
  - FarmSim2800 - 模拟经营玩法
  - Dwarfity-NFT - NFT 繁殖机制
  - Open-GameFi - GameFi 框架
  - ConnexionContract - 经济系统合约

- **文档：**
  - GAMEFI_DEVELOPMENT_ROADMAP.md - 完整开发路线图
  - ART_GENERATION_PLAN.md - 美术资源计划
  - ISC_CONTRACT_ANALYSIS.md - ISC 合约分析

---

## 📞 快速参考

**项目启动：**
```bash
cd /home/ubuntu/ice_snow_city_agent
pnpm dev
```

**运行测试：**
```bash
pnpm test
```

**生成美术资源：**
```bash
manus-upload-file --webdev /path/to/image.png
```

**查看开发日志：**
```bash
tail -100 .manus-logs/devserver.log
```

---

**最后更新：** 2026-06-30  
**项目版本：** 1e471047  
**完成度：** Phase 1 MVP ~70%
