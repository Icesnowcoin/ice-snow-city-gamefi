/**
 * Mining System
 * Manages mining operations for sand, stone, and ore extraction
 */

export interface MiningResource {
  sand: number;
  stone: number;
  ore: number;
}

export interface MiningOperation {
  id: string;
  playerId: number;
  resourceType: 'sand' | 'stone' | 'ore';
  quantity: number;
  startTime: number;
  endTime: number;
  status: 'active' | 'completed' | 'failed';
  efficiency: number; // 0-1, affects duration and yield
}

export interface MiningFacility {
  level: number;
  efficiency: number;
  capacity: number;
  maintenanceCost: number;
  lastMaintenance: number;
}

export class MiningSystem {
  private static readonly BASE_MINING_TIME = 3600; // 1 hour in seconds
  private static readonly EFFICIENCY_MULTIPLIER = 0.8; // 20% reduction per level
  private static readonly SAND_YIELD = 10;
  private static readonly STONE_YIELD = 8;
  private static readonly ORE_YIELD = 5;

  /**
   * Calculate mining duration based on resource type and facility level
   */
  static calculateMiningDuration(
    resourceType: 'sand' | 'stone' | 'ore',
    facilityLevel: number
  ): number {
    const baseTime = this.BASE_MINING_TIME;
    const efficiency = Math.pow(this.EFFICIENCY_MULTIPLIER, facilityLevel - 1);
    return Math.ceil(baseTime * efficiency);
  }

  /**
   * Calculate resource yield based on facility level
   */
  static calculateYield(
    resourceType: 'sand' | 'stone' | 'ore',
    facilityLevel: number,
    efficiency: number
  ): number {
    let baseYield = 0;
    switch (resourceType) {
      case 'sand':
        baseYield = this.SAND_YIELD;
        break;
      case 'stone':
        baseYield = this.STONE_YIELD;
        break;
      case 'ore':
        baseYield = this.ORE_YIELD;
        break;
    }

    const levelBonus = 1 + (facilityLevel - 1) * 0.15; // 15% per level
    const finalYield = Math.floor(baseYield * levelBonus * efficiency);
    return Math.max(1, finalYield);
  }

  /**
   * Start a mining operation
   */
  static startMining(
    playerId: number,
    resourceType: 'sand' | 'stone' | 'ore',
    facilityLevel: number,
    efficiency: number = 1.0
  ): MiningOperation {
    const duration = this.calculateMiningDuration(resourceType, facilityLevel);
    const now = Date.now();

    return {
      id: `mining_${playerId}_${Date.now()}`,
      playerId,
      resourceType,
      quantity: this.calculateYield(resourceType, facilityLevel, efficiency),
      startTime: now,
      endTime: now + duration * 1000,
      status: 'active',
      efficiency,
    };
  }

  /**
   * Complete a mining operation
   */
  static completeMining(operation: MiningOperation): MiningResource {
    if (operation.status !== 'active') {
      return { sand: 0, stone: 0, ore: 0 };
    }

    const result: MiningResource = {
      sand: operation.resourceType === 'sand' ? operation.quantity : 0,
      stone: operation.resourceType === 'stone' ? operation.quantity : 0,
      ore: operation.resourceType === 'ore' ? operation.quantity : 0,
    };

    return result;
  }

  /**
   * Upgrade mining facility
   */
  static upgradeFacility(
    currentLevel: number,
    currentResources: MiningResource
  ): { success: boolean; newLevel: number; cost: MiningResource } {
    const upgradeCost: MiningResource = {
      sand: 100 * currentLevel,
      stone: 80 * currentLevel,
      ore: 20 * currentLevel,
    };

    const canUpgrade =
      currentResources.sand >= upgradeCost.sand &&
      currentResources.stone >= upgradeCost.stone &&
      currentResources.ore >= upgradeCost.ore;

    return {
      success: canUpgrade,
      newLevel: canUpgrade ? currentLevel + 1 : currentLevel,
      cost: upgradeCost,
    };
  }

  /**
   * Calculate maintenance cost
   */
  static calculateMaintenanceCost(facilityLevel: number): number {
    return 100 * facilityLevel;
  }

  /**
   * Perform maintenance on facility
   */
  static performMaintenance(
    facility: MiningFacility,
    currentBalance: number
  ): { success: boolean; newEfficiency: number; cost: number } {
    const cost = this.calculateMaintenanceCost(facility.level);
    const canMaintain = currentBalance >= cost;

    return {
      success: canMaintain,
      newEfficiency: canMaintain ? Math.min(1.0, facility.efficiency + 0.1) : facility.efficiency,
      cost,
    };
  }

  /**
   * Get mining statistics
   */
  static getMiningStats(operations: MiningOperation[]): {
    totalMined: MiningResource;
    activeOperations: number;
    completedOperations: number;
    totalDuration: number;
  } {
    const stats = {
      totalMined: { sand: 0, stone: 0, ore: 0 },
      activeOperations: 0,
      completedOperations: 0,
      totalDuration: 0,
    };

    for (const op of operations) {
      if (op.status === 'active') {
        stats.activeOperations++;
      } else if (op.status === 'completed') {
        stats.completedOperations++;
        if (op.resourceType === 'sand') stats.totalMined.sand += op.quantity;
        if (op.resourceType === 'stone') stats.totalMined.stone += op.quantity;
        if (op.resourceType === 'ore') stats.totalMined.ore += op.quantity;
      }
      stats.totalDuration += op.endTime - op.startTime;
    }

    return stats;
  }
}
