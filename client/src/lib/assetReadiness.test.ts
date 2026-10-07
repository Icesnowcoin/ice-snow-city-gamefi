import { describe, expect, it } from "vitest";
import { ProfessionType } from "../../../shared/types/profession";
import { buildAssetReadinessReport } from "./assetReadiness";
import { type AssetManifestEntry } from "./assetManifest";

describe("asset readiness report", () => {
  it("keeps the default catalogue pending until real GLBs arrive", () => {
    const report = buildAssetReadinessReport();
    expect(report.ready).toBe(false);
    expect(report.runtimeReadyAssets).toBe(0);
    expect(report.pendingAssets).toBeGreaterThan(0);
    expect(report.blockingIssues.length).toBeGreaterThan(0);
  });

  it("reports a fully verified asset with compliant texture and animation", () => {
    const manifest: AssetManifestEntry[] = [{
      id: "verified-character",
      kind: "character",
      displayName: "Verified Character",
      glbUrl: "/manus-storage/verified-character.glb",
      status: "verified",
      polygonBudget: { min: 1000, max: 2000 },
      textureResolution: "2K",
      pbrRequired: true,
      lodRequired: true,
      collisionRequired: true,
      animations: ["idle"],
    }];
    const report = buildAssetReadinessReport({
      manifest,
      textures: [{ assetId: "verified-character", map: "baseColor", resolution: "2K", format: "ktx2", byteLength: 1024 * 1024, compressed: true, mipmaps: true }],
      animations: [{ assetId: "verified-character", clipName: "idle", fps: 30, durationSeconds: 3, loop: true, expectedLoop: true, fileUrl: "/manus-storage/verified-character.glb" }],
    });
    expect(report.ready).toBe(true);
    expect(report.runtimeReadyAssets).toBe(1);
    expect(report.animationReadyClips).toBe(1);
  });

  it("aggregates texture and animation blockers without hiding manifest status", () => {
    const report = buildAssetReadinessReport({
      manifest: [],
      textures: [{ assetId: "urban-building-core", map: "baseColor", resolution: "4K", format: "png", byteLength: 30 * 1024 * 1024, compressed: false, mipmaps: false }],
      animations: [{ assetId: "urban-building-core", clipName: "Door Open", fps: 60, durationSeconds: 2, loop: false, expectedLoop: false, fileUrl: null }],
    });
    expect(report.ready).toBe(false);
    expect(report.animationPendingClips).toBe(1);
    expect(report.blockingIssues.some((message) => message.includes("mipmap"))).toBe(true);
    expect(report.blockingIssues.some((message) => message.includes("动画名称"))).toBe(true);
  });
});
