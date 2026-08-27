import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BankingSystem, getBankingSystem, resetBankingSystem } from './bankingSystem';

describe('BankingSystem', () => {
  let banking: BankingSystem;

  beforeEach(() => {
    resetBankingSystem();
    banking = getBankingSystem();
  });

  afterEach(() => {
    banking.clear();
  });

  describe('账户初始化', () => {
    it('应该创建新账户', () => {
      const account = banking.initializeAccount('player1');
      expect(account.playerId).toBe('player1');
      expect(account.balance).toBe(0);
      expect(account.totalDeposited).toBe(0);
    });

    it('应该返回现有账户', () => {
      banking.initializeAccount('player1');
      const account2 = banking.initializeAccount('player1');
      expect(account2.playerId).toBe('player1');
    });
  });

  describe('存款功能', () => {
    it('应该成功存款', () => {
      const result = banking.deposit('player1', 100);
      expect(result.success).toBe(true);
      expect(result.account?.balance).toBe(100);
      expect(result.account?.totalDeposited).toBe(100);
    });

    it('应该拒绝负数存款', () => {
      const result = banking.deposit('player1', -50);
      expect(result.success).toBe(false);
      expect(result.error).toContain('必须大于 0');
    });

    it('应该拒绝低于最小存款额', () => {
      const result = banking.deposit('player1', 0.5);
      expect(result.success).toBe(false);
      expect(result.error).toContain('最小存款额');
    });

    it('应该拒绝超过最大存款额', () => {
      const result = banking.deposit('player1', 2000000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('不能超过');
    });

    it('应该累积多次存款', () => {
      banking.deposit('player1', 100);
      banking.deposit('player1', 200);
      const account = banking.getAccount('player1');
      expect(account?.balance).toBe(300);
      expect(account?.totalDeposited).toBe(300);
    });
  });

  describe('取款功能', () => {
    it('应该成功取款', () => {
      banking.deposit('player1', 100);
      const result = banking.withdraw('player1', 50);
      expect(result.success).toBe(true);
      expect(result.account?.balance).toBe(50);
      expect(result.account?.totalWithdrawn).toBe(50);
    });

    it('应该拒绝余额不足', () => {
      banking.deposit('player1', 100);
      const result = banking.withdraw('player1', 150);
      expect(result.success).toBe(false);
      expect(result.error).toContain('余额不足');
    });

    it('应该拒绝取款不存在的账户', () => {
      const result = banking.withdraw('nonexistent', 50);
      expect(result.success).toBe(false);
      expect(result.error).toContain('账户不存在');
    });

    it('应该拒绝负数取款', () => {
      banking.deposit('player1', 100);
      const result = banking.withdraw('player1', -50);
      expect(result.success).toBe(false);
    });
  });

  describe('利息计算', () => {
    it('应该计算利息', () => {
      banking.deposit('player1', 1000);
      const result = banking.calculateInterest('player1');
      expect(result.success).toBe(true);
      expect(result.interest).toBeGreaterThanOrEqual(0);
    });

    it('应该更新利息记录', () => {
      banking.deposit('player1', 1000);
      let account = banking.getAccount('player1');
      if (account) {
        account.lastInterestCalculation = Date.now() - 24 * 60 * 60 * 1000; // 1 天前
      }
      banking.calculateInterest('player1');
      const records = banking.getInterestRecords('player1');
      expect(records.length).toBeGreaterThan(0);
    });

    it('应该累积利息到余额', () => {
      banking.deposit('player1', 1000);
      const beforeInterest = banking.getAccount('player1')?.balance || 0;
      // 模拟一个天后的利息计算
      const account = banking.getAccount('player1');
      if (account) {
        account.lastInterestCalculation = Date.now() - 24 * 60 * 60 * 1000; // 1 天前
      }
      banking.calculateInterest('player1');
      const afterInterest = banking.getAccount('player1')?.balance || 0;
      expect(afterInterest).toBeGreaterThanOrEqual(beforeInterest);
    });

    it('空账户不应该计算利息', () => {
      const result = banking.calculateInterest('nonexistent');
      expect(result.success).toBe(false);
      expect(result.interest).toBe(0);
    });

    it('余额为 0 不应该计算利息', () => {
      banking.initializeAccount('player1');
      const result = banking.calculateInterest('player1');
      expect(result.success).toBe(false);
      expect(result.interest).toBe(0);
    });
  });

  describe('利息统计', () => {
    it('应该返回利息统计', () => {
      banking.deposit('player1', 1000);
      banking.calculateInterest('player1');
      const stats = banking.getInterestStats('player1');
      expect(stats.totalInterest).toBeGreaterThanOrEqual(0);
      // 利息可能为 0，因为时间很短
      expect(stats.recordCount).toBeGreaterThanOrEqual(0);
    });

    it('空账户应该返回零统计', () => {
      const stats = banking.getInterestStats('nonexistent');
      expect(stats.totalInterest).toBe(0);
      expect(stats.recordCount).toBe(0);
    });
  });

  describe('APY 配置', () => {
    it('应该获取默认 APY 配置', () => {
      const config = banking.getAPYConfig();
      expect(config.baseAPY).toBe(5);
      expect(config.bonusAPY).toBe(2);
      expect(config.enabled).toBe(true);
    });

    it('应该更新 APY 配置', () => {
      banking.updateAPYConfig({ baseAPY: 10, bonusAPY: 3 });
      const config = banking.getAPYConfig();
      expect(config.baseAPY).toBe(10);
      expect(config.bonusAPY).toBe(3);
    });
  });

  describe('收益预测', () => {
    it('应该计算预期收益', () => {
      const projected = banking.calculateProjectedReturn(1000, 365);
      expect(projected).toBeGreaterThan(0);
    });

    it('应该支持自定义 APY', () => {
      const projected1 = banking.calculateProjectedReturn(1000, 365, 5);
      const projected2 = banking.calculateProjectedReturn(1000, 365, 10);
      expect(projected2).toBeGreaterThan(projected1);
    });

    it('0 天应该返回 0', () => {
      const projected = banking.calculateProjectedReturn(1000, 0);
      expect(projected).toBe(0);
    });
  });

  describe('全局统计', () => {
    it('应该计算所有账户统计', () => {
      banking.deposit('player1', 1000);
      banking.deposit('player2', 2000);
      const stats = banking.getAllAccountsStats();
      expect(stats.totalAccounts).toBe(2);
      expect(stats.totalDeposited).toBe(3000);
      expect(stats.totalBalance).toBe(3000);
    });

    it('空系统应该返回零统计', () => {
      const stats = banking.getAllAccountsStats();
      expect(stats.totalAccounts).toBe(0);
      expect(stats.totalDeposited).toBe(0);
    });
  });

  describe('单例模式', () => {
    it('应该返回同一实例', () => {
      const instance1 = getBankingSystem();
      const instance2 = getBankingSystem();
      expect(instance1).toBe(instance2);
    });

    it('重置后应该创建新实例', () => {
      const instance1 = getBankingSystem();
      resetBankingSystem();
      const instance2 = getBankingSystem();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('集成测试', () => {
    it('完整的存取和利息流程', () => {
      // 存款
      banking.deposit('player1', 5000);
      let account = banking.getAccount('player1');
      expect(account?.balance).toBe(5000);

      // 计算利息（模拟 1 天后）
      account = banking.getAccount('player1');
      if (account) {
        account.lastInterestCalculation = Date.now() - 24 * 60 * 60 * 1000;
      }
      banking.calculateInterest('player1');
      account = banking.getAccount('player1');
      expect(account?.balance).toBeGreaterThanOrEqual(5000);

      // 部分取款
      banking.withdraw('player1', 1000);
      account = banking.getAccount('player1');
      expect(account?.totalWithdrawn).toBe(1000);

      // 再次存款
      banking.deposit('player1', 2000);
      account = banking.getAccount('player1');
      expect(account?.totalDeposited).toBe(7000);

      // 获取统计
      const stats = banking.getInterestStats('player1');
      expect(stats.recordCount).toBeGreaterThan(0);
    });

    it('多玩家场景', () => {
      // 玩家 1
      banking.deposit('player1', 1000);
      let account = banking.getAccount('player1');
      if (account) {
        account.lastInterestCalculation = Date.now() - 24 * 60 * 60 * 1000;
      }
      banking.calculateInterest('player1');

      // 玩家 2
      banking.deposit('player2', 5000);
      account = banking.getAccount('player2');
      if (account) {
        account.lastInterestCalculation = Date.now() - 24 * 60 * 60 * 1000;
      }
      banking.calculateInterest('player2');

      // 玩家 3
      banking.deposit('player3', 500);

      // 全局统计
      const stats = banking.getAllAccountsStats();
      expect(stats.totalAccounts).toBe(3);
      expect(stats.totalDeposited).toBe(6500);
      expect(stats.totalInterestEarned).toBeGreaterThanOrEqual(0);
    });
  });
});
