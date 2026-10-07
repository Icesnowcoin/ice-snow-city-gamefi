import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { claimReferral, getReferralLeaderboard } from "../db";

const referralInput = z.object({
  referrerUserId: z.number().int().positive(),
  referralCode: z.string().trim().min(1).max(64),
});

export const referralsRouter = router({
  claim: protectedProcedure.input(referralInput).mutation(async ({ ctx, input }) => {
    if (input.referralCode !== String(input.referrerUserId)) {
      return { claimed: false, reason: "invalid_code" as const };
    }

    return claimReferral({
      referrerUserId: input.referrerUserId,
      referredUserId: ctx.user.id,
      referralCode: input.referralCode,
    });
  }),

  leaderboard: protectedProcedure
    .input(z.object({ limit: z.number().int().min(3).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      return getReferralLeaderboard(ctx.user.id, input?.limit ?? 10);
    }),
});
