import { describe, expect, it } from "vitest";
import { validateTextureOptimization, validateTextureSet } from "./textureOptimization";

describe("texture optimization budget", () => {
  it("accepts a compressed KTX2 texture with mipmaps inside the 2K budget", () => {
    const result = validateTextureOptimization({
      assetId: "urban-building-core",
      map: "baseColor",
      resolution: "2K",
      format: "ktx2",
      byteLength: 4 * 1024 * 1024,
      compressed: true,
      mipmaps: true,
    });
    expect(result.valid).toBe(true);
    expect(result.estimatedMegabytes).toBe(4);
  });

  it("reports source-format, compression and mipmap issues without pretending optimization succeeded", () => {
    const result = validateTextureOptimization({
      assetId: "player-character",
      map: "normal",
      resolution: "2K",
      format: "png",
      byteLength: 2 * 1024 * 1024,
      compressed: false,
      mipmaps: false,
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "format-not-optimized",
      "compression-missing",
      "mipmap-missing",
    ]);
  });

  it("flags a texture larger than the declared 4K runtime budget", () => {
    const result = validateTextureOptimization({
      assetId: "urban-building-core",
      map: "normal",
      resolution: "4K",
      format: "webp",
      byteLength: 25 * 1024 * 1024,
      compressed: true,
      mipmaps: true,
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "memory-budget-exceeded")).toBe(true);
  });

  it("aggregates a texture set with asset and map context", () => {
    const result = validateTextureSet([
      {
        assetId: "urban-environment-core",
        map: "orm",
        resolution: "1K",
        format: "ktx2",
        byteLength: 1 * 1024 * 1024,
        compressed: true,
        mipmaps: true,
      },
      {
        assetId: "urban-environment-core",
        map: "emissive",
        resolution: "1K",
        format: "jpg",
        byteLength: 1 * 1024 * 1024,
        compressed: true,
        mipmaps: true,
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.totalMegabytes).toBe(2);
    expect(result.issues[0]).toMatchObject({ assetId: "urban-environment-core", map: "emissive" });
  });
});
