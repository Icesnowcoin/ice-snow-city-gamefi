const FORBIDDEN_PATH_PATTERNS = [
  /(^|\/)SESSION_PROGRESS\.md$/i,
  /(^|\/)\.env(?:\.|$)/i,
  /(^|\/)node_modules\//i,
];

import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const SECRET_CONTENT_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA|OPENSSH|EC|PRIVATE) KEY-----/,
];

export function findForbiddenTrackedPaths(paths) {
  return paths.filter((path) => FORBIDDEN_PATH_PATTERNS.some((pattern) => pattern.test(path)));
}

export function findSecretContentMatches(files) {
  return Array.from(new Set(files.flatMap(({ path, content }) =>
    SECRET_CONTENT_PATTERNS.some((pattern) => pattern.test(content)) ? [path] : [],
  )));
}

export function createGithubSafetyEvidence({ trackedPaths, files = [], accountRotationConfirmed = false }) {
  const forbiddenPaths = findForbiddenTrackedPaths(trackedPaths);
  const secretContentPaths = findSecretContentMatches(files);
  return {
    generatedAt: new Date().toISOString(),
    workingTreeSafe: forbiddenPaths.length === 0 && secretContentPaths.length === 0,
    forbiddenPaths,
    secretContentPaths,
    accountRotationConfirmed,
    accountRotationStatus: accountRotationConfirmed ? "user-confirmed" : "pending-account-action",
    statement: accountRotationConfirmed
      ? "仓库扫描与账户侧轮换均由外部确认。"
      : "仅证明当前扫描输入不含敏感路径/内容；不证明 GitHub 账户侧旧 Token 已撤销。",
  };
}

export function readTrackedSafetyInputs() {
  const trackedPaths = execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .map((path) => path.trim())
    .filter(Boolean);
  const files = trackedPaths.flatMap((path) => {
    try {
      const stats = statSync(path);
      if (!stats.isFile() || stats.size > 2 * 1024 * 1024) return [];
      const content = readFileSync(path, "utf8");
      return [{ path, content }];
    } catch {
      return [];
    }
  });
  return { trackedPaths, files };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputs = process.env.TRACKED_PATHS
    ? { trackedPaths: process.env.TRACKED_PATHS.split("\n").filter(Boolean), files: [] }
    : readTrackedSafetyInputs();
  const evidence = createGithubSafetyEvidence(inputs);
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  process.exitCode = evidence.workingTreeSafe ? 0 : 1;
}
