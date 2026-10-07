import { DayNightCycleSystem } from '../environment/DayNightCycleSystem';
import { SeasonSystem } from '../environment/SeasonSystem';

/**
 * NPC 活动类型
 */
export enum NPCActivityType {
  IDLE = 'idle',
  WORKING = 'working',
  EATING = 'eating',
  SLEEPING = 'sleeping',
  SOCIALIZING = 'socializing',
  TRAVELING = 'traveling',
  SHOPPING = 'shopping',
  FARMING = 'farming',
  FISHING = 'fishing',
  RESTING = 'resting',
}

/**
 * NPC 位置
 */
export interface NPCLocation {
  x: number;
  y: number;
  z: number;
  name: string;
}

/**
 * NPC 日程事件
 */
export interface NPCScheduleEvent {
  startHour: number;
  endHour: number;
  activity: NPCActivityType;
  location: NPCLocation;
  description: string;
}

/**
 * NPC 日程配置
 */
export interface NPCScheduleConfig {
  npcId: string;
  npcName: string;
  dailySchedule: NPCScheduleEvent[];
  seasonalVariations?: {
    season: string;
    schedule: NPCScheduleEvent[];
  }[];
}

/**
 * NPC 当前状态
 */
export interface NPCCurrentStatus {
  npcId: string;
  npcName: string;
  currentActivity: NPCActivityType;
  currentLocation: NPCLocation;
  currentEventDescription: string;
  nextEventTime: number;
  nextEventActivity: NPCActivityType;
  nextEventLocation: NPCLocation;
  isAvailable: boolean;
  availabilityReason: string;
}

/**
 * NPC 日程管理系统
 */
export class NPCScheduleSystem {
  private schedules: Map<string, NPCScheduleConfig> = new Map();
  private dayNightCycle: DayNightCycleSystem | null = null;
  private seasonSystem: SeasonSystem | null = null;
  private currentStatuses: Map<string, NPCCurrentStatus> = new Map();

  constructor(dayNightCycle?: DayNightCycleSystem, seasonSystem?: SeasonSystem) {
    this.dayNightCycle = dayNightCycle || null;
    this.seasonSystem = seasonSystem || null;
    this.initializeDefaultSchedules();
  }

  /**
   * 初始化默认 NPC 日程
   */
  private initializeDefaultSchedules(): void {
    // NPC 1: 李农民 - 农民
    this.addSchedule({
      npcId: 'li-farmer',
      npcName: '李农民',
      dailySchedule: [
        {
          startHour: 6,
          endHour: 8,
          activity: NPCActivityType.EATING,
          location: { x: -30, y: 0, z: -20, name: '农舍' },
          description: '在农舍吃早饭',
        },
        {
          startHour: 8,
          endHour: 12,
          activity: NPCActivityType.FARMING,
          location: { x: -40, y: 0, z: -30, name: '麦田' },
          description: '在麦田工作',
        },
        {
          startHour: 12,
          endHour: 13,
          activity: NPCActivityType.EATING,
          location: { x: -30, y: 0, z: -20, name: '农舍' },
          description: '在农舍吃午饭',
        },
        {
          startHour: 13,
          endHour: 17,
          activity: NPCActivityType.FARMING,
          location: { x: -40, y: 0, z: -30, name: '麦田' },
          description: '继续在麦田工作',
        },
        {
          startHour: 17,
          endHour: 19,
          activity: NPCActivityType.RESTING,
          location: { x: -30, y: 0, z: -20, name: '农舍' },
          description: '在农舍休息',
        },
        {
          startHour: 19,
          endHour: 20,
          activity: NPCActivityType.EATING,
          location: { x: -30, y: 0, z: -20, name: '农舍' },
          description: '在农舍吃晚饭',
        },
        {
          startHour: 20,
          endHour: 22,
          activity: NPCActivityType.SOCIALIZING,
          location: { x: 0, y: 0, z: 0, name: '广场' },
          description: '在广场社交',
        },
        {
          startHour: 22,
          endHour: 6,
          activity: NPCActivityType.SLEEPING,
          location: { x: -30, y: 0, z: -20, name: '农舍' },
          description: '在农舍睡觉',
        },
      ],
    });

    // NPC 2: 王温室管理员 - 温室管理员
    this.addSchedule({
      npcId: 'wang-greenhouse-manager',
      npcName: '王温室管理员',
      dailySchedule: [
        {
          startHour: 7,
          endHour: 8,
          activity: NPCActivityType.EATING,
          location: { x: 20, y: 0, z: -10, name: '温室' },
          description: '在温室吃早饭',
        },
        {
          startHour: 8,
          endHour: 12,
          activity: NPCActivityType.WORKING,
          location: { x: 20, y: 0, z: -10, name: '温室' },
          description: '在温室工作',
        },
        {
          startHour: 12,
          endHour: 13,
          activity: NPCActivityType.EATING,
          location: { x: 20, y: 0, z: -10, name: '温室' },
          description: '在温室吃午饭',
        },
        {
          startHour: 13,
          endHour: 17,
          activity: NPCActivityType.WORKING,
          location: { x: 20, y: 0, z: -10, name: '温室' },
          description: '继续在温室工作',
        },
        {
          startHour: 17,
          endHour: 18,
          activity: NPCActivityType.RESTING,
          location: { x: 20, y: 0, z: -10, name: '温室' },
          description: '在温室休息',
        },
        {
          startHour: 18,
          endHour: 19,
          activity: NPCActivityType.EATING,
          location: { x: 20, y: 0, z: -10, name: '温室' },
          description: '在温室吃晚饭',
        },
        {
          startHour: 19,
          endHour: 21,
          activity: NPCActivityType.SHOPPING,
          location: { x: 0, y: 0, z: 0, name: '广场' },
          description: '在广场购物',
        },
        {
          startHour: 21,
          endHour: 7,
          activity: NPCActivityType.SLEEPING,
          location: { x: 20, y: 0, z: -10, name: '温室' },
          description: '在温室睡觉',
        },
      ],
    });

    // NPC 3: 刘果园工人 - 果园工人
    this.addSchedule({
      npcId: 'liu-orchard-worker',
      npcName: '刘果园工人',
      dailySchedule: [
        {
          startHour: 6,
          endHour: 7,
          activity: NPCActivityType.EATING,
          location: { x: 40, y: 0, z: 30, name: '果园' },
          description: '在果园吃早饭',
        },
        {
          startHour: 7,
          endHour: 11,
          activity: NPCActivityType.FARMING,
          location: { x: 40, y: 0, z: 30, name: '果园' },
          description: '在果园工作',
        },
        {
          startHour: 11,
          endHour: 12,
          activity: NPCActivityType.EATING,
          location: { x: 40, y: 0, z: 30, name: '果园' },
          description: '在果园吃午饭',
        },
        {
          startHour: 12,
          endHour: 16,
          activity: NPCActivityType.FARMING,
          location: { x: 40, y: 0, z: 30, name: '果园' },
          description: '继续在果园工作',
        },
        {
          startHour: 16,
          endHour: 18,
          activity: NPCActivityType.RESTING,
          location: { x: 40, y: 0, z: 30, name: '果园' },
          description: '在果园休息',
        },
        {
          startHour: 18,
          endHour: 19,
          activity: NPCActivityType.EATING,
          location: { x: 40, y: 0, z: 30, name: '果园' },
          description: '在果园吃晚饭',
        },
        {
          startHour: 19,
          endHour: 21,
          activity: NPCActivityType.SOCIALIZING,
          location: { x: 0, y: 0, z: 0, name: '广场' },
          description: '在广场社交',
        },
        {
          startHour: 21,
          endHour: 6,
          activity: NPCActivityType.SLEEPING,
          location: { x: 40, y: 0, z: 30, name: '果园' },
          description: '在果园睡觉',
        },
      ],
    });
  }

  /**
   * 添加 NPC 日程
   */
  public addSchedule(config: NPCScheduleConfig): void {
    this.schedules.set(config.npcId, config);
  }

  /**
   * 获取 NPC 当前状态
   */
  public getNPCCurrentStatus(npcId: string): NPCCurrentStatus | null {
    const schedule = this.schedules.get(npcId);
    if (!schedule) {
      return null;
    }

    const currentHour = this.getCurrentGameHour();
    const currentEvent = this.getEventAtHour(schedule, currentHour);
    const nextEvent = this.getNextEvent(schedule, currentHour);

    if (!currentEvent) {
      return null;
    }

    const status: NPCCurrentStatus = {
      npcId,
      npcName: schedule.npcName,
      currentActivity: currentEvent.activity,
      currentLocation: currentEvent.location,
      currentEventDescription: currentEvent.description,
      nextEventTime: nextEvent ? nextEvent.startHour : currentEvent.startHour,
      nextEventActivity: nextEvent ? nextEvent.activity : currentEvent.activity,
      nextEventLocation: nextEvent ? nextEvent.location : currentEvent.location,
      isAvailable: this.isNPCAvailable(currentEvent),
      availabilityReason: this.getAvailabilityReason(currentEvent),
    };

    this.currentStatuses.set(npcId, status);
    return status;
  }

  /**
   * 获取所有 NPC 当前状态
   */
  public getAllNPCStatuses(): NPCCurrentStatus[] {
    const statuses: NPCCurrentStatus[] = [];
    this.schedules.forEach((_, npcId) => {
      const status = this.getNPCCurrentStatus(npcId);
      if (status) {
        statuses.push(status);
      }
    });
    return statuses;
  }

  /**
   * 获取 NPC 24 小时日程
   */
  public getNPC24HourSchedule(npcId: string): NPCScheduleEvent[] {
    const schedule = this.schedules.get(npcId);
    if (!schedule) {
      return [];
    }

    const currentSeason = this.getCurrentSeason();
    const seasonalVariation = schedule.seasonalVariations?.find(
      (v) => v.season === currentSeason
    );

    return seasonalVariation ? seasonalVariation.schedule : schedule.dailySchedule;
  }

  /**
   * 获取可用的 NPC 列表
   */
  public getAvailableNPCs(): NPCCurrentStatus[] {
    return this.getAllNPCStatuses().filter((status) => status.isAvailable);
  }

  /**
   * 获取不可用的 NPC 列表
   */
  public getUnavailableNPCs(): NPCCurrentStatus[] {
    return this.getAllNPCStatuses().filter((status) => !status.isAvailable);
  }

  /**
   * 获取指定位置的 NPC
   */
  public getNPCsAtLocation(locationName: string): NPCCurrentStatus[] {
    return this.getAllNPCStatuses().filter(
      (status) => status.currentLocation.name === locationName
    );
  }

  /**
   * 获取指定活动的 NPC
   */
  public getNPCsWithActivity(activity: NPCActivityType): NPCCurrentStatus[] {
    return this.getAllNPCStatuses().filter(
      (status) => status.currentActivity === activity
    );
  }

  /**
   * 获取当前游戏小时
   */
  private getCurrentGameHour(): number {
    if (this.dayNightCycle) {
      const timeInfo = this.dayNightCycle.getTimeInfo();
      return (timeInfo as any).hour || 12;
    }
    return 12; // 默认中午
  }

  /**
   * 获取当前季节
   */
  private getCurrentSeason(): string {
    if (this.seasonSystem) {
      return this.seasonSystem.getCurrentSeason();
    }
    return 'spring'; // 默认春季
  }

  /**
   * 获取指定小时的事件
   */
  private getEventAtHour(schedule: NPCScheduleConfig, hour: number): NPCScheduleEvent | null {
    const dailySchedule = schedule.dailySchedule;
    for (const event of dailySchedule) {
      if (event.startHour <= hour && hour < event.endHour) {
        return event;
      }
    }
    return null;
  }

  /**
   * 获取下一个事件
   */
  private getNextEvent(schedule: NPCScheduleConfig, currentHour: number): NPCScheduleEvent | null {
    const dailySchedule = schedule.dailySchedule;
    for (const event of dailySchedule) {
      if (event.startHour > currentHour) {
        return event;
      }
    }
    return dailySchedule[0]; // 返回第一个事件（明天）
  }

  /**
   * 检查 NPC 是否可用
   */
  private isNPCAvailable(event: NPCScheduleEvent): boolean {
    return (
      event.activity === NPCActivityType.IDLE ||
      event.activity === NPCActivityType.RESTING ||
      event.activity === NPCActivityType.SOCIALIZING
    );
  }

  /**
   * 获取可用性原因
   */
  private getAvailabilityReason(event: NPCScheduleEvent): string {
    if (this.isNPCAvailable(event)) {
      return '可以交互';
    }

    switch (event.activity) {
      case NPCActivityType.SLEEPING:
        return '正在睡觉';
      case NPCActivityType.EATING:
        return '正在吃饭';
      case NPCActivityType.WORKING:
        return '正在工作';
      case NPCActivityType.FARMING:
        return '正在农作';
      case NPCActivityType.FISHING:
        return '正在钓鱼';
      case NPCActivityType.SHOPPING:
        return '正在购物';
      case NPCActivityType.TRAVELING:
        return '正在旅行';
      default:
        return '忙碌中';
    }
  }

  /**
   * 设置昼夜循环系统
   */
  public setDayNightCycle(dayNightCycle: DayNightCycleSystem): void {
    this.dayNightCycle = dayNightCycle;
  }

  /**
   * 设置季节系统
   */
  public setSeasonSystem(seasonSystem: SeasonSystem): void {
    this.seasonSystem = seasonSystem;
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.schedules.clear();
    this.currentStatuses.clear();
  }
}
