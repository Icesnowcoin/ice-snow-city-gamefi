/**
 * Game Reducer Tests - Comprehensive unit tests for state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialGameState, gameReducer } from './reducer';
import type { GameState, GameAction } from './types';

describe('Game Reducer', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = createInitialGameState('player-1', 'Test Player');
  });

  // ========================================================================
  // PLAYER ACTIONS
  // ========================================================================

  describe('Player Actions', () => {
    it('should gain experience', () => {
      const action: GameAction = {
        type: 'PLAYER_GAIN_EXPERIENCE',
        payload: { amount: 500 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.player.totalExperience).toBe(500);
      expect(newState.player.experience).toBe(500);
    });

    it('should level up when experience threshold is reached', () => {
      const action1: GameAction = {
        type: 'PLAYER_GAIN_EXPERIENCE',
        payload: { amount: 1000 },
      };

      const state1 = gameReducer(initialState, action1);
      expect(state1.player.level).toBe(2);
      expect(state1.player.experience).toBe(0);
    });

    it('should update player profile', () => {
      const action: GameAction = {
        type: 'PLAYER_UPDATE_PROFILE',
        payload: { bio: 'Test bio', avatar: 'avatar.png' },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.player.bio).toBe('Test bio');
      expect(newState.player.avatar).toBe('avatar.png');
    });
  });

  // ========================================================================
  // ASSET ACTIONS
  // ========================================================================

  describe('Asset Actions', () => {
    it('should add money', () => {
      const action: GameAction = {
        type: 'ASSET_ADD_MONEY',
        payload: { amount: 500 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.assets.money).toBe(1500);
    });

    it('should remove money without going negative', () => {
      const action: GameAction = {
        type: 'ASSET_REMOVE_MONEY',
        payload: { amount: 2000 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.assets.money).toBe(0);
    });

    it('should add ISC', () => {
      const action: GameAction = {
        type: 'ASSET_ADD_ISC',
        payload: { amount: 100 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.assets.isc).toBe(100);
    });

    it('should add energy capped at 100', () => {
      const action: GameAction = {
        type: 'ASSET_ADD_ENERGY',
        payload: { amount: 50 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.assets.energy).toBe(100);
    });

    it('should remove energy without going negative', () => {
      const action: GameAction = {
        type: 'ASSET_REMOVE_ENERGY',
        payload: { amount: 200 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.assets.energy).toBe(0);
    });

    it('should add population', () => {
      const action: GameAction = {
        type: 'ASSET_ADD_POPULATION',
        payload: { amount: 5 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.assets.population).toBe(6);
    });

    it('should not remove population below 1', () => {
      const action: GameAction = {
        type: 'ASSET_REMOVE_POPULATION',
        payload: { amount: 10 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.assets.population).toBe(1);
    });
  });

  // ========================================================================
  // NPC ACTIONS
  // ========================================================================

  describe('NPC Actions', () => {
    it('should interact with NPC', () => {
      const action: GameAction = {
        type: 'NPC_INTERACT',
        payload: { npcId: 'npc-1', type: 'greet' },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.npcRelationships).toHaveLength(1);
      expect(newState.npcRelationships[0].npcId).toBe('npc-1');
      expect(newState.npcRelationships[0].interactionCount).toBe(1);
    });

    it('should update NPC relationship favorability', () => {
      const action1: GameAction = {
        type: 'NPC_INTERACT',
        payload: { npcId: 'npc-1', type: 'greet' },
      };

      let state = gameReducer(initialState, action1);

      const action2: GameAction = {
        type: 'NPC_UPDATE_RELATIONSHIP',
        payload: { npcId: 'npc-1', favorabilityChange: 25 },
      };

      state = gameReducer(state, action2);

      expect(state.npcRelationships[0].favorability).toBe(25);
      expect(state.npcRelationships[0].relationship).toBe('acquaintance');
    });

    it('should gift NPC and increase favorability', () => {
      const action1: GameAction = {
        type: 'NPC_INTERACT',
        payload: { npcId: 'npc-1', type: 'greet' },
      };

      let state = gameReducer(initialState, action1);

      const action2: GameAction = {
        type: 'NPC_GIFT',
        payload: { npcId: 'npc-1', itemId: 'item-1' },
      };

      state = gameReducer(state, action2);

      expect(state.npcRelationships[0].favorability).toBe(10);
    });

    it('should date NPC and cost money', () => {
      const action1: GameAction = {
        type: 'NPC_INTERACT',
        payload: { npcId: 'npc-1', type: 'greet' },
      };

      let state = gameReducer(initialState, action1);

      const action2: GameAction = {
        type: 'NPC_DATE',
        payload: { npcId: 'npc-1', location: 'park' },
      };

      state = gameReducer(state, action2);

      expect(state.npcRelationships[0].favorability).toBe(15);
      expect(state.assets.money).toBe(950); // 1000 - 50
    });
  });

  // ========================================================================
  // ECONOMY ACTIONS
  // ========================================================================

  describe('Economy Actions', () => {
    it('should deposit money to wallet', () => {
      const action: GameAction = {
        type: 'WALLET_DEPOSIT',
        payload: { amount: 500, currency: 'money' },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.wallet.money).toBe(1500);
      expect(newState.assets.money).toBe(1500);
    });

    it('should withdraw money from wallet', () => {
      const action: GameAction = {
        type: 'WALLET_WITHDRAW',
        payload: { amount: 500, currency: 'money' },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.wallet.money).toBe(500);
      expect(newState.assets.money).toBe(500);
    });

    it('should deposit to bank', () => {
      const action: GameAction = {
        type: 'BANK_DEPOSIT',
        payload: { amount: 500 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.bankAccount.balance).toBe(500);
      expect(newState.bankAccount.depositCount).toBe(1);
      expect(newState.bankAccount.totalDeposited).toBe(500);
      expect(newState.wallet.money).toBe(500);
    });

    it('should withdraw from bank', () => {
      const action1: GameAction = {
        type: 'BANK_DEPOSIT',
        payload: { amount: 500 },
      };

      let state = gameReducer(initialState, action1);

      const action2: GameAction = {
        type: 'BANK_WITHDRAW',
        payload: { amount: 300 },
      };

      state = gameReducer(state, action2);

      expect(state.bankAccount.balance).toBe(200);
      expect(state.wallet.money).toBe(800);
    });

    it('should claim interest', () => {
      const action1: GameAction = {
        type: 'BANK_DEPOSIT',
        payload: { amount: 1000 },
      };

      let state = gameReducer(initialState, action1);

      const action2: GameAction = {
        type: 'BANK_CLAIM_INTEREST',
        payload: { amount: 50 },
      };

      state = gameReducer(state, action2);

      expect(state.bankAccount.balance).toBe(1050);
      expect(state.assets.isc).toBe(50);
    });
  });

  // ========================================================================
  // PROPERTY ACTIONS
  // ========================================================================

  describe('Property Actions', () => {
    it('should purchase property', () => {
      const property = {
        id: 'prop-1',
        ownerId: null,
        name: 'House',
        type: 'house' as const,
        location: 'downtown',
        price: 500,
        rentalIncome: 0,
        isRented: false,
        condition: 100,
      };

      const stateWithProperty = {
        ...initialState,
        properties: [property],
      };

      const action: GameAction = {
        type: 'PROPERTY_PURCHASE',
        payload: { propertyId: 'prop-1', price: 500 },
      };

      const newState = gameReducer(stateWithProperty, action);

      expect(newState.properties[0].ownerId).toBe('player-1');
      expect(newState.assets.money).toBe(500);
      expect(newState.progress.propertiesOwned).toBe(1);
    });
  });

  // ========================================================================
  // FARM ACTIONS
  // ========================================================================

  describe('Farm Actions', () => {
    it('should create farm', () => {
      const farm = {
        id: 'farm-1',
        ownerId: 'player-1',
        name: 'Test Farm',
        location: 'countryside',
        size: 10,
        totalPlots: 10,
        availablePlots: 10,
        crops: [],
        createdAt: new Date(),
      };

      const action: GameAction = {
        type: 'FARM_CREATE',
        payload: farm,
      };

      const newState = gameReducer(initialState, action);

      expect(newState.farms).toHaveLength(1);
      expect(newState.farms[0].name).toBe('Test Farm');
      expect(newState.progress.farmsCreated).toBe(1);
    });

    it('should harvest crop and add profit', () => {
      const action: GameAction = {
        type: 'FARM_HARVEST',
        payload: { farmId: 'farm-1', cropId: 'crop-1', yield: 100 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.harvestHistory).toHaveLength(1);
      expect(newState.assets.money).toBe(2000); // 1000 + (100 * 10)
    });
  });

  // ========================================================================
  // TASK ACTIONS
  // ========================================================================

  describe('Task Actions', () => {
    it('should accept task', () => {
      const task = {
        id: 'task-1',
        npcId: 'npc-1',
        title: 'Fetch Water',
        description: 'Fetch 10 buckets of water',
        type: 'fetch' as const,
        status: 'available' as const,
        reward: { money: 100, isc: 0, experience: 50 },
        difficulty: 'easy' as const,
      };

      const stateWithTask = {
        ...initialState,
        tasks: [task],
      };

      const action: GameAction = {
        type: 'TASK_ACCEPT',
        payload: { taskId: 'task-1' },
      };

      const newState = gameReducer(stateWithTask, action);

      expect(newState.tasks[0].status).toBe('accepted');
      expect(newState.tasks[0].acceptedAt).toBeDefined();
    });

    it('should complete task and award rewards', () => {
      const task = {
        id: 'task-1',
        npcId: 'npc-1',
        title: 'Fetch Water',
        description: 'Fetch 10 buckets of water',
        type: 'fetch' as const,
        status: 'accepted' as const,
        reward: { money: 100, isc: 0, experience: 50 },
        difficulty: 'easy' as const,
        acceptedAt: new Date(),
      };

      const stateWithTask = {
        ...initialState,
        tasks: [task],
      };

      const action: GameAction = {
        type: 'TASK_COMPLETE',
        payload: {
          taskId: 'task-1',
          reward: { money: 100, isc: 0, experience: 50 },
        },
      };

      const newState = gameReducer(stateWithTask, action);

      expect(newState.tasks[0].status).toBe('completed');
      expect(newState.assets.money).toBe(1100);
      expect(newState.player.experience).toBe(50);
      expect(newState.progress.tasksCompleted).toBe(1);
    });
  });

  // ========================================================================
  // GAME TIME ACTIONS
  // ========================================================================

  describe('Game Time Actions', () => {
    it('should advance game time by minutes', () => {
      const action: GameAction = {
        type: 'GAME_TIME_ADVANCE',
        payload: { minutes: 60 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.gameTime.hour).toBe(9);
      expect(newState.gameTime.day).toBe(1);
    });

    it('should advance to next day', () => {
      const action: GameAction = {
        type: 'GAME_TIME_ADVANCE',
        payload: { minutes: 960 }, // 16 hours
      };

      const newState = gameReducer(initialState, action);

      expect(newState.gameTime.day).toBe(2);
      expect(newState.gameTime.hour).toBe(0);
    });

    it('should advance to next month', () => {
      const action: GameAction = {
        type: 'GAME_TIME_ADVANCE',
        payload: { minutes: 43200 }, // 30 days
      };

      const newState = gameReducer(initialState, action);

      expect(newState.gameTime.month).toBe(2);
      expect(newState.gameTime.day).toBe(1);
    });

    it('should update season correctly', () => {
      const stateInWinter = {
        ...initialState,
        gameTime: {
          day: 1,
          month: 12,
          year: 1,
          hour: 8,
          minute: 0,
          season: 'winter' as const,
        },
      };

      const action: GameAction = {
        type: 'GAME_TIME_ADVANCE',
        payload: { minutes: 43200 }, // 30 days to cross month boundary
      };

      const newState = gameReducer(stateInWinter, action);

      expect(newState.gameTime.month).toBe(1);
      expect(newState.gameTime.year).toBe(2);
      expect(newState.gameTime.season).toBe('spring');
    });
  });

  // ========================================================================
  // GAME SAVE/LOAD
  // ========================================================================

  describe('Game Save/Load', () => {
    it('should save game state', () => {
      const action: GameAction = {
        type: 'GAME_SAVE',
        payload: { timestamp: new Date() },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.lastSaved).toBeDefined();
    });

    it('should load game state', () => {
      const savedState = {
        ...initialState,
        assets: {
          ...initialState.assets,
          money: 5000,
        },
      };

      const action: GameAction = {
        type: 'GAME_LOAD',
        payload: savedState,
      };

      const newState = gameReducer(initialState, action);

      expect(newState.assets.money).toBe(5000);
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle unknown action gracefully', () => {
      const action = {
        type: 'UNKNOWN_ACTION',
        payload: {},
      } as GameAction;

      const newState = gameReducer(initialState, action);

      expect(newState).toEqual(initialState);
    });

    it('should not mutate original state', () => {
      const originalState = JSON.stringify(initialState);

      const action: GameAction = {
        type: 'ASSET_ADD_MONEY',
        payload: { amount: 500 },
      };

      gameReducer(initialState, action);

      expect(JSON.stringify(initialState)).toBe(originalState);
    });
  });
});
