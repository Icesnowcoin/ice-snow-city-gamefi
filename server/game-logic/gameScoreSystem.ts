/**
 * 游戏内记分系统
 * 所有游戏内操作仅在游戏内记分，不进行区块链交互
 * 仅在充值和提取时进行区块链交互
 */

import { getDb, insertTransactionRecord } from '../db';
import { playerAssets } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export class GameScoreSystem {
  /**
   * 初始化玩家游戏余额
   */
  static async initializePlayerBalance(userId: number, initialBalance: number = 0) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const existingResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, userId)).limit(1);
      const existing = existingResult.length > 0 ? existingResult[0] : null;

      if (!existing) {
        await db.insert(playerAssets).values({
          userId,
          iscBalance: initialBalance.toString(),
          totalAssets: initialBalance.toString(),
          cash: '0',
          bankBalance: '0',
          bankInterest: '0',
          investments: '0',
          properties: '0',
          realEstateValue: '0',
          businesses: '0',
          businessValue: '0',
        });
      }

      return { success: true, userId, balance: initialBalance };
    } catch (error) {
      console.error('Failed to initialize player balance:', error);
      throw error;
    }
  }

  /**
   * 获取玩家游戏余额
   */
  static async getPlayerBalance(userId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const assetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, userId)).limit(1);
      const assets = assetsResult.length > 0 ? assetsResult[0] : null;

      if (!assets) {
        await this.initializePlayerBalance(userId);
        return { iscBalance: '0', totalAssets: '0' };
      }

      return {
        iscBalance: assets.iscBalance,
        totalAssets: assets.totalAssets,
        cash: assets.cash,
        bankBalance: assets.bankBalance,
        investments: assets.investments,
        properties: assets.properties,
        businesses: assets.businesses,
      };
    } catch (error) {
      console.error('Failed to get player balance:', error);
      throw error;
    }
  }

  /**
   * 添加游戏分数
   */
  static async addGameScore(
    userId: number,
    amount: number,
    description: string
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const assetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, userId)).limit(1);
      const assets = assetsResult.length > 0 ? assetsResult[0] : null;

      if (!assets) {
        throw new Error('Player balance not found');
      }

      const currentBalance = Number(assets?.iscBalance || 0);
      const newBalance = currentBalance + amount;

      // 更新玩家资产
      await db.update(playerAssets)
        .set({
          iscBalance: newBalance.toString(),
          totalAssets: (Number(assets?.totalAssets || 0) + amount).toString(),
        })
        .where(eq(playerAssets.userId, userId));

      // 记录交易
      await insertTransactionRecord(
        userId,
        'income',
        amount,
        newBalance,
        description
      );

      return { success: true, userId, amount, newBalance };
    } catch (error) {
      console.error('Failed to add game score:', error);
      throw error;
    }
  }

  /**
   * 扣除游戏内积分（购买、消费等）
   */
  static async deductGameScore(
    userId: number,
    amount: number,
    type: 'purchase' | 'penalty' | 'tax' | 'utility_bill',
    description: string,
    itemId?: number
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const assetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, userId)).limit(1);
      const assets = assetsResult.length > 0 ? assetsResult[0] : null;

      if (!assets) {
        throw new Error('Player balance not found');
      }

      const currentBalance = Number(assets.iscBalance);
      if (currentBalance < amount) {
        throw new Error('Insufficient game score balance');
      }

      const newBalance = currentBalance - amount;

      // 更新玩家资产
      await db.update(playerAssets)
        .set({
          iscBalance: newBalance.toString(),
          totalAssets: (Number(assets.totalAssets) - amount).toString(),
        })
        .where(eq(playerAssets.userId, userId));

      // 记录交易
      await insertTransactionRecord(
        userId,
        'purchase',
        amount,
        newBalance,
        description,
        itemId
      );

      return { success: true, userId, amount, newBalance };
    } catch (error) {
      console.error('Failed to deduct game score:', error);
      throw error;
    }
  }

  /**
   * 转账游戏内积分（玩家间转账）
   */
  static async transferGameScore(
    fromUserId: number,
    toUserId: number,
    amount: number,
    description: string = 'Player transfer'
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // 检查发送者余额
      const fromAssetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, fromUserId)).limit(1);
      const fromAssets = fromAssetsResult.length > 0 ? fromAssetsResult[0] : null;

      if (!fromAssets || Number(fromAssets.iscBalance) < amount) {
        throw new Error('Insufficient balance for transfer');
      }

      // 检查接收者账户
      let toAssetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, toUserId)).limit(1);
      let toAssets = toAssetsResult.length > 0 ? toAssetsResult[0] : null;

      if (!toAssets) {
        await this.initializePlayerBalance(toUserId);
        toAssetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, toUserId)).limit(1);
        toAssets = toAssetsResult.length > 0 ? toAssetsResult[0] : null;
      }

      // 扣除发送者
      const fromNewBalance = Number(fromAssets.iscBalance) - amount;
      await db.update(playerAssets)
        .set({
          iscBalance: fromNewBalance.toString(),
          totalAssets: (Number(fromAssets.totalAssets) - amount).toString(),
        })
        .where(eq(playerAssets.userId, fromUserId));

      // 增加接收者
      const toNewBalance = Number(toAssets!.iscBalance) + amount;
      await db.update(playerAssets)
        .set({
          iscBalance: toNewBalance.toString(),
          totalAssets: (Number(toAssets!.totalAssets) + amount).toString(),
        })
        .where(eq(playerAssets.userId, toUserId));

      // 记录交易
      await insertTransactionRecord(
        fromUserId,
        'expense',
        amount,
        fromNewBalance,
        `Transfer to player ${toUserId}: ${description}`
      );

      await insertTransactionRecord(
        toUserId,
        'income',
        amount,
        toNewBalance,
        `Received from player ${fromUserId}: ${description}`
      );

      return {
        success: true,
        fromUserId,
        toUserId,
        amount,
        fromNewBalance,
        toNewBalance,
      };
    } catch (error) {
      console.error('Failed to transfer game score:', error);
      throw error;
    }
  }

  /**
   * 购买物品（检查余额，余额不足时返回需要充值的金额）
   */
  static async purchaseItem(
    userId: number,
    itemType: 'land' | 'house' | 'item' | 'facility',
    itemId: number,
    cost: number,
    description: string
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const assetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, userId)).limit(1);
      const assets = assetsResult.length > 0 ? assetsResult[0] : null;

      if (!assets) {
        throw new Error('Player balance not found');
      }

      const currentBalance = Number(assets.iscBalance);

      if (currentBalance < cost) {
        // 余额不足，返回需要充值的金额
        const shortfall = cost - currentBalance;
        return {
          success: false,
          reason: 'insufficient_balance',
          currentBalance,
          requiredAmount: cost,
          shortfall,
          message: `需要充值 ${shortfall} ISC 才能完成购买`,
        };
      }

      // 余额充足，直接扣除
      const newBalance = currentBalance - cost;
      await db.update(playerAssets)
        .set({
          iscBalance: newBalance.toString(),
          totalAssets: (Number(assets.totalAssets) - cost).toString(),
        })
        .where(eq(playerAssets.userId, userId));

      // 记录交易
      await insertTransactionRecord(
        userId,
        'purchase',
        cost,
        newBalance,
        `Purchase ${itemType}: ${description}`,
        itemId
      );

      return {
        success: true,
        userId,
        itemType,
        itemId,
        cost,
        newBalance,
        message: 'Purchase successful',
      };
    } catch (error) {
      console.error('Failed to purchase item:', error);
      throw error;
    }
  }

  /**
   * 获取交易历史
   */
  static async getTransactionHistory(userId: number, limit: number = 50) {
    try {
      // Use the helper function from db.ts
      const { getTransactionHistory } = await import('../db');
      return await getTransactionHistory(userId, limit);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  /**
   * 支付电费和水费
   */
  static async payUtilityBills(
    userId: number,
    electricityFee: number,
    waterFee: number
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const totalFee = electricityFee + waterFee;
      const assetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, userId)).limit(1);
      const assets = assetsResult.length > 0 ? assetsResult[0] : null;

      if (!assets || Number(assets.iscBalance) < totalFee) {
        throw new Error('Insufficient ISC balance');
      }

      const newBalance = Number(assets.iscBalance) - totalFee;
      await db.update(playerAssets)
        .set({
          iscBalance: newBalance.toString(),
          totalAssets: (Number(assets.totalAssets) - totalFee).toString(),
        })
        .where(eq(playerAssets.userId, userId));

      // 记录交易
      await insertTransactionRecord(
        userId,
        'fee',
        totalFee,
        newBalance,
        `Utility bills: Electricity ${electricityFee} ISC + Water ${waterFee} ISC`
      );

      return { success: true, userId, totalFee, newBalance };
    } catch (error) {
      console.error('Failed to pay utility bills:', error);
      throw error;
    }
  }
}
