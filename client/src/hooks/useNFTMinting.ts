import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

const LAND_NFT_ABI = [
  'function mintLand(uint256 iscCost) external returns (uint256)',
  'function getISCDistribution(uint256 iscCost) external pure returns (uint256 burnAmount, uint256 treasuryAmount, uint256 marketingAmount)',
  'function getPlayerLands(address player) external view returns (uint256[] memory)'
];

const BUILDING_NFT_ABI = [
  'function mintBuilding(uint8 buildingType, uint256 iscCost, uint256 dailyIncome) external returns (uint256)',
  'function getISCDistribution(uint256 iscCost) external pure returns (uint256 burnAmount, uint256 treasuryAmount, uint256 marketingAmount)',
  'function getPlayerBuildings(address player) external view returns (uint256[] memory)'
];

const ISC_TOKEN_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)'
];

export interface MintBreakdown {
  totalISC: string;
  burnAmount: string;      // 1%
  treasuryAmount: string;  // 69%
  marketingAmount: string; // 30%
}

export function useNFTMinting(
  landContractAddress: string,
  buildingContractAddress: string,
  iscTokenAddress: string,
  signer: ethers.Signer | null
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 计算 1% 销毁 + 69% 国库 + 30% 营销的分配详情
  const calculateBreakdown = useCallback((iscCostStr: string): MintBreakdown => {
    try {
      if (!iscCostStr || Number(iscCostStr) <= 0) {
        return { totalISC: '0', burnAmount: '0', treasuryAmount: '0', marketingAmount: '0' };
      }
      const costBN = ethers.parseEther(iscCostStr);
      const burn = (costBN * BigInt(1)) / BigInt(100);
      const treasury = (costBN * BigInt(69)) / BigInt(100);
      const marketing = costBN - burn - treasury; // 30%
      return {
        totalISC: iscCostStr,
        burnAmount: ethers.formatEther(burn),
        treasuryAmount: ethers.formatEther(treasury),
        marketingAmount: ethers.formatEther(marketing)
      };
    } catch {
      return { totalISC: '0', burnAmount: '0', treasuryAmount: '0', marketingAmount: '0' };
    }
  }, []);

  // 铸造土地 NFT
  const mintLand = useCallback(async (iscCostStr: string) => {
    if (!signer) {
      setError('钱包未连接');
      return false;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);

    try {
      const costBN = ethers.parseEther(iscCostStr);
      const userAddress = await signer.getAddress();

      // 1. 检查 ISC 余额
      const iscToken = new ethers.Contract(iscTokenAddress, ISC_TOKEN_ABI, signer);
      const balance = await iscToken.balanceOf(userAddress);
      if (balance < costBN) {
        throw new Error('ISC 余额不足，无法铸造土地');
      }

      // 2. 检查 allowance 并授权
      const allowance = await iscToken.allowance(userAddress, landContractAddress);
      if (allowance < costBN) {
        const approveTx = await iscToken.approve(landContractAddress, costBN);
        await approveTx.wait();
      }

      // 3. 调用 LandNFT 铸造
      const landContract = new ethers.Contract(landContractAddress, LAND_NFT_ABI, signer);
      const tx = await landContract.mintLand(costBN);
      const receipt = await tx.wait();

      setSuccess(`成功铸造土地 NFT！交易哈希: ${receipt?.hash}`);
      setTxHash(receipt?.hash || null);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || '铸造土地失败');
      setIsLoading(false);
      return false;
    }
  }, [signer, landContractAddress, iscTokenAddress]);

  // 铸造建筑 NFT
  const mintBuilding = useCallback(async (buildingType: number, iscCostStr: string, dailyIncomeStr: string) => {
    if (!signer) {
      setError('钱包未连接');
      return false;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);

    try {
      const costBN = ethers.parseEther(iscCostStr);
      const incomeBN = ethers.parseEther(dailyIncomeStr);
      const userAddress = await signer.getAddress();

      // 1. 检查 ISC 余额
      const iscToken = new ethers.Contract(iscTokenAddress, ISC_TOKEN_ABI, signer);
      const balance = await iscToken.balanceOf(userAddress);
      if (balance < costBN) {
        throw new Error('ISC 余额不足，无法铸造建筑');
      }

      // 2. 检查 allowance 并授权
      const allowance = await iscToken.allowance(userAddress, buildingContractAddress);
      if (allowance < costBN) {
        const approveTx = await iscToken.approve(buildingContractAddress, costBN);
        await approveTx.wait();
      }

      // 3. 调用 BuildingNFT 铸造
      const buildingContract = new ethers.Contract(buildingContractAddress, BUILDING_NFT_ABI, signer);
      const tx = await buildingContract.mintBuilding(buildingType, costBN, incomeBN);
      const receipt = await tx.wait();

      setSuccess(`成功铸造房产/建筑 NFT！交易哈希: ${receipt?.hash}`);
      setTxHash(receipt?.hash || null);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || '铸造建筑失败');
      setIsLoading(false);
      return false;
    }
  }, [signer, buildingContractAddress, iscTokenAddress]);

  return {
    isLoading,
    error,
    success,
    txHash,
    calculateBreakdown,
    mintLand,
    mintBuilding
  };
}
