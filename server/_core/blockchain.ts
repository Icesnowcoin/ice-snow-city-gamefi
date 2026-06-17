/**
 * Blockchain Integration Module
 * 
 * Handles all on-chain interactions with BSC (Binance Smart Chain)
 * including contract calls, transaction signing, and event listening.
 * 
 * Production-grade implementation with error handling and retry logic.
 */

import { ethers } from "ethers";
import type { Contract, TransactionResponse, EventLog } from "ethers";
import { rpcFailoverManager } from "./blockchain.rpc";

// Environment variables for blockchain configuration
const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org:443";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "";
const ISC_MANAGER_ADDRESS = process.env.ISC_MANAGER_CONTRACT_ADDRESS || "";
const CITY_TREASURY_ADDRESS = process.env.CITY_TREASURY_CONTRACT_ADDRESS || "";
const ISC_STAKING_ADDRESS = process.env.ISC_STAKING_CONTRACT_ADDRESS || "";

// ABI for ISCManager contract
const ISC_MANAGER_ABI = [
  "function payUtilityFee(address player, uint256 amount, bytes32 secretKeyHash) external",
  "function processLuxuryGiftRebate(address recipient, uint256 giftValue, bytes32 secretKeyHash) external returns (uint256)",
  "function mintLand(address to, uint256 x, uint256 y, uint256 landType, bytes32 secretKeyHash) external returns (uint256)",
  "function mintHouse(address to, uint256 landTokenId, uint256 houseType, string memory decorationHash, bytes32 secretKeyHash) external returns (uint256)",
  "event UtilityFeePaid(address indexed player, uint256 amount, uint256 timestamp)",
  "event LuxuryGiftRebateProcessed(address indexed recipient, uint256 rebateAmount, uint256 timestamp)",
  "event LandMinted(address indexed to, uint256 indexed tokenId, uint256 x, uint256 y, uint256 landType)",
  "event HouseMinted(address indexed to, uint256 indexed tokenId, uint256 landTokenId, uint256 houseType)",
];

// ABI for CityTreasury contract
const CITY_TREASURY_ABI = [
  "function getBalance() external view returns (uint256)",
  "function getTransactionHistory(uint256 limit, uint256 offset) external view returns (tuple(uint256 txId, string txType, uint256 amount, address fromAddress, address toAddress, uint256 timestamp)[])",
];

// ABI for ISCStaking contract
const ISC_STAKING_ABI = [
  "function getPoolInfo(uint256 poolId) external view returns (tuple(uint256 totalStaked, uint256 currentAPY, uint256 rewardPerBlock))",
  "function getUserRewards(address user, uint256 poolId) external view returns (uint256)",
];

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Blockchain service class for managing on-chain interactions
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private iscManagerContract: Contract | null = null;
  private cityTreasuryContract: Contract | null = null;
  private iscStakingContract: Contract | null = null;
  private rpcFailoverManager = rpcFailoverManager;

  /**
   * Initialize blockchain service
   * Must be called before using any blockchain methods
   */
  async initialize(): Promise<void> {
    try {
      // Initialize provider with RPC failover
      const rpcUrl = this.rpcFailoverManager.getNextEndpoint();
      console.log(`[Blockchain] Using RPC endpoint: ${rpcUrl}`);
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Verify provider connectivity
      const network = await this.provider.getNetwork();
      console.log(`[Blockchain] Connected to network: ${network.name} (chainId: ${network.chainId})`);
      this.rpcFailoverManager.recordSuccess();

      // Initialize signer if private key is available
      if (PRIVATE_KEY) {
        this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
        console.log(`[Blockchain] Signer initialized: ${this.signer.address}`);
      } else {
        console.warn("[Blockchain] No private key provided, contract calls will be read-only");
      }

      // Initialize contracts
      if (ISC_MANAGER_ADDRESS) {
        this.iscManagerContract = new ethers.Contract(
          ISC_MANAGER_ADDRESS,
          ISC_MANAGER_ABI,
          this.signer || this.provider
        );
        console.log(`[Blockchain] ISCManager contract initialized: ${ISC_MANAGER_ADDRESS}`);
      }

      if (CITY_TREASURY_ADDRESS) {
        this.cityTreasuryContract = new ethers.Contract(
          CITY_TREASURY_ADDRESS,
          CITY_TREASURY_ABI,
          this.provider
        );
        console.log(`[Blockchain] CityTreasury contract initialized: ${CITY_TREASURY_ADDRESS}`);
      }

      if (ISC_STAKING_ADDRESS) {
        this.iscStakingContract = new ethers.Contract(
          ISC_STAKING_ADDRESS,
          ISC_STAKING_ABI,
          this.provider
        );
        console.log(`[Blockchain] ISCStaking contract initialized: ${ISC_STAKING_ADDRESS}`);
      }
    } catch (error) {
      console.error("[Blockchain] Initialization failed:", error);
      this.rpcFailoverManager.recordFailure(error as Error);
      
      // Try next RPC endpoint
      const nextRpc = this.rpcFailoverManager.getNextEndpoint();
      if (nextRpc !== BSC_RPC_URL) {
        console.log(`[Blockchain] Retrying with next RPC endpoint: ${nextRpc}`);
        this.provider = new ethers.JsonRpcProvider(nextRpc);
        return this.initialize();
      }
      
      throw error;
    }
  }

  /**
   * Execute payUtilityFee transaction with retry logic
   */
  async payUtilityFee(
    playerAddress: string,
    amount: string,
    secretKeyHash: string
  ): Promise<{ txHash: string; status: "pending" | "confirmed" }> {
    if (!this.iscManagerContract || !this.signer) {
      throw new Error("Blockchain service not initialized or no signer available");
    }

    return this.executeWithRetry(async () => {
      const tx: TransactionResponse = await this.iscManagerContract!.payUtilityFee(
        playerAddress,
        ethers.parseEther(amount),
        secretKeyHash
      );

      console.log(`[Blockchain] payUtilityFee tx submitted: ${tx.hash}`);

      return {
        txHash: tx.hash,
        status: "pending" as const,
      };
    });
  }

  /**
   * Execute processLuxuryGiftRebate transaction with retry logic
   */
  async processLuxuryGiftRebate(
    recipientAddress: string,
    giftValue: string,
    secretKeyHash: string
  ): Promise<{ txHash: string; rebateAmount: string; status: "pending" | "confirmed" }> {
    if (!this.iscManagerContract || !this.signer) {
      throw new Error("Blockchain service not initialized or no signer available");
    }

    return this.executeWithRetry(async () => {
      const tx: TransactionResponse = await this.iscManagerContract!.processLuxuryGiftRebate(
        recipientAddress,
        ethers.parseEther(giftValue),
        secretKeyHash
      );

      console.log(`[Blockchain] processLuxuryGiftRebate tx submitted: ${tx.hash}`);

      // Estimate rebate amount (this is approximate, actual value from event)
      const giftValueBig = ethers.parseEther(giftValue);
      const rebateAmount = (giftValueBig * BigInt(3000)) / BigInt(10000); // 30% rebate

      return {
        txHash: tx.hash,
        rebateAmount: ethers.formatEther(rebateAmount),
        status: "pending" as const,
      };
    });
  }

  /**
   * Execute mintLand transaction with retry logic
   */
  async mintLand(
    toAddress: string,
    x: number,
    y: number,
    landType: number,
    secretKeyHash: string
  ): Promise<{ txHash: string; status: "pending" | "confirmed" }> {
    if (!this.iscManagerContract || !this.signer) {
      throw new Error("Blockchain service not initialized or no signer available");
    }

    return this.executeWithRetry(async () => {
      const tx: TransactionResponse = await this.iscManagerContract!.mintLand(
        toAddress,
        x,
        y,
        landType,
        secretKeyHash
      );

      console.log(`[Blockchain] mintLand tx submitted: ${tx.hash}`);

      return {
        txHash: tx.hash,
        status: "pending" as const,
      };
    });
  }

  /**
   * Execute mintHouse transaction with retry logic
   */
  async mintHouse(
    toAddress: string,
    landTokenId: number,
    houseType: number,
    decorationHash: string,
    secretKeyHash: string
  ): Promise<{ txHash: string; status: "pending" | "confirmed" }> {
    if (!this.iscManagerContract || !this.signer) {
      throw new Error("Blockchain service not initialized or no signer available");
    }

    return this.executeWithRetry(async () => {
      const tx: TransactionResponse = await this.iscManagerContract!.mintHouse(
        toAddress,
        landTokenId,
        houseType,
        decorationHash,
        secretKeyHash
      );

      console.log(`[Blockchain] mintHouse tx submitted: ${tx.hash}`);

      return {
        txHash: tx.hash,
        status: "pending" as const,
      };
    });
  }

  /**
   * Get CityTreasury balance
   */
  async getTreasuryBalance(): Promise<string> {
    if (!this.cityTreasuryContract) {
      throw new Error("CityTreasury contract not initialized");
    }

    return this.executeWithRetry(async () => {
      const balance = await this.cityTreasuryContract!.getBalance();
      return ethers.formatEther(balance);
    });
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<{
    status: "pending" | "confirmed" | "failed";
    blockNumber?: number;
    gasUsed?: string;
  }> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return this.executeWithRetry(async () => {
      const receipt = await this.provider!.getTransactionReceipt(txHash);

      if (!receipt) {
        return { status: "pending" as const };
      }

      if (receipt.status === 0) {
        return { status: "failed" as const, blockNumber: receipt.blockNumber };
      }

      return {
        status: "confirmed" as const,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    });
  }

  /**
   * Get staking pool info
   */
  async getStakingPoolInfo(poolId: number): Promise<{
    totalStaked: string;
    currentAPY: string;
    rewardPerBlock: string;
  }> {
    if (!this.iscStakingContract) {
      throw new Error("ISCStaking contract not initialized");
    }

    return this.executeWithRetry(async () => {
      const poolInfo = await this.iscStakingContract!.getPoolInfo(poolId);

      return {
        totalStaked: ethers.formatEther(poolInfo[0]),
        currentAPY: (poolInfo[1] / 100).toString() + "%",
        rewardPerBlock: ethers.formatEther(poolInfo[2]),
      };
    });
  }

  /**
   * Get user pending rewards
   */
  async getUserRewards(userAddress: string, poolId: number): Promise<string> {
    if (!this.iscStakingContract) {
      throw new Error("ISCStaking contract not initialized");
    }

    return this.executeWithRetry(async () => {
      const rewards = await this.iscStakingContract!.getUserRewards(userAddress, poolId);
      return ethers.formatEther(rewards);
    });
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `[Blockchain] Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`
        );

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }
    }

    throw lastError || new Error("Unknown error during blockchain operation");
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.provider !== null && this.iscManagerContract !== null;
  }

  /**
   * Get signer address
   */
  getSignerAddress(): string | null {
    return this.signer?.address || null;
  }
}

// Singleton instance
let blockchainService: BlockchainService | null = null;

/**
 * Get or create blockchain service instance
 */
export async function getBlockchainService(): Promise<BlockchainService> {
  if (!blockchainService) {
    blockchainService = new BlockchainService();
    await blockchainService.initialize();
  }
  return blockchainService;
}

/**
 * Reset blockchain service (useful for testing)
 */
export function resetBlockchainService(): void {
  blockchainService = null;
}
