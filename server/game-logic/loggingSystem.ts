/**
 * Logging System
 * Manages logging operations for wood extraction
 */

export interface LoggingResource {
  wood: number;
  timber: number;
  logs: number;
}

export interface LoggingOperation {
  id: string;
  playerId: number;
  resourceType: 'wood' | 'timber' | 'logs';
  quantity: number;
  startTime: number;
  endTime: number;
  status: 'active' | 'completed' | 'failed';
  efficiency: number;
}

export interface LoggingFacility {
  level: number;
  efficiency: number;
  capacity: number;
  maintenanceCost: number;
  lastMaintenance: number;
}

export class LoggingSystem {
  private static readonly BASE_LOGGING_TIME = 3600; // 1 hour in seconds
  private static readonly EFFICIENCY_MULTIPLIER = 0.8;
  private static readonly WOOD_YIELD = 12;
  private static readonly TIMBER_YIELD = 10;
  private static readonly LOGS_YIELD = 8;

  /**
   * Calculate logging duration based on resource type and facility level
   */
  static calculateLoggingDuration(
    resourceType: 'wood' | 'timber' | 'logs',
    facilityLevel: number
  ): number {
    const baseTime = this.BASE_LOGGING_TIME;
    const efficiency = Math.pow(this.EFFICIENCY_MULTIPLIER, facilityLevel - 1);
    return Math.ceil(baseTime * efficiency);
  }

  /**
   * Calculate resource yield based on facility level
   */
  static calculateYield(
    resourceType: 'wood' | 'timber' | 'logs',
    facilityLevel: number,
    efficiency: number
  ): number {
    let baseYield = 0;
    switch (resourceType) {
      case 'wood':
        baseYield = this.WOOD_YIELD;
        break;
      case 'timber':
        baseYield = this.TIMBER_YIELD;
        break;
      case 'logs':
        baseYield = this.LOGS_YIELD;
        break;
    }

    const levelBonus = 1 + (facilityLevel - 1) * 0.15;
    const finalYield = Math.floor(baseYield * levelBonus * efficiency);
    return Math.max(1, finalYield);
  }

  /**
   * Start a logging operation
   */
  static startLogging(
    playerId: number,
    resourceType: 'wood' | 'timber' | 'logs',
    facilityLevel: number,
    efficiency: number = 1.0
  ): LoggingOperation {
    const duration = this.calculateLoggingDuration(resourceType, facilityLevel);
    const now = Date.now();

    return {
      id: `logging_${playerId}_${Date.now()}`,
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
   * Complete a logging operation
   */
  static completeLogging(operation: LoggingOperation): LoggingResource {
    if (operation.status !== 'active') {
      return { wood: 0, timber: 0, logs: 0 };
    }

    const result: LoggingResource = {
      wood: operation.resourceType === 'wood' ? operation.quantity : 0,
      timber: operation.resourceType === 'timber' ? operation.quantity : 0,
      logs: operation.resourceType === 'logs' ? operation.quantity : 0,
    };

    return result;
  }

  /**
   * Upgrade logging facility
   */
  static upgradeFacility(
    currentLevel: number,
    currentResources: LoggingResource
  ): { success: boolean; newLevel: number; cost: LoggingResource } {
    const upgradeCost: LoggingResource = {
      wood: 80 * currentLevel,
      timber: 100 * currentLevel,
      logs: 20 * currentLevel,
    };

    const canUpgrade =
      currentResources.wood >= upgradeCost.wood &&
      currentResources.timber >= upgradeCost.timber &&
      currentResources.logs >= upgradeCost.logs;

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
    return 120 * facilityLevel;
  }

  /**
   * Perform maintenance on facility
   */
  static performMaintenance(
    facility: LoggingFacility,
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
   * Get logging statistics
   */
  static getLoggingStats(operations: LoggingOperation[]): {
    totalLogged: LoggingResource;
    activeOperations: number;
    completedOperations: number;
    totalDuration: number;
  } {
    const stats = {
      totalLogged: { wood: 0, timber: 0, logs: 0 },
      activeOperations: 0,
      completedOperations: 0,
      totalDuration: 0,
    };

    for (const op of operations) {
      if (op.status === 'active') {
        stats.activeOperations++;
      } else if (op.status === 'completed') {
        stats.completedOperations++;
        if (op.resourceType === 'wood') stats.totalLogged.wood += op.quantity;
        if (op.resourceType === 'timber') stats.totalLogged.timber += op.quantity;
        if (op.resourceType === 'logs') stats.totalLogged.logs += op.quantity;
      }
      stats.totalDuration += op.endTime - op.startTime;
    }

    return stats;
  }
}
