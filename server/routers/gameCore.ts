import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * 游戏核心系统 tRPC 路由
 * 包含玩家、NPC、经济、场景等核心游戏系统
 */

// ============================================================================
// PLAYER SYSTEM
// ============================================================================

export const playerRouter = router({
  /**
   * 获取玩家信息
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    // 模拟玩家数据（后续连接数据库）
    return {
      id: ctx.user.id,
      username: ctx.user.email?.split("@")[0] || "Player",
      level: 5,
      experience: 1250,
      stamina: 85,
      maxStamina: 100,
      hunger: 70,
      thirst: 65,
      happiness: 75,
      health: 95,
      money: 50000, // ISC
      bankBalance: 25000, // ISC in bank
      currentScene: "home",
      maritalStatus: "single",
      createdAt: Date.now(),
    };
  }),

  /**
   * 更新玩家属性
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().optional(),
        stamina: z.number().min(0).max(100).optional(),
        hunger: z.number().min(0).max(100).optional(),
        thirst: z.number().min(0).max(100).optional(),
        happiness: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 模拟更新（后续连接数据库）
      return {
        success: true,
        message: "Profile updated successfully",
        data: { ...input },
      };
    }),

  /**
   * 获取玩家等级和经验
   */
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    return {
      level: 5,
      experience: 1250,
      nextLevelExp: 2000,
      expProgress: (1250 / 2000) * 100,
      achievements: [
        { id: "first_login", name: "首次登录", unlocked: true },
        { id: "first_trade", name: "首次交易", unlocked: true },
        { id: "first_farm", name: "首次种植", unlocked: false },
      ],
    };
  }),

  /**
   * 增加经验
   */
  addExperience: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        experienceAdded: input.amount,
        newExperience: 1250 + input.amount,
      };
    }),
});

// ============================================================================
// NPC SYSTEM
// ============================================================================

export const npcRouter = router({
  /**
   * 获取当前场景的 NPC 列表
   */
  getNpcsByScene: protectedProcedure
    .input(z.object({ scene: z.string() }))
    .query(async ({ input }) => {
      // 模拟 NPC 数据
      const npcsByScene: Record<string, any[]> = {
        bank: [
          {
            id: "npc_001",
            name: "李行长",
            title: "Bank Manager",
            profession: "banker",
            avatar: "https://via.placeholder.com/100?text=李行长",
            currentScene: "bank",
            affinity: 50,
            status: "acquaintance",
          },
          {
            id: "npc_002",
            name: "王柜员",
            title: "Bank Teller",
            profession: "banker",
            avatar: "https://via.placeholder.com/100?text=王柜员",
            currentScene: "bank",
            affinity: 30,
            status: "stranger",
          },
        ],
        plaza: [
          {
            id: "npc_003",
            name: "陈广场管理员",
            title: "Plaza Manager",
            profession: "manager",
            avatar: "https://via.placeholder.com/100?text=陈管理员",
            currentScene: "plaza",
            affinity: 40,
            status: "acquaintance",
          },
          {
            id: "npc_004",
            name: "刘商人",
            title: "Merchant",
            profession: "merchant",
            avatar: "https://via.placeholder.com/100?text=刘商人",
            currentScene: "plaza",
            affinity: 60,
            status: "friend",
          },
        ],
        cafe: [
          {
            id: "npc_005",
            name: "李咖啡师",
            title: "Barista",
            profession: "barista",
            avatar: "https://via.placeholder.com/100?text=李咖啡师",
            currentScene: "cafe",
            affinity: 45,
            status: "acquaintance",
          },
        ],
      };

      return npcsByScene[input.scene] || [];
    }),

  /**
   * 与 NPC 交互
   */
  interactWithNpc: protectedProcedure
    .input(
      z.object({
        npcId: z.string(),
        action: z.enum(["greet", "talk", "trade", "gift", "romance"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 模拟 NPC 交互
      const dialogues: Record<string, string> = {
        greet: "你好！很高兴见到你！",
        talk: "最近怎么样？有什么我可以帮助你的吗？",
        trade: "你想交易什么？",
        gift: "谢谢你的礼物！我很喜欢！",
        romance: "你对我很特别...",
      };

      return {
        success: true,
        npcId: input.npcId,
        action: input.action,
        dialogue: dialogues[input.action],
        affinityChange: input.action === "gift" ? 10 : 5,
        newAffinity: 55,
      };
    }),

  /**
   * 获取 NPC 关系
   */
  getNpcRelationship: protectedProcedure
    .input(z.object({ npcId: z.string() }))
    .query(async ({ input }) => {
      return {
        npcId: input.npcId,
        affinity: 55,
        intimacy: 30,
        status: "friend",
        interactionCount: 12,
        lastInteraction: Date.now() - 3600000,
      };
    }),

  /**
   * 获取所有 NPC 列表
   */
  getAllNpcs: protectedProcedure.query(async () => {
    // 返回 50+ NPC 的基础数据
    const npcs = [];
    for (let i = 1; i <= 50; i++) {
      npcs.push({
        id: `npc_${String(i).padStart(3, "0")}`,
        name: `NPC ${i}`,
        profession: ["banker", "merchant", "farmer", "barista", "doctor"][
          i % 5
        ],
        affinity: Math.floor(Math.random() * 100),
        status: ["stranger", "acquaintance", "friend"][i % 3],
      });
    }
    return npcs;
  }),
});

// ============================================================================
// ECONOMY SYSTEM
// ============================================================================

export const economyRouter = router({
  /**
   * 获取玩家钱包信息
   */
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    return {
      playerId: ctx.user.id,
      balance: 50000, // ISC
      bankBalance: 25000, // ISC in bank
      totalAssets: 75000, // ISC
      apy: 0.05, // 5% annual percentage yield
      monthlyInterest: (25000 * 0.05) / 12,
      lastInterestDate: Date.now() - 86400000,
    };
  }),

  /**
   * 充值
   */
  deposit: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        amount: input.amount,
        newBalance: 50000 - input.amount,
        newBankBalance: 25000 + input.amount,
        transactionId: `txn_${Date.now()}`,
      };
    }),

  /**
   * 提现
   */
  withdraw: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (input.amount > 25000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient bank balance",
        });
      }

      return {
        success: true,
        amount: input.amount,
        newBalance: 50000 + input.amount,
        newBankBalance: 25000 - input.amount,
        transactionId: `txn_${Date.now()}`,
      };
    }),

  /**
   * 转账给 NPC
   */
  transferToNpc: protectedProcedure
    .input(
      z.object({
        npcId: z.string(),
        amount: z.number().positive(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.amount > 50000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient balance",
        });
      }

      return {
        success: true,
        npcId: input.npcId,
        amount: input.amount,
        newBalance: 50000 - input.amount,
        transactionId: `txn_${Date.now()}`,
        affinityBonus: 5,
      };
    }),

  /**
   * 获取交易历史
   */
  getTransactionHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const transactions = [];
      for (let i = 0; i < input.limit; i++) {
        transactions.push({
          id: `txn_${i}`,
          type: ["deposit", "withdraw", "transfer", "payment"][i % 4],
          amount: Math.floor(Math.random() * 10000),
          description: `Transaction ${i}`,
          timestamp: Date.now() - i * 3600000,
        });
      }
      return transactions;
    }),

  /**
   * 获取 ISC 价格历史
   */
  getPriceHistory: publicProcedure.query(async () => {
    const prices = [];
    const basePrice = 1.0;
    for (let i = 24; i >= 0; i--) {
      prices.push({
        time: new Date(Date.now() - i * 3600000).toISOString(),
        price: basePrice + (Math.random() - 0.5) * 0.2,
      });
    }
    return prices;
  }),
});

// ============================================================================
// TASK SYSTEM
// ============================================================================

export const taskRouter = router({
  /**
   * 获取可用任务列表
   */
  getAvailableTasks: protectedProcedure.query(async () => {
    return [
      {
        id: "task_001",
        npcId: "npc_001",
        npcName: "李行长",
        title: "银行存款任务",
        description: "在银行存入 10000 ISC",
        taskType: "deposit",
        reward_isc: 500,
        reward_exp: 100,
        difficulty: "easy",
        status: "available",
      },
      {
        id: "task_002",
        npcId: "npc_004",
        npcName: "刘商人",
        title: "商业交易任务",
        description: "与商人进行一次交易",
        taskType: "trade",
        reward_isc: 1000,
        reward_exp: 200,
        difficulty: "medium",
        status: "available",
      },
      {
        id: "task_003",
        npcId: "npc_005",
        npcName: "李咖啡师",
        title: "咖啡店购物",
        description: "在咖啡店购买 5 杯咖啡",
        taskType: "purchase",
        reward_isc: 300,
        reward_exp: 50,
        difficulty: "easy",
        status: "available",
      },
    ];
  }),

  /**
   * 接受任务
   */
  acceptTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        taskId: input.taskId,
        status: "in_progress",
        message: "Task accepted",
      };
    }),

  /**
   * 完成任务
   */
  completeTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        taskId: input.taskId,
        status: "completed",
        reward_isc: 500,
        reward_exp: 100,
        message: "Task completed! You earned rewards.",
      };
    }),

  /**
   * 获取进行中的任务
   */
  getInProgressTasks: protectedProcedure.query(async () => {
    return [
      {
        id: "task_001",
        title: "银行存款任务",
        progress: 50,
        deadline: Date.now() + 86400000,
      },
    ];
  }),
});

// ============================================================================
// SCENE SYSTEM
// ============================================================================

export const sceneRouter = router({
  /**
   * 获取场景信息
   */
  getScene: protectedProcedure
    .input(z.object({ sceneName: z.string() }))
    .query(async ({ input }) => {
      const scenes: Record<string, any> = {
        bank: {
          name: "bank",
          displayName: "ISC 去中心化银行",
          description: "城市的金融中心",
          sceneType: "bank",
          npcs: ["npc_001", "npc_002"],
          features: ["deposit", "withdraw", "loan", "investment"],
        },
        plaza: {
          name: "plaza",
          displayName: "ISC 广场",
          description: "城市的商业中心",
          sceneType: "plaza",
          npcs: ["npc_003", "npc_004"],
          features: ["trade", "market", "auction"],
        },
        cafe: {
          name: "cafe",
          displayName: "咖啡店",
          description: "休闲社交场所",
          sceneType: "cafe",
          npcs: ["npc_005"],
          features: ["purchase", "social", "dating"],
        },
      };

      return scenes[input.sceneName] || null;
    }),

  /**
   * 进入场景
   */
  enterScene: protectedProcedure
    .input(z.object({ sceneName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        sceneName: input.sceneName,
        message: `Entered ${input.sceneName}`,
        npcs: ["npc_001", "npc_002"],
      };
    }),

  /**
   * 获取所有场景列表
   */
  getAllScenes: publicProcedure.query(async () => {
    return [
      {
        name: "bank",
        displayName: "ISC 去中心化银行",
        icon: "🏦",
      },
      {
        name: "plaza",
        displayName: "ISC 广场",
        icon: "🏪",
      },
      {
        name: "cafe",
        displayName: "咖啡店",
        icon: "☕",
      },
      {
        name: "bookstore",
        displayName: "书店",
        icon: "📚",
      },
      {
        name: "supermarket",
        displayName: "超级市场",
        icon: "🛒",
      },
      {
        name: "farm",
        displayName: "农场",
        icon: "🌾",
      },
      {
        name: "home",
        displayName: "家",
        icon: "🏠",
      },
    ];
  }),
});

// ============================================================================
// GAME CORE ROUTER - Complete Game Logic Integration
// ============================================================================

import { createInitialGameState, gameReducer } from "../game-logic/reducer";
import {
  PlayerService,
  NPCService,
  EconomyService,
  TaskService,
  PropertyService,
  FarmService,
  ShopService,
  GameTimeService,
} from "../game-logic/services";
import type { GameState, GameAction } from "../game-logic/types";

// Game state storage (in production, persisted to database)
const gameStates = new Map<string, GameState>();

function getGameState(playerId: string): GameState {
  if (!gameStates.has(playerId)) {
    gameStates.set(playerId, createInitialGameState(playerId, `Player ${playerId}`));
  }
  return gameStates.get(playerId)!;
}

function saveGameState(playerId: string, state: GameState): void {
  gameStates.set(playerId, state);
}

function dispatchAction(playerId: string, action: GameAction): GameState {
  const currentState = getGameState(playerId);
  const newState = gameReducer(currentState, action);
  saveGameState(playerId, newState);
  return newState;
}

export const gameCoreRouter = router({
  // Game state queries
  getState: protectedProcedure.query(({ ctx }) => getGameState(String(ctx.user.id))),
  getPlayerStats: protectedProcedure.query(({ ctx }) => {
    const state = getGameState(String(ctx.user.id));
    return {
      level: state.player.level,
      experience: state.player.experience,
      totalExperience: state.player.totalExperience,
      tasksCompleted: state.progress.tasksCompleted,
      npcsFriended: state.progress.npcsFriended,
      propertiesOwned: state.progress.propertiesOwned,
      farmsCreated: state.progress.farmsCreated,
    };
  }),
  getWalletBalance: protectedProcedure.query(({ ctx }) => {
    const state = getGameState(String(ctx.user.id));
    return {
      money: state.wallet.money,
      isc: state.wallet.isc,
      bankBalance: state.bankAccount.balance,
      totalAssets: state.wallet.money + state.wallet.isc + state.bankAccount.balance,
    };
  }),

  // Player actions
  gainExperience: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const action = PlayerService.gainExperience(getGameState(userId), input.amount);
      return dispatchAction(userId, action);
    }),

  // NPC actions
  interactWithNPC: protectedProcedure
    .input(z.object({ npcId: z.string(), type: z.enum(["greet", "talk", "trade"]).default("greet") }))
    .mutation(({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const action = NPCService.interactWithNPC(getGameState(userId), input.npcId, input.type);
      return dispatchAction(userId, action);
    }),

  // Economy actions
  bankDeposit: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const action = EconomyService.bankDeposit(getGameState(userId), input.amount);
      return dispatchAction(userId, action);
    }),
  bankWithdraw: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const action = EconomyService.bankWithdraw(getGameState(userId), input.amount);
      return dispatchAction(userId, action);
    }),
  claimInterest: protectedProcedure.mutation(({ ctx }) => {
    const userId = String(ctx.user.id);
    const state = getGameState(userId);
    const interest = Math.max(1, Math.floor(state.bankAccount.balance * (state.bankAccount.interestRate / 100) / 12));
    const action = {
      type: 'BANK_CLAIM_INTEREST' as const,
      payload: { amount: interest },
    };
    return dispatchAction(userId, action);
  }),

  // Task actions
  acceptTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const action = TaskService.acceptTask(getGameState(userId), input.taskId);
      return dispatchAction(userId, action);
    }),
  completeTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const state = getGameState(userId);
      const task = state.tasks.find((t) => t.id === input.taskId);
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      const reward = TaskService.calculateTaskReward(task, 50);
      const action = TaskService.completeTask(state, input.taskId, reward);
      return dispatchAction(userId, action);
    }),

  // Game time
  advanceTime: protectedProcedure
    .input(z.object({ minutes: z.number().positive() }))
    .mutation(({ ctx, input }) => {
      const userId = String(ctx.user.id);
      const action = GameTimeService.advanceTime(getGameState(userId), input.minutes);
      return dispatchAction(userId, action);
    }),
  saveGame: protectedProcedure.mutation(({ ctx }) => {
    const userId = String(ctx.user.id);
    const action = { type: "GAME_SAVE" as const, payload: { timestamp: new Date() } };
    return dispatchAction(userId, action);
  }),
});

// ============================================================================
// MAIN GAME ROUTER
// ============================================================================

export const gameRouter = router({
  player: playerRouter,
  npc: npcRouter,
  economy: economyRouter,
  task: taskRouter,
  scene: sceneRouter,
  core: gameCoreRouter,

  /**
   * 获取游戏全局状态
   */
  getGameState: publicProcedure.query(async () => {
    return {
      currentDay: 1,
      currentHour: 14,
      gameSpeed: 100,
      iscPrice: 1.25,
      totalPlayers: 1250,
      totalNpcs: 200,
    };
  }),

  /**
   * 获取游戏统计
   */
  getGameStats: publicProcedure.query(async () => {
    return {
      totalPlayers: 1250,
      totalNpcs: 200,
      totalTransactions: 45000,
      totalIssuedIsc: 5000000,
      averagePlayerLevel: 8.5,
    };
  }),
});
