import { describe, expect, it } from "vitest";
import { CORE_ASSET_MANIFEST } from "./assetManifest";
import { evaluateAssetDeliveryGate, summarizeAssetDeliveryGate, type AssetDeliveryEvidence } from "./assetDeliveryGate";

const completeEvidence: AssetDeliveryEvidence = {
  assetId: "player-main",
  glbUrl: "https://cdn.example.com/player.glb",
  polygonCount: 20_000,
  pbrMaps: ["baseColor", "normal", "metallicRoughness"],
  lodCount: 2,
  hasCollisionMesh: true,
  animationFps: 30,
  animationClips: ["idle", "walk", "run", "work", "sleep", "celebrate", "sad", "talk"],
};

describe("asset delivery gate", () => {
  it("keeps missing real files pending instead of treating metadata as accepted", () => {
    const results = evaluateAssetDeliveryGate(CORE_ASSET_MANIFEST);
    expect(results.every((result) => result.status === "pending-evidence")).toBe(true);
    expect(summarizeAssetDeliveryGate(results)).toMatchObject({ total: 8, accepted: 0, pendingEvidence: 8, ready: false });
  });

  it("rejects incomplete or out-of-budget evidence", () => {
    const results = evaluateAssetDeliveryGate([CORE_ASSET_MANIFEST[0]], [{ ...completeEvidence, polygonCount: 30_000, pbrMaps: ["baseColor"], animationFps: 24 }]);
    expect(results[0].status).toBe("rejected");
    expect(results[0].issues).toEqual(expect.arrayContaining(["缺少 PBR 贴图：normal。", "缺少 PBR 贴图：metallicRoughness。", "动画帧率必须为 30 FPS，当前为 24。"]));
  });

  it("does not accept evidence until the manifest itself is verified", () => {
    const results = evaluateAssetDeliveryGate([CORE_ASSET_MANIFEST[0]], [completeEvidence]);
    expect(results[0].accepted).toBe(false);
    expect(results[0].issues.at(-1)).toContain("资产登记仍未满足运行时门禁");
  });
});
