import { describe, it, expect, beforeEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { SeasonSystem, Season } from './SeasonSystem';
import { VegetationSeasonManager } from './VegetationSeasonManager';
import { BuildingSeasonManager } from './BuildingSeasonManager';
import { EnvironmentSeasonManager } from './EnvironmentSeasonManager';
import { WeatherSystem } from './WeatherSystem';
import { SkyboxSystem } from './SkyboxSystem';
import { ParticleSystemManager } from '../effects/ParticleSystem';

describe('Season System Tests', () => {
  let seasonSystem: SeasonSystem;
  let scene: BABYLON.Scene;
  let engine: BABYLON.Engine;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // 创建测试 Canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // 创建 Babylon.js 引擎和场景
    engine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      deterministicLockstep: true,
    });
    scene = new BABYLON.Scene(engine);

    // 创建季节系统
    seasonSystem = new SeasonSystem();
  });

  describe('SeasonSystem', () => {
    it('应该正确初始化', () => {
      expect(seasonSystem.getCurrentSeason()).toBe('spring');
      expect(seasonSystem.getCurrentMonth()).toBe(3);
      expect(seasonSystem.getCurrentDay()).toBe(1);
    });

    it('应该正确设置日期', () => {
      seasonSystem.setDate(6, 15);
      expect(seasonSystem.getCurrentMonth()).toBe(6);
      expect(seasonSystem.getCurrentDay()).toBe(15);
      expect(seasonSystem.getCurrentSeason()).toBe('summer');
    });

    it('应该正确识别所有季节', () => {
      const testCases = [
        { month: 3, expected: 'spring' },
        { month: 6, expected: 'summer' },
        { month: 9, expected: 'autumn' },
        { month: 12, expected: 'winter' },
      ];

      testCases.forEach(({ month, expected }) => {
        seasonSystem.setDate(month, 1);
        expect(seasonSystem.getCurrentSeason()).toBe(expected as Season);
      });
    });

    it('应该支持快进到下一个季节', () => {
      seasonSystem.setDate(3, 1);
      expect(seasonSystem.getCurrentSeason()).toBe('spring');

      seasonSystem.advanceToNextSeason();
      expect(seasonSystem.getCurrentSeason()).toBe('summer');

      seasonSystem.advanceToNextSeason();
      expect(seasonSystem.getCurrentSeason()).toBe('autumn');

      seasonSystem.advanceToNextSeason();
      expect(seasonSystem.getCurrentSeason()).toBe('winter');

      seasonSystem.advanceToNextSeason();
      expect(seasonSystem.getCurrentSeason()).toBe('spring');
    });

    it('应该正确获取季节配置', () => {
      const springConfig = seasonSystem.getSeasonConfig('spring');
      expect(springConfig).toBeDefined();
      expect(springConfig?.temperature).toBe(15);
      expect(springConfig?.humidity).toBe(60);
    });

    it('应该正确获取植被季节外观', () => {
      const springAppearance = seasonSystem.getVegetationAppearance('spring');
      expect(springAppearance).toBeDefined();
      expect(springAppearance?.season).toBe('spring');
      expect(springAppearance?.particleIntensity).toBeGreaterThan(0);
    });

    it('应该正确获取建筑季节外观', () => {
      const winterAppearance = seasonSystem.getBuildingAppearance('winter');
      expect(winterAppearance).toBeDefined();
      expect(winterAppearance?.season).toBe('winter');
      expect(winterAppearance?.snowCoverage).toBeGreaterThan(0);
    });

    it('应该支持季节变化回调', () => {
      let callbackCalled = false;
      let changedSeason: Season | null = null;

      seasonSystem.setOnSeasonChanged((season) => {
        callbackCalled = true;
        changedSeason = season;
      });

      seasonSystem.setDate(6, 1);

      expect(callbackCalled).toBe(true);
      expect(changedSeason).toBe('summer');
    });

    it('应该正确计算季节过渡进度', () => {
      seasonSystem.setDate(3, 1);
      expect(seasonSystem.getTransitionProgress()).toBeCloseTo(0, 1);

      seasonSystem.setDate(3, 45); // 季节中期
      expect(seasonSystem.getTransitionProgress()).toBeGreaterThan(0.3);
      expect(seasonSystem.getTransitionProgress()).toBeLessThan(0.7);
    });

    it('应该获取本地化的季节名称', () => {
      expect(seasonSystem.getSeasonName('spring')).toBe('春季');
      expect(seasonSystem.getSeasonName('summer')).toBe('夏季');
      expect(seasonSystem.getSeasonName('autumn')).toBe('秋季');
      expect(seasonSystem.getSeasonName('winter')).toBe('冬季');
    });

    it('应该获取所有季节配置', () => {
      const allConfigs = seasonSystem.getAllSeasonConfigs();
      expect(allConfigs.length).toBe(4);
      expect(allConfigs.map((c) => c.name)).toContain('spring');
      expect(allConfigs.map((c) => c.name)).toContain('summer');
      expect(allConfigs.map((c) => c.name)).toContain('autumn');
      expect(allConfigs.map((c) => c.name)).toContain('winter');
    });

    it('应该支持颜色插值', () => {
      const color1 = new BABYLON.Color3(1, 0, 0); // 红色
      const color2 = new BABYLON.Color3(0, 0, 1); // 蓝色

      const midColor = seasonSystem.getTransitionColor(color1, color2, 0.5);

      expect(midColor.r).toBeCloseTo(0.5, 1);
      expect(midColor.g).toBeCloseTo(0, 1);
      expect(midColor.b).toBeCloseTo(0.5, 1);
    });
  });

  describe('VegetationSeasonManager', () => {
    it('应该正确注册植被', () => {
      const particleManager = new ParticleSystemManager(scene);
      const vegManager = new VegetationSeasonManager(seasonSystem, particleManager);

      const mesh = BABYLON.MeshBuilder.CreateBox('test_veg', { size: 1 }, scene);
      vegManager.registerVegetation(mesh);

      // 应该不抛出错误
      expect(mesh).toBeDefined();

      vegManager.dispose();
    });
  });

  describe('BuildingSeasonManager', () => {
    it('应该正确注册建筑', () => {
      const buildingManager = new BuildingSeasonManager(seasonSystem);

      const mesh = BABYLON.MeshBuilder.CreateBox('test_building', { size: 2 }, scene);
      buildingManager.registerBuilding(mesh);

      // 应该不抛出错误
      expect(mesh).toBeDefined();

      buildingManager.dispose();
    });

    it('应该正确应用冬季积雪效果', () => {
      const buildingManager = new BuildingSeasonManager(seasonSystem);

      const mesh = BABYLON.MeshBuilder.CreateBox('test_building', { size: 2 }, scene);
      buildingManager.registerBuilding(mesh);

      const winterAppearance = seasonSystem.getBuildingAppearance('winter');
      if (winterAppearance) {
        buildingManager.applySeasonalAppearance(mesh, winterAppearance);
      }

      expect(mesh).toBeDefined();

      buildingManager.dispose();
    });
  });

  describe('EnvironmentSeasonManager', () => {
    it('应该正确初始化', () => {
      const particleManager = new ParticleSystemManager(scene);
      const weatherSystem = new WeatherSystem(scene, particleManager);
      const skyboxSystem = new SkyboxSystem(scene);

      const envManager = new EnvironmentSeasonManager(
        seasonSystem,
        weatherSystem,
        skyboxSystem,
        scene
      );

      expect(envManager).toBeDefined();

      envManager.dispose();
      weatherSystem.dispose();
      skyboxSystem.dispose();
    });

    it('应该应用季节天气特性', () => {
      const particleManager = new ParticleSystemManager(scene);
      const weatherSystem = new WeatherSystem(scene, particleManager);
      const skyboxSystem = new SkyboxSystem(scene);

      const envManager = new EnvironmentSeasonManager(
        seasonSystem,
        weatherSystem,
        skyboxSystem,
        scene
      );

      envManager.applySeasonalWeather('summer');
      expect(weatherSystem.getCurrentWeather()).toBeDefined();

      envManager.dispose();
      weatherSystem.dispose();
      skyboxSystem.dispose();
    });

    it('应该应用所有季节环境效果', () => {
      const particleManager = new ParticleSystemManager(scene);
      const weatherSystem = new WeatherSystem(scene, particleManager);
      const skyboxSystem = new SkyboxSystem(scene);

      const envManager = new EnvironmentSeasonManager(
        seasonSystem,
        weatherSystem,
        skyboxSystem,
        scene
      );

      // 应该不抛出错误
      envManager.applyAllSeasonalEffects('spring');
      envManager.applyAllSeasonalEffects('summer');
      envManager.applyAllSeasonalEffects('autumn');
      envManager.applyAllSeasonalEffects('winter');

      expect(scene.clearColor).toBeDefined();

      envManager.dispose();
      weatherSystem.dispose();
      skyboxSystem.dispose();
    });
  });

  describe('季节系统集成', () => {
    it('应该支持完整的季节循环', () => {
      let seasonChangeCount = 0;

      seasonSystem.setOnSeasonChanged(() => {
        seasonChangeCount++;
      });

      const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

      seasons.forEach((season, index) => {
        const month = (index + 1) * 3;
        seasonSystem.setDate(month, 1);
      });

      expect(seasonChangeCount).toBe(3); // 从 spring 变化 3 次
    });

    it('应该正确处理季节过渡', () => {
      seasonSystem.setDate(3, 1);
      const startProgress = seasonSystem.getTransitionProgress();

      seasonSystem.setDate(3, 45);
      const midProgress = seasonSystem.getTransitionProgress();

      seasonSystem.setDate(5, 30);
      const endProgress = seasonSystem.getTransitionProgress();

      expect(startProgress).toBeLessThan(midProgress);
      expect(midProgress).toBeLessThan(endProgress);
    });
  });
});
