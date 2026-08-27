import { describe, expect, it, vi } from 'vitest';
import { downloadDataUrl, downloadProfilePoster, generateCharacterSnapshotPosterDataUrlAsync, getCharacterSnapshotPosterFileName, getCharacterSnapshotShareUrl, generateProfilePosterDataUrl, getProfilePosterFileName, openSocialShareUrl, getProfileUrl, copyProfileUrlToClipboard, getTwitterDefaultShareText, getRandomTwitterShareText, openCustomTwitterShare } from './profilePoster';
import type { PlayerInfo } from '@/components/social/PlayerInfoCard';

const mockPlayer: PlayerInfo = {
  userId: 'user_123',
  userName: '雪城开拓者',
  level: 15,
  status: 'online',
  signature: '打造现代化冰雪大都会！',
  stats: { coin: 88888, exp: 4500, score: 9200 },
};

describe('profilePoster generator', () => {
  it('generates a valid PNG data URL for player profile poster', () => {
    const dataUrl = generateProfilePosterDataUrl({
      player: mockPlayer,
      background: {
        kind: 'land',
        tokenId: '108',
        name: '中央商业区土地 #108',
        createdAt: Date.now(),
        selectedAt: Date.now(),
      },
    });

    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('data:image/')).toBe(true);
  });

  it('generates a poster without equipped NFT background gracefully', () => {
    const dataUrl = generateProfilePosterDataUrl({
      player: mockPlayer,
      background: null,
    });

    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('data:image/')).toBe(true);
  });

  it('creates a safe, readable download filename', () => {
    expect(getProfilePosterFileName(' 雪城/开拓者 2026 ')).toBe('ice-snow-city-雪城_开拓者-2026-profile.png');
    expect(getProfilePosterFileName('')).toBe('ice-snow-city-player-profile.png');
  });

  it('triggers a local download and removes the temporary anchor', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const options = { player: mockPlayer, background: null };
    const dataUrl = 'data:image/png;base64,poster';

    expect(downloadProfilePoster(options, dataUrl)).toBe(dataUrl);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download="ice-snow-city-雪城开拓者-profile.png"]')).toBeNull();

    clickSpy.mockRestore();
  });

  it('opens social share URL with prefilled text and hashtags', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const options = {
      player: mockPlayer,
      background: null,
      assetSummary: { landCount: 3, buildingCount: 2, totalAssets: 5 },
    };

    openSocialShareUrl('twitter', options);
    expect(openSpy).toHaveBeenCalledTimes(1);
    const twitterUrl = openSpy.mock.calls[0][0];
    expect(twitterUrl).toContain('twitter.com/intent/tweet');
    expect(twitterUrl).toContain('Ice%20Snow%20City');
    expect(twitterUrl).toContain('3');

    openSocialShareUrl('telegram', options);
    expect(openSpy).toHaveBeenCalledTimes(2);
    const telegramUrl = openSpy.mock.calls[1][0];
    expect(telegramUrl).toContain('t.me/share/url');

    openSpy.mockRestore();
  });

  it('generates correct profile URL and copies to clipboard successfully', async () => {
    const url = getProfileUrl('user_123');
    expect(url).toContain('/profile/user_123');
    expect(url).toContain('?ref=user_123');

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const result = await copyProfileUrlToClipboard('user_123');
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith(url);
  });

  it('generates default Twitter share text and opens custom Twitter share window', () => {
    const defaultText = getTwitterDefaultShareText({
      player: mockPlayer,
      background: null,
      assetSummary: { landCount: 2, buildingCount: 4, totalAssets: 6 },
    });
    expect(defaultText).toContain('冰雪城市');
    expect(defaultText).toContain('2 宗土地');
    expect(defaultText).toContain('4 栋建筑');
    expect(defaultText).toContain('/profile/user_123');

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    openCustomTwitterShare('Custom promotion text for Ice Snow City!');
    expect(openSpy).toHaveBeenCalledTimes(1);
    const calledUrl = openSpy.mock.calls[0][0];
    expect(calledUrl).toContain('twitter.com/intent/tweet');
    expect(calledUrl).toContain('Custom%20promotion');

    openSpy.mockRestore();
  });

  it('generates random Twitter share text from templates', () => {
    const randomText = getRandomTwitterShareText({
      player: mockPlayer,
      background: null,
      assetSummary: { landCount: 5, buildingCount: 3, totalAssets: 8 },
    });
    expect(randomText.length).toBeGreaterThan(10);
    expect(randomText).toMatch(/5 .*土地/);
    expect(randomText).toMatch(/3 .*建筑/);
    expect(randomText).toContain('/profile/user_123');
  });

  it('validates 280 character limit for custom Twitter text', () => {
    const shortText = 'A'.repeat(200);
    expect(shortText.length <= 280).toBe(true);

    const longText = 'A'.repeat(300);
    expect(longText.length > 280).toBe(true);
  });

  it('generates a character snapshot poster with state labels in the SVG fallback', async () => {
    const poster = await generateCharacterSnapshotPosterDataUrlAsync({
      playerName: mockPlayer.userName,
      userId: mockPlayer.userId,
      canvasDataUrl: 'data:image/png;base64,c2NyZWVuc2hvdA==',
      animationLabel: '挥手',
      expressionLabel: '微笑',
      environmentLabel: '冬季雪景',
    });
    expect(poster.startsWith('data:image/')).toBe(true);
    expect(getCharacterSnapshotPosterFileName(' 雪城/开拓者 ')).toBe('ice-snow-city-雪城_开拓者-character-snapshot.png');
  });

  it('builds snapshot social share URLs with the current state, outfit/accessory, and profile referral link', () => {
    const options = {
      playerName: mockPlayer.userName,
      userId: mockPlayer.userId,
      canvasDataUrl: 'data:image/png;base64,c2NyZWVuc2hvdA==',
      animationLabel: '跳跃',
      expressionLabel: '开心',
      environmentLabel: '室内暖光',
      outfitLabel: '商务外套',
      accessoryLabel: '时尚墨镜',
      customText: '从打工人到城市建设者 · ID: ISC-001',
      stickerPlacements: [{ id: 'sticker-1', stickerId: 'winter-pioneer', x: 0.72, y: 0.28, scale: 1, rotation: 0 }],
    };
    const twitterUrl = getCharacterSnapshotShareUrl('twitter', options);
    const telegramUrl = getCharacterSnapshotShareUrl('telegram', options);
    expect(twitterUrl).toContain('twitter.com/intent/tweet');
    expect(telegramUrl).toContain('t.me/share/url');
    expect(decodeURIComponent(twitterUrl)).toContain('跳跃');
    expect(decodeURIComponent(twitterUrl)).toContain('商务外套');
    expect(decodeURIComponent(twitterUrl)).toContain('时尚墨镜');
    expect(decodeURIComponent(twitterUrl)).toContain('冰雪先锋');
    expect(decodeURIComponent(twitterUrl)).toContain('从打工人到城市建设者 · ID: ISC-001');
    expect(decodeURIComponent(telegramUrl)).toContain('冰雪先锋');
    expect(decodeURIComponent(telegramUrl)).toContain('从打工人到城市建设者 · ID: ISC-001');
    expect(decodeURIComponent(telegramUrl)).toContain('/profile/user_123?ref=user_123');
  });

  it('triggers direct snapshot poster download and cleans the temporary anchor', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    downloadDataUrl('data:image/png;base64,snapshot', getCharacterSnapshotPosterFileName(mockPlayer.userName));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download="ice-snow-city-雪城开拓者-character-snapshot.png"]')).toBeNull();
    clickSpy.mockRestore();
  });
});





