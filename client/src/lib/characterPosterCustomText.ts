export const CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH = 80;

export function normalizeCharacterPosterCustomText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH);
}

export function getCharacterPosterCustomTextLabel(value?: string): string {
  const normalized = normalizeCharacterPosterCustomText(value ?? '');
  return normalized ? `玩家宣言：${normalized}` : '';
}

export function isCharacterPosterCustomTextValid(value: string): boolean {
  return normalizeCharacterPosterCustomText(value).length <= CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH;
}
