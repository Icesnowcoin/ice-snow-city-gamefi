import { AudioManager, AudioConfig } from './AudioManager';

/**
 * 时间段类型
 */
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening' | 'night';

/**
 * 环境音效配置
 */
interface EnvironmentalAudioConfig {
  timeOfDay: TimeOfDay;
  soundEffects: AudioConfig[];
  description: string;
}

/**
 * 环境音效管理器
 * 根据时间和环境播放相应的音效
 */
export class EnvironmentalAudioManager {
  private audioManager: AudioManager;
  private currentTimeOfDay: TimeOfDay = 'morning';
  private currentSoundEffects: string[] = [];
  private environmentalConfigs: Map<TimeOfDay, EnvironmentalAudioConfig> = new Map();
  private isRaining: boolean = false;
  private isSnowing: boolean = false;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
    this.initializeEnvironmentalAudio();
  }

  /**
   * 初始化环境音效配置
   */
  private initializeEnvironmentalAudio(): void {
    // 黎明配置
    this.environmentalConfigs.set('dawn', {
      timeOfDay: 'dawn',
      description: '黎明时分',
      soundEffects: [
        {
          id: 'env_birds_dawn',
          type: 'ambient',
          url: '/audio/environmental/birds_waking.mp3',
          volume: 0.3,
          loop: true,
          priority: 5,
        },
        {
          id: 'env_insects_dawn',
          type: 'ambient',
          url: '/audio/environmental/insects_morning.mp3',
          volume: 0.2,
          loop: true,
          priority: 4,
        },
      ],
    });

    // 早晨配置
    this.environmentalConfigs.set('morning', {
      timeOfDay: 'morning',
      description: '早晨',
      soundEffects: [
        {
          id: 'env_birds_morning',
          type: 'ambient',
          url: '/audio/environmental/morning_birds.mp3',
          volume: 0.35,
          loop: true,
          priority: 5,
        },
        {
          id: 'env_breeze_morning',
          type: 'ambient',
          url: '/audio/environmental/morning_breeze.mp3',
          volume: 0.25,
          loop: true,
          priority: 4,
        },
      ],
    });

    // 正午配置
    this.environmentalConfigs.set('noon', {
      timeOfDay: 'noon',
      description: '正午',
      soundEffects: [
        {
          id: 'env_insects_noon',
          type: 'ambient',
          url: '/audio/environmental/insects_buzzing.mp3',
          volume: 0.4,
          loop: true,
          priority: 5,
        },
        {
          id: 'env_breeze_noon',
          type: 'ambient',
          url: '/audio/environmental/noon_breeze.mp3',
          volume: 0.2,
          loop: true,
          priority: 4,
        },
      ],
    });

    // 下午配置
    this.environmentalConfigs.set('afternoon', {
      timeOfDay: 'afternoon',
      description: '下午',
      soundEffects: [
        {
          id: 'env_birds_afternoon',
          type: 'ambient',
          url: '/audio/environmental/afternoon_birds.mp3',
          volume: 0.3,
          loop: true,
          priority: 5,
        },
        {
          id: 'env_insects_afternoon',
          type: 'ambient',
          url: '/audio/environmental/afternoon_insects.mp3',
          volume: 0.25,
          loop: true,
          priority: 4,
        },
      ],
    });

    // 黄昏配置
    this.environmentalConfigs.set('dusk', {
      timeOfDay: 'dusk',
      description: '黄昏',
      soundEffects: [
        {
          id: 'env_birds_dusk',
          type: 'ambient',
          url: '/audio/environmental/dusk_birds.mp3',
          volume: 0.35,
          loop: true,
          priority: 5,
        },
        {
          id: 'env_frogs_dusk',
          type: 'ambient',
          url: '/audio/environmental/frogs_croaking.mp3',
          volume: 0.3,
          loop: true,
          priority: 4,
        },
        {
          id: 'env_wind_dusk',
          type: 'ambient',
          url: '/audio/environmental/evening_wind.mp3',
          volume: 0.2,
          loop: true,
          priority: 3,
        },
      ],
    });

    // 傍晚配置
    this.environmentalConfigs.set('evening', {
      timeOfDay: 'evening',
      description: '傍晚',
      soundEffects: [
        {
          id: 'env_crickets',
          type: 'ambient',
          url: '/audio/environmental/crickets_chirping.mp3',
          volume: 0.4,
          loop: true,
          priority: 5,
        },
        {
          id: 'env_frogs_evening',
          type: 'ambient',
          url: '/audio/environmental/frogs_evening.mp3',
          volume: 0.3,
          loop: true,
          priority: 4,
        },
        {
          id: 'env_night_insects',
          type: 'ambient',
          url: '/audio/environmental/night_insects.mp3',
          volume: 0.25,
          loop: true,
          priority: 3,
        },
      ],
    });

    // 夜晚配置
    this.environmentalConfigs.set('night', {
      timeOfDay: 'night',
      description: '夜晚',
      soundEffects: [
        {
          id: 'env_crickets_night',
          type: 'ambient',
          url: '/audio/environmental/crickets_night.mp3',
          volume: 0.35,
          loop: true,
          priority: 5,
        },
        {
          id: 'env_owls',
          type: 'ambient',
          url: '/audio/environmental/owls_hooting.mp3',
          volume: 0.25,
          loop: true,
          priority: 4,
        },
        {
          id: 'env_night_ambience',
          type: 'ambient',
          url: '/audio/environmental/night_ambience.mp3',
          volume: 0.2,
          loop: true,
          priority: 3,
        },
      ],
    });
  }

  /**
   * 改变时间段
   */
  public changeTimeOfDay(timeOfDay: TimeOfDay): void {
    if (this.currentTimeOfDay === timeOfDay) {
      return; // 已经是该时间段
    }

    // 停止当前环境音效
    this.currentSoundEffects.forEach((soundId) => {
      this.audioManager.stopAudio(soundId, 1000);
    });
    this.currentSoundEffects = [];

    // 更新当前时间段
    this.currentTimeOfDay = timeOfDay;

    // 播放新时间段的音效
    const config = this.environmentalConfigs.get(timeOfDay);
    if (!config) {
      console.warn(`No audio config found for time of day: ${timeOfDay}`);
      return;
    }

    // 播放环境音效
    config.soundEffects.forEach((soundConfig) => {
      this.audioManager.playAudio(soundConfig);
      this.currentSoundEffects.push(soundConfig.id);
    });
  }

  /**
   * 获取当前时间段
   */
  public getCurrentTimeOfDay(): TimeOfDay {
    return this.currentTimeOfDay;
  }

  /**
   * 获取环境音效配置
   */
  public getEnvironmentalConfig(timeOfDay: TimeOfDay): EnvironmentalAudioConfig | undefined {
    return this.environmentalConfigs.get(timeOfDay);
  }

  /**
   * 播放建筑音效（如农场工作声）
   */
  public playBuildingSound(buildingType: string): void {
    const soundConfigs: { [key: string]: AudioConfig } = {
      farm: {
        id: 'building_farm_work',
        type: 'sfx',
        url: '/audio/buildings/farm_working.mp3',
        volume: 0.3,
        loop: false,
        priority: 6,
      },
      greenhouse: {
        id: 'building_greenhouse_work',
        type: 'sfx',
        url: '/audio/buildings/greenhouse_working.mp3',
        volume: 0.25,
        loop: false,
        priority: 6,
      },
      barn: {
        id: 'building_barn_work',
        type: 'sfx',
        url: '/audio/buildings/barn_working.mp3',
        volume: 0.3,
        loop: false,
        priority: 6,
      },
      windmill: {
        id: 'building_windmill',
        type: 'ambient',
        url: '/audio/buildings/windmill_spinning.mp3',
        volume: 0.25,
        loop: true,
        priority: 5,
      },
    };

    const config = soundConfigs[buildingType];
    if (config) {
      this.audioManager.playAudio(config);
    }
  }

  /**
   * 播放动物音效
   */
  public playAnimalSound(animalType: string): void {
    const soundConfigs: { [key: string]: AudioConfig } = {
      chicken: {
        id: `animal_chicken_${Date.now()}`,
        type: 'sfx',
        url: '/audio/animals/chicken_clucking.mp3',
        volume: 0.3,
        loop: false,
        priority: 5,
      },
      cow: {
        id: `animal_cow_${Date.now()}`,
        type: 'sfx',
        url: '/audio/animals/cow_mooing.mp3',
        volume: 0.35,
        loop: false,
        priority: 5,
      },
      sheep: {
        id: `animal_sheep_${Date.now()}`,
        type: 'sfx',
        url: '/audio/animals/sheep_bleating.mp3',
        volume: 0.3,
        loop: false,
        priority: 5,
      },
      horse: {
        id: `animal_horse_${Date.now()}`,
        type: 'sfx',
        url: '/audio/animals/horse_neighing.mp3',
        volume: 0.35,
        loop: false,
        priority: 5,
      },
      dog: {
        id: `animal_dog_${Date.now()}`,
        type: 'sfx',
        url: '/audio/animals/dog_barking.mp3',
        volume: 0.3,
        loop: false,
        priority: 5,
      },
    };

    const config = soundConfigs[animalType];
    if (config) {
      this.audioManager.playAudio(config);
    }
  }

  /**
   * 设置下雨状态
   */
  public setRaining(isRaining: boolean): void {
    this.isRaining = isRaining;
  }

  /**
   * 设置下雪状态
   */
  public setSnowing(isSnowing: boolean): void {
    this.isSnowing = isSnowing;
  }

  /**
   * 设置环境音效音量
   */
  public setEnvironmentalVolume(volume: number): void {
    this.audioManager.setTypeVolume('ambient', volume);
  }

  /**
   * 暂停所有环境音效
   */
  public pauseAll(): void {
    this.currentSoundEffects.forEach((soundId) => {
      this.audioManager.pauseAudio(soundId);
    });
  }

  /**
   * 恢复所有环境音效
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
