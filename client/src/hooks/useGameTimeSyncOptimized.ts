import { useEffect, useCallback, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { CACHE_CONFIGS } from "@/lib/cacheService";

interface GameTimeSyncOptions {
  enabled?: boolean;
  baseRefetchInterval?: number; // milliseconds, default 10000 (10s)
  adaptivePolling?: boolean; // Enable adaptive polling based on activity
  onTimeChange?: (gameTime: any) => void;
  onNPCStatusChange?: (npcId: string, status: any) => void;
  onBatchStatusChange?: (statuses: Array<{ npcId: string; status: any }>) => void;
}

/**
 * Optimized hook for syncing game time and NPC statuses in real-time
 * Features:
 * - Adaptive polling frequency based on user activity
 * - Batch queries for multiple NPCs instead of individual queries
 * - Reduced network overhead through intelligent caching
 * - Configurable polling intervals
 */
export function useGameTimeSyncOptimized(options: GameTimeSyncOptions = {}) {
  const {
    enabled = true,
    baseRefetchInterval = 10000, // 10 seconds default
    adaptivePolling = true,
    onTimeChange,
    onNPCStatusChange,
    onBatchStatusChange,
  } = options;

  // Track activity for adaptive polling
  const [isUserActive, setIsUserActive] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate adaptive interval based on user activity
  const getAdaptiveInterval = useCallback((): number => {
    if (!adaptivePolling) return baseRefetchInterval;

    // If user is active, use base interval
    if (isUserActive) return baseRefetchInterval;

    // If user is inactive, increase interval (reduce polling)
    // After 30 seconds of inactivity, increase to 30 seconds
    // After 60 seconds of inactivity, increase to 60 seconds
    const inactivityDuration = Date.now() - lastActivityRef.current;
    if (inactivityDuration > 60000) return 60000; // 60 seconds
    if (inactivityDuration > 30000) return 30000; // 30 seconds
    return baseRefetchInterval;
  }, [adaptivePolling, baseRefetchInterval, isUserActive]);

  // Track user activity
  useEffect(() => {
    if (!adaptivePolling) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIsUserActive(true);

      // Clear existing timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Set timeout to mark user as inactive after 30 seconds of no activity
      activityTimeoutRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, 30000);
    };

    // Listen for user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [adaptivePolling]);

  // Fetch game state with optimized cache
  const { data: gameState, refetch: refetchGameState } = trpc.game.core.getState.useQuery(
    undefined,
    {
      staleTime: CACHE_CONFIGS.HIGH_PRIORITY.staleTime,
      gcTime: CACHE_CONFIGS.HIGH_PRIORITY.cacheTime,
      refetchOnWindowFocus: false,
    }
  );

  // Track last game time for change detection
  const lastGameTimeRef = useRef<string>("");

  // Serialize game time for comparison
  const serializeGameTime = useCallback((gameTime: any) => {
    if (!gameTime) return "";
    return `${gameTime.year}-${gameTime.month}-${gameTime.day}-${gameTime.hour}-${gameTime.minute}`;
  }, []);

  // Handle game time changes
  useEffect(() => {
    if (!gameState?.gameTime) return;

    const currentTimeStr = serializeGameTime(gameState.gameTime);
    if (currentTimeStr !== lastGameTimeRef.current) {
      lastGameTimeRef.current = currentTimeStr;
      onTimeChange?.(gameState.gameTime);
    }
  }, [gameState?.gameTime, serializeGameTime, onTimeChange]);

  // Set up periodic refetch with adaptive interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      refetchGameState();
    }, getAdaptiveInterval());

    return () => clearInterval(interval);
  }, [enabled, getAdaptiveInterval, refetchGameState]);

  return {
    gameTime: gameState?.gameTime,
    isUserActive,
    currentInterval: getAdaptiveInterval(),
    refetchGameState,
  };
}

/**
 * Hook for batch fetching NPC statuses
 * More efficient than individual queries when monitoring multiple NPCs
 */
export function useNPCStatusBatch(npcIds: string[], enabled = true) {
  const utils = trpc.useUtils();
  const [statuses, setStatuses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const lastStatusesRef = useRef<string>("");

  const fetchBatchStatuses = useCallback(async () => {
    if (!enabled || npcIds.length === 0) return;

    setIsLoading(true);
    try {
      // Fetch all NPC statuses in parallel
      const statusPromises = npcIds.map((npcId) =>
        utils.game.npc.getCurrentStatus.fetch({ npcId })
      );

      const results = await Promise.all(statusPromises);
      const statusMap: Record<string, any> = {};

      results.forEach((status, index) => {
        statusMap[npcIds[index]] = status;
      });

      // Check if statuses have changed
      const currentStatusStr = JSON.stringify(statusMap);
      if (currentStatusStr !== lastStatusesRef.current) {
        lastStatusesRef.current = currentStatusStr;
        setStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching batch NPC statuses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [npcIds, enabled, utils]);

  // Set up periodic batch fetch
  useEffect(() => {
    if (!enabled || npcIds.length === 0) return;

    // Fetch immediately
    fetchBatchStatuses();

    // Set up interval for periodic fetches
    const interval = setInterval(() => {
      fetchBatchStatuses();
    }, CACHE_CONFIGS.HIGH_PRIORITY.refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, npcIds, fetchBatchStatuses]);

  return {
    statuses,
    isLoading,
    refetch: fetchBatchStatuses,
  };
}

/**
 * Hook for monitoring game state changes with debouncing
 * Reduces unnecessary re-renders from rapid state changes
 */
export function useGameStateDebounced(debounceMs = 500) {
  const { data: gameState } = trpc.game.core.getState.useQuery(undefined, {
    staleTime: CACHE_CONFIGS.HIGH_PRIORITY.staleTime,
    gcTime: CACHE_CONFIGS.HIGH_PRIORITY.cacheTime,
  });

  const [debouncedState, setDebouncedState] = useState(gameState);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedState(gameState);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [gameState, debounceMs]);

  return debouncedState;
}

/**
 * Hook for managing polling frequency based on game events
 * Increases polling frequency during important events, reduces during idle times
 */
export function useEventDrivenPolling(baseInterval = 10000) {
  const [eventPriority, setEventPriority] = useState<"low" | "medium" | "high">("low");
  const priorityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerHighPriorityEvent = useCallback(() => {
    setEventPriority("high");

    // Reset to low priority after 5 seconds
    if (priorityTimerRef.current) {
      clearTimeout(priorityTimerRef.current);
    }

    priorityTimerRef.current = setTimeout(() => {
      setEventPriority("low");
    }, 5000);
  }, []);

  const triggerMediumPriorityEvent = useCallback(() => {
    if (eventPriority === "high") return; // Don't downgrade from high

    setEventPriority("medium");

    // Reset to low priority after 10 seconds
    if (priorityTimerRef.current) {
      clearTimeout(priorityTimerRef.current);
    }

    priorityTimerRef.current = setTimeout(() => {
      setEventPriority("low");
    }, 10000);
  }, [eventPriority]);

  // Calculate polling interval based on priority
  const getPollingInterval = useCallback((): number => {
    switch (eventPriority) {
      case "high":
        return baseInterval / 2; // 2x faster
      case "medium":
        return baseInterval; // Normal speed
      case "low":
        return baseInterval * 2; // 2x slower
      default:
        return baseInterval;
    }
  }, [eventPriority, baseInterval]);

  useEffect(() => {
    return () => {
      if (priorityTimerRef.current) {
        clearTimeout(priorityTimerRef.current);
      }
    };
  }, []);

  return {
    eventPriority,
    pollingInterval: getPollingInterval(),
    triggerHighPriorityEvent,
    triggerMediumPriorityEvent,
  };
}
