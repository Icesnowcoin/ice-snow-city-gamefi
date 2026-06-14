import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./trpc";
import { ENV } from "./env";

/**
 * Owner-only procedure: Enforces strict Owner access control.
 * 
 * This procedure checks that:
 * 1. User is authenticated (via protectedProcedure)
 * 2. User's openId matches the OWNER_OPEN_ID from environment
 * 
 * This is the production-grade access control for admin operations.
 * It is stricter than generic "admin role" checks.
 */
export const ownerOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.openId !== ENV.ownerOpenId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner access required. Only the project owner can access this resource.",
    });
  }
  return next({ ctx });
});
