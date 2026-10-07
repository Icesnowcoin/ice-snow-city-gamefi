/**
 * Client-side cache service for managing game data caching and preloading
 * Provides centralized cache configuration and data management strategies
 */

import { QueryClient } from "@tanstack/react-query";

export interface CacheConfig {
  // Stale time: how long data is considered fresh (ms)
  staleTime: number;
  // Cache time: how long data remains in cache after unused (ms)
  cacheTime: number;
  // Refetch interval: how often to refetch in background (ms, 0 = disabled)
  refetchInterval: number;
  // Refetch on window focus
  refetchOnWindowFocus: boolean;
  // Refetch on mount
  refetchOnMount: boolean;
}

/**
 * Cache configuration presets for different data types
 * These define the freshness and refetch behavior for each data category
 */
export const CACHE_CONFIGS = {
  // Critical data: player balance, current status (very fresh)
  CRITICAL: {
    staleTime: 5000, // 5 seconds
    cacheTime: 60000, // 1 minute
    refetchInterval: 10000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  } as CacheConfig,

  // High priority: NPC status, current location (fresh)
  HIGH_PRIORITY: {
    staleTime: 10000, // 10 seconds
    cacheTime: 120000, // 2 minutes
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  } as CacheConfig,

  // Medium priority: NPC schedule, market prices (moderate)
  MEDIUM_PRIORITY: {
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchInterval: 60000, // 60 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  } as CacheConfig,

  // Low priority: NPC details, economy info (less frequent)
  LOW_PRIORITY: {
    staleTime: 60000, // 1 minute
    cacheTime: 600000, // 10 minutes
    refetchInterval: 0, // No automatic refetch
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  } as CacheConfig,

  // Static data: NPC list, item definitions (very stable)
  STATIC: {
    staleTime: 300000, // 5 minutes
    cacheTime: 3600000, // 1 hour
    refetchInterval: 0, // No automatic refetch
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  } as CacheConfig,
};

/**
 * Cache service for managing game data
 * Provides methods for cache invalidation, preloading, and configuration
 */
export class GameCacheService {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Invalidate NPC-related queries
   * Call this when NPC data changes (interaction, schedule update, etc.)
   */
  invalidateNPCQueries(npcId?: string) {
    if (npcId) {
      // Invalidate specific NPC queries
      this.queryClient.invalidateQueries({
        queryKey: ["game", "npc", "getNpcDetail", { npcId }],
      });
      this.queryClient.invalidateQueries({
        queryKey: ["game", "npc", "getSchedule24Hours", { npcId }],
      });
      this.queryClient.invalidateQueries({
        queryKey: ["game", "npc", "getCurrentStatus", { npcId }],
      });
    } else {
      // Invalidate all NPC queries
      this.queryClient.invalidateQueries({
        queryKey: ["game", "npc"],
      });
    }
  }

  /**
   * Invalidate economy-related queries
   * Call this when economy data changes (purchase, harvest, etc.)
   */
  invalidateEconomyQueries() {
    this.queryClient.invalidateQueries({
      queryKey: ["game", "economy"],
    });
  }

  /**
   * Invalidate game state queries
   * Call this when game state changes significantly
   */
  invalidateGameStateQueries() {
    this.queryClient.invalidateQueries({
      queryKey: ["game", "core", "getState"],
    });
  }

  /**
   * Invalidate all game-related queries
   * Use sparingly - only for major state changes
   */
  invalidateAllGameQueries() {
    this.queryClient.invalidateQueries({
      queryKey: ["game"],
    });
  }

  /**
   * Prefetch NPC detail data
   * Useful for preloading when user hovers over or selects an NPC
   */
  async prefetchNPCDetail(npcId: string) {
    // This will be called from components with the trpc client
    // The actual prefetch logic will be in the component
    return Promise.resolve();
  }

  /**
   * Prefetch NPC schedule data
   * Useful for preloading when user is about to open schedule panel
   */
  async prefetchNPCSchedule(npcId: string) {
    // This will be called from components with the trpc client
    // The actual prefetch logic will be in the component
    return Promise.resolve();
  }

  /**
   * Prefetch economy data
   * Useful for preloading before economy panel opens
   */
  async prefetchEconomyData() {
    // This will be called from components with the trpc client
    // The actual prefetch logic will be in the component
    return Promise.resolve();
  }

  /**
   * Clear all cache
   * Use when user logs out or switches accounts
   */
  clearAllCache() {
    this.queryClient.clear();
  }

  /**
   * Get cache size statistics (for debugging)
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      stalledQueries: queries.filter((q) => q.isStale()).length,
      cachedQueries: queries.filter((q) => q.state.data !== undefined).length,
    };
  }
}

/**
 * Create a singleton instance of GameCacheService
 * Should be called once during app initialization
 */
let cacheServiceInstance: GameCacheService | null = null;

export function createCacheService(queryClient: QueryClient): GameCacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new GameCacheService(queryClient);
  }
  return cacheServiceInstance;
}

export function getCacheService(): GameCacheService {
  if (!cacheServiceInstance) {
    throw new Error("Cache service not initialized. Call createCacheService first.");
  }
  return cacheServiceInstance;
}
