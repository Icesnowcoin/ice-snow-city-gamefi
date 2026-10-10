import { describe, expect, it } from "vitest";
import {
  CHARACTER_ANIMATION_PRESETS,
  getCharacterAnimationFrame,
  getCharacterAnimationLabel,
} from "./characterAnimationPresets";

describe("character animation presets", () => {
  it("exposes the eight Phase 69 actions plus wave and jump shortcuts", () => {
    const ids = CHARACTER_ANIMATION_PRESETS.map((preset) => preset.id);
    expect(ids.slice(0, 8)).toEqual(["idle", "walk", "run", "work", "sleep", "celebrate", "sad", "talk"]);
    expect(ids).toContain("wave");
    expect(ids).toContain("jump");
  });

  it("keeps idle animation close to the standing pose", () => {
    const frame = getCharacterAnimationFrame("idle", 0);
    expect(frame.bodyY).toBeCloseTo(0);
    expect(frame.scaleY).toBe(1);
  });

  it("produces visible movement for work, talk and wave actions", () => {
    const work = getCharacterAnimationFrame("work", 0.2);
    const talk = getCharacterAnimationFrame("talk", 0.2);
    const firstWave = getCharacterAnimationFrame("wave", 0);
    const secondWave = getCharacterAnimationFrame("wave", 0.2);
    expect(work.armRotationZ).not.toBe(talk.armRotationZ);
    expect(firstWave.armRotationZ).not.toBe(secondWave.armRotationZ);
  });

  it("produces a jump arc and never accepts negative time", () => {
    const start = getCharacterAnimationFrame("jump", 0);
    const middle = getCharacterAnimationFrame("jump", 0.8);
    const negative = getCharacterAnimationFrame("jump", -1);
    expect(middle.bodyY).toBeGreaterThan(start.bodyY);
    expect(negative).toEqual(start);
  });

  it("returns a readable label with a safe fallback", () => {
    expect(getCharacterAnimationLabel("wave")).toBe("挥手");
    expect(getCharacterAnimationLabel("sleep")).toBe("睡眠");
    expect(getCharacterAnimationLabel("idle")).toBe("自然待机");
  });
});
