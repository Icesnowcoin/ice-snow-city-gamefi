/**
 * Check-in System tRPC Router
 * Handles all check-in related API endpoints
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  canPlayerCheckIn,
  createCheckinRecord,
  verifyAndClaimCheckin,
  getCheckinStats,
  activateWithdrawal,
  getCheckinHistory,
  logShareVerification,
  shouldAutoDisableCheckin,
  getCheckinSystemConfig,
} from '../game-logic/checkinSystem';
import { SocialMediaPlatform } from '../../shared/types/checkin';

export const checkinRouter = router({
  /**
   * Get current check-in stats for the player
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await getCheckinStats(ctx.user.id);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get check-in stats',
      };
    }
  }),

  /**
   * Check if player can perform check-in today
   */
  canCheckIn: protectedProcedure.query(async ({ ctx }) => {
    try {
      const result = await canPlayerCheckIn(ctx.user.id);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        canCheckIn: false,
        error: error instanceof Error ? error.message : 'Failed to check eligibility',
      };
    }
  }),

  /**
   * Create a new check-in record
   */
  createCheckin: protectedProcedure
    .input(
      z.object({
        platform: z.enum([
          'telegram',
          'whatsapp',
          'facebook',
          'instagram',
          'x',
          'zalo',
          'reddit',
          'discord',
        ]),
        shareUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if player can check in
        const canCheck = await canPlayerCheckIn(ctx.user.id);
        if (!canCheck.canCheckIn) {
          return {
            success: false,
            message: canCheck.reason || '无法签到',
          };
        }

        // Create check-in record
        const record = await createCheckinRecord(ctx.user.id, input.platform as SocialMediaPlatform, input.shareUrl);

        // Log verification attempt
        await logShareVerification(ctx.user.id, input.platform as SocialMediaPlatform, input.shareUrl, 'pending');

        return {
          success: true,
          message: '签到记录已创建，等待验证',
          data: record,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create check-in',
        };
      }
    }),

  /**
   * Verify and claim check-in reward
   */
  claimReward: protectedProcedure
    .input(
      z.object({
        checkinId: z.number(),
        verificationData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await verifyAndClaimCheckin(ctx.user.id, input.checkinId, input.verificationData);
        return {
          success: result.success,
          message: result.message,
          reward: result.reward,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to claim reward',
        };
      }
    }),

  /**
   * Activate withdrawal functionality
   */
  activateWithdrawal: protectedProcedure
    .input(
      z.object({
        iscPurchaseAmount: z.number().min(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await activateWithdrawal(ctx.user.id, input.iscPurchaseAmount);
        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to activate withdrawal',
        };
      }
    }),

  /**
   * Get check-in history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const history = await getCheckinHistory(ctx.user.id, input.limit);
        return {
          success: true,
          data: history,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get history',
        };
      }
    }),

  /**
   * Get system configuration
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    try {
      const config = await getCheckinSystemConfig();
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get configuration',
      };
    }
  }),

  /**
   * Check if system should be auto-disabled
   */
  checkAutoDisable: protectedProcedure
    .input(
      z.object({
        iscPriceUSDT: z.number().min(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const shouldDisable = await shouldAutoDisableCheckin(input.iscPriceUSDT);
        return {
          success: true,
          shouldDisable,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check auto-disable status',
        };
      }
    }),
});
