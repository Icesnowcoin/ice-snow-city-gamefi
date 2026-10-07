export type AnimationExportInput = {
  assetId: string;
  clipName: string;
  fps: number;
  durationSeconds: number;
  loop: boolean;
  fileUrl: string | null;
  expectedLoop: boolean;
};

export type AnimationExportIssueCode =
  | "invalid-name"
  | "fps-out-of-range"
  | "duration-out-of-range"
  | "loop-mismatch"
  | "missing-file";

export type AnimationExportValidation = {
  valid: boolean;
  runtimeReady: boolean;
  issues: Array<{ code: AnimationExportIssueCode; message: string }>;
};

const CLIP_NAME = /^[a-z][a-z0-9-]*$/;

export function validateAnimationExport(input: AnimationExportInput): AnimationExportValidation {
  const issues: AnimationExportValidation["issues"] = [];
  if (!input.assetId.trim() || !CLIP_NAME.test(input.clipName)) {
    issues.push({ code: "invalid-name", message: "动画名称必须使用小写字母、数字和连字符，且以字母开头。" });
  }
  if (!Number.isFinite(input.fps) || input.fps < 24 || input.fps > 30) {
    issues.push({ code: "fps-out-of-range", message: "动画帧率必须处于 24 到 30 FPS 之间；项目目标为 30 FPS。" });
  }
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0 || input.durationSeconds > 12) {
    issues.push({ code: "duration-out-of-range", message: "动画时长必须大于 0 且不超过 12 秒。" });
  }
  if (input.loop !== input.expectedLoop) {
    issues.push({ code: "loop-mismatch", message: "循环标记与动作类型的预期不一致。" });
  }
  if (!input.fileUrl || !/^https?:\/\/|^\/manus-storage\//.test(input.fileUrl)) {
    issues.push({ code: "missing-file", message: "真实动画文件尚未导入；当前只能使用程序化动画或明确的回退状态。" });
  }
  return { valid: issues.length === 0, runtimeReady: issues.length === 0 && Boolean(input.fileUrl), issues };
}
