import * as BABYLON from '@babylonjs/core';

interface VfxOptions {
  reducedMotion?: boolean;
  lowQuality?: boolean;
}

/**
 * 基础地标专属视觉特效。
 * 所有动画、粒子和材质都由该管理器拥有，地图销毁时统一释放。
 */
export class LandmarkVfxManager {
  private readonly scene: BABYLON.Scene;
  private readonly roots: Map<string, BABYLON.TransformNode>;
  private readonly disposables: BABYLON.IDisposable[] = [];
  private readonly observers: BABYLON.Observer<BABYLON.Scene>[] = [];
  private readonly particleSystems: BABYLON.ParticleSystem[] = [];
  private glowLayer: BABYLON.GlowLayer | null = null;

  constructor(scene: BABYLON.Scene, roots: Map<string, BABYLON.TransformNode>, options: VfxOptions = {}) {
    this.scene = scene;
    this.roots = roots;
    this.createCoreHalo(options);
    this.createMarketParticles(options);
    this.createLandmarkBeacons(options);
  }

  public dispose(): void {
    this.observers.forEach((observer) => this.scene.onBeforeRenderObservable.remove(observer));
    this.particleSystems.forEach((particles) => particles.dispose());
    this.disposables.forEach((disposable) => disposable.dispose());
    this.glowLayer?.dispose();
    this.glowLayer = null;
    this.observers.length = 0;
    this.particleSystems.length = 0;
    this.disposables.length = 0;
  }

  private createCoreHalo(options: VfxOptions): void {
    const root = this.roots.get('landmark-city-core');
    if (!root) return;

    const halo = BABYLON.MeshBuilder.CreateTorus('landmark-city-core-halo', {
      diameter: 36,
      thickness: 0.65,
      tessellation: options.lowQuality ? 24 : 40,
    }, this.scene);
    halo.parent = root;
    halo.position.y = 17;
    halo.rotation.x = Math.PI / 2;
    halo.isPickable = false;

    const material = new BABYLON.PBRMaterial('landmark-city-core-halo-pbr', this.scene);
    material.albedoColor = BABYLON.Color3.FromHexString('#71E7FF');
    material.emissiveColor = BABYLON.Color3.FromHexString('#2AC7FF');
    material.metallic = 0.7;
    material.roughness = 0.2;
    material.alpha = 0.82;
    material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    halo.material = material;
    this.disposables.push(halo, material);

    if (!options.reducedMotion) {
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        halo.rotation.z += 0.004;
        const pulse = 1 + Math.sin(performance.now() * 0.002) * 0.035;
        halo.scaling.set(pulse, pulse, pulse);
      });
      if (observer) this.observers.push(observer);
    }

    if (!options.reducedMotion && !options.lowQuality) {
      this.glowLayer ??= new BABYLON.GlowLayer('landmark-vfx-glow', this.scene, { blurKernelSize: 32 });
      this.glowLayer.addIncludedOnlyMesh(halo);
    }
  }

  private createLandmarkBeacons(options: VfxOptions): void {
    this.roots.forEach((root, id) => {
      if (id === 'landmark-city-core' || id === 'landmark-central-market') return;
      const beacon = BABYLON.MeshBuilder.CreateSphere(`${id}-beacon`, {
        diameter: options.lowQuality ? 1.2 : 1.6,
        segments: options.lowQuality ? 8 : 12,
      }, this.scene);
      beacon.parent = root;
      beacon.position.y = 20;
      beacon.isPickable = false;
      const material = new BABYLON.PBRMaterial(`${id}-beacon-pbr`, this.scene);
      material.albedoColor = BABYLON.Color3.FromHexString('#FFD700');
      material.emissiveColor = BABYLON.Color3.FromHexString('#7EEBFF');
      material.metallic = 0.35;
      material.roughness = 0.3;
      beacon.material = material;
      this.disposables.push(beacon, material);
      if (!options.lowQuality && !options.reducedMotion) {
        this.glowLayer ??= new BABYLON.GlowLayer('landmark-vfx-glow', this.scene, { blurKernelSize: 32 });
        this.glowLayer.addIncludedOnlyMesh(beacon);
      }
    });
  }

  private createMarketParticles(options: VfxOptions): void {
    const root = this.roots.get('landmark-central-market');
    if (!root || options.reducedMotion) return;

    const emitter = BABYLON.MeshBuilder.CreateBox('landmark-market-particle-emitter', { size: 1 }, this.scene);
    emitter.parent = root;
    emitter.position.y = 14;
    emitter.isVisible = false;
    emitter.isPickable = false;
    this.disposables.push(emitter);

    const particles = new BABYLON.ParticleSystem('landmark-market-particles', options.lowQuality ? 28 : 56, this.scene);
    particles.emitter = emitter;
    particles.minEmitBox = new BABYLON.Vector3(-22, -7, -16);
    particles.maxEmitBox = new BABYLON.Vector3(22, 7, 16);
    particles.minLifeTime = 1.8;
    particles.maxLifeTime = 3.6;
    particles.minSize = options.lowQuality ? 0.18 : 0.22;
    particles.maxSize = options.lowQuality ? 0.42 : 0.56;
    particles.minEmitPower = 0.1;
    particles.maxEmitPower = 0.45;
    particles.emitRate = options.lowQuality ? 10 : 18;
    particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    particles.color1 = new BABYLON.Color4(0.55, 0.82, 1, 0.9);
    particles.color2 = new BABYLON.Color4(0.75, 0.45, 1, 0.75);
    particles.colorDead = new BABYLON.Color4(0.35, 0.75, 1, 0);
    particles.gravity = new BABYLON.Vector3(0, 0.12, 0);

    const texture = new BABYLON.DynamicTexture('landmark-market-particle-texture', 32, this.scene);
    const context = texture.getContext();
    if (context) {
      context.clearRect(0, 0, 32, 32);
      context.fillStyle = '#FFFFFF';
      context.beginPath();
      context.arc(16, 16, 13, 0, Math.PI * 2);
      context.fill();
      texture.update();
    }
    particles.particleTexture = texture;
    particles.start();
    this.particleSystems.push(particles);
    this.disposables.push(texture);
  }
}
