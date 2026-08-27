export type AssetKind = "character" | "npc" | "building" | "environment";
export type AssetDeliveryStatus = "catalogued" | "pending-import" | "verified";

export type AssetManifestEntry = {
  id: string;
  kind: AssetKind;
  displayName: string;
  glbUrl: string | null;
  status: AssetDeliveryStatus;
  polygonBudget: { min: number; max: number };
  textureResolution: string;
  pbrRequired: boolean;
  lodRequired: boolean;
  collisionRequired: boolean;
  animations: string[];
};

export type AssetValidationIssue = {
  code: "missing-url" | "invalid-url" | "budget-invalid" | "pbr-missing" | "lod-missing" | "collision-missing" | "status-mismatch";
  message: string;
};

export type AssetValidationResult = {
  valid: boolean;
  readyForRuntime: boolean;
  issues: AssetValidationIssue[];
};

export const CORE_ASSET_MANIFEST: AssetManifestEntry[] = [
  {
    id: "player-character",
    kind: "character",
    displayName: "玩家角色",
    glbUrl: null,
    status: "pending-import",
    polygonBudget: { min: 15_000, max: 25_000 },
    textureResolution: "2K",
    pbrRequired: true,
    lodRequired: true,
    collisionRequired: true,
    animations: ["idle", "walk", "run", "work", "sleep", "celebrate", "sad", "talk"],
  },
  {
    id: "npc-core-catalogue",
    kind: "npc",
    displayName: "20 个核心 NPC 资产集合",
    glbUrl: null,
    status: "pending-import",
    polygonBudget: { min: 10_000, max: 20_000 },
    textureResolution: "2K",
    pbrRequired: true,
    lodRequired: true,
    collisionRequired: true,
    animations: ["idle", "walk", "talk", "work"],
  },
  {
    id: "urban-building-core",
    kind: "building",
    displayName: "现代都市核心建筑集合",
    glbUrl: null,
    status: "pending-import",
    polygonBudget: { min: 5_000, max: 15_000 },
    textureResolution: "2K-4K",
    pbrRequired: true,
    lodRequired: true,
    collisionRequired: true,
    animations: ["door-open", "production", "harvest"],
  },
  {
    id: "urban-environment-core",
    kind: "environment",
    displayName: "道路、植被、路灯与气象环境集合",
    glbUrl: null,
    status: "pending-import",
    polygonBudget: { min: 500, max: 10_000 },
    textureResolution: "2K",
    pbrRequired: true,
    lodRequired: true,
    collisionRequired: true,
    animations: ["weather", "light-pulse", "smoke"],
  },
];

export function validateAssetManifestEntry(entry: AssetManifestEntry): AssetValidationResult {
  const issues: AssetValidationIssue[] = [];
  const hasValidBudget = Number.isInteger(entry.polygonBudget.min) && Number.isInteger(entry.polygonBudget.max) && entry.polygonBudget.min > 0 && entry.polygonBudget.min <= entry.polygonBudget.max;
  if (!hasValidBudget) issues.push({ code: "budget-invalid", message: "多边形预算必须为正整数，且最小值不能大于最大值。" });
  if (!entry.pbrRequired) issues.push({ code: "pbr-missing", message: "资产必须声明 PBR 材质要求。" });
  if (!entry.lodRequired) issues.push({ code: "lod-missing", message: "资产必须声明 LOD 要求。" });
  if (!entry.collisionRequired) issues.push({ code: "collision-missing", message: "资产必须声明碰撞体要求。" });
  if (!entry.glbUrl) {
    issues.push({ code: "missing-url", message: "真实 GLB 尚未导入；当前只能使用程序化预览或明确的缺失资产回退。" });
  } else if (!/^https?:\/\/|^\/manus-storage\//.test(entry.glbUrl)) {
    issues.push({ code: "invalid-url", message: "GLB 路径必须是 HTTPS URL 或 /manus-storage/ 路径。" });
  }
  if (entry.status === "verified" && (!entry.glbUrl || issues.some((issue) => ["pbr-missing", "lod-missing", "collision-missing", "budget-invalid"].includes(issue.code)))) {
    issues.push({ code: "status-mismatch", message: "未满足运行时校验条件的资产不能标记为 verified。" });
  }
  const blockingCodes = new Set(["budget-invalid", "pbr-missing", "lod-missing", "collision-missing", "status-mismatch"]);
  return { valid: issues.length === 0, readyForRuntime: issues.length === 0 && entry.status === "verified", issues };
}

export function getAssetRuntimeLabel(entry: AssetManifestEntry) {
  const result = validateAssetManifestEntry(entry);
  if (result.readyForRuntime) return "真实 GLB 资产已验证";
  if (result.issues.some((issue) => issue.code === "missing-url")) return "真实 GLB 待导入 · 程序化回退";
  if (result.issues.some((issue) => blockingCodes.has(issue.code))) return "资产规格未通过运行时门禁";
  return "资产待验证";
}

const blockingCodes = new Set<AssetValidationIssue["code"]>(["budget-invalid", "pbr-missing", "lod-missing", "collision-missing", "status-mismatch"]);


export type AssetManifestCompleteness = {
  complete: boolean;
  total: number;
  verified: number;
  pending: number;
  blockingIssues: number;
  messages: string[];
};

/** Validate the complete catalogue without treating pending art delivery as runtime-ready. */
export function validateAssetManifest(entries: AssetManifestEntry[] = CORE_ASSET_MANIFEST): AssetManifestCompleteness {
  const messages: string[] = [];
  let verified = 0;
  let pending = 0;
  let blockingIssues = 0;
  for (const entry of entries) {
    const result = validateAssetManifestEntry(entry);
    if (result.readyForRuntime) verified += 1;
    else pending += 1;
    const blocking = result.issues.filter((issue) => blockingCodes.has(issue.code));
    blockingIssues += blocking.length;
    for (const issue of result.issues) messages.push(`${entry.id}: ${issue.message}`);
  }
  return {
    complete: entries.length > 0 && verified === entries.length && blockingIssues === 0,
    total: entries.length,
    verified,
    pending,
    blockingIssues,
    messages,
  };
}
