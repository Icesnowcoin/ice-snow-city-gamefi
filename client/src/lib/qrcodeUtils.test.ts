import { describe, expect, it } from 'vitest';
import { generateQRCodeSvg, generateQRCodeDataUrl } from './qrcodeUtils';

describe('qrcodeUtils generator', () => {
  it('generates a valid SVG string with correct viewBox and rects', () => {
    const svg = generateQRCodeSvg('https://icesnowcity.game/profile/user_123', 160);
    expect(typeof svg).toBe('string');
    expect(svg.includes('<svg')).toBe(true);
    expect(svg.includes('viewBox="0 0 160 160"')).toBe(true);
    expect(svg.includes('<rect')).toBe(true);
  });

  it('generates a valid base64 data URL for QR code', () => {
    const dataUrl = generateQRCodeDataUrl('https://icesnowcity.game/profile/user_123', 160);
    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });
});
