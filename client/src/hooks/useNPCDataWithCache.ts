/**
 * Custom hooks for NPC data with optimized caching strategies
 * These hooks replace direct tRPC calls with cache-aware wrappers
 */

import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { CACHE_CONFIGS } from "@/lib/cacheService";

/**
 * Hook for fetching NPC list with static cache strategy
 * NPC list rarely changes, so we cache it aggressively
 */
export function useNPCList(sceneId: string) {
  return trpc.game.npc.getNpcsByScene.useQuery(
    { sceneId },
    {
      staleTime: CACHE_CONFIGS.STATIC.staleTime,
      gcTime: CACHE_CONFIGS.STATIC.cacheTime,
      refetchInterval: CACHE_CONFIGS.STATIC.refetchInterval,
      retry: 2, // NPC list is important, retry more
    }
  );
}

/**
 * Hook for fetching NPC detail with medium priority cache
 * NPC details don't change frequently but should be reasonably fresh
 */
export function useNPCDetail(npcId: string | null | undefined) {
  return trpc.game.npc.getNpcDetail.useQuery(
    { npcId: npcId || "" },
    {
      enabled: !!npcId,
      staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
      gcTime: CACHE_CONFIGS.MEDIUM_PRIORITY.cacheTime,
      refetchInterval: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchInterval,
      refetchOnWindowFocus: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchOnWindowFocus,
    }
  );
}

/**
 * Hook for fetching NPC current status with high priority cache
 * NPC status changes frequently and should be kept fresh
 */
export function useNPCCurrentStatus(npcId: string | null | undefined, enabled = true) {
  return trpc.game.npc.getCurrentStatus.useQuery(
    { npcId: npcId || "" },
    {
      enabled: enabled && !!npcId,
      staleTime: CACHE_CONFIGS.HIGH_PRIORITY.staleTime,
      gcTime: CACHE_CONFIGS.HIGH_PRIORITY.cacheTime,
      refetchInterval: CACHE_CONFIGS.HIGH_PRIORITY.refetchInterval,
      refetchOnWindowFocus: CACHE_CONFIGS.HIGH_PRIORITY.refetchOnWindowFocus,
    }
  );
}

/**
 * Hook for fetching NPC 24-hour schedule with medium priority cache
 * Schedule is relatively stable but should be refreshed periodically
 */
export function useNPCSchedule24Hours(npcId: string | null | undefined, enabled = true) {
  return trpc.game.npc.getSchedule24Hours.useQuery(
    { npcId: npcId || "" },
    {
      enabled: enabled && !!npcId,
      staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
      gcTime: CACHE_CONFIGS.MEDIUM_PRIORITY.cacheTime,
      refetchInterval: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchInterval,
      refetchOnWindowFocus: CACHE_CONFIGS.MEDIUM_PRIORITY.refetchOnWindowFocus,
    }
  );
}

/**
 * Hook for fetching available NPCs with high priority cache
 * Available NPCs change as time progresses, should be kept fresh
 */
export function useAvailableNPCs() {
  return trpc.game.npc.getAvailableNPCs.useQuery(undefined, {
    staleTime: CACHE_CONFIGS.HIGH_PRIORITY.staleTime,
    gcTime: CACHE_CONFIGS.HIGH_PRIORITY.cacheTime,
    refetchInterval: CACHE_CONFIGS.HIGH_PRIORITY.refetchInterval,
    refetchOnWindowFocus: CACHE_CONFIGS.HIGH_PRIORITY.refetchOnWindowFocus,
  });
}

/**
 * Hook for prefetching NPC detail data
 * Use when you want to preload data before displaying it
 */
export function usePrefetchNPCDetail() {
  const utils = trpc.useUtils();

  return useCallback(
    (npcId: string) => {
      return utils.game.npc.getNpcDetail.prefetch(
        { npcId },
        {
          staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
        }
      );
    },
    [utils]
  );
}

/**
 * Hook for prefetching NPC schedule data
 * Use when you want to preload schedule before opening schedule panel
 */
export function usePrefetchNPCSchedule() {
  const utils = trpc.useUtils();

  return useCallback(
    (npcId: string) => {
      return utils.game.npc.getSchedule24Hours.prefetch(
        { npcId },
        {
          staleTime: CACHE_CONFIGS.MEDIUM_PRIORITY.staleTime,
        }
      );
    },
    [utils]
  );
}

/**
 * Hook for prefetching NPC current status
 * Use when you want to preload status before displaying it
 */
export function usePrefetchNPCStatus() {
  const utils = trpc.useUtils();

  return useCallback(
    (npcId: string) => {
      return utils.game.npc.getCurrentStatus.prefetch(
        { npcId },
        {
          staleTime: CACHE_CONFIGS.HIGH_PRIORITY.staleTime,
        }
      );
    },
    [utils]
  );
}

/**
 * Composite hook for prefetching all NPC data at once
 * Use when you want to warm up cache for a specific NPC
 */
export function usePrefetchNPCAll() {
  const prefetchDetail = usePrefetchNPCDetail();
  const prefetchSchedule = usePrefetchNPCSchedule();
  const prefetchStatus = usePrefetchNPCStatus();

  return useCallback(
    async (npcId: string) => {
      return Promise.all([
        prefetchDetail(npcId),
        prefetchSchedule(npcId),
        prefetchStatus(npcId),
      ]);
    },
    [prefetchDetail, prefetchSchedule, prefetchStatus]
  );
}
