/**
 * Smelting System
 * Manages metal smelting and material refinement
 */

export interface SmeltingMaterial {
  iron: number;
  copper: number;
  gold: number;
  steel: number;
  bronze: number;
}

export interface SmeltingOperation {
  id: string;
  playerId: number;
  inputType: 'ore' | 'iron' | 'copper';
  outputType: 'iron' | 'copper' | 'gold' | 'steel' | 'bronze';
  inputQuantity: number;
  outputQuantity: number;
  startTime: number;
  endTime: number;
  status: 'active' | 'completed' | 'failed';
  temperature: number;
}

export interface SmeltingFurnace {
  level: number;
  temperature: number;
  maxTemperature: number;
  efficiency: number;
  maintenanceCost: number;
  lastMaintenance: number;
}

export class SmeltingSystem {
  private static readonly BASE_SMELTING_TIME = 7200; // 2 hours in seconds
  private static readonly EFFICIENCY_MULTIPLIER = 0.75;

  // Conversion ratios
  private static readonly ORE_TO_IRON = 0.8; // 1 ore → 0.8 iron
  private static readonly IRON_TO_STEEL = 0.9; // 1 iron + 0.5 copper → 0.9 steel
  private static readonly COPPER_TO_BRONZE = 0.85; // 1 copper + 0.3 iron → 0.85 bronze

  /**
   * Calculate smelting duration based on material type and furnace level
   */
  static calculateSmeltingDuration(
    outputType: 'iron' | 'copper' | 'gold' | 'steel' | 'bronze',
    furnaceLevel: number
  ): number {
    const baseTime = this.BASE_SMELTING_TIME;
    const efficiency = Math.pow(this.EFFICIENCY_MULTIPLIER, furnaceLevel - 1);
    return Math.ceil(baseTime * efficiency);
  }

  /**
   * Calculate output quantity based on input and furnace efficiency
   */
  static calculateOutput(
    inputType: 'ore' | 'iron' | 'copper',
    outputType: 'iron' | 'copper' | 'gold' | 'steel' | 'bronze',
    inputQuantity: number,
    furnaceLevel: number,
    efficiency: number
  ): number {
    let conversionRatio = 0;

    if (inputType === 'ore' && outputType === 'iron') {
      conversionRatio = this.ORE_TO_IRON;
    } else if (inputType === 'iron' && outputType === 'steel') {
      conversionRatio = this.IRON_TO_STEEL;
    } else if (inputType === 'copper' && outputType === 'bronze') {
      conversionRatio = this.COPPER_TO_BRONZE;
    } else {
      conversionRatio = 0.5; // Default low conversion for other combinations
    }

    const levelBonus = 1 + (furnaceLevel - 1) * 0.1; // 10% per level
    const output = Math.floor(inputQuantity * conversionRatio * levelBonus * efficiency);
    return Math.max(1, output);
  }

  /**
   * Start a smelting operation
   */
  static startSmelting(
    playerId: number,
    inputType: 'ore' | 'iron' | 'copper',
    outputType: 'iron' | 'copper' | 'gold' | 'steel' | 'bronze',
    inputQuantity: number,
    furnaceLevel: number,
    efficiency: number = 1.0
  ): SmeltingOperation {
    const duration = this.calculateSmeltingDuration(outputType, furnaceLevel);
    const outputQuantity = this.calculateOutput(
      inputType,
      outputType,
      inputQuantity,
      furnaceLevel,
      efficiency
    );
    const now = Date.now();

    return {
      id: `smelting_${playerId}_${Date.now()}`,
      playerId,
      inputType,
      outputType,
      inputQuantity,
      outputQuantity,
      startTime: now,
      endTime: now + duration * 1000,
      status: 'active',
      temperature: 1000 + furnaceLevel * 100,
    };
  }

  /**
   * Complete a smelting operation
   */
  static completeSmelting(operation: SmeltingOperation): SmeltingMaterial {
    if (operation.status !== 'active') {
      return { iron: 0, copper: 0, gold: 0, steel: 0, bronze: 0 };
    }

    const result: SmeltingMaterial = {
      iron: operation.outputType === 'iron' ? operation.outputQuantity : 0,
      copper: operation.outputType === 'copper' ? operation.outputQuantity : 0,
      gold: operation.outputType === 'gold' ? operation.outputQuantity : 0,
      steel: operation.outputType === 'steel' ? operation.outputQuantity : 0,
      bronze: operation.outputType === 'bronze' ? operation.outputQuantity : 0,
    };

    return result;
  }

  /**
   * Upgrade smelting furnace
   */
  static upgradeFurnace(
    currentLevel: number,
    currentMaterials: SmeltingMaterial
  ): { success: boolean; newLevel: number; cost: SmeltingMaterial } {
    const upgradeCost: SmeltingMaterial = {
      iron: 50 * currentLevel,
      copper: 30 * currentLevel,
      gold: 10 * currentLevel,
      steel: 20 * currentLevel,
      bronze: 15 * currentLevel,
    };

    const canUpgrade =
      currentMaterials.iron >= upgradeCost.iron &&
      currentMaterials.copper >= upgradeCost.copper &&
      currentMaterials.gold >= upgradeCost.gold &&
      currentMaterials.steel >= upgradeCost.steel &&
      currentMaterials.bronze >= upgradeCost.bronze;

    return {
      success: canUpgrade,
      newLevel: canUpgrade ? currentLevel + 1 : currentLevel,
      cost: upgradeCost,
    };
  }

  /**
   * Calculate maintenance cost
   */
  static calculateMaintenanceCost(furnaceLevel: number): number {
    return 150 * furnaceLevel;
  }

  /**
   * Perform maintenance on furnace
   */
  static performMaintenance(
    furnace: SmeltingFurnace,
    currentBalance: number
  ): { success: boolean; newEfficiency: number; cost: number } {
    const cost = this.calculateMaintenanceCost(furnace.level);
    const canMaintain = currentBalance >= cost;

    return {
      success: canMaintain,
      newEfficiency: canMaintain ? Math.min(1.0, furnace.efficiency + 0.15) : furnace.efficiency,
      cost,
    };
  }

  /**
   * Get smelting statistics
   */
  static getSmeltingStats(operations: SmeltingOperation[]): {
    totalSmelted: SmeltingMaterial;
    activeOperations: number;
    completedOperations: number;
    totalDuration: number;
  } {
    const stats = {
      totalSmelted: { iron: 0, copper: 0, gold: 0, steel: 0, bronze: 0 },
      activeOperations: 0,
      completedOperations: 0,
      totalDuration: 0,
    };

    for (const op of operations) {
      if (op.status === 'active') {
        stats.activeOperations++;
      } else if (op.status === 'completed') {
        stats.completedOperations++;
        if (op.outputType === 'iron') stats.totalSmelted.iron += op.outputQuantity;
        if (op.outputType === 'copper') stats.totalSmelted.copper += op.outputQuantity;
        if (op.outputType === 'gold') stats.totalSmelted.gold += op.outputQuantity;
        if (op.outputType === 'steel') stats.totalSmelted.steel += op.outputQuantity;
        if (op.outputType === 'bronze') stats.totalSmelted.bronze += op.outputQuantity;
      }
      stats.totalDuration += op.endTime - op.startTime;
    }

    return stats;
  }
}
