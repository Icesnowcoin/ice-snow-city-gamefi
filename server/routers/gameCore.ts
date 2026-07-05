import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * 游戏核心系统 tRPC 路由
 * 包含玩家、NPC、经济、场景等核心游戏系统
 */

// ============================================================================
// PLAYER SYSTEM
// ============================================================================

import { router, protectedProcedure } from "../_core/trpc";
import { getISCTokenService } from "../blockchain/iscToken";



export const playerRouter = router({
  /**
   * 获取玩家信息
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const state = await getGameState(String(userId), userId);
    return {
      id: userId,
      username: ctx.user!.email?.split("@")[0] || state.player.name || "Player",
      level: state.player.level,
      experience: state.player.experience,
      totalExperience: state.player.totalExperience,
      stamina: state.assets.energy,
      maxStamina: 100,
      hunger: state.assets.food,
      thirst: state.assets.water,
      happiness: state.assets.reputation,
      health: 95,
      money: state.wallet.money,
      isc: state.wallet.isc,
      bankBalance: state.bankAccount.balance,
      currentScene: "home",
      maritalStatus: "single",
      createdAt: state.bankAccount.accountCreatedAt?.getTime() || Date.now(),
      propertiesOwned: state.progress.propertiesOwned,
      farmsCreated: state.progress.farmsCreated,
      tasksCompleted: state.progress.tasksCompleted,
      npcsFriended: state.progress.npcsFriended,
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
    .input(z.object({ sceneId: z.string() }))
    .query(async ({ input }) => {
      return [
        {
          id: "npc_001",
          name: "Alice",
          scene: input.sceneId,
          relationship: 50,
          favorability: 75,
        },
        {
          id: "npc_002",
          name: "Bob",
          scene: input.sceneId,
          relationship: 30,
          favorability: 50,
        },
      ];
    }),

  /**
   * 获取 NPC 详情
   */
  getNpcDetail: protectedProcedure
    .input(z.object({ npcId: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.npcId,
        name: "Alice",
        age: 28,
        profession: "商人",
        personality: "热情",
        favorability: 75,
        relationship: 50,
        schedule: [
          { time: "09:00", activity: "工作" },
          { time: "12:00", activity: "午餐" },
          { time: "18:00", activity: "休息" },
        ],
      };
    }),

  /**
   * 与 NPC 交互
   */
  interact: protectedProcedure
    .input(
      z.object({
        npcId: z.string(),
        type: z.enum(["greet", "gift", "date", "trade"]),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        npcId: input.npcId,
        type: input.type,
        favorabilityChange: 5,
      };
    }),
});

// ============================================================================
// ECONOMY SYSTEM
// ============================================================================

export const economyRouter = router({
  /**
   * 获取经济数据 - real game state
   */
  getEconomyData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const state = await getGameState(String(userId), userId);
    return {
      totalMoney: state.wallet.money,
      totalISC: state.wallet.isc,
      bankBalance: state.bankAccount.balance,
      dailyIncome: Math.floor(state.bankAccount.balance * state.bankAccount.interestRate / 365 / 100),
      dailyExpense: 0,
      netIncome: Math.floor(state.bankAccount.balance * state.bankAccount.interestRate / 365 / 100),
    };
  }),

  /**
   * 获取银行详细信息
   */
  getBankInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const state = await getGameState(String(userId), userId);
    const daysSinceLastInterest = Math.floor(
      (new Date().getTime() - new Date(state.bankAccount.lastInterestPaid).getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyRate = state.bankAccount.interestRate / 365 / 100;
    const pendingInterest = Math.max(0, Math.floor(state.bankAccount.balance * dailyRate * daysSinceLastInterest));
    return {
      balance: state.bankAccount.balance,
      interestRate: state.bankAccount.interestRate,
      depositCount: state.bankAccount.depositCount,
      totalDeposited: state.bankAccount.totalDeposited,
      lastInterestPaid: state.bankAccount.lastInterestPaid,
      accountCreatedAt: state.bankAccount.accountCreatedAt,
      pendingInterest,
      dailyInterest: Math.max(1, Math.floor(state.bankAccount.balance * dailyRate)),
      monthlyInterest: Math.max(1, Math.floor(state.bankAccount.balance * state.bankAccount.interestRate / 12 / 100)),
      yearlyInterest: Math.floor(state.bankAccount.balance * state.bankAccount.interestRate / 100),
      canClaimInterest: daysSinceLastInterest >= 1,
    };
  }),

  /**
   * 存款
   */
  deposit: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      if (input.amount > state.wallet.money) {
        throw new Error('Insufficient balance');
      }
      const action = EconomyService.bankDeposit(state, input.amount);
      const result = await dispatchAction(playerId, userId, action);
      return {
        success: true,
        amount: input.amount,
        newBalance: state.bankAccount.balance + input.amount,
      };
    }),

  /**
   * 取款
   */
  withdraw: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      if (input.amount > state.bankAccount.balance) {
        throw new Error('Insufficient bank balance');
      }
      const action = EconomyService.bankWithdraw(state, input.amount);
      const result = await dispatchAction(playerId, userId, action);
      return {
        success: true,
        amount: input.amount,
        newBalance: state.bankAccount.balance - input.amount,
      };
    }),

  /**
   * 领取利息
   */
  claimInterest: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const playerId = String(userId);
    const state = await getGameState(playerId, userId);
    const daysSinceLastInterest = Math.floor(
      (new Date().getTime() - new Date(state.bankAccount.lastInterestPaid).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastInterest < 1) {
      throw new Error('Interest can only be claimed once per day');
    }
    const interest = Math.max(1, Math.floor(state.bankAccount.balance * (state.bankAccount.interestRate / 100) / 12));
    const action = {
      type: 'BANK_CLAIM_INTEREST' as const,
      payload: { amount: interest },
    };
    const result = await dispatchAction(playerId, userId, action);
    return {
      success: true,
      interest,
      newBalance: state.bankAccount.balance + interest,
    };
  }),
});

// ============================================================================
// TASK SYSTEM
// ============================================================================

export const taskRouter = router({
  /**
   * 获取任务列表
   */
  getTaskList: protectedProcedure.query(async ({ ctx }) => {
    return [
      {
        id: "task_001",
        title: "完成日常工作",
        description: "完成今天的工作任务",
        reward: 100,
        status: "available",
      },
      {
        id: "task_002",
        title: "拜访 NPC",
        description: "拜访 Alice",
        reward: 50,
        status: "in_progress",
      },
    ];
  }),

  /**
   * 接受任务
   */
  acceptTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        taskId: input.taskId,
        status: "in_progress",
      };
    }),

  /**
   * 完成任务
   */
  completeTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        taskId: input.taskId,
        reward: 100,
        status: "completed",
      };
    }),
});

// ============================================================================
// SCENE SYSTEM
// ============================================================================

export const sceneRouter = router({
  /**
   * 获取场景列表
   */
  getSceneList: protectedProcedure.query(async ({ ctx }) => {
    return [
      {
        id: "scene_001",
        name: "ISC 银行",
        description: "金融中心",
        image: "/scenes/bank.png",
      },
      {
        id: "scene_002",
        name: "ISC 广场",
        description: "商业中心",
        image: "/scenes/plaza.png",
      },
      {
        id: "scene_003",
        name: "咖啡店",
        description: "社交中心",
        image: "/scenes/cafe.png",
      },
      {
        id: "scene_004",
        name: "农场",
        description: "农业基地",
        image: "/scenes/farm.png",
      },
    ];
  }),

  /**
   * 进入场景
   */
  enterScene: protectedProcedure
    .input(z.object({ sceneId: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        sceneId: input.sceneId,
        npcs: ["npc_001", "npc_002"],
      };
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
import {
  saveGameState as dbSaveGameState,
  loadGameState as dbLoadGameState,
} from "../db";

// Game state storage (in-memory cache for performance)
const gameStatesCache = new Map<string, GameState>();

/**
 * Helper function to serialize game state to JSON
 */
function serializeGameState(state: GameState): string {
  return JSON.stringify(state, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
}

/**
 * Helper function to deserialize game state from JSON
 */
function deserializeGameState(json: string): GameState {
  return JSON.parse(json, (key, value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  });
}

/**
 * Load game state from database or cache
 */
async function getGameState(playerId: string, userId: number): Promise<GameState> {
  // Check cache first
  if (gameStatesCache.has(playerId)) {
    return gameStatesCache.get(playerId)!;
  }

  // Try to load from database
  try {
    const stateJson = await dbLoadGameState(userId);
    if (stateJson) {
      const state = deserializeGameState(stateJson);
      gameStatesCache.set(playerId, state);
      return state;
    }
  } catch (error) {
    console.error(`Failed to load game state from database for user ${userId}:`, error);
  }

  // Create initial state if not found
  const initialState = createInitialGameState(playerId, `Player ${playerId}`);
  gameStatesCache.set(playerId, initialState);
  return initialState;
}

/**
 * Save game state to database and cache
 */
async function saveGameStateToDb(playerId: string, userId: number, state: GameState): Promise<void> {
  // Update cache
  gameStatesCache.set(playerId, state);

  // Save to database
  try {
    const stateJson = serializeGameState(state);
    await dbSaveGameState(userId, stateJson);
  } catch (error) {
    console.error(`Failed to save game state to database for user ${userId}:`, error);
    // Don't throw - cache is still valid
  }
}

/**
 * Dispatch action and save state
 */
async function dispatchAction(playerId: string, userId: number, action: GameAction): Promise<GameState> {
  const currentState = await getGameState(playerId, userId);
  const newState = gameReducer(currentState, action);
  await saveGameStateToDb(playerId, userId, newState);
  return newState;
}

export const gameCoreRouter = router({
  // Game state queries
  getState: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;
    return getGameState(String(userId), userId);
  }),
  getPlayerStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const state = await getGameState(String(userId), userId);
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
  getWalletBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const state = await getGameState(String(userId), userId);
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
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = PlayerService.gainExperience(state, input.amount);
      return dispatchAction(playerId, userId, action);
    }),

  // NPC actions
  interactWithNPC: protectedProcedure
    .input(z.object({ npcId: z.string(), type: z.enum(["greet", "talk", "trade"]).default("greet") }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = NPCService.interactWithNPC(state, input.npcId, input.type);
      return dispatchAction(playerId, userId, action);
    }),

  // Economy actions
  bankDeposit: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = EconomyService.bankDeposit(state, input.amount);
      return dispatchAction(playerId, userId, action);
    }),
  bankWithdraw: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = EconomyService.bankWithdraw(state, input.amount);
      return dispatchAction(playerId, userId, action);
    }),
  claimInterest: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const playerId = String(userId);
    const state = await getGameState(playerId, userId);
    const interest = Math.max(1, Math.floor(state.bankAccount.balance * (state.bankAccount.interestRate / 100) / 12));
    const action = {
      type: 'BANK_CLAIM_INTEREST' as const,
      payload: { amount: interest },
    };
    return dispatchAction(playerId, userId, action);
  }),

  // Task actions
  acceptTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = TaskService.acceptTask(state, input.taskId);
      return dispatchAction(playerId, userId, action);
    }),
  completeTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const task = state.tasks.find((t) => t.id === input.taskId);
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      const reward = TaskService.calculateTaskReward(task, 50);
      const action = TaskService.completeTask(state, input.taskId, reward);
      return dispatchAction(playerId, userId, action);
    }),

  // Property actions
  getProperties: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const state = await getGameState(String(userId), userId);
    return {
      owned: state.properties || [],
      money: state.wallet.money,
    };
  }),
  purchaseProperty: protectedProcedure
    .input(z.object({ propertyId: z.string(), price: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      if (state.wallet.money < input.price) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient funds" });
      }
      const action = PropertyService.purchaseProperty(state, input.propertyId, input.price);
      return dispatchAction(playerId, userId, action);
    }),
  sellProperty: protectedProcedure
    .input(z.object({ propertyId: z.string(), price: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = PropertyService.sellProperty(state, input.propertyId, input.price);
      return dispatchAction(playerId, userId, action);
    }),
  rentProperty: protectedProcedure
    .input(z.object({ propertyId: z.string(), renterId: z.string(), monthlyRent: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = PropertyService.rentProperty(state, input.propertyId, input.renterId, input.monthlyRent);
      return dispatchAction(playerId, userId, action);
    }),
  collectRent: protectedProcedure
    .input(z.object({ propertyId: z.string(), amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = PropertyService.collectRent(state, input.propertyId, input.amount);
      return dispatchAction(playerId, userId, action);
    }),
  // Farm actions
  createFarm: protectedProcedure
    .input(z.object({ name: z.string(), location: z.string().default("city_farm"), size: z.number().positive().default(4) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const farm = {
        id: `farm_${Date.now()}`,
        ownerId: playerId,
        name: input.name,
        location: input.location,
        size: input.size,
        totalPlots: input.size,
        availablePlots: input.size,
        crops: [],
        createdAt: new Date(),
      };
      const action = FarmService.createFarm(state, farm);
      return dispatchAction(playerId, userId, action);
    }),
  harvestCrop: protectedProcedure
    .input(z.object({ farmId: z.string(), cropId: z.string(), yieldAmount: z.number().positive().default(10) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = FarmService.harvestCrop(state, input.farmId, input.cropId, input.yieldAmount);
      return dispatchAction(playerId, userId, action);
    }),
  // Shop actions
  shopPurchase: protectedProcedure
    .input(z.object({ itemId: z.string(), quantity: z.number().positive().default(1), cost: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      if (state.wallet.money < input.cost * input.quantity) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient funds" });
      }
      const action = ShopService.purchaseItem(state, input.itemId, input.quantity, input.cost);
      return dispatchAction(playerId, userId, action);
    }),
  // Game time
  advanceTime: protectedProcedure
    .input(z.object({ minutes: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;
      const playerId = String(userId);
      const state = await getGameState(playerId, userId);
      const action = GameTimeService.advanceTime(state, input.minutes);
      return dispatchAction(playerId, userId, action);
    }),
  saveGame: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const playerId = String(userId);
    const action = { type: "GAME_SAVE" as const, payload: { timestamp: new Date() } };
    return dispatchAction(playerId, userId, action);
  }),
});

// ============================================================================
// WORK SYSTEM
// ============================================================================

import { WORK_TYPES, getAvailableProfessions, calculateWorkSalary, calculateWorkExperience } from "../game-logic/workSystem";

export const workRouter = router({
  /**
   * Get available jobs for player
   */
  getAvailableJobs: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Get actual player level from database
    const playerLevel = 5;
    const jobs = getAvailableProfessions(playerLevel);
    return jobs;
  }),

  /**
   * Get all jobs
   */
  getAllJobs: protectedProcedure.query(async () => {
    return Object.values(WORK_TYPES);
  }),

  /**
   * Start work session
   */
  startWork: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = WORK_TYPES[input.jobId];
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      // TODO: Save work session to database
      return {
        success: true,
        job,
        startTime: Date.now(),
        endTime: Date.now() + 3600000, // 1 hour
      };
    }),

  /**
   * Complete work session
   */
  completeWork: protectedProcedure
    .input(z.object({ jobId: z.string(), professionLevel: z.number().default(0) }))
    .mutation(async ({ ctx, input }) => {
      const job = WORK_TYPES[input.jobId];
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const salary = calculateWorkSalary(input.jobId, input.professionLevel);
      const experience = calculateWorkExperience(input.jobId, input.professionLevel);

      // TODO: Update player stats in database
      return {
        success: true,
        salary,
        experience,
      };
    }),

  /**
   * Get job details
   */
  getJobDetails: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = WORK_TYPES[input.jobId];
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }
      return job;
    }),
});

// ============================================================================
// CONSUMPTION SYSTEM
// ============================================================================

import { CONSUMABLE_ITEMS, getItemsByCategory } from "../game-logic/consumptionSystem";

export const consumptionRouter = router({
  /**
   * Get available consumption items
   */
  getAvailableItems: protectedProcedure.query(async ({ ctx }) => {
    return Object.values(CONSUMABLE_ITEMS).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      effect: item.effect,
      effectAmount: item.effectAmount,
      category: item.category,
      icon: item.icon,
    }));
  }),

  /**
   * Get items by category
   */
  getItemsByCategory: protectedProcedure
    .input(z.object({ category: z.enum(["food", "drink", "entertainment", "medicine"]) }))
    .query(async ({ input }) => {
      return getItemsByCategory(input.category);
    }),

  /**
   * Consume an item
   */
  consumeItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        quantity: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const item = CONSUMABLE_ITEMS[input.itemId];
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      const totalCost = item.price * input.quantity;
      return {
        success: true,
        itemId: input.itemId,
        itemName: item.name,
        quantity: input.quantity,
        totalCost,
        effect: item.effect,
        effectAmount: item.effectAmount * input.quantity,
      };
    }),
});

// ============================================================================
// UPGRADE SYSTEM
// ============================================================================

export const upgradeRouter = router({
  /**
   * Get available upgrades
   */
  getAvailableUpgrades: protectedProcedure.query(async ({ ctx }) => {
    return [
      {
        id: "building_1",
        name: "升级房间",
        type: "building",
        cost: 5000,
        level: 1,
        maxLevel: 5,
        description: "升级你的房间，提升居住舒适度",
      },
      {
        id: "skill_1",
        name: "学习技能",
        type: "skill",
        cost: 2000,
        level: 1,
        maxLevel: 10,
        description: "学习新技能，提升工作效率",
      },
      {
        id: "equipment_1",
        name: "购买装备",
        type: "equipment",
        cost: 3000,
        level: 1,
        maxLevel: 5,
        description: "购买新装备，提升战斗力",
      },
      {
        id: "facility_1",
        name: "建造设施",
        type: "facility",
        cost: 10000,
        level: 1,
        maxLevel: 3,
        description: "建造新设施，解锁新功能",
      },
    ];
  }),

  /**
   * Perform an upgrade
   */
  performUpgrade: protectedProcedure
    .input(
      z.object({
        upgradeId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 模拟升级逻辑
      const upgrades = await upgradeRouter.createCaller(ctx).getAvailableUpgrades() as any[];
      const upgrade = upgrades.find((u: any) => u.id === input.upgradeId);
      if (!upgrade) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upgrade not found",
        });
      }

      if (upgrade.level >= upgrade.maxLevel) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upgrade already at max level",
        });
      }

      return {
        success: true,
        upgradeId: input.upgradeId,
        newLevel: upgrade.level + 1,
        cost: upgrade.cost,
        effects: {
          bonus: upgrade.level * 10,
        },
      };
    }),
});

// ============================================================================
// TOKEN SYSTEM (ISC Token)
// ============================================================================

export const tokenRouter = router({
  /**
   * Get player's ISC token balance
   */
  getBalance: protectedProcedure
    .input(z.object({ address: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      try {
        const iscService = getISCTokenService();
        const address = input.address || String(ctx.user!.id);
        const balance = await iscService.getBalance(address);
        return {
          success: true,
          balance,
          address,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get balance: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Get token info
   */
  getTokenInfo: protectedProcedure.query(async () => {
    try {
      const iscService = getISCTokenService();
      const info = await iscService.getTokenInfo();
      return {
        success: true,
        ...info,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get token info: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }),

  /**
   * Get cooldown remaining time
   */
  getCooldownRemaining: protectedProcedure
    .input(z.object({ address: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      try {
        const iscService = getISCTokenService();
        const address = input.address || String(ctx.user!.id);
        const remaining = await iscService.getCooldownRemaining(address);
        return {
          success: true,
          remaining,
          address,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get cooldown: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Get contract address
   */
  getContractAddress: protectedProcedure.query(async () => {
    const iscService = getISCTokenService();
    return {
      success: true,
      contractAddress: iscService.getContractAddress(),
    };
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
  work: workRouter,
  consumption: consumptionRouter,
  upgrade: upgradeRouter,
  token: tokenRouter,
});
