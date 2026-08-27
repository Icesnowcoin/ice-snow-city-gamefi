# Ice Snow City GameFi - 永久记忆系统

## 项目概览
**项目名称**：Ice Snow City（冰雪城市）
**项目类型**：2.5D 现代都市社交模拟经营 GameFi
**核心代币**：ISC (Icesnowcoin)
**开发周期**：2 个月
**目标**：交付完整的试玩版本（MVP）

---

## 📚 核心文档库

### 1. 游戏设计文档
| 文件名 | 描述 | 优先级 |
|--------|------|--------|
| GAME_DESIGN_SPECIFICATION.md | 完整的游戏设计规范 | P0 |
| GAME_SCENES_DESIGN.md | 11 个场景的详细设计 | P0 |
| GAME_STORY_DESIGN.md | 游戏故事和剧情 | P1 |
| GAME_NPC_DESIGN.md | NPC 系统设计 | P0 |
| GLOBAL_NPC_SYSTEM_COMPLETE.md | 200+ NPC 完整库 | P1 |
| LIFE_THEMED_GAME_DESIGN.md | 生活主题游戏设计 | P1 |

### 2. 经济系统文档
| 文件名 | 描述 | 优先级 |
|--------|------|--------|
| ISC_ECONOMIC_SYSTEM.md | ISC 经济系统详解 | P0 |
| NPC_ISC_USAGE_AND_ECONOMIC_IMPACT.md | NPC ISC 使用和经济影响 | P1 |
| NPC_DAILY_TRANSACTIONS_AND_ISC_ALLOCATION.md | NPC 日常交易和 ISC 分配 | P1 |
| PLAYER_ISC_IMPLEMENTATION_GUIDE.md | 玩家 ISC 实现指南 | P0 |
| PLAYER_ISC_INTERACTION_ARCHITECTURE.md | 玩家 ISC 交互架构 | P0 |

### 3. NPC 系统文档
| 文件名 | 描述 | 优先级 |
|--------|------|--------|
| NPC_CHARACTER_GALLERY_COMPLETE.md | 完整的 NPC 角色库 | P1 |
| NPC_PROTOTYPE_LIBRARY_INDEX.md | NPC 原型库索引 | P1 |
| NPC_QUICK_TEMPLATE_LIBRARY.md | NPC 快速模板库 | P1 |
| NPC_RELATIONSHIP_NETWORK_DESIGN.md | NPC 关系网络设计 | P1 |
| NPC_ATTRIBUTES_AND_NAMING_SYSTEM.md | NPC 属性和命名系统 | P1 |
| NPC_VISUAL_DESIGN_AND_CLASSIFICATION.md | NPC 视觉设计和分类 | P1 |

### 4. 技术架构文档
| 文件名 | 描述 | 优先级 |
|--------|------|--------|
| GAME_FRONTEND_ARCHITECTURE.md | 前端架构设计 | P0 |
| BACKEND_INTEGRATION_PLAN.md | 后端集成计划 | P0 |
| GAME_INTERNAL_VS_BLOCKCHAIN_INTERACTION.md | 游戏内部与区块链交互 | P0 |
| NPC_ISC_INTERACTION_ARCHITECTURE.md | NPC ISC 交互架构 | P0 |
| NPC_WALLET_AND_ISC_STORAGE_ARCHITECTURE.md | NPC 钱包和 ISC 存储架构 | P0 |

### 5. 区块链集成文档
| 文件名 | 描述 | 优先级 |
|--------|------|--------|
| PLAYER_BEARS_GAS_FEE_MODEL.md | 玩家承担 Gas 费用模型 | P2 |
| USDT_GAS_FEE_STRATEGY.md | USDT Gas 费用策略 | P2 |
| GAS_FEE_MANAGEMENT_STRATEGY.md | Gas 费用管理策略 | P2 |

### 6. 部署和运维文档
| 文件名 | 描述 | 优先级 |
|--------|------|--------|
| DEPLOYMENT_GUIDE.md | 部署指南 | P1 |
| PRODUCTION_DEPLOYMENT_CHECKLIST.md | 生产部署检查清单 | P1 |
| OPERATIONS_GUIDE.md | 运维指南 | P1 |
| SECURITY_AUDIT_CHECKLIST.md | 安全审计检查清单 | P1 |
| SECURITY_AUDIT_REPORT.md | 安全审计报告 | P1 |

### 7. 项目管理文档
| 文件名 | 描述 | 优先级 |
|--------|------|--------|
| TWO_MONTH_DEVELOPMENT_PLAN.md | 两个月开发计划 | P0 |
| PROJECT_SUMMARY.md | 项目总结 | P1 |
| FINAL_DELIVERY_SUMMARY.md | 最终交付总结 | P1 |
| PERFORMANCE_REPORT.md | 性能报告 | P1 |
| DEPLOYMENT_VERIFICATION_REPORT.md | 部署验证报告 | P1 |

### 8. 系统文档
| 文件名 | 描述 | 优先级 |
|--------|------|--------|
| SYSTEM_OVERVIEW.md | 系统概览 | P0 |
| API_DOCUMENTATION.md | API 文档 | P0 |
| README.md | 项目 README | P0 |

---

## 🗂️ 代码结构

### 后端代码
```
server/
├── routers.ts                    # tRPC 路由（主入口）
├── routers/
│   ├── game.ts                   # 游戏系统 tRPC 过程
│   ├── npc.ts                    # NPC 系统 tRPC 过程
│   ├── economy.ts                # 经济系统 tRPC 过程
│   └── ...
├── db.ts                         # 数据库查询助手
├── db.game.ts                    # 游戏数据库助手
└── _core/
    ├── index.ts                  # 服务器入口
    ├── context.ts                # tRPC 上下文
    ├── trpc.ts                   # tRPC 配置
    ├── llm.ts                    # LLM 集成
    ├── imageGeneration.ts        # 图像生成
    ├── voiceTranscription.ts     # 语音转文本
    ├── notification.ts           # 通知系统
    └── ...
```

### 前端代码
```
client/src/
├── App.tsx                       # 主应用入口
├── pages/
│   ├── GameDashboard.tsx         # 游戏仪表板
│   ├── NPCInteraction.tsx        # NPC 交互
│   ├── TasksPage.tsx             # 任务系统
│   ├── ShopPage.tsx              # 商城系统
│   ├── WalletPage.tsx            # 钱包管理
│   ├── PlayerProfile.tsx         # 玩家资料
│   ├── RealEstatePage.tsx        # 房地产系统
│   └── AgriculturePage.tsx       # 农业系统
├── components/
│   ├── layout/
│   │   ├── GameLayout.tsx        # 游戏主布局
│   │   └── DashboardLayout.tsx   # 仪表板布局
│   ├── game/
│   │   ├── RTSGameEngine.tsx     # RTS 游戏引擎
│   │   └── IsometricGame.tsx     # 等距游戏
│   └── ui/                       # shadcn/ui 组件
├── hooks/
│   ├── useGameData.ts            # 游戏数据 hooks
│   └── ...
├── lib/
│   ├── trpc.ts                   # tRPC 客户端
│   ├── i18n.ts                   # 国际化
│   └── ...
└── contexts/
    ├── ThemeContext.tsx          # 主题上下文
    └── LanguageContext.tsx       # 语言上下文
```

### 数据库
```
drizzle/
├── schema.ts                     # 原始 schema
├── schema.game.ts                # 游戏 schema（新增）
├── migrations/
│   ├── 0001_initial.sql          # 初始迁移
│   └── 0002_game_tables.sql      # 游戏表迁移
└── relations.ts                  # 关系定义
```

---

## 🎮 游戏系统架构

### 核心系统
1. **玩家系统** - 玩家资料、属性、资产管理
2. **NPC 系统** - 200+ NPC、对话、关系、任务
3. **经济系统** - ISC 货币、交易、价格、库存
4. **场景系统** - 11 个场景、导航、交互
5. **任务系统** - 任务发布、完成、奖励
6. **房产系统** - 购买、出租、投资
7. **农业系统** - 种植、养殖、收获
8. **社交系统** - 关系、婚姻、好友
9. **银行系统** - 存款、贷款、利息
10. **市场系统** - 玩家交易、价格动态

### 11 个主要场景
1. ISC 去中心化银行
2. ISC 广场
3. ISC 社区工会大厅
4. 咖啡店
5. 书店
6. 超级市场
7. 农场
8. 居民楼
9. 商场
10. 4S 店
11. 公园

---

## 📊 开发进度

### 已完成（Week 1-2）
- [x] 游戏设计文档完成
- [x] 前端框架搭建
- [x] 后端基础设置
- [x] tRPC 集成
- [x] 数据库 schema 设计
- [x] 8 个前端页面
- [x] RTS 游戏引擎

### 进行中（Week 3-4）
- [ ] 数据库迁移执行
- [ ] tRPC 游戏过程实现
- [ ] 前端 tRPC 集成
- [ ] 核心场景实现

### 待做（Week 5-12）
- [ ] 所有场景实现
- [ ] NPC 系统完成
- [ ] 经济系统完成
- [ ] 测试和优化
- [ ] 区块链集成
- [ ] 部署和上线

---

## 🔑 关键设计决策

### 1. 游戏风格
**决策**：3D 半写实卡通风格（Semi-realistic 3D Cartoon Style）
**理由**：结合亚洲审美，适合现代都市主题，视觉吸引力强

### 2. 经济系统
**决策**：ISC 作为唯一货币和治理代币
**理由**：简化经济系统，强化区块链集成，便于管理

### 3. NPC 系统
**决策**：200+ 全球化 NPC，每个都有独特故事
**理由**：增加游戏深度和可重玩性，提升社交互动

### 4. 数据存储
**决策**：NPC ISC 以数据形式存在，不真实持有
**理由**：避免市场冲击和 bug 风险，便于管理

### 5. 开发方法
**决策**：敏捷开发，两个月交付 MVP
**理由**：快速验证市场反馈，灵活调整功能

---

## 📝 命名规范

### 数据库表
- `players` - 玩家表
- `npcs` - NPC 表
- `player_npc_relationships` - 玩家-NPC 关系表
- `player_tasks` - 玩家任务表
- `player_inventory` - 玩家背包表
- `properties` - 房产表
- `farms` - 农场表
- `businesses` - 商业表
- `wallet_transactions` - 钱包交易表
- `market_listings` - 市场挂单表

### tRPC 路由
- `game.player.*` - 玩家相关
- `game.npc.*` - NPC 相关
- `game.economy.*` - 经济相关
- `game.scene.*` - 场景相关
- `game.task.*` - 任务相关

### React 组件
- `pages/` - 页面级组件
- `components/` - 可复用组件
- `hooks/` - 自定义 hooks
- `contexts/` - React contexts

---

## 🚀 快速参考

### 添加新 NPC
1. 在 `GLOBAL_NPC_SYSTEM_COMPLETE.md` 中定义 NPC
2. 在 `server/db.game.ts` 中创建 NPC 数据
3. 在 `server/routers/game.ts` 中添加 NPC 交互逻辑
4. 在前端页面中调用 `useGameData` hooks

### 添加新场景
1. 在 `GAME_SCENES_DESIGN.md` 中设计场景
2. 在数据库中创建场景记录
3. 创建新的 React 页面组件
4. 在 `App.tsx` 中添加路由
5. 在 `GameLayout.tsx` 中添加导航

### 添加新系统
1. 设计系统架构文档
2. 在 `drizzle/schema.game.ts` 中定义数据模型
3. 在 `server/routers/game.ts` 中实现 tRPC 过程
4. 在前端创建相应的 hooks 和页面
5. 编写单元测试

---

## 📞 联系信息

**项目管理**：按照 `TWO_MONTH_DEVELOPMENT_PLAN.md` 推进
**技术支持**：参考 `API_DOCUMENTATION.md` 和 `SYSTEM_OVERVIEW.md`
**问题反馈**：更新 `todo.md` 并标记为 [ ] 待做项

---

## 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| v0.1 | 2026-06-23 | 初始项目设置和文档 |
| v0.2 | 进行中 | 后端 API 实现 |
| v1.0 | 预计 8 周 | 试玩版本发布 |

---

**最后更新**：2026-06-23
**下一步**：执行 `TWO_MONTH_DEVELOPMENT_PLAN.md` 中的 Week 3-4 计划
