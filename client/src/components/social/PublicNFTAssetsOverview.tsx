import React from 'react';
import { Building2, Gamepad2 } from 'lucide-react';

export interface PublicNFTAssetsOverviewProps {
  playerName: string;
  canSetAsBackground?: boolean;
}

/**
 * Land and buildings are gameplay state, not NFTs. The previous chain-backed
 * public asset reader is intentionally retired so profile pages cannot imply
 * on-chain ownership or trigger wallet/RPC reads for city assets.
 */
export const PublicNFTAssetsOverview: React.FC<PublicNFTAssetsOverviewProps> = ({ playerName }) => (
  <div className="public-nft-state" role="status">
    <div className="flex items-center justify-center gap-2">
      <Gamepad2 className="h-5 w-5" aria-hidden="true" />
      <Building2 className="h-5 w-5" aria-hidden="true" />
    </div>
    <p>{playerName} 的地块与建筑属于游戏内资产。</p>
    <p className="text-xs text-muted-foreground">它们通过城市建设、升级和生产系统管理，不连接 NFT 合约或链上所有权。</p>
  </div>
);

export default PublicNFTAssetsOverview;
