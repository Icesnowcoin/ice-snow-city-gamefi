import { useCallback, useState } from 'react';

export interface MintBreakdown {
  totalISC: string;
  burnAmount: string;
  treasuryAmount: string;
  marketingAmount: string;
}

/**
 * Retained only for source compatibility with older screens.
 * Land and building minting was retired: both are game-internal assets.
 */
export function useNFTMinting(
  _landContractAddress: string,
  _buildingContractAddress: string,
  _iscTokenAddress: string,
  _signer: unknown,
) {
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success] = useState<string | null>(null);
  const [txHash] = useState<string | null>(null);

  const calculateBreakdown = useCallback((iscCostStr: string): MintBreakdown => ({
    totalISC: iscCostStr || '0',
    burnAmount: '0',
    treasuryAmount: '0',
    marketingAmount: '0',
  }), []);

  const retiredMint = useCallback(async () => {
    setError('NFT 功能已停用。地块与建筑请通过游戏内建设系统管理。');
    return false;
  }, []);

  return {
    isLoading,
    error,
    success,
    txHash,
    calculateBreakdown,
    mintLand: retiredMint,
    mintBuilding: retiredMint,
  };
}
