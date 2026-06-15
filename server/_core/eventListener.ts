/**
 * Event Listener Module
 * 
 * Listens to on-chain contract events and automatically updates the database.
 * Implements robust error handling, reconnection logic, and event deduplication.
 * 
 * Production-grade implementation for real-time data synchronization.
 */

import { ethers } from "ethers";
import type { EventLog, Contract } from "ethers";
import { getDb } from "../db";
import { getBlockchainService } from "./blockchain";
import type { ContractEvent } from "../../drizzle/schema";

// Configuration
const POLLING_INTERVAL_MS = 12000; // 12 seconds (BSC block time ~3s, so ~4 blocks)
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;
const EVENT_BATCH_SIZE = 100;

interface EventListenerConfig {
  iscManagerAddress: string;
  cityTreasuryAddress: string;
  iscStakingAddress: string;
  startBlock?: number;
}

interface ProcessedEvent {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
  data: Record<string, any>;
  timestamp: number;
}

// Re-export for type safety
export type { ContractEvent };

/**
 * Event Listener Service
 */
export class EventListenerService {
  private provider: ethers.JsonRpcProvider | null = null;
  private iscManagerContract: Contract | null = null;
  private cityTreasuryContract: Contract | null = null;
  private iscStakingContract: Contract | null = null;
  private isRunning = false;
  private reconnectAttempts = 0;
  private lastProcessedBlock = 0;
  private processedEventHashes = new Set<string>();

  /**
   * Initialize event listener
   */
  async initialize(config: EventListenerConfig): Promise<void> {
    try {
      const blockchainService = await getBlockchainService();

      // Get provider from blockchain service
      this.provider = new ethers.JsonRpcProvider(
        process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org:443"
      );

      // Initialize contracts
      const ISC_MANAGER_ABI = [
        "event UtilityFeePaid(address indexed player, uint256 amount, uint256 timestamp)",
        "event LuxuryGiftRebateProcessed(address indexed recipient, uint256 rebateAmount, uint256 timestamp)",
        "event LandMinted(address indexed to, uint256 indexed tokenId, uint256 x, uint256 y, uint256 landType)",
        "event HouseMinted(address indexed to, uint256 indexed tokenId, uint256 landTokenId, uint256 houseType)",
      ];

      const CITY_TREASURY_ABI = [
        "event BalanceUpdated(uint256 newBalance, uint256 timestamp)",
        "event TransactionRecorded(uint256 txId, string txType, uint256 amount, address fromAddress, address toAddress, uint256 timestamp)",
      ];

      const ISC_STAKING_ABI = [
        "event Staked(address indexed user, uint256 amount, uint256 poolId, uint256 timestamp)",
        "event RewardsClaimed(address indexed user, uint256 amount, uint256 poolId, uint256 timestamp)",
      ];

      if (config.iscManagerAddress) {
        this.iscManagerContract = new ethers.Contract(
          config.iscManagerAddress,
          ISC_MANAGER_ABI,
          this.provider
        );
      }

      if (config.cityTreasuryAddress) {
        this.cityTreasuryContract = new ethers.Contract(
          config.cityTreasuryAddress,
          CITY_TREASURY_ABI,
          this.provider
        );
      }

      if (config.iscStakingAddress) {
        this.iscStakingContract = new ethers.Contract(
          config.iscStakingAddress,
          ISC_STAKING_ABI,
          this.provider
        );
      }

      // Get starting block
      this.lastProcessedBlock = config.startBlock || (await this.provider.getBlockNumber()) - 1000;

      console.log(`[EventListener] Initialized. Starting from block ${this.lastProcessedBlock}`);
    } catch (error) {
      console.error("[EventListener] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Start listening to events
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("[EventListener] Already running");
      return;
    }

    this.isRunning = true;
    this.reconnectAttempts = 0;
    console.log("[EventListener] Starting event listener");

    this.pollEvents();
  }

  /**
   * Stop listening to events
   */
  stop(): void {
    this.isRunning = false;
    console.log("[EventListener] Stopped");
  }

  /**
   * Poll for new events
   */
  private async pollEvents(): Promise<void> {
    while (this.isRunning) {
      try {
        const currentBlock = await this.provider!.getBlockNumber();
        const fromBlock = this.lastProcessedBlock + 1;
        const toBlock = Math.min(currentBlock, fromBlock + 5000); // Process max 5000 blocks at a time

        if (fromBlock <= toBlock) {
          console.log(
            `[EventListener] Polling events from block ${fromBlock} to ${toBlock}`
          );

          // Process events from all contracts
          await Promise.all([
            this.processISCManagerEvents(fromBlock, toBlock),
            this.processCityTreasuryEvents(fromBlock, toBlock),
            this.processISCStakingEvents(fromBlock, toBlock),
          ]);

          this.lastProcessedBlock = toBlock;
          this.reconnectAttempts = 0;
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
      } catch (error) {
        console.error("[EventListener] Error polling events:", error);
        await this.handleError();
      }
    }
  }

  /**
   * Process ISCManager events
   */
  private async processISCManagerEvents(fromBlock: number, toBlock: number): Promise<void> {
    if (!this.iscManagerContract) return;

    try {
      // Get UtilityFeePaid events
      const utilityFeeEvents = await this.iscManagerContract.queryFilter(
        this.iscManagerContract.filters.UtilityFeePaid(),
        fromBlock,
        toBlock
      );

      for (const event of utilityFeeEvents) {
        const eventLog = event as EventLog;
        if (eventLog.args && eventLog.args.length >= 3) {
          await this.processEvent({
            eventName: "UtilityFeePaid",
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.index || 0,
            data: {
              player: eventLog.args[0],
              amount: eventLog.args[1]?.toString(),
              timestamp: eventLog.args[2]?.toString(),
            },
            timestamp: Date.now(),
          });
        }
      }

      // Get LuxuryGiftRebateProcessed events
      const rebateEvents = await this.iscManagerContract.queryFilter(
        this.iscManagerContract.filters.LuxuryGiftRebateProcessed(),
        fromBlock,
        toBlock
      );

      for (const event of rebateEvents) {
        const eventLog = event as EventLog;
        if (eventLog.args && eventLog.args.length >= 3) {
          await this.processEvent({
            eventName: "LuxuryGiftRebateProcessed",
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.index || 0,
            data: {
              recipient: eventLog.args[0],
              rebateAmount: eventLog.args[1]?.toString(),
              timestamp: eventLog.args[2]?.toString(),
            },
            timestamp: Date.now(),
          });
        }
      }

      // Get LandMinted events
      const landEvents = await this.iscManagerContract.queryFilter(
        this.iscManagerContract.filters.LandMinted(),
        fromBlock,
        toBlock
      );

      for (const event of landEvents) {
        const eventLog = event as EventLog;
        if (eventLog.args && eventLog.args.length >= 5) {
          await this.processEvent({
            eventName: "LandMinted",
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.index || 0,
            data: {
              to: eventLog.args[0],
              tokenId: eventLog.args[1]?.toString(),
              x: eventLog.args[2]?.toString(),
              y: eventLog.args[3]?.toString(),
              landType: eventLog.args[4]?.toString(),
            },
            timestamp: Date.now(),
          });
        }
      }

      // Get HouseMinted events
      const houseEvents = await this.iscManagerContract.queryFilter(
        this.iscManagerContract.filters.HouseMinted(),
        fromBlock,
        toBlock
      );

      for (const event of houseEvents) {
        const eventLog = event as EventLog;
        if (eventLog.args && eventLog.args.length >= 4) {
          await this.processEvent({
            eventName: "HouseMinted",
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            logIndex: event.index || 0,
            data: {
              to: eventLog.args[0],
              tokenId: eventLog.args[1]?.toString(),
              landTokenId: eventLog.args[2]?.toString(),
              houseType: eventLog.args[3]?.toString(),
            },
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("[EventListener] Error processing ISCManager events:", error);
      throw error;
    }
  }

  /**
   * Process CityTreasury events
   */
  private async processCityTreasuryEvents(
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    if (!this.cityTreasuryContract) return;

    try {
      // Get BalanceUpdated events
      const balanceEvents = await this.cityTreasuryContract.queryFilter(
        this.cityTreasuryContract.filters.BalanceUpdated?.(),
        fromBlock,
        toBlock
      );

      if (balanceEvents) {
        for (const event of balanceEvents) {
          const eventLog = event as EventLog;
          if (eventLog.args && eventLog.args.length >= 2) {
            await this.processEvent({
              eventName: "TreasuryBalanceUpdated",
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              logIndex: event.index || 0,
              data: {
                newBalance: eventLog.args[0]?.toString(),
                timestamp: eventLog.args[1]?.toString(),
              },
              timestamp: Date.now(),
            });
          }
        }
      }
    } catch (error) {
      console.warn("[EventListener] Warning processing CityTreasury events:", error);
      // Don't throw, continue with other events
    }
  }

  /**
   * Process ISCStaking events
   */
  private async processISCStakingEvents(fromBlock: number, toBlock: number): Promise<void> {
    if (!this.iscStakingContract) return;

    try {
      // Get Staked events
      const stakedEvents = await this.iscStakingContract.queryFilter(
        this.iscStakingContract.filters.Staked?.(),
        fromBlock,
        toBlock
      );

      if (stakedEvents) {
        for (const event of stakedEvents) {
          const eventLog = event as EventLog;
          if (eventLog.args && eventLog.args.length >= 4) {
            await this.processEvent({
              eventName: "Staked",
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              logIndex: event.index || 0,
              data: {
                user: eventLog.args[0],
                amount: eventLog.args[1]?.toString(),
                poolId: eventLog.args[2]?.toString(),
                timestamp: eventLog.args[3]?.toString(),
              },
              timestamp: Date.now(),
            });
          }
        }
      }
    } catch (error) {
      console.warn("[EventListener] Warning processing ISCStaking events:", error);
      // Don't throw, continue with other events
    }
  }

  /**
   * Process and store event in database
   */
  private async processEvent(event: ProcessedEvent): Promise<void> {
    // Deduplicate events
    const eventHash = `${event.transactionHash}-${event.logIndex}`;
    if (this.processedEventHashes.has(eventHash)) {
      return;
    }

    try {
      const db = await getDb();
      if (!db) {
        console.warn("[EventListener] Database not available");
        return;
      }

      // Insert event into database
      const { contractEvents } = await import("../../drizzle/schema");
      await db.insert(contractEvents).values({
        eventName: event.eventName,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        fromAddress: event.data.player || event.data.to || event.data.user,
        params: JSON.stringify(event.data),
        status: "success",
        createdAt: new Date(event.timestamp),
      });

      this.processedEventHashes.add(eventHash);

      // Keep only last 10000 processed events in memory
      if (this.processedEventHashes.size > 10000) {
        const hashes = Array.from(this.processedEventHashes);
        this.processedEventHashes.clear();
        hashes.slice(-5000).forEach((h) => this.processedEventHashes.add(h));
      }

      console.log(`[EventListener] Processed event: ${event.eventName} (tx: ${event.transactionHash})`);
    } catch (error) {
      console.error("[EventListener] Error processing event:", error);
      // Don't throw, continue processing other events
    }
  }

  /**
   * Handle connection errors with reconnect logic
   */
  private async handleError(): Promise<void> {
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `[EventListener] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
      console.error("[EventListener] Max reconnect attempts reached, stopping listener");
      this.stop();
    }
  }

  /**
   * Get listener status
   */
  getStatus(): {
    isRunning: boolean;
    lastProcessedBlock: number;
    reconnectAttempts: number;
    processedEventCount: number;
  } {
    return {
      isRunning: this.isRunning,
      lastProcessedBlock: this.lastProcessedBlock,
      reconnectAttempts: this.reconnectAttempts,
      processedEventCount: this.processedEventHashes.size,
    };
  }
}

// Singleton instance
let eventListenerService: EventListenerService | null = null;

/**
 * Get or create event listener service
 */
export async function getEventListenerService(): Promise<EventListenerService> {
  if (!eventListenerService) {
    eventListenerService = new EventListenerService();
  }
  return eventListenerService;
}

/**
 * Reset event listener service (for testing)
 */
export function resetEventListenerService(): void {
  if (eventListenerService) {
    eventListenerService.stop();
  }
  eventListenerService = null;
}
