import { Color3, PBRMaterial, Scene } from "@babylonjs/core";

export type PbrMaterialKind = "glass" | "metal" | "concrete" | "snow" | "vegetation";

export interface PbrMaterialPreset {
  kind: PbrMaterialKind;
  name: string;
  baseColor: [number, number, number];
  metallic: number;
  roughness: number;
  alpha: number;
  transmission: number;
  textureStatus: "pending-import" | "verified";
}

export const PBR_MATERIAL_PRESETS: Record<PbrMaterialKind, PbrMaterialPreset> = {
  glass: { kind: "glass", name: "都市低温玻璃", baseColor: [0.12, 0.36, 0.52], metallic: 0.05, roughness: 0.08, alpha: 0.42, transmission: 0.82, textureStatus: "pending-import" },
  metal: { kind: "metal", name: "冰雪都市金属", baseColor: [0.24, 0.32, 0.42], metallic: 0.9, roughness: 0.24, alpha: 1, transmission: 0, textureStatus: "pending-import" },
  concrete: { kind: "concrete", name: "现代混凝土", baseColor: [0.38, 0.43, 0.48], metallic: 0.04, roughness: 0.78, alpha: 1, transmission: 0, textureStatus: "pending-import" },
  snow: { kind: "snow", name: "城市积雪", baseColor: [0.82, 0.92, 1], metallic: 0, roughness: 0.62, alpha: 1, transmission: 0.06, textureStatus: "pending-import" },
  vegetation: { kind: "vegetation", name: "耐寒植被", baseColor: [0.08, 0.3, 0.2], metallic: 0, roughness: 0.7, alpha: 1, transmission: 0, textureStatus: "pending-import" },
};

export function validatePbrMaterialPreset(preset: PbrMaterialPreset): string[] {
  const errors: string[] = [];
  if (!PBR_MATERIAL_PRESETS[preset.kind]) errors.push("材质类型不在 Ice Snow City 预设范围内");
  for (const [label, value] of [["metallic", preset.metallic], ["roughness", preset.roughness], ["alpha", preset.alpha], ["transmission", preset.transmission]] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 1) errors.push(`${label} 必须处于 0 到 1 之间`);
  }
  if (preset.baseColor.length !== 3 || preset.baseColor.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) errors.push("baseColor 必须是三个 0 到 1 之间的颜色通道");
  if (preset.textureStatus === "verified") errors.push("真实纹理未完成导入验证前不得标记为 verified");
  return errors;
}

export function createPbrMaterial(scene: Scene, preset: PbrMaterialPreset, materialName = preset.name): PBRMaterial {
  const errors = validatePbrMaterialPreset(preset);
  if (errors.length > 0) throw new Error(`PBR 材质参数无效：${errors.join("；")}`);
  const material = new PBRMaterial(materialName, scene);
  material.albedoColor = Color3.FromArray(preset.baseColor);
  material.metallic = preset.metallic;
  material.roughness = preset.roughness;
  material.alpha = preset.alpha;
  material.transparencyMode = preset.alpha < 1 ? PBRMaterial.PBRMATERIAL_ALPHABLEND : PBRMaterial.PBRMATERIAL_OPAQUE;
  return material;
}
