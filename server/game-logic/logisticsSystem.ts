/**
 * Logistics System
 * Manages transportation and distribution of goods
 */

export interface LogisticsResource {
  [key: string]: number;
}

export interface LogisticsRoute {
  id: string;
  fromLocation: string;
  toLocation: string;
  distance: number;
  transportTime: number;
  capacity: number;
}

export interface LogisticsShipment {
  id: string;
  playerId: number;
  route: LogisticsRoute;
  cargo: LogisticsResource;
  startTime: number;
  endTime: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  cost: number;
}

export interface LogisticsHub {
  level: number;
  capacity: number;
  efficiency: number;
  maintenanceCost: number;
  lastMaintenance: number;
  activeShipments: number;
}

export class LogisticsSystem {
  private static readonly BASE_TRANSPORT_TIME = 1800; // 30 minutes in seconds
  private static readonly COST_PER_KM = 10;
  private static readonly EFFICIENCY_MULTIPLIER = 0.85;

  // Predefined routes
  private static readonly ROUTES: Record<string, LogisticsRoute> = {
    mining_to_hub: {
      id: 'mining_to_hub',
      fromLocation: 'Mining Facility',
      toLocation: 'Logistics Hub',
      distance: 50,
      transportTime: 1800,
      capacity: 1000,
    },
    logging_to_hub: {
      id: 'logging_to_hub',
      fromLocation: 'Logging Facility',
      toLocation: 'Logistics Hub',
      distance: 40,
      transportTime: 1600,
      capacity: 1200,
    },
    hub_to_market: {
      id: 'hub_to_market',
      fromLocation: 'Logistics Hub',
      toLocation: 'Market',
      distance: 30,
      transportTime: 1200,
      capacity: 800,
    },
    smelting_to_hub: {
      id: 'smelting_to_hub',
      fromLocation: 'Smelting Facility',
      toLocation: 'Logistics Hub',
      distance: 35,
      transportTime: 1400,
      capacity: 600,
    },
  };

  /**
   * Get available routes
   */
  static getRoutes(): LogisticsRoute[] {
    return Object.values(this.ROUTES);
  }

  /**
   * Calculate transport cost based on distance and cargo weight
   */
  static calculateTransportCost(
    distance: number,
    cargoWeight: number,
    hubLevel: number
  ): number {
    const baseCost = distance * this.COST_PER_KM;
    const weightCost = cargoWeight * 0.5;
    const levelDiscount = 1 - (hubLevel - 1) * 0.05; // 5% discount per level
    return Math.ceil((baseCost + weightCost) * levelDiscount);
  }

  /**
   * Calculate transport time based on distance and hub efficiency
   */
  static calculateTransportTime(
    distance: number,
    hubLevel: number,
    efficiency: number
  ): number {
    const baseTime = this.BASE_TRANSPORT_TIME;
    const distanceFactor = distance / 50; // Normalized to 50km
    const hubBonus = Math.pow(this.EFFICIENCY_MULTIPLIER, hubLevel - 1);
    return Math.ceil(baseTime * distanceFactor * hubBonus * efficiency);
  }

  /**
   * Create a shipment
   */
  static createShipment(
    playerId: number,
    routeId: string,
    cargo: LogisticsResource,
    hubLevel: number,
    efficiency: number = 1.0
  ): LogisticsShipment | null {
    const route = this.ROUTES[routeId];
    if (!route) return null;

    // Calculate total cargo weight
    const cargoWeight = Object.values(cargo).reduce((sum, qty) => sum + qty, 0);

    // Check capacity
    if (cargoWeight > route.capacity) {
      return null; // Exceeds capacity
    }

    const transportTime = this.calculateTransportTime(route.distance, hubLevel, efficiency);
    const cost = this.calculateTransportCost(route.distance, cargoWeight, hubLevel);
    const now = Date.now();

    return {
      id: `shipment_${playerId}_${Date.now()}`,
      playerId,
      route,
      cargo,
      startTime: now,
      endTime: now + transportTime * 1000,
      status: 'pending',
      cost,
    };
  }

  /**
   * Start a shipment (transition from pending to in_transit)
   */
  static startShipment(shipment: LogisticsShipment): LogisticsShipment {
    return {
      ...shipment,
      status: 'in_transit',
      startTime: Date.now(),
      endTime: Date.now() + (shipment.endTime - shipment.startTime),
    };
  }

  /**
   * Complete a shipment
   */
  static completeShipment(shipment: LogisticsShipment): LogisticsShipment {
    return {
      ...shipment,
      status: 'delivered',
    };
  }

  /**
   * Upgrade logistics hub
   */
  static upgradeHub(
    currentLevel: number,
    currentBalance: number
  ): { success: boolean; newLevel: number; cost: number } {
    const upgradeCost = 500 * currentLevel;
    const canUpgrade = currentBalance >= upgradeCost;

    return {
      success: canUpgrade,
      newLevel: canUpgrade ? currentLevel + 1 : currentLevel,
      cost: upgradeCost,
    };
  }

  /**
   * Calculate maintenance cost
   */
  static calculateMaintenanceCost(hubLevel: number): number {
    return 200 * hubLevel;
  }

  /**
   * Perform maintenance on hub
   */
  static performMaintenance(
    hub: LogisticsHub,
    currentBalance: number
  ): { success: boolean; newEfficiency: number; cost: number } {
    const cost = this.calculateMaintenanceCost(hub.level);
    const canMaintain = currentBalance >= cost;

    return {
      success: canMaintain,
      newEfficiency: canMaintain ? Math.min(1.0, hub.efficiency + 0.2) : hub.efficiency,
      cost,
    };
  }

  /**
   * Get logistics statistics
   */
  static getLogisticsStats(shipments: LogisticsShipment[]): {
    totalShipments: number;
    deliveredShipments: number;
    failedShipments: number;
    totalCost: number;
    totalCargo: number;
  } {
    const stats = {
      totalShipments: shipments.length,
      deliveredShipments: 0,
      failedShipments: 0,
      totalCost: 0,
      totalCargo: 0,
    };

    for (const shipment of shipments) {
      if (shipment.status === 'delivered') {
        stats.deliveredShipments++;
      } else if (shipment.status === 'failed') {
        stats.failedShipments++;
      }
      stats.totalCost += shipment.cost;
      stats.totalCargo += Object.values(shipment.cargo).reduce((sum, qty) => sum + qty, 0);
    }

    return stats;
  }
}
