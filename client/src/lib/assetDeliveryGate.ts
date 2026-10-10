import { validateAssetManifestEntry, type AssetManifestEntry } from "./assetManifest";

export type AssetDeliveryEvidence = {
  assetId: string;
  glbUrl: string | null;
  polygonCount: number | null;
  pbrMaps: Array<"baseColor" | "normal" | "metallicRoughness" | "occlusion">;
  lodCount: number;
  hasCollisionMesh: boolean;
  animationFps: number | null;
  animationClips: string[];
};

export type AssetDeliveryGateResult = {
  assetId: string;
  accepted: boolean;
  status: "accepted" | "pending-evidence" | "rejected";
  issues: string[];
};

const REQUIRED_PBR_MAPS = ["baseColor", "normal", "metallicRoughness"] as const;

export function evaluateAssetDeliveryGate(
  manifest: AssetManifestEntry[],
  evidence: AssetDeliveryEvidence[] = [],
): AssetDeliveryGateResult[] {
  return manifest.map((entry) => {
    const issues: string[] = [];
    const manifestResult = validateAssetManifestEntry(entry);
    const proof = evidence.find((candidate) => candidate.assetId === entry.id);

    if (!proof) {
      return { assetId: entry.id, accepted: false, status: "pending-evidence", issues: ["尚未提交真实 GLB/PBR/LOD/碰撞体/动画验收证据。"] };
    }
    if (!proof.glbUrl) issues.push("GLB 文件地址缺失。");
    if (proof.polygonCount === null) issues.push("多边形数量缺失。");
    else if (proof.polygonCount < entry.polygonBudget.min || proof.polygonCount > entry.polygonBudget.max) issues.push(`多边形数量 ${proof.polygonCount} 超出 ${entry.polygonBudget.min}-${entry.polygonBudget.max} 预算。`);
    for (const map of REQUIRED_PBR_MAPS) if (!proof.pbrMaps.includes(map)) issues.push(`缺少 PBR 贴图：${map}。`);
    if (entry.lodRequired && proof.lodCount < 1) issues.push("缺少 LOD 版本。");
    if (entry.collisionRequired && !proof.hasCollisionMesh) issues.push("缺少碰撞体。");
    if (entry.animations.length > 0) {
      if (proof.animationFps !== 30) issues.push(`动画帧率必须为 30 FPS，当前为 ${proof.animationFps ?? "未知"}。`);
      for (const clip of entry.animations) if (!proof.animationClips.includes(clip)) issues.push(`缺少动画片段：${clip}。`);
    }
    if (!manifestResult.readyForRuntime) issues.push("资产登记仍未满足运行时门禁；提交证据后需同步 manifest 的真实 GLB 地址与 verified 状态。");

    return {
      assetId: entry.id,
      accepted: issues.length === 0,
      status: issues.length === 0 ? "accepted" : "rejected",
      issues,
    };
  });
}

export function summarizeAssetDeliveryGate(results: AssetDeliveryGateResult[]) {
  return {
    total: results.length,
    accepted: results.filter((result) => result.accepted).length,
    pendingEvidence: results.filter((result) => result.status === "pending-evidence").length,
    rejected: results.filter((result) => result.status === "rejected").length,
    ready: results.length > 0 && results.every((result) => result.accepted),
  };
}
