import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { ownerOnlyProcedure } from "./_core/ownerOnly";
import { hashSecretKey, verifySecretKey } from "./_core/crypto";
import {
  getAllContractParams,
  getContractParam,
  updateContractParam,
  getActiveSecretKey,
  getSecretKeyHistory,
  createSecretKey,
  getContractEvents,
  getContractEventsByName,
  insertContractEvent,
  getTreasuryTransactions,
  insertTreasuryTransaction,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Secret Key Management ──────────────────────────────────────────────
  secretKey: router({
    getActive: ownerOnlyProcedure.query(async () => {
      const key = await getActiveSecretKey();
      return key ? { keyHash: key.keyHash, createdAt: key.createdAt, createdBy: key.createdBy } : null;
    }),

    getHistory: ownerOnlyProcedure.query(async () => {
      return getSecretKeyHistory(20);
    }),

    generate: ownerOnlyProcedure.mutation(async ({ ctx }) => {
      // Generate a new random secret key using cryptographically secure random
      const rawKey = require("crypto").randomBytes(32).toString("hex");
      // Hash it using keccak256 (production-grade, contract-compatible)
      const keyHash = hashSecretKey(rawKey);
      await createSecretKey(keyHash, ctx.user.openId);
      return { rawKey, keyHash };
    }),

    setCustom: ownerOnlyProcedure
      .input(z.object({ rawKey: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        // Hash using keccak256 (production-grade, contract-compatible)
        const keyHash = hashSecretKey(input.rawKey);
        await createSecretKey(keyHash, ctx.user.openId);
        return { keyHash };
      }),
  }),

  // ─── Contract Parameters ────────────────────────────────────────────────
  contractParams: router({
    getAll: ownerOnlyProcedure.query(async () => {
      return getAllContractParams();
    }),

    update: ownerOnlyProcedure
      .input(
        z.object({
          paramName: z.enum(["utilityFeeRate", "luxuryGiftRebateRate", "stakingPoolId"]),
          paramValue: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await updateContractParam(input.paramName, input.paramValue, ctx.user.openId);
        // Log the parameter change as an event
        await insertContractEvent({
          eventName: "ParamUpdated",
          fromAddress: ctx.user.openId,
          params: JSON.stringify({ paramName: input.paramName, newValue: input.paramValue }),
          status: "success",
        });
        return { success: true };
      }),
  }),

  // ─── Contract Events / Logs ─────────────────────────────────────────────
  contractEvents: router({
    list: ownerOnlyProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(200).default(50),
          offset: z.number().min(0).default(0),
          eventName: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        if (input.eventName) {
          return getContractEventsByName(input.eventName, input.limit);
        }
        return getContractEvents(input.limit, input.offset);
      }),
  }),

  // ─── Agent Operations Console ──────────────────────────────────────────
  agent: router({
    payUtilityFee: ownerOnlyProcedure
      .input(
        z.object({
          secretKey: z.string().min(1),
          amount: z.string().min(1),
          playerAddress: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verify secret key using constant-time comparison
        const activeKey = await getActiveSecretKey();
        if (!activeKey || !verifySecretKey(input.secretKey, activeKey.keyHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid secret key" });
        }

        // Log the operation
        await insertContractEvent({
          eventName: "UtilityFeePaid",
          fromAddress: input.playerAddress,
          amount: input.amount,
          params: JSON.stringify({ method: "payUtilityFee", timestamp: new Date().toISOString() }),
          status: "success",
        });

        // Log treasury deposit
        await insertTreasuryTransaction({
          txType: "deposit",
          amount: input.amount,
          fromAddress: input.playerAddress,
          description: "Utility fee payment",
        });

        return { success: true, message: "payUtilityFee executed successfully" };
      }),

    processLuxuryGiftRebate: ownerOnlyProcedure
      .input(
        z.object({
          secretKey: z.string().min(1),
          recipientAddress: z.string().min(1),
          giftValue: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const activeKey = await getActiveSecretKey();
        if (!activeKey || !verifySecretKey(input.secretKey, activeKey.keyHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid secret key" });
        }

        // Calculate rebate based on current rate
        const rateParam = await getContractParam("luxuryGiftRebateRate");
        const rate = rateParam ? parseInt(rateParam.paramValue) : 3000;
        const rebateAmount = (BigInt(input.giftValue) * BigInt(rate)) / BigInt(10000);

        await insertContractEvent({
          eventName: "LuxuryGiftRebateProcessed",
          toAddress: input.recipientAddress,
          amount: rebateAmount.toString(),
          params: JSON.stringify({
            method: "processLuxuryGiftRebate",
            giftValue: input.giftValue,
            rebateRate: rate,
          }),
          status: "success",
        });

        await insertTreasuryTransaction({
          txType: "withdraw",
          amount: rebateAmount.toString(),
          toAddress: input.recipientAddress,
          description: `Luxury gift rebate (${rate / 100}%)`,
        });

        return { success: true, rebateAmount: rebateAmount.toString() };
      }),

    mintLand: ownerOnlyProcedure
      .input(
        z.object({
          secretKey: z.string().min(1),
          toAddress: z.string().min(1),
          x: z.number(),
          y: z.number(),
          landType: z.number().min(0).max(4),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const activeKey = await getActiveSecretKey();
        if (!activeKey || !verifySecretKey(input.secretKey, activeKey.keyHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid secret key" });
        }

        await insertContractEvent({
          eventName: "LandMinted",
          toAddress: input.toAddress,
          params: JSON.stringify({
            method: "mintLand",
            x: input.x,
            y: input.y,
            landType: input.landType,
          }),
          status: "success",
        });

        return { success: true, message: "mintLand executed successfully" };
      }),

    mintHouse: ownerOnlyProcedure
      .input(
        z.object({
          secretKey: z.string().min(1),
          toAddress: z.string().min(1),
          landTokenId: z.number(),
          houseType: z.number().min(0).max(3),
          decorationHash: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const activeKey = await getActiveSecretKey();
        if (!activeKey || !verifySecretKey(input.secretKey, activeKey.keyHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid secret key" });
        }

        await insertContractEvent({
          eventName: "HouseMinted",
          toAddress: input.toAddress,
          params: JSON.stringify({
            method: "mintHouse",
            landTokenId: input.landTokenId,
            houseType: input.houseType,
            decorationHash: input.decorationHash,
          }),
          status: "success",
        });

        return { success: true, message: "mintHouse executed successfully" };
      }),
  }),

  // ─── Treasury Monitor ───────────────────────────────────────────────────
  treasury: router({
    getBalance: ownerOnlyProcedure.query(async () => {
      // In production, this would query the actual contract
      // For now, calculate from transaction history
      const transactions = await getTreasuryTransactions(1000, 0);
      let balance = BigInt(0);
      for (const tx of transactions) {
        if (tx.txType === "deposit") {
          balance += BigInt(tx.amount);
        } else {
          balance -= BigInt(tx.amount);
        }
      }
      return { balance: balance.toString(), unit: "ISC" };
    }),

    getTransactions: ownerOnlyProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(200).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return getTreasuryTransactions(input.limit, input.offset);
      }),
  }),

  // ─── Staking / Bank Status ──────────────────────────────────────────────
  staking: router({
    getStatus: ownerOnlyProcedure.query(async () => {
      // In production, these would be fetched from the ISCStaking contract
      const poolIdParam = await getContractParam("stakingPoolId");
      return {
        poolId: poolIdParam ? parseInt(poolIdParam.paramValue) : 0,
        currentAPY: "30.00%",
        pendingRewards: "0",
        totalStaked: "0",
        unit: "ISC",
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
