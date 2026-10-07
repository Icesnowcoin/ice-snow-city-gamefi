/**
 * Commercial Facilities System
 * Manages all commercial buildings and their operations
 */

export type FacilityType =
  | "glass_factory"
  | "paint_factory"
  | "fast_food"
  | "supermarket"
  | "parking_lot"
  | "park"
  | "entertainment_center"
  | "nightclub"
  | "bar"
  | "hotel"
  | "apartment"
  | "villa";

export interface CommercialFacility {
  id: string;
  playerId: number;
  type: FacilityType;
  level: number;
  efficiency: number;
  capacity: number;
  revenue: number;
  expenses: number;
  lastOperationTime: number;
  status: "operational" | "maintenance" | "closed";
}

export interface FacilityOperation {
  id: string;
  facilityId: string;
  operationType: "production" | "service" | "rental";
  startTime: number;
  endTime: number;
  revenue: number;
  status: "active" | "completed" | "failed";
}

export interface FacilityConfig {
  name: string;
  description: string;
  baseRevenue: number;
  baseExpense: number;
  capacity: number;
  operationTime: number; // in seconds
  icon: string;
}

export const FACILITY_CONFIGS: Record<FacilityType, FacilityConfig> = {
  glass_factory: {
    name: "玻璃厂",
    description: "生产玻璃制品",
    baseRevenue: 500,
    baseExpense: 200,
    capacity: 1000,
    operationTime: 3600,
    icon: "🏭",
  },
  paint_factory: {
    name: "油漆厂",
    description: "生产油漆和涂料",
    baseRevenue: 450,
    baseExpense: 180,
    capacity: 800,
    operationTime: 3600,
    icon: "🏭",
  },
  fast_food: {
    name: "快餐店",
    description: "提供快速餐饮服务",
    baseRevenue: 800,
    baseExpense: 300,
    capacity: 100,
    operationTime: 1800,
    icon: "🍔",
  },
  supermarket: {
    name: "超市",
    description: "零售各类商品",
    baseRevenue: 1200,
    baseExpense: 500,
    capacity: 500,
    operationTime: 3600,
    icon: "🛒",
  },
  parking_lot: {
    name: "停车场",
    description: "提供停车服务",
    baseRevenue: 300,
    baseExpense: 100,
    capacity: 200,
    operationTime: 7200,
    icon: "🅿️",
  },
  park: {
    name: "公园",
    description: "提供休闲娱乐场所",
    baseRevenue: 400,
    baseExpense: 150,
    capacity: 1000,
    operationTime: 7200,
    icon: "🌳",
  },
  entertainment_center: {
    name: "娱乐中心",
    description: "提供各类娱乐活动",
    baseRevenue: 1500,
    baseExpense: 600,
    capacity: 300,
    operationTime: 3600,
    icon: "🎮",
  },
  nightclub: {
    name: "夜店",
    description: "提供夜间娱乐服务",
    baseRevenue: 2000,
    baseExpense: 800,
    capacity: 200,
    operationTime: 3600,
    icon: "🎉",
  },
  bar: {
    name: "酒吧",
    description: "提供酒水和社交场所",
    baseRevenue: 1000,
    baseExpense: 400,
    capacity: 150,
    operationTime: 3600,
    icon: "🍹",
  },
  hotel: {
    name: "酒店",
    description: "提供住宿服务",
    baseRevenue: 1800,
    baseExpense: 700,
    capacity: 100,
    operationTime: 86400, // 24 hours
    icon: "🏨",
  },
  apartment: {
    name: "公寓",
    description: "出租公寓单位",
    baseRevenue: 1200,
    baseExpense: 400,
    capacity: 50,
    operationTime: 86400,
    icon: "🏢",
  },
  villa: {
    name: "别墅",
    description: "出租高级别墅",
    baseRevenue: 2500,
    baseExpense: 1000,
    capacity: 20,
    operationTime: 86400,
    icon: "🏰",
  },
};

export class CommercialSystem {
  /**
   * Calculate revenue based on facility level and efficiency
   */
  static calculateRevenue(
    type: FacilityType,
    level: number,
    efficiency: number,
    occupancyRate: number = 1.0
  ): number {
    const config = FACILITY_CONFIGS[type];
    const baseRevenue = config.baseRevenue;
    const levelBonus = 1 + (level - 1) * 0.2; // 20% per level
    const revenue = Math.floor(baseRevenue * levelBonus * efficiency * occupancyRate);
    return Math.max(0, revenue);
  }

  /**
   * Calculate expenses based on facility level
   */
  static calculateExpense(type: FacilityType, level: number): number {
    const config = FACILITY_CONFIGS[type];
    const baseExpense = config.baseExpense;
    const levelCost = 1 + (level - 1) * 0.15; // 15% increase per level
    return Math.floor(baseExpense * levelCost);
  }

  /**
   * Calculate net profit
   */
  static calculateProfit(
    type: FacilityType,
    level: number,
    efficiency: number,
    occupancyRate: number = 1.0
  ): number {
    const revenue = this.calculateRevenue(type, level, efficiency, occupancyRate);
    const expense = this.calculateExpense(type, level);
    return revenue - expense;
  }

  /**
   * Start a facility operation
   */
  static startOperation(
    facilityId: string,
    type: FacilityType,
    level: number,
    efficiency: number = 1.0,
    occupancyRate: number = 1.0
  ): FacilityOperation {
    const config = FACILITY_CONFIGS[type];
    const revenue = this.calculateRevenue(type, level, efficiency, occupancyRate);
    const now = Date.now();

    return {
      id: `op_${facilityId}_${Date.now()}`,
      facilityId,
      operationType: this.getOperationType(type),
      startTime: now,
      endTime: now + config.operationTime * 1000,
      revenue,
      status: "active",
    };
  }

  /**
   * Complete a facility operation
   */
  static completeOperation(operation: FacilityOperation): FacilityOperation {
    return {
      ...operation,
      status: "completed",
    };
  }

  /**
   * Upgrade facility
   */
  static upgradeFacility(
    currentLevel: number,
    currentBalance: number
  ): { success: boolean; newLevel: number; cost: number } {
    const upgradeCost = 1000 * currentLevel;
    const canUpgrade = currentBalance >= upgradeCost;

    return {
      success: canUpgrade,
      newLevel: canUpgrade ? currentLevel + 1 : currentLevel,
      cost: upgradeCost,
    };
  }

  /**
   * Perform maintenance
   */
  static performMaintenance(
    type: FacilityType,
    level: number,
    currentBalance: number
  ): { success: boolean; newEfficiency: number; cost: number } {
    const maintenanceCost = 200 * level;
    const canMaintain = currentBalance >= maintenanceCost;

    return {
      success: canMaintain,
      newEfficiency: canMaintain ? Math.min(1.0, 0.8 + 0.2) : 0.8,
      cost: maintenanceCost,
    };
  }

  /**
   * Get facility configuration
   */
  static getFacilityConfig(type: FacilityType): FacilityConfig {
    return FACILITY_CONFIGS[type];
  }

  /**
   * Get operation type based on facility type
   */
  private static getOperationType(
    type: FacilityType
  ): "production" | "service" | "rental" {
    const productionFacilities = ["glass_factory", "paint_factory"];
    const serviceFacilities = [
      "fast_food",
      "supermarket",
      "parking_lot",
      "park",
      "entertainment_center",
      "nightclub",
      "bar",
    ];
    const rentalFacilities = ["hotel", "apartment", "villa"];

    if (productionFacilities.includes(type)) return "production";
    if (serviceFacilities.includes(type)) return "service";
    if (rentalFacilities.includes(type)) return "rental";

    return "service"; // default
  }

  /**
   * Get all facility types
   */
  static getAllFacilityTypes(): FacilityType[] {
    return Object.keys(FACILITY_CONFIGS) as FacilityType[];
  }

  /**
   * Get facilities by category
   */
  static getFacilitiesByCategory(
    category: "production" | "service" | "rental"
  ): FacilityType[] {
    return this.getAllFacilityTypes().filter(
      (type) => this.getOperationType(type) === category
    );
  }

  /**
   * Calculate total facility value
   */
  static calculateFacilityValue(type: FacilityType, level: number): number {
    const baseValue = 5000;
    const levelValue = 1000 * level;
    return baseValue + levelValue;
  }
}
