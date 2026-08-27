/**
 * ISC Contract Integration Module
 * 
 * Phase 76: 智能合约集成 - ISC 代币合约
 * 
 * ISC 合约地址: 0x11229a3f976566FA8a3ba462C432122f3B8876f6
 * 合约所有权: 已放弃
 * 
 * 功能：
 * 1. ISC 代币余额查询
 * 2. 代币转账
 * 3. 代币授权管理
 * 4. 事件监听（Transfer、Approval）
 * 5. 代币供应量追踪
 * 6. 玩家资产管理
 */

import { ethers } from 'ethers';

/**
 * ISC 合约配置
 */
export const ISC_CONTRACT_CONFIG = {
  address: '0x11229a3f976566FA8a3ba462C432122f3B8876f6',
  decimals: 18,
  symbol: 'ISC',
  name: 'Ice Snow Coin',
  // ERC20 标准 ABI
  abi: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],
};

/**
 * ISC 代币交互结果
 */
export interface TokenTransactionResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
  timestamp: number;
}

/**
 * 玩家代币余额
 */
export interface PlayerTokenBalance {
  playerId: string;
  address: string;
  balance: string; // 以最小单位表示
  balanceFormatted: string; // 格式化后的余额（考虑小数位）
  lastUpdated: number;
}

/**
 * 代币转账记录
 */
export interface TokenTransferRecord {
  id: string;
  from: string;
  to: string;
  amount: string;
  amountFormatted: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  type: 'transfer' | 'deposit' | 'withdrawal';
}

/**
 * ISC 合约交互管理器
 */
export class ISCContractManager {
  private contract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private playerBalances: Map<string, PlayerTokenBalance> = new Map();
  private transferRecords: TokenTransferRecord[] = [];
  private totalSupply: string = '0';

  /**
   * 初始化合约
   */
  async initialize(provider: ethers.Provider): Promise<void> {
    try {
      this.provider = provider;
      this.contract = new ethers.Contract(
        ISC_CONTRACT_CONFIG.address,
        ISC_CONTRACT_CONFIG.abi,
        provider
      );

      // 获取总供应量
      this.totalSupply = await this.contract.totalSupply();

      // 设置事件监听
      this.setupEventListeners();

      console.log('[ISC Contract] Initialized successfully');
      console.log(`[ISC Contract] Total Supply: ${this.formatBalance(this.totalSupply)}`);
    } catch (error) {
      console.error('[ISC Contract] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    if (!this.contract) return;

    // 监听 Transfer 事件
    this.contract.on('Transfer', (from: string, to: string, value: string) => {
      this.handleTransferEvent(from, to, value);
    });

    // 监听 Approval 事件
    this.contract.on('Approval', (owner: string, spender: string, value: string) => {
      this.handleApprovalEvent(owner, spender, value);
    });
  }

  /**
   * 处理 Transfer 事件
   */
  private handleTransferEvent(from: string, to: string, value: string): void {
    const record: TokenTransferRecord = {
      id: `transfer_${Date.now()}_${Math.random()}`,
      from,
      to,
      amount: value,
      amountFormatted: this.formatBalance(value),
      transactionHash: '', // 需要从事件日志获取
      blockNumber: 0, // 需要从事件日志获取
      timestamp: Date.now(),
      type: 'transfer',
    };

    this.transferRecords.push(record);

    // 更新玩家余额
    if (this.playerBalances.has(from)) {
      this.updatePlayerBalance(from);
    }
    if (this.playerBalances.has(to)) {
      this.updatePlayerBalance(to);
    }

    console.log(`[ISC Contract] Transfer: ${from} -> ${to}: ${this.formatBalance(value)}`);
  }

  /**
   * 处理 Approval 事件
   */
  private handleApprovalEvent(owner: string, spender: string, value: string): void {
    console.log(
      `[ISC Contract] Approval: ${owner} approved ${spender} for ${this.formatBalance(value)}`
    );
  }

  /**
   * 获取玩家代币余额
   */
  async getPlayerBalance(playerId: string, address: string): Promise<PlayerTokenBalance> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const balance = await this.contract.balanceOf(address);
      const playerBalance: PlayerTokenBalance = {
        playerId,
        address,
        balance: balance.toString(),
        balanceFormatted: this.formatBalance(balance.toString()),
        lastUpdated: Date.now(),
      };

      this.playerBalances.set(playerId, playerBalance);
      return playerBalance;
    } catch (error) {
      console.error(`[ISC Contract] Failed to get balance for ${address}:`, error);
      throw error;
    }
  }

  /**
   * 更新玩家余额
   */
  private async updatePlayerBalance(playerId: string): Promise<void> {
    const existing = this.playerBalances.get(playerId);
    if (!existing) return;

    await this.getPlayerBalance(playerId, existing.address);
  }

  /**
   * 获取授权额度
   */
  async getAllowance(owner: string, spender: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const allowance = await this.contract.allowance(owner, spender);
      return allowance.toString();
    } catch (error) {
      console.error(`[ISC Contract] Failed to get allowance:`, error);
      throw error;
    }
  }

  /**
   * 获取转账记录
   */
  getTransferRecords(
    filter?: {
      from?: string;
      to?: string;
      type?: string;
      startTime?: number;
      endTime?: number;
    }
  ): TokenTransferRecord[] {
    let records = [...this.transferRecords];

    if (filter) {
      if (filter.from) {
        records = records.filter((r) => r.from.toLowerCase() === filter.from!.toLowerCase());
      }
      if (filter.to) {
        records = records.filter((r) => r.to.toLowerCase() === filter.to!.toLowerCase());
      }
      if (filter.type) {
        records = records.filter((r) => r.type === filter.type);
      }
      if (filter.startTime) {
        records = records.filter((r) => r.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        records = records.filter((r) => r.timestamp <= filter.endTime!);
      }
    }

    return records;
  }

  /**
   * 获取玩家转账统计
   */
  getPlayerTransferStats(playerId: string, address: string): {
    totalReceived: string;
    totalSent: string;
    transactionCount: number;
  } {
    const records = this.transferRecords.filter(
      (r) =>
        r.from.toLowerCase() === address.toLowerCase() ||
        r.to.toLowerCase() === address.toLowerCase()
    );

    let totalReceived = '0';
    let totalSent = '0';

    for (const record of records) {
      if (record.to.toLowerCase() === address.toLowerCase()) {
        totalReceived = (BigInt(totalReceived) + BigInt(record.amount)).toString();
      }
      if (record.from.toLowerCase() === address.toLowerCase()) {
        totalSent = (BigInt(totalSent) + BigInt(record.amount)).toString();
      }
    }

    return {
      totalReceived: this.formatBalance(totalReceived),
      totalSent: this.formatBalance(totalSent),
      transactionCount: records.length,
    };
  }

  /**
   * 获取代币总供应量
   */
  getTotalSupply(): string {
    return this.formatBalance(this.totalSupply);
  }

  /**
   * 获取代币总供应量（原始值）
   */
  getTotalSupplyRaw(): string {
    return this.totalSupply;
  }

  /**
   * 格式化余额（从最小单位转换为标准单位）
   */
  private formatBalance(balance: string): string {
    try {
      const bn = BigInt(balance);
      const divisor = this.pow(BigInt(10), BigInt(ISC_CONTRACT_CONFIG.decimals));
      const integer = bn / divisor;
      const remainder = bn % divisor;

      if (remainder === BigInt(0)) {
        return integer.toString();
      }

      const remainderStr = remainder.toString().padStart(ISC_CONTRACT_CONFIG.decimals, '0');
      // Remove trailing zeros
      const trimmed = remainderStr.replace(/0+$/, '');
      return `${integer}.${trimmed}`;
    } catch {
      return '0';
    }
  }

  /**
   * 将标准单位转换为最小单位
   */
  parseBalance(balance: string): string {
    try {
      const parts = balance.split('.');
      const integer = BigInt(parts[0] || '0');
      const decimals = parts[1] || '';

      const divisor = this.pow(BigInt(10), BigInt(ISC_CONTRACT_CONFIG.decimals));
      let result = integer * divisor;

      if (decimals) {
        const decimalPart = decimals.padEnd(ISC_CONTRACT_CONFIG.decimals, '0');
        result += BigInt(decimalPart);
      }

      return result.toString();
    } catch {
      return '0';
    }
  }

  /**
   * 获取合约信息
   */
  async getContractInfo(): Promise<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    totalSupplyFormatted: string;
  }> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const name = await this.contract.name();
      const symbol = await this.contract.symbol();
      const decimals = await this.contract.decimals();

      return {
        address: ISC_CONTRACT_CONFIG.address,
        name,
        symbol,
        decimals,
        totalSupply: this.totalSupply,
        totalSupplyFormatted: this.formatBalance(this.totalSupply),
      };
    } catch (error) {
      console.error('[ISC Contract] Failed to get contract info:', error);
      throw error;
    }
  }

  /**
   * BigInt 幂运算
   */
  private pow(base: bigint, exponent: bigint): bigint {
    let result = BigInt(1);
    for (let i = BigInt(0); i < exponent; i++) {
      result *= base;
    }
    return result;
  }

  /**
   * 获取所有玩家余额
   */
  getAllPlayerBalances(): PlayerTokenBalance[] {
    return Array.from(this.playerBalances.values());
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.playerBalances.clear();
    this.transferRecords = [];
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    totalPlayers: number;
    totalTransactions: number;
    totalTransferred: string;
    averageBalance: string;
  } {
    const balances = Array.from(this.playerBalances.values());
    let totalBalance = BigInt(0);

    for (const balance of balances) {
      totalBalance += BigInt(balance.balance);
    }

    let totalTransferred = BigInt(0);
    for (const record of this.transferRecords) {
      totalTransferred += BigInt(record.amount);
    }

    const averageBalance =
      balances.length > 0
        ? this.formatBalance((totalBalance / BigInt(balances.length)).toString())
        : '0';

    return {
      totalPlayers: balances.length,
      totalTransactions: this.transferRecords.length,
      totalTransferred: this.formatBalance(totalTransferred.toString()),
      averageBalance,
    };
  }
}

/**
 * 创建单例实例
 */
let iscContractManager: ISCContractManager | null = null;

export function getISCContractManager(): ISCContractManager {
  if (!iscContractManager) {
    iscContractManager = new ISCContractManager();
  }
  return iscContractManager;
}

/**
 * 初始化 ISC 合约管理器
 */
export async function initializeISCContract(provider: ethers.Provider): Promise<ISCContractManager> {
  const manager = getISCContractManager();
  await manager.initialize(provider);
  return manager;
}
