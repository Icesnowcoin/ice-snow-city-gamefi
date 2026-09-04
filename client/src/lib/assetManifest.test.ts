import { describe, expect, it } from "vitest";

import { CORE_ASSET_MANIFEST, getAssetRuntimeLabel, validateAssetManifest, validateAssetManifestEntry } from "./assetManifest";

describe("assetManifest", () => {
  it("keeps the core IDs aligned with the real asset delivery manifest", () => {
    expect(CORE_ASSET_MANIFEST.map((entry) => entry.id)).toEqual([
      "player-main",
      "npc-quest-guild",
      "landmark-city-core",
      "landmark-bank",
      "landmark-market",
      "landmark-production",
      "environment-road",
      "environment-vegetation",
    ]);
  });

  it("keeps undelivered assets honest instead of marking them runtime-ready", () => {
    const result = validateAssetManifestEntry(CORE_ASSET_MANIFEST[0]);
    expect(result.valid).toBe(false);
    expect(result.readyForRuntime).toBe(false);
    expect(getAssetRuntimeLabel(CORE_ASSET_MANIFEST[0])).toContain("待导入");
  });

  it("accepts only a verified asset with a storage or HTTPS URL", () => {
    const entry = {
      ...CORE_ASSET_MANIFEST[0],
      glbUrl: "/manus-storage/player.glb",
      status: "verified" as const,
    };
    expect(validateAssetManifestEntry(entry)).toMatchObject({ valid: true, readyForRuntime: true, issues: [] });
    expect(getAssetRuntimeLabel(entry)).toContain("已验证");
  });

  it("reports the catalogue as pending while real GLB assets are missing", () => {
    const result = validateAssetManifest();
    expect(result.complete).toBe(false);
    expect(result.total).toBe(CORE_ASSET_MANIFEST.length);
    expect(result.verified).toBe(0);
    expect(result.pending).toBe(CORE_ASSET_MANIFEST.length);
    expect(result.messages.some((message) => message.includes("真实 GLB 尚未导入"))).toBe(true);
  });

  it("accepts a complete verified catalogue", () => {
    const entries = CORE_ASSET_MANIFEST.map((entry) => ({
      ...entry,
      glbUrl: `/manus-storage/${entry.id}.glb`,
      status: "verified" as const,
    }));
    expect(validateAssetManifest(entries)).toMatchObject({ complete: true, verified: entries.length, pending: 0, blockingIssues: 0 });
  });

  it("rejects a verified asset with an invalid GLB URL", () => {
    const entry = { ...CORE_ASSET_MANIFEST[0], glbUrl: "./player.glb", status: "verified" as const };
    const result = validateAssetManifestEntry(entry);
    expect(result.valid).toBe(false);
    expect(result.readyForRuntime).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("invalid-url");
  });
});
