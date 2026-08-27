/**
 * tRPC Router for Onboarding System
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { OnboardingManager, type TutorialStep } from '../game-logic/onboardingSystem';

// Initialize manager
const onboardingManager = new OnboardingManager();

export const onboardingRouter = router({
  // Start onboarding for new player
  startOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const progress = onboardingManager.startOnboarding(String(ctx.user.id));

      return {
        success: true,
        progress,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start onboarding');
    }
  }),

  // Complete a tutorial step
  completeStep: protectedProcedure
    .input(
      z.object({
        step: z.enum([
          'build_first_house',
          'collect_resources',
          'interact_npc',
          'complete_task',
          'first_trade',
          'upgrade_building',
        ]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const rewards = onboardingManager.completeStep(
          String(ctx.user.id),
          input.step as TutorialStep,
        );

        return {
          success: true,
          rewards,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to complete step');
      }
    }),

  // Skip a tutorial step
  skipStep: protectedProcedure
    .input(
      z.object({
        step: z.enum([
          'build_first_house',
          'collect_resources',
          'interact_npc',
          'complete_task',
          'first_trade',
          'upgrade_building',
        ]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        onboardingManager.skipStep(String(ctx.user.id), input.step as TutorialStep);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to skip step');
      }
    }),

  // Abandon onboarding
  abandonOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      onboardingManager.abandonOnboarding(String(ctx.user.id));

      return {
        success: true,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to abandon onboarding');
    }
  }),

  // Get current progress
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    try {
      const progress = onboardingManager.getProgress(String(ctx.user.id));

      return {
        success: true,
        progress,
        isOnboarding: onboardingManager.isOnboarding(String(ctx.user.id)),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get progress');
    }
  }),

  // Get current step config
  getCurrentStepConfig: protectedProcedure.query(async ({ ctx }) => {
    try {
      const config = onboardingManager.getCurrentStepConfig(String(ctx.user.id));

      return {
        success: true,
        config,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get step config');
    }
  }),

  // Get protection status
  getProtection: protectedProcedure.query(async ({ ctx }) => {
    try {
      const protection = onboardingManager.getProtection(String(ctx.user.id));
      const isProtected = onboardingManager.isProtected(String(ctx.user.id));

      return {
        success: true,
        protection,
        isProtected,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get protection');
    }
  }),

  // Get completion rate
  getCompletionRate: protectedProcedure.query(async ({ ctx }) => {
    try {
      const rate = onboardingManager.getCompletionRate(String(ctx.user.id));

      return {
        success: true,
        rate,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get completion rate');
    }
  }),

  // Get total rewards
  getTotalRewards: protectedProcedure.query(async ({ ctx }) => {
    try {
      const rewards = onboardingManager.getTotalRewards(String(ctx.user.id));

      return {
        success: true,
        rewards,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get rewards');
    }
  }),

  // Get estimated time remaining
  getEstimatedTimeRemaining: protectedProcedure.query(async ({ ctx }) => {
    try {
      const time = onboardingManager.getEstimatedTimeRemaining(String(ctx.user.id));

      return {
        success: true,
        time,
        minutes: Math.round(time / 60000),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get estimated time');
    }
  }),

  // Get all tutorial steps info
  getTutorialSteps: publicProcedure.query(async () => {
    return {
      success: true,
      steps: [
        {
          step: 'build_first_house',
          title: '建造第一个房屋',
          order: 1,
          estimatedDuration: 120,
        },
        {
          step: 'collect_resources',
          title: '收集第一批资源',
          order: 2,
          estimatedDuration: 180,
        },
        {
          step: 'interact_npc',
          title: '与 NPC 交互',
          order: 3,
          estimatedDuration: 120,
        },
        {
          step: 'complete_task',
          title: '完成第一个任务',
          order: 4,
          estimatedDuration: 300,
        },
        {
          step: 'first_trade',
          title: '进行第一笔交易',
          order: 5,
          estimatedDuration: 180,
        },
        {
          step: 'upgrade_building',
          title: '升级第一个建筑',
          order: 6,
          estimatedDuration: 120,
        },
      ],
    };
  }),
});
