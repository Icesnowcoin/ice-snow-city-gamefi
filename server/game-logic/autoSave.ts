/**
 * Auto-Save Mechanism for Game State
 * Handles periodic saves, page-leave saves, and debounced saves
 */

import { saveGameState as dbSaveGameState } from '../db';
import type { GameState } from './types';

interface AutoSaveConfig {
  intervalMs: number; // Periodic save interval
  debounceMs: number; // Debounce time for state changes
  maxRetries: number; // Max retry attempts for failed saves
  retryDelayMs: number; // Delay between retries
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  intervalMs: 60000, // Save every 60 seconds
  debounceMs: 5000, // Debounce state changes for 5 seconds
  maxRetries: 3,
  retryDelayMs: 2000,
};

class AutoSaveManager {
  private config: AutoSaveConfig;
  private pendingSaves = new Map<number, { state: GameState; timestamp: number }>();
  private saveIntervals = new Map<number, NodeJS.Timeout>();
  private debounceTimers = new Map<number, NodeJS.Timeout>();
  private lastSaveTime = new Map<number, number>();
  private failedSaves = new Map<number, { count: number; lastError: Error }>();

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Schedule periodic auto-save for a player
   */
  startPeriodicSave(userId: number, getState: () => GameState): void {
    // Clear existing interval if any
    this.stopPeriodicSave(userId);

    const interval = setInterval(async () => {
      try {
        const state = getState();
        await this.saveWithRetry(userId, state);
      } catch (error) {
        console.error(`Auto-save failed for user ${userId}:`, error);
        this.recordFailedSave(userId, error as Error);
      }
    }, this.config.intervalMs);

    this.saveIntervals.set(userId, interval);
  }

  /**
   * Stop periodic auto-save for a player
   */
  stopPeriodicSave(userId: number): void {
    const interval = this.saveIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.saveIntervals.delete(userId);
    }
  }

  /**
   * Queue a debounced save on state change
   */
  queueDebouncedSave(userId: number, state: GameState): void {
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Store pending state
    this.pendingSaves.set(userId, {
      state,
      timestamp: Date.now(),
    });

    // Set new debounce timer
    const timer = setTimeout(async () => {
      try {
        const pending = this.pendingSaves.get(userId);
        if (pending) {
          await this.saveWithRetry(userId, pending.state);
          this.pendingSaves.delete(userId);
        }
      } catch (error) {
        console.error(`Debounced auto-save failed for user ${userId}:`, error);
        this.recordFailedSave(userId, error as Error);
      }
      this.debounceTimers.delete(userId);
    }, this.config.debounceMs);

    this.debounceTimers.set(userId, timer);
  }

  /**
   * Immediate save with retry logic
   */
  private async saveWithRetry(userId: number, state: GameState, attempt = 0): Promise<void> {
    try {
      const stateJson = JSON.stringify(state, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });

      await dbSaveGameState(userId, stateJson);
      this.lastSaveTime.set(userId, Date.now());
      this.failedSaves.delete(userId); // Clear failed save record on success
    } catch (error) {
      if (attempt < this.config.maxRetries) {
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));
        return this.saveWithRetry(userId, state, attempt + 1);
      } else {
        // Max retries exceeded
        throw error;
      }
    }
  }

  /**
   * Force immediate save (e.g., on page leave)
   */
  async forceSave(userId: number, state: GameState): Promise<void> {
    // Cancel any pending debounced saves
    const debounceTimer = this.debounceTimers.get(userId);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      this.debounceTimers.delete(userId);
    }

    // Perform immediate save with retries
    await this.saveWithRetry(userId, state);
  }

  /**
   * Get auto-save statistics for a player
   */
  getStats(userId: number) {
    const lastSave = this.lastSaveTime.get(userId);
    const failedSave = this.failedSaves.get(userId);
    const pending = this.pendingSaves.get(userId);

    return {
      lastSaveTime: lastSave ? new Date(lastSave) : null,
      lastSaveAgo: lastSave ? Date.now() - lastSave : null,
      failedAttempts: failedSave?.count || 0,
      lastError: failedSave?.lastError?.message || null,
      hasPendingSave: !!pending,
      pendingSaveAge: pending ? Date.now() - pending.timestamp : null,
    };
  }

  /**
   * Record a failed save attempt
   */
  private recordFailedSave(userId: number, error: Error): void {
    const existing = this.failedSaves.get(userId);
    this.failedSaves.set(userId, {
      count: (existing?.count || 0) + 1,
      lastError: error,
    });
  }

  /**
   * Cleanup resources for a player
   */
  cleanup(userId: number): void {
    this.stopPeriodicSave(userId);

    const debounceTimer = this.debounceTimers.get(userId);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    this.debounceTimers.delete(userId);
    this.pendingSaves.delete(userId);
    this.lastSaveTime.delete(userId);
    this.failedSaves.delete(userId);
  }

  /**
   * Cleanup all resources
   */
  cleanupAll(): void {
    this.saveIntervals.forEach((interval) => clearInterval(interval));
    this.debounceTimers.forEach((timer) => clearTimeout(timer));

    this.saveIntervals.clear();
    this.debounceTimers.clear();
    this.pendingSaves.clear();
    this.lastSaveTime.clear();
    this.failedSaves.clear();
  }
}

// Export singleton instance
export const autoSaveManager = new AutoSaveManager();

/**
 * Hook for React components to enable auto-save
 * Usage:
 * ```
 * useAutoSave(userId, gameState, {
 *   periodic: true,
 *   debounced: true,
 *   saveOnUnload: true
 * });
 * ```
 */
export function createAutoSaveHook() {
  return function useAutoSave(
    userId: number,
    state: GameState,
    options: {
      periodic?: boolean;
      debounced?: boolean;
      saveOnUnload?: boolean;
    } = {}
  ) {
    const { periodic = true, debounced = true, saveOnUnload = true } = options;

    // Setup periodic save
    if (periodic) {
      autoSaveManager.startPeriodicSave(userId, () => state);
    }

    // Setup debounced save on state change
    if (debounced) {
      autoSaveManager.queueDebouncedSave(userId, state);
    }

    // Setup save on page unload
    if (saveOnUnload) {
      const handleBeforeUnload = async () => {
        try {
          await autoSaveManager.forceSave(userId, state);
        } catch (error) {
          console.error('Failed to save on page unload:', error);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('unload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('unload', handleBeforeUnload);
        autoSaveManager.cleanup(userId);
      };
    }

    return () => {
      autoSaveManager.cleanup(userId);
    };
  };
}

export type { AutoSaveConfig };
