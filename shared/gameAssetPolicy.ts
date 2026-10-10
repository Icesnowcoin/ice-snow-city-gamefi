/**
 * Ice Snow City asset ownership policy.
 *
 * Land plots, buildings, farms and landmarks are gameplay state only. They are
 * not NFT core assets and must not be minted, transferred, listed or valued as
 * on-chain real estate. NFT/marketplace modules may only be used for a future
 * explicitly approved asset class that is separate from city simulation state.
 */
export const GAME_ASSET_POLICY = {
  landAndBuildings: 'game-internal' as const,
  nftCoreAssetClasses: [] as const,
  gameplayActions: ['place', 'upgrade', 'operate', 'collect', 'maintain'] as const,
  chainOwnershipRequired: false,
} as const;

export type GameAssetOwnership = typeof GAME_ASSET_POLICY.landAndBuildings;

export function isGameInternalCityAsset(assetType: string): boolean {
  return ['land', 'plot', 'house', 'building', 'farm', 'facility', 'landmark'].includes(assetType.toLowerCase());
}
