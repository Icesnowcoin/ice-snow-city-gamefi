import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';

const LAND_NFT_ABI = [
  'function getPlayerLands(address player) view returns (uint256[])',
  'function getLandInfo(uint256 tokenId) view returns (uint256 tokenId, address owner, uint256 purchasePrice, uint256 rentIncome, uint256 createdAt, bool isRented, address renter)'
];

const BUILDING_NFT_ABI = [
  'function getPlayerBuildings(address player) view returns (uint256[])',
  'function getBuildingInfo(uint256 tokenId) view returns (uint256 tokenId, address owner, uint8 buildingType, uint256 purchasePrice, uint256 dailyIncome, uint256 totalIncome, uint256 createdAt, uint256 lastClaimTime, bool isOperating, uint256 employeeCount)'
];

export type PublicAssetKind = 'land' | 'building';
export type PublicAssetVisibility = 'public' | 'private' | 'unavailable';

export interface PublicNFTAsset {
  kind: PublicAssetKind;
  tokenId: string;
  name: string;
  createdAt: number;
  status: string;
  isRented?: boolean;
  isOperating?: boolean;
}

export interface UsePublicNFTAssetsOptions {
  walletAddress?: string;
  publicAssetsEnabled?: boolean;
  landContractAddress?: string;
  buildingContractAddress?: string;
  rpcUrl?: string;
}

export interface PublicNFTAssetsState {
  assets: PublicNFTAsset[];
  isLoading: boolean;
  error: string | null;
  visibility: PublicAssetVisibility;
  refresh: () => Promise<void>;
}

const DEFAULT_LAND_ADDRESS = import.meta.env.VITE_LAND_NFT_ADDRESS as string | undefined;
const DEFAULT_BUILDING_ADDRESS = import.meta.env.VITE_BUILDING_NFT_ADDRESS as string | undefined;
const DEFAULT_RPC_URL = import.meta.env.VITE_BSC_RPC_URL as string | undefined;

function getReadProvider(rpcUrl?: string): ethers.Provider | null {
  const configuredRpc = rpcUrl || DEFAULT_RPC_URL;
  if (configuredRpc) return new ethers.JsonRpcProvider(configuredRpc);

  const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
  return ethereum ? new ethers.BrowserProvider(ethereum) : null;
}

function asTimestamp(value: bigint): number {
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
}

function buildingTypeLabel(value: bigint): string {
  const labels = ['住宅', '商业', '工业', '娱乐', '医院', '学校', '餐厅', '商店', '工厂', '其他'];
  return labels[Number(value)] ?? '建筑';
}

async function readAssets(
  owner: string,
  landAddress: string,
  buildingAddress: string,
  provider: ethers.Provider
): Promise<PublicNFTAsset[]> {
  const assets: PublicNFTAsset[] = [];

  if (ethers.isAddress(landAddress)) {
    const landContract = new ethers.Contract(landAddress, LAND_NFT_ABI, provider);
    const tokenIds = (await landContract.getPlayerLands(owner)) as bigint[];
    const landDetails = await Promise.all(
      tokenIds.map(async (tokenId) => {
        const detail = await landContract.getLandInfo(tokenId);
        return {
          kind: 'land' as const,
          tokenId: tokenId.toString(),
          name: `土地 #${tokenId.toString()}`,
          createdAt: asTimestamp(detail.createdAt),
          status: detail.isRented ? '出租中' : '自有',
          isRented: Boolean(detail.isRented)
        };
      })
    );
    assets.push(...landDetails);
  }

  if (ethers.isAddress(buildingAddress)) {
    const buildingContract = new ethers.Contract(buildingAddress, BUILDING_NFT_ABI, provider);
    const tokenIds = (await buildingContract.getPlayerBuildings(owner)) as bigint[];
    const buildingDetails = await Promise.all(
      tokenIds.map(async (tokenId) => {
        const detail = await buildingContract.getBuildingInfo(tokenId);
        return {
          kind: 'building' as const,
          tokenId: tokenId.toString(),
          name: `${buildingTypeLabel(detail.buildingType)} #${tokenId.toString()}`,
          createdAt: asTimestamp(detail.createdAt),
          status: detail.isOperating ? '运营中' : '已暂停',
          isOperating: Boolean(detail.isOperating)
        };
      })
    );
    assets.push(...buildingDetails);
  }

  return assets.sort((left, right) => right.createdAt - left.createdAt);
}

export function usePublicNFTAssets(options: UsePublicNFTAssetsOptions): PublicNFTAssetsState {
  const {
    walletAddress,
    publicAssetsEnabled = false,
    landContractAddress = DEFAULT_LAND_ADDRESS,
    buildingContractAddress = DEFAULT_BUILDING_ADDRESS,
    rpcUrl = DEFAULT_RPC_URL
  } = options;
  const [assets, setAssets] = useState<PublicNFTAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PublicAssetVisibility>('private');

  const refresh = useCallback(async () => {
    if (!publicAssetsEnabled) {
      setAssets([]);
      setError(null);
      setVisibility('private');
      return;
    }

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      setAssets([]);
      setError(null);
      setVisibility('unavailable');
      return;
    }

    if (!landContractAddress && !buildingContractAddress) {
      setAssets([]);
      setError('NFT 合约尚未配置，暂时无法读取公开资产');
      setVisibility('unavailable');
      return;
    }

    const provider = getReadProvider(rpcUrl);
    if (!provider) {
      setAssets([]);
      setError('当前环境没有可用的链上只读 Provider');
      setVisibility('unavailable');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const nextAssets = await readAssets(
        walletAddress,
        landContractAddress || ethers.ZeroAddress,
        buildingContractAddress || ethers.ZeroAddress,
        provider
      );
      setAssets(nextAssets);
      setVisibility('public');
    } catch (cause) {
      setAssets([]);
      setVisibility('unavailable');
      setError(cause instanceof Error ? cause.message : '公开 NFT 资产读取失败');
    } finally {
      setIsLoading(false);
    }
  }, [buildingContractAddress, landContractAddress, publicAssetsEnabled, rpcUrl, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { assets, isLoading, error, visibility, refresh };
}
