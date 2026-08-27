import { AudioManager, AudioConfig } from './AudioManager';

/**
 * 天气类型
 */
export type WeatherType = 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';

/**
 * 天气音效配置
 */
interface WeatherAudioConfig {
  weather: WeatherType;
  soundEffects: AudioConfig[];
  volume: number;
}

/**
 * 天气音效管理器
 * 根据天气播放相应的音效
 */
export class WeatherAudioManager {
  private audioManager: AudioManager;
  private currentWeather: WeatherType = 'clear';
  private currentSoundEffects: string[] = [];
  private weatherConfigs: Map<WeatherType, WeatherAudioConfig> = new Map();

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
    this.initializeWeatherAudio();
  }

  /**
   * 初始化天气音效配置
   */
  private initializeWeatherAudio(): void {
    // 晴天配置（无额外音效）
    this.weatherConfigs.set('clear', {
      weather: 'clear',
      soundEffects: [],
      volume: 0,
    });

    // 多云配置
    this.weatherConfigs.set('cloudy', {
      weather: 'cloudy',
      soundEffects: [
        {
          id: 'weather_wind_cloudy',
          type: 'ambient',
          url: '/audio/weather/light_wind.mp3',
          volume: 0.2,
          loop: true,
          priority: 6,
        },
      ],
      volume: 0.2,
    });

    // 下雨配置
    this.weatherConfigs.set('rainy', {
      weather: 'rainy',
      soundEffects: [
        {
          id: 'weather_rain',
          type: 'ambient',
          url: '/audio/weather/rain_falling.mp3',
          volume: 0.5,
          loop: true,
          priority: 7,
        },
        {
          id: 'weather_thunder_distant',
          type: 'sfx',
          url: '/audio/weather/distant_thunder.mp3',
          volume: 0.3,
          loop: false,
          priority: 6,
        },
        {
          id: 'weather_wind_rain',
          type: 'ambient',
          url: '/audio/weather/wind_in_rain.mp3',
          volume: 0.25,
          loop: true,
          priority: 5,
        },
      ],
      volume: 0.5,
    });

    // 暴风雨配置
    this.weatherConfigs.set('stormy', {
      weather: 'stormy',
      soundEffects: [
        {
          id: 'weather_heavy_rain',
          type: 'ambient',
          url: '/audio/weather/heavy_rain.mp3',
          volume: 0.6,
          loop: true,
          priority: 8,
        },
        {
          id: 'weather_thunder_close',
          type: 'sfx',
          url: '/audio/weather/close_thunder.mp3',
          volume: 0.5,
          loop: false,
          priority: 8,
        },
        {
          id: 'weather_wind_storm',
          type: 'ambient',
          url: '/audio/weather/strong_wind.mp3',
          volume: 0.4,
          loop: true,
          priority: 7,
        },
        {
          id: 'weather_hail',
          type: 'ambient',
          url: '/audio/weather/hail_falling.mp3',
          volume: 0.3,
          loop: true,
          priority: 6,
        },
      ],
      volume: 0.6,
    });

    // 下雪配置
    this.weatherConfigs.set('snowy', {
      weather: 'snowy',
      soundEffects: [
        {
          id: 'weather_snow',
          type: 'ambient',
          url: '/audio/weather/snow_falling.mp3',
          volume: 0.3,
          loop: true,
          priority: 7,
        },
        {
          id: 'weather_wind_snow',
          type: 'ambient',
          url: '/audio/weather/blizzard_wind.mp3',
          volume: 0.35,
          loop: true,
          priority: 6,
        },
        {
          id: 'weather_ice_cracking',
          type: 'sfx',
          url: '/audio/weather/ice_cracking.mp3',
          volume: 0.2,
          loop: false,
          priority: 5,
        },
      ],
      volume: 0.35,
    });
  }

  /**
   * 改变天气
   */
  public changeWeather(weather: WeatherType): void {
    if (this.currentWeather === weather) {
      return; // 已经是该天气
    }

    // 停止当前天气音效
    this.currentSoundEffects.forEach((soundId) => {
      this.audioManager.stopAudio(soundId, 1000);
    });
    this.currentSoundEffects = [];

    // 更新当前天气
    this.currentWeather = weather;

    // 播放新天气的音效
    const config = this.weatherConfigs.get(weather);
    if (!config) {
      console.warn(`No audio config found for weather: ${weather}`);
      return;
    }

    // 播放天气音效
    config.soundEffects.forEach((soundConfig) => {
      this.audioManager.playAudio(soundConfig);
      this.currentSoundEffects.push(soundConfig.id);
    });

    // 设置天气音效的音量
    this.audioManager.setTypeVolume('ambient', config.volume);
  }

  /**
   * 播放随机雷声（用于暴风雨）
   */
  public playRandomThunder(): void {
    if (this.currentWeather !== 'stormy' && this.currentWeather !== 'rainy') {
      return;
    }

    const thunderId = `thunder_${Date.now()}`;
    const thunderConfig: AudioConfig = {
      id: thunderId,
      type: 'sfx',
      url: this.currentWeather === 'stormy' 
        ? '/audio/weather/close_thunder.mp3'
        : '/audio/weather/distant_thunder.mp3',
      volume: this.currentWeather === 'stormy' ? 0.5 : 0.3,
      loop: false,
      priority: 8,
    };

    this.audioManager.playAudio(thunderConfig);

    // 自动清理
    setTimeout(() => {
      this.audioManager.stopAudio(thunderId);
    }, 5000);
  }

  /**
   * 获取当前天气
   */
  public getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  /**
   * 获取天气音效配置
   */
  public getWeatherConfig(weather: WeatherType): WeatherAudioConfig | undefined {
    return this.weatherConfigs.get(weather);
  }

  /**
   * 设置天气音效音量
   */
  public setWeatherVolume(volume: number): void {
    this.audioManager.setTypeVolume('ambient', volume);
  }

  /**
   * 暂停所有天气音效
   */
  public pauseAll(): void {
    this.currentSoundEffects.forEach((soundId) => {
      this.audioManager.pauseAudio(soundId);
    });
  }

  /**
   * 恢复所有天气音效
   */
  public resumeAll(): void {
    this.currentSoundEffects.forEach((soundId) => {
      this.audioManager.resumeAudio(soundId);
    });
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.currentSoundEffects.forEach((soundId) => {
      this.audioManager.stopAudio(soundId);
    });

    this.currentSoundEffects = [];
  }
}
