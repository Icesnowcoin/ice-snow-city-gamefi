import React from 'react';
import { Building2, CircleAlert, EyeOff, Loader, MapPinned, RefreshCw, ImagePlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  usePublicNFTAssets,
  type PublicNFTAsset,
  type UsePublicNFTAssetsOptions
} from '@/hooks/usePublicNFTAssets';
import type { ProfileBackground } from '@/hooks/useProfileBackground';
import { isSameProfileBackground } from '@/hooks/useProfileBackground';

export interface PublicNFTAssetsOverviewProps extends UsePublicNFTAssetsOptions {
  playerName: string;
  canSetAsBackground?: boolean;
  currentBackground?: ProfileBackground | null;
  onSetAsBackground?: (asset: PublicNFTAsset) => void;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '时间未知';
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function AssetCard({
  asset,
  canSetAsBackground = false,
  currentBackground,
  onSetAsBackground,
}: {
  asset: PublicNFTAsset;
  canSetAsBackground?: boolean;
  currentBackground?: ProfileBackground | null;
  onSetAsBackground?: (asset: PublicNFTAsset) => void;
}) {
  const isLand = asset.kind === 'land';
  return (
    <article className="public-nft-asset-card">
      <div className="public-nft-asset-icon" aria-hidden="true">
        {isLand ? <MapPinned className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
      </div>
      <div className="public-nft-asset-copy">
        <strong>{asset.name}</strong>
        <span>Token ID #{asset.tokenId}</span>
        <span>{asset.status} · 铸造于 {formatDate(asset.createdAt)}</span>
        {canSetAsBackground && (
          <Button
            type="button"
            variant={isSameProfileBackground(currentBackground, asset) ? 'secondary' : 'outline'}
            size="sm"
            className="public-nft-background-button"
            onClick={() => onSetAsBackground?.(asset)}
            aria-label={`将${asset.name}设为个人主页背景`}
          >
            {isSameProfileBackground(currentBackground, asset) ? (
              <Check className="mr-1 h-3.5 w-3.5" />
            ) : (
              <ImagePlus className="mr-1 h-3.5 w-3.5" />
            )}
            {isSameProfileBackground(currentBackground, asset) ? '当前背景' : '设为主页背景'}
          </Button>
        )}
      </div>
    </article>
  );
}

export const PublicNFTAssetsOverview: React.FC<PublicNFTAssetsOverviewProps> = ({
  playerName,
  walletAddress,
  publicAssetsEnabled,
  landContractAddress,
  buildingContractAddress,
  rpcUrl,
  canSetAsBackground = false,
  currentBackground = null,
  onSetAsBackground
}) => {
  const { assets, isLoading, error, visibility, refresh } = usePublicNFTAssets({
    walletAddress,
    publicAssetsEnabled,
    landContractAddress,
    buildingContractAddress,
    rpcUrl
  });

  if (!publicAssetsEnabled || visibility === 'private') {
    return (
      <div className="public-nft-state" role="status">
        <EyeOff className="h-5 w-5" />
        <p>{playerName} 尚未公开土地和建筑 NFT 资产。</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="public-nft-state" role="status" aria-live="polite">
        <Loader className="h-5 w-5 animate-spin" />
        <p>正在读取公开 NFT 资产…</p>
      </div>
    );
  }

  if (error || visibility === 'unavailable') {
    return (
      <div className="public-nft-state public-nft-state-error" role="alert">
        <CircleAlert className="h-5 w-5" />
        <p>{error ?? '公开资产暂时不可用。'}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          <RefreshCw className="mr-1 h-4 w-4" />
          重试
        </Button>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="public-nft-state" role="status">
        <MapPinned className="h-5 w-5" />
        <p>{playerName} 尚未铸造公开的土地或建筑 NFT。</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => void refresh()}>
          <RefreshCw className="mr-1 h-4 w-4" />
          刷新
        </Button>
      </div>
    );
  }

  return (
    <div className="public-nft-assets-panel">
      <div className="public-nft-assets-toolbar">
        <span>{assets.length} 项公开资产</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => void refresh()} aria-label="刷新公开 NFT 资产">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="public-nft-assets-list">
        {assets.map((asset) => (
          <AssetCard
            key={`${asset.kind}-${asset.tokenId}`}
            asset={asset}
            canSetAsBackground={canSetAsBackground}
            currentBackground={currentBackground}
            onSetAsBackground={onSetAsBackground}
          />
        ))}
      </div>
    </div>
  );
};

export default PublicNFTAssetsOverview;
