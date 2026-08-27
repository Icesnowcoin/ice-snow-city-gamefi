import { describe, expect, it } from "vitest";
import { PBR_MATERIAL_PRESETS, validatePbrMaterialPreset } from "./pbrMaterialPresets";

describe("PBR material presets", () => {
  it("keeps all five urban material presets within normalized ranges", () => {
    for (const preset of Object.values(PBR_MATERIAL_PRESETS)) expect(validatePbrMaterialPreset(preset)).toEqual([]);
  });

  it("rejects invalid parameters and premature verified texture status", () => {
    const errors = validatePbrMaterialPreset({ ...PBR_MATERIAL_PRESETS.metal, metallic: 1.4, textureStatus: "verified" });
    expect(errors.some((message) => message.includes("metallic"))).toBe(true);
    expect(errors.some((message) => message.includes("verified"))).toBe(true);
  });
});
