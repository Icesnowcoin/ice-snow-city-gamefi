import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  initializePlayerProfession,
  getPlayerProfession,
  addExperience,
  upgradeProfession,
  getProfessionProgressionData,
  getProfessionAchievements,
  claimDailyLoginReward,
  canClaimLoginReward,
  getLoginRewardStatus,
} from '../game-logic/professionSystem';

/**
 * Profession Router
 * Handles all profession-related tRPC procedures
 */
export const professionRouter = router({
  /**
   * Initialize player profession (called on first login)
   */
  initialize: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const profession = await initializePlayerProfession(userId);
      return {
        success: true,
        data: profession,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize profession',
      };
    }
  }),

  /**
   * Get player profession data
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const profession = await getPlayerProfession(userId);
      return {
        success: true,
        data: profession,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profession',
      };
    }
  }),

  /**
   * Get profession progression data (for UI display)
   */
  getProgression: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const progression = await getProfessionProgressionData(userId);
      return {
        success: true,
        data: progression,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get progression data',
      };
    }
  }),

  /**
   * Add experience to player
   */
  addExperience: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const result = await addExperience(userId, input.amount);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add experience',
        };
      }
    }),

  /**
   * Upgrade profession
   */
  upgrade: protectedProcedure
    .input(z.object({ totalAssets: z.number().nonnegative() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const result = await upgradeProfession(userId, input.totalAssets);
        return {
          success: result.success,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          data: {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upgrade profession',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    }),

  /**
   * Get profession achievements
   */
  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const achievements = await getProfessionAchievements(userId);
      return {
        success: true,
        data: achievements,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get achievements',
      };
    }
  }),

  /**
   * Claim daily login reward (commoner only)
   */
  claimDailyReward: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const result = await claimDailyLoginReward(userId);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to claim reward',
        rewardAmount: 0,
        totalRewards: 0,
        maxRewards: 100,
      };
    }
  }),

  /**
   * Check if player can claim login reward
   */
  canClaimReward: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const canClaim = await canClaimLoginReward(userId);
      return {
        success: true,
        canClaim,
      };
    } catch (error) {
      return {
        success: false,
        canClaim: false,
        error: error instanceof Error ? error.message : 'Failed to check reward status',
      };
    }
  }),

  /**
   * Get login reward status
   */
  getRewardStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const status = await getLoginRewardStatus(userId);
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reward status',
      };
    }
  }),
});
