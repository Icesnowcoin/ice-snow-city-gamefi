import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

const ISC_MARKETPLACE_ABI = [
  'function listItem(address nftContract, uint256 tokenId, uint256 amount, uint256 price, uint8 listingType) external returns (uint256)',
  'function buyItem(uint256 listingId) external',
  'function cancelListing(uint256 listingId) external',
  'function listings(uint256 listingId) external view returns (tuple(uint256 listingId, address seller, address nftContract, uint256 tokenId, uint256 amount, uint256 price, uint8 listingType, bool isActive, uint256 createdAt))',
  'event ItemListed(indexed uint256 listingId, indexed address seller, indexed address nftContract, uint256 tokenId, uint256 amount, uint256 price)',
  'event ItemSold(indexed uint256 listingId, indexed address seller, indexed address buyer, uint256 price, uint256 commission)',
  'event ListingCancelled(indexed uint256 listingId, indexed address seller)'
];

const ISC_TOKEN_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)'
];

export interface MarketplaceState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  txHash: string | null;
}

export function useISCMarketplace(
  marketplaceAddress: string,
  iscTokenAddress: string,
  signer: ethers.Signer | null
) {
  const [state, setState] = useState<MarketplaceState>({
    isLoading: false,
    error: null,
    success: null,
    txHash: null
  });

  // 获取 ISC 余额
  const getISCBalance = useCallback(async (address: string) => {
    if (!signer) return '0';
    try {
      const contract = new ethers.Contract(iscTokenAddress, ISC_TOKEN_ABI, signer);
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取 ISC 余额失败:', error);
      return '0';
    }
  }, [signer, iscTokenAddress]);

  // 授权 ISC 代币
  const approveISC = useCallback(async (amount: string) => {
    if (!signer) {
      setState(prev => ({ ...prev, error: '未连接钱包' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const contract = new ethers.Contract(iscTokenAddress, ISC_TOKEN_ABI, signer);
      const amountBN = ethers.parseEther(amount);
      
      const tx = await contract.approve(marketplaceAddress, amountBN);
      const receipt = await tx.wait();

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: '授权成功',
        txHash: receipt?.hash
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '授权失败'
      }));
      return false;
    }
  }, [signer, iscTokenAddress, marketplaceAddress]);

  // 买入 ISC
  const buyItem = useCallback(async (listingId: number) => {
    if (!signer) {
      setState(prev => ({ ...prev, error: '未连接钱包' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const contract = new ethers.Contract(marketplaceAddress, ISC_MARKETPLACE_ABI, signer);
      
      // 获取挂单信息
      const listing = await contract.listings(listingId);
      
      // 检查授权
      const iscContract = new ethers.Contract(iscTokenAddress, ISC_TOKEN_ABI, signer);
      const signerAddress = await signer.getAddress();
      const allowance = await iscContract.allowance(signerAddress, marketplaceAddress);
      
      if (allowance < listing.price) {
        // 需要授权
        const approveTx = await iscContract.approve(marketplaceAddress, listing.price);
        await approveTx.wait();
      }

      // 执行购买
      const tx = await contract.buyItem(listingId);
      const receipt = await tx.wait();

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: `成功购买！交易哈希: ${receipt?.hash}`,
        txHash: receipt?.hash
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '购买失败'
      }));
      return false;
    }
  }, [signer, marketplaceAddress, iscTokenAddress]);

  // 卖出 ISC
  const sellItem = useCallback(async (
    nftContract: string,
    tokenId: number,
    amount: number,
    price: string,
    listingType: number
  ) => {
    if (!signer) {
      setState(prev => ({ ...prev, error: '未连接钱包' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const contract = new ethers.Contract(marketplaceAddress, ISC_MARKETPLACE_ABI, signer);
      const priceBN = ethers.parseEther(price);

      const tx = await contract.listItem(
        nftContract,
        tokenId,
        amount,
        priceBN,
        listingType
      );

      const receipt = await tx.wait();

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: `成功挂单！交易哈希: ${receipt?.hash}`,
        txHash: receipt?.hash
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '挂单失败'
      }));
      return false;
    }
  }, [signer, marketplaceAddress]);

  // 取消挂单
  const cancelListing = useCallback(async (listingId: number) => {
    if (!signer) {
      setState(prev => ({ ...prev, error: '未连接钱包' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const contract = new ethers.Contract(marketplaceAddress, ISC_MARKETPLACE_ABI, signer);
      const tx = await contract.cancelListing(listingId);
      const receipt = await tx.wait();

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: `成功取消挂单！交易哈希: ${receipt?.hash}`,
        txHash: receipt?.hash
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '取消挂单失败'
      }));
      return false;
    }
  }, [signer, marketplaceAddress]);

  // 获取挂单信息
  const getListing = useCallback(async (listingId: number) => {
    if (!signer) return null;

    try {
      const contract = new ethers.Contract(marketplaceAddress, ISC_MARKETPLACE_ABI, signer);
      const listing = await contract.listings(listingId);
      return {
        listingId: listing.listingId.toString(),
        seller: listing.seller,
        nftContract: listing.nftContract,
        tokenId: listing.tokenId.toString(),
        amount: listing.amount.toString(),
        price: ethers.formatEther(listing.price),
        listingType: listing.listingType,
        isActive: listing.isActive,
        createdAt: listing.createdAt.toString()
      };
    } catch (error) {
      console.error('获取挂单信息失败:', error);
      return null;
    }
  }, [signer, marketplaceAddress]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      success: null,
      txHash: null
    }));
  }, []);

  return {
    ...state,
    getISCBalance,
    approveISC,
    buyItem,
    sellItem,
    cancelListing,
    getListing,
    clearMessages
  };
}
