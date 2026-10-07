export type BaselineCheckStatus = "pass" | "warning" | "pending" | "fail";

export type BaselineCheckKey =
  | "fileIntegrity"
  | "sceneStructure"
  | "geometry"
  | "pbr"
  | "lodCollision"
  | "animation"
  | "babylonLoad"
  | "performance";

export interface BaselineCheckResult {
  key: BaselineCheckKey;
  label: string;
  status: BaselineCheckStatus;
  summary: string;
  detail: string;
}

export interface BaselineAssetSnapshot {
  assetId: string;
  displayName: string;
  kind: string;
  source: "generated-procedural";
  status: "procedural-baseline";
  bytes: number;
  trianglesLod0: number;
  materials: number;
  lodCount: number;
  checks: BaselineCheckResult[];
  warnings: string[];
}

export interface PerformanceSnapshot {
  label: string;
  baselineFps: number;
  snowFps: number;
  baselineP95Ms: number;
  snowP95Ms: number;
  droppedFrameDelta: number;
}

export const BASELINE_CHECK_LABELS: Record<BaselineCheckKey, string> = {
  fileIntegrity: "GLB 文件完整性",
  sceneStructure: "场景结构",
  geometry: "几何与面数",
  pbr: "PBR / 纹理",
  lodCollision: "LOD / 碰撞",
  animation: "骨骼与动画",
  babylonLoad: "Babylon.js 加载",
  performance: "性能趋势",
};

const pendingExternalCheck = (key: Exclude<BaselineCheckKey, "fileIntegrity" | "performance">): BaselineCheckResult => ({
  key,
  label: BASELINE_CHECK_LABELS[key],
  status: "pending",
  summary: "真实证据待导入",
  detail: "当前 baseline 仅用于开发预览；需要真实高保真文件或完整引擎证据后才能完成此项。",
});

const baseChecks = (assetId: string): BaselineCheckResult[] => [
  {
    key: "fileIntegrity",
    label: BASELINE_CHECK_LABELS.fileIntegrity,
    status: "pass",
    summary: "GLB 通过",
    detail: `${assetId} 的 glTF 2.0 magic、版本和声明长度校验通过。`,
  },
  pendingExternalCheck("sceneStructure"),
  pendingExternalCheck("geometry"),
  pendingExternalCheck("pbr"),
  pendingExternalCheck("lodCollision"),
  pendingExternalCheck("animation"),
  pendingExternalCheck("babylonLoad"),
  {
    key: "performance",
    label: BASELINE_CHECK_LABELS.performance,
    status: "pass",
    summary: "CI 软件样本通过",
    detail: "当前结果来自 ci-software 模拟样本，不代表 iOS/Android 真机证据。",
  },
];

const asset = (
  assetId: string,
  displayName: string,
  kind: string,
  bytes: number,
  trianglesLod0: number,
  materials: number,
  lodCount: number,
  warnings: string[],
): BaselineAssetSnapshot => ({
  assetId,
  displayName,
  kind,
  source: "generated-procedural",
  status: "procedural-baseline",
  bytes,
  trianglesLod0,
  materials,
  lodCount,
  checks: baseChecks(assetId),
  warnings,
});

export const BASELINE_ASSETS: BaselineAssetSnapshot[] = [
  asset("player-character-baseline", "玩家角色基线", "角色", 11956, 1200, 1, 2, ["无艺术家制作的最终纹理集", "动画完整性待引擎报告"]),
  asset("npc-citizen-baseline", "市民 NPC 基线", "NPC", 11952, 1200, 1, 2, ["职业变体和完整动画待导入"]),
  asset("landmark-city-core-baseline", "城市核心基线", "地标建筑", 2028, 720, 1, 2, ["PBR、碰撞和远景 LOD 待真实资产证据"]),
  asset("landmark-bank-baseline", "银行地标基线", "地标建筑", 2016, 720, 1, 2, ["金融区最终建筑模型待导入"]),
  asset("landmark-commercial-baseline", "商业中心基线", "地标建筑", 2028, 720, 1, 2, ["商业中心功能细节待真实制作"]),
  asset("landmark-production-baseline", "生产设施基线", "地标建筑", 2028, 720, 1, 2, ["生产动画和碰撞待验证"]),
  asset("environment-road-baseline", "道路与街灯基线", "环境模块", 2028, 480, 1, 2, ["模块化拼接和移动端实例化待验证"]),
  asset("environment-vegetation-baseline", "植被环境基线", "环境模块", 17316, 2400, 1, 2, ["植被批量实例化和雪层材质待验证"]),
];

export const PERFORMANCE_SNAPSHOTS: PerformanceSnapshot[] = [
  {
    label: "CI 软件验证 · 2026-09-16",
    baselineFps: 58,
    snowFps: 52,
    baselineP95Ms: 22.5,
    snowP95Ms: 28,
    droppedFrameDelta: 0.01,
  },
];

export const DASHBOARD_META = {
  lastValidated: "2026-09-16 20:03 UTC",
  source: "ci-software / generated-procedural",
  highFidelityDelivery: "pending-import",
  realDeviceEvidenceRequired: true,
  analyzerStatus: "pass",
  analyzerSampleCount: 2,
  externalPendingCount: 18,
};

export const getCheckCounts = (assets: BaselineAssetSnapshot[]) => {
  const checks = assets.flatMap((item) => item.checks);
  return {
    total: checks.length,
    pass: checks.filter((check) => check.status === "pass").length,
    warning: checks.filter((check) => check.status === "warning").length,
    pending: checks.filter((check) => check.status === "pending").length,
    fail: checks.filter((check) => check.status === "fail").length,
  };
};

export const getAssetStatus = (asset: BaselineAssetSnapshot): BaselineCheckStatus => {
  if (asset.checks.some((check) => check.status === "fail")) return "fail";
  if (asset.checks.some((check) => check.status === "warning")) return "warning";
  if (asset.checks.some((check) => check.status === "pending")) return "pending";
  return "pass";
};
