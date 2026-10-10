/**
 * Custom hooks for economy data with optimized caching strategies
 * These hooks replace direct tRPC calls with cache-aware wrappers
 */

import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { CACHE_CONFIGS } from "@/lib/cacheService";

/**
 * Hook for fetching economy data with critical priority cache
 * Economy data affects gameplay decisions, should be kept fresh
 */
export function useEconomyData() {
  return trpc.game.economy.getEconomyData.useQuery(undefined, {
    staleTime: CACHE_CONFIGS.CRITICAL.staleTime,
    gcTime: CACHE_CONFIGS.CRITICAL.cacheTime,
    refetchInterval: CACHE_CONFIGS.CRITICAL.refetchInterval,
    refetchOnWindowFocus: CACHE_CONFIGS.CRITICAL.refetchOnWindowFocus,
    retry: 2, // Economy data is critical, retry more
  });
}

/**
 * Hook for fetching bank information with high priority cache
 * Bank info affects financial decisions, should be reasonably fresh
 */
export function useBankInfo() {
  return trpc.game.economy.getBankInfo.useQuery(undefined, {
    staleTime: CACHE_CONFIGS.HIGH_PRIORITY.staleTime,
    gcTime: CACHE_CONFIGS.HIGH_PRIORITY.cacheTime,
    refetchInterval: CACHE_CONFIGS.HIGH_PRIORITY.refetchInterval,
    refetchOnWindowFocus: CACHE_CONFIGS.HIGH_PRIORITY.refetchOnWindowFocus,
  });
}

/**
 * Hook for fetching market prices with medium priority cache
 * Market prices change with time/season, moderate freshness is fine
 */
export function useMarketPrices() {
  return trpc.game.economy.getAllMarketPrices.useQuery(undefined, {
    staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
    gcTime: CACHE_CONFIGS.MEDIUM_PRIORITY.cacheTime,
    refetchInterval: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchInterval,
    refetchOnWindowFocus: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchOnWindowFocus,
  });
}

/**
 * Hook for fetching season information with medium priority cache
 * Season info is relatively stable but should be refreshed periodically
 */
export function useSeasonInfo() {
  return trpc.game.economy.getSeasonInfo.useQuery(undefined, {
    staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
    gcTime: CACHE_CONFIGS.MEDIUM_PRIORITY.cacheTime,
    refetchInterval: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchInterval,
    refetchOnWindowFocus: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchOnWindowFocus,
  });
}

/**
 * Hook for fetching single market price with medium priority cache
 * Useful for checking specific item prices
 */
export function useMarketPrice(itemId: string | null | undefined) {
  return trpc.game.economy.getMarketPrice.useQuery(
    { itemId: itemId || "" },
    {
      enabled: !!itemId,
      staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
      gcTime: CACHE_CONFIGS.MEDIUM_PRIORITY.cacheTime,
      refetchInterval: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchInterval,
      refetchOnWindowFocus: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchOnWindowFocus,
    }
  );
}

/**
 * Hook for prefetching economy data
 * Use when you want to preload economy data before opening economy panel
 */
export function usePrefetchEconomyData() {
  const utils = trpc.useUtils();

  return useCallback(() => {
    return utils.game.economy.getEconomyData.prefetch(undefined, {
      staleTime: CACHE_CONFIGS.CRITICAL.staleTime,
    });
  }, [utils]);
}

/**
 * Hook for prefetching bank information
 * Use when you want to preload bank data before opening bank panel
 */
export function usePrefetchBankInfo() {
  const utils = trpc.useUtils();

  return useCallback(() => {
    return utils.game.economy.getBankInfo.prefetch(undefined, {
      staleTime: CACHE_CONFIGS.HIGH_PRIORITY.staleTime,
    });
  }, [utils]);
}

/**
 * Hook for prefetching market prices
 * Use when you want to preload market data before opening market panel
 */
export function usePrefetchMarketPrices() {
  const utils = trpc.useUtils();

  return useCallback(() => {
    return utils.game.economy.getAllMarketPrices.prefetch(undefined, {
      staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
    });
  }, [utils]);
}

/**
 * Hook for prefetching season information
 * Use when you want to preload season data before opening season panel
 */
export function usePrefetchSeasonInfo() {
  const utils = trpc.useUtils();

  return useCallback(() => {
    return utils.game.economy.getSeasonInfo.prefetch(undefined, {
      staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
    });
  }, [utils]);
}

/**
 * Composite hook for prefetching all economy data at once
 * Use when you want to warm up cache for economy panel
 */
export function usePrefetchEconomyAll() {
  const prefetchEconomy = usePrefetchEconomyData();
  const prefetchBank = usePrefetchBankInfo();
  const prefetchMarket = usePrefetchMarketPrices();
  const prefetchSeason = usePrefetchSeasonInfo();

  return useCallback(async () => {
    return Promise.all([
      prefetchEconomy(),
      prefetchBank(),
      prefetchMarket(),
      prefetchSeason(),
    ]);
  }, [prefetchEconomy, prefetchBank, prefetchMarket, prefetchSeason]);
}
