import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { BankingSystem, getBankingSystem } from '../game-logic/bankingSystem';

export const bankingRouter = router({
  /**
   * 获取玩家银行账户信息
   */
  getAccount: protectedProcedure.query(({ ctx }) => {
    const banking = getBankingSystem();
    const account = banking.getAccount(ctx.user.openId);
    
    if (!account) {
      // 初始化账户
      return banking.initializeAccount(ctx.user.openId);
    }
    
    return account;
  }),

  /**
   * 存款
   */
  deposit: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(({ input, ctx }) => {
      const banking = getBankingSystem();
      const result = banking.deposit(ctx.user.openId, input.amount);
      
      if (!result.success) {
        throw new Error(result.error || '存款失败');
      }
      
      return {
        success: true,
        account: result.account,
        message: `成功存入 ${input.amount} ISC`,
      };
    }),

  /**
   * 取款
   */
  withdraw: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(({ input, ctx }) => {
      const banking = getBankingSystem();
      const result = banking.withdraw(ctx.user.openId, input.amount);
      
      if (!result.success) {
        throw new Error(result.error || '取款失败');
      }
      
      return {
        success: true,
        account: result.account,
        message: `成功取出 ${input.amount} ISC`,
      };
    }),

  /**
   * 计算并领取利息
   */
  claimInterest: protectedProcedure.mutation(({ ctx }) => {
    const banking = getBankingSystem();
    const result = banking.claimDailyInterest(ctx.user.openId);
    
    if (!result.success) {
      return {
        success: false,
        interest: 0,
        message: '暂无可领取的利息',
      };
    }
    
    return {
      success: true,
      interest: result.interest,
      account: result.account,
      message: result.interest > 0 
        ? `成功领取 ${result.interest.toFixed(3)} ISC 利息`
        : '今日利息已领取',
    };
  }),

  /**
   * 获取利息记录
   */
  getInterestRecords: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input, ctx }) => {
      const banking = getBankingSystem();
      return banking.getInterestRecords(ctx.user.openId, input.limit || 30);
    }),

  /**
   * 获取利息统计
   */
  getInterestStats: protectedProcedure.query(({ ctx }) => {
    const banking = getBankingSystem();
    return banking.getInterestStats(ctx.user.openId);
  }),

  /**
   * 获取 APY 配置
   */
  getAPYConfig: protectedProcedure.query(() => {
    const banking = getBankingSystem();
    return banking.getAPYConfig();
  }),

  /**
   * 计算预期收益
   */
  calculateProjectedReturn: protectedProcedure
    .input(z.object({ 
      principal: z.number().positive(),
      days: z.number().positive(),
      apy: z.number().optional(),
    }))
    .query(({ input }) => {
      const banking = getBankingSystem();
      return {
        principal: input.principal,
        days: input.days,
        projectedReturn: banking.calculateProjectedReturn(
          input.principal,
          input.days,
          input.apy
        ),
        finalAmount: input.principal + banking.calculateProjectedReturn(
          input.principal,
          input.days,
          input.apy
        ),
      };
    }),

  /**
   * 获取全局统计（仅用于调试/管理）
   */
  getAllAccountsStats: protectedProcedure.query(({ ctx }) => {
    // 仅允许所有者查看
    if (ctx.user.role !== 'admin') {
      throw new Error('权限不足');
    }
    
    const banking = getBankingSystem();
    return banking.getAllAccountsStats();
  }),
});
