import { describe, expect, it } from "vitest";
import { validateAnimationExport } from "./animationExportValidation";

describe("animation export validation", () => {
  it("accepts a verified 30 FPS looping idle clip", () => {
    const result = validateAnimationExport({
      assetId: "player-character",
      clipName: "idle",
      fps: 30,
      durationSeconds: 3,
      loop: true,
      expectedLoop: true,
      fileUrl: "/manus-storage/player-character.glb",
    });
    expect(result.valid).toBe(true);
    expect(result.runtimeReady).toBe(true);
  });

  it("reports malformed names, frame rate and loop contracts", () => {
    const result = validateAnimationExport({
      assetId: "player-character",
      clipName: "Idle Pose",
      fps: 60,
      durationSeconds: 3,
      loop: false,
      expectedLoop: true,
      fileUrl: null,
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "invalid-name",
      "fps-out-of-range",
      "loop-mismatch",
      "missing-file",
    ]);
  });

  it("keeps missing GLB assets out of runtime-ready state", () => {
    const result = validateAnimationExport({
      assetId: "urban-building-core",
      clipName: "door-open",
      fps: 30,
      durationSeconds: 2,
      loop: false,
      expectedLoop: false,
      fileUrl: null,
    });
    expect(result.valid).toBe(false);
    expect(result.runtimeReady).toBe(false);
    expect(result.issues.some((issue) => issue.code === "missing-file")).toBe(true);
  });
});
