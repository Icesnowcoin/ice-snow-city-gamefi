import * as BABYLON from '@babylonjs/core';
import { Season, VegetationSeasonalAppearance, SeasonSystem } from './SeasonSystem';
import { ParticleSystemManager } from '../effects/ParticleSystem';

/**
 * 植被季节变化管理器
 * 管理植被根据季节的颜色、形状和粒子效果变化
 */
export class VegetationSeasonManager {
  private seasonSystem: SeasonSystem;
  private particleManager: ParticleSystemManager;
  private vegetationMeshes: Map<BABYLON.Mesh, { materials: BABYLON.Material[] }> = new Map();
  private seasonalParticles: Map<Season, BABYLON.ParticleSystem> = new Map();

  constructor(seasonSystem: SeasonSystem, particleManager: ParticleSystemManager) {
    this.seasonSystem = seasonSystem;
    this.particleManager = particleManager;
  }

  /**
   * 注册植被网格
   */
  public registerVegetation(mesh: BABYLON.Mesh): void {
    const materials = mesh.material ? [mesh.material] : [];
    this.vegetationMeshes.set(mesh, { materials });
  }

  /**
   * 应用季节外观到植被
   */
  public applySeasonalAppearance(mesh: BABYLON.Mesh, appearance: VegetationSeasonalAppearance): void {
    // 更新网格缩放
    mesh.scaling = new BABYLON.Vector3(appearance.scale, appearance.scale, appearance.scale);

    // 更新材质颜色
    const material = mesh.material as BABYLON.StandardMaterial;
    if (material) {
      // 更新叶子颜色
      material.emissiveColor = appearance.foliageColor;
      material.alpha = appearance.foliageAlpha;

      // 根据季节调整发光效果
      if (appearance.season === 'summer') {
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      } else if (appearance.season === 'winter') {
        material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5); // 冬季更亮
      } else {
        material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      }
    }

    // 更新树干颜色（如果有子网格）
    const children = mesh.getChildren();
    children.forEach((child) => {
      if (child instanceof BABYLON.Mesh && child.name.includes('trunk')) {
        const trunkMaterial = child.material as BABYLON.StandardMaterial;
        if (trunkMaterial) {
          trunkMaterial.emissiveColor = appearance.trunkColor;
        }
      }
    });
  }

  /**
   * 应用季节粒子效果
   */
  public applySeasonalParticles(
    mesh: BABYLON.Mesh,
    appearance: VegetationSeasonalAppearance,
    scene: BABYLON.Scene
  ): void {
    // 清理旧的粒子效果
    const oldParticles = this.seasonalParticles.get(appearance.season);
    if (oldParticles) {
      oldParticles.dispose();
    }

    if (appearance.particleIntensity === 0) return;

    let particleSystem: BABYLON.ParticleSystem | null = null;

    switch (appearance.season) {
      case 'spring':
        particleSystem = this.createFlowerPetalsParticles(mesh, appearance.particleIntensity, scene);
        break;
      case 'summer':
        // 夏季没有特殊粒子效果
        break;
      case 'autumn':
        particleSystem = this.createFallingLeavesParticles(mesh, appearance.particleIntensity, scene);
        break;
      case 'winter':
        particleSystem = this.createSnowParticles(mesh, appearance.particleIntensity, scene);
        break;
    }

    if (particleSystem) {
      this.seasonalParticles.set(appearance.season, particleSystem);
      particleSystem.start();
    }
  }

  /**
   * 创建花瓣粒子（春季）
   */
  private createFlowerPetalsParticles(
    mesh: BABYLON.Mesh,
    intensity: number,
    scene: BABYLON.Scene
  ): BABYLON.ParticleSystem {
    const particleSystem = new BABYLON.ParticleSystem('flowerPetals', 500, scene);

    particleSystem.emitter = mesh;
    particleSystem.particleTexture = new BABYLON.DynamicTexture('petalTexture', 64, scene);

    // 粒子设置
    particleSystem.addColorGradient(0, new BABYLON.Color4(1, 0.8, 0.9, 0.8));
    particleSystem.addColorGradient(1, new BABYLON.Color4(1, 0.8, 0.9, 0));

    particleSystem.minEmitBox = new BABYLON.Vector3(-5, 0, -5);
    particleSystem.maxEmitBox = new BABYLON.Vector3(5, 0, 5);

    particleSystem.minLifeTime = 2;
    particleSystem.maxLifeTime = 5;

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;

    particleSystem.emitRate = Math.floor(50 * intensity);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);

    return particleSystem;
  }

  /**
   * 创建落叶粒子（秋季）
   */
  private createFallingLeavesParticles(
    mesh: BABYLON.Mesh,
    intensity: number,
    scene: BABYLON.Scene
  ): BABYLON.ParticleSystem {
    const particleSystem = new BABYLON.ParticleSystem('fallingLeaves', 1000, scene);

    particleSystem.emitter = mesh;
    particleSystem.particleTexture = new BABYLON.DynamicTexture('leafTexture', 64, scene);

    // 粒子设置
    particleSystem.addColorGradient(0, new BABYLON.Color4(1, 0.6, 0.1, 0.8));
    particleSystem.addColorGradient(0.5, new BABYLON.Color4(1, 0.4, 0.05, 0.8));
    particleSystem.addColorGradient(1, new BABYLON.Color4(1, 0.4, 0.05, 0));

    particleSystem.minEmitBox = new BABYLON.Vector3(-8, 0, -8);
    particleSystem.maxEmitBox = new BABYLON.Vector3(8, 0, 8);

    particleSystem.minLifeTime = 3;
    particleSystem.maxLifeTime = 8;

    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 2;

    particleSystem.emitRate = Math.floor(100 * intensity);

    particleSystem.minSize = 0.2;
    particleSystem.maxSize = 0.5;

    particleSystem.gravity = new BABYLON.Vector3(0, -3, 0);

    // 添加风力效果
    particleSystem.addVelocityGradient(0, 1);
    particleSystem.addVelocityGradient(1, 0.5);

    return particleSystem;
  }

  /**
   * 创建雪粒子（冬季）
   */
  private createSnowParticles(
    mesh: BABYLON.Mesh,
    intensity: number,
    scene: BABYLON.Scene
  ): BABYLON.ParticleSystem {
    const particleSystem = new BABYLON.ParticleSystem('winterSnow', 800, scene);

    particleSystem.emitter = mesh;
    particleSystem.particleTexture = new BABYLON.DynamicTexture('snowTexture', 64, scene);

    // 粒子设置
    particleSystem.addColorGradient(0, new BABYLON.Color4(1, 1, 1, 0.9));
    particleSystem.addColorGradient(1, new BABYLON.Color4(1, 1, 1, 0));

    particleSystem.minEmitBox = new BABYLON.Vector3(-10, 5, -10);
    particleSystem.maxEmitBox = new BABYLON.Vector3(10, 5, 10);

    particleSystem.minLifeTime = 5;
    particleSystem.maxLifeTime = 10;

    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1.5;

    particleSystem.emitRate = Math.floor(80 * intensity);

    particleSystem.minSize = 0.3;
    particleSystem.maxSize = 0.8;

    particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);

    return particleSystem;
  }

  /**
   * 更新所有植被的季节外观
   */
  public updateAllVegetationAppearances(season: Season): void {
    const appearance = this.seasonSystem.getVegetationAppearance(season);
    if (!appearance) return;

    this.vegetationMeshes.forEach((_, mesh) => {
      this.applySeasonalAppearance(mesh, appearance);
      this.applySeasonalParticles(mesh, appearance, mesh.getScene());
    });
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.seasonalParticles.forEach((particles) => {
      particles.dispose();
    });
    this.seasonalParticles.clear();
    this.vegetationMeshes.clear();
  }
}
