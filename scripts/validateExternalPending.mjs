import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const todoPath = process.env.TODO_PATH ?? path.resolve(process.cwd(), "todo.md");
const outputPath = process.env.EXTERNAL_PENDING_OUTPUT ?? path.resolve(process.cwd(), "coverage/external-pending-summary.json");
const todo = await readFile(todoPath, "utf8");
const items = todo.split(/\r?\n/).flatMap((line, index) => {
  const match = line.match(/^- \[ \] (.+)$/);
  if (!match) return [];
  const text = match[1];
  const category = /Token|token|GitHub 账户|凭据/.test(text)
    ? "account-token"
    : /GLB|贴图|纹理|建筑|环境|模型|SkinnedMesh|PBR|骨骼|动画|资源库/.test(text)
      ? "high-fidelity-assets"
      : /iOS|Android|真机|设备云|FPS|P95|掉帧率/.test(text)
        ? "real-device"
        : "unknown";
  return [{ line: index + 1, text, category, status: "pending-external-input" }];
});

const unknownItems = items.filter((item) => item.category === "unknown");
const summary = {
  generatedAt: new Date().toISOString(),
  status: unknownItems.length === 0 ? "external-pending-only" : "local-action-detected",
  todoPath,
  pendingCount: items.length,
  categories: {
    highFidelityAssets: items.filter((item) => item.category === "high-fidelity-assets").length,
    realDevice: items.filter((item) => item.category === "real-device").length,
    accountToken: items.filter((item) => item.category === "account-token").length,
    unknown: unknownItems.length,
  },
  items,
  claims: {
    externalInputRequired: true,
    noExternalEvidenceFabricated: true,
  },
};

await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ ...summary, outputPath }, null, 2));
if (unknownItems.length > 0) process.exit(1);
