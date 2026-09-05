import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGithubSafetyEvidence, readTrackedSafetyInputs } from "./githubSafetyEvidence.mjs";

const assetRoot = process.env.BASELINE_ASSET_OUTPUT ?? "/home/ubuntu/webdev-static-assets/ice-snow-city/procedural-baseline";
const outputPath = process.env.RELEASE_GATE_OUTPUT ?? path.join(assetRoot, "release-gate.json");
const validation = JSON.parse(await readFile(path.join(assetRoot, "validation.json"), "utf8"));
const safetyInputs = readTrackedSafetyInputs();
const safety = createGithubSafetyEvidence(safetyInputs);
const assetStatus = validation.invalid > 0 ? "rejected" : "pending-import";
const summary = {
  generatedAt: new Date().toISOString(),
  overallStatus: safety.workingTreeSafe ? "local-ready-external-pending" : "blocked",
  gates: {
    assets: { status: assetStatus, accepted: 0, total: validation.total, baselineFilesValid: validation.valid },
    softwarePerformance: { status: "ready", source: "ci-software", realDeviceEvidenceRequired: true },
    repositorySecurity: { status: safety.workingTreeSafe ? "ready" : "rejected" },
    realDevicePerformance: { status: "pending-device" },
    accountRotation: { status: safety.accountRotationStatus },
  },
  claims: {
    localSubstitutesDoNotProveExternalEvidence: true,
    proceduralBaselineIsNotHighFidelityDelivery: true,
  },
};
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, outputPath }, null, 2));
