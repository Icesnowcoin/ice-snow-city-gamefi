/**
 * Integrated Data Service
 * Combines multiple data fetching strategies for optimal performance
 * - Batch queries for multiple NPCs
 * - Request deduplication
 * - Intelligent caching
 * - Adaptive polling
 */

import { trpc } from "@/lib/trpc";
import {
  createBatchQueryExecutor,
  RequestDeduplicationCache,
  AdaptiveThrottler,
  PrefetchStrategyManager,
} from "@/lib/batchQueryService";
import { CACHE_CONFIGS } from "@/lib/cacheService";

/**
 * Batch NPC data fetcher
 * Fetches multiple NPCs' data in a single batch query
 */
export class BatchNPCDataFetcher {
  private deduplicationCache: RequestDeduplicationCache<any>;
  private adaptiveThrottler: AdaptiveThrottler;
  private prefetchManager: PrefetchStrategyManager;

  constructor() {
    this.deduplicationCache = new RequestDeduplicationCache(5000);
    this.adaptiveThrottler = new AdaptiveThrottler({
      baseDelay: 100,
      maxDelay: 5000,
      windowSize: 10,
    });
    this.prefetchManager = new PrefetchStrategyManager(
      (id) => this.fetchNPCData(id),
      { maxPrefetchSize: 5, delayMs: 100 }
    );
  }

  /**
   * Fetch single NPC data with deduplication
   */
  async fetchNPCData(npcId: string): Promise<any> {
    const startTime = Date.now();

    try {
      const data = await this.deduplicationCache.get(npcId, async () => {
        // Simulate batch fetch (in real implementation, this would call tRPC)
        const response = await fetch(`/api/npc/${npcId}`);
        return response.json();
      });

      const duration = Date.now() - startTime;
      this.adaptiveThrottler.recordRequestTime(duration);

      return data;
    } catch (error) {
      console.error(`Error fetching NPC data for ${npcId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch multiple NPCs' data in parallel
   */
  async fetchMultipleNPCs(npcIds: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    // Fetch in parallel with adaptive throttling
    const promises = npcIds.map((id) =>
      this.fetchNPCData(id).then((data) => {
        results[id] = data;
      })
    );

    await Promise.all(promises);
    return results;
  }

  /**
   * Prefetch NPC data for upcoming interactions
   */
  prefetchNPCData(npcIds: string[]): void {
    this.prefetchManager.addToPrefetchQueue(npcIds);
  }

  /**
   * Get current adaptive polling interval
   */
  getAdaptiveInterval(): number {
    return this.adaptiveThrottler.getAdaptiveDelay();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.deduplicationCache.clear();
    this.adaptiveThrottler.reset();
  }
}

/**
 * Batch economy data fetcher
 * Fetches economy data with intelligent batching
 */
export class BatchEconomyDataFetcher {
  private deduplicationCache: RequestDeduplicationCache<any>;
  private batchExecutor: ReturnType<typeof createBatchQueryExecutor>;

  constructor() {
    this.deduplicationCache = new RequestDeduplicationCache(5000);
    this.batchExecutor = createBatchQueryExecutor(
      async (itemIds: string[]) => {
        // Simulate batch fetch for multiple items
        const results: Record<string, any> = {};
        for (const id of itemIds) {
          results[id] = { id, price: Math.random() * 1000 };
        }
        return results;
      },
      { batchSize: 10, delayMs: 50 }
    );
  }

  /**
   * Fetch market price for single item
   */
  async fetchMarketPrice(itemId: string): Promise<any> {
    return this.deduplicationCache.get(itemId, () => this.batchExecutor(itemId));
  }

  /**
   * Fetch market prices for multiple items
   */
  async fetchMultipleMarketPrices(itemIds: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    const promises = itemIds.map((id) =>
      this.fetchMarketPrice(id).then((price) => {
        results[id] = price;
      })
    );

    await Promise.all(promises);
    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.deduplicationCache.clear();
  }
}

/**
 * Integrated data service combining all fetching strategies
 */
export class IntegratedDataService {
  private npcFetcher: BatchNPCDataFetcher;
  private economyFetcher: BatchEconomyDataFetcher;
  private requestStats: {
    totalRequests: number;
    cachedRequests: number;
    batchedRequests: number;
    totalDuration: number;
  };

  constructor() {
    this.npcFetcher = new BatchNPCDataFetcher();
    this.economyFetcher = new BatchEconomyDataFetcher();
    this.requestStats = {
      totalRequests: 0,
      cachedRequests: 0,
      batchedRequests: 0,
      totalDuration: 0,
    };
  }

  /**
   * Fetch NPC data
   */
  async getNPCData(npcId: string): Promise<any> {
    this.requestStats.totalRequests++;
    return this.npcFetcher.fetchNPCData(npcId);
  }

  /**
   * Fetch multiple NPCs' data
   */
  async getMultipleNPCData(npcIds: string[]): Promise<Record<string, any>> {
    this.requestStats.totalRequests++;
    this.requestStats.batchedRequests++;
    return this.npcFetcher.fetchMultipleNPCs(npcIds);
  }

  /**
   * Fetch market price
   */
  async getMarketPrice(itemId: string): Promise<any> {
    this.requestStats.totalRequests++;
    return this.economyFetcher.fetchMarketPrice(itemId);
  }

  /**
   * Fetch multiple market prices
   */
  async getMultipleMarketPrices(itemIds: string[]): Promise<Record<string, any>> {
    this.requestStats.totalRequests++;
    this.requestStats.batchedRequests++;
    return this.economyFetcher.fetchMultipleMarketPrices(itemIds);
  }

  /**
   * Prefetch NPC data
   */
  prefetchNPCData(npcIds: string[]): void {
    this.npcFetcher.prefetchNPCData(npcIds);
  }

  /**
   * Get request statistics
   */
  getRequestStats() {
    return {
      ...this.requestStats,
      avgRequestDuration:
        this.requestStats.totalRequests > 0
          ? this.requestStats.totalDuration / this.requestStats.totalRequests
          : 0,
      batchingEfficiency:
        this.requestStats.totalRequests > 0
          ? (this.requestStats.batchedRequests / this.requestStats.totalRequests) * 100
          : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestStats = {
      totalRequests: 0,
      cachedRequests: 0,
      batchedRequests: 0,
      totalDuration: 0,
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.npcFetcher.clearCache();
    this.economyFetcher.clearCache();
  }
}

// Create singleton instance
export const integratedDataService = new IntegratedDataService();

/**
 * React Hook for using integrated data service
 */
export function useIntegratedDataService() {
  return integratedDataService;
}

/**
 * Hook for fetching NPC data with integrated service
 */
export function useNPCDataIntegrated(npcId: string) {
  const service = useIntegratedDataService();

  return {
    fetchNPCData: () => service.getNPCData(npcId),
    prefetchNPCData: (ids: string[]) => service.prefetchNPCData(ids),
    getStats: () => service.getRequestStats(),
  };
}

/**
 * Hook for fetching multiple NPCs' data with integrated service
 */
export function useMultipleNPCDataIntegrated(npcIds: string[]) {
  const service = useIntegratedDataService();

  return {
    fetchMultipleNPCData: () => service.getMultipleNPCData(npcIds),
    prefetchNPCData: (ids: string[]) => service.prefetchNPCData(ids),
    getStats: () => service.getRequestStats(),
  };
}

/**
 * Hook for fetching market prices with integrated service
 */
export function useMarketPriceIntegrated(itemId: string) {
  const service = useIntegratedDataService();

  return {
    fetchMarketPrice: () => service.getMarketPrice(itemId),
    getStats: () => service.getRequestStats(),
  };
}

/**
 * Hook for fetching multiple market prices with integrated service
 */
export function useMultipleMarketPricesIntegrated(itemIds: string[]) {
  const service = useIntegratedDataService();

  return {
    fetchMultipleMarketPrices: () => service.getMultipleMarketPrices(itemIds),
    getStats: () => service.getRequestStats(),
  };
}
