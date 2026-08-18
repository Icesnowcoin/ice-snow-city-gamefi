import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { DayNightCycleSystem, TimeInfo } from './DayNightCycleSystem';
import { WeatherSystem, WeatherConfig } from './WeatherSystem';
import { SkyboxSystem } from './SkyboxSystem';
import { ParticleSystemManager } from '../effects/ParticleSystem';

describe('Environment Systems Integration Tests', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.Engine;
  let canvas: HTMLCanvasElement;
  let dayNightCycle: DayNightCycleSystem;
  let weatherSystem: WeatherSystem;
  let skyboxSystem: SkyboxSystem;
  let particleManager: ParticleSystemManager;

  beforeEach(() => {
    // 创建测试 Canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // 创建 Babylon.js 引擎和场景
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);

    // 创建粒子系统管理器
    particleManager = new ParticleSystemManager(scene);

    // 创建昼夜循环系统
    dayNightCycle = new DayNightCycleSystem(scene, {
      gameHourDuration: 36,
      startHour: 6,
      sunriseHour: 6,
      sunsetHour: 18,
    });

    // 创建天气系统
    weatherSystem = new WeatherSystem(scene, particleManager);

    // 创建天空盒系统
    skyboxSystem = new SkyboxSystem(scene);
  });

  afterEach(() => {
    dayNightCycle.dispose();
    weatherSystem.dispose();
    skyboxSystem.dispose();
    scene.dispose();
    engine.dispose();
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });

  describe('昼夜循环系统', () => {
    it('应该正确初始化时间信息', () => {
      const timeInfo = dayNightCycle.getTimeInfo();
      expect(timeInfo.gameHour).toBe(6);
      expect(timeInfo.gameMinute).toBe(0);
      expect(timeInfo.isDaytime).toBe(true);
      expect(timeInfo.timeOfDay).toBe('dawn');
    });

    it('应该正确更新时间', () => {
      dayNightCycle.start();
      dayNightCycle.update(36); // 更新 36 秒 = 1 小时

      const timeInfo = dayNightCycle.getTimeInfo();
      expect(timeInfo.gameHour).toBe(7);
    });

    it('应该支持设置游戏时间', () => {
      dayNightCycle.setGameTime(12, 30, 0);
      const timeInfo = dayNightCycle.getTimeInfo();

      expect(timeInfo.gameHour).toBe(12);
      expect(timeInfo.gameMinute).toBe(30);
    });

    it('应该支持快进时间', () => {
      dayNightCycle.fastForwardHours(6);
      const timeInfo = dayNightCycle.getTimeInfo();

      expect(timeInfo.gameHour).toBe(12);
    });

    it('应该正确处理时间循环（午夜后回到早上）', () => {
      dayNightCycle.setGameTime(23, 0, 0);
      dayNightCycle.fastForwardHours(2);

      const timeInfo = dayNightCycle.getTimeInfo();
      expect(timeInfo.gameHour).toBe(1);
    });

    it('应该正确识别昼夜时间', () => {
      dayNightCycle.setGameTime(12, 0, 0);
      let timeInfo = dayNightCycle.getTimeInfo();
      expect(timeInfo.isDaytime).toBe(true);

      dayNightCycle.setGameTime(0, 0, 0);
      timeInfo = dayNightCycle.getTimeInfo();
      expect(timeInfo.isDaytime).toBe(false);
    });

    it('应该正确识别一天中的时间段', () => {
      const testCases = [
        { hour: 5, expected: 'dawn' },
        { hour: 9, expected: 'morning' },
        { hour: 12, expected: 'noon' },
        { hour: 15, expected: 'afternoon' },
        { hour: 18, expected: 'dusk' },
        { hour: 20, expected: 'evening' },
        { hour: 2, expected: 'night' },
      ];

      testCases.forEach(({ hour, expected }) => {
        dayNightCycle.setGameTime(hour, 0, 0);
        const timeInfo = dayNightCycle.getTimeInfo();
        expect(timeInfo.timeOfDay).toBe(expected);
      });
    });

    it('应该支持时间变化回调', () => {
      let callbackCalled = false;
      let lastTimeInfo: TimeInfo | null = null;

      dayNightCycle.setOnTimeChanged((timeInfo) => {
        callbackCalled = true;
        lastTimeInfo = timeInfo;
      });

      dayNightCycle.start();
      dayNightCycle.update(1);

      expect(callbackCalled).toBe(true);
      expect(lastTimeInfo).not.toBeNull();
    });

    it('应该正确计算时间进度', () => {
      dayNightCycle.setGameTime(6, 0, 0);
      expect(dayNightCycle.getTimeProgress()).toBeCloseTo(0.25, 2);

      dayNightCycle.setGameTime(12, 0, 0);
      expect(dayNightCycle.getTimeProgress()).toBeCloseTo(0.5, 2);

      dayNightCycle.setGameTime(18, 0, 0);
      expect(dayNightCycle.getTimeProgress()).toBeCloseTo(0.75, 2);
    });
  });

  describe('天气系统', () => {
    it('应该正确初始化天气', () => {
      const weather = weatherSystem.getCurrentWeather();
      expect(weather.type).toBe('clear');
      expect(weather.intensity).toBe(0);
    });

    it('应该支持设置天气', () => {
      weatherSystem.setWeather({
        type: 'rainy',
        intensity: 0.8,
        duration: 600,
      });

      const weather = weatherSystem.getCurrentWeather();
      expect(weather.type).toBe('rainy');
      expect(weather.intensity).toBe(0.8);
    });

    it('应该支持所有天气类型', () => {
      const weatherTypes = ['clear', 'cloudy', 'rainy', 'stormy', 'snowy'];

      weatherTypes.forEach((type) => {
        weatherSystem.setWeather({ type: type as any });
        const weather = weatherSystem.getCurrentWeather();
        expect(weather.type).toBe(type);
      });
    });

    it('应该支持天气变化回调', () => {
      let callbackCalled = false;
      let lastWeather: WeatherConfig | null = null;

      weatherSystem.setOnWeatherChanged((weather) => {
        callbackCalled = true;
        lastWeather = weather;
      });

      weatherSystem.setWeather({ type: 'rainy', intensity: 0.5 });

      expect(callbackCalled).toBe(true);
      expect(lastWeather?.type).toBe('rainy');
    });

    it('应该正确计算风力', () => {
      weatherSystem.setWeather({
        windStrength: 0.5,
        windDirection: new BABYLON.Vector3(1, 0, 0),
      });

      const wind = weatherSystem.getWindForce();
      expect(wind.x).toBeGreaterThan(0);
    });

    it('应该支持随机天气生成', () => {
      weatherSystem.start();
      weatherSystem.update(1000); // 更新超过默认天气持续时间

      const weather = weatherSystem.getCurrentWeather();
      expect(weather).toBeDefined();
    });
  });

  describe('天空盒系统', () => {
    it('应该正确初始化天空盒', () => {
      const skyColor = skyboxSystem.getSkyColor();
      expect(skyColor).toBeDefined();
      expect(skyColor.r).toBeGreaterThanOrEqual(0);
      expect(skyColor.r).toBeLessThanOrEqual(1);
    });

    it('应该根据时间更新天空颜色', () => {
      // 中午
      skyboxSystem.updateSkyColor(0.5);
      let skyColor = skyboxSystem.getSkyColor();
      const noonColor = skyColor.clone();

      // 午夜
      skyboxSystem.updateSkyColor(0);
      skyColor = skyboxSystem.getSkyColor();
      const midnightColor = skyColor.clone();

      // 中午应该比午夜更亮
      const noonBrightness = noonColor.r + noonColor.g + noonColor.b;
      const midnightBrightness = midnightColor.r + midnightColor.g + midnightColor.b;
      expect(noonBrightness).toBeGreaterThan(midnightBrightness);
    });

    it('应该支持天气调整', () => {
      skyboxSystem.updateSkyColor(0.5); // 中午
      skyboxSystem.adjustForWeather('rainy', 0.8);

      const skyColor = skyboxSystem.getSkyColor();
      expect(skyColor).toBeDefined();
    });

    it('应该正确跟踪时间进度', () => {
      skyboxSystem.updateSkyColor(0.25);
      expect(skyboxSystem.getTimeProgress()).toBeCloseTo(0.25, 2);

      skyboxSystem.updateSkyColor(0.75);
      expect(skyboxSystem.getTimeProgress()).toBeCloseTo(0.75, 2);
    });
  });

  describe('集成测试', () => {
    it('应该支持昼夜循环和天气系统的协同工作', () => {
      dayNightCycle.start();
      weatherSystem.start();

      // 模拟 10 秒的游戏时间
      for (let i = 0; i < 10; i++) {
        dayNightCycle.update(1);
        weatherSystem.update(1);
        skyboxSystem.update();
      }

      const timeInfo = dayNightCycle.getTimeInfo();
      const weather = weatherSystem.getCurrentWeather();
      const skyColor = skyboxSystem.getSkyColor();

      expect(timeInfo).toBeDefined();
      expect(weather).toBeDefined();
      expect(skyColor).toBeDefined();
    });

    it('应该正确处理完整的游戏日循环', () => {
      dayNightCycle.setGameTime(0, 0, 0);
      dayNightCycle.start();

      // 模拟 24 小时的游戏时间
      const secondsIn24Hours = 24 * 3600;
      const deltaTime = 36; // 每次更新 36 秒 = 1 小时
      const iterations = secondsIn24Hours / deltaTime;

      for (let i = 0; i < iterations; i++) {
        dayNightCycle.update(deltaTime);
      }

      const timeInfo = dayNightCycle.getTimeInfo();
      // 应该回到接近午夜（23 点或 0 点）
      expect(timeInfo.gameHour === 23 || timeInfo.gameHour === 0).toBe(true);
    });

    it('应该支持环境系统的启动和停止', () => {
      dayNightCycle.start();
      weatherSystem.start();

      dayNightCycle.update(10);
      weatherSystem.update(10);

      dayNightCycle.stop();
      weatherSystem.stop();

      // 停止后更新应该不改变状态
      const timeInfoBefore = dayNightCycle.getTimeInfo();
      dayNightCycle.update(10);
      const timeInfoAfter = dayNightCycle.getTimeInfo();

      expect(timeInfoBefore.gameHour).toBe(timeInfoAfter.gameHour);
    });
  });
});
