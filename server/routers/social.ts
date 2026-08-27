import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, or } from "drizzle-orm";

import { protectedProcedure, router } from "../_core/trpc";
import { guildMembers, guilds, socialFriendships, teamMembers, teams } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  SOCIAL_ECONOMY,
  SocialEconomyError,
  activateFriendship,
  createGuild,
  createTeam,
  getAllocationSummary,
  getSocialWallet,
  listChannelMessages,
  purchaseMegaphones,
  sendChannelMessage,
} from "../socialEconomy";

const idempotencyKey = z.string().trim().min(8).max(128);
const channelType = z.enum(["world", "guild", "team", "private", "community"]);

function translateError(error: unknown): never {
  if (error instanceof SocialEconomyError) {
    const map: Record<SocialEconomyError["code"], TRPCError["code"]> = {
      DATABASE_UNAVAILABLE: "INTERNAL_SERVER_ERROR",
      ACCOUNT_NOT_INITIALIZED: "PRECONDITION_FAILED",
      INSUFFICIENT_BALANCE: "BAD_REQUEST",
      INSUFFICIENT_MEGAPHONES: "BAD_REQUEST",
      DUPLICATE_OPERATION: "CONFLICT",
      INVALID_INPUT: "BAD_REQUEST",
      NOT_FOUND: "NOT_FOUND",
      FORBIDDEN: "FORBIDDEN",
      EXPIRED: "BAD_REQUEST",
      DUPLICATE_NAME: "CONFLICT",
    };
    throw new TRPCError({ code: map[error.code], message: error.message });
  }
  console.error("[Social] unhandled error", error);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "社交服务暂时不可用" });
}

export const socialRouter = router({
  constants: protectedProcedure.query(() => ({
    ...SOCIAL_ECONOMY,
    currency: "ISC",
    worldChannel: {
      requiresMegaphone: true,
      megaphonePrice: SOCIAL_ECONOMY.megaphonePrice,
      description: "每条世界频道消息消耗 1 个喇叭",
    },
    inGameAllocation: {
      treasuryPercentage: SOCIAL_ECONOMY.treasuryPercentage,
      marketingPercentage: SOCIAL_ECONOMY.marketingPercentage,
      treasuryAddress: SOCIAL_ECONOMY.treasuryAddress,
      marketingWalletAddress: SOCIAL_ECONOMY.marketingWalletAddress,
    },
  })),

  wallet: protectedProcedure.query(async ({ ctx }) => {
    try {
      return getSocialWallet(ctx.user.id);
    } catch (error) {
      return translateError(error);
    }
  }),

  allocations: protectedProcedure.query(async ({ ctx }) => {
    try {
      return getAllocationSummary(ctx.user.id);
    } catch (error) {
      return translateError(error);
    }
  }),

  purchaseMegaphones: protectedProcedure
    .input(z.object({ quantity: z.number().int().min(1).max(100), idempotencyKey }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await purchaseMegaphones(ctx.user.id, input.quantity, input.idempotencyKey);
      } catch (error) {
        return translateError(error);
      }
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        channelType,
        channelId: z.string().trim().min(1).max(64).optional(),
        recipientUserId: z.number().int().positive().optional(),
        content: z.string().trim().min(1).max(500),
        idempotencyKey,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await sendChannelMessage({ ...input, senderUserId: ctx.user.id });
      } catch (error) {
        return translateError(error);
      }
    }),

  messages: protectedProcedure
    .input(
      z.object({
        channelType,
        channelId: z.string().trim().min(1).max(64).optional(),
        recipientUserId: z.number().int().positive().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await listChannelMessages({ ...input, userId: ctx.user.id });
      } catch (error) {
        return translateError(error);
      }
    }),

  createGuild: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(64),
        description: z.string().trim().max(300).optional(),
        idempotencyKey,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await createGuild({ ...input, userId: ctx.user.id });
      } catch (error) {
        return translateError(error);
      }
    }),

  createTeam: protectedProcedure
    .input(z.object({ name: z.string().trim().min(2).max(64), idempotencyKey }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await createTeam({ ...input, userId: ctx.user.id });
      } catch (error) {
        return translateError(error);
      }
    }),

  addFriend: protectedProcedure
    .input(z.object({ friendUserId: z.number().int().positive(), idempotencyKey }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await activateFriendship({ ...input, userId: ctx.user.id });
      } catch (error) {
        return translateError(error);
      }
    }),

  myGuilds: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库暂时不可用" });
    return db
      .select({ guild: guilds, membership: guildMembers })
      .from(guildMembers)
      .innerJoin(guilds, eq(guildMembers.guildId, guilds.id))
      .where(eq(guildMembers.userId, ctx.user.id));
  }),

  myTeams: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库暂时不可用" });
    return db
      .select({ team: teams, membership: teamMembers })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, ctx.user.id));
  }),

  friendships: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库暂时不可用" });
    return db
      .select()
      .from(socialFriendships)
      .where(
        or(
          eq(socialFriendships.userLowId, ctx.user.id),
          eq(socialFriendships.userHighId, ctx.user.id),
        ),
      );
  }),
});
