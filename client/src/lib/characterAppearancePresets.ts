export type CharacterOutfitId = "winter-coat" | "business" | "casual-puffer";
export type CharacterAccessoryId = "none" | "knit-scarf" | "sunglasses" | "backpack";

export interface CharacterOutfitPreset {
  id: CharacterOutfitId;
  label: string;
  description: string;
  color: [number, number, number];
  silhouetteScaleX: number;
}

export interface CharacterAccessoryPreset {
  id: CharacterAccessoryId;
  label: string;
  description: string;
  color: [number, number, number];
}

export const CHARACTER_OUTFITS: readonly CharacterOutfitPreset[] = [
  {
    id: "winter-coat",
    label: "冬日风衣",
    description: "符合现代冬季城市主视觉的高级潮流风衣",
    color: [0.12, 0.25, 0.45],
    silhouetteScaleX: 1,
  },
  {
    id: "business",
    label: "商务外套",
    description: "适合商业街与金融中心场景的利落商务外套",
    color: [0.18, 0.2, 0.28],
    silhouetteScaleX: 0.94,
  },
  {
    id: "casual-puffer",
    label: "休闲羽绒",
    description: "适合城市通勤与雪景活动的轻量休闲羽绒服",
    color: [0.78, 0.22, 0.28],
    silhouetteScaleX: 1.08,
  },
];

export const CHARACTER_ACCESSORIES: readonly CharacterAccessoryPreset[] = [
  { id: "none", label: "无配饰", description: "保持干净利落的基础造型", color: [0.2, 0.24, 0.3] },
  { id: "knit-scarf", label: "针织围巾", description: "增添冬季温度感的针织围巾", color: [0.85, 0.36, 0.16] },
  { id: "sunglasses", label: "时尚墨镜", description: "现代都市感的轻量墨镜", color: [0.04, 0.06, 0.1] },
  { id: "backpack", label: "通勤背包", description: "适合城市生活与工作日常的背包", color: [0.06, 0.18, 0.25] },
];

export function getCharacterOutfitPreset(id: CharacterOutfitId): CharacterOutfitPreset {
  return CHARACTER_OUTFITS.find((preset) => preset.id === id) ?? CHARACTER_OUTFITS[0];
}

export function getCharacterAccessoryPreset(id: CharacterAccessoryId): CharacterAccessoryPreset {
  return CHARACTER_ACCESSORIES.find((preset) => preset.id === id) ?? CHARACTER_ACCESSORIES[0];
}

export function resolveCharacterOutfitPresetId(label?: string): CharacterOutfitId {
  const match = CHARACTER_OUTFITS.find((preset) => preset.label === label || label?.includes(preset.label));
  return match?.id ?? "winter-coat";
}
