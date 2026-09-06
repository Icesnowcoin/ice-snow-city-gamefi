import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGithubSafetyEvidence, readTrackedSafetyInputs } from "./githubSafetyEvidence.mjs";

const assetRoot = process.env.BASELINE_ASSET_OUTPUT ?? "/home/ubuntu/webdev-static-assets/ice-snow-city/procedural-baseline";
const outputPath = process.env.RELEASE_GATE_OUTPUT ?? path.join(assetRoot, "release-gate.json");
const coveragePath = process.env.CLOSURE_COVERAGE_PATH ?? path.resolve(process.cwd(), "coverage/closure/coverage-summary.json");
const validation = JSON.parse(await readFile(path.join(assetRoot, "validation.json"), "utf8"));
const safetyInputs = readTrackedSafetyInputs();
const safety = createGithubSafetyEvidence(safetyInputs);

const thresholds = { lines: 50, statements: 50, branches: 50, functions: 55 };
const emptyCoverage = { linesPct: 0, statementsPct: 0, branchesPct: 0, functionsPct: 0 };
let coverage = emptyCoverage;
try {
  const coverageSummary = JSON.parse(await readFile(coveragePath, "utf8"));
  coverage = {
    linesPct: Number(coverageSummary.total?.lines?.pct ?? 0),
    statementsPct: Number(coverageSummary.total?.statements?.pct ?? 0),
    branchesPct: Number(coverageSummary.total?.branches?.pct ?? 0),
    functionsPct: Number(coverageSummary.total?.functions?.pct ?? 0),
  };
} catch {
  // Missing or malformed coverage evidence fails closed instead of being treated as ready.
}

const coverageReady =
  coverage.linesPct >= thresholds.lines &&
  coverage.statementsPct >= thresholds.statements &&
  coverage.branchesPct >= thresholds.branches &&
  coverage.functionsPct >= thresholds.functions;
const assetStatus = validation.invalid > 0 ? "rejected" : "pending-import";
const repositoryReady = safety.workingTreeSafe;
const summary = {
  generatedAt: new Date().toISOString(),
  overallStatus: !repositoryReady || !coverageReady ? "blocked" : "local-ready-external-pending",
  gates: {
    assets: { status: assetStatus, accepted: 0, total: validation.total, baselineFilesValid: validation.valid },
    softwarePerformance: { status: "ready", source: "ci-software", realDeviceEvidenceRequired: true },
    closureCoverage: {
      status: coverageReady ? "ready" : "rejected",
      reportPath: coveragePath,
      metrics: {
        lines: { pct: coverage.linesPct, threshold: thresholds.lines },
        statements: { pct: coverage.statementsPct, threshold: thresholds.statements },
        branches: { pct: coverage.branchesPct, threshold: thresholds.branches },
        functions: { pct: coverage.functionsPct, threshold: thresholds.functions },
      },
    },
    repositorySecurity: { status: repositoryReady ? "ready" : "rejected" },
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
