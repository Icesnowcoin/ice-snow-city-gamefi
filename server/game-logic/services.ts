/**
 * Game Services - Business logic layer for all game systems
 * Implements service pattern for clean separation of concerns
 */

import type {
  GameState,
  GameAction,
  ServiceResult,
  NPCInteraction,
  Task,
  TaskReward,
  Property,
  Farm,
  Crop,
  HarvestResult,
} from './types';

/**
 * PlayerService - Handles player profile, progression, and experience
 */
export class PlayerService {
  static gainExperience(state: GameState, amount: number): GameAction {
    return {
      type: 'PLAYER_GAIN_EXPERIENCE',
      payload: { amount },
    };
  }

  static levelUp(state: GameState, newLevel: number): GameAction {
    return {
      type: 'PLAYER_LEVEL_UP',
      payload: { newLevel },
    };
  }

  static updateProfile(state: GameState, updates: Partial<typeof state.player>): GameAction {
    return {
      type: 'PLAYER_UPDATE_PROFILE',
      payload: updates,
    };
  }

  static getPlayerStats(state: GameState) {
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
}

/**
 * NPCService - Handles NPC interactions, relationships, and favorability
 */
export class NPCService {
  static interactWithNPC(state: GameState, npcId: string, type: NPCInteraction['type']): GameAction {
    return {
      type: 'NPC_INTERACT',
      payload: { npcId, type },
    };
  }

  static updateRelationship(state: GameState, npcId: string, favorabilityChange: number): GameAction {
    return {
      type: 'NPC_UPDATE_RELATIONSHIP',
      payload: { npcId, favorabilityChange },
    };
  }

  static giftNPC(state: GameState, npcId: string, itemId: string): GameAction {
    return {
      type: 'NPC_GIFT',
      payload: { npcId, itemId },
    };
  }

  static dateNPC(state: GameState, npcId: string, location: string): GameAction {
    return {
      type: 'NPC_DATE',
      payload: { npcId, location },
    };
  }

  static getNPCRelationship(state: GameState, npcId: string) {
    return state.npcRelationships.find((r) => r.npcId === npcId);
  }

  static getNPCInteractionHistory(state: GameState, npcId: string) {
    return state.npcInteractionHistory.filter((i) => i.type === 'greet' || i.type === 'talk');
  }

  static calculateFavorabilityBonus(state: GameState, npcId: string): number {
    const relationship = this.getNPCRelationship(state, npcId);
    if (!relationship) return 0;

    // Bonus multiplier based on relationship level
    const bonusMap: Record<string, number> = {
      stranger: 0.5,
      acquaintance: 0.75,
      friend: 1.0,
      close_friend: 1.25,
      lover: 1.5,
    };

    return bonusMap[relationship.relationship] || 0.5;
  }
}

/**
 * EconomyService - Handles wallet, transactions, and banking
 */
export class EconomyService {
  static deposit(state: GameState, amount: number, currency: 'money' | 'isc'): GameAction {
    return {
      type: 'WALLET_DEPOSIT',
      payload: { amount, currency },
    };
  }

  static withdraw(state: GameState, amount: number, currency: 'money' | 'isc'): GameAction {
    return {
      type: 'WALLET_WITHDRAW',
      payload: { amount, currency },
    };
  }

  static transfer(
    state: GameState,
    toPlayerId: string,
    amount: number,
    currency: 'money' | 'isc'
  ): GameAction {
    return {
      type: 'WALLET_TRANSFER',
      payload: { toPlayerId, amount, currency },
    };
  }

  static bankDeposit(state: GameState, amount: number): GameAction {
    return {
      type: 'BANK_DEPOSIT',
      payload: { amount },
    };
  }

  static bankWithdraw(state: GameState, amount: number): GameAction {
    return {
      type: 'BANK_WITHDRAW',
      payload: { amount },
    };
  }

  static claimInterest(state: GameState): ServiceResult<number> {
    const bankAccount = state.bankAccount;
    const daysSinceLastInterest = Math.floor(
      (new Date().getTime() - bankAccount.lastInterestPaid.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastInterest < 1) {
      return {
        success: false,
        error: 'Interest can only be claimed once per day',
      };
    }

    const dailyInterestRate = bankAccount.interestRate / 365 / 100;
    const interestAmount = Math.max(1, Math.floor(bankAccount.balance * dailyInterestRate));

    return {
      success: true,
      data: interestAmount,
    };
  }

  static getWalletBalance(state: GameState) {
    return {
      money: state.wallet.money,
      isc: state.wallet.isc,
      bankBalance: state.bankAccount.balance,
      totalAssets: state.wallet.money + state.wallet.isc + state.bankAccount.balance,
    };
  }

  static getTransactionHistory(state: GameState, limit = 10) {
    return state.transactions.slice(-limit).reverse();
  }
}

/**
 * TaskService - Handles task management and rewards
 */
export class TaskService {
  static acceptTask(state: GameState, taskId: string): GameAction {
    return {
      type: 'TASK_ACCEPT',
      payload: { taskId },
    };
  }

  static completeTask(state: GameState, taskId: string, reward: TaskReward): GameAction {
    return {
      type: 'TASK_COMPLETE',
      payload: { taskId, reward },
    };
  }

  static failTask(state: GameState, taskId: string): GameAction {
    return {
      type: 'TASK_FAIL',
      payload: { taskId },
    };
  }

  static abandonTask(state: GameState, taskId: string): GameAction {
    return {
      type: 'TASK_ABANDON',
      payload: { taskId },
    };
  }

  static getActiveTasks(state: GameState) {
    return state.tasks.filter((t) => t.status === 'accepted' || t.status === 'in_progress');
  }

  static getAvailableTasks(state: GameState) {
    return state.tasks.filter((t) => t.status === 'available');
  }

  static getCompletedTasks(state: GameState) {
    return state.tasks.filter((t) => t.status === 'completed');
  }

  static calculateTaskReward(task: Task, npcFavorability: number): TaskReward {
    const baseReward = {
      money: 100,
      isc: 0,
      experience: 50,
      items: [],
      favorability: 10,
    };

    // Adjust reward based on difficulty
    const difficultyMultiplier: Record<string, number> = {
      easy: 0.5,
      normal: 1.0,
      hard: 1.5,
      legendary: 2.0,
    };

    const multiplier = difficultyMultiplier[task.difficulty] || 1.0;

    return {
      money: Math.floor(baseReward.money * multiplier),
      isc: Math.floor(baseReward.isc * multiplier),
      experience: Math.floor(baseReward.experience * multiplier),
      items: baseReward.items,
      favorability: Math.floor(baseReward.favorability * multiplier),
    };
  }
}

/**
 * PropertyService - Handles real estate and rentals
 */
export class PropertyService {
  static purchaseProperty(state: GameState, propertyId: string, price: number): GameAction {
    return {
      type: 'PROPERTY_PURCHASE',
      payload: { propertyId, price },
    };
  }

  static sellProperty(state: GameState, propertyId: string, price: number): GameAction {
    return {
      type: 'PROPERTY_SELL',
      payload: { propertyId, price },
    };
  }

  static rentProperty(state: GameState, propertyId: string, renterId: string, monthlyRent: number): GameAction {
    return {
      type: 'PROPERTY_RENT',
      payload: { propertyId, renterId, monthlyRent },
    };
  }

  static collectRent(state: GameState, propertyId: string, amount: number): GameAction {
    return {
      type: 'PROPERTY_COLLECT_RENT',
      payload: { propertyId, amount },
    };
  }

  static getPlayerProperties(state: GameState) {
    return state.properties.filter((p) => p.ownerId === state.player.id);
  }

  static getMonthlyRentalIncome(state: GameState): number {
    return this.getPlayerProperties(state).reduce((total, p) => total + (p.rentalIncome || 0), 0);
  }

  static calculatePropertyValue(property: Property): number {
    // Simple valuation: base price adjusted by condition
    const conditionMultiplier = property.condition / 100;
    return Math.floor(property.price * conditionMultiplier);
  }
}

/**
 * FarmService - Handles farming and crop management
 */
export class FarmService {
  static createFarm(state: GameState, farm: Farm): GameAction {
    return {
      type: 'FARM_CREATE',
      payload: farm,
    };
  }

  static harvestCrop(state: GameState, farmId: string, cropId: string, yield_: number): GameAction {
    return {
      type: 'FARM_HARVEST',
      payload: { farmId, cropId, yield: yield_ },
    };
  }

  static getPlayerFarms(state: GameState) {
    return state.farms.filter((f) => f.ownerId === state.player.id);
  }

  static getTotalFarmProduction(state: GameState): number {
    return state.harvestHistory.reduce((total, h) => total + h.profit, 0);
  }

  static calculateCropYield(crop: Crop): number {
    // Simplified yield calculation based on quality
    const baseYield = 100;
    const qualityMultiplier = crop.quality / 100;
    return Math.floor(baseYield * qualityMultiplier);
  }

  static getCropGrowthProgress(crop: Crop): number {
    const now = new Date().getTime();
    const plantedTime = crop.plantedAt.getTime();
    const harvestTime = crop.harvestDate.getTime();
    const totalTime = harvestTime - plantedTime;
    const elapsedTime = now - plantedTime;

    return Math.min(100, Math.floor((elapsedTime / totalTime) * 100));
  }
}

/**
 * ShopService - Handles shopping and inventory
 */
export class ShopService {
  static purchaseItem(state: GameState, itemId: string, quantity: number, cost: number): GameAction {
    return {
      type: 'SHOP_PURCHASE',
      payload: { itemId, quantity, cost },
    };
  }

  static addToInventory(state: GameState, itemId: string, quantity: number): GameAction {
    return {
      type: 'INVENTORY_ADD',
      payload: { itemId, quantity },
    };
  }

  static removeFromInventory(state: GameState, itemId: string, quantity: number): GameAction {
    return {
      type: 'INVENTORY_REMOVE',
      payload: { itemId, quantity },
    };
  }

  static getInventorySpace(state: GameState): number {
    const usedSpace = state.inventory.items.reduce((total, item) => total + item.quantity, 0);
    return state.inventory.capacity - usedSpace;
  }

  static isInventoryFull(state: GameState): boolean {
    return this.getInventorySpace(state) <= 0;
  }

  static canPurchaseItem(state: GameState, itemId: string, quantity: number, cost: number): ServiceResult<boolean> {
    if (this.getInventorySpace(state) < quantity) {
      return {
        success: false,
        data: false,
        error: 'Inventory is full',
      };
    }

    if (state.wallet.money < cost) {
      return {
        success: false,
        data: false,
        error: 'Insufficient funds',
      };
    }

    return {
      success: true,
      data: true,
    };
  }
}

/**
 * GameTimeService - Handles game time progression
 */
export class GameTimeService {
  static advanceTime(state: GameState, minutes: number): GameAction {
    return {
      type: 'GAME_TIME_ADVANCE',
      payload: { minutes },
    };
  }

  static getGameTimeString(state: GameState): string {
    const { day, month, year, hour, minute, season } = state.gameTime;
    const hourStr = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');
    return `Year ${year}, ${season.charAt(0).toUpperCase() + season.slice(1)} ${day} - ${hourStr}:${minuteStr}`;
  }

  static isNight(state: GameState): boolean {
    return state.gameTime.hour >= 20 || state.gameTime.hour < 6;
  }

  static isDaytime(state: GameState): boolean {
    return !this.isNight(state);
  }

  static getTimeOfDay(state: GameState): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = state.gameTime.hour;
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 20) return 'evening';
    return 'night';
  }
}
