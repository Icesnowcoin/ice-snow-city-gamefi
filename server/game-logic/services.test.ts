/**
 * Game Services Tests - Unit tests for business logic layer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialGameState } from './reducer';
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
import type { GameState, Task } from './types';

describe('Game Services', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createInitialGameState('player-1', 'Test Player');
  });

  // ========================================================================
  // PLAYER SERVICE
  // ========================================================================

  describe('PlayerService', () => {
    it('should create gain experience action', () => {
      const action = PlayerService.gainExperience(gameState, 500);

      expect(action.type).toBe('PLAYER_GAIN_EXPERIENCE');
      expect(action.payload.amount).toBe(500);
    });

    it('should get player stats', () => {
      const stats = PlayerService.getPlayerStats(gameState);

      expect(stats.level).toBe(1);
      expect(stats.experience).toBe(0);
      expect(stats.tasksCompleted).toBe(0);
    });
  });

  // ========================================================================
  // NPC SERVICE
  // ========================================================================

  describe('NPCService', () => {
    it('should create interact action', () => {
      const action = NPCService.interactWithNPC(gameState, 'npc-1', 'greet');

      expect(action.type).toBe('NPC_INTERACT');
      expect(action.payload.npcId).toBe('npc-1');
    });

    it('should create update relationship action', () => {
      const action = NPCService.updateRelationship(gameState, 'npc-1', 25);

      expect(action.type).toBe('NPC_UPDATE_RELATIONSHIP');
      expect(action.payload.favorabilityChange).toBe(25);
    });

    it('should create gift action', () => {
      const action = NPCService.giftNPC(gameState, 'npc-1', 'item-1');

      expect(action.type).toBe('NPC_GIFT');
    });

    it('should create date action', () => {
      const action = NPCService.dateNPC(gameState, 'npc-1', 'park');

      expect(action.type).toBe('NPC_DATE');
    });

    it('should get NPC relationship', () => {
      gameState.npcRelationships.push({
        npcId: 'npc-1',
        favorability: 50,
        relationship: 'friend',
        lastInteraction: new Date(),
        interactionCount: 5,
        likes: ['flowers'],
        dislikes: ['insects'],
      });

      const relationship = NPCService.getNPCRelationship(gameState, 'npc-1');

      expect(relationship?.favorability).toBe(50);
      expect(relationship?.relationship).toBe('friend');
    });

    it('should calculate favorability bonus', () => {
      gameState.npcRelationships.push({
        npcId: 'npc-1',
        favorability: 50,
        relationship: 'friend',
        lastInteraction: new Date(),
        interactionCount: 5,
        likes: [],
        dislikes: [],
      });

      const bonus = NPCService.calculateFavorabilityBonus(gameState, 'npc-1');

      expect(bonus).toBe(1.0); // friend level
    });
  });

  // ========================================================================
  // ECONOMY SERVICE
  // ========================================================================

  describe('EconomyService', () => {
    it('should create deposit action', () => {
      const action = EconomyService.deposit(gameState, 500, 'money');

      expect(action.type).toBe('WALLET_DEPOSIT');
      expect(action.payload.amount).toBe(500);
    });

    it('should create withdraw action', () => {
      const action = EconomyService.withdraw(gameState, 500, 'money');

      expect(action.type).toBe('WALLET_WITHDRAW');
    });

    it('should create bank deposit action', () => {
      const action = EconomyService.bankDeposit(gameState, 500);

      expect(action.type).toBe('BANK_DEPOSIT');
    });

    it('should get wallet balance', () => {
      const balance = EconomyService.getWalletBalance(gameState);

      expect(balance.money).toBe(1000);
      expect(balance.isc).toBe(0);
      expect(balance.bankBalance).toBe(0);
      expect(balance.totalAssets).toBe(1000);
    });

    it('should get transaction history', () => {
      gameState.transactions.push({
        id: 'tx-1',
        playerId: 'player-1',
        type: 'deposit',
        amount: 500,
        currency: 'money',
        description: 'Test deposit',
        timestamp: new Date(),
        status: 'completed',
      });

      const history = EconomyService.getTransactionHistory(gameState);

      expect(history).toHaveLength(1);
      expect(history[0].amount).toBe(500);
    });

    it('should claim interest successfully', () => {
      gameState.bankAccount.balance = 1000;
      gameState.bankAccount.lastInterestPaid = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      const result = EconomyService.claimInterest(gameState);

      expect(result.success).toBe(true);
      expect(result.data).toBeGreaterThan(0);
    });

    it('should not claim interest if already claimed today', () => {
      gameState.bankAccount.balance = 1000;
      gameState.bankAccount.lastInterestPaid = new Date(); // Just now

      const result = EconomyService.claimInterest(gameState);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========================================================================
  // TASK SERVICE
  // ========================================================================

  describe('TaskService', () => {
    it('should create accept task action', () => {
      const action = TaskService.acceptTask(gameState, 'task-1');

      expect(action.type).toBe('TASK_ACCEPT');
    });

    it('should create complete task action', () => {
      const reward = { money: 100, isc: 0, experience: 50 };
      const action = TaskService.completeTask(gameState, 'task-1', reward);

      expect(action.type).toBe('TASK_COMPLETE');
    });

    it('should get active tasks', () => {
      const task: Task = {
        id: 'task-1',
        npcId: 'npc-1',
        title: 'Fetch Water',
        description: 'Fetch 10 buckets',
        type: 'fetch',
        status: 'accepted',
        reward: { money: 100, isc: 0, experience: 50 },
        difficulty: 'easy',
      };

      gameState.tasks.push(task);

      const activeTasks = TaskService.getActiveTasks(gameState);

      expect(activeTasks).toHaveLength(1);
    });

    it('should calculate task reward based on difficulty', () => {
      const task: Task = {
        id: 'task-1',
        npcId: 'npc-1',
        title: 'Defeat Boss',
        description: 'Defeat the boss',
        type: 'combat',
        status: 'available',
        reward: { money: 100, isc: 0, experience: 50 },
        difficulty: 'hard',
      };

      const reward = TaskService.calculateTaskReward(task, 50);

      expect(reward.money).toBe(150); // 100 * 1.5
      expect(reward.experience).toBe(75); // 50 * 1.5
    });
  });

  // ========================================================================
  // PROPERTY SERVICE
  // ========================================================================

  describe('PropertyService', () => {
    it('should create purchase property action', () => {
      const action = PropertyService.purchaseProperty(gameState, 'prop-1', 500);

      expect(action.type).toBe('PROPERTY_PURCHASE');
    });

    it('should get player properties', () => {
      gameState.properties.push({
        id: 'prop-1',
        ownerId: 'player-1',
        name: 'House',
        type: 'house',
        location: 'downtown',
        price: 500,
        rentalIncome: 50,
        isRented: false,
        condition: 100,
      });

      const properties = PropertyService.getPlayerProperties(gameState);

      expect(properties).toHaveLength(1);
    });

    it('should calculate monthly rental income', () => {
      gameState.properties.push({
        id: 'prop-1',
        ownerId: 'player-1',
        name: 'House',
        type: 'house',
        location: 'downtown',
        price: 500,
        rentalIncome: 50,
        isRented: true,
        condition: 100,
      });

      gameState.properties.push({
        id: 'prop-2',
        ownerId: 'player-1',
        name: 'Apartment',
        type: 'apartment',
        location: 'uptown',
        price: 300,
        rentalIncome: 30,
        isRented: true,
        condition: 100,
      });

      const income = PropertyService.getMonthlyRentalIncome(gameState);

      expect(income).toBe(80);
    });

    it('should calculate property value based on condition', () => {
      const property = {
        id: 'prop-1',
        ownerId: 'player-1',
        name: 'House',
        type: 'house' as const,
        location: 'downtown',
        price: 1000,
        rentalIncome: 0,
        isRented: false,
        condition: 50, // 50% condition
      };

      const value = PropertyService.calculatePropertyValue(property);

      expect(value).toBe(500); // 1000 * 0.5
    });
  });

  // ========================================================================
  // FARM SERVICE
  // ========================================================================

  describe('FarmService', () => {
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

      const action = FarmService.createFarm(gameState, farm);

      expect(action.type).toBe('FARM_CREATE');
    });

    it('should get player farms', () => {
      gameState.farms.push({
        id: 'farm-1',
        ownerId: 'player-1',
        name: 'Test Farm',
        location: 'countryside',
        size: 10,
        totalPlots: 10,
        availablePlots: 10,
        crops: [],
        createdAt: new Date(),
      });

      const farms = FarmService.getPlayerFarms(gameState);

      expect(farms).toHaveLength(1);
    });

    it('should calculate total farm production', () => {
      gameState.harvestHistory.push({
        cropId: 'crop-1',
        quantity: 100,
        quality: 100,
        profit: 1000,
        timestamp: new Date(),
      });

      gameState.harvestHistory.push({
        cropId: 'crop-2',
        quantity: 80,
        quality: 90,
        profit: 800,
        timestamp: new Date(),
      });

      const production = FarmService.getTotalFarmProduction(gameState);

      expect(production).toBe(1800);
    });

    it('should calculate crop yield', () => {
      const crop = {
        id: 'crop-1',
        farmId: 'farm-1',
        type: 'wheat',
        plantedAt: new Date(),
        harvestDate: new Date(),
        status: 'growing' as const,
        yield: 0,
        quality: 75, // 75% quality
      };

      const yield_ = FarmService.calculateCropYield(crop);

      expect(yield_).toBe(75); // 100 * 0.75
    });
  });

  // ========================================================================
  // SHOP SERVICE
  // ========================================================================

  describe('ShopService', () => {
    it('should get inventory space', () => {
      gameState.inventory.items.push({
        itemId: 'item-1',
        quantity: 5,
        acquiredAt: new Date(),
      });

      const space = ShopService.getInventorySpace(gameState);

      expect(space).toBe(15); // 20 - 5
    });

    it('should check if inventory is full', () => {
      gameState.inventory.items.push({
        itemId: 'item-1',
        quantity: 20,
        acquiredAt: new Date(),
      });

      const isFull = ShopService.isInventoryFull(gameState);

      expect(isFull).toBe(true);
    });

    it('should validate purchase - insufficient funds', () => {
      const result = ShopService.canPurchaseItem(gameState, 'item-1', 1, 2000);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });

    it('should validate purchase - inventory full', () => {
      gameState.inventory.items.push({
        itemId: 'item-1',
        quantity: 20,
        acquiredAt: new Date(),
      });

      const result = ShopService.canPurchaseItem(gameState, 'item-2', 5, 100);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Inventory is full');
    });

    it('should validate purchase - success', () => {
      const result = ShopService.canPurchaseItem(gameState, 'item-1', 5, 100);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  // ========================================================================
  // GAME TIME SERVICE
  // ========================================================================

  describe('GameTimeService', () => {
    it('should advance time', () => {
      const action = GameTimeService.advanceTime(gameState, 60);

      expect(action.type).toBe('GAME_TIME_ADVANCE');
      expect(action.payload.minutes).toBe(60);
    });

    it('should get game time string', () => {
      const timeString = GameTimeService.getGameTimeString(gameState);

      expect(timeString).toContain('Year 1');
      expect(timeString).toContain('Spring');
      expect(timeString).toContain('08:00');
    });

    it('should detect daytime', () => {
      const isDaytime = GameTimeService.isDaytime(gameState);

      expect(isDaytime).toBe(true);
    });

    it('should detect nighttime', () => {
      gameState.gameTime.hour = 22;

      const isNight = GameTimeService.isNight(gameState);

      expect(isNight).toBe(true);
    });

    it('should get time of day - morning', () => {
      gameState.gameTime.hour = 8;

      const timeOfDay = GameTimeService.getTimeOfDay(gameState);

      expect(timeOfDay).toBe('morning');
    });

    it('should get time of day - afternoon', () => {
      gameState.gameTime.hour = 15;

      const timeOfDay = GameTimeService.getTimeOfDay(gameState);

      expect(timeOfDay).toBe('afternoon');
    });

    it('should get time of day - evening', () => {
      gameState.gameTime.hour = 19;

      const timeOfDay = GameTimeService.getTimeOfDay(gameState);

      expect(timeOfDay).toBe('evening');
    });

    it('should get time of day - night', () => {
      gameState.gameTime.hour = 23;

      const timeOfDay = GameTimeService.getTimeOfDay(gameState);

      expect(timeOfDay).toBe('night');
    });
  });
});
