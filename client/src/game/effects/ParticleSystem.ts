import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Particles/particleSystem';

/**
 * 粒子系统配置接口
 */
export interface ParticleSystemConfig {
  name: string;
  emitterType: 'sphere' | 'box' | 'point';
  particleCount: number;
  emissionRate: number;
  lifetime: number;
  size: { min: number; max: number };
  speed: { min: number; max: number };
  color: { start: BABYLON.Color4; end: BABYLON.Color4 };
  gravity?: BABYLON.Vector3;
}

/**
 * 粒子系统管理器
 * 负责创建和管理 Babylon.js 粒子特效
 */
export class ParticleSystemManager {
  private scene: BABYLON.Scene;
  private particleSystems: Map<string, BABYLON.ParticleSystem> = new Map();

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  /**
   * 创建粒子系统
   */
  createParticleSystem(config: ParticleSystemConfig): BABYLON.ParticleSystem {
    // 创建发射器
    const emitter = this.createEmitter(config.emitterType);

    // 创建粒子系统
    const particleSystem = new BABYLON.ParticleSystem(config.name, config.particleCount, this.scene);
    particleSystem.emitter = emitter;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);

    // 设置粒子属性
    particleSystem.minLifeTime = config.lifetime * 0.5;
    particleSystem.maxLifeTime = config.lifetime;
    particleSystem.minSize = config.size.min;
    particleSystem.maxSize = config.size.max;
    particleSystem.minEmitPower = config.speed.min;
    particleSystem.maxEmitPower = config.speed.max;
    particleSystem.emitRate = config.emissionRate;

    // 设置颜色
    particleSystem.addColorGradient(0, config.color.start);
    particleSystem.addColorGradient(1, config.color.end);

    // 设置重力
    if (config.gravity) {
      particleSystem.gravity = config.gravity;
    }

    // 创建纹理
    const particleTexture = new BABYLON.DynamicTexture('particleTexture', 64, this.scene);
    const ctx = particleTexture.getContext();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    particleTexture.update();

    particleSystem.particleTexture = particleTexture;

    // 保存粒子系统
    this.particleSystems.set(config.name, particleSystem);

    return particleSystem;
  }

  /**
   * 创建发射器
   */
  private createEmitter(type: string): BABYLON.Mesh {
    const emitter = BABYLON.MeshBuilder.CreateBox('emitter', { size: 1 }, this.scene);
    emitter.isVisible = false;
    return emitter;
  }

  /**
   * 播放粒子特效
   */
  playParticleEffect(name: string, position: BABYLON.Vector3, duration: number = 1): void {
    const particleSystem = this.particleSystems.get(name);
    if (!particleSystem) {
      console.warn(`Particle system not found: ${name}`);
      return;
    }

    // 设置发射器位置
    (particleSystem.emitter as BABYLON.Mesh).position = position;

    // 启动粒子系统
    particleSystem.start();

    // 设置停止时间
    setTimeout(() => {
      particleSystem.stop();
    }, duration * 1000);
  }

  /**
   * 停止粒子特效
   */
  stopParticleEffect(name: string): void {
    const particleSystem = this.particleSystems.get(name);
    if (particleSystem) {
      particleSystem.stop();
    }
  }

  /**
   * 删除粒子系统
   */
  disposeParticleSystem(name: string): void {
    const particleSystem = this.particleSystems.get(name);
    if (particleSystem) {
      particleSystem.dispose();
      this.particleSystems.delete(name);
    }
  }

  /**
   * 清理所有粒子系统
   */
  dispose(): void {
    this.particleSystems.forEach((ps) => ps.dispose());
    this.particleSystems.clear();
  }
}

/**
 * 预定义的粒子特效配置
 */
export const PREDEFINED_EFFECTS = {
  // 编辑成功特效 - 绿色闪光
  editSuccess: {
    name: 'editSuccess',
    emitterType: 'sphere' as const,
    particleCount: 100,
    emissionRate: 50,
    lifetime: 0.8,
    size: { min: 0.1, max: 0.3 },
    speed: { min: 2, max: 5 },
    color: {
      start: new BABYLON.Color4(0, 1, 0, 1),
      end: new BABYLON.Color4(0, 1, 0, 0),
    },
    gravity: new BABYLON.Vector3(0, -5, 0),
  } as ParticleSystemConfig,

  // 维护成功特效 - 黄色闪光
  maintenanceSuccess: {
    name: 'maintenanceSuccess',
    emitterType: 'sphere' as const,
    particleCount: 150,
    emissionRate: 75,
    lifetime: 1.0,
    size: { min: 0.15, max: 0.4 },
    speed: { min: 3, max: 7 },
    color: {
      start: new BABYLON.Color4(1, 1, 0, 1),
      end: new BABYLON.Color4(1, 0.5, 0, 0),
    },
    gravity: new BABYLON.Vector3(0, -3, 0),
  } as ParticleSystemConfig,

  // 删除特效 - 红色爆炸
  deleteEffect: {
    name: 'deleteEffect',
    emitterType: 'sphere' as const,
    particleCount: 200,
    emissionRate: 100,
    lifetime: 1.2,
    size: { min: 0.2, max: 0.5 },
    speed: { min: 4, max: 10 },
    color: {
      start: new BABYLON.Color4(1, 0, 0, 1),
      end: new BABYLON.Color4(1, 0.5, 0, 0),
    },
    gravity: new BABYLON.Vector3(0, -8, 0),
  } as ParticleSystemConfig,

  // 收获特效 - 金色闪光
  harvestEffect: {
    name: 'harvestEffect',
    emitterType: 'sphere' as const,
    particleCount: 120,
    emissionRate: 60,
    lifetime: 1.5,
    size: { min: 0.1, max: 0.35 },
    speed: { min: 2, max: 6 },
    color: {
      start: new BABYLON.Color4(1, 0.84, 0, 1),
      end: new BABYLON.Color4(1, 0.5, 0, 0),
    },
    gravity: new BABYLON.Vector3(0, -2, 0),
  } as ParticleSystemConfig,

  // 升级特效 - 蓝色闪光
  upgradeEffect: {
    name: 'upgradeEffect',
    emitterType: 'sphere' as const,
    particleCount: 180,
    emissionRate: 90,
    lifetime: 1.0,
    size: { min: 0.12, max: 0.38 },
    speed: { min: 3, max: 8 },
    color: {
      start: new BABYLON.Color4(0, 0.5, 1, 1),
      end: new BABYLON.Color4(0, 1, 1, 0),
    },
    gravity: new BABYLON.Vector3(0, -4, 0),
  } as ParticleSystemConfig,

  // 生产特效 - 绿色流动
  productionEffect: {
    name: 'productionEffect',
    emitterType: 'box' as const,
    particleCount: 80,
    emissionRate: 40,
    lifetime: 1.2,
    size: { min: 0.08, max: 0.25 },
    speed: { min: 1, max: 3 },
    color: {
      start: new BABYLON.Color4(0.5, 1, 0.5, 1),
      end: new BABYLON.Color4(0, 1, 0, 0),
    },
    gravity: new BABYLON.Vector3(0, -1, 0),
  } as ParticleSystemConfig,
};
