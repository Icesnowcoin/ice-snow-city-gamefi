import { describe, expect, it } from "vitest";

import { ICE_SNOW_CITY_VISUAL_TOKENS, validateVisualConsistency } from "./visualConsistency";

describe("visualConsistency", () => {
  it("accepts the Ice Snow City visual baseline", () => {
    expect(validateVisualConsistency({
      logoUrl: ICE_SNOW_CITY_VISUAL_TOKENS.officialLogoUrl,
      primaryHue: 220,
      backgroundLightness: 0.145,
      touchTargetPx: 44,
      motionDurationMs: 180,
    })).toEqual({ consistent: true, issues: [] });
  });

  it("reports brand and mobile interaction violations", () => {
    const result = validateVisualConsistency({
      logoUrl: "/wrong-logo.png",
      primaryHue: 180,
      backgroundLightness: 0.3,
      touchTargetPx: 32,
      motionDurationMs: 420,
    });
    expect(result.consistent).toBe(false);
    expect(result.issues).toHaveLength(5);
  });
});
