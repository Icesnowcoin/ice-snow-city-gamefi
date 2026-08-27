import { useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

interface GameTimeSyncOptions {
  enabled?: boolean;
  refetchInterval?: number; // milliseconds
  onTimeChange?: (gameTime: any) => void;
  onNPCStatusChange?: (npcId: string, status: any) => void;
}

/**
 * Hook for syncing game time and NPC statuses in real-time
 * Automatically refetches game state and NPC data when time changes
 */
export function useGameTimeSync(options: GameTimeSyncOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 5000, // 5 seconds
    onTimeChange,
    onNPCStatusChange,
  } = options;

  const { data: gameState, refetch: refetchGameState } = trpc.game.core.getState.useQuery();
  const { data: npcStatus, refetch: refetchNPCStatus } = trpc.game.npc.getCurrentStatus.useQuery(
    { npcId: "npc_001" }, // Default NPC, can be customized
    { enabled: false }
  );

  const lastGameTimeRef = useRef<string>("");
  const lastNPCStatusRef = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Serialize game time for comparison
  const serializeGameTime = useCallback((gameTime: any) => {
    if (!gameTime) return "";
    return `${gameTime.year}-${gameTime.month}-${gameTime.day}-${gameTime.hour}-${gameTime.minute}`;
  }, []);

  // Serialize NPC status for comparison
  const serializeNPCStatus = useCallback((status: any) => {
    if (!status) return "";
    return `${status.npcId}-${status.location}-${status.activity}-${status.isAvailable}`;
  }, []);

  // Handle game time changes
  useEffect(() => {
    if (!gameState?.gameTime) return;

    const currentTimeStr = serializeGameTime(gameState.gameTime);
    if (currentTimeStr !== lastGameTimeRef.current) {
      lastGameTimeRef.current = currentTimeStr;
      onTimeChange?.(gameState.gameTime);
      
      // Refetch NPC status when time changes
      refetchNPCStatus();
    }
  }, [gameState?.gameTime, serializeGameTime, onTimeChange, refetchNPCStatus]);

  // Handle NPC status changes
  useEffect(() => {
    if (!npcStatus) return;

    const currentStatusStr = serializeNPCStatus(npcStatus);
    if (currentStatusStr !== lastNPCStatusRef.current) {
      lastNPCStatusRef.current = currentStatusStr;
      onNPCStatusChange?.(npcStatus.npcId, npcStatus);
    }
  }, [npcStatus, serializeNPCStatus, onNPCStatusChange]);

  // Set up periodic refetch
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      refetchGameState();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refetchInterval, refetchGameState]);

  return {
    gameTime: gameState?.gameTime,
    npcStatus,
    refetchGameState,
    refetchNPCStatus,
  };
}
