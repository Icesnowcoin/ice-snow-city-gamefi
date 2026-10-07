import { describe, expect, it } from "vitest";
import { CORE_ASSET_MANIFEST } from "./assetManifest";
import {
  summarizeAssetPackageValidation,
  validateAssetPackage,
  type AssetPackageArtifact,
} from "./assetPackageValidator";

const validHash = "a".repeat(64);

function createGlbBytes(magic = "glTF", version = 2, declaredLength = 12) {
  const bytes = new Uint8Array(12);
  bytes.set(new TextEncoder().encode(magic).subarray(0, 4));
  const view = new DataView(bytes.buffer);
  view.setUint32(4, version, true);
  view.setUint32(8, declaredLength, true);
  return bytes;
}

function validArtifact(assetId: string): AssetPackageArtifact {
  const entry = CORE_ASSET_MANIFEST.find((candidate) => candidate.id === assetId)!;
  return {
    assetId,
    filePath: `/assets/${assetId}.glb`,
    mimeType: "model/gltf-binary",
    sha256: validHash,
    fileBytes: createGlbBytes(),
    evidence: {
      assetId,
      glbUrl: `/manus-storage/${assetId}.glb`,
      polygonCount: Math.max(entry.polygonBudget.min, 1),
      pbrMaps: ["baseColor", "normal", "metallicRoughness"],
      lodCount: 1,
      hasCollisionMesh: true,
      animationFps: 30,
      animationClips: entry.animations,
    },
  };
}

describe("assetPackageValidator", () => {
  it("keeps missing real files pending-import", () => {
    const results = validateAssetPackage(CORE_ASSET_MANIFEST);
    const summary = summarizeAssetPackageValidation(results);

    expect(summary).toEqual({
      total: 8,
      accepted: 0,
      pendingImport: 8,
      pendingEvidence: 0,
      rejected: 0,
      ready: false,
    });
    expect(results.every((result) => result.status === "pending-import")).toBe(true);
  });

  it("rejects an artifact with unsafe MIME or malformed hash", () => {
    const artifact = validArtifact("player-main");
    artifact.mimeType = "application/octet-stream";
    artifact.sha256 = "not-a-hash";

    const [result] = validateAssetPackage([CORE_ASSET_MANIFEST[0]], [artifact]);

    expect(result.status).toBe("rejected");
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.stringContaining("MIME"),
      expect.stringContaining("SHA-256"),
    ]));
  });

  it("rejects malformed GLB binary headers", () => {
    const artifact = validArtifact("player-main");
    artifact.fileBytes = createGlbBytes("BAD!", 1, 10);
    const [result] = validateAssetPackage([CORE_ASSET_MANIFEST[0]], [artifact]);

    expect(result.status).toBe("rejected");
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.stringContaining("magic"),
      expect.stringContaining("版本"),
      expect.stringContaining("声明长度"),
    ]));
  });

  it("accepts a complete artifact only when runtime evidence is valid", () => {
    const verifiedEntry = {
      ...CORE_ASSET_MANIFEST[0],
      glbUrl: "/manus-storage/player-main.glb",
      status: "verified" as const,
    };
    const [result] = validateAssetPackage(
      [verifiedEntry],
      [validArtifact("player-main")],
    );

    expect(result).toMatchObject({
      assetId: "player-main",
      accepted: true,
      status: "accepted",
      issues: [],
    });
  });
});
