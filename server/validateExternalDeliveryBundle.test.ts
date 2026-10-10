import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { REQUIRED_ASSET_IDS, validateExternalDeliveryBundle } from "../scripts/validateExternalDeliveryBundle.mjs";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function fixtureDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "isc-delivery-"));
  temporaryDirectories.push(directory);
  return directory;
}

function assetEvidence(directory: string, assetId: string, index: number) {
  const file = path.join(directory, `${assetId}.glb`);
  const bytes = Buffer.from(`fixture-${assetId}`);
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

function deviceReport(source: "ios-real" | "android-real") {
  return {
    source,
    deviceModel: `${source}-fixture`,
    osVersion: "fixture-os",
    browserVersion: "fixture-browser",
    renderer: "fixture-renderer",
    samples: ["baseline", "snow-low", "snow-medium", "snow-high"].flatMap((condition) =>
      [1, 2, 3].map((repetition) => ({ condition, repetition, averageFps: 55, p95FrameTimeMs: 20, droppedFrameRatio: 0.01 })),
    ),
  };
}

describe("external delivery bundle validator", () => {
  it("accepts all canonical assets and both real-device reports", () => {
    const directory = fixtureDirectory();
    const result = validateExternalDeliveryBundle({
      schemaVersion: 1,
      assetEvidence: REQUIRED_ASSET_IDS.map((id, index) => assetEvidence(directory, id, index)),
      devicePerformance: [deviceReport("ios-real"), deviceReport("android-real")],
    }, directory);
    expect(result).toMatchObject({ readyForReview: true, status: "ready-for-review", assetCount: 8 });
  });

  it("rejects ci-software and missing android evidence", () => {
    const directory = fixtureDirectory();
    const ios = { ...deviceReport("ios-real"), source: "ci-software" };
    const result = validateExternalDeliveryBundle({ schemaVersion: 1, assetEvidence: REQUIRED_ASSET_IDS.map((id, index) => assetEvidence(directory, id, index)), devicePerformance: [ios] }, directory);
    expect(result.readyForReview).toBe(false);
    expect(result.issues.join("\n")).toContain("source must be ios-real or android-real");
    expect(result.issues.join("\n")).toContain("device:android-real: real-device report is missing");
  });

  it("rejects path traversal and hash mismatch", () => {
    const directory = fixtureDirectory();
    const asset = assetEvidence(directory, "player-main", 0);
    asset.glbPath = "../outside.glb";
    asset.glbSha256 = "wrong";
    const result = validateExternalDeliveryBundle({ schemaVersion: 1, assetEvidence: [asset], devicePerformance: [] }, directory);
    expect(result.readyForReview).toBe(false);
    expect(result.issues).toContain("asset:player-main: glbPath escapes bundle directory");
  });

  it("rejects duplicate and incomplete samples", () => {
    const directory = fixtureDirectory();
    const result = validateExternalDeliveryBundle({
      schemaVersion: 1,
      assetEvidence: [],
      devicePerformance: [{ ...deviceReport("ios-real"), samples: [{ condition: "baseline", repetition: 1, averageFps: 55, p95FrameTimeMs: 20, droppedFrameRatio: 0.01 }, { condition: "baseline", repetition: 1, averageFps: 55, p95FrameTimeMs: 20, droppedFrameRatio: 0.01 }] }],
    }, directory);
    expect(result.readyForReview).toBe(false);
    expect(result.issues).toContain("device:ios-real: duplicate sample baseline:1");
    expect(result.issues).toContain("device:ios-real: missing sample snow-high:3");
  });

  it("rejects credential, webhook, device identity, and sensitive path fields", () => {
    const result = validateExternalDeliveryBundle({
      schemaVersion: 1,
      accessToken: "token_fixture_redacted",
      slackWebhook: "https://hooks.slack.com/services/T000/B000/SECRET",
      deviceSerial: "SERIAL-REDACTED",
      assetEvidence: [{ assetId: "player-main", glbPath: "SESSION_PROGRESS.md" }],
      devicePerformance: [],
    });
    expect(result.readyForReview).toBe(false);
    expect(result.issues.some((item) => item.startsWith("security:"))).toBe(true);
    expect(result.issues.join("\n")).not.toContain("SECRET");
  });
});
