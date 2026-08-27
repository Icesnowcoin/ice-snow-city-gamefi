import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  recordShareStatistic,
  getShareStatistics,
  getShareStatisticsSummary,
} from "../db";

export const shareStatisticsRouter = router({
  /**
   * Record a share event
   */
  recordShare: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["twitter", "telegram", "clipboard", "download"]),
        transactionId: z.number().optional(),
        transactionType: z.string().optional(),
        amount: z.string().optional(),
        success: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userAgent = ctx.req?.get?.("user-agent") || undefined;
        const ipAddress = ctx.req?.get?.("x-forwarded-for") ||
          ctx.req?.get?.("x-real-ip") ||
          ctx.req?.ip ||
          undefined;

        await recordShareStatistic({
          userId: ctx.user.id,
          platform: input.platform,
          transactionId: input.transactionId,
          transactionType: input.transactionType,
          amount: input.amount,
          success: input.success ?? true,
          userAgent,
          ipAddress,
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to record share:", error);
        throw new Error("Failed to record share statistic");
      }
    }),

  /**
   * Get share statistics for current user
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["twitter", "telegram", "clipboard", "download"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const stats = await getShareStatistics(ctx.user.id, {
          platform: input.platform,
          startDate: input.startDate,
          endDate: input.endDate,
          limit: input.limit,
          offset: input.offset,
        });

        return stats || [];
      } catch (error) {
        console.error("Failed to get share statistics:", error);
        throw new Error("Failed to get share statistics");
      }
    }),

  /**
   * Get share statistics summary for current user
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const summary = await getShareStatisticsSummary(ctx.user.id);

      const totalShares = summary.reduce((acc: number, stat: any) => acc + (Number(stat.count) || 0), 0);
      const uniquePlatforms = summary.length;

      return {
        totalShares,
        uniquePlatforms,
        details: summary,
      };
    } catch (error) {
      console.error("Failed to get share statistics summary:", error);
      throw new Error("Failed to get share statistics summary");
    }
  }),

  /**
   * Get share count by platform for current user
   */
  getCountByPlatform: protectedProcedure.query(async ({ ctx }) => {
    try {
      const summary = await getShareStatisticsSummary(ctx.user.id);

      const counts = {
        twitter: 0,
        telegram: 0,
        clipboard: 0,
        download: 0,
      };

      summary.forEach((stat: any) => {
        if (stat.platform in counts) {
          counts[stat.platform as keyof typeof counts] = Number(stat.count) || 0;
        }
      });

      return counts;
    } catch (error) {
      console.error("Failed to get share count by platform:", error);
      throw new Error("Failed to get share count by platform");
    }
  }),
});
