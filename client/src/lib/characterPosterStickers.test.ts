import { describe, expect, it } from "vitest";
import {
  CHARACTER_POSTER_STICKERS,
  createCharacterPosterStickerPlacement,
  getCharacterPosterSticker,
  getCharacterPosterStickerLabels,
  normalizeCharacterPosterStickerPlacement,
} from "./characterPosterStickers";

describe("characterPosterStickers", () => {
  it("provides badge and emoji sticker presets", () => {
    expect(CHARACTER_POSTER_STICKERS.some((sticker) => sticker.category === "badge")).toBe(true);
    expect(CHARACTER_POSTER_STICKERS.some((sticker) => sticker.category === "emoji")).toBe(true);
    expect(getCharacterPosterSticker("missing").id).toBe(CHARACTER_POSTER_STICKERS[0].id);
  });

  it("creates deterministic bounded placement coordinates for new stickers", () => {
    const placement = createCharacterPosterStickerPlacement("rocket", 4);
    expect(placement.stickerId).toBe("rocket");
    expect(placement.x).toBeGreaterThanOrEqual(0.08);
    expect(placement.x).toBeLessThanOrEqual(0.92);
    expect(placement.y).toBeGreaterThanOrEqual(0.08);
    expect(placement.y).toBeLessThanOrEqual(0.9);
  });

  it("normalizes restored placement values to safe poster bounds", () => {
    const placement = normalizeCharacterPosterStickerPlacement({
      id: "badge-1",
      stickerId: "winter-pioneer",
      x: 4,
      y: -2,
      scale: 10,
      rotation: -500,
    });
    expect(placement).toMatchObject({ x: 0.92, y: 0.08, scale: 2, rotation: -180 });
  });

  it("maps placement ids to user-facing sticker labels", () => {
    expect(getCharacterPosterStickerLabels([
      { id: "a", stickerId: "city-builder", x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      { id: "b", stickerId: "sparkles", x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    ])).toEqual(["城市建设者", "闪耀时刻"]);
  });
});
