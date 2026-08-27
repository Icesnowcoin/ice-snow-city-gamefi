/**
 * 音效类型
 */
export type AudioType = 'music' | 'sfx' | 'ambient' | 'ui';

/**
 * 音效配置
 */
export interface AudioConfig {
  id: string;
  type: AudioType;
  url: string;
  volume: number; // 0-1
  loop: boolean;
  fadeInDuration?: number; // 毫秒
  fadeOutDuration?: number; // 毫秒
  priority?: number; // 优先级，高优先级会覆盖低优先级
}

/**
 * 音效播放状态
 */
export interface AudioPlaybackState {
  id: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

/**
 * 音效管理器
 * 使用 Web Audio API 管理游戏音效
 */
export class AudioManager {
  private audioContext!: AudioContext;
  private masterGain!: GainNode;
  private typeGains: Map<AudioType, GainNode> = new Map();
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private audioSources: Map<string, AudioBufferSourceNode> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private playbackStates: Map<string, AudioPlaybackState> = new Map();
  private fadeIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    // 初始化 Web Audio API
    const audioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (typeof audioContextClass !== "function") {
      console.warn("[AudioManager] Web Audio API unavailable; audio will remain disabled.");
      return;
    }
    this.audioContext = new audioContextClass();

    // 创建主音量控制
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 1;

    // 为每种音效类型创建独立的音量控制
    const types: AudioType[] = ['music', 'sfx', 'ambient', 'ui'];
    types.forEach((type) => {
      const gain = this.audioContext.createGain();
      gain.connect(this.masterGain);
      gain.gain.value = 1;
      this.typeGains.set(type, gain);
    });

    this.isInitialized = true;
  }

  /**
   * 预加载音频文件
   */
  public async preloadAudio(config: AudioConfig): Promise<void> {
    if (!this.isInitialized) return;
    if (this.audioBuffers.has(config.id)) {
      return; // 已经加载过
    }

    try {
      const response = await fetch(config.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(config.id, audioBuffer);
    } catch (error) {
      console.error(`Failed to load audio: ${config.id}`, error);
    }
  }

  /**
   * 播放音效
   */
  public playAudio(config: AudioConfig): void {
    if (!this.isInitialized) {
      console.warn('AudioManager not initialized');
      return;
    }

    // 如果已经在播放，先停止
    if (this.audioElements.has(config.id) && this.playbackStates.get(config.id)?.isPlaying) {
      this.stopAudio(config.id);
    }

    // 使用 HTMLAudioElement 播放（支持更好的浏览器兼容性）
    const audio = new Audio(config.url);
    audio.volume = config.volume;
    audio.loop = config.loop;

    this.audioElements.set(config.id, audio);

    // 记录播放状态
    this.playbackStates.set(config.id, {
      id: config.id,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      volume: config.volume,
    });

    // 处理淡入效果
    if (config.fadeInDuration && config.fadeInDuration > 0) {
      audio.volume = 0;
      this.fadeIn(config.id, config.volume, config.fadeInDuration);
    }

    try {
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch((error) => console.error(`Failed to play audio: ${config.id}`, error));
      }
    } catch (error) {
      console.error(`Failed to play audio: ${config.id}`, error);
    }

    // 监听音频事件
    audio.addEventListener('ended', () => {
      this.playbackStates.set(config.id, {
        ...this.playbackStates.get(config.id)!,
        isPlaying: false,
      });
    });

    audio.addEventListener('timeupdate', () => {
      const state = this.playbackStates.get(config.id);
      if (state) {
        state.currentTime = audio.currentTime;
        state.duration = audio.duration;
      }
    });
  }

  /**
   * 停止播放音效
   */
  public stopAudio(audioId: string, fadeOutDuration?: number): void {
    const audio = this.audioElements.get(audioId);
    if (!audio) return;

    if (fadeOutDuration && fadeOutDuration > 0) {
      this.fadeOut(audioId, fadeOutDuration);
    } else {
      audio.pause();
      audio.currentTime = 0;

      this.playbackStates.set(audioId, {
        ...this.playbackStates.get(audioId)!,
        isPlaying: false,
      });
    }
  }

  /**
   * 暂停播放音效
   */
  public pauseAudio(audioId: string): void {
    const audio = this.audioElements.get(audioId);
    if (audio) {
      audio.pause();
      this.playbackStates.set(audioId, {
        ...this.playbackStates.get(audioId)!,
        isPlaying: false,
      });
    }
  }

  /**
   * 恢复播放音效
   */
  public resumeAudio(audioId: string): void {
    const audio = this.audioElements.get(audioId);
    if (audio) {
      try {
        const playback = audio.play();
        if (playback && typeof playback.catch === "function") {
          playback.catch((error) => console.error(`Failed to resume audio: ${audioId}`, error));
        }
      } catch (error) {
        console.error(`Failed to resume audio: ${audioId}`, error);
      }

      this.playbackStates.set(audioId, {
        ...this.playbackStates.get(audioId)!,
        isPlaying: true,
      });
    }
  }

  /**
   * 设置音效音量
   */
  public setVolume(audioId: string, volume: number): void {
    const audio = this.audioElements.get(audioId);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));

      const state = this.playbackStates.get(audioId);
      if (state) {
        state.volume = audio.volume;
      }
    }
  }

  /**
   * 设置音效类型的总音量
   */
  public setTypeVolume(type: AudioType, volume: number): void {
    const gain = this.typeGains.get(type);
    if (gain) {
      gain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 设置主音量
   */
  public setMasterVolume(volume: number): void {
    if (!this.masterGain) return;
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * 淡入音效
   */
  private fadeIn(audioId: string, targetVolume: number, duration: number): void {
    const audio = this.audioElements.get(audioId);
    if (!audio) return;

    const startVolume = audio.volume;
    const startTime = Date.now();

    // 清除之前的淡入/淡出
    const existingInterval = this.fadeIntervals.get(audioId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      audio.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress >= 1) {
        clearInterval(interval);
        this.fadeIntervals.delete(audioId);
      }
    }, 50);

    this.fadeIntervals.set(audioId, interval);
  }

  /**
   * 淡出音效
   */
  private fadeOut(audioId: string, duration: number): void {
    const audio = this.audioElements.get(audioId);
    if (!audio) return;

    const startVolume = audio.volume;
    const startTime = Date.now();

    // 清除之前的淡入/淡出
    const existingInterval = this.fadeIntervals.get(audioId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      audio.volume = startVolume * (1 - progress);

      if (progress >= 1) {
        audio.pause();
        audio.currentTime = 0;

        this.playbackStates.set(audioId, {
          ...this.playbackStates.get(audioId)!,
          isPlaying: false,
        });

        clearInterval(interval);
        this.fadeIntervals.delete(audioId);
      }
    }, 50);

    this.fadeIntervals.set(audioId, interval);
  }

  /**
   * 获取音效播放状态
   */
  public getPlaybackState(audioId: string): AudioPlaybackState | undefined {
    return this.playbackStates.get(audioId);
  }

  /**
   * 获取所有播放中的音效
   */
  public getPlayingAudios(): AudioPlaybackState[] {
    return Array.from(this.playbackStates.values()).filter((state) => state.isPlaying);
  }

  /**
   * 停止所有音效
   */
  public stopAllAudio(): void {
    this.audioElements.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    this.playbackStates.forEach((state) => {
      state.isPlaying = false;
    });
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.stopAllAudio();
    this.audioElements.clear();
    this.audioBuffers.clear();
    this.playbackStates.clear();

    this.fadeIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.fadeIntervals.clear();
  }
}
