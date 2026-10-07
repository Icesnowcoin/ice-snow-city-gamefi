#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const REQUIRED_ASSET_IDS = [
  "player-main",
  "npc-quest-guild",
  "landmark-city-core",
  "landmark-bank",
  "landmark-market",
  "landmark-production",
  "environment-road",
  "environment-vegetation",
];

const REQUIRED_DEVICE_CONDITIONS = ["baseline", "snow-low", "snow-medium", "snow-high"];
const REQUIRED_PBR_MAPS = ["baseColor", "normal", "metallicRoughness"];
const REAL_SOURCES = new Set(["ios-real", "android-real"]);

function issue(scope, message) {
  return `${scope}: ${message}`;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

const SENSITIVE_KEY_PATTERN = /(token|secret|password|webhook|authorization|bearer|deviceSerial|serialNumber|udid|imei|session)/i;
const SENSITIVE_VALUE_PATTERNS = [
  /github_pat_[A-Za-z0-9_]+/i,
  /gh[pousr]_[A-Za-z0-9_]+/i,
  /xox[baprs]-[A-Za-z0-9-]+/i,
  /Bearer\s+[A-Za-z0-9._-]+/i,
  /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+/i,
];
const SENSITIVE_PATH_PATTERN = /(^|[\/])(?:\.env(?:\.|$)|SESSION_PROGRESS\.md|id_rsa|credentials?\.(?:json|yml|yaml))$/i;

function scanSensitiveValue(value, location, issues) {
  if (typeof value === "string") {
    if (SENSITIVE_PATH_PATTERN.test(value)) issues.push(`security:${location}: sensitive path is not allowed`);
    for (const pattern of SENSITIVE_VALUE_PATTERNS) if (pattern.test(value)) issues.push(`security:${location}: sensitive credential pattern is not allowed`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSensitiveValue(item, `${location}[${index}]`, issues));
    return;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childLocation = `${location}.${key}`;
      if (SENSITIVE_KEY_PATTERN.test(key)) issues.push(`security:${childLocation}: sensitive field is not allowed`);
      scanSensitiveValue(child, childLocation, issues);
    }
  }
}

function validateAsset(asset, bundleDir) {
  const issues = [];
  const scope = `asset:${asset?.assetId ?? "unknown"}`;
  if (!isObject(asset)) return [issue(scope, "evidence must be an object")];
  if (!REQUIRED_ASSET_IDS.includes(asset.assetId)) issues.push(issue(scope, "assetId is not canonical"));
  if (typeof asset.glbPath !== "string" || asset.glbPath.length === 0) {
    issues.push(issue(scope, "glbPath is required"));
  } else {
    const resolved = path.resolve(bundleDir, asset.glbPath);
    if (!resolved.startsWith(path.resolve(bundleDir) + path.sep)) issues.push(issue(scope, "glbPath escapes bundle directory"));
    else if (!fs.existsSync(resolved)) issues.push(issue(scope, "GLB file is missing"));
    else {
      if (asset.glbSha256 !== sha256(resolved)) issues.push(issue(scope, "GLB SHA-256 does not match"));
      if (asset.mime !== "model/gltf-binary") issues.push(issue(scope, "mime must be model/gltf-binary"));
    }
  }
  if (asset.gltfVersion !== "2.0") issues.push(issue(scope, "gltfVersion must be 2.0"));
  if (!Number.isInteger(asset.polygonCount) || asset.polygonCount <= 0) issues.push(issue(scope, "polygonCount must be a positive integer"));
  if (!Array.isArray(asset.pbrMaps) || REQUIRED_PBR_MAPS.some((map) => !asset.pbrMaps.includes(map))) issues.push(issue(scope, "required PBR maps are incomplete"));
  if (!Number.isInteger(asset.lodCount) || asset.lodCount < 1) issues.push(issue(scope, "lodCount must be at least 1"));
  if (asset.hasCollisionMesh !== true) issues.push(issue(scope, "hasCollisionMesh must be true"));
  if (asset.isCharacter === true) {
    if (asset.animationFps !== 30) issues.push(issue(scope, "character animationFps must be 30"));
    if (!Array.isArray(asset.animationClips) || asset.animationClips.length === 0) issues.push(issue(scope, "character animationClips are required"));
  }
  return issues;
}

function validateDeviceReport(report) {
  const issues = [];
  const scope = `device:${report?.source ?? "unknown"}`;
  if (!isObject(report)) return [issue(scope, "report must be an object")];
  if (!REAL_SOURCES.has(report.source)) issues.push(issue(scope, "source must be ios-real or android-real"));
  for (const field of ["deviceModel", "osVersion", "browserVersion", "renderer"]) {
    if (typeof report[field] !== "string" || report[field].trim() === "") issues.push(issue(scope, `${field} is required`));
  }
  if (!Array.isArray(report.samples)) {
    issues.push(issue(scope, "samples must be an array"));
    return issues;
  }
  const seen = new Set();
  for (const sample of report.samples) {
    const key = `${sample.condition}:${sample.repetition}`;
    if (!REQUIRED_DEVICE_CONDITIONS.includes(sample.condition)) issues.push(issue(scope, `unsupported condition ${sample.condition}`));
    if (!Number.isInteger(sample.repetition) || sample.repetition < 1 || sample.repetition > 3) issues.push(issue(scope, `repetition must be 1..3 for ${sample.condition}`));
    if (seen.has(key)) issues.push(issue(scope, `duplicate sample ${key}`));
    seen.add(key);
    for (const field of ["averageFps", "p95FrameTimeMs", "droppedFrameRatio"]) {
      if (typeof sample[field] !== "number" || !Number.isFinite(sample[field])) issues.push(issue(scope, `${key} missing numeric ${field}`));
    }
  }
  for (const condition of REQUIRED_DEVICE_CONDITIONS) {
    for (let repetition = 1; repetition <= 3; repetition += 1) {
      if (!seen.has(`${condition}:${repetition}`)) issues.push(issue(scope, `missing sample ${condition}:${repetition}`));
    }
  }
  return issues;
}

export function validateExternalDeliveryBundle(bundle, bundleDir = process.cwd()) {
  const issues = [];
  scanSensitiveValue(bundle, "bundle", issues);
  if (!isObject(bundle) || bundle.schemaVersion !== 1) issues.push("bundle: schemaVersion must be 1");
  const assets = isObject(bundle) && Array.isArray(bundle.assetEvidence) ? bundle.assetEvidence : [];
  const devices = isObject(bundle) && Array.isArray(bundle.devicePerformance) ? bundle.devicePerformance : [];
  const assetIds = new Set();
  for (const asset of assets) {
    if (assetIds.has(asset?.assetId)) issues.push(`asset:${asset.assetId}: duplicate assetId`);
    assetIds.add(asset?.assetId);
    issues.push(...validateAsset(asset, bundleDir));
  }
  for (const assetId of REQUIRED_ASSET_IDS) if (!assetIds.has(assetId)) issues.push(`asset:${assetId}: evidence is missing`);
  const sources = new Set();
  for (const report of devices) {
    if (sources.has(report?.source)) issues.push(`device:${report?.source}: duplicate source`);
    sources.add(report?.source);
    issues.push(...validateDeviceReport(report));
  }
  for (const source of REAL_SOURCES) if (!sources.has(source)) issues.push(`device:${source}: real-device report is missing`);
  return {
    status: issues.length === 0 ? "ready-for-review" : "external-pending",
    readyForReview: issues.length === 0,
    realEvidenceRequired: true,
    assetCount: assets.length,
    requiredAssetCount: REQUIRED_ASSET_IDS.length,
    deviceSources: [...sources].sort(),
    issues,
  };
}

function main() {
  const input = process.argv[2];
  const output = process.argv[3] ?? path.join(process.cwd(), "coverage", "external-delivery-validation.json");
  if (!input) {
    console.error("Usage: node scripts/validateExternalDeliveryBundle.mjs <bundle.json> [output.json]");
    process.exit(2);
  }
  const bundlePath = path.resolve(input);
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  const result = validateExternalDeliveryBundle(bundle, path.dirname(bundlePath));
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.readyForReview ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
