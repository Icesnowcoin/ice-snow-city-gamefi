import { describe, expect, it, vi } from 'vitest';
import {
  isSameProfileBackground,
  profileBackgroundFromAsset,
  type ProfileBackground,
} from './useProfileBackground';

const landAsset = {
  kind: 'land' as const,
  tokenId: '42',
  name: '土地 #42',
  createdAt: 1_700_000_000_000,
  status: '自有',
};

const buildingAsset = {
  kind: 'building' as const,
  tokenId: '7',
  name: '商业 #7',
  createdAt: 1_700_000_100_000,
  status: '运营中',
};

describe('useProfileBackground helpers', () => {
  it('maps an owned NFT asset to a persistable profile background', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_200_000);

    expect(profileBackgroundFromAsset(landAsset)).toEqual({
      kind: 'land',
      tokenId: '42',
      name: '土地 #42',
      createdAt: 1_700_000_000_000,
      selectedAt: 1_700_000_200_000,
    });

    vi.restoreAllMocks();
  });

  it('matches the selected background by asset kind and token id', () => {
    const selected: ProfileBackground = {
      kind: 'building',
      tokenId: '7',
      name: '商业 #7',
      createdAt: buildingAsset.createdAt,
      selectedAt: 1_700_000_200_000,
    };

    expect(isSameProfileBackground(selected, buildingAsset)).toBe(true);
    expect(isSameProfileBackground(selected, landAsset)).toBe(false);
    expect(isSameProfileBackground(null, buildingAsset)).toBe(false);
  });
});
