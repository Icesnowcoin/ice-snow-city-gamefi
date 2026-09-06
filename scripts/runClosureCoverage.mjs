import { spawnSync } from "node:child_process";

const testFiles = [
  "client/src/lib/assetDeliveryGate.test.ts",
  "client/src/lib/assetManifest.test.ts",
  "client/src/pages/AssetReadinessPage.test.tsx",
  "client/src/game/snowLayerPerfReport.test.ts",
  "client/src/game/snowLayerPerfHarness.test.ts",
  "client/src/game/IceSnowSnowLayerMaterialPlugin.test.ts",
  "server/_core/rateLimiter.test.ts",
  "server/_core/rateLimiter.middleware.test.ts",
  "server/game-logic/gameScenes.test.ts",
];

const sourceFiles = [
  "client/src/lib/assetDeliveryGate.ts",
  "client/src/lib/assetManifest.ts",
  "client/src/pages/AssetReadinessPage.tsx",
  "client/src/game/snowLayerPerfReport.ts",
  "client/src/game/snowLayerPerfHarness.ts",
  "client/src/game/IceSnowSnowLayerMaterialPlugin.ts",
  "server/_core/rateLimiter.ts",
  "server/game-logic/gameScenes.ts",
];

const coverageArgs = sourceFiles.flatMap((file) => ["--coverage.include", file]);
const args = [
  "exec",
  "vitest",
  "run",
  ...testFiles,
  "--coverage.enabled",
  "--coverage.provider=v8",
  "--coverage.reporter=text",
  "--coverage.reporter=json-summary",
  "--coverage.reporter=json",
  "--coverage.reportsDirectory=coverage/closure",
  "--coverage.thresholds.lines=50",
  "--coverage.thresholds.statements=50",
  "--coverage.thresholds.functions=55",
  "--coverage.thresholds.branches=50",
  ...coverageArgs,
];

const result = spawnSync("pnpm", args, { stdio: "inherit", shell: false });
if (result.error) {
  console.error(`[closure-coverage] ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
