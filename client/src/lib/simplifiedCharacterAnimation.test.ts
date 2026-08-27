import { describe, expect, it } from "vitest";

import { resolveCharacterAnimation, simplifyCharacterAnimation } from "./simplifiedCharacterAnimation";

describe("simplifiedCharacterAnimation", () => {
  it("groups the detailed presets into five runtime states", () => {
    expect(simplifyCharacterAnimation("idle")).toBe("idle");
    expect(simplifyCharacterAnimation("walk")).toBe("move");
    expect(simplifyCharacterAnimation("run")).toBe("move");
    expect(simplifyCharacterAnimation("talk")).toBe("interact");
    expect(simplifyCharacterAnimation("jump")).toBe("emote");
  });

  it("resolves each runtime state to a stable representative preset", () => {
    expect(resolveCharacterAnimation("idle")).toBe("idle");
    expect(resolveCharacterAnimation("move")).toBe("walk");
    expect(resolveCharacterAnimation("work")).toBe("work");
    expect(resolveCharacterAnimation("interact")).toBe("talk");
    expect(resolveCharacterAnimation("emote")).toBe("celebrate");
  });
});
