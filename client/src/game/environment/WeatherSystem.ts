import * as BABYLON from '@babylonjs/core';
import { ParticleSystemManager } from '../effects/ParticleSystem';

/**
 * 天气类型
 */
export type WeatherType = 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
export type WeatherQuality = 'low' | 'medium' | 'high';

export interface WeatherPerformanceOptions {
  quality?: WeatherQuality;
}

export interface WeatherParticleBudget {
  maxParticles: number;
  emitRate: number;
  textureSize: number;
}

const WEATHER_PARTICLE_BUDGETS: Record<WeatherQuality, { snow: number; rain: number; textureSize: number }> = {
  low: { snow: 600, rain: 900, textureSize: 32 },
  medium: { snow: 1500, rain: 2500, textureSize: 48 },
  high: { snow: 3000, rain: 5000, textureSize: 64 },
};

export function disposeWeatherParticleResources(
  particleSystem: { dispose: () => void } | null,
  texture: { dispose: () => void } | null,
): void {
  particleSystem?.dispose();
  texture?.dispose();
}

export function getWeatherParticleBudget(
  type: Extract<WeatherType, 'snowy' | 'rainy'>,
  intensity: number,
  quality: WeatherQuality = 'medium',
): WeatherParticleBudget {
  const clampedIntensity = Math.min(1, Math.max(0, intensity));
  const budget = WEATHER_PARTICLE_BUDGETS[quality];
  const isSnow = type === 'snowy';
  return {
    maxParticles: budget[isSnow ? 'snow' : 'rain'],
    emitRate: isSnow ? 80 + clampedIntensity * 160 : 220 + clampedIntensity * 280,
    textureSize: budget.textureSize,
  };
}

/**
 * 天气配置
 */
export interface WeatherConfig {
  type: WeatherType;
  intensity: number; // 0-1
  windStrength: number; // 0-1
  windDirection: BABYLON.Vector3;
  duration: number; // 天气持续时间（秒）
}

/**
 * 天气系统
 * 管理游戏内的天气变化、降雨、降雪等效果
 */
export class WeatherSystem {
  private scene: BABYLON.Scene;
  private particleManager: ParticleSystemManager;
  private currentWeather: WeatherConfig;
  private weatherTimer: number = 0;
  private rainParticles: BABYLON.ParticleSystem | null = null;
  private snowParticles: BABYLON.ParticleSystem | null = null;
  private rainTexture: BABYLON.DynamicTexture | null = null;
  private snowTexture: BABYLON.DynamicTexture | null = null;
  private windForce: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
  private onWeatherChanged: ((weather: WeatherConfig) => void) | null = null;
  private isActive: boolean = false;
  private quality: WeatherQuality;
  private readonly emitterPosition = new BABYLON.Vector3(0, 50, 0);
  private lastEmitterX = Number.NaN;
  private lastEmitterZ = Number.NaN;

  constructor(
    scene: BABYLON.Scene,
    particleManager: ParticleSystemManager,
    options: WeatherPerformanceOptions = {},
  ) {
    this.scene = scene;
    this.particleManager = particleManager;
    this.quality = options.quality ?? 'medium';

    this.currentWeather = {
      type: 'clear',
      intensity: 0,
      windStrength: 0,
      windDirection: new BABYLON.Vector3(1, 0, 0),
      duration: 300,
    };
  }

  /**
   * 设置天气质量档位，不改变天气逻辑，只调整粒子预算。
   */
  public setQuality(quality: WeatherQuality): void {
    if (this.quality === quality) return;
    this.quality = quality;
    if (this.currentWeather.type === 'snowy' || this.currentWeather.type === 'rainy' || this.currentWeather.type === 'stormy') {
      this.applyWeather();
    }
  }

  public getQuality(): WeatherQuality {
    return this.quality;
  }

  /**
   * 设置天气
   */
  public setWeather(config: Partial<WeatherConfig>): void {
    this.currentWeather = {
      ...this.currentWeather,
      ...config,
    };

    this.weatherTimer = 0;
    this.applyWeather();

    if (this.onWeatherChanged) {
      this.onWeatherChanged(this.currentWeather);
    }
  }

  /**
   * 应用天气效果
   */
  private applyWeather(): void {
    // 清理现有效果
    this.clearWeatherEffects();

    const { type, intensity, windStrength, windDirection } = this.currentWeather;

    // 更新风力
    this.windForce = windDirection.scale(windStrength * 10);

    switch (type) {
      case 'clear':
        this.applyClearWeather();
        break;
      case 'cloudy':
        this.applyCloudyWeather();
        break;
      case 'rainy':
        this.applyRainyWeather(intensity);
        break;
      case 'stormy':
        this.applyStormyWeather(intensity);
        break;
      case 'snowy':
        this.applySnowyWeather(intensity);
        break;
    }
  }

  /**
   * 晴天效果
   */
  private applyClearWeather(): void {
    // 晴天没有特殊粒子效果
    // 光照已由 DayNightCycleSystem 处理
  }

  /**
   * 多云效果
   */
  private applyCloudyWeather(): void {
    // 多云时降低光照强度
    this.scene.lights.forEach((light) => {
      if (light instanceof BABYLON.DirectionalLight) {
        light.intensity *= 0.7;
      } else if (light instanceof BABYLON.HemisphericLight) {
        light.intensity *= 0.8;
      }
    });
  }

  /**
   * 下雨效果
   */
  private applyRainyWeather(intensity: number): void {
    // 降低光照
    this.scene.lights.forEach((light) => {
      if (light instanceof BABYLON.DirectionalLight) {
        light.intensity *= (0.5 - intensity * 0.2);
      } else if (light instanceof BABYLON.HemisphericLight) {
        light.intensity *= (0.6 - intensity * 0.2);
      }
    });

    // 创建雨粒子
    this.createRainParticles(intensity);
  }

  /**
   * 风暴效果
   */
  private applyStormyWeather(intensity: number): void {
    // 大幅降低光照
    this.scene.lights.forEach((light) => {
      if (light instanceof BABYLON.DirectionalLight) {
        light.intensity *= (0.3 - intensity * 0.2);
      } else if (light instanceof BABYLON.HemisphericLight) {
        light.intensity *= (0.4 - intensity * 0.2);
      }
    });

    // 创建密集的雨粒子
    this.createRainParticles(Math.min(1, intensity * 1.5));

    // 增加风力
    this.windForce = this.windForce.scale(1.5);
  }

  /**
   * 下雪效果
   */
  private applySnowyWeather(intensity: number): void {
    // 降低光照
    this.scene.lights.forEach((light) => {
      if (light instanceof BABYLON.DirectionalLight) {
        light.intensity *= (0.6 - intensity * 0.2);
      } else if (light instanceof BABYLON.HemisphericLight) {
        light.intensity *= (0.7 - intensity * 0.2);
      }
    });

    // 创建雪粒子
    this.createSnowParticles(intensity);
  }

  /**
   * 创建雨粒子
   */
  private createRainParticles(intensity: number): void {
    if (this.rainParticles) {
      this.rainParticles.dispose();
    }

    // 创建雨滴发射器
    const budget = getWeatherParticleBudget('rainy', intensity, this.quality);
    const particleSystem = new BABYLON.ParticleSystem('rainParticles', budget.maxParticles, this.scene);

    particleSystem.emitter = this.emitterPosition;
    this.rainTexture = new BABYLON.DynamicTexture('rainTexture', budget.textureSize, this.scene);
    particleSystem.particleTexture = this.rainTexture;

    // 粒子设置
    particleSystem.addColorGradient(0, new BABYLON.Color4(0.8, 0.9, 1, 0.8));
    particleSystem.addColorGradient(1, new BABYLON.Color4(0.8, 0.9, 1, 0));

    particleSystem.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
    particleSystem.maxEmitBox = new BABYLON.Vector3(100, 0, 100);

    particleSystem.minLifeTime = 2;
    particleSystem.maxLifeTime = 4;

    particleSystem.minEmitPower = 5 + intensity * 10;
    particleSystem.maxEmitPower = 10 + intensity * 15;

    particleSystem.emitRate = budget.emitRate;

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    particleSystem.gravity = new BABYLON.Vector3(0, -20, 0);

    particleSystem.start();
    this.rainParticles = particleSystem;
  }

  /**
   * 创建雪粒子
   */
  private createSnowParticles(intensity: number): void {
    if (this.snowParticles) {
      this.snowParticles.dispose();
    }

    // 创建雪花发射器
    const budget = getWeatherParticleBudget('snowy', intensity, this.quality);
    const particleSystem = new BABYLON.ParticleSystem('snowParticles', budget.maxParticles, this.scene);

    particleSystem.emitter = this.emitterPosition;
    this.snowTexture = new BABYLON.DynamicTexture('snowTexture', budget.textureSize, this.scene);
    particleSystem.particleTexture = this.snowTexture;

    // 粒子设置
    particleSystem.addColorGradient(0, new BABYLON.Color4(1, 1, 1, 0.9));
    particleSystem.addColorGradient(1, new BABYLON.Color4(1, 1, 1, 0));

    particleSystem.minEmitBox = new BABYLON.Vector3(-150, 0, -150);
    particleSystem.maxEmitBox = new BABYLON.Vector3(150, 0, 150);

    particleSystem.minLifeTime = 5;
    particleSystem.maxLifeTime = 10;

    particleSystem.minEmitPower = 1 + intensity * 3;
    particleSystem.maxEmitPower = 3 + intensity * 5;

    particleSystem.emitRate = budget.emitRate;

    particleSystem.minSize = 0.3;
    particleSystem.maxSize = 0.8;

    particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

    particleSystem.start();
    this.snowParticles = particleSystem;
  }

  /**
   * 清理天气效果
   */
  private clearWeatherEffects(): void {
    disposeWeatherParticleResources(this.rainParticles, this.rainTexture);
    this.rainParticles = null;
    this.rainTexture = null;

    disposeWeatherParticleResources(this.snowParticles, this.snowTexture);
    this.snowParticles = null;
    this.snowTexture = null;

    // 恢复光照
    this.scene.lights.forEach((light) => {
      if (light instanceof BABYLON.DirectionalLight) {
        light.intensity = 1;
      } else if (light instanceof BABYLON.HemisphericLight) {
        light.intensity = 0.5;
      }
    });
  }

  /**
   * 获取当前天气
   */
  public getCurrentWeather(): WeatherConfig {
    return { ...this.currentWeather };
  }

  /**
   * 获取风力
   */
  public getWindForce(): BABYLON.Vector3 {
    return this.windForce.clone();
  }

  /**
   * 设置天气变化回调
   */
  public setOnWeatherChanged(callback: (weather: WeatherConfig) => void): void {
    this.onWeatherChanged = callback;
  }

  /**
   * 启动天气系统
   */
  public start(): void {
    this.isActive = true;
  }

  /**
   * 停止天气系统
   */
  public stop(): void {
    this.isActive = false;
    this.clearWeatherEffects();
  }

  /**
   * 更新天气系统（每帧调用）
   */
  public update(deltaTime: number): void {
    if (!this.isActive) return;

    this.weatherTimer += deltaTime;

    // 如果天气持续时间已过，随机生成新天气
    if (this.weatherTimer >= this.currentWeather.duration) {
      this.generateRandomWeather();
    }

    // 更新粒子位置以跟随摄像机
    const camera = this.scene.activeCamera;
    if (camera) {
      const movedX = Number.isNaN(this.lastEmitterX) || Math.abs(camera.position.x - this.lastEmitterX) >= 0.5;
      const movedZ = Number.isNaN(this.lastEmitterZ) || Math.abs(camera.position.z - this.lastEmitterZ) >= 0.5;
      if (movedX || movedZ) {
        this.emitterPosition.copyFromFloats(camera.position.x, 50, camera.position.z);
        this.lastEmitterX = camera.position.x;
        this.lastEmitterZ = camera.position.z;
        if (this.rainParticles) this.rainParticles.emitter = this.emitterPosition;
        if (this.snowParticles) this.snowParticles.emitter = this.emitterPosition;
      }
    }
  }

  /**
   * 随机生成天气
   */
  private generateRandomWeather(): void {
    const weatherTypes: WeatherType[] = ['clear', 'cloudy', 'rainy', 'stormy', 'snowy'];
    const randomType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    const randomIntensity = Math.random();
    const randomDuration = 300 + Math.random() * 600; // 5-15 分钟

    this.setWeather({
      type: randomType,
      intensity: randomIntensity,
      duration: randomDuration,
    });
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.clearWeatherEffects();
  }
}
