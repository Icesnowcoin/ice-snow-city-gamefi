import { describe, expect, it } from "vitest";
import {
  createGithubSafetyEvidence,
  findForbiddenTrackedPaths,
  findSecretContentMatches,
} from "../scripts/githubSafetyEvidence.mjs";

describe("githubSafetyEvidence", () => {
  it("finds forbidden tracked paths without reading secret values", () => {
    expect(findForbiddenTrackedPaths([
      "client/src/App.tsx",
      "SESSION_PROGRESS.md",
      ".env.production",
      "node_modules/pkg/index.js",
    ])).toEqual([
      "SESSION_PROGRESS.md",
      ".env.production",
      "node_modules/pkg/index.js",
    ]);
  });

  it("detects token and private-key patterns in provided file content", () => {
    expect(findSecretContentMatches([
      { path: "safe.md", content: "no credentials" },
      { path: "bad.md", content: ["github", "_", "pat", "_", "abcdefghijklmnopqrstuvwxyz"].join("") },
      { path: "key.txt", content: ["-----BEGIN ", "PRIVATE KEY-----"].join("") },
    ])).toEqual(["bad.md", "key.txt"]);
  });

  it("reads tracked paths from the repository when invoked by the CLI", async () => {
    const module = await import("../scripts/githubSafetyEvidence.mjs");
    const inputs = module.readTrackedSafetyInputs();

    expect(inputs.trackedPaths).toContain("package.json");
    expect(inputs.files.some(({ path }) => path === "package.json")).toBe(true);
  });

  it("does not claim account rotation without explicit external confirmation", () => {
    const evidence = createGithubSafetyEvidence({
      trackedPaths: ["client/src/App.tsx"],
      files: [{ path: "README.md", content: "safe" }],
    });

    expect(evidence.workingTreeSafe).toBe(true);
    expect(evidence.accountRotationConfirmed).toBe(false);
    expect(evidence.accountRotationStatus).toBe("pending-account-action");
  });
});
