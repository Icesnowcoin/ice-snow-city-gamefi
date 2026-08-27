import {
  CORE_ASSET_MANIFEST,
  validateAssetManifest,
  validateAssetManifestEntry,
  type AssetManifestEntry,
} from "./assetManifest";
import { validateTextureSet, type TextureOptimizationInput } from "./textureOptimization";
import { validateAnimationExport, type AnimationExportInput } from "./animationExportValidation";

export type AssetReadinessInput = {
  manifest?: AssetManifestEntry[];
  textures?: TextureOptimizationInput[];
  animations?: AnimationExportInput[];
};

export type AssetReadinessReport = {
  ready: boolean;
  totalAssets: number;
  runtimeReadyAssets: number;
  pendingAssets: number;
  blockingIssues: string[];
  textureBytesMegabytes: number;
  animationReadyClips: number;
  animationPendingClips: number;
};

export function buildAssetReadinessReport(input: AssetReadinessInput = {}): AssetReadinessReport {
  const manifest = input.manifest ?? CORE_ASSET_MANIFEST;
  const manifestReport = validateAssetManifest(manifest);
  const blockingIssues = [...manifestReport.messages];

  for (const texture of input.textures ?? []) {
    const result = validateTextureSet([texture]);
    for (const issue of result.issues) blockingIssues.push(`${issue.assetId}/${issue.map}: ${issue.message}`);
  }

  let animationReadyClips = 0;
  let animationPendingClips = 0;
  for (const animation of input.animations ?? []) {
    const result = validateAnimationExport(animation);
    if (result.runtimeReady) animationReadyClips += 1;
    else animationPendingClips += 1;
    for (const issue of result.issues) blockingIssues.push(`${animation.assetId}/${animation.clipName}: ${issue.message}`);
  }

  return {
    ready: manifestReport.complete && blockingIssues.length === 0,
    totalAssets: manifestReport.total,
    runtimeReadyAssets: manifestReport.verified,
    pendingAssets: manifestReport.pending,
    blockingIssues,
    textureBytesMegabytes: Number((validateTextureSet(input.textures ?? []).totalMegabytes).toFixed(2)),
    animationReadyClips,
    animationPendingClips,
  };
}

export function isAssetRuntimeReady(entry: AssetManifestEntry): boolean {
  return validateAssetManifestEntry(entry).readyForRuntime;
}
