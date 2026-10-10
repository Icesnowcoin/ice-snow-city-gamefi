import { describe, expect, it } from 'vitest';
import {
  CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH,
  getCharacterPosterCustomTextLabel,
  isCharacterPosterCustomTextValid,
  normalizeCharacterPosterCustomText,
} from './characterPosterCustomText';

describe('characterPosterCustomText', () => {
  it('normalizes whitespace and trims the text', () => {
    expect(normalizeCharacterPosterCustomText('  ICE   ID: 001  ')).toBe('ICE ID: 001');
  });

  it('limits text to the supported poster length', () => {
    const text = 'A'.repeat(CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH + 12);
    expect(normalizeCharacterPosterCustomText(text)).toHaveLength(CHARACTER_POSTER_CUSTOM_TEXT_MAX_LENGTH);
    expect(isCharacterPosterCustomTextValid(text)).toBe(true);
  });

  it('creates a share-safe label and leaves empty input blank', () => {
    expect(getCharacterPosterCustomTextLabel('建设我的冰雪城市')).toBe('玩家宣言：建设我的冰雪城市');
    expect(getCharacterPosterCustomTextLabel('   ')).toBe('');
  });
});
