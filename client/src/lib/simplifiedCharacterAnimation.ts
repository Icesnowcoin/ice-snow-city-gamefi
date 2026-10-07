import type { CharacterAnimationPreset } from "./characterAnimationPresets";

export type SimplifiedCharacterAnimation = "idle" | "move" | "work" | "interact" | "emote";

export const SIMPLIFIED_CHARACTER_ANIMATIONS: ReadonlyArray<SimplifiedCharacterAnimation> = [
  "idle",
  "move",
  "work",
  "interact",
  "emote",
];

const PRESET_TO_SIMPLIFIED: Record<CharacterAnimationPreset, SimplifiedCharacterAnimation> = {
  idle: "idle",
  walk: "move",
  run: "move",
  work: "work",
  sleep: "idle",
  celebrate: "emote",
  sad: "emote",
  talk: "interact",
  wave: "interact",
  jump: "emote",
};

const SIMPLIFIED_TO_PRESET: Record<SimplifiedCharacterAnimation, CharacterAnimationPreset> = {
  idle: "idle",
  move: "walk",
  work: "work",
  interact: "talk",
  emote: "celebrate",
};

export function simplifyCharacterAnimation(preset: CharacterAnimationPreset): SimplifiedCharacterAnimation {
  return PRESET_TO_SIMPLIFIED[preset];
}

export function resolveCharacterAnimation(group: SimplifiedCharacterAnimation): CharacterAnimationPreset {
  return SIMPLIFIED_TO_PRESET[group];
}
