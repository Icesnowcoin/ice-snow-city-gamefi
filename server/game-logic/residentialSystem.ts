/**
 * 住宅系统 - 使用 JSON 存储在 gameAccounts 表中
 * 支持公寓、别墅、酒店的购买、出租、维护和升级
 */

export interface ResidentialProperty {
  id: string;
  ownerId: number;
  propertyType: "apartment" | "villa" | "hotel";
  locationX: number;
  locationY: number;
  level: number;
  purchasePrice: number;
  currentValue: number;
  capacity: number;
  occupancy: number;
  monthlyRevenue: number;
  maintenanceCost: number;
  lastMaintenance: number; // timestamp
  conditionPercentage: number;
  status: "active" | "maintenance" | "abandoned";
  createdAt: number;
  updatedAt: number;
}

export interface RentalRecord {
  id: string;
  propertyId: string;
  tenantId: number;
  startDate: number;
  endDate: number;
  monthlyRent: number;
  totalPaid: number;
  status: "active" | "completed" | "terminated";
  createdAt: number;
}

export interface MaintenanceRecord {
  id: string;
  propertyId: string;
  maintenanceType: "routine" | "repair" | "upgrade";
  cost: number;
  conditionRestored: number;
  completionDate: number | null;
  status: "pending" | "in_progress" | "completed";
  createdAt: number;
}

export interface ResidentialData {
  properties: ResidentialProperty[];
  rentals: RentalRecord[];
  maintenance: MaintenanceRecord[];
  totalIncome: number;
  lastUpdated: number;
}

// 住宅类型配置
const PROPERTY_CONFIG = {
  apartment: {
    basePrice: 50000,
    capacity: 10,
    monthlyRevenue: 2000,
    maintenanceCost: 500,
    upgradeCostMultiplier: 1.0,
  },
  villa: {
    basePrice: 150000,
    capacity: 4,
    monthlyRevenue: 8000,
    maintenanceCost: 2000,
    upgradeCostMultiplier: 1.5,
  },
  hotel: {
    basePrice: 500000,
    capacity: 50,
    monthlyRevenue: 25000,
    maintenanceCost: 5000,
    upgradeCostMultiplier: 2.0,
  },
};

export class ResidentialSystem {
  /**
   * 初始化玩家的住宅数据
   */
  static initializeResidentialData(): ResidentialData {
    return {
      properties: [],
      rentals: [],
      maintenance: [],
      totalIncome: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 获取或初始化玩家的住宅数据
   */
  static getResidentialData(playerData: any): ResidentialData {
    if (!playerData.residential) {
      playerData.residential = this.initializeResidentialData();
    }
    return playerData.residential;
  }

  /**
   * 购买物业
   */
  static purchaseProperty(
    residentialData: ResidentialData,
    ownerId: number,
    propertyType: "apartment" | "villa" | "hotel",
    locationX: number,
    locationY: number
  ): ResidentialProperty {
    const config = PROPERTY_CONFIG[propertyType];
    const now = Date.now();

    const property: ResidentialProperty = {
      id: `prop_${ownerId}_${now}`,
      ownerId,
      propertyType,
      locationX,
      locationY,
      level: 1,
      purchasePrice: config.basePrice,
      currentValue: config.basePrice,
      capacity: config.capacity,
      occupancy: 0,
      monthlyRevenue: config.monthlyRevenue,
      maintenanceCost: config.maintenanceCost,
      lastMaintenance: now,
      conditionPercentage: 100,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    residentialData.properties.push(property);
    residentialData.lastUpdated = now;

    return property;
  }

  /**
   * 获取物业详情
   */
  static getProperty(
    residentialData: ResidentialData,
    propertyId: string
  ): ResidentialProperty | null {
    return (
      residentialData.properties.find((p) => p.id === propertyId) || null
    );
  }

  /**
   * 获取玩家的所有物业
   */
  static getPlayerProperties(
    residentialData: ResidentialData,
    ownerId: number
  ): ResidentialProperty[] {
    return residentialData.properties.filter((p) => p.ownerId === ownerId);
  }

  /**
   * 计算月收入
   */
  static calculateMonthlyRevenue(property: ResidentialProperty): number {
    const levelMultiplier = 1 + (property.level - 1) * 0.2;
    const conditionCoefficient = property.conditionPercentage / 100;
    const occupancyRate = property.occupancy / property.capacity;

    return Math.floor(
      property.monthlyRevenue * levelMultiplier * conditionCoefficient * occupancyRate
    );
  }

  /**
   * 升级物业
   */
  static upgradeProperty(
    residentialData: ResidentialData,
    propertyId: string
  ): ResidentialProperty | null {
    const property = this.getProperty(residentialData, propertyId);
    if (!property) return null;

    if (property.level >= 20) {
      throw new Error("Property has reached maximum level");
    }

    const config = PROPERTY_CONFIG[property.propertyType];
    const upgradeCost = Math.floor(
      config.basePrice * property.level * config.upgradeCostMultiplier
    );

    // 更新物业
    property.level += 1;
    property.capacity = Math.floor(property.capacity * 1.2);
    property.monthlyRevenue = Math.floor(property.monthlyRevenue * 1.2);
    property.maintenanceCost = Math.floor(property.maintenanceCost * 1.15);
    property.currentValue += upgradeCost;
    property.updatedAt = Date.now();

    // 记录维护
    const maintenance: MaintenanceRecord = {
      id: `maint_${propertyId}_${Date.now()}`,
      propertyId,
      maintenanceType: "upgrade",
      cost: upgradeCost,
      conditionRestored: 0,
      completionDate: Date.now(),
      status: "completed",
      createdAt: Date.now(),
    };

    residentialData.maintenance.push(maintenance);
    residentialData.lastUpdated = Date.now();

    return property;
  }

  /**
   * 执行维护
   */
  static performMaintenance(
    residentialData: ResidentialData,
    propertyId: string
  ): MaintenanceRecord | null {
    const property = this.getProperty(residentialData, propertyId);
    if (!property) return null;

    if (property.conditionPercentage >= 100) {
      throw new Error("Property is in perfect condition");
    }

    const maintenanceCost = property.maintenanceCost;
    const conditionRestored = Math.min(50, 100 - property.conditionPercentage);

    // 更新物业状况
    property.conditionPercentage = Math.min(
      100,
      property.conditionPercentage + conditionRestored
    );
    property.lastMaintenance = Date.now();
    property.updatedAt = Date.now();

    // 如果状况过低，自动标记为需要维护
    if (property.conditionPercentage < 50) {
      property.status = "maintenance";
    } else {
      property.status = "active";
    }

    // 记录维护
    const maintenance: MaintenanceRecord = {
      id: `maint_${propertyId}_${Date.now()}`,
      propertyId,
      maintenanceType: "routine",
      cost: maintenanceCost,
      conditionRestored,
      completionDate: Date.now(),
      status: "completed",
      createdAt: Date.now(),
    };

    residentialData.maintenance.push(maintenance);
    residentialData.lastUpdated = Date.now();

    return maintenance;
  }

  /**
   * 出租物业
   */
  static rentProperty(
    residentialData: ResidentialData,
    propertyId: string,
    tenantId: number,
    monthsDuration: number
  ): RentalRecord | null {
    const property = this.getProperty(residentialData, propertyId);
    if (!property) return null;

    if (property.occupancy >= property.capacity) {
      throw new Error("Property is fully occupied");
    }

    const monthlyRent = Math.floor(
      this.calculateMonthlyRevenue(property) * 0.7
    );
    const totalRent = monthlyRent * monthsDuration;

    const startDate = Date.now();
    const endDate = startDate + monthsDuration * 30 * 24 * 60 * 60 * 1000;

    const rental: RentalRecord = {
      id: `rental_${propertyId}_${tenantId}_${startDate}`,
      propertyId,
      tenantId,
      startDate,
      endDate,
      monthlyRent,
      totalPaid: totalRent,
      status: "active",
      createdAt: startDate,
    };

    // 更新入住率
    property.occupancy += 1;
    property.updatedAt = Date.now();

    residentialData.rentals.push(rental);
    residentialData.lastUpdated = Date.now();

    return rental;
  }

  /**
   * 获取物业的租赁记录
   */
  static getPropertyRentals(
    residentialData: ResidentialData,
    propertyId: string
  ): RentalRecord[] {
    return residentialData.rentals.filter((r) => r.propertyId === propertyId);
  }

  /**
   * 终止租赁
   */
  static terminateRental(
    residentialData: ResidentialData,
    rentalId: string
  ): boolean {
    const rentalIndex = residentialData.rentals.findIndex(
      (r) => r.id === rentalId
    );
    if (rentalIndex === -1) return false;

    const rental = residentialData.rentals[rentalIndex];
    if (rental.status !== "active") {
      throw new Error("Rental is not active");
    }

    rental.status = "terminated";

    // 更新入住率
    const property = this.getProperty(residentialData, rental.propertyId);
    if (property) {
      property.occupancy = Math.max(0, property.occupancy - 1);
      property.updatedAt = Date.now();
    }

    residentialData.lastUpdated = Date.now();
    return true;
  }

  /**
   * 获取可用物业列表
   */
  static getAvailableProperties(
    residentialData: ResidentialData,
    propertyType?: "apartment" | "villa" | "hotel"
  ): ResidentialProperty[] {
    let properties = residentialData.properties.filter(
      (p) => p.status === "active"
    );

    if (propertyType) {
      properties = properties.filter((p) => p.propertyType === propertyType);
    }

    return properties;
  }

  /**
   * 计算物业总价值
   */
  static calculateTotalValue(
    residentialData: ResidentialData,
    ownerId: number
  ): number {
    return this.getPlayerProperties(residentialData, ownerId).reduce(
      (total, prop) => total + prop.currentValue,
      0
    );
  }

  /**
   * 计算月收入总和
   */
  static calculateTotalMonthlyIncome(
    residentialData: ResidentialData,
    ownerId: number
  ): number {
    return this.getPlayerProperties(residentialData, ownerId).reduce(
      (total, prop) => total + this.calculateMonthlyRevenue(prop),
      0
    );
  }

  /**
   * 衰减物业状况
   */
  static degradePropertyCondition(
    residentialData: ResidentialData,
    propertyId: string
  ): void {
    const property = this.getProperty(residentialData, propertyId);
    if (!property) return;

    // 根据入住率计算衰减
    const occupancyRate = property.occupancy / property.capacity;
    const degradationRate = 0.02 + occupancyRate * 0.03; // 2-5%

    const newCondition = Math.max(
      0,
      property.conditionPercentage - degradationRate * 100
    );

    property.conditionPercentage = Math.floor(newCondition);
    property.updatedAt = Date.now();

    // 如果状况过低，自动标记为需要维护
    if (newCondition < 50) {
      property.status = "maintenance";
    }

    residentialData.lastUpdated = Date.now();
  }

  /**
   * 获取维护记录
   */
  static getMaintenanceRecords(
    residentialData: ResidentialData,
    propertyId?: string
  ): MaintenanceRecord[] {
    if (propertyId) {
      return residentialData.maintenance.filter(
        (m) => m.propertyId === propertyId
      );
    }
    return residentialData.maintenance;
  }
}

export const residentialSystem = ResidentialSystem;
