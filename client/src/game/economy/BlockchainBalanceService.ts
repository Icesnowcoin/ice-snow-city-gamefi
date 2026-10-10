/**
 * 链上余额刷新服务
 * 负责从区块链获取玩家的 ISC 代币余额
 */

export interface BlockchainBalance {
  address: string;
  iscBalance: number;
  lastUpdated: number;
  txHash?: string;
}

export interface BlockchainRefreshResult {
  success: boolean;
  balance?: number;
  error?: string;
  timestamp: number;
}

export class BlockchainBalanceService {
  private mockAddress: string = '0x1234567890abcdef1234567890abcdef12345678';
  private mockBalance: number = 0;
  private refreshHistory: BlockchainRefreshResult[] = [];
  private maxHistorySize: number = 100;
  private readonly networkDelayMs: number;

  constructor(address?: string, networkDelayMs = 0) {
    if (address) {
      this.mockAddress = address;
    }
    this.networkDelayMs = Math.max(0, networkDelayMs);
  }

  /**
   * 从区块链刷新 ISC 余额
   * 模拟从智能合约获取余额
   */
  async refreshISCBalance(): Promise<BlockchainRefreshResult> {
    try {
      // 网络延迟仅用于演示，可通过构造参数显式启用。
      if (this.networkDelayMs > 0) {
        await this.simulateNetworkDelay();
      }

      // 模拟从区块链获取余额
      // 实际应用中应该调用真实的智能合约
      const balance = await this.fetchBalanceFromBlockchain();

      const result: BlockchainRefreshResult = {
        success: true,
        balance,
        timestamp: Date.now(),
      };

      this.recordRefreshResult(result);
      this.mockBalance = balance;

      return result;
    } catch (error) {
      const result: BlockchainRefreshResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };

      this.recordRefreshResult(result);
      return result;
    }
  }

  /**
   * 获取当前缓存的 ISC 余额
   */
  getCurrentBalance(): number {
    return this.mockBalance;
  }

  /**
   * 获取钱包地址
   */
  getAddress(): string {
    return this.mockAddress;
  }

  /**
   * 设置钱包地址
   */
  setAddress(address: string): void {
    this.mockAddress = address;
  }

  /**
   * 获取刷新历史
   */
  getRefreshHistory(): BlockchainRefreshResult[] {
    return [...this.refreshHistory];
  }

  /**
   * 获取最后一次刷新的结果
   */
  getLastRefreshResult(): BlockchainRefreshResult | null {
    return this.refreshHistory.length > 0
      ? this.refreshHistory[this.refreshHistory.length - 1]
      : null;
  }

  /**
   * 清空刷新历史
   */
  clearRefreshHistory(): void {
    this.refreshHistory = [];
  }

  /**
   * 模拟从区块链获取余额
   * 实际应用中应该调用真实的 Web3 库和智能合约
   */
  private async fetchBalanceFromBlockchain(): Promise<number> {
    // 模拟随机余额变化（用于演示）
    // 实际应该调用：
    // const contract = new ethers.Contract(contractAddress, ABI, provider);
    // const balance = await contract.balanceOf(this.mockAddress);
    // return ethers.utils.formatUnits(balance, 18);

    // 返回 0-10000 之间的随机数（模拟 ISC 余额）
    return Math.floor(Math.random() * 10000);
  }

  /**
   * 模拟网络延迟
   */
  private simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.networkDelayMs);
    });
  }

  /**
   * 记录刷新结果
   */
  private recordRefreshResult(result: BlockchainRefreshResult): void {
    this.refreshHistory.push(result);

    // 限制历史记录大小
    if (this.refreshHistory.length > this.maxHistorySize) {
      this.refreshHistory = this.refreshHistory.slice(-this.maxHistorySize);
    }
  }
}
