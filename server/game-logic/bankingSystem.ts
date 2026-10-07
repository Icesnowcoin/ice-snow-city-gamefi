/**
 * Banking System - ISC 存款、利息计算、APY 合约集成
 * 支持玩家存款、取款、利息自动计算、APY 合约交互
 */

// 数据库操作可选，主要使用内存存储

export interface BankAccount {
  playerId: string;
  balance: number; // ISC 余额
  totalDeposited: number; // 总存入金额
  totalWithdrawn: number; // 总取出金额
  interestEarned: number; // 已赚取利息
  lastInterestCalculation: number; // 上次利息计算时间戳
  createdAt: number;
  updatedAt: number;
}

export interface InterestRecord {
  id: string;
  playerId: string;
  amount: number; // 利息金额
  rate: number; // 利息率 (%)
  period: number; // 计息周期 (天)
  calculatedAt: number;
}

export interface APYContractConfig {
  address: string; // APY 合约地址
  decimals: number; // 代币小数位
  minDeposit: number; // 最小存款额
  maxDeposit: number; // 最大存款额
  baseAPY: number; // 基础 APY (%)
  bonusAPY: number; // 额外奖励 APY (%)
  lockupPeriod: number; // 锁定期 (天)
  enabled: boolean; // 是否启用
}

export class BankingSystem {
  private accounts: Map<string, BankAccount> = new Map();
  private interestRecords: Map<string, InterestRecord[]> = new Map();
  private apyConfig: APYContractConfig;

  constructor(apyContractAddress: string = '0x9014Be9d27b64a4cb889B9d0334740683F18185a') {
    this.apyConfig = {
      address: apyContractAddress,
      decimals: 18,
      minDeposit: 1,
      maxDeposit: 1000000,
      baseAPY: 5,
      bonusAPY: 2,
      lockupPeriod: 30,
      enabled: true,
    };
  }

  /**
   * 初始化玩家银行账户
   */
  initializeAccount(playerId: string): BankAccount {
    if (this.accounts.has(playerId)) {
      return this.accounts.get(playerId)!;
    }

    const now = Date.now();
    const account: BankAccount = {
      playerId,
      balance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      interestEarned: 0,
      lastInterestCalculation: now,
      createdAt: now,
      updatedAt: now,
    };

    this.accounts.set(playerId, account);
    this.interestRecords.set(playerId, []);
    return account;
  }

  /**
   * 获取玩家账户信息
   */
  getAccount(playerId: string): BankAccount | null {
    return this.accounts.get(playerId) || null;
  }

  /**
   * 存款
   */
  deposit(playerId: string, amount: number): { success: boolean; account: BankAccount | null; error?: string } {
    if (amount <= 0) {
      return { success: false, account: null, error: '存款金额必须大于 0' };
    }

    if (amount < this.apyConfig.minDeposit) {
      return {
        success: false,
        account: null,
        error: `最小存款额为 ${this.apyConfig.minDeposit} ISC`,
      };
    }

    let account = this.getAccount(playerId);
    if (!account) {
      account = this.initializeAccount(playerId);
    }

    if (account.balance + amount > this.apyConfig.maxDeposit) {
      return {
        success: false,
        account: null,
        error: `账户余额不能超过 ${this.apyConfig.maxDeposit} ISC`,
      };
    }

    account.balance += amount;
    account.totalDeposited += amount;
    account.updatedAt = Date.now();

    return { success: true, account };
  }

  /**
   * 取款
   */
  withdraw(playerId: string, amount: number): { success: boolean; account: BankAccount | null; error?: string } {
    if (amount <= 0) {
      return { success: false, account: null, error: '取款金额必须大于 0' };
    }

    const account = this.getAccount(playerId);
    if (!account) {
      return { success: false, account: null, error: '账户不存在' };
    }

    if (account.balance < amount) {
      return { success: false, account: null, error: '余额不足' };
    }

    account.balance -= amount;
    account.totalWithdrawn += amount;
    account.updatedAt = Date.now();

    return { success: true, account };
  }

  /**
   * 计算利息（基于时间和 APY）
   */
  calculateInterest(playerId: string): { success: boolean; interest: number; account: BankAccount | null } {
    const account = this.getAccount(playerId);
    if (!account || account.balance === 0) {
      return { success: false, interest: 0, account };
    }

    const now = Date.now();
    const daysSinceLastCalculation = (now - account.lastInterestCalculation) / (1000 * 60 * 60 * 24);

    // 计算 APY（基础 + 奖励）
    const totalAPY = this.apyConfig.baseAPY + this.apyConfig.bonusAPY;
    const dailyRate = totalAPY / 365 / 100;
    const interest = Math.floor(account.balance * dailyRate * daysSinceLastCalculation * 1000) / 1000;

    if (interest > 0) {
      account.balance += interest;
      account.interestEarned += interest;
      account.lastInterestCalculation = now;
      account.updatedAt = now;

      // 记录利息计算
      const record: InterestRecord = {
        id: `${playerId}-${now}`,
        playerId,
        amount: interest,
        rate: totalAPY,
        period: Math.ceil(daysSinceLastCalculation),
        calculatedAt: now,
      };

      const records = this.interestRecords.get(playerId) || [];
      records.push(record);
      this.interestRecords.set(playerId, records);
    }

    return { success: true, interest, account };
  }

  /**
   * 自动每日利息结算
   */
  claimDailyInterest(playerId: string): { success: boolean; interest: number; account: BankAccount | null } {
    return this.calculateInterest(playerId);
  }

  /**
   * 获取利息记录
   */
  getInterestRecords(playerId: string, limit: number = 30): InterestRecord[] {
    const records = this.interestRecords.get(playerId) || [];
    return records.slice(-limit);
  }

  /**
   * 获取利息统计
   */
  getInterestStats(playerId: string): {
    totalInterest: number;
    averageDailyInterest: number;
    recordCount: number;
  } {
    const account = this.getAccount(playerId);
    const records = this.interestRecords.get(playerId) || [];

    if (!account || records.length === 0) {
      return { totalInterest: 0, averageDailyInterest: 0, recordCount: 0 };
    }

    const totalInterest = account.interestEarned;
    const averageDailyInterest = totalInterest / Math.max(1, records.length);

    return {
      totalInterest,
      averageDailyInterest,
      recordCount: records.length,
    };
  }

  /**
   * 获取 APY 配置
   */
  getAPYConfig(): APYContractConfig {
    return this.apyConfig;
  }

  /**
   * 更新 APY 配置
   */
  updateAPYConfig(config: Partial<APYContractConfig>): void {
    this.apyConfig = { ...this.apyConfig, ...config };
  }

  /**
   * 计算预期收益
   */
  calculateProjectedReturn(
    principal: number,
    days: number,
    apy: number = this.apyConfig.baseAPY + this.apyConfig.bonusAPY
  ): number {
    const dailyRate = apy / 365 / 100;
    return Math.floor(principal * (Math.pow(1 + dailyRate, days) - 1) * 1000) / 1000;
  }

  /**
   * 获取所有账户统计
   */
  getAllAccountsStats(): {
    totalAccounts: number;
    totalDeposited: number;
    totalBalance: number;
    totalInterestEarned: number;
    averageBalance: number;
  } {
    let totalDeposited = 0;
    let totalBalance = 0;
    let totalInterestEarned = 0;

    this.accounts.forEach((account) => {
      totalDeposited += account.totalDeposited;
      totalBalance += account.balance;
      totalInterestEarned += account.interestEarned;
    });

    const totalAccounts = this.accounts.size;
    const averageBalance = totalAccounts > 0 ? totalBalance / totalAccounts : 0;

    return {
      totalAccounts,
      totalDeposited,
      totalBalance,
      totalInterestEarned,
      averageBalance,
    };
  }

  /**
   * 清除所有数据（用于测试）
   */
  clear(): void {
    this.accounts.clear();
    this.interestRecords.clear();
  }
}

// 单例实例
let bankingSystemInstance: BankingSystem | null = null;

export function getBankingSystem(): BankingSystem {
  if (!bankingSystemInstance) {
    bankingSystemInstance = new BankingSystem();
  }
  return bankingSystemInstance;
}

export function resetBankingSystem(): void {
  bankingSystemInstance = null;
}
