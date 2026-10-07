import { describe, expect, it } from "vitest";
import {
  CHARACTER_EXPRESSIONS,
  getExpressionConfig,
  interpolateExpressionConfig,
  getCharacterExpressionLabel,
} from "./characterExpressionSystem";

describe("character expression system", () => {
  it("exposes all 8 required expressions", () => {
    expect(CHARACTER_EXPRESSIONS).toHaveLength(8);
    expect(CHARACTER_EXPRESSIONS.map((item) => item.id)).toEqual([
      "neutral",
      "smile",
      "sad",
      "angry",
      "surprised",
      "tired",
      "thinking",
      "happy",
    ]);
  });

  it("returns correct expression configs", () => {
    const smile = getExpressionConfig("smile");
    expect(smile.mouthScaleY).toBeGreaterThan(1);
    const sad = getExpressionConfig("sad");
    expect(sad.mouthRotationZ).toBeLessThan(0);
  });

  it("interpolates smoothly between expressions", () => {
    const start = getExpressionConfig("neutral");
    const target = getExpressionConfig("smile");
    const mid = interpolateExpressionConfig("neutral", "smile", 0.5);
    expect(mid.mouthScaleY).toBeCloseTo((start.mouthScaleY + target.mouthScaleY) / 2);
  });

  it("returns human readable labels with safe fallback", () => {
    expect(getCharacterExpressionLabel("smile")).toBe("微笑");
    expect(getCharacterExpressionLabel("invalid" as never)).toBe("平静");
  });
});
