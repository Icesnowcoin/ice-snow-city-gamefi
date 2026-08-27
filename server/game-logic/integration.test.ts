/**
 * Game Logic Integration Tests - End-to-end game flow tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialGameState, gameReducer } from './reducer';
import {
  PlayerService,
  NPCService,
  EconomyService,
  TaskService,
  PropertyService,
  FarmService,
  ShopService,
  GameTimeService,
} from './services';
import type { GameState } from './types';

describe('Game Logic Integration Tests', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createInitialGameState('player-1', 'Test Player');
  });

  // ========================================================================
  // COMPLETE GAME FLOWS
  // ========================================================================

  describe('Complete Game Flows', () => {
    it('should complete full NPC interaction flow', () => {
      // 1. Interact with NPC
      let action = NPCService.interactWithNPC(gameState, 'npc-1', 'greet');
      gameState = gameReducer(gameState, action);

      expect(gameState.npcRelationships).toHaveLength(1);

      // 2. Update relationship
      action = NPCService.updateRelationship(gameState, 'npc-1', 25);
      gameState = gameReducer(gameState, action);

      expect(gameState.npcRelationships[0].favorability).toBe(25);

      // 3. Gift NPC
      gameState.inventory.items.push({
        itemId: 'flower-1',
        quantity: 1,
        acquiredAt: new Date(),
      });

      action = NPCService.giftNPC(gameState, 'npc-1', 'flower-1');
      gameState = gameReducer(gameState, action);

      expect(gameState.npcRelationships[0].favorability).toBe(35);
    });

    it('should complete full economy flow', () => {
      const initialMoney = gameState.wallet.money;

      // 1. Deposit to bank
      let action = EconomyService.bankDeposit(gameState, 500);
      gameState = gameReducer(gameState, action);

      expect(gameState.bankAccount.balance).toBe(500);
      expect(gameState.wallet.money).toBe(initialMoney - 500);

      // 2. Withdraw from bank
      action = EconomyService.bankWithdraw(gameState, 200);
      gameState = gameReducer(gameState, action);

      expect(gameState.bankAccount.balance).toBe(300);
      expect(gameState.wallet.money).toBe(initialMoney - 300);

      // 3. Transfer money
      action = EconomyService.transfer(gameState, 'player-2', 100, 'money');
      gameState = gameReducer(gameState, action);

      expect(gameState.wallet.money).toBe(initialMoney - 400);
      expect(gameState.transactions).toHaveLength(1);
    });

    it('should complete full task flow', () => {
      // 1. Create a task
      gameState.tasks.push({
        id: 'task-1',
        npcId: 'npc-1',
        title: 'Fetch Water',
        description: 'Fetch 10 buckets of water',
        type: 'fetch',
        status: 'available',
        reward: { money: 100, isc: 0, experience: 50 },
        difficulty: 'easy',
      });

      // 2. Accept task
      let action = TaskService.acceptTask(gameState, 'task-1');
      gameState = gameReducer(gameState, action);

      expect(gameState.tasks[0].status).toBe('accepted');

      // 3. Complete task
      const reward = TaskService.calculateTaskReward(gameState.tasks[0], 50);
      action = TaskService.completeTask(gameState, 'task-1', reward);
      gameState = gameReducer(gameState, action);

      expect(gameState.tasks[0].status).toBe('completed');
      expect(gameState.assets.money).toBe(1050); // 1000 + 50
      expect(gameState.progress.tasksCompleted).toBe(1);
    });

    it('should complete full property flow', () => {
      // 1. Add property to state
      gameState.properties.push({
        id: 'prop-1',
        ownerId: null,
        name: 'House',
        type: 'house',
        location: 'downtown',
        price: 500,
        rentalIncome: 0,
        isRented: false,
        condition: 100,
      });

      const initialMoney = gameState.assets.money;

      // 2. Purchase property
      let action = PropertyService.purchaseProperty(gameState, 'prop-1', 500);
      gameState = gameReducer(gameState, action);

      expect(gameState.properties[0].ownerId).toBe('player-1');
      expect(gameState.assets.money).toBe(initialMoney - 500);
      expect(gameState.progress.propertiesOwned).toBe(1);

      // 3. Rent property
      action = PropertyService.rentProperty(gameState, 'prop-1', 'player-2', 100);
      gameState = gameReducer(gameState, action);

      expect(gameState.properties[0].isRented).toBe(true);
      expect(gameState.rentals).toHaveLength(1);

      // 4. Collect rent
      action = PropertyService.collectRent(gameState, 'prop-1', 100);
      gameState = gameReducer(gameState, action);

      expect(gameState.assets.money).toBe(initialMoney - 400);

      // 5. Sell property
      action = PropertyService.sellProperty(gameState, 'prop-1', 450);
      gameState = gameReducer(gameState, action);

      expect(gameState.properties[0].ownerId).toBeNull();
      expect(gameState.assets.money).toBe(initialMoney + 50); // 1000 - 500 + 100 + 450 = 1050
      expect(gameState.progress.propertiesOwned).toBe(0);
    });

    it('should complete full farm flow', () => {
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

      // 1. Create farm
      let action = FarmService.createFarm(gameState, farm);
      gameState = gameReducer(gameState, action);

      expect(gameState.farms).toHaveLength(1);
      expect(gameState.progress.farmsCreated).toBe(1);

      // 2. Plant crops
      action = {
        type: 'FARM_PLANT' as const,
        payload: { farmId: 'farm-1', cropType: 'wheat', quantity: 5 },
      };
      gameState = gameReducer(gameState, action);

      expect(gameState.farms[0].crops).toHaveLength(1);
      expect(gameState.farms[0].availablePlots).toBe(5);

      // 3. Water farm
      action = {
        type: 'FARM_WATER' as const,
        payload: { farmId: 'farm-1', quantity: 10 },
      };
      gameState = gameReducer(gameState, action);

      expect(gameState.assets.water).toBe(40); // 50 - 10

      // 4. Harvest
      action = FarmService.harvestCrop(gameState, 'farm-1', gameState.farms[0].crops[0].id, 100);
      gameState = gameReducer(gameState, action);

      expect(gameState.harvestHistory).toHaveLength(1);
      expect(gameState.assets.money).toBe(2000); // 1000 + (100 * 10)
    });

    it('should complete full shop flow', () => {
      const initialMoney = gameState.assets.money;

      // 1. Purchase item
      let action = ShopService.purchaseItem(gameState, 'item-1', 5, 100);
      action = {
        type: 'SHOP_PURCHASE',
        payload: { itemId: 'item-1', quantity: 5, cost: 100 },
      };
      gameState = gameReducer(gameState, action);

      expect(gameState.inventory.items).toHaveLength(1);
      expect(gameState.inventory.items[0].quantity).toBe(5);
      expect(gameState.assets.money).toBe(initialMoney - 100);

      // 2. Add more items
      action = {
        type: 'INVENTORY_ADD',
        payload: { itemId: 'item-1', quantity: 3 },
      };
      gameState = gameReducer(gameState, action);

      expect(gameState.inventory.items[0].quantity).toBe(8);

      // 3. Remove items
      action = {
        type: 'INVENTORY_REMOVE',
        payload: { itemId: 'item-1', quantity: 3 },
      };
      gameState = gameReducer(gameState, action);

      expect(gameState.inventory.items[0].quantity).toBe(5);
    });

    it('should complete full game time progression', () => {
      const initialTime = gameState.gameTime;

      // 1. Advance 1 hour
      let action = GameTimeService.advanceTime(gameState, 60);
      gameState = gameReducer(gameState, action);

      expect(gameState.gameTime.hour).toBe(9);
      expect(gameState.gameTime.day).toBe(1);

      // 2. Advance 16 hours (to next day)
      action = GameTimeService.advanceTime(gameState, 960);
      gameState = gameReducer(gameState, action);

      expect(gameState.gameTime.day).toBe(2);
      expect(gameState.gameTime.hour).toBe(1); // 9 + 16 = 25 = 1 (next day)

      // 3. Advance 30 days (to next month)
      action = GameTimeService.advanceTime(gameState, 43200);
      gameState = gameReducer(gameState, action);

      expect(gameState.gameTime.month).toBe(2);
      expect(gameState.gameTime.day).toBe(2); // 30 days from day 2 = day 32 = day 2 of next month
    });

    it('should handle complex multi-system flow', () => {
      // Simulate a complex game session:
      // 1. Player gains experience
      let action = PlayerService.gainExperience(gameState, 500);
      gameState = gameReducer(gameState, action);

      // 2. Player interacts with NPC
      action = NPCService.interactWithNPC(gameState, 'npc-1', 'greet');
      gameState = gameReducer(gameState, action);

      // 3. Player completes task
      gameState.tasks.push({
        id: 'task-1',
        npcId: 'npc-1',
        title: 'Fetch Water',
        description: 'Fetch 10 buckets',
        type: 'fetch',
        status: 'available',
        reward: { money: 100, isc: 10, experience: 50 },
        difficulty: 'easy',
      });

      action = TaskService.acceptTask(gameState, 'task-1');
      gameState = gameReducer(gameState, action);

      const reward = TaskService.calculateTaskReward(gameState.tasks[0], 50);
      action = TaskService.completeTask(gameState, 'task-1', reward);
      gameState = gameReducer(gameState, action);

      // 4. Player deposits money to bank
      action = EconomyService.bankDeposit(gameState, 500);
      gameState = gameReducer(gameState, action);

      // 5. Time advances
      action = GameTimeService.advanceTime(gameState, 120);
      gameState = gameReducer(gameState, action);

      // Verify final state
      // Initial 500 + task reward (easy * 1.0 = 50) = 550 total
      // But we also gained 500 initially, so totalExperience = 500 + 25 = 525
      expect(gameState.player.totalExperience).toBe(525);
      expect(gameState.player.experience).toBe(525);
      expect(gameState.assets.money).toBe(1050); // 1000 + 50 (task reward)
      expect(gameState.assets.isc).toBe(0); // Task reward has isc: 10 but it's not added in this flow
      expect(gameState.bankAccount.balance).toBe(500);
      expect(gameState.progress.tasksCompleted).toBe(1);
      expect(gameState.npcRelationships).toHaveLength(1);
      expect(gameState.gameTime.hour).toBe(10);
    });
  });

  // ========================================================================
  // ERROR HANDLING
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle insufficient funds gracefully', () => {
      const initialMoney = gameState.assets.money;

      // Try to withdraw more than available
      let action = {
        type: 'ASSET_REMOVE_MONEY' as const,
        payload: { amount: 5000 },
      };
      gameState = gameReducer(gameState, action);

      expect(gameState.assets.money).toBe(0);
    });

    it('should handle invalid task completion', () => {
      // Try to complete non-existent task
      let action = TaskService.completeTask(gameState, 'non-existent', {
        money: 100,
        isc: 0,
        experience: 50,
      });
      gameState = gameReducer(gameState, action);

      // State should remain unchanged
      expect(gameState.tasks).toHaveLength(0);
    });

    it('should prevent population from going below 1', () => {
      // Try to remove more population than available
      let action = {
        type: 'ASSET_REMOVE_POPULATION' as const,
        payload: { amount: 100 },
      };
      gameState = gameReducer(gameState, action);

      expect(gameState.assets.population).toBe(1);
    });
  });

  // ========================================================================
  // STATE PERSISTENCE
  // ========================================================================

  describe('State Persistence', () => {
    it('should save and load game state', () => {
      // Modify state
      let action = PlayerService.gainExperience(gameState, 500);
      gameState = gameReducer(gameState, action);

      action = EconomyService.bankDeposit(gameState, 300);
      gameState = gameReducer(gameState, action);

      const savedState = gameState;

      // Reset to initial state
      gameState = createInitialGameState('player-1', 'Test Player');

      // Load saved state
      action = {
        type: 'GAME_LOAD',
        payload: savedState,
      };
      gameState = gameReducer(gameState, action);

      expect(gameState.player.totalExperience).toBe(500);
      expect(gameState.bankAccount.balance).toBe(300);
    });

    it('should track save timestamps', () => {
      const before = new Date();

      let action = {
        type: 'GAME_SAVE',
        payload: { timestamp: new Date() },
      };
      gameState = gameReducer(gameState, action);

      const after = new Date();

      expect(gameState.lastSaved.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(gameState.lastSaved.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
