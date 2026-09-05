import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.env.BASELINE_ASSET_OUTPUT ?? "/home/ubuntu/webdev-static-assets/ice-snow-city/procedural-baseline";
const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const results = [];
for (const asset of manifest.assets) {
  const filePath = path.join(root, `${asset.id}.glb`);
  const bytes = await readFile(filePath);
  const magic = bytes.subarray(0, 4).toString("utf8");
  const version = bytes.readUInt32LE(4);
  const declaredLength = bytes.readUInt32LE(8);
  const issues = [];
  if (magic !== "glTF") issues.push(`magic=${magic}`);
  if (version !== 2) issues.push(`version=${version}`);
  if (declaredLength !== bytes.byteLength) issues.push(`declaredLength=${declaredLength}, actualLength=${bytes.byteLength}`);
  results.push({ assetId: asset.id, filePath, bytes: bytes.byteLength, magic, version, declaredLength, valid: issues.length === 0, issues });
}

const report = {
  generatedAt: new Date().toISOString(),
  source: manifest.source,
  status: manifest.status,
  highFidelityDelivery: manifest.highFidelityDelivery,
  total: results.length,
  valid: results.filter((result) => result.valid).length,
  invalid: results.filter((result) => !result.valid).length,
  results,
};
const reportPath = path.join(root, "validation.json");
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, reportPath }, null, 2));
if (report.invalid > 0) process.exitCode = 1;
