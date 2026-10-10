import * as BABYLON from '@babylonjs/core';
import { configureIceSnowPbrMaterial, IceSnowSnowLayerMaterialPlugin, SnowLayerQuality } from '../IceSnowSnowLayerMaterialPlugin';

export type IceSnowRenderQuality = 'low' | 'medium' | 'high';

export interface IceSnowRenderingOptions {
  quality?: IceSnowRenderQuality;
  enableFog?: boolean;
}

export interface IceSnowLightingRig {
  sun: BABYLON.DirectionalLight;
  moon: BABYLON.DirectionalLight;
  ambient: BABYLON.HemisphericLight;
  fill: BABYLON.HemisphericLight;
  shadowGenerator: BABYLON.ShadowGenerator;
}

const QUALITY: Record<IceSnowRenderQuality, {
  shadowMapSize: number;
  shadowBlur: number;
  maxLights: number;
  fogDensity: number;
  snowQuality: SnowLayerQuality;
}> = {
  low: { shadowMapSize: 1024, shadowBlur: 12, maxLights: 1, fogDensity: 0.0018, snowQuality: 'low' },
  medium: { shadowMapSize: 1536, shadowBlur: 20, maxLights: 2, fogDensity: 0.00125, snowQuality: 'medium' },
  high: { shadowMapSize: 2048, shadowBlur: 32, maxLights: 4, fogDensity: 0.00085, snowQuality: 'high' },
};

/**
 * Central visual profile for Ice Snow City's mobile-first winter rendering.
 * It keeps the scene physically coherent while scaling shadow and shader cost
 * by device quality tier.
 */
export class IceSnowRenderingProfile {
  private readonly scene: BABYLON.Scene;
  private readonly options: Required<IceSnowRenderingOptions>;
  private readonly quality: (typeof QUALITY)[IceSnowRenderQuality];
  private lightingRig: IceSnowLightingRig | null = null;

  public constructor(scene: BABYLON.Scene, options: IceSnowRenderingOptions = {}) {
    this.scene = scene;
    const quality = options.quality ?? detectQuality();
    this.options = { quality, enableFog: options.enableFog ?? true };
    this.quality = QUALITY[quality];
  }

  public setupLighting(): IceSnowLightingRig {
    this.disposeLighting();

    const sun = new BABYLON.DirectionalLight('isc-sun-light', new BABYLON.Vector3(-0.42, -0.86, 0.28), this.scene);
    sun.intensity = 1.15;
    sun.diffuse = new BABYLON.Color3(1.0, 0.96, 0.88);
    sun.specular = new BABYLON.Color3(1.0, 0.97, 0.9);
    sun.position = new BABYLON.Vector3(120, 180, -100);
    sun.shadowMinZ = 0.5;
    sun.shadowMaxZ = 650;

    const moon = new BABYLON.DirectionalLight('isc-moon-light', new BABYLON.Vector3(0.35, -0.8, -0.45), this.scene);
    moon.intensity = 0.08;
    moon.diffuse = new BABYLON.Color3(0.42, 0.58, 0.95);
    moon.specular = new BABYLON.Color3(0.25, 0.38, 0.72);

    const ambient = new BABYLON.HemisphericLight('isc-sky-ambient', new BABYLON.Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.48;
    ambient.diffuse = new BABYLON.Color3(0.72, 0.86, 1.0);
    ambient.groundColor = new BABYLON.Color3(0.16, 0.24, 0.34);
    ambient.specular = new BABYLON.Color3(0.3, 0.42, 0.62);

    const fill = new BABYLON.HemisphericLight('isc-snow-fill', new BABYLON.Vector3(0, -1, 0), this.scene);
    fill.intensity = 0.12;
    fill.diffuse = new BABYLON.Color3(0.62, 0.78, 1.0);
    fill.groundColor = new BABYLON.Color3(0.08, 0.13, 0.22);

    const shadowGenerator = new BABYLON.ShadowGenerator(this.quality.shadowMapSize, sun);
    shadowGenerator.bias = 0.0005;
    shadowGenerator.normalBias = 0.03;
    shadowGenerator.usePercentageCloserFiltering = this.options.quality !== 'low';
    shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
    if (this.options.quality === 'high') {
      shadowGenerator.useBlurExponentialShadowMap = true;
      shadowGenerator.blurKernel = this.quality.shadowBlur;
    }

    this.lightingRig = { sun, moon, ambient, fill, shadowGenerator };
    this.configureSceneAtmosphere();
    return this.lightingRig;
  }

  public configureSceneAtmosphere(): void {
    this.scene.ambientColor = new BABYLON.Color3(0.16, 0.22, 0.32);
    this.scene.clearColor = new BABYLON.Color4(0.055, 0.1, 0.18, 1);
    this.scene.environmentIntensity = this.options.quality === 'high' ? 0.75 : 0.58;
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.scene.imageProcessingConfiguration.exposure = 1.05;
    this.scene.imageProcessingConfiguration.contrast = 1.12;

    if (this.options.enableFog) {
      this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      this.scene.fogDensity = this.quality.fogDensity;
      this.scene.fogColor = new BABYLON.Color3(0.62, 0.76, 0.9);
    }
  }

  public configurePbrMaterial(material: BABYLON.PBRMaterial, snowAmount = 0.48): IceSnowSnowLayerMaterialPlugin {
    material.environmentIntensity = this.options.quality === 'high' ? 0.82 : 0.62;
    material.usePhysicalLightFalloff = true;
    material.maxSimultaneousLights = this.quality.maxLights;
    material.forceIrradianceInFragment = this.options.quality === 'high';
    return configureIceSnowPbrMaterial(material, this.quality.snowQuality);
  }

  public configureMesh(mesh: BABYLON.AbstractMesh, castShadow = true): void {
    mesh.receiveShadows = true;
    if (castShadow && this.lightingRig) {
      this.lightingRig.shadowGenerator.addShadowCaster(mesh, true);
    }
  }

  public applyToSceneMeshes(): void {
    for (const mesh of this.scene.meshes) {
      const canCastShadow = mesh.isVisible && mesh.name !== 'ground' && !mesh.name.toLowerCase().includes('sky');
      this.configureMesh(mesh, canCastShadow);
      if (mesh.material instanceof BABYLON.PBRMaterial) {
        this.configurePbrMaterial(mesh.material);
      }
    }
  }

  public getQuality(): IceSnowRenderQuality {
    return this.options.quality;
  }

  public disposeLighting(): void {
    this.lightingRig?.shadowGenerator.dispose();
    this.lightingRig?.sun.dispose();
    this.lightingRig?.moon.dispose();
    this.lightingRig?.ambient.dispose();
    this.lightingRig?.fill.dispose();
    this.lightingRig = null;
  }

  public dispose(): void {
    this.disposeLighting();
  }
}

export function detectQuality(): IceSnowRenderQuality {
  if (typeof navigator === 'undefined') return 'medium';
  const cores = navigator.hardwareConcurrency ?? 8;
  if (cores <= 4) return 'low';
  if (cores >= 8) return 'high';
  return 'medium';
}
