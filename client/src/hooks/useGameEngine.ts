/**
 * useGameEngine - React hook for integrating game logic with UI
 * Manages game state and dispatches actions
 */

import { useCallback, useReducer, useEffect } from 'react';
import type { GameState, GameAction } from '../../../server/game-logic/types';

// Import game logic (will need to be adapted for client-side use)
// For now, we'll create a client-side version of the reducer

interface UseGameEngineOptions {
  playerId: string;
  playerName: string;
  onStateChange?: (state: GameState) => void;
}

/**
 * Custom hook for managing game state
 */
export function useGameEngine(options: UseGameEngineOptions) {
  const { playerId, playerName, onStateChange } = options;

  // Initialize game state (simplified version for client)
  const initialState: GameState = {
    player: {
      id: playerId,
      name: playerName,
      level: 1,
      experience: 0,
      totalExperience: 0,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    },
    assets: {
      money: 1000,
      isc: 0,
      energy: 100,
      food: 50,
      water: 50,
      population: 1,
      reputation: 0,
    },
    progress: {
      tasksCompleted: 0,
      npcsFriended: 0,
      propertiesOwned: 0,
      farmsCreated: 0,
      itemsTraded: 0,
      achievements: [],
    },
    wallet: {
      playerId,
      money: 1000,
      isc: 0,
      lastUpdated: new Date(),
    },
    inventory: {
      playerId,
      items: [],
      capacity: 20,
    },
    npcRelationships: [],
    npcInteractionHistory: [],
    transactions: [],
    bankAccount: {
      playerId,
      balance: 0,
      depositCount: 0,
      totalDeposited: 0,
      interestRate: 5,
      lastInterestPaid: new Date(),
      accountCreatedAt: new Date(),
    },
    marketPrices: [],
    properties: [],
    rentals: [],
    farms: [],
    harvestHistory: [],
    tasks: [],
    gameTime: {
      day: 1,
      month: 1,
      year: 1,
      hour: 8,
      minute: 0,
      season: 'spring',
    },
    lastSaved: new Date(),
    version: '1.0.0',
  };

  // Simplified reducer for client-side state management
  const gameReducer = (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'PLAYER_GAIN_EXPERIENCE': {
        const newExperience = state.player.experience + action.payload.amount;
        const experiencePerLevel = 1000;
        const newLevel = Math.floor(newExperience / experiencePerLevel) + 1;

        return {
          ...state,
          player: {
            ...state.player,
            experience: newExperience % experiencePerLevel,
            level: newLevel,
            totalExperience: state.player.totalExperience + action.payload.amount,
            lastActiveAt: new Date(),
          },
        };
      }

      case 'ASSET_ADD_MONEY': {
        return {
          ...state,
          assets: {
            ...state.assets,
            money: Math.max(0, state.assets.money + action.payload.amount),
          },
        };
      }

      case 'ASSET_REMOVE_MONEY': {
        return {
          ...state,
          assets: {
            ...state.assets,
            money: Math.max(0, state.assets.money - action.payload.amount),
          },
        };
      }

      case 'ASSET_ADD_ISC': {
        return {
          ...state,
          assets: {
            ...state.assets,
            isc: Math.max(0, state.assets.isc + action.payload.amount),
          },
        };
      }

      case 'ASSET_REMOVE_ISC': {
        return {
          ...state,
          assets: {
            ...state.assets,
            isc: Math.max(0, state.assets.isc - action.payload.amount),
          },
        };
      }

      case 'NPC_INTERACT': {
        const existingRelationship = state.npcRelationships.find(
          (r) => r.npcId === action.payload.npcId
        );

        const updatedRelationships = existingRelationship
          ? state.npcRelationships.map((r) =>
              r.npcId === action.payload.npcId
                ? {
                    ...r,
                    lastInteraction: new Date(),
                    interactionCount: r.interactionCount + 1,
                  }
                : r
            )
          : [
              ...state.npcRelationships,
              {
                npcId: action.payload.npcId,
                favorability: 0,
                relationship: 'stranger' as const,
                lastInteraction: new Date(),
                interactionCount: 1,
                likes: [],
                dislikes: [],
              },
            ];

        return {
          ...state,
          npcRelationships: updatedRelationships,
        };
      }

      case 'NPC_UPDATE_RELATIONSHIP': {
        return {
          ...state,
          npcRelationships: state.npcRelationships.map((r) =>
            r.npcId === action.payload.npcId
              ? {
                  ...r,
                  favorability: Math.min(
                    100,
                    Math.max(0, r.favorability + action.payload.favorabilityChange)
                  ),
                }
              : r
          ),
        };
      }

      case 'WALLET_DEPOSIT': {
        const newWallet = { ...state.wallet };
        if (action.payload.currency === 'money') {
          newWallet.money += action.payload.amount;
        } else {
          newWallet.isc += action.payload.amount;
        }
        newWallet.lastUpdated = new Date();

        return {
          ...state,
          wallet: newWallet,
        };
      }

      case 'WALLET_WITHDRAW': {
        const newWallet = { ...state.wallet };
        if (action.payload.currency === 'money') {
          newWallet.money = Math.max(0, newWallet.money - action.payload.amount);
        } else {
          newWallet.isc = Math.max(0, newWallet.isc - action.payload.amount);
        }
        newWallet.lastUpdated = new Date();

        return {
          ...state,
          wallet: newWallet,
        };
      }

      case 'TASK_ACCEPT': {
        return {
          ...state,
          tasks: state.tasks.map((t) =>
            t.id === action.payload.taskId
              ? {
                  ...t,
                  status: 'accepted' as const,
                  acceptedAt: new Date(),
                }
              : t
          ),
        };
      }

      case 'TASK_COMPLETE': {
        return {
          ...state,
          tasks: state.tasks.map((t) =>
            t.id === action.payload.taskId
              ? {
                  ...t,
                  status: 'completed' as const,
                  completedAt: new Date(),
                }
              : t
          ),
          assets: {
            ...state.assets,
            money: state.assets.money + action.payload.reward.money,
            isc: state.assets.isc + action.payload.reward.isc,
          },
          player: {
            ...state.player,
            experience: state.player.experience + action.payload.reward.experience,
          },
          progress: {
            ...state.progress,
            tasksCompleted: state.progress.tasksCompleted + 1,
          },
        };
      }

      case 'GAME_TIME_ADVANCE': {
        let totalMinutes = state.gameTime.hour * 60 + state.gameTime.minute + action.payload.minutes;
        let day = state.gameTime.day;
        let month = state.gameTime.month;
        let year = state.gameTime.year;

        const daysAdvanced = Math.floor(totalMinutes / (24 * 60));
        totalMinutes = totalMinutes % (24 * 60);

        day += daysAdvanced;

        const daysInMonth = 30;
        if (day > daysInMonth) {
          const monthsAdvanced = Math.floor((day - 1) / daysInMonth);
          month += monthsAdvanced;
          day = ((day - 1) % daysInMonth) + 1;

          if (month > 12) {
            const yearsAdvanced = Math.floor((month - 1) / 12);
            year += yearsAdvanced;
            month = ((month - 1) % 12) + 1;
          }
        }

        const hour = Math.floor(totalMinutes / 60) % 24;
        const minute = totalMinutes % 60;

        const seasonMap: Record<number, 'spring' | 'summer' | 'autumn' | 'winter'> = {
          1: 'spring',
          2: 'spring',
          3: 'spring',
          4: 'summer',
          5: 'summer',
          6: 'summer',
          7: 'autumn',
          8: 'autumn',
          9: 'autumn',
          10: 'winter',
          11: 'winter',
          12: 'winter',
        };

        return {
          ...state,
          gameTime: {
            day,
            month,
            year,
            hour,
            minute,
            season: seasonMap[month] || 'spring',
          },
        };
      }

      case 'GAME_SAVE': {
        return {
          ...state,
          lastSaved: action.payload.timestamp,
        };
      }

      case 'GAME_LOAD': {
        return action.payload;
      }

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Call onStateChange whenever state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Helper functions for common actions
  const gainExperience = useCallback(
    (amount: number) => {
      dispatch({
        type: 'PLAYER_GAIN_EXPERIENCE',
        payload: { amount },
      });
    },
    []
  );

  const addMoney = useCallback(
    (amount: number) => {
      dispatch({
        type: 'ASSET_ADD_MONEY',
        payload: { amount },
      });
    },
    []
  );

  const removeMoney = useCallback(
    (amount: number) => {
      dispatch({
        type: 'ASSET_REMOVE_MONEY',
        payload: { amount },
      });
    },
    []
  );

  const interactWithNPC = useCallback(
    (npcId: string) => {
      dispatch({
        type: 'NPC_INTERACT',
        payload: { npcId, type: 'greet' },
      });
    },
    []
  );

  const updateNPCRelationship = useCallback(
    (npcId: string, favorabilityChange: number) => {
      dispatch({
        type: 'NPC_UPDATE_RELATIONSHIP',
        payload: { npcId, favorabilityChange },
      });
    },
    []
  );

  const depositMoney = useCallback(
    (amount: number) => {
      dispatch({
        type: 'WALLET_DEPOSIT',
        payload: { amount, currency: 'money' },
      });
    },
    []
  );

  const withdrawMoney = useCallback(
    (amount: number) => {
      dispatch({
        type: 'WALLET_WITHDRAW',
        payload: { amount, currency: 'money' },
      });
    },
    []
  );

  const acceptTask = useCallback(
    (taskId: string) => {
      dispatch({
        type: 'TASK_ACCEPT',
        payload: { taskId },
      });
    },
    []
  );

  const completeTask = useCallback(
    (taskId: string, reward: any) => {
      dispatch({
        type: 'TASK_COMPLETE',
        payload: { taskId, reward },
      });
    },
    []
  );

  const advanceTime = useCallback(
    (minutes: number) => {
      dispatch({
        type: 'GAME_TIME_ADVANCE',
        payload: { minutes },
      });
    },
    []
  );

  return {
    state,
    dispatch,
    // Helper functions
    gainExperience,
    addMoney,
    removeMoney,
    interactWithNPC,
    updateNPCRelationship,
    depositMoney,
    withdrawMoney,
    acceptTask,
    completeTask,
    advanceTime,
  };
}

/**
 * Get player stats from game state
 */
export function getPlayerStats(state: GameState) {
  return {
    level: state.player.level,
    experience: state.player.experience,
    totalExperience: state.player.totalExperience,
    tasksCompleted: state.progress.tasksCompleted,
    npcsFriended: state.progress.npcsFriended,
    propertiesOwned: state.progress.propertiesOwned,
    farmsCreated: state.progress.farmsCreated,
    achievements: state.progress.achievements,
  };
}

/**
 * Get NPC relationship from game state
 */
export function getNPCRelationship(state: GameState, npcId: string) {
  return state.npcRelationships.find((r) => r.npcId === npcId);
}

/**
 * Get wallet balance from game state
 */
export function getWalletBalance(state: GameState) {
  return {
    money: state.wallet.money,
    isc: state.wallet.isc,
    bankBalance: state.bankAccount.balance,
    totalAssets: state.wallet.money + state.wallet.isc + state.bankAccount.balance,
  };
}

/**
 * Get game time string
 */
export function getGameTimeString(state: GameState): string {
  const { day, month, year, hour, minute, season } = state.gameTime;
  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  return `Year ${year}, ${season.charAt(0).toUpperCase() + season.slice(1)} ${day} - ${hourStr}:${minuteStr}`;
}
