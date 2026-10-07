# NPC ISC 交互系统 - 技术架构与实现方案

**文档版本**: 1.0  
**日期**: 2026-06-20  
**作者**: Manus AI  
**状态**: 技术可行性分析与实现规划

---

## 1. 技术可行性评估

### 1.1 当前系统能力分析

#### ✅ **已有的核心基础设施**

1. **数据库层** (Drizzle ORM + MySQL)
   - 完整的数据持久化能力
   - 支持复杂查询和事务
   - 支持加密存储（已实现 AES-256-GCM）
   - 支持审计日志记录

2. **区块链集成** (BSC 智能合约)
   - ISC 代币合约已部署
   - 智能合约事件监听已实现
   - 交易记录已完整存储

3. **API 层** (tRPC + Express)
   - 完整的 REST/RPC API 框架
   - 用户认证和授权系统
   - 实时数据推送能力
   - 速率限制和安全防护

4. **业务逻辑层**
   - 事件监听系统（EventListenerService）
   - 审计日志系统（已加密）
   - 速率限制系统（已实现）
   - 加密系统（AES-256-GCM）

#### ⚠️ **需要扩展的部分**

1. **NPC 数据模型** - 需要创建 NPC 表和相关数据结构
2. **NPC 经济系统** - 需要实现 NPC 的 ISC 账户和交易逻辑
3. **NPC 行为系统** - 需要实现 NPC 的日常活动和任务系统
4. **NPC 交互系统** - 需要实现玩家与 NPC 的交互接口
5. **NPC 状态管理** - 需要实现 NPC 的状态和关系追踪

---

## 2. NPC ISC 交互核心逻辑架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      玩家 (Player)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────┐          ┌──────────────┐
   │  玩家账户    │          │  NPC 账户     │
   │  (ISC)      │          │  (ISC)       │
   └─────────────┘          └──────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   ISC 交易引擎          │
        │  (Transaction Engine)   │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  区块链层 (BSC)          │
        │  ISC 智能合约           │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   审计日志系统          │
        │  (Encrypted Audit Log)  │
        └────────────────────────┘
```

### 2.2 核心交互流程

#### **流程 1: NPC 提供服务获得 ISC**

```
玩家 → 请求服务 → NPC 处理 → 生成交易 → 区块链确认 → ISC 转账 → 审计记录
```

**具体步骤**:
1. 玩家调用 `npc.requestService(npcId, serviceType, params)`
2. 系统验证玩家权限和 NPC 可用性
3. 执行服务逻辑（如银行交易、商品购买等）
4. 生成 ISC 交易记录
5. 调用区块链合约转账 ISC
6. 记录审计日志（加密存储）
7. 返回交易结果给玩家

#### **流程 2: 玩家支付 ISC 给 NPC**

```
玩家 → 选择 NPC → 确认交易 → 签名 → 区块链转账 → NPC 接收 → 审计记录
```

**具体步骤**:
1. 玩家调用 `npc.payNPC(npcId, amount, reason)`
2. 系统验证玩家 ISC 余额
3. 生成交易数据
4. 调用区块链合约执行转账
5. 更新 NPC 账户余额
6. 记录审计日志
7. 触发 NPC 反应事件

#### **流程 3: NPC 日常经济活动**

```
定时任务 → 检查 NPC 状态 → 执行经济行为 → 生成交易 → 更新账户 → 审计记录
```

**具体步骤**:
1. 系统定时（每小时/每天）检查 NPC 状态
2. 根据 NPC 类型和配置执行经济行为：
   - 消费 ISC（购买生活用品、支付租金）
   - 投资 ISC（进行投资活动）
   - 积累财富（储蓄）
3. 生成交易记录
4. 更新 NPC 账户余额
5. 记录审计日志

---

## 3. 数据库设计

### 3.1 NPC 主表 (npc_profiles)

```sql
CREATE TABLE npc_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  npcId VARCHAR(64) UNIQUE NOT NULL,           -- 全局唯一 NPC ID
  name VARCHAR(128) NOT NULL,                  -- NPC 名字
  nameEn VARCHAR(128),                         -- 英文名字
  profession VARCHAR(64) NOT NULL,             -- 职业分类
  professionCategory VARCHAR(32) NOT NULL,     -- 职业大类
  region VARCHAR(64),                          -- 地区
  country VARCHAR(64),                         -- 国家
  age INT,                                     -- 年龄
  gender ENUM('male', 'female', 'other'),     -- 性别
  
  -- 外观描述
  appearance TEXT,                             -- 3D 模型描述
  
  -- 个性特征 (五大人格)
  openness INT,                                -- 开放性 (1-5)
  conscientiousness INT,                       -- 尽责性 (1-5)
  extraversion INT,                            -- 外向性 (1-5)
  agreeableness INT,                           -- 亲和性 (1-5)
  neuroticism INT,                             -- 神经质 (1-5)
  
  -- 工作信息
  workplace VARCHAR(128),                      -- 工作地点
  workStartTime TIME,                          -- 工作开始时间
  workEndTime TIME,                            -- 工作结束时间
  
  -- 经济地位
  economicStatus ENUM('poor', 'working', 'middle', 'rich'),
  
  -- 状态
  status ENUM('active', 'inactive', 'vacation') DEFAULT 'active',
  
  -- 时间戳
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.2 NPC 账户表 (npc_accounts)

```sql
CREATE TABLE npc_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  npcId VARCHAR(64) UNIQUE NOT NULL,           -- 关联 NPC
  walletAddress VARCHAR(42) NOT NULL,          -- BSC 钱包地址
  iscBalance VARCHAR(78) NOT NULL DEFAULT '0', -- ISC 余额 (大数字)
  totalEarned VARCHAR(78) NOT NULL DEFAULT '0', -- 总收入
  totalSpent VARCHAR(78) NOT NULL DEFAULT '0',  -- 总支出
  
  -- 经济指标
  monthlyIncome VARCHAR(78),                   -- 月均收入
  monthlyExpense VARCHAR(78),                  -- 月均支出
  
  -- 投资信息
  investmentBalance VARCHAR(78) DEFAULT '0',  -- 投资余额
  investmentReturn VARCHAR(78) DEFAULT '0',   -- 投资回报
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (npcId) REFERENCES npc_profiles(npcId)
);
```

### 3.3 NPC 交易表 (npc_transactions)

```sql
CREATE TABLE npc_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  txId VARCHAR(128) UNIQUE NOT NULL,           -- 交易 ID
  npcId VARCHAR(64) NOT NULL,                  -- NPC ID
  playerId VARCHAR(64),                        -- 玩家 ID (可选)
  
  -- 交易类型
  txType ENUM(
    'service_income',      -- 提供服务收入
    'service_expense',     -- 购买服务支出
    'player_payment',      -- 玩家支付
    'player_receive',      -- 玩家接收
    'investment',          -- 投资
    'daily_expense',       -- 日常支出
    'salary',              -- 工资
    'bonus'                -- 奖金
  ) NOT NULL,
  
  amount VARCHAR(78) NOT NULL,                 -- 交易金额
  description TEXT,                            -- 交易描述
  
  -- 区块链信息
  txHash VARCHAR(66),                          -- 交易哈希
  blockNumber BIGINT,                          -- 区块号
  
  -- 状态
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  
  -- 时间戳
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP
);
```

### 3.4 NPC 关系表 (npc_relationships)

```sql
CREATE TABLE npc_relationships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  npcId1 VARCHAR(64) NOT NULL,                 -- NPC 1
  npcId2 VARCHAR(64) NOT NULL,                 -- NPC 2
  
  -- 关系类型
  relationshipType ENUM(
    'friend',              -- 朋友
    'colleague',           -- 同事
    'competitor',          -- 竞争对手
    'family',              -- 家人
    'business_partner'     -- 商业伙伴
  ) NOT NULL,
  
  -- 关系强度 (1-10)
  strength INT DEFAULT 5,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.5 玩家-NPC 关系表 (player_npc_relationships)

```sql
CREATE TABLE player_npc_relationships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playerId VARCHAR(64) NOT NULL,               -- 玩家 ID
  npcId VARCHAR(64) NOT NULL,                  -- NPC ID
  
  -- 关系类型
  relationshipStatus ENUM(
    'stranger',            -- 陌生人
    'acquaintance',        -- 熟人
    'friend',              -- 朋友
    'close_friend',        -- 亲密朋友
    'business_partner'     -- 商业伙伴
  ) DEFAULT 'stranger',
  
  -- 关系强度 (0-100)
  relationshipScore INT DEFAULT 0,
  
  -- 交互统计
  interactionCount INT DEFAULT 0,
  lastInteractionAt TIMESTAMP,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 4. 核心业务逻辑实现

### 4.1 NPC 服务类 (server/services/npcService.ts)

```typescript
import { db } from "../db";
import { npcProfiles, npcAccounts, npcTransactions } from "../../drizzle/schema";
import { encryptionService } from "../_core/encryption";
import { auditLogService } from "../_core/auditLog";

export class NPCService {
  /**
   * 获取 NPC 信息
   */
  async getNPCProfile(npcId: string) {
    const npc = await db
      .select()
      .from(npcProfiles)
      .where(eq(npcProfiles.npcId, npcId))
      .limit(1);
    
    return npc[0] || null;
  }

  /**
   * 获取 NPC 账户
   */
  async getNPCAccount(npcId: string) {
    const account = await db
      .select()
      .from(npcAccounts)
      .where(eq(npcAccounts.npcId, npcId))
      .limit(1);
    
    return account[0] || null;
  }

  /**
   * NPC 提供服务获得 ISC
   * 
   * @param npcId - NPC ID
   * @param playerId - 玩家 ID
   * @param serviceType - 服务类型
   * @param amount - ISC 金额
   */
  async npcProvideService(
    npcId: string,
    playerId: string,
    serviceType: string,
    amount: string
  ) {
    try {
      // 1. 验证 NPC 存在
      const npc = await this.getNPCProfile(npcId);
      if (!npc) throw new Error("NPC not found");

      // 2. 获取 NPC 账户
      const npcAccount = await this.getNPCAccount(npcId);
      if (!npcAccount) throw new Error("NPC account not found");

      // 3. 创建交易记录
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(npcTransactions).values({
        txId,
        npcId,
        playerId,
        txType: "service_income",
        amount,
        description: `Service provided: ${serviceType}`,
        status: "pending",
      });

      // 4. 调用区块链合约转账 ISC
      // 这里调用 BSC 智能合约的转账函数
      const txHash = await this.transferISCToNPC(
        npcAccount.walletAddress,
        amount
      );

      // 5. 更新交易状态
      await db
        .update(npcTransactions)
        .set({
          txHash,
          status: "success",
          completedAt: new Date(),
        })
        .where(eq(npcTransactions.txId, txId));

      // 6. 更新 NPC 账户余额
      const newBalance = BigInt(npcAccount.iscBalance) + BigInt(amount);
      await db
        .update(npcAccounts)
        .set({
          iscBalance: newBalance.toString(),
          totalEarned: (BigInt(npcAccount.totalEarned) + BigInt(amount)).toString(),
        })
        .where(eq(npcAccounts.npcId, npcId));

      // 7. 记录审计日志（加密）
      await auditLogService.logAction({
        userId: npcId,
        action: "NPC_SERVICE_PROVIDED",
        resource: "npc_transactions",
        resourceId: txId,
        status: "success",
        details: {
          playerId,
          serviceType,
          amount,
          txHash,
        },
      });

      return {
        success: true,
        txId,
        txHash,
        newBalance: newBalance.toString(),
      };
    } catch (error) {
      console.error("NPC service provision failed:", error);
      throw error;
    }
  }

  /**
   * 玩家支付 ISC 给 NPC
   */
  async playerPayNPC(
    playerId: string,
    npcId: string,
    amount: string,
    reason: string
  ) {
    try {
      // 1. 验证 NPC 存在
      const npc = await this.getNPCProfile(npcId);
      if (!npc) throw new Error("NPC not found");

      // 2. 获取 NPC 账户
      const npcAccount = await this.getNPCAccount(npcId);
      if (!npcAccount) throw new Error("NPC account not found");

      // 3. 创建交易记录
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(npcTransactions).values({
        txId,
        npcId,
        playerId,
        txType: "player_payment",
        amount,
        description: reason,
        status: "pending",
      });

      // 4. 调用区块链合约转账
      const txHash = await this.transferISCToNPC(
        npcAccount.walletAddress,
        amount
      );

      // 5. 更新交易状态
      await db
        .update(npcTransactions)
        .set({
          txHash,
          status: "success",
          completedAt: new Date(),
        })
        .where(eq(npcTransactions.txId, txId));

      // 6. 更新 NPC 账户
      const newBalance = BigInt(npcAccount.iscBalance) + BigInt(amount);
      await db
        .update(npcAccounts)
        .set({
          iscBalance: newBalance.toString(),
        })
        .where(eq(npcAccounts.npcId, npcId));

      // 7. 更新玩家-NPC 关系
      await this.updatePlayerNPCRelationship(playerId, npcId, 5);

      // 8. 记录审计日志
      await auditLogService.logAction({
        userId: playerId,
        action: "PLAYER_PAID_NPC",
        resource: "npc_transactions",
        resourceId: txId,
        status: "success",
        details: {
          npcId,
          amount,
          reason,
          txHash,
        },
      });

      return {
        success: true,
        txId,
        txHash,
        npcNewBalance: newBalance.toString(),
      };
    } catch (error) {
      console.error("Player payment to NPC failed:", error);
      throw error;
    }
  }

  /**
   * NPC 日常经济活动
   */
  async npcDailyEconomicActivity(npcId: string) {
    try {
      const npc = await this.getNPCProfile(npcId);
      if (!npc) throw new Error("NPC not found");

      const account = await this.getNPCAccount(npcId);
      if (!account) throw new Error("NPC account not found");

      // 根据 NPC 类型和经济地位执行不同的经济行为
      const activities = [];

      // 1. 日常消费（购买生活用品）
      if (npc.economicStatus === "rich") {
        const dailyExpense = BigInt(account.monthlyExpense || "0") / BigInt(30);
        if (dailyExpense > 0n) {
          const txId = await this.createDailyExpenseTransaction(
            npcId,
            dailyExpense.toString(),
            "Daily living expenses"
          );
          activities.push({ type: "daily_expense", txId });
        }
      }

      // 2. 投资活动（高级 NPC）
      if (npc.profession === "Investment Advisor" || npc.profession === "Merchant") {
        const investmentAmount = BigInt(account.iscBalance) / BigInt(10);
        if (investmentAmount > 0n) {
          const txId = await this.createInvestmentTransaction(
            npcId,
            investmentAmount.toString()
          );
          activities.push({ type: "investment", txId });
        }
      }

      // 3. 储蓄（积累财富）
      // NPC 的财富会自动积累

      return {
        success: true,
        npcId,
        activities,
        currentBalance: account.iscBalance,
      };
    } catch (error) {
      console.error("NPC daily economic activity failed:", error);
      throw error;
    }
  }

  /**
   * 转账 ISC 给 NPC
   */
  private async transferISCToNPC(toAddress: string, amount: string): Promise<string> {
    // 调用 BSC 智能合约的转账函数
    // 这里假设已有区块链集成模块
    const blockchainService = require("../services/blockchainService");
    return blockchainService.transferISC(toAddress, amount);
  }

  /**
   * 创建日常支出交易
   */
  private async createDailyExpenseTransaction(
    npcId: string,
    amount: string,
    description: string
  ): Promise<string> {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(npcTransactions).values({
      txId,
      npcId,
      txType: "daily_expense",
      amount,
      description,
      status: "success",
      completedAt: new Date(),
    });

    // 更新账户余额
    const account = await this.getNPCAccount(npcId);
    if (account) {
      const newBalance = BigInt(account.iscBalance) - BigInt(amount);
      await db
        .update(npcAccounts)
        .set({
          iscBalance: newBalance.toString(),
          totalSpent: (BigInt(account.totalSpent) + BigInt(amount)).toString(),
        })
        .where(eq(npcAccounts.npcId, npcId));
    }

    return txId;
  }

  /**
   * 创建投资交易
   */
  private async createInvestmentTransaction(
    npcId: string,
    amount: string
  ): Promise<string> {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(npcTransactions).values({
      txId,
      npcId,
      txType: "investment",
      amount,
      description: "Investment activity",
      status: "success",
      completedAt: new Date(),
    });

    // 更新投资余额
    const account = await this.getNPCAccount(npcId);
    if (account) {
      const newInvestmentBalance = BigInt(account.investmentBalance || "0") + BigInt(amount);
      await db
        .update(npcAccounts)
        .set({
          investmentBalance: newInvestmentBalance.toString(),
        })
        .where(eq(npcAccounts.npcId, npcId));
    }

    return txId;
  }

  /**
   * 更新玩家-NPC 关系
   */
  private async updatePlayerNPCRelationship(
    playerId: string,
    npcId: string,
    scoreIncrease: number
  ) {
    // 查询现有关系
    const existing = await db
      .select()
      .from(playerNPCRelationships)
      .where(
        and(
          eq(playerNPCRelationships.playerId, playerId),
          eq(playerNPCRelationships.npcId, npcId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // 更新现有关系
      const newScore = Math.min(100, existing[0].relationshipScore + scoreIncrease);
      const newStatus = this.getRelationshipStatus(newScore);
      
      await db
        .update(playerNPCRelationships)
        .set({
          relationshipScore: newScore,
          relationshipStatus: newStatus,
          interactionCount: existing[0].interactionCount + 1,
          lastInteractionAt: new Date(),
        })
        .where(
          and(
            eq(playerNPCRelationships.playerId, playerId),
            eq(playerNPCRelationships.npcId, npcId)
          )
        );
    } else {
      // 创建新关系
      await db.insert(playerNPCRelationships).values({
        playerId,
        npcId,
        relationshipScore: scoreIncrease,
        relationshipStatus: "acquaintance",
        interactionCount: 1,
        lastInteractionAt: new Date(),
      });
    }
  }

  /**
   * 根据分数获取关系状态
   */
  private getRelationshipStatus(score: number): string {
    if (score < 10) return "stranger";
    if (score < 30) return "acquaintance";
    if (score < 60) return "friend";
    if (score < 80) return "close_friend";
    return "business_partner";
  }
}

export const npcService = new NPCService();
```

### 4.2 NPC 定时任务 (server/jobs/npcDailyJob.ts)

```typescript
import { npcService } from "../services/npcService";
import { db } from "../db";
import { npcProfiles } from "../../drizzle/schema";

/**
 * 每天执行一次 NPC 经济活动
 */
export async function runNPCDailyJob() {
  try {
    console.log("[NPC Daily Job] Starting...");

    // 获取所有活跃的 NPC
    const activeNPCs = await db
      .select()
      .from(npcProfiles)
      .where(eq(npcProfiles.status, "active"));

    // 为每个 NPC 执行日常经济活动
    for (const npc of activeNPCs) {
      try {
        await npcService.npcDailyEconomicActivity(npc.npcId);
        console.log(`[NPC Daily Job] Completed for NPC: ${npc.name}`);
      } catch (error) {
        console.error(`[NPC Daily Job] Failed for NPC ${npc.npcId}:`, error);
      }
    }

    console.log("[NPC Daily Job] Completed");
  } catch (error) {
    console.error("[NPC Daily Job] Failed:", error);
  }
}
```

### 4.3 tRPC 路由 (server/routers/npcRouter.ts)

```typescript
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { npcService } from "../services/npcService";

export const npcRouter = router({
  /**
   * 获取 NPC 信息
   */
  getProfile: publicProcedure
    .input(z.object({ npcId: z.string() }))
    .query(async ({ input }) => {
      return npcService.getNPCProfile(input.npcId);
    }),

  /**
   * 获取 NPC 账户信息
   */
  getAccount: publicProcedure
    .input(z.object({ npcId: z.string() }))
    .query(async ({ input }) => {
      return npcService.getNPCAccount(input.npcId);
    }),

  /**
   * 玩家支付 ISC 给 NPC
   */
  payNPC: protectedProcedure
    .input(
      z.object({
        npcId: z.string(),
        amount: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return npcService.playerPayNPC(
        ctx.user.openId,
        input.npcId,
        input.amount,
        input.reason
      );
    }),

  /**
   * NPC 提供服务
   */
  requestService: protectedProcedure
    .input(
      z.object({
        npcId: z.string(),
        serviceType: z.string(),
        amount: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return npcService.npcProvideService(
        input.npcId,
        ctx.user.openId,
        input.serviceType,
        input.amount
      );
    }),
});
```

---

## 5. 实现时间表

| 阶段 | 任务 | 时间 | 优先级 |
|------|------|------|--------|
| Phase 1 | 创建 NPC 数据库表 | 1-2 天 | 高 |
| Phase 2 | 实现 NPC 服务类 | 2-3 天 | 高 |
| Phase 3 | 实现 tRPC 路由 | 1-2 天 | 高 |
| Phase 4 | 实现定时任务 | 1 天 | 中 |
| Phase 5 | 前端 UI 集成 | 3-5 天 | 中 |
| Phase 6 | 测试和优化 | 2-3 天 | 高 |
| Phase 7 | 部署到生产 | 1 天 | 高 |

---

## 6. 技术栈总结

| 层 | 技术 | 状态 |
|----|------|------|
| 数据库 | MySQL + Drizzle ORM | ✅ 已有 |
| 区块链 | BSC + Web3.js | ✅ 已有 |
| API | tRPC + Express | ✅ 已有 |
| 加密 | AES-256-GCM | ✅ 已有 |
| 审计 | Encrypted Audit Log | ✅ 已有 |
| 定时任务 | Node.js Scheduler | ✅ 已有 |
| 速率限制 | express-rate-limit | ✅ 已有 |

---

## 7. 结论

**✅ 技术可行性: 完全可行**

当前系统架构已具备所有必要的基础设施支持 NPC ISC 交互系统的实现。主要工作集中在：

1. **数据模型设计** - 创建 NPC 相关的数据表
2. **业务逻辑实现** - 实现 NPC 经济交互逻辑
3. **API 集成** - 通过 tRPC 暴露 NPC 交互接口
4. **定时任务** - 实现 NPC 日常经济活动
5. **前端集成** - 构建 NPC 交互 UI

**预计完成时间**: 2-3 周

**风险等级**: 低（所有依赖项都已就位）

---

**文档版本**: 1.0  
**最后更新**: 2026-06-20  
**作者**: Manus AI
