export type CharacterPosterStickerCategory = "badge" | "emoji";

export interface CharacterPosterStickerDefinition {
  id: string;
  label: string;
  glyph: string;
  category: CharacterPosterStickerCategory;
  tint: string;
}

export interface CharacterPosterStickerPlacement {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export const CHARACTER_POSTER_STICKERS: CharacterPosterStickerDefinition[] = [
  { id: "city-builder", label: "城市建设者", glyph: "🏙️", category: "badge", tint: "#22d3ee" },
  { id: "winter-pioneer", label: "冰雪先锋", glyph: "❄️", category: "badge", tint: "#93c5fd" },
  { id: "isc-holder", label: "ISC 持有者", glyph: "💎", category: "badge", tint: "#fbbf24" },
  { id: "snowy-heart", label: "雪城心情", glyph: "💙", category: "emoji", tint: "#60a5fa" },
  { id: "rocket", label: "城市起飞", glyph: "🚀", category: "emoji", tint: "#fb7185" },
  { id: "sparkles", label: "闪耀时刻", glyph: "✨", category: "emoji", tint: "#fde047" },
];

export function getCharacterPosterSticker(stickerId: string): CharacterPosterStickerDefinition {
  return CHARACTER_POSTER_STICKERS.find((sticker) => sticker.id === stickerId) ?? CHARACTER_POSTER_STICKERS[0];
}

export function createCharacterPosterStickerPlacement(stickerId: string, index: number): CharacterPosterStickerPlacement {
  return {
    id: `${stickerId}-${index}-${Date.now()}`,
    stickerId: getCharacterPosterSticker(stickerId).id,
    x: Math.min(0.84, 0.7 + (index % 3) * 0.08),
    y: Math.min(0.72, 0.22 + Math.floor(index / 3) * 0.1),
    scale: 1,
    rotation: 0,
  };
}

export function normalizeCharacterPosterStickerPlacement(
  placement: Partial<CharacterPosterStickerPlacement> & Pick<CharacterPosterStickerPlacement, "stickerId">,
): CharacterPosterStickerPlacement {
  return {
    id: placement.id ?? `${placement.stickerId}-restored`,
    stickerId: getCharacterPosterSticker(placement.stickerId).id,
    x: Math.min(0.92, Math.max(0.08, placement.x ?? 0.75)),
    y: Math.min(0.9, Math.max(0.08, placement.y ?? 0.25)),
    scale: Math.min(2, Math.max(0.5, placement.scale ?? 1)),
    rotation: Math.min(180, Math.max(-180, placement.rotation ?? 0)),
  };
}

export function getCharacterPosterStickerLabels(placements: CharacterPosterStickerPlacement[]): string[] {
  return placements.map((placement) => getCharacterPosterSticker(placement.stickerId).label);
}
