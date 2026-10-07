import { describe, expect, it } from "vitest";
import {
  CHARACTER_ACCESSORIES,
  CHARACTER_OUTFITS,
  getCharacterAccessoryPreset,
  getCharacterOutfitPreset,
  resolveCharacterOutfitPresetId,
} from "./characterAppearancePresets";

describe("character appearance presets", () => {
  it("provides modern winter outfit presets", () => {
    expect(CHARACTER_OUTFITS).toHaveLength(3);
    expect(CHARACTER_OUTFITS.map((preset) => preset.id)).toEqual(["winter-coat", "business", "casual-puffer"]);
    expect(getCharacterOutfitPreset("business").label).toBe("商务外套");
  });

  it("provides accessory presets with a no-accessory fallback", () => {
    expect(CHARACTER_ACCESSORIES).toHaveLength(4);
    expect(getCharacterAccessoryPreset("knit-scarf").label).toBe("针织围巾");
    expect(getCharacterAccessoryPreset("invalid" as never).id).toBe("none");
  });

  it("resolves persisted outfit labels safely", () => {
    expect(resolveCharacterOutfitPresetId("冬日高级潮流风衣")).toBe("winter-coat");
    expect(resolveCharacterOutfitPresetId("商务外套")).toBe("business");
    expect(resolveCharacterOutfitPresetId(undefined)).toBe("winter-coat");
  });
});
