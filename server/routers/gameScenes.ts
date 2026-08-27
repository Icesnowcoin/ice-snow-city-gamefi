/**
 * tRPC Router for Game Scenes
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { GameSceneManager, type SceneType, type DifficultyLevel } from '../game-logic/gameScenes';

// Initialize manager
const sceneManager = new GameSceneManager();

export const gameScenesRouter = router({
  // Start a new scene
  startScene: protectedProcedure
    .input(
      z.object({
        sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
        difficulty: z.enum(['easy', 'medium', 'hard']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const progress = sceneManager.startScene(
          String(ctx.user.id),
          input.sceneType as SceneType,
          input.difficulty as DifficultyLevel,
        );

        return {
          success: true,
          progress,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to start scene');
      }
    }),

  // Process player action in scene
  processAction: protectedProcedure
    .input(
      z.object({
        sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
        action: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const score = sceneManager.processAction(
          String(ctx.user.id),
          input.sceneType as SceneType,
          input.action,
          input.metadata || {},
        );
        
        // Store score in database for persistence
        // TODO: Implement database persistence

        return {
          success: true,
          score,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to process action');
      }
    }),

  // Complete scene and get rewards
  completeScene: protectedProcedure
    .input(
      z.object({
        sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const rewards = sceneManager.completeScene(String(ctx.user.id), input.sceneType as SceneType);

        return {
          success: true,
          rewards,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to complete scene');
      }
    }),

  // Abandon scene
  abandonScene: protectedProcedure
    .input(
      z.object({
        sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        sceneManager.abandonScene(String(ctx.user.id), input.sceneType as SceneType);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to abandon scene');
      }
    }),

  // Get current scene progress
  getProgress: protectedProcedure
    .input(
      z.object({
        sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const progress = sceneManager.getActiveScene(String(ctx.user.id), input.sceneType as SceneType);

        return {
          success: true,
          progress,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to get progress');
      }
    }),

  // Get all scenes info
  getScenesList: publicProcedure.query(async () => {
    return {
      success: true,
      scenes: [
        {
          type: 'fishing',
          name: '🎣 钓鱼',
          description: '在冰雪湖中钓鱼，获得食物和金币',
          energyCost: 10,
          duration: 60,
          rewards: '金币、食物、能量',
        },
        {
          type: 'mining',
          name: '⛏️ 采矿',
          description: '在矿山中采矿，获得金币和矿石',
          energyCost: 15,
          duration: 90,
          rewards: '金币、矿石、ISC',
        },
        {
          type: 'lumberjacking',
          name: '🪵 伐木',
          description: '在森林中伐木，获得木材和食物',
          energyCost: 12,
          duration: 75,
          rewards: '木材、食物、金币',
        },
      ],
    };
  }),
});
