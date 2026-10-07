import * as BABYLON from '@babylonjs/core';
import { ParticleSystemManager, PREDEFINED_EFFECTS } from './ParticleSystem';
import { BuildingAnimationSystem } from './BuildingAnimationSystem';
import { Building, Vegetation } from '../types/GameObjectTypes';

/**
 * 操作类型定义
 */
export type OperationType = 'edit' | 'maintain' | 'delete' | 'harvest' | 'upgrade' | 'production';

/**
 * 视觉反馈配置
 */
export interface VisualFeedbackConfig {
  enableParticles: boolean;
  enableAnimations: boolean;
  enableSounds: boolean;
  particleDuration: number;
  animationDuration: number;
}

/**
 * 视觉反馈控制器
 * 负责协调粒子特效、动画和音效的播放
 */
export class VisualFeedbackController {
  private scene: BABYLON.Scene;
  private particleManager: ParticleSystemManager;
  private animationSystem: BuildingAnimationSystem;
  private config: VisualFeedbackConfig;
  private soundMap: Map<string, HTMLAudioElement> = new Map();

  constructor(
    scene: BABYLON.Scene,
    config: Partial<VisualFeedbackConfig> = {}
  ) {
    this.scene = scene;
    this.particleManager = new ParticleSystemManager(scene);
    this.animationSystem = new BuildingAnimationSystem(scene);

    this.config = {
      enableParticles: true,
      enableAnimations: true,
      enableSounds: true,
      particleDuration: 1.0,
      animationDuration: 0.5,
      ...config,
    };

    this.initializeParticleSystems();
  }

  /**
   * 初始化粒子系统
   */
  private initializeParticleSystems(): void {
    if (!this.config.enableParticles) return;

    Object.values(PREDEFINED_EFFECTS).forEach((effect) => {
      this.particleManager.createParticleSystem(effect);
    });
  }

  /**
   * 播放编辑操作反馈
   */
  async playEditFeedback(mesh: BABYLON.Mesh, object: Building | Vegetation): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.config.enableParticles) {
      this.particleManager.playParticleEffect(
        'editSuccess',
        mesh.position,
        this.config.particleDuration
      );
    }

    if (this.config.enableAnimations) {
      promises.push(this.animationSystem.playUpgradeAnimation(mesh));
    }

    if (this.config.enableSounds) {
      this.playSound('edit');
    }

    await Promise.all(promises);
  }

  /**
   * 播放维护操作反馈
   */
  async playMaintenanceFeedback(mesh: BABYLON.Mesh, building: Building): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.config.enableParticles) {
      this.particleManager.playParticleEffect(
        'maintenanceSuccess',
        mesh.position,
        this.config.particleDuration
      );
    }

    if (this.config.enableAnimations) {
      promises.push(this.animationSystem.playMaintenanceAnimation(mesh));
    }

    if (this.config.enableSounds) {
      this.playSound('maintenance');
    }

    await Promise.all(promises);
  }

  /**
   * 播放删除操作反馈
   */
  async playDeleteFeedback(mesh: BABYLON.Mesh, object: Building | Vegetation): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.config.enableParticles) {
      this.particleManager.playParticleEffect(
        'deleteEffect',
        mesh.position,
        this.config.particleDuration
      );
    }

    if (this.config.enableAnimations) {
      promises.push(this.animationSystem.playDeletionAnimation(mesh));
    }

    if (this.config.enableSounds) {
      this.playSound('delete');
    }

    await Promise.all(promises);
  }

  /**
   * 播放收获操作反馈
   */
  async playHarvestFeedback(mesh: BABYLON.Mesh, vegetation: Vegetation): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.config.enableParticles) {
      this.particleManager.playParticleEffect(
        'harvestEffect',
        mesh.position,
        this.config.particleDuration
      );
    }

    if (this.config.enableAnimations) {
      this.animationSystem.playProductionAnimation(mesh);
    }

    if (this.config.enableSounds) {
      this.playSound('harvest');
    }

    await Promise.all(promises);
  }

  /**
   * 播放升级操作反馈
   */
  async playUpgradeFeedback(mesh: BABYLON.Mesh, building: Building): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.config.enableParticles) {
      this.particleManager.playParticleEffect(
        'upgradeEffect',
        mesh.position,
        this.config.particleDuration
      );
    }

    if (this.config.enableAnimations) {
      promises.push(this.animationSystem.playUpgradeAnimation(mesh));
    }

    if (this.config.enableSounds) {
      this.playSound('upgrade');
    }

    await Promise.all(promises);
  }

  /**
   * 播放生产操作反馈
   */
  async playProductionFeedback(mesh: BABYLON.Mesh, building: Building): Promise<void> {
    if (this.config.enableParticles) {
      this.particleManager.playParticleEffect(
        'productionEffect',
        mesh.position,
        this.config.particleDuration
      );
    }

    if (this.config.enableAnimations) {
      this.animationSystem.playProductionAnimation(mesh);
    }

    if (this.config.enableSounds) {
      this.playSound('production');
    }
  }

  /**
   * 播放健康度恢复反馈
   */
  async playHealthRecoveryFeedback(mesh: BABYLON.Mesh, building: Building): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.config.enableParticles) {
      this.particleManager.playParticleEffect(
        'editSuccess',
        mesh.position,
        this.config.particleDuration
      );
    }

    if (this.config.enableAnimations) {
      promises.push(this.animationSystem.playHealthRecoveryAnimation(mesh));
    }

    if (this.config.enableSounds) {
      this.playSound('recovery');
    }

    await Promise.all(promises);
  }

  /**
   * 播放选中反馈
   */
  async playSelectionFeedback(mesh: BABYLON.Mesh): Promise<void> {
    if (this.config.enableAnimations) {
      this.animationSystem.playSelectionAnimation(mesh);
    }
  }

  /**
   * 停止选中反馈
   */
  stopSelectionFeedback(mesh: BABYLON.Mesh): void {
    if (this.config.enableAnimations) {
      this.animationSystem.stopSelectionAnimation(mesh);
    }
  }

  /**
   * 播放音效
   */
  private playSound(type: string): void {
    // 创建简单的音效提示（可以替换为实际的音频文件）
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 根据操作类型设置不同的音调
      switch (type) {
        case 'edit':
          oscillator.frequency.value = 800;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case 'maintenance':
          oscillator.frequency.value = 600;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;

        case 'delete':
          oscillator.frequency.value = 400;
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;

        case 'harvest':
          oscillator.frequency.value = 1000;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.6);
          break;

        case 'upgrade':
          oscillator.frequency.value = 1200;
          gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;

        case 'production':
          oscillator.frequency.value = 900;
          gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case 'recovery':
          oscillator.frequency.value = 1100;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;
      }
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<VisualFeedbackConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): VisualFeedbackConfig {
    return { ...this.config };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.particleManager.dispose();
    this.animationSystem.dispose();
    this.soundMap.forEach((sound) => {
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
    });
    this.soundMap.clear();
  }
}
