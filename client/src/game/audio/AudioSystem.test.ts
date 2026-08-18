import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager, AudioConfig, AudioType } from './AudioManager';
import { SeasonalAudioManager } from './SeasonalAudioManager';
import { WeatherAudioManager } from './WeatherAudioManager';
import { EnvironmentalAudioManager } from './EnvironmentalAudioManager';

describe('Audio System Tests', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
  });

  afterEach(() => {
    audioManager.dispose();
  });

  describe('AudioManager', () => {
    it('应该正确初始化', () => {
      expect(audioManager).toBeDefined();
    });

    it('应该支持播放音效', () => {
      const config: AudioConfig = {
        id: 'test_audio',
        type: 'sfx',
        url: '/audio/test.mp3',
        volume: 0.5,
        loop: false,
      };

      audioManager.playAudio(config);
      const state = audioManager.getPlaybackState('test_audio');

      expect(state).toBeDefined();
      expect(state?.isPlaying).toBe(true);
    });

    it('应该支持停止音效', () => {
      const config: AudioConfig = {
        id: 'test_audio',
        type: 'sfx',
        url: '/audio/test.mp3',
        volume: 0.5,
        loop: false,
      };

      audioManager.playAudio(config);
      audioManager.stopAudio('test_audio');

      const state = audioManager.getPlaybackState('test_audio');
      expect(state?.isPlaying).toBe(false);
    });

    it('应该支持暂停和恢复', () => {
      const config: AudioConfig = {
        id: 'test_audio',
        type: 'sfx',
        url: '/audio/test.mp3',
        volume: 0.5,
        loop: false,
      };

      audioManager.playAudio(config);
      audioManager.pauseAudio('test_audio');

      let state = audioManager.getPlaybackState('test_audio');
      expect(state?.isPlaying).toBe(false);

      audioManager.resumeAudio('test_audio');
      state = audioManager.getPlaybackState('test_audio');
      expect(state?.isPlaying).toBe(true);
    });

    it('应该支持音量控制', () => {
      const config: AudioConfig = {
        id: 'test_audio',
        type: 'sfx',
        url: '/audio/test.mp3',
        volume: 0.5,
        loop: false,
      };

      audioManager.playAudio(config);
      audioManager.setVolume('test_audio', 0.8);

      const state = audioManager.getPlaybackState('test_audio');
      expect(state?.volume).toBeCloseTo(0.8, 1);
    });

    it('应该支持类型音量控制', () => {
      audioManager.setTypeVolume('music', 0.6);
      audioManager.setTypeVolume('sfx', 0.8);

      // 应该不抛出错误
      expect(audioManager).toBeDefined();
    });

    it('应该支持主音量控制', () => {
      audioManager.setMasterVolume(0.5);

      // 应该不抛出错误
      expect(audioManager).toBeDefined();
    });

    it('应该支持停止所有音效', () => {
      const config1: AudioConfig = {
        id: 'audio_1',
        type: 'sfx',
        url: '/audio/test1.mp3',
        volume: 0.5,
        loop: false,
      };

      const config2: AudioConfig = {
        id: 'audio_2',
        type: 'music',
        url: '/audio/test2.mp3',
        volume: 0.5,
        loop: true,
      };

      audioManager.playAudio(config1);
      audioManager.playAudio(config2);

      audioManager.stopAllAudio();

      const state1 = audioManager.getPlaybackState('audio_1');
      const state2 = audioManager.getPlaybackState('audio_2');

      expect(state1?.isPlaying).toBe(false);
      expect(state2?.isPlaying).toBe(false);
    });
  });

  describe('SeasonalAudioManager', () => {
    let seasonalAudioManager: SeasonalAudioManager;

    beforeEach(() => {
      seasonalAudioManager = new SeasonalAudioManager(audioManager);
    });

    afterEach(() => {
      seasonalAudioManager.dispose();
    });

    it('应该正确初始化', () => {
      expect(seasonalAudioManager.getCurrentSeason()).toBe('spring');
    });

    it('应该支持季节切换', () => {
      seasonalAudioManager.changeSeason('summer');
      expect(seasonalAudioManager.getCurrentSeason()).toBe('summer');

      seasonalAudioManager.changeSeason('autumn');
      expect(seasonalAudioManager.getCurrentSeason()).toBe('autumn');

      seasonalAudioManager.changeSeason('winter');
      expect(seasonalAudioManager.getCurrentSeason()).toBe('winter');
    });

    it('应该获取季节配置', () => {
      const config = seasonalAudioManager.getSeasonalConfig('spring');
      expect(config).toBeDefined();
      expect(config?.season).toBe('spring');
    });

    it('应该支持暂停和恢复', () => {
      seasonalAudioManager.changeSeason('summer');
      seasonalAudioManager.pauseAll();

      // 应该不抛出错误
      expect(seasonalAudioManager).toBeDefined();

      seasonalAudioManager.resumeAll();
      expect(seasonalAudioManager).toBeDefined();
    });
  });

  describe('WeatherAudioManager', () => {
    let weatherAudioManager: WeatherAudioManager;

    beforeEach(() => {
      weatherAudioManager = new WeatherAudioManager(audioManager);
    });

    afterEach(() => {
      weatherAudioManager.dispose();
    });

    it('应该正确初始化', () => {
      expect(weatherAudioManager.getCurrentWeather()).toBe('clear');
    });

    it('应该支持天气切换', () => {
      weatherAudioManager.changeWeather('rainy');
      expect(weatherAudioManager.getCurrentWeather()).toBe('rainy');

      weatherAudioManager.changeWeather('stormy');
      expect(weatherAudioManager.getCurrentWeather()).toBe('stormy');

      weatherAudioManager.changeWeather('snowy');
      expect(weatherAudioManager.getCurrentWeather()).toBe('snowy');
    });

    it('应该获取天气配置', () => {
      const config = weatherAudioManager.getWeatherConfig('rainy');
      expect(config).toBeDefined();
      expect(config?.weather).toBe('rainy');
    });

    it('应该支持随机雷声', () => {
      weatherAudioManager.changeWeather('stormy');
      weatherAudioManager.playRandomThunder();

      // 应该不抛出错误
      expect(weatherAudioManager).toBeDefined();
    });
  });

  describe('EnvironmentalAudioManager', () => {
    let environmentalAudioManager: EnvironmentalAudioManager;

    beforeEach(() => {
      environmentalAudioManager = new EnvironmentalAudioManager(audioManager);
    });

    afterEach(() => {
      environmentalAudioManager.dispose();
    });

    it('应该正确初始化', () => {
      expect(environmentalAudioManager.getCurrentTimeOfDay()).toBe('morning');
    });

    it('应该支持时间段切换', () => {
      environmentalAudioManager.changeTimeOfDay('noon');
      expect(environmentalAudioManager.getCurrentTimeOfDay()).toBe('noon');

      environmentalAudioManager.changeTimeOfDay('dusk');
      expect(environmentalAudioManager.getCurrentTimeOfDay()).toBe('dusk');

      environmentalAudioManager.changeTimeOfDay('night');
      expect(environmentalAudioManager.getCurrentTimeOfDay()).toBe('night');
    });

    it('应该获取环境配置', () => {
      const config = environmentalAudioManager.getEnvironmentalConfig('evening');
      expect(config).toBeDefined();
      expect(config?.timeOfDay).toBe('evening');
    });

    it('应该支持建筑音效', () => {
      environmentalAudioManager.playBuildingSound('farm');
      environmentalAudioManager.playBuildingSound('greenhouse');
      environmentalAudioManager.playBuildingSound('barn');
      environmentalAudioManager.playBuildingSound('windmill');

      // 应该不抛出错误
      expect(environmentalAudioManager).toBeDefined();
    });

    it('应该支持动物音效', () => {
      environmentalAudioManager.playAnimalSound('chicken');
      environmentalAudioManager.playAnimalSound('cow');
      environmentalAudioManager.playAnimalSound('sheep');
      environmentalAudioManager.playAnimalSound('horse');
      environmentalAudioManager.playAnimalSound('dog');

      // 应该不抛出错误
      expect(environmentalAudioManager).toBeDefined();
    });

    it('应该支持天气状态设置', () => {
      environmentalAudioManager.setRaining(true);
      environmentalAudioManager.setSnowing(false);

      // 应该不抛出错误
      expect(environmentalAudioManager).toBeDefined();
    });
  });

  describe('音效系统集成', () => {
    it('应该支持完整的音效循环', () => {
      const seasonalAudioManager = new SeasonalAudioManager(audioManager);
      const weatherAudioManager = new WeatherAudioManager(audioManager);
      const environmentalAudioManager = new EnvironmentalAudioManager(audioManager);

      // 切换季节
      seasonalAudioManager.changeSeason('summer');
      expect(seasonalAudioManager.getCurrentSeason()).toBe('summer');

      // 切换天气
      weatherAudioManager.changeWeather('rainy');
      expect(weatherAudioManager.getCurrentWeather()).toBe('rainy');

      // 切换时间段
      environmentalAudioManager.changeTimeOfDay('afternoon');
      expect(environmentalAudioManager.getCurrentTimeOfDay()).toBe('afternoon');

      // 播放环境音效
      environmentalAudioManager.playBuildingSound('farm');
      environmentalAudioManager.playAnimalSound('chicken');

      seasonalAudioManager.dispose();
      weatherAudioManager.dispose();
      environmentalAudioManager.dispose();
    });

    it('应该支持音量独立控制', () => {
      const seasonalAudioManager = new SeasonalAudioManager(audioManager);
      const weatherAudioManager = new WeatherAudioManager(audioManager);

      seasonalAudioManager.setMusicVolume(0.7);
      seasonalAudioManager.setAmbientVolume(0.5);

      weatherAudioManager.setWeatherVolume(0.6);

      // 应该不抛出错误
      expect(audioManager).toBeDefined();

      seasonalAudioManager.dispose();
      weatherAudioManager.dispose();
    });
  });
});
