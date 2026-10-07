/**
 * Advanced Business Facilities System
 * Supports: Restaurants, Cafes, Libraries, Landmarks, Ad Spaces, Gardens, Flower Shops
 */

export interface FacilityData {
  id: string;
  type: 'restaurant' | 'cafe' | 'library' | 'landmark' | 'ads' | 'garden' | 'flower_shop';
  level: number;
  revenue: number;
  capacity: number;
  workers: number;
  inventory: Record<string, number>;
  lastCollected: number;
  upgradeCost: number;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface FacilityConfig {
  baseCost: number;
  baseRevenue: number;
  baseCapacity: number;
  upgradeCostMultiplier: number;
  revenueMultiplier: number;
  capacityMultiplier: number;
  items?: string[];
}

const FACILITY_CONFIGS: Record<string, FacilityConfig> = {
  restaurant: {
    baseCost: 50000,
    baseRevenue: 500,
    baseCapacity: 50,
    upgradeCostMultiplier: 1.5,
    revenueMultiplier: 1.3,
    capacityMultiplier: 1.2,
    items: ['burger', 'pizza', 'steak', 'salad']
  },
  cafe: {
    baseCost: 30000,
    baseRevenue: 300,
    baseCapacity: 30,
    upgradeCostMultiplier: 1.4,
    revenueMultiplier: 1.2,
    capacityMultiplier: 1.15,
    items: ['coffee', 'tea', 'pastry', 'juice']
  },
  library: {
    baseCost: 40000,
    baseRevenue: 200,
    baseCapacity: 100,
    upgradeCostMultiplier: 1.3,
    revenueMultiplier: 1.1,
    capacityMultiplier: 1.3,
    items: ['book', 'magazine', 'newspaper']
  },
  landmark: {
    baseCost: 100000,
    baseRevenue: 1000,
    baseCapacity: 200,
    upgradeCostMultiplier: 2.0,
    revenueMultiplier: 1.5,
    capacityMultiplier: 1.5,
    items: []
  },
  ads: {
    baseCost: 20000,
    baseRevenue: 150,
    baseCapacity: 10,
    upgradeCostMultiplier: 1.2,
    revenueMultiplier: 1.4,
    capacityMultiplier: 1.1,
    items: ['ad_slot_1', 'ad_slot_2', 'ad_slot_3']
  },
  garden: {
    baseCost: 25000,
    baseRevenue: 250,
    baseCapacity: 20,
    upgradeCostMultiplier: 1.3,
    revenueMultiplier: 1.2,
    capacityMultiplier: 1.2,
    items: ['flower', 'herb', 'vegetable']
  },
  flower_shop: {
    baseCost: 35000,
    baseRevenue: 350,
    baseCapacity: 40,
    upgradeCostMultiplier: 1.4,
    revenueMultiplier: 1.3,
    capacityMultiplier: 1.2,
    items: ['rose', 'tulip', 'sunflower', 'lily']
  }
};

export class AdvancedFacilitiesSystem {
  /**
   * Create a new facility
   */
  static createFacility(type: string): FacilityData {
    const config = FACILITY_CONFIGS[type];
    if (!config) throw new Error(`Unknown facility type: ${type}`);

    return {
      id: `facility_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      level: 1,
      revenue: 0,
      capacity: config.baseCapacity,
      workers: 0,
      inventory: {},
      lastCollected: Date.now(),
      upgradeCost: Math.floor(config.baseCost * config.upgradeCostMultiplier),
      status: 'active'
    };
  }

  /**
   * Collect revenue from facility
   */
  static collectRevenue(facility: FacilityData): number {
    const config = FACILITY_CONFIGS[facility.type];
    if (!config) return 0;

    const baseRevenue = config.baseRevenue * (facility.level ** 1.1);
    const workerBonus = facility.workers * (baseRevenue * 0.1);
    const totalRevenue = Math.floor(baseRevenue + workerBonus);

    facility.revenue += totalRevenue;
    facility.lastCollected = Date.now();

    return totalRevenue;
  }

  /**
   * Upgrade facility
   */
  static upgradeFacility(facility: FacilityData, playerISC: number): boolean {
    if (playerISC < facility.upgradeCost) return false;

    const config = FACILITY_CONFIGS[facility.type];
    if (!config) return false;

    facility.level += 1;
    facility.capacity = Math.floor(facility.capacity * config.capacityMultiplier);
    facility.upgradeCost = Math.floor(facility.upgradeCost * config.upgradeCostMultiplier);

    return true;
  }

  /**
   * Hire workers for facility
   */
  static hireWorker(facility: FacilityData, cost: number): boolean {
    if (facility.workers >= 5) return false; // Max 5 workers per facility
    facility.workers += 1;
    return true;
  }

  /**
   * Add inventory item
   */
  static addInventory(facility: FacilityData, item: string, quantity: number): void {
    facility.inventory[item] = (facility.inventory[item] || 0) + quantity;
  }

  /**
   * Remove inventory item
   */
  static removeInventory(facility: FacilityData, item: string, quantity: number): boolean {
    if ((facility.inventory[item] || 0) < quantity) return false;
    facility.inventory[item] -= quantity;
    return true;
  }

  /**
   * Get facility stats
   */
  static getStats(facility: FacilityData) {
    const config = FACILITY_CONFIGS[facility.type];
    return {
      type: facility.type,
      level: facility.level,
      revenue: facility.revenue,
      capacity: facility.capacity,
      workers: facility.workers,
      status: facility.status,
      nextUpgradeCost: facility.upgradeCost,
      efficiency: (facility.workers / 5) * 100,
      inventory: facility.inventory
    };
  }
}
