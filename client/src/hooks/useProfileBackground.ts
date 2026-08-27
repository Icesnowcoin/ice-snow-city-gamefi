import { useCallback, useEffect, useState } from 'react';
import type { PublicNFTAsset } from './usePublicNFTAssets';

export interface ProfileBackground {
  kind: PublicNFTAsset['kind'];
  tokenId: string;
  name: string;
  createdAt: number;
  selectedAt: number;
}

const STORAGE_PREFIX = 'ice-snow-city:profile-background:';

function getStorageKey(playerId: string): string {
  return `${STORAGE_PREFIX}${playerId}`;
}

export function profileBackgroundFromAsset(asset: PublicNFTAsset): ProfileBackground {
  return {
    kind: asset.kind,
    tokenId: asset.tokenId,
    name: asset.name,
    createdAt: asset.createdAt,
    selectedAt: Date.now(),
  };
}

export function isSameProfileBackground(
  background: ProfileBackground | null | undefined,
  asset: Pick<PublicNFTAsset, 'kind' | 'tokenId'>
): boolean {
  return background?.kind === asset.kind && background.tokenId === asset.tokenId;
}

function readStoredBackground(playerId: string): ProfileBackground | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(playerId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProfileBackground>;
    if (
      (parsed.kind === 'land' || parsed.kind === 'building') &&
      typeof parsed.tokenId === 'string' &&
      typeof parsed.name === 'string'
    ) {
      return {
        kind: parsed.kind,
        tokenId: parsed.tokenId,
        name: parsed.name,
        createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : 0,
        selectedAt: typeof parsed.selectedAt === 'number' ? parsed.selectedAt : 0,
      };
    }
  } catch {
    window.localStorage.removeItem(getStorageKey(playerId));
  }
  return null;
}

export function useProfileBackground(playerId: string): {
  background: ProfileBackground | null;
  setBackgroundFromAsset: (asset: PublicNFTAsset) => void;
  clearBackground: () => void;
} {
  const [background, setBackground] = useState<ProfileBackground | null>(null);

  useEffect(() => {
    setBackground(readStoredBackground(playerId));
  }, [playerId]);

  const setBackgroundFromAsset = useCallback(
    (asset: PublicNFTAsset) => {
      const next = profileBackgroundFromAsset(asset);
      setBackground(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(playerId), JSON.stringify(next));
      }
    },
    [playerId]
  );

  const clearBackground = useCallback(() => {
    setBackground(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(getStorageKey(playerId));
    }
  }, [playerId]);

  return { background, setBackgroundFromAsset, clearBackground };
}
