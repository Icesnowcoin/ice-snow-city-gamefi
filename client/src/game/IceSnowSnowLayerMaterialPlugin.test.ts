import { describe, expect, it, vi } from "vitest";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Scene } from "@babylonjs/core/scene";
import { IceSnowSnowLayerMaterialPlugin } from "./IceSnowSnowLayerMaterialPlugin";

describe("IceSnowSnowLayerMaterialPlugin", () => {
  function createPlugin(options: ConstructorParameters<typeof IceSnowSnowLayerMaterialPlugin>[1] = {}) {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const material = new PBRMaterial("test-pbr", scene);
    const plugin = new IceSnowSnowLayerMaterialPlugin(material, options);
    return { engine, scene, material, plugin };
  }

  it("registers the snow layer define and injects only fragment shader code", () => {
    const { engine, scene, material, plugin } = createPlugin({ quality: "high" });
    const defines = material.getActiveTextures ? ({} as never) : ({} as never);
    plugin.prepareDefines(defines, scene, material as never);

    expect(defines.ISC_SNOW_LAYER).toBe(true);
    expect(defines.ISC_SNOW_HIGH).toBe(true);
    expect(defines.ISC_SNOW_MEDIUM).toBe(false);
    expect(plugin.getCustomCode("vertex")).toBeNull();
    expect(plugin.getCustomCode("fragment")?.CUSTOM_FRAGMENT_DEFINITIONS).toContain("iscSnowMask");
    expect(plugin.getCustomCode("fragment")?.CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR).toContain("surfaceAlbedo");

    material.dispose();
    scene.dispose();
    engine.dispose();
  });

  it("clamps snow amount and keeps quality changes define-safe", () => {
    const { engine, scene, material, plugin } = createPlugin({ amount: 4 });
    const buffer = {
      updateFloat: vi.fn(),
      updateColor3: vi.fn(),
    };

    plugin.bindForSubMesh(buffer as never, scene, engine as never, undefined as never);
    expect(buffer.updateFloat).toHaveBeenCalledWith("iscSnowAmount", 1);

    plugin.setQuality("low");
    const defines = {} as Record<string, boolean>;
    plugin.prepareDefines(defines as never, scene, material as never);
    expect(defines.ISC_SNOW_HIGH).toBe(false);
    expect(defines.ISC_SNOW_MEDIUM).toBe(false);

    material.dispose();
    scene.dispose();
    engine.dispose();
  });

  it("binds tunable uniforms and copies the snow color value", () => {
    const color = new Color3(0.2, 0.4, 0.6);
    const { engine, scene, material, plugin } = createPlugin({
      amount: 0.25,
      worldHeight: 7,
      snowColor: color,
    });
    const buffer = {
      updateFloat: vi.fn(),
      updateColor3: vi.fn(),
    };

    plugin.setSnowAmount(0.75);
    plugin.setWorldHeight(9);
    plugin.setSnowColor(new Color3(0.9, 0.9, 0.95));
    plugin.bindForSubMesh(buffer as never, scene, engine as never, undefined as never);

    expect(buffer.updateFloat).toHaveBeenCalledWith("iscSnowAmount", 0.75);
    expect(buffer.updateFloat).toHaveBeenCalledWith("iscSnowWorldHeight", 9);
    expect(buffer.updateFloat).toHaveBeenCalledWith("iscSnowRoughness", 0.48);
    expect(buffer.updateColor3).toHaveBeenCalledWith("iscSnowColor", expect.any(Color3));
    expect(plugin.getUniforms().ubo).toEqual(expect.arrayContaining([
      { name: "iscSnowAmount", size: 1, type: "float" },
      { name: "iscSnowColor", size: 3, type: "vec3" },
    ]));

    material.dispose();
    scene.dispose();
    engine.dispose();
  });
});
