import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { REQUIRED_ASSET_IDS, validateExternalDeliveryBundle } from "./validateExternalDeliveryBundle.mjs";

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function makeBundleDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "isc-delivery-"));
  temporaryDirectories.push(directory);
  return directory;
}

function makeAssetEvidence(directory, assetId, index) {
  const file = path.join(directory, `${assetId}.glb`);
  const bytes = Buffer.from(`valid-glb-fixture-${assetId}`);
  fs.writeFileSync(file, bytes);
  return {
    assetId,
    glbPath: path.basename(file),
    glbSha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    mime: "model/gltf-binary",
    gltfVersion: "2.0",
    polygonCount: index % 2 === 0 ? 1000 : 2000,
    pbrMaps: ["baseColor", "normal", "metallicRoughness"],
    lodCount: 2,
    hasCollisionMesh: true,
    isCharacter: assetId === "player-main" || assetId === "npc-quest-guild",
    animationFps: assetId === "player-main" || assetId === "npc-quest-guild" ? 30 : null,
    animationClips: assetId === "player-main" ? ["idle", "walk"] : assetId === "npc-quest-guild" ? ["idle", "talk"] : [],
  };
}

function makeDeviceReport(source) {
  return {
    source,
    deviceModel: source === "ios-real" ? "iPhone test device" : "Android test device",
    osVersion: "test-os",
    browserVersion: "test-browser",
    renderer: "test-renderer",
    samples: ["baseline", "snow-low", "snow-medium", "snow-high"].flatMap((condition) =>
      [1, 2, 3].map((repetition) => ({ condition, repetition, averageFps: 55, p95FrameTimeMs: 20, droppedFrameRatio: 0.01 })),
    ),
  };
}

describe("validateExternalDeliveryBundle", () => {
  it("accepts a complete real-evidence bundle for review", () => {
    const directory = makeBundleDirectory();
    const bundle = {
      schemaVersion: 1,
      assetEvidence: REQUIRED_ASSET_IDS.map((assetId, index) => makeAssetEvidence(directory, assetId, index)),
      devicePerformance: [makeDeviceReport("ios-real"), makeDeviceReport("android-real")],
    };
    expect(validateExternalDeliveryBundle(bundle, directory)).toMatchObject({ readyForReview: true, status: "ready-for-review", assetCount: 8 });
  });

  it("fails closed when real device reports are missing or ci-software is used", () => {
    const directory = makeBundleDirectory();
    const bundle = {
      schemaVersion: 1,
      assetEvidence: REQUIRED_ASSET_IDS.map((assetId, index) => makeAssetEvidence(directory, assetId, index)),
      devicePerformance: [{ ...makeDeviceReport("ios-real"), source: "ci-software" }],
    };
    const result = validateExternalDeliveryBundle(bundle, directory);
    expect(result.readyForReview).toBe(false);
    expect(result.issues.join("\n")).toContain("source must be ios-real or android-real");
    expect(result.issues.join("\n")).toContain("device:android-real: real-device report is missing");
  });

  it("rejects path traversal and a mismatched hash", () => {
    const directory = makeBundleDirectory();
    const asset = makeAssetEvidence(directory, "player-main", 0);
    asset.glbPath = "../outside.glb";
    asset.glbSha256 = "bad";
    const bundle = { schemaVersion: 1, assetEvidence: [asset], devicePerformance: [] };
    const result = validateExternalDeliveryBundle(bundle, directory);
    expect(result.readyForReview).toBe(false);
    expect(result.issues).toContain("asset:player-main: glbPath escapes bundle directory");
  });

  it("rejects duplicate samples and missing required conditions", () => {
    const directory = makeBundleDirectory();
    const bundle = {
      schemaVersion: 1,
      assetEvidence: [],
      devicePerformance: [{ ...makeDeviceReport("ios-real"), samples: [{ condition: "baseline", repetition: 1, averageFps: 55, p95FrameTimeMs: 20, droppedFrameRatio: 0.01 }, { condition: "baseline", repetition: 1, averageFps: 55, p95FrameTimeMs: 20, droppedFrameRatio: 0.01 }] }],
    };
    const result = validateExternalDeliveryBundle(bundle, directory);
    expect(result.readyForReview).toBe(false);
    expect(result.issues).toContain("device:ios-real: duplicate sample baseline:1");
    expect(result.issues).toContain("device:ios-real: missing sample snow-high:3");
  });
});
