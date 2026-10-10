import { AudioManager, AudioConfig, AudioType } from './AudioManager';
import { Season } from '../environment/SeasonSystem';

/**
 * 季节音效配置
 */
interface SeasonalAudioConfig {
  season: Season;
  backgroundMusic: AudioConfig;
  ambientSounds: AudioConfig[];
}

/**
 * 季节音效管理器
 * 根据季节播放不同的背景音乐和环境音效
 */
export class SeasonalAudioManager {
  private audioManager: AudioManager;
  private currentSeason: Season = 'spring';
  private currentBackgroundMusic: string | null = null;
  private currentAmbientSounds: string[] = [];
  private seasonalConfigs: Map<Season, SeasonalAudioConfig> = new Map();

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
    this.initializeSeasonalAudio();
  }

  /**
   * 初始化季节音效配置
   */
  private initializeSeasonalAudio(): void {
    // 春季配置
    this.seasonalConfigs.set('spring', {
      season: 'spring',
      backgroundMusic: {
        id: 'music_spring',
        type: 'music',
        url: '/audio/music/spring_theme.mp3',
        volume: 0.6,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
        priority: 10,
      },
      ambientSounds: [
        {
          id: 'ambient_birds_spring',
          type: 'ambient',
          url: '/audio/ambient/birds_chirping.mp3',
          volume: 0.4,
          loop: true,
          priority: 5,
        },
        {
          id: 'ambient_wind_spring',
          type: 'ambient',
          url: '/audio/ambient/gentle_wind.mp3',
          volume: 0.3,
          loop: true,
          priority: 4,
        },
        {
          id: 'ambient_water_spring',
          type: 'ambient',
          url: '/audio/ambient/flowing_water.mp3',
          volume: 0.25,
          loop: true,
          priority: 3,
        },
      ],
    });

    // 夏季配置
    this.seasonalConfigs.set('summer', {
      season: 'summer',
      backgroundMusic: {
        id: 'music_summer',
        type: 'music',
        url: '/audio/music/summer_theme.mp3',
        volume: 0.6,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
        priority: 10,
      },
      ambientSounds: [
        {
          id: 'ambient_cicadas',
          type: 'ambient',
          url: '/audio/ambient/cicadas_buzzing.mp3',
          volume: 0.5,
          loop: true,
          priority: 5,
        },
        {
          id: 'ambient_insects',
          type: 'ambient',
          url: '/audio/ambient/insects_buzzing.mp3',
          volume: 0.3,
          loop: true,
          priority: 4,
        },
        {
          id: 'ambient_breeze_summer',
          type: 'ambient',
          url: '/audio/ambient/warm_breeze.mp3',
          volume: 0.25,
          loop: true,
          priority: 3,
        },
      ],
    });

    // 秋季配置
    this.seasonalConfigs.set('autumn', {
      season: 'autumn',
      backgroundMusic: {
        id: 'music_autumn',
        type: 'music',
        url: '/audio/music/autumn_theme.mp3',
        volume: 0.6,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
        priority: 10,
      },
      ambientSounds: [
        {
          id: 'ambient_leaves',
          type: 'ambient',
          url: '/audio/ambient/falling_leaves.mp3',
          volume: 0.4,
          loop: true,
          priority: 5,
        },
        {
          id: 'ambient_wind_autumn',
          type: 'ambient',
          url: '/audio/ambient/autumn_wind.mp3',
          volume: 0.35,
          loop: true,
          priority: 4,
        },
        {
          id: 'ambient_birds_autumn',
          type: 'ambient',
          url: '/audio/ambient/migrating_birds.mp3',
          volume: 0.3,
          loop: true,
          priority: 3,
        },
      ],
    });

    // 冬季配置
    this.seasonalConfigs.set('winter', {
      season: 'winter',
      backgroundMusic: {
        id: 'music_winter',
        type: 'music',
        url: '/audio/music/winter_theme.mp3',
        volume: 0.6,
        loop: true,
        fadeInDuration: 2000,
        fadeOutDuration: 2000,
        priority: 10,
      },
      ambientSounds: [
        {
          id: 'ambient_wind_winter',
          type: 'ambient',
          url: '/audio/ambient/cold_wind.mp3',
          volume: 0.45,
          loop: true,
          priority: 5,
        },
        {
          id: 'ambient_snow',
          type: 'ambient',
          url: '/audio/ambient/snow_falling.mp3',
          volume: 0.35,
          loop: true,
          priority: 4,
        },
        {
          id: 'ambient_silence',
          type: 'ambient',
          url: '/audio/ambient/winter_silence.mp3',
          volume: 0.2,
          loop: true,
          priority: 3,
        },
      ],
    });
  }

  /**
   * 切换季节音效
   */
  public changeSeason(season: Season): void {
    if (this.currentSeason === season) {
      return; // 已经是该季节
    }

    // 停止当前背景音乐
    if (this.currentBackgroundMusic) {
      this.audioManager.stopAudio(this.currentBackgroundMusic, 1000);
    }

    // 停止当前环境音效
    this.currentAmbientSounds.forEach((soundId) => {
      this.audioManager.stopAudio(soundId, 1000);
    });
    this.currentAmbientSounds = [];

    // 更新当前季节
    this.currentSeason = season;

    // 播放新季节的音效
    const config = this.seasonalConfigs.get(season);
    if (!config) {
      console.warn(`No audio config found for season: ${season}`);
      return;
    }

    // 播放背景音乐
    this.audioManager.playAudio(config.backgroundMusic);
    this.currentBackgroundMusic = config.backgroundMusic.id;

    // 播放环境音效
    config.ambientSounds.forEach((soundConfig) => {
      this.audioManager.playAudio(soundConfig);
      this.currentAmbientSounds.push(soundConfig.id);
    });
  }

  /**
   * 获取当前季节
   */
  public getCurrentSeason(): Season {
    return this.currentSeason;
  }

  /**
   * 获取季节音效配置
   */
  public getSeasonalConfig(season: Season): SeasonalAudioConfig | undefined {
    return this.seasonalConfigs.get(season);
  }

  /**
   * 设置背景音乐音量
   */
  public setMusicVolume(volume: number): void {
    this.audioManager.setTypeVolume('music', volume);
  }

  /**
   * 设置环境音效音量
   */
  public setAmbientVolume(volume: number): void {
    this.audioManager.setTypeVolume('ambient', volume);
  }

  /**
   * 暂停所有季节音效
   */
  public pauseAll(): void {
    if (this.currentBackgroundMusic) {
      this.audioManager.pauseAudio(this.currentBackgroundMusic);
    }

    this.currentAmbientSounds.forEach((soundId) => {
      this.audioManager.pauseAudio(soundId);
    });
  }

  /**
   * 恢复所有季节音效
   */
  public resumeAll(): void {
    if (this.currentBackgroundMusic) {
      this.audioManager.resumeAudio(this.currentBackgroundMusic);
    }

    this.currentAmbientSounds.forEach((soundId) => {
      this.audioManager.resumeAudio(soundId);
    });
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    if (this.currentBackgroundMusic) {
      this.audioManager.stopAudio(this.currentBackgroundMusic);
    }

    this.currentAmbientSounds.forEach((soundId) => {
      this.audioManager.stopAudio(soundId);
    });

    this.currentAmbientSounds = [];
    this.currentBackgroundMusic = null;
  }
}
