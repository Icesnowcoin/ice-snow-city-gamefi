import {
  evaluateAssetDeliveryGate,
  type AssetDeliveryEvidence,
  type AssetDeliveryGateResult,
} from "./assetDeliveryGate";
import type { AssetManifestEntry } from "./assetManifest";

export type AssetPackageArtifact = {
  assetId: string;
  filePath: string | null;
  mimeType: string | null;
  sha256: string | null;
  fileBytes: Uint8Array | null;
  evidence: AssetDeliveryEvidence | null;
};

export type AssetPackageValidationResult = Omit<AssetDeliveryGateResult, "status"> & {
  status: "accepted" | "pending-import" | "pending-evidence" | "rejected";
};

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;

export function validateGlbBinary(fileBytes: Uint8Array | null): string[] {
  if (!fileBytes) return ["GLB 二进制内容缺失。"];
  if (fileBytes.byteLength < 12) return ["GLB 文件小于最小 12 字节头部。"];
  const view = new DataView(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength);
  const magic = new TextDecoder().decode(fileBytes.subarray(0, 4));
  const version = view.getUint32(4, true);
  const declaredLength = view.getUint32(8, true);
  const issues: string[] = [];
  if (magic !== "glTF") issues.push("GLB magic 必须为 glTF。");
  if (version !== 2) issues.push(`GLB 版本必须为 2，当前为 ${version}。`);
  if (declaredLength !== fileBytes.byteLength) issues.push(`GLB 声明长度 ${declaredLength} 与实际长度 ${fileBytes.byteLength} 不一致。`);
  return issues;
}

export function validateAssetPackage(
  manifest: AssetManifestEntry[],
  artifacts: AssetPackageArtifact[] = [],
): AssetPackageValidationResult[] {
  const gateResults = evaluateAssetDeliveryGate(
    manifest,
    artifacts.flatMap((artifact) => (artifact.evidence ? [artifact.evidence] : [])),
  );

  return manifest.map((entry, index) => {
    const artifact = artifacts.find((candidate) => candidate.assetId === entry.id);
    const gate = gateResults[index];
    if (!artifact || !artifact.filePath) {
      return {
        ...gate,
        accepted: false,
        status: "pending-import",
        issues: ["真实资产文件尚未交付，当前保持 pending-import。"],
      };
    }

    const issues = [...gate.issues];
    if (artifact.mimeType !== "model/gltf-binary" && artifact.mimeType !== "model/gltf+json") {
      issues.push(`MIME 类型必须为 model/gltf-binary 或 model/gltf+json，当前为 ${artifact.mimeType ?? "未知"}。`);
    }
    if (!artifact.sha256 || !SHA256_PATTERN.test(artifact.sha256)) {
      issues.push("缺少有效的 64 位十六进制 SHA-256 哈希。");
    }
    issues.push(...validateGlbBinary(artifact.fileBytes));

    return {
      assetId: entry.id,
      accepted: issues.length === 0,
      status: issues.length === 0 ? "accepted" : "rejected",
      issues,
    };
  });
}

export function summarizeAssetPackageValidation(results: AssetPackageValidationResult[]) {
  return {
    total: results.length,
    accepted: results.filter((result) => result.status === "accepted").length,
    pendingImport: results.filter((result) => result.status === "pending-import").length,
    pendingEvidence: results.filter((result) => result.status === "pending-evidence").length,
    rejected: results.filter((result) => result.status === "rejected").length,
    ready: results.length > 0 && results.every((result) => result.accepted),
  };
}
