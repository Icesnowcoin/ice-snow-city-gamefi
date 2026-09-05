import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { Material } from "@babylonjs/core/Materials/material";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { MaterialPluginBase } from "@babylonjs/core/Materials/materialPluginBase";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";

export type SnowLayerQuality = "low" | "medium" | "high";

export interface SnowLayerOptions {
  quality?: SnowLayerQuality;
  amount?: number;
  worldHeight?: number;
  heightSoftness?: number;
  slopeThreshold?: number;
  slopeSoftness?: number;
  snowRoughness?: number;
  snowColor?: Color3;
}

/**
 * Lightweight snow overlay for Babylon PBRMaterial.
 *
 * It intentionally does not replace Babylon's PBR BRDF. The plugin only adjusts
 * surfaceAlbedo and roughness before the standard PBR lighting is evaluated.
 */
export class IceSnowSnowLayerMaterialPlugin extends MaterialPluginBase {
  private readonly defineName = "ISC_SNOW_LAYER";
  private quality: SnowLayerQuality;
  private snowAmount: number;
  private worldHeight: number;
  private heightSoftness: number;
  private slopeThreshold: number;
  private slopeSoftness: number;
  private snowRoughness: number;
  private snowColor: Color3;

  public constructor(
    material: PBRMaterial,
    options: SnowLayerOptions = {},
  ) {
    super(material, "IceSnowSnowLayer", 150, { uniformBuffer: true });

    this.quality = options.quality ?? "medium";
    this.snowAmount = clamp01(options.amount ?? 0.45);
    this.worldHeight = options.worldHeight ?? 3.0;
    this.heightSoftness = Math.max(0.01, options.heightSoftness ?? 1.25);
    this.slopeThreshold = clamp01(options.slopeThreshold ?? 0.55);
    this.slopeSoftness = Math.max(0.01, options.slopeSoftness ?? 0.2);
    this.snowRoughness = clamp01(options.snowRoughness ?? 0.48);
    this.snowColor = options.snowColor?.clone() ?? new Color3(0.88, 0.94, 0.97);
  }

  public override prepareDefines(
    defines: MaterialDefines,
    _scene: Scene,
    _mesh: AbstractMesh,
  ): void {
    (defines as Record<string, boolean>)[this.defineName] = true;
    (defines as Record<string, boolean>)["ISC_SNOW_HIGH"] = this.quality === "high";
    (defines as Record<string, boolean>)["ISC_SNOW_MEDIUM"] = this.quality === "medium";
  }

  public override getUniforms() {

    return {
      ubo: [
        { name: "iscSnowAmount", size: 1, type: "float" },
        { name: "iscSnowWorldHeight", size: 1, type: "float" },
        { name: "iscSnowHeightSoftness", size: 1, type: "float" },
        { name: "iscSnowSlopeThreshold", size: 1, type: "float" },
        { name: "iscSnowSlopeSoftness", size: 1, type: "float" },
        { name: "iscSnowRoughness", size: 1, type: "float" },
        { name: "iscSnowColor", size: 3, type: "vec3" },
      ],
    };
  }

  public override bindForSubMesh(
    uniformBuffer: UniformBuffer,
    _scene: Scene,
    _engine: unknown,
    _subMesh: unknown,
  ): void {
    uniformBuffer.updateFloat("iscSnowAmount", this.snowAmount);
    uniformBuffer.updateFloat("iscSnowWorldHeight", this.worldHeight);
    uniformBuffer.updateFloat("iscSnowHeightSoftness", this.heightSoftness);
    uniformBuffer.updateFloat("iscSnowSlopeThreshold", this.slopeThreshold);
    uniformBuffer.updateFloat("iscSnowSlopeSoftness", this.slopeSoftness);
    uniformBuffer.updateFloat("iscSnowRoughness", this.snowRoughness);
    uniformBuffer.updateColor3("iscSnowColor", this.snowColor);
  }

  public override getActiveTextures(): BaseTexture[] {
    return [];
  }

  public override getCustomCode(shaderType: string): Record<string, string> | null {
    if (shaderType !== "fragment") {
      return null;
    }

    return {
      CUSTOM_FRAGMENT_DEFINITIONS: `
        #ifdef ISC_SNOW_LAYER
        float iscSnowMask(vec3 n, vec3 p) {
          #if defined(ISC_SNOW_HIGH)
            float upward = smoothstep(
              iscSnowSlopeThreshold - iscSnowSlopeSoftness,
              iscSnowSlopeThreshold + iscSnowSlopeSoftness,
              n.y
            );
            float heightMask = smoothstep(
              iscSnowWorldHeight - iscSnowHeightSoftness,
              iscSnowWorldHeight + iscSnowHeightSoftness,
              p.y
            );
            return clamp(upward * 0.72 + heightMask * 0.28, 0.0, 1.0);
          #elif defined(ISC_SNOW_MEDIUM)
            float upward = smoothstep(
              iscSnowSlopeThreshold - iscSnowSlopeSoftness,
              iscSnowSlopeThreshold + iscSnowSlopeSoftness,
              n.y
            );
            float heightMask = step(iscSnowWorldHeight, p.y);
            return clamp(upward * 0.78 + heightMask * 0.22, 0.0, 1.0);
          #else
            return step(iscSnowSlopeThreshold, n.y) * 0.82;
          #endif
        }
        #endif
      `,
      CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
        #ifdef ISC_SNOW_LAYER
        float iscSnowFactor = iscSnowMask(normalW, vPositionW) * iscSnowAmount;
        surfaceAlbedo = mix(surfaceAlbedo, iscSnowColor, iscSnowFactor);
        roughness = mix(roughness, iscSnowRoughness, iscSnowFactor);
        #endif
      `,
    };
  }

  public setQuality(quality: SnowLayerQuality): void {
    if (this.quality === quality) return;
    this.quality = quality;
    this.markAllDefinesAsDirty();
  }

  public setSnowAmount(amount: number): void {
    this.snowAmount = clamp01(amount);
  }

  public setWorldHeight(height: number): void {
    this.worldHeight = height;
  }

  public setSnowColor(color: Color3): void {
    this.snowColor.copyFrom(color);
  }
}

export function attachIceSnowLayer(
  material: PBRMaterial,
  options: SnowLayerOptions = {},
): IceSnowSnowLayerMaterialPlugin {
  return new IceSnowSnowLayerMaterialPlugin(material, options);
}

export function configureIceSnowPbrMaterial(
  material: PBRMaterial,
  quality: SnowLayerQuality = "medium",
): IceSnowSnowLayerMaterialPlugin {
  material.roughness = 0.72;
  material.metallic = 0.0;
  material.maxSimultaneousLights = quality === "low" ? 1 : 2;

  return attachIceSnowLayer(material, {
    quality,
    amount: quality === "low" ? 0.35 : 0.48,
    snowRoughness: quality === "low" ? 0.56 : 0.48,
  });
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/* Example:

const material = new PBRMaterial("isc-building-pbr", scene);
material.albedoTexture = baseColorTexture;
material.bumpTexture = normalTexture;
material.metallicTexture = packedOrmTexture;
material.useRoughnessFromMettallicTextureGreen = true;
material.useMetallnessFromMetallicTextureBlue = true;

const snow = configureIceSnowPbrMaterial(material, "medium");
snow.setWorldHeight(4.0);
snow.setSnowAmount(0.42);

// On a low-end device:
snow.setQuality("low");

// When the mesh/material is no longer used:
// material.dispose();  // disposes the material and its plugin resources.

*/
