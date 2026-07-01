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



export const playerRouter = router({
  /**
   * 获取玩家信息
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    // 模拟玩家数据（后续连接数据库）
    return {
      id: ctx.user!.id,
      username: ctx.user!.email?.split("@")[0] || "Player",
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
   * 获取经济数据
   */
  getEconomyData: protectedProcedure.query(async ({ ctx }) => {
    return {
      totalMoney: 50000,
      totalISC: 25000,
      bankBalance: 10000,
      dailyIncome: 500,
      dailyExpense: 300,
      netIncome: 200,
    };
  }),

  /**
   * 存款
   */
  deposit: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        amount: input.amount,
        newBalance: 10000 + input.amount,
      };
    }),

  /**
   * 取款
   */
  withdraw: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        amount: input.amount,
        newBalance: 10000 - input.amount,
      };
    }),

  /**
   * 领取利息
   */
  claimInterest: protectedProcedure.mutation(async ({ ctx }) => {
    return {
      success: true,
      interest: 50,
      newBalance: 10050,
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
});
