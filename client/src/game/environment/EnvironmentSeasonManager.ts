import * as BABYLON from '@babylonjs/core';
import { Season, SeasonSystem } from './SeasonSystem';
import { WeatherSystem } from './WeatherSystem';
import { SkyboxSystem } from './SkyboxSystem';

/**
 * 环境季节变化管理器
 * 管理天气、天空和环境效果根据季节的变化
 */
export class EnvironmentSeasonManager {
  private seasonSystem: SeasonSystem;
  private weatherSystem: WeatherSystem;
  private skyboxSystem: SkyboxSystem;
  private scene: BABYLON.Scene;

  constructor(
    seasonSystem: SeasonSystem,
    weatherSystem: WeatherSystem,
    skyboxSystem: SkyboxSystem,
    scene: BABYLON.Scene
  ) {
    this.seasonSystem = seasonSystem;
    this.weatherSystem = weatherSystem;
    this.skyboxSystem = skyboxSystem;
    this.scene = scene;
  }

  /**
   * 应用季节天气特性
   */
  public applySeasonalWeather(season: Season): void {
    const config = this.seasonSystem.getSeasonConfig(season);
    if (!config) return;

    // 根据季节设置风力
    const windDirection = new BABYLON.Vector3(
      Math.sin(Math.random() * Math.PI * 2),
      0,
      Math.cos(Math.random() * Math.PI * 2)
    );

    this.weatherSystem.setWeather({
      windStrength: config.windStrength,
      windDirection,
    });

    // 根据季节设置降水概率
    if (Math.random() < config.precipitationChance) {
      const weatherTypes = this.getSeasonalWeatherTypes(season);
      const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

      this.weatherSystem.setWeather({
        type: randomWeather,
        intensity: 0.3 + Math.random() * 0.5,
        duration: 300 + Math.random() * 300,
      });
    } else {
      this.weatherSystem.setWeather({
        type: 'clear',
        intensity: 0,
      });
    }
  }

  /**
   * 获取季节特定的天气类型
   */
  private getSeasonalWeatherTypes(season: Season): Array<'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'> {
    switch (season) {
      case 'spring':
        return ['clear', 'cloudy', 'rainy'];
      case 'summer':
        return ['clear', 'cloudy', 'rainy', 'stormy'];
      case 'autumn':
        return ['clear', 'cloudy', 'rainy'];
      case 'winter':
        return ['clear', 'cloudy', 'snowy', 'stormy'];
      default:
        return ['clear', 'cloudy'];
    }
  }

  /**
   * 应用季节光照特性
   */
  public applySeasonalLighting(season: Season): void {
    const lights = this.scene.lights;

    lights.forEach((light) => {
      if (light instanceof BABYLON.HemisphericLight) {
        // 调整环境光
        switch (season) {
          case 'spring':
            light.intensity = 0.9;
            light.groundColor = new BABYLON.Color3(0.5, 0.6, 0.5);
            break;
          case 'summer':
            light.intensity = 1.0;
            light.groundColor = new BABYLON.Color3(0.4, 0.5, 0.4);
            break;
          case 'autumn':
            light.intensity = 0.85;
            light.groundColor = new BABYLON.Color3(0.6, 0.5, 0.4);
            break;
          case 'winter':
            light.intensity = 0.7;
            light.groundColor = new BABYLON.Color3(0.6, 0.6, 0.7);
            break;
        }
      }
    });
  }

  /**
   * 应用季节雾效
   */
  public applySeasonalFog(season: Season): void {
    switch (season) {
      case 'spring':
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        this.scene.fogStart = 50;
        this.scene.fogEnd = 500;
        break;
      case 'summer':
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogColor = new BABYLON.Color3(0.7, 0.8, 0.9);
        this.scene.fogStart = 100;
        this.scene.fogEnd = 800;
        break;
      case 'autumn':
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogColor = new BABYLON.Color3(0.85, 0.75, 0.65);
        this.scene.fogStart = 80;
        this.scene.fogEnd = 600;
        break;
      case 'winter':
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.95);
        this.scene.fogStart = 30;
        this.scene.fogEnd = 400;
        break;
    }
  }

  /**
   * 应用季节地面颜色
   */
  public applySeasonalGroundColor(season: Season): void {
    const groundMeshes = this.scene.meshes.filter((mesh) => mesh.name === 'ground' || mesh.name.includes('ground'));

    groundMeshes.forEach((mesh) => {
      const material = mesh.material as BABYLON.StandardMaterial;
      if (material) {
        switch (season) {
          case 'spring':
            material.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.4);
            break;
          case 'summer':
            material.emissiveColor = new BABYLON.Color3(0.3, 0.5, 0.2);
            break;
          case 'autumn':
            material.emissiveColor = new BABYLON.Color3(0.7, 0.6, 0.3);
            break;
          case 'winter':
            material.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            break;
        }
      }
    });
  }

  /**
   * 应用季节天空颜色
   */
  public applySeasonalSkyColor(season: Season): void {
    switch (season) {
      case 'spring':
        this.scene.clearColor = new BABYLON.Color4(0.7, 0.8, 0.9, 1);
        break;
      case 'summer':
        this.scene.clearColor = new BABYLON.Color4(0.6, 0.8, 1, 1);
        break;
      case 'autumn':
        this.scene.clearColor = new BABYLON.Color4(0.8, 0.7, 0.6, 1);
        break;
      case 'winter':
        this.scene.clearColor = new BABYLON.Color4(0.8, 0.85, 0.9, 1);
        break;
    }
  }

  /**
   * 应用季节温度效果（视觉）
   */
  public applySeasonalTemperatureEffect(season: Season): void {
    const config = this.seasonSystem.getSeasonConfig(season);
    if (!config) return;

    // 根据温度调整色温
    const colorShift = (config.temperature - 15) / 20; // 标准化到 -1 到 1

    // 冷色调（蓝色）用于冬季，暖色调（红色）用于夏季
    const colorAdjustment = new BABYLON.Color3(
      1 + colorShift * 0.2, // 红色通道
      1, // 绿色通道
      1 - colorShift * 0.2 // 蓝色通道
    );

    // 应用到所有材质
    this.scene.materials.forEach((material) => {
      if (material instanceof BABYLON.StandardMaterial) {
        const originalColor = material.emissiveColor.clone();
        material.emissiveColor = originalColor.multiply(colorAdjustment);
      }
    });
  }

  /**
   * 应用所有季节环境效果
   */
  public applyAllSeasonalEffects(season: Season): void {
    this.applySeasonalWeather(season);
    this.applySeasonalLighting(season);
    this.applySeasonalFog(season);
    this.applySeasonalGroundColor(season);
    this.applySeasonalSkyColor(season);
    this.applySeasonalTemperatureEffect(season);
  }

  /**
   * 获取季节名称
   */
  public getSeasonName(season: Season): string {
    return this.seasonSystem.getSeasonName(season);
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 环境管理器不需要特殊清理
  }
}
