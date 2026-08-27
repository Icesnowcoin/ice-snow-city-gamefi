/**
 * 娱乐设施系统 - 公园、娱乐中心、夜店、酒吧
 * 使用 JSON 存储在 gameAccounts 表中
 */

export interface EntertainmentFacility {
  id: string;
  ownerId: number;
  facilityType: "park" | "entertainment_center" | "nightclub" | "bar";
  locationX: number;
  locationY: number;
  level: number;
  purchasePrice: number;
  currentValue: number;
  capacity: number;
  currentVisitors: number;
  dailyRevenue: number;
  operatingCost: number;
  atmosphere: number; // 0-100，越高越吸引人
  reputation: number; // 0-100，声誉度
  status: "open" | "closed" | "maintenance";
  createdAt: number;
  updatedAt: number;
}

export interface VisitorRecord {
  id: string;
  facilityId: string;
  visitorId: number;
  visitDate: number;
  spentAmount: number;
  satisfaction: number; // 0-100
  createdAt: number;
}

export interface EventRecord {
  id: string;
  facilityId: string;
  eventType: "concert" | "party" | "exhibition" | "sports";
  eventName: string;
  startDate: number;
  endDate: number;
  expectedVisitors: number;
  actualVisitors: number;
  revenue: number;
  cost: number;
  status: "planned" | "ongoing" | "completed" | "cancelled";
  createdAt: number;
}

export interface EntertainmentData {
  facilities: EntertainmentFacility[];
  visitors: VisitorRecord[];
  events: EventRecord[];
  totalRevenue: number;
  lastUpdated: number;
}

// 娱乐设施配置
const FACILITY_CONFIG = {
  park: {
    basePrice: 100000,
    capacity: 500,
    dailyRevenue: 5000,
    operatingCost: 1000,
    upgradeCostMultiplier: 1.0,
    description: "公共公园，吸引游客休闲",
  },
  entertainment_center: {
    basePrice: 250000,
    capacity: 300,
    dailyRevenue: 15000,
    operatingCost: 3000,
    upgradeCostMultiplier: 1.3,
    description: "娱乐中心，提供各种娱乐活动",
  },
  nightclub: {
    basePrice: 350000,
    capacity: 200,
    dailyRevenue: 25000,
    operatingCost: 5000,
    upgradeCostMultiplier: 1.5,
    description: "夜店，高端娱乐场所",
  },
  bar: {
    basePrice: 150000,
    capacity: 100,
    dailyRevenue: 8000,
    operatingCost: 2000,
    upgradeCostMultiplier: 1.2,
    description: "酒吧，休闲饮酒场所",
  },
};

export class EntertainmentSystem {
  /**
   * 初始化娱乐数据
   */
  static initializeEntertainmentData(): EntertainmentData {
    return {
      facilities: [],
      visitors: [],
      events: [],
      totalRevenue: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 获取或初始化娱乐数据
   */
  static getEntertainmentData(playerData: any): EntertainmentData {
    if (!playerData.entertainment) {
      playerData.entertainment = this.initializeEntertainmentData();
    }
    return playerData.entertainment;
  }

  /**
   * 建造娱乐设施
   */
  static buildFacility(
    entertainmentData: EntertainmentData,
    ownerId: number,
    facilityType: "park" | "entertainment_center" | "nightclub" | "bar",
    locationX: number,
    locationY: number
  ): EntertainmentFacility {
    const config = FACILITY_CONFIG[facilityType];
    const now = Date.now();

    const facility: EntertainmentFacility = {
      id: `ent_${ownerId}_${now}`,
      ownerId,
      facilityType,
      locationX,
      locationY,
      level: 1,
      purchasePrice: config.basePrice,
      currentValue: config.basePrice,
      capacity: config.capacity,
      currentVisitors: 0,
      dailyRevenue: config.dailyRevenue,
      operatingCost: config.operatingCost,
      atmosphere: 50,
      reputation: 50,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };

    entertainmentData.facilities.push(facility);
    entertainmentData.lastUpdated = now;

    return facility;
  }

  /**
   * 获取设施详情
   */
  static getFacility(
    entertainmentData: EntertainmentData,
    facilityId: string
  ): EntertainmentFacility | null {
    return (
      entertainmentData.facilities.find((f) => f.id === facilityId) || null
    );
  }

  /**
   * 获取玩家的所有设施
   */
  static getPlayerFacilities(
    entertainmentData: EntertainmentData,
    ownerId: number
  ): EntertainmentFacility[] {
    return entertainmentData.facilities.filter((f) => f.ownerId === ownerId);
  }

  /**
   * 升级设施
   */
  static upgradeFacility(
    entertainmentData: EntertainmentData,
    facilityId: string
  ): EntertainmentFacility | null {
    const facility = this.getFacility(entertainmentData, facilityId);
    if (!facility) return null;

    if (facility.level >= 20) {
      throw new Error("Facility has reached maximum level");
    }

    const config = FACILITY_CONFIG[facility.facilityType];
    const upgradeCost = Math.floor(
      config.basePrice * facility.level * config.upgradeCostMultiplier
    );

    // 更新设施
    facility.level += 1;
    facility.capacity = Math.floor(facility.capacity * 1.15);
    facility.dailyRevenue = Math.floor(facility.dailyRevenue * 1.2);
    facility.operatingCost = Math.floor(facility.operatingCost * 1.1);
    facility.atmosphere = Math.min(100, facility.atmosphere + 5);
    facility.currentValue += upgradeCost;
    facility.updatedAt = Date.now();

    entertainmentData.lastUpdated = Date.now();

    return facility;
  }

  /**
   * 计算日收入
   */
  static calculateDailyRevenue(facility: EntertainmentFacility): number {
    const levelMultiplier = 1 + (facility.level - 1) * 0.15;
    const atmosphereCoefficient = facility.atmosphere / 100;
    const reputationCoefficient = facility.reputation / 100;
    const occupancyRate = facility.currentVisitors / facility.capacity;

    return Math.floor(
      facility.dailyRevenue *
        levelMultiplier *
        atmosphereCoefficient *
        reputationCoefficient *
        Math.min(1, occupancyRate + 0.5)
    );
  }

  /**
   * 举办活动
   */
  static hostEvent(
    entertainmentData: EntertainmentData,
    facilityId: string,
    eventType: "concert" | "party" | "exhibition" | "sports",
    eventName: string,
    durationHours: number
  ): EventRecord | null {
    const facility = this.getFacility(entertainmentData, facilityId);
    if (!facility) return null;

    if (facility.status !== "open") {
      throw new Error("Facility is not open");
    }

    const now = Date.now();
    const startDate = now;
    const endDate = now + durationHours * 60 * 60 * 1000;

    // 计算预期访客
    const expectedVisitors = Math.floor(
      facility.capacity * (facility.reputation / 100) * (facility.atmosphere / 100)
    );

    // 计算成本
    const eventCost = Math.floor(
      facility.operatingCost * durationHours * (1 + facility.level * 0.1)
    );

    const event: EventRecord = {
      id: `event_${facilityId}_${now}`,
      facilityId,
      eventType,
      eventName,
      startDate,
      endDate,
      expectedVisitors,
      actualVisitors: 0,
      revenue: 0,
      cost: eventCost,
      status: "planned",
      createdAt: now,
    };

    entertainmentData.events.push(event);
    entertainmentData.lastUpdated = now;

    return event;
  }

  /**
   * 完成活动
   */
  static completeEvent(
    entertainmentData: EntertainmentData,
    eventId: string
  ): EventRecord | null {
    const event = entertainmentData.events.find((e) => e.id === eventId);
    if (!event) return null;

    if (event.status !== "planned" && event.status !== "ongoing") {
      throw new Error("Event cannot be completed");
    }

    // 计算实际访客和收入
    const actualVisitors = Math.floor(
      event.expectedVisitors * (0.7 + Math.random() * 0.3)
    );
    const revenue = Math.floor(actualVisitors * 50); // 每位访客平均消费50 ISC

    event.actualVisitors = actualVisitors;
    event.revenue = revenue;
    event.status = "completed";

    // 更新设施声誉和氛围
    const facility = this.getFacility(entertainmentData, event.facilityId);
    if (facility) {
      const successRate = actualVisitors / event.expectedVisitors;
      facility.reputation = Math.min(
        100,
        facility.reputation + successRate * 10
      );
      facility.atmosphere = Math.min(100, facility.atmosphere + 5);
      facility.updatedAt = Date.now();
    }

    entertainmentData.lastUpdated = Date.now();

    return event;
  }

  /**
   * 记录访客
   */
  static recordVisitor(
    entertainmentData: EntertainmentData,
    facilityId: string,
    visitorId: number,
    spentAmount: number,
    satisfaction: number
  ): VisitorRecord | null {
    const facility = this.getFacility(entertainmentData, facilityId);
    if (!facility) return null;

    if (facility.currentVisitors >= facility.capacity) {
      throw new Error("Facility is at full capacity");
    }

    const visitor: VisitorRecord = {
      id: `visitor_${facilityId}_${visitorId}_${Date.now()}`,
      facilityId,
      visitorId,
      visitDate: Date.now(),
      spentAmount,
      satisfaction,
      createdAt: Date.now(),
    };

    // 更新设施
    facility.currentVisitors += 1;
    facility.reputation = Math.min(
      100,
      facility.reputation + (satisfaction / 100) * 0.5
    );
    facility.updatedAt = Date.now();

    entertainmentData.visitors.push(visitor);
    entertainmentData.lastUpdated = Date.now();

    return visitor;
  }

  /**
   * 获取设施的访客记录
   */
  static getFacilityVisitors(
    entertainmentData: EntertainmentData,
    facilityId: string
  ): VisitorRecord[] {
    return entertainmentData.visitors.filter(
      (v) => v.facilityId === facilityId
    );
  }

  /**
   * 获取设施的活动记录
   */
  static getFacilityEvents(
    entertainmentData: EntertainmentData,
    facilityId: string
  ): EventRecord[] {
    return entertainmentData.events.filter((e) => e.facilityId === facilityId);
  }

  /**
   * 计算设施总价值
   */
  static calculateTotalValue(
    entertainmentData: EntertainmentData,
    ownerId: number
  ): number {
    return this.getPlayerFacilities(entertainmentData, ownerId).reduce(
      (total, facility) => total + facility.currentValue,
      0
    );
  }

  /**
   * 计算日收入总和
   */
  static calculateTotalDailyRevenue(
    entertainmentData: EntertainmentData,
    ownerId: number
  ): number {
    return this.getPlayerFacilities(entertainmentData, ownerId).reduce(
      (total, facility) => total + this.calculateDailyRevenue(facility),
      0
    );
  }

  /**
   * 衰减设施状况
   */
  static degradeFacilityCondition(
    entertainmentData: EntertainmentData,
    facilityId: string
  ): void {
    const facility = this.getFacility(entertainmentData, facilityId);
    if (!facility) return;

    // 根据运营状态计算衰减
    const degradationRate = facility.status === "open" ? 0.01 : 0.005;

    facility.atmosphere = Math.max(
      0,
      facility.atmosphere - degradationRate * 100
    );
    facility.reputation = Math.max(
      0,
      facility.reputation - degradationRate * 50
    );
    facility.updatedAt = Date.now();

    entertainmentData.lastUpdated = Date.now();
  }

  /**
   * 获取可用设施列表
   */
  static getAvailableFacilities(
    entertainmentData: EntertainmentData,
    facilityType?: "park" | "entertainment_center" | "nightclub" | "bar"
  ): EntertainmentFacility[] {
    let facilities = entertainmentData.facilities.filter(
      (f) => f.status === "open"
    );

    if (facilityType) {
      facilities = facilities.filter((f) => f.facilityType === facilityType);
    }

    return facilities;
  }
}

export const entertainmentSystem = EntertainmentSystem;
