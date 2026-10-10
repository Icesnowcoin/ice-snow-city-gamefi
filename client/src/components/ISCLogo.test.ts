import { describe, expect, it } from 'vitest';
import { ISC_LOGO_URL } from './ISCLogo';
import { getCharacterPosterSticker } from '@/lib/characterPosterStickers';

describe('ISC brand asset', () => {
  it('uses the uploaded official logo as the single token mark', () => {
    expect(ISC_LOGO_URL).toBe('/manus-storage/isc_token_icon_256_ed4ff47d.png');
  });

  it('uses the official logo for the winter pioneer sticker', () => {
    const sticker = getCharacterPosterSticker('winter-pioneer');
    expect(sticker.assetUrl).toBe(ISC_LOGO_URL);
    expect(sticker.glyph).toBe('ISC');
  });

  it('does not fall back to a Unicode snowflake for the branded sticker', () => {
    const sticker = getCharacterPosterSticker('winter-pioneer');
    expect(sticker.glyph).not.toContain('❄');
  });
});
