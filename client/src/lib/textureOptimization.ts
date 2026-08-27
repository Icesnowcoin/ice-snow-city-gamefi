export type TextureFormat = "ktx2" | "webp" | "png" | "jpg";

export type TextureOptimizationInput = {
  assetId: string;
  map: "baseColor" | "normal" | "orm" | "emissive";
  resolution: "1K" | "2K" | "4K";
  format: TextureFormat;
  byteLength: number;
  compressed: boolean;
  mipmaps: boolean;
};

export type TextureOptimizationIssueCode =
  | "invalid-size"
  | "format-not-optimized"
  | "compression-missing"
  | "mipmap-missing"
  | "memory-budget-exceeded";

export type TextureOptimizationIssue = {
  code: TextureOptimizationIssueCode;
  message: string;
};

export type TextureOptimizationResult = {
  valid: boolean;
  estimatedMegabytes: number;
  issues: TextureOptimizationIssue[];
};

const MAX_BYTES_BY_RESOLUTION: Record<TextureOptimizationInput["resolution"], number> = {
  "1K": 2 * 1024 * 1024,
  "2K": 8 * 1024 * 1024,
  "4K": 24 * 1024 * 1024,
};

export function validateTextureOptimization(input: TextureOptimizationInput): TextureOptimizationResult {
  const issues: TextureOptimizationIssue[] = [];
  const maxBytes = MAX_BYTES_BY_RESOLUTION[input.resolution];
  const estimatedMegabytes = Number((input.byteLength / (1024 * 1024)).toFixed(2));

  if (!input.assetId.trim() || !Number.isInteger(input.byteLength) || input.byteLength <= 0) {
    issues.push({ code: "invalid-size", message: "纹理必须有有效资产 ID 和正整数文件大小。" });
  }
  if (input.format === "png" || input.format === "jpg") {
    issues.push({ code: "format-not-optimized", message: "运行时纹理优先使用 KTX2 或 WebP；PNG/JPG 仅允许作为源文件。" });
  }
  if (!input.compressed) {
    issues.push({ code: "compression-missing", message: "运行时纹理必须声明已压缩。" });
  }
  if (!input.mipmaps) {
    issues.push({ code: "mipmap-missing", message: "运行时纹理必须包含 mipmap 或等效的远距离采样策略。" });
  }
  if (Number.isInteger(input.byteLength) && input.byteLength > maxBytes) {
    issues.push({ code: "memory-budget-exceeded", message: `${input.resolution} 纹理超过 ${Math.round(maxBytes / (1024 * 1024))}MB 运行时预算。` });
  }

  return { valid: issues.length === 0, estimatedMegabytes, issues };
}

export function validateTextureSet(inputs: TextureOptimizationInput[]): {
  valid: boolean;
  totalMegabytes: number;
  issues: Array<TextureOptimizationIssue & { assetId: string; map: TextureOptimizationInput["map"] }>;
} {
  const issues: Array<TextureOptimizationIssue & { assetId: string; map: TextureOptimizationInput["map"] }> = [];
  let totalMegabytes = 0;
  for (const input of inputs) {
    const result = validateTextureOptimization(input);
    totalMegabytes += result.estimatedMegabytes;
    for (const issue of result.issues) issues.push({ ...issue, assetId: input.assetId, map: input.map });
  }
  return { valid: issues.length === 0, totalMegabytes: Number(totalMegabytes.toFixed(2)), issues };
}

export const TEXTURE_OPTIMIZATION_RULES = {
  runtimeFormats: ["ktx2", "webp"] as const,
  requiresCompression: true,
  requiresMipmaps: true,
  maxMegabytes: { "1K": 2, "2K": 8, "4K": 24 },
};
