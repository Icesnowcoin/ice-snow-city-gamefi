import { describe, expect, it } from 'vitest';
import { CANONICAL_GAMEPLAY_ASSETS } from './canonicalAssets';

describe('CANONICAL_GAMEPLAY_ASSETS', () => {
  it('registers gameplay-only environment and character baselines as storage assets', () => {
    expect(CANONICAL_GAMEPLAY_ASSETS.roadKit).toMatch(/^\/manus-storage\/.*\.glb$/);
    expect(CANONICAL_GAMEPLAY_ASSETS.vegetationKit).toMatch(/^\/manus-storage\/.*\.glb$/);
    expect(CANONICAL_GAMEPLAY_ASSETS.playerCharacterBaseline).toMatch(/^\/manus-storage\/.*\.glb$/);
    expect(CANONICAL_GAMEPLAY_ASSETS.npcCitizenBaseline).toMatch(/^\/manus-storage\/.*\.glb$/);
  });

  it('does not expose wallet, NFT, or chain fields in the gameplay registry', () => {
    const keys = Object.keys(CANONICAL_GAMEPLAY_ASSETS).join(' ').toLowerCase();
    expect(keys).not.toMatch(/nft|wallet|token|chain|contract/);
  });
});
