/**
 * Payment System - ISC 链上购买和提现激活
 */

import { getDb, insertTransactionRecord } from '../db';
import { 
  paymentOrders, 
  withdrawalRequests, 
  withdrawalActivations,
  paymentConfigs,
  playerPaymentStats,
  transactionRecords,
  priceHistory,
  kycVerifications,
  riskAssessments,
  playerAssets
} from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class PaymentSystem {
  /**
   * 创建 ISC 购买订单
   */
  static async createPurchaseOrder(
    userId: number,
    iscAmount: number,
    chainAddress: string
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // 获取当前配置
      const configResult = await db.select().from(paymentConfigs).limit(1);
      const config = configResult.length > 0 ? configResult[0] : null;
      if (!config) throw new Error('Payment config not found');

      // 验证购买金额
      if (iscAmount < Number(config.minPurchaseAmount) || iscAmount > Number(config.maxPurchaseAmount)) {
        throw new Error(`Purchase amount must be between ${config.minPurchaseAmount} and ${config.maxPurchaseAmount}`);
      }

      // 计算 USDT 价值
      const usdtValue = iscAmount * Number(config.iscPrice);

      // 创建订单
      const orderNo = `PO-${Date.now()}-${randomUUID().slice(0, 8)}`;
      await db.insert(paymentOrders).values({
        userId,
        orderNo,
        type: 'purchase',
        amount: iscAmount.toString(),
        usdtValue: usdtValue.toString(),
        status: 'pending',
        fromAddress: chainAddress,
        toAddress: process.env.PAYMENT_WALLET_ADDRESS || '',
        metadata: JSON.stringify({ chainAddress }),
      });

      return { orderNo, amount: iscAmount, usdtValue };
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      throw error;
    }
  }

  /**
   * 确认支付订单（链上验证后调用）
   */
  static async confirmPaymentOrder(
    orderId: number,
    txHash: string,
    gasUsed: number,
    gasFee: number
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const orderResult = await db.select().from(paymentOrders).where(eq(paymentOrders.id, orderId)).limit(1);
      const order = orderResult.length > 0 ? orderResult[0] : null;

      if (!order) throw new Error('Order not found');
      if (order.status !== 'pending') throw new Error('Order already processed');

      // 更新订单状态
      await db.update(paymentOrders)
        .set({
          status: 'confirmed',
          txHash,
          gasUsed: gasFee.toString(),
          gasFee: gasFee.toString(),
          confirmedAt: new Date(),
        })
        .where(eq(paymentOrders.id, orderId));

      // 更新玩家资产
      const playerAssetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, order.userId)).limit(1);
      const playerAssetsRecord = playerAssetsResult.length > 0 ? playerAssetsResult[0] : null;

      if (playerAssetsRecord) {
        const newBalance = Number(playerAssetsRecord.iscBalance) + Number(order.amount);
        await db.update(playerAssets)
          .set({
            iscBalance: newBalance.toString(),
            totalAssets: (Number(playerAssetsRecord.totalAssets) + Number(order.amount)).toString(),
          })
          .where(eq(playerAssets.userId, order.userId));
      }

      // 更新玩家支付统计
      await this.updatePlayerPaymentStats(order.userId, {
        totalPurchased: Number(order.amount),
        totalGasPaid: gasFee,
      });

      // 记录交易
      const finalBalance = playerAssetsRecord ? Number(playerAssetsRecord.iscBalance) + Number(order.amount) : Number(order.amount);
      await insertTransactionRecord(
        order.userId,
        'purchase',
        Number(order.amount),
        finalBalance,
        `Purchased ${order.amount} ISC (Gas: ${gasFee})`,
        orderId
      );

      return { success: true, orderId, amount: order.amount };
    } catch (error) {
      console.error('Failed to confirm payment order:', error);
      throw error;
    }
  }

  /**
   * 创建提现激活订单（5 USDT）
   */
  static async createWithdrawalActivation(userId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // 检查 KYC 验证
      const kycResult = await db.select().from(kycVerifications).where(and(
        eq(kycVerifications.userId, userId),
        eq(kycVerifications.status, 'approved')
      )).limit(1);
      const kyc = kycResult.length > 0 ? kycResult[0] : null;

      if (!kyc) throw new Error('KYC verification required');

      // 检查风险评估
      const riskResult = await db.select().from(riskAssessments).where(eq(riskAssessments.userId, userId)).limit(1);
      const risk = riskResult.length > 0 ? riskResult[0] : null;

      if (risk && risk.riskScore > 70) {
        throw new Error('Account blocked due to high risk score');
      }

      // 获取配置
      const configResult = await db.select().from(paymentConfigs).limit(1);
      const config = configResult.length > 0 ? configResult[0] : null;
      if (!config) throw new Error('Payment config not found');

      // 计算所需 ISC
      const requiredISC = Number(config.withdrawalActivationAmount) / Number(config.iscPrice);

      // 创建激活订单
      const activationNo = `WA-${Date.now()}-${randomUUID().slice(0, 8)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 小时有效期

      await db.insert(withdrawalActivations).values({
        userId,
        activationNo,
        requiredAmount: config.withdrawalActivationAmount.toString(),
        requiredISC: requiredISC.toString(),
        status: 'pending',
        expiresAt,
      });

      return {
        activationNo,
        requiredAmount: Number(config.withdrawalActivationAmount),
        requiredISC,
        expiresAt,
      };
    } catch (error) {
      console.error('Failed to create withdrawal activation:', error);
      throw error;
    }
  }

  /**
   * 确认提现激活
   */
  static async confirmWithdrawalActivation(
    activationId: number,
    txHash: string
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const activationResult = await db.select().from(withdrawalActivations).where(eq(withdrawalActivations.id, activationId)).limit(1);
      const activation = activationResult.length > 0 ? activationResult[0] : null;

      if (!activation) throw new Error('Activation not found');
      if (activation.status !== 'pending') throw new Error('Activation already processed');

      // 更新激活状态
      await db.update(withdrawalActivations)
        .set({
          status: 'confirmed',
          txHash,
          confirmedAt: new Date(),
        })
        .where(eq(withdrawalActivations.id, activationId));

      // 更新玩家支付统计
      await db.update(playerPaymentStats)
        .set({
          withdrawalActivated: true,
          activationDate: new Date(),
        })
        .where(eq(playerPaymentStats.userId, activation.userId));

      return { success: true, activationId };
    } catch (error) {
      console.error('Failed to confirm withdrawal activation:', error);
      throw error;
    }
  }

  /**
   * 创建提现请求
   */
  static async createWithdrawalRequest(
    userId: number,
    iscAmount: number,
    chainAddress: string
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // 检查提现激活状态
      const statsResult = await db.select().from(playerPaymentStats).where(eq(playerPaymentStats.userId, userId)).limit(1);
      const stats = statsResult.length > 0 ? statsResult[0] : null;

      if (!stats || !stats.withdrawalActivated) {
        throw new Error('Withdrawal activation required');
      }

      // 获取配置
      const configResult = await db.select().from(paymentConfigs).limit(1);
      const config = configResult.length > 0 ? configResult[0] : null;
      if (!config) throw new Error('Payment config not found');

      // 验证提现金额
      if (iscAmount < Number(config.minWithdrawalAmount) || iscAmount > Number(config.maxWithdrawalAmount)) {
        throw new Error(`Withdrawal amount must be between ${config.minWithdrawalAmount} and ${config.maxWithdrawalAmount}`);
      }

      // 检查玩家余额
      const playerAssetsResult = await db.select().from(playerAssets).where(eq(playerAssets.userId, userId)).limit(1);
      const playerAssetsRecord = playerAssetsResult.length > 0 ? playerAssetsResult[0] : null;

      if (!playerAssetsRecord || Number(playerAssetsRecord.iscBalance) < iscAmount) {
        throw new Error('Insufficient ISC balance');
      }

      // 计算 USDT 价值
      const usdtValue = iscAmount * Number(config.iscPrice);

      // 创建提现请求
      const requestNo = `WR-${Date.now()}-${randomUUID().slice(0, 8)}`;
      await db.insert(withdrawalRequests).values({
        userId,
        requestNo,
        amount: iscAmount.toString(),
        usdtValue: usdtValue.toString(),
        chainAddress,
        status: 'pending',
        requiresActivation: false,
      });

      // 扣除玩家余额
      await db.update(playerAssets)
        .set({
          iscBalance: (Number(playerAssetsRecord.iscBalance) - iscAmount).toString(),
          totalAssets: (Number(playerAssetsRecord.totalAssets) - iscAmount).toString(),
        })
        .where(eq(playerAssets.userId, userId));

      // 记录交易
      await insertTransactionRecord(
        userId,
        'withdrawal',
        iscAmount,
        Number(playerAssetsRecord.iscBalance) - iscAmount,
        `Withdrawal request for ${iscAmount} ISC to ${chainAddress}`
      );

      return { requestNo, amount: iscAmount, usdtValue };
    } catch (error) {
      console.error('Failed to create withdrawal request:', error);
      throw error;
    }
  }

  /**
   * 确认提现请求（链上验证后调用）
   */
  static async confirmWithdrawal(
    withdrawalId: number,
    txHash: string,
    gasFee: number
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const withdrawalResult = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, withdrawalId)).limit(1);
      const withdrawal = withdrawalResult.length > 0 ? withdrawalResult[0] : null;

      if (!withdrawal) throw new Error('Withdrawal not found');
      if (withdrawal.status !== 'pending') throw new Error('Withdrawal already processed');

      // 更新提现状态
      await db.update(withdrawalRequests)
        .set({
          status: 'completed',
          txHash,
          completedAt: new Date(),
        })
        .where(eq(withdrawalRequests.id, withdrawalId));

      // 更新玩家支付统计
      await this.updatePlayerPaymentStats(withdrawal.userId, {
        totalWithdrawn: Number(withdrawal.amount),
        totalGasPaid: gasFee,
      });

      return { success: true, withdrawalId, amount: withdrawal.amount };
    } catch (error) {
      console.error('Failed to confirm withdrawal:', error);
      throw error;
    }
  }

  /**
   * 更新玩家支付统计
   */
  static async updatePlayerPaymentStats(
    userId: number,
    updates: {
      totalPurchased?: number;
      totalWithdrawn?: number;
      totalSpent?: number;
      totalGasPaid?: number;
    }
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const statsResult = await db.select().from(playerPaymentStats).where(eq(playerPaymentStats.userId, userId)).limit(1);
      const stats = statsResult.length > 0 ? statsResult[0] : null;

      if (!stats) {
        // 创建新的统计记录
        await db.insert(playerPaymentStats).values({
          userId,
          totalPurchased: updates.totalPurchased?.toString() || '0',
          totalWithdrawn: updates.totalWithdrawn?.toString() || '0',
          totalSpent: updates.totalSpent?.toString() || '0',
          totalGasPaid: updates.totalGasPaid?.toString() || '0',
        });
      } else {
        // 更新现有记录
        await db.update(playerPaymentStats)
          .set({
            totalPurchased: (Number(stats.totalPurchased) + (updates.totalPurchased || 0)).toString(),
            totalWithdrawn: (Number(stats.totalWithdrawn) + (updates.totalWithdrawn || 0)).toString(),
            totalSpent: (Number(stats.totalSpent) + (updates.totalSpent || 0)).toString(),
            totalGasPaid: (Number(stats.totalGasPaid) + (updates.totalGasPaid || 0)).toString(),
          })
          .where(eq(playerPaymentStats.userId, userId));
      }
    } catch (error) {
      console.error('Failed to update player payment stats:', error);
      throw error;
    }
  }

  /**
   * 获取玩家支付统计
   */
  static async getPlayerPaymentStats(userId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db.select().from(playerPaymentStats).where(eq(playerPaymentStats.userId, userId)).limit(1);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Failed to get player payment stats:', error);
      throw error;
    }
  }

  /**
   * 获取 ISC 价格
   */
  static async getISCPrice() {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const configResult = await db.select().from(paymentConfigs).limit(1);
      const config = configResult.length > 0 ? configResult[0] : null;
      return config ? Number(config.iscPrice) : 0.1;
    } catch (error) {
      console.error('Failed to get ISC price:', error);
      return 0.1;
    }
  }

  /**
   * 更新 ISC 价格
   */
  static async updateISCPrice(newPrice: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // 记录价格历史
      await db.insert(priceHistory).values({
        iscPrice: newPrice.toString(),
      });

      // 更新配置
      const configResult = await db.select().from(paymentConfigs).limit(1);
      const config = configResult.length > 0 ? configResult[0] : null;
      if (config) {
        await db.update(paymentConfigs)
          .set({ iscPrice: newPrice.toString() })
          .where(eq(paymentConfigs.id, config.id));
      }

      return { success: true, newPrice };
    } catch (error) {
      console.error('Failed to update ISC price:', error);
      throw error;
    }
  }

  /**
   * 获取交易历史
   */
  static async getTransactionHistory(userId: number, limit: number = 50) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      return await db.select().from(transactionRecords).where(eq(transactionRecords.userId, userId)).orderBy(desc(transactionRecords.createdAt)).limit(limit);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  /**
   * 检查订单状态
   */
  static async getOrderStatus(orderId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const result = await db.select().from(paymentOrders).where(eq(paymentOrders.id, orderId)).limit(1);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Failed to get order status:', error);
      throw error;
    }
  }
}
