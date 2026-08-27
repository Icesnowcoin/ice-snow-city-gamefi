import * as BABYLON from '@babylonjs/core';

/**
 * 游戏时间配置
 */
export interface GameTimeConfig {
  gameHourDuration: number; // 游戏内一小时对应的真实秒数
  startHour: number; // 游戏开始时的小时数 (0-23)
  sunriseHour: number; // 日出时间
  sunsetHour: number; // 日落时间
}

/**
 * 时间信息
 */
export interface TimeInfo {
  gameHour: number; // 0-23
  gameMinute: number; // 0-59
  gameSecond: number; // 0-59
  dayOfWeek: number; // 0-6
  dayOfMonth: number; // 1-30
  month: number; // 1-12
  year: number;
  isDaytime: boolean;
  timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening' | 'night';
}

/**
 * 昼夜循环系统
 * 管理游戏内的时间流逝、光照变化和昼夜交替
 */
export class DayNightCycleSystem {
  private scene: BABYLON.Scene;
  private config: GameTimeConfig;
  private elapsedTime: number = 0; // 累计经过的真实秒数
  private currentGameTime: number = 0; // 当前游戏时间（秒）
  private sunLight: BABYLON.Light | null = null;
  private moonLight: BABYLON.Light | null = null;
  private ambientLight: BABYLON.Light | null = null;
  private onTimeChanged: ((timeInfo: TimeInfo) => void) | null = null;
  private isRunning: boolean = false;

  constructor(scene: BABYLON.Scene, config: Partial<GameTimeConfig> = {}) {
    this.scene = scene;
    this.config = {
      gameHourDuration: 36, // 真实 36 秒 = 游戏 1 小时（100倍速）
      startHour: 6, // 早上 6 点开始
      sunriseHour: 6,
      sunsetHour: 18,
      ...config,
    };

    // 初始化游戏时间为开始时间
    this.currentGameTime = this.config.startHour * 3600;

    this.initializeLights();
  }

  /**
   * 初始化光源
   */
  private initializeLights(): void {
    // 移除现有光源
    this.scene.lights.forEach((light) => {
      if (light.name !== 'default light') {
        light.dispose();
      }
    });

    // 创建太阳光
    this.sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(0, -1, 1), this.scene);
    this.sunLight.intensity = 1;
    this.sunLight.range = 500;
    (this.sunLight as BABYLON.DirectionalLight).shadowMinZ = 0;
    (this.sunLight as BABYLON.DirectionalLight).shadowMaxZ = 1000;

    // 创建月光
    this.moonLight = new BABYLON.DirectionalLight('moonLight', new BABYLON.Vector3(0, -1, -1), this.scene);
    this.moonLight.intensity = 0;
    this.moonLight.range = 500;

    // 创建环境光
    this.ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, 0), this.scene);
    this.ambientLight.intensity = 0.5;
    (this.ambientLight as BABYLON.HemisphericLight).groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);

    this.updateLighting();
  }

  /**
   * 获取当前时间信息
   */
  public getTimeInfo(): TimeInfo {
    const totalSeconds = this.currentGameTime;
    const gameHour = Math.floor((totalSeconds / 3600) % 24);
    const gameMinute = Math.floor((totalSeconds % 3600) / 60);
    const gameSecond = Math.floor(totalSeconds % 60);

    const isDaytime = gameHour >= this.config.sunriseHour && gameHour < this.config.sunsetHour;
    let timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening' | 'night';

    if (gameHour >= 5 && gameHour < 7) timeOfDay = 'dawn';
    else if (gameHour >= 7 && gameHour < 11) timeOfDay = 'morning';
    else if (gameHour >= 11 && gameHour < 13) timeOfDay = 'noon';
    else if (gameHour >= 13 && gameHour < 17) timeOfDay = 'afternoon';
    else if (gameHour >= 17 && gameHour < 19) timeOfDay = 'dusk';
    else if (gameHour >= 19 && gameHour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const totalDays = Math.floor(totalSeconds / (24 * 3600));
    const dayOfWeek = totalDays % 7;
    const dayOfMonth = (totalDays % 30) + 1;
    const month = Math.floor(totalDays / 30) % 12 + 1;
    const year = Math.floor(totalDays / 365) + 1;

    return {
      gameHour,
      gameMinute,
      gameSecond,
      dayOfWeek,
      dayOfMonth,
      month,
      year,
      isDaytime,
      timeOfDay,
    };
  }

  /**
   * 更新光照
   */
  private updateLighting(): void {
    const timeInfo = this.getTimeInfo();
    const hour = timeInfo.gameHour;
    const minute = timeInfo.gameMinute;
    const hourProgress = (hour + minute / 60) / 24;

    if (!this.sunLight || !this.moonLight || !this.ambientLight) return;

    // 计算太阳角度（从东到西）
    const sunAngle = (hourProgress - 0.25) * Math.PI * 2; // 6:00 为东边
    const sunHeight = Math.sin(sunAngle);
    const sunDirection = new BABYLON.Vector3(
      Math.cos(sunAngle),
      Math.max(-0.1, sunHeight), // 防止太阳完全在地下
      Math.sin(sunAngle)
    );

    (this.sunLight as BABYLON.DirectionalLight).direction = sunDirection;

    // 根据时间调整太阳光强度
    let sunIntensity = 0;
    if (hour >= this.config.sunriseHour && hour < this.config.sunsetHour) {
      // 白天：根据时间渐变
      const timeFromSunrise = hour - this.config.sunriseHour + minute / 60;
      const timeToSunset = this.config.sunsetHour - hour - minute / 60;

      if (timeFromSunrise < 2) {
        // 日出后 2 小时内逐渐增亮
        sunIntensity = 0.3 + (timeFromSunrise / 2) * 0.7;
      } else if (timeToSunset < 2) {
        // 日落前 2 小时内逐渐变暗
        sunIntensity = 0.3 + (timeToSunset / 2) * 0.7;
      } else {
        // 中间时段保持最亮
        sunIntensity = 1.0;
      }
    }

    this.sunLight.intensity = sunIntensity;

    // 月光强度与太阳光相反
    const moonIntensity = Math.max(0, 0.3 - sunIntensity * 0.3);
    this.moonLight.intensity = moonIntensity;

    // 环境光随时间变化
    const ambientIntensity = 0.3 + sunIntensity * 0.4;
    this.ambientLight.intensity = ambientIntensity;

    // 调整天空颜色（通过环境光颜色）
    if (sunIntensity > 0.5) {
      // 白天：蓝色天空
      (this.ambientLight as BABYLON.HemisphericLight).groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    } else if (sunIntensity > 0.1) {
      // 黄昏/黎明：橙色/紫色
      const transitionFactor = sunIntensity / 0.5;
      (this.ambientLight as BABYLON.HemisphericLight).groundColor = new BABYLON.Color3(
        0.3 + transitionFactor * 0.2,
        0.2 + transitionFactor * 0.1,
        0.3 - transitionFactor * 0.1
      );
    } else {
      // 夜晚：深蓝色
      (this.ambientLight as BABYLON.HemisphericLight).groundColor = new BABYLON.Color3(0.1, 0.1, 0.2);
    }
  }

  /**
   * 设置时间变化回调
   */
  public setOnTimeChanged(callback: (timeInfo: TimeInfo) => void): void {
    this.onTimeChanged = callback;
  }

  /**
   * 启动昼夜循环
   */
  public start(): void {
    this.isRunning = true;
  }

  /**
   * 停止昼夜循环
   */
  public stop(): void {
    this.isRunning = false;
  }

  /**
   * 更新昼夜循环（每帧调用）
   */
  public update(deltaTime: number): void {
    if (!this.isRunning) return;

    this.elapsedTime += deltaTime;
    this.currentGameTime += deltaTime * (3600 / this.config.gameHourDuration);

    // 处理时间循环（24 小时 = 86400 秒）
    this.currentGameTime = this.currentGameTime % (24 * 3600);

    this.updateLighting();

    // 每秒检查一次是否需要触发时间变化事件
    if (Math.floor(this.elapsedTime) % 1 === 0) {
      const timeInfo = this.getTimeInfo();
      if (this.onTimeChanged) {
        this.onTimeChanged(timeInfo);
      }
    }
  }

  /**
   * 设置游戏时间
   */
  public setGameTime(hour: number, minute: number = 0, second: number = 0): void {
    this.currentGameTime = hour * 3600 + minute * 60 + second;
    this.updateLighting();
  }

  /**
   * 快进时间
   */
  public fastForwardHours(hours: number): void {
    this.currentGameTime += hours * 3600;
    this.currentGameTime = this.currentGameTime % (24 * 3600);
    this.updateLighting();
  }

  /**
   * 获取当前游戏时间（秒）
   */
  public getCurrentGameTime(): number {
    return this.currentGameTime;
  }

  /**
   * 获取时间进度（0-1）
   */
  public getTimeProgress(): number {
    return (this.currentGameTime / (24 * 3600)) % 1;
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    if (this.sunLight) this.sunLight.dispose();
    if (this.moonLight) this.moonLight.dispose();
    if (this.ambientLight) this.ambientLight.dispose();
  }
}
