import { describe, expect, it } from 'vitest';
import { generateProfilePosterDataUrl } from './profilePoster';
import type { PlayerInfo } from '@/components/social/PlayerInfoCard';

const mockPlayer: PlayerInfo = {
  userId: 'user_456',
  userName: '冰雪大亨',
  level: 30,
  status: 'online',
  signature: '资产雄厚，诚邀合作！',
  stats: { coin: 999999, exp: 8888, score: 15000 },
};

describe('profilePoster assetSummary integration', () => {
  it('generates poster with land and building asset summary successfully', () => {
    const dataUrl = generateProfilePosterDataUrl({
      player: mockPlayer,
      background: {
        kind: 'building',
        tokenId: '512',
        name: '中央核心摩天大楼 #512',
        createdAt: Date.now(),
        selectedAt: Date.now(),
      },
      assetSummary: {
        landCount: 4,
        buildingCount: 6,
        totalAssets: 10,
      },
    });

    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('data:image/')).toBe(true);
  });
});
