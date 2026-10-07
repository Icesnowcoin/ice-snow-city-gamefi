import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd());
const scriptPath = join(repoRoot, "scripts/validateExternalPending.mjs");

function runValidator(todo: string) {
  const directory = mkdtempSync(join(tmpdir(), "isc-pending-test-"));
  const todoPath = join(directory, "todo.md");
  const outputPath = join(directory, "summary.json");
  writeFileSync(todoPath, todo, "utf8");
  try {
    let exitCode = 0;
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: repoRoot,
        env: { ...process.env, TODO_PATH: todoPath, EXTERNAL_PENDING_OUTPUT: outputPath },
        encoding: "utf8",
        stdio: "pipe",
      });
    } catch (error) {
      exitCode = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : 1;
    }
    return { exitCode, summary: JSON.parse(readFileSync(outputPath, "utf8")) };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("validateExternalPending", () => {
  it("classifies asset, device, and account pending items without unknowns", () => {
    const result = runValidator([
      "- [ ] 导入真实 GLB/PBR 资产",
      "- [ ] 采集 iOS 真机 FPS/P95",
      "- [ ] 轮换 GitHub 账户 Token",
    ].join("\n"));

    expect(result.exitCode).toBe(0);
    expect(result.summary.status).toBe("external-pending-only");
    expect(result.summary.pendingCount).toBe(3);
    expect(result.summary.categories).toMatchObject({
      highFidelityAssets: 1,
      realDevice: 1,
      accountToken: 1,
      unknown: 0,
    });
  });

  it("fails closed when an unchecked item cannot be mapped to an external category", () => {
    const result = runValidator("- [ ] Refactor a local helper\n");

    expect(result.exitCode).toBe(1);
    expect(result.summary.status).toBe("local-action-detected");
    expect(result.summary.categories.unknown).toBe(1);
    expect(result.summary.items[0]).toMatchObject({ category: "unknown", status: "pending-external-input" });
  });
});
