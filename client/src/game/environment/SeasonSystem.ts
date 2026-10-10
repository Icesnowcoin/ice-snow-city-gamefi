import * as BABYLON from '@babylonjs/core';

/**
 * 季节类型
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * 季节配置
 */
export interface SeasonConfig {
  name: Season;
  monthStart: number; // 季节开始月份 (1-12)
  monthEnd: number; // 季节结束月份 (1-12)
  temperature: number; // 平均温度（摄氏度）
  humidity: number; // 湿度 (0-100)
  windStrength: number; // 风力 (0-1)
  precipitationChance: number; // 降水概率 (0-1)
}

/**
 * 植被季节外观
 */
export interface VegetationSeasonalAppearance {
  season: Season;
  foliageColor: BABYLON.Color3; // 叶子颜色
  foliageAlpha: number; // 叶子透明度
  trunkColor: BABYLON.Color3; // 树干颜色
  scale: number; // 缩放因子
  particleIntensity: number; // 粒子强度（落叶等）
}

/**
 * 建筑季节外观
 */
export interface BuildingSeasonalAppearance {
  season: Season;
  roofColor: BABYLON.Color3; // 屋顶颜色
  wallColor: BABYLON.Color3; // 墙壁颜色
  snowCoverage: number; // 积雪覆盖率 (0-1)
  iceFormation: number; // 结冰程度 (0-1)
}

/**
 * 季节系统
 * 管理游戏内的季节变化、植被颜色、天气特性等
 */
export class SeasonSystem {
  private currentSeason: Season = 'spring';
  private currentMonth: number = 3; // 1-12
  private currentDay: number = 1; // 1-30
  private seasonConfigs: Map<Season, SeasonConfig>;
  private vegetationAppearances: Map<Season, VegetationSeasonalAppearance>;
  private buildingAppearances: Map<Season, BuildingSeasonalAppearance>;
  private onSeasonChanged: ((season: Season) => void) | null = null;
  private transitionProgress: number = 0; // 0-1，季节过渡进度

  constructor() {
    this.seasonConfigs = this.initializeSeasonConfigs();
    this.vegetationAppearances = this.initializeVegetationAppearances();
    this.buildingAppearances = this.initializeBuildingAppearances();
  }

  /**
   * 初始化季节配置
   */
  private initializeSeasonConfigs(): Map<Season, SeasonConfig> {
    return new Map([
      [
        'spring',
        {
          name: 'spring',
          monthStart: 3,
          monthEnd: 5,
          temperature: 15,
          humidity: 60,
          windStrength: 0.4,
          precipitationChance: 0.4,
        },
      ],
      [
        'summer',
        {
          name: 'summer',
          monthStart: 6,
          monthEnd: 8,
          temperature: 28,
          humidity: 70,
          windStrength: 0.3,
          precipitationChance: 0.5,
        },
      ],
      [
        'autumn',
        {
          name: 'autumn',
          monthStart: 9,
          monthEnd: 11,
          temperature: 18,
          humidity: 55,
          windStrength: 0.5,
          precipitationChance: 0.3,
        },
      ],
      [
        'winter',
        {
          name: 'winter',
          monthStart: 12,
          monthEnd: 2,
          temperature: 5,
          humidity: 50,
          windStrength: 0.6,
          precipitationChance: 0.6,
        },
      ],
    ]);
  }

  /**
   * 初始化植被季节外观
   */
  private initializeVegetationAppearances(): Map<Season, VegetationSeasonalAppearance> {
    return new Map([
      [
        'spring',
        {
          season: 'spring',
          foliageColor: new BABYLON.Color3(0.4, 0.8, 0.3), // 浅绿色
          foliageAlpha: 0.8,
          trunkColor: new BABYLON.Color3(0.5, 0.3, 0.1),
          scale: 0.9,
          particleIntensity: 0.3, // 花粉
        },
      ],
      [
        'summer',
        {
          season: 'summer',
          foliageColor: new BABYLON.Color3(0.2, 0.7, 0.1), // 深绿色
          foliageAlpha: 1.0,
          trunkColor: new BABYLON.Color3(0.4, 0.2, 0.05),
          scale: 1.0,
          particleIntensity: 0.1,
        },
      ],
      [
        'autumn',
        {
          season: 'autumn',
          foliageColor: new BABYLON.Color3(1, 0.6, 0.1), // 金黄色
          foliageAlpha: 0.9,
          trunkColor: new BABYLON.Color3(0.5, 0.3, 0.1),
          scale: 0.95,
          particleIntensity: 0.7, // 落叶
        },
      ],
      [
        'winter',
        {
          season: 'winter',
          foliageColor: new BABYLON.Color3(0.3, 0.3, 0.3), // 灰色
          foliageAlpha: 0.5,
          trunkColor: new BABYLON.Color3(0.4, 0.2, 0.05),
          scale: 0.85,
          particleIntensity: 0.8, // 雪花
        },
      ],
    ]);
  }

  /**
   * 初始化建筑季节外观
   */
  private initializeBuildingAppearances(): Map<Season, BuildingSeasonalAppearance> {
    return new Map([
      [
        'spring',
        {
          season: 'spring',
          roofColor: new BABYLON.Color3(0.6, 0.3, 0.1),
          wallColor: new BABYLON.Color3(0.52, 0.62, 0.72),
          snowCoverage: 0,
          iceFormation: 0,
        },
      ],
      [
        'summer',
        {
          season: 'summer',
          roofColor: new BABYLON.Color3(0.5, 0.25, 0.05),
          wallColor: new BABYLON.Color3(0.62, 0.7, 0.8),
          snowCoverage: 0,
          iceFormation: 0,
        },
      ],
      [
        'autumn',
        {
          season: 'autumn',
          roofColor: new BABYLON.Color3(0.7, 0.4, 0.15),
          wallColor: new BABYLON.Color3(0.64, 0.58, 0.52),
          snowCoverage: 0,
          iceFormation: 0,
        },
      ],
      [
        'winter',
        {
          season: 'winter',
          roofColor: new BABYLON.Color3(0.4, 0.4, 0.4),
          wallColor: new BABYLON.Color3(0.8, 0.8, 0.8),
          snowCoverage: 0.7,
          iceFormation: 0.5,
        },
      ],
    ]);
  }

  /**
   * 根据月份获取当前季节
   */
  private getSeasonFromMonth(month: number): Season {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * 设置游戏日期
   */
  public setDate(month: number, day: number): void {
    this.currentMonth = Math.max(1, Math.min(12, month));
    this.currentDay = Math.max(1, Math.min(30, day));

    const newSeason = this.getSeasonFromMonth(this.currentMonth);
    if (newSeason !== this.currentSeason) {
      this.currentSeason = newSeason;
      this.transitionProgress = 0;

      if (this.onSeasonChanged) {
        this.onSeasonChanged(this.currentSeason);
      }
    }

    // 计算季节过渡进度
    const config = this.seasonConfigs.get(this.currentSeason);
    if (config) {
      const seasonStart = config.monthStart;
      const daysIntoSeason = (this.currentMonth - seasonStart) * 30 + this.currentDay;
      this.transitionProgress = Math.min(1, daysIntoSeason / 90); // 3 个月 = 90 天
    }
  }

  /**
   * 获取当前季节
   */
  public getCurrentSeason(): Season {
    return this.currentSeason;
  }

  /**
   * 获取当前月份
   */
  public getCurrentMonth(): number {
    return this.currentMonth;
  }

  /**
   * 获取当前日期
   */
  public getCurrentDay(): number {
    return this.currentDay;
  }

  /**
   * 获取季节配置
   */
  public getSeasonConfig(season: Season): SeasonConfig | undefined {
    return this.seasonConfigs.get(season);
  }

  /**
   * 获取植被季节外观
   */
  public getVegetationAppearance(season: Season): VegetationSeasonalAppearance | undefined {
    return this.vegetationAppearances.get(season);
  }

  /**
   * 获取建筑季节外观
   */
  public getBuildingAppearance(season: Season): BuildingSeasonalAppearance | undefined {
    return this.buildingAppearances.get(season);
  }

  /**
   * 获取过渡颜色（用于季节过渡）
   */
  public getTransitionColor(
    fromColor: BABYLON.Color3,
    toColor: BABYLON.Color3,
    progress: number
  ): BABYLON.Color3 {
    return BABYLON.Color3.Lerp(fromColor, toColor, progress);
  }

  /**
   * 获取季节过渡进度
   */
  public getTransitionProgress(): number {
    return this.transitionProgress;
  }

  /**
   * 设置季节变化回调
   */
  public setOnSeasonChanged(callback: (season: Season) => void): void {
    this.onSeasonChanged = callback;
  }

  /**
   * 快进到下一个季节
   */
  public advanceToNextSeason(): void {
    let nextMonth = this.currentMonth + 3;
    if (nextMonth > 12) {
      nextMonth -= 12;
    }
    this.setDate(nextMonth, 1);
  }

  /**
   * 获取季节名称（本地化）
   */
  public getSeasonName(season: Season): string {
    const names: Record<Season, string> = {
      spring: '春季',
      summer: '夏季',
      autumn: '秋季',
      winter: '冬季',
    };
    return names[season];
  }

  /**
   * 获取所有季节配置
   */
  public getAllSeasonConfigs(): SeasonConfig[] {
    return Array.from(this.seasonConfigs.values());
  }
}
