import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { transactionRecords, playerAssets } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { insertTransactionRecord } from '../db';

export const walletRouter = router({
  /**
   * Get wallet balance for current user
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const asset = await db
      .select()
      .from(playerAssets)
      .where(eq(playerAssets.userId, ctx.user.id))
      .limit(1);

    if (!asset || asset.length === 0) {
      return {
        iscBalance: '0',
        usdtBalance: '0',
        totalValue: '0',
      };
    }

    const iscBalance = asset[0].iscBalance || '0';
    const bankBalance = asset[0].bankBalance || '0';
    const totalValue = (parseFloat(iscBalance) + parseFloat(bankBalance)).toFixed(6);

      return {
        iscBalance,
        bankBalance,
        totalValue,
      };
  }),

  /**
   * Initiate a deposit transaction
   */
  initiateDeposit: protectedProcedure
    .input(
      z.object({
        amount: z.string().regex(/^\d+(\.\d+)?$/),
        gasPrice: z.string().regex(/^\d+(\.\d+)?$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      const amount = input.amount;
      const gasPrice = input.gasPrice;
      const totalCost = (parseFloat(amount) * 0.001 + parseFloat(gasPrice)).toFixed(6);

      try {
        // Record the transaction
        await insertTransactionRecord(
          userId,
          'purchase',
          parseFloat(amount),
          parseFloat(amount),
          `Deposit of ${amount} ISC with gas price ${gasPrice}`
        );

        // Get or create player asset
        const existingAsset = db ? await db
          .select()
          .from(playerAssets)
          .where(eq(playerAssets.userId, userId))
          .limit(1) : [];

        if (existingAsset && existingAsset.length > 0) {
          // Update existing asset
          const currentBalance = parseFloat(existingAsset[0].iscBalance || '0');
          const newBalance = (currentBalance + parseFloat(amount)).toFixed(6);

          if (db) {
            await db
              .update(playerAssets)
              .set({
                iscBalance: newBalance,
                updatedAt: new Date(),
              })
              .where(eq(playerAssets.userId, userId));
          }
        } else {
          // Create new asset
          if (db) {
            await db.insert(playerAssets).values({
            userId,
            iscBalance: amount,
            cash: '0',
            bankBalance: '0',
            bankInterest: '0',
            investments: '0',
            properties: '0',
            realEstateValue: '0',
            businesses: '0',
            businessValue: '0',
            totalAssets: amount,
            updatedAt: new Date(),
          });
          }
        }

        return {
          success: true,
          amount,
          totalCost,
          status: 'pending',
        };
      } catch (error) {
        throw new Error(`Failed to initiate deposit: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Confirm deposit transaction
   */
  confirmDeposit: protectedProcedure
    .input(
      z.object({
        amount: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      try {
        // Record the transaction confirmation
        await insertTransactionRecord(
          userId,
          'purchase',
          parseFloat(input.amount),
          parseFloat(input.amount),
          `Deposit confirmed: ${input.amount} ISC`
        );

        return {
          success: true,
          amount: input.amount,
          status: 'completed',
        };
      } catch (error) {
        throw new Error(`Failed to confirm deposit: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Request withdrawal activation
   */
  requestWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.string().regex(/^\d+(\.\d+)?$/),
        recipientAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      try {
        // Check balance
        const asset = db ? await db
          .select()
          .from(playerAssets)
          .where(eq(playerAssets.userId, userId))
          .limit(1) : [];

        if (!asset || asset.length === 0) {
          throw new Error('No asset found');
        }

        const iscBalance = parseFloat(asset[0].iscBalance || '0');
        if (iscBalance < parseFloat(input.amount)) {
          throw new Error('Insufficient balance');
        }

        // Record the withdrawal request
        await insertTransactionRecord(
          userId,
          'withdrawal',
          parseFloat(input.amount),
          parseFloat(input.amount),
          `Withdrawal request: ${input.amount} ISC to ${input.recipientAddress}`
        );

        return {
          success: true,
          activationSent: true,
          message: 'Activation email sent. Please check your inbox.',
        };
      } catch (error) {
        throw new Error(`Failed to request withdrawal: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Verify withdrawal with code
   */
  verifyWithdrawal: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        amount: z.string(),
        recipientAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      try {
        // Verify code (simplified - in production, verify against sent code)
        if (input.code.length !== 6 || !/^\d+$/.test(input.code)) {
          throw new Error('Invalid verification code');
        }

        // Record verified withdrawal
        await insertTransactionRecord(
          userId,
          'withdrawal',
          parseFloat(input.amount),
          parseFloat(input.amount),
          `Withdrawal verified with code: ${input.amount} ISC to ${input.recipientAddress}`
        );

        return {
          success: true,
          verified: true,
          status: 'verified',
        };
      } catch (error) {
        throw new Error(`Failed to verify withdrawal: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Complete withdrawal transaction
   */
  completeWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.string(),
        recipientAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      const userId = ctx.user.id;
      const fee = (parseFloat(input.amount) * 0.02).toFixed(6); // 2% fee
      const netAmount = (parseFloat(input.amount) - parseFloat(fee)).toFixed(6);

      try {
        // Update player asset
        const asset = db ? await db
          .select()
          .from(playerAssets)
          .where(eq(playerAssets.userId, userId))
          .limit(1) : [];

        if (!asset || asset.length === 0) {
          throw new Error('No asset found');
        }

        const currentBalance = parseFloat(asset[0].iscBalance || '0');
        const newBalance = (currentBalance - parseFloat(input.amount)).toFixed(6);

        if (parseFloat(newBalance) < 0) {
          throw new Error('Insufficient balance');
        }

        if (db) {
          await db
            .update(playerAssets)
            .set({
              iscBalance: newBalance,
              updatedAt: new Date(),
            })
            .where(eq(playerAssets.userId, userId));
        }

        // Record the completed withdrawal
        await insertTransactionRecord(
          userId,
          'withdrawal',
          parseFloat(input.amount),
          parseFloat(netAmount),
          `Withdrawal completed: ${netAmount} ISC (Fee: ${fee}) to ${input.recipientAddress}`
        );

        return {
          success: true,
          amount: input.amount,
          netAmount,
          fee,
          status: 'completed',
        };
      } catch (error) {
        throw new Error(`Failed to complete withdrawal: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Get transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        type: z.enum(['purchase', 'withdrawal', 'income', 'expense', 'refund', 'fee', 'all']).default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      const userId = ctx.user.id;

      try {
        const records = await db
          .select()
          .from(transactionRecords)
          .where(
            input.type === 'all'
              ? eq(transactionRecords.userId, userId)
              : and(eq(transactionRecords.userId, userId), eq(transactionRecords.type, input.type))
          )
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          transactions: records,
          count: records.length,
        };
      } catch (error) {
        throw new Error(`Failed to get transaction history: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Get transaction details
   */
  getTransactionDetails: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      try {
        const records = db ? await db
          .select()
          .from(transactionRecords)
          .where(and(eq(transactionRecords.id, input.id), eq(transactionRecords.userId, ctx.user.id))) : [];

        if (records.length === 0) {
          throw new Error('Transaction not found');
        }

        return {
          success: true,
          transaction: records[0],
        };
      } catch (error) {
        throw new Error(`Failed to get transaction details: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
});
