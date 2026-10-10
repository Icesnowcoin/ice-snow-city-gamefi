import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  isLoading: boolean;
  error: string | null;
}

const SUPPORTED_CHAINS = {
  56: 'BSC Mainnet',
  97: 'BSC Testnet',
  1: 'Ethereum',
  137: 'Polygon'
};

export function useWeb3Wallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: '0',
    chainId: null,
    provider: null,
    signer: null,
    isLoading: false,
    error: null
  });

  // 检查钱包是否已连接
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = useCallback(async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({
        ...prev,
        error: '未检测到以太坊钱包，请安装 MetaMask 或其他 Web3 钱包'
      }));
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        setWalletState({
          isConnected: true,
          address,
          balance: ethers.formatEther(balance),
          chainId: Number(network.chainId),
          provider,
          signer,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('检查钱包连接失败:', error);
    }
  }, []);

  // 连接钱包
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({
        ...prev,
        error: '未检测到以太坊钱包'
      }));
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = accounts[0];
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        setWalletState({
          isConnected: true,
          address,
          balance: ethers.formatEther(balance),
          chainId: Number(network.chainId),
          provider,
          signer,
          isLoading: false,
          error: null
        });

        // 保存到 localStorage
        localStorage.setItem('walletConnected', 'true');
      }
    } catch (error: any) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '连接钱包失败'
      }));
    }
  }, []);

  // 断开钱包连接
  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: '0',
      chainId: null,
      provider: null,
      signer: null,
      isLoading: false,
      error: null
    });
    localStorage.removeItem('walletConnected');
  }, []);

  // 切换网络
  const switchChain = useCallback(async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });

      await checkWalletConnection();
    } catch (error: any) {
      if (error.code === 4902) {
        // 网络不存在，需要添加
        setWalletState(prev => ({
          ...prev,
          error: `请在钱包中手动添加 ${SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || '该'} 网络`
        }));
      } else {
        setWalletState(prev => ({
          ...prev,
          error: error.message || '切换网络失败'
        }));
      }
    }
  }, [checkWalletConnection]);

  // 监听账户变化
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        checkWalletConnection();
      }
    };

    const handleChainChanged = () => {
      checkWalletConnection();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [checkWalletConnection, disconnectWallet]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchChain,
    isSupported: walletState.chainId ? Object.keys(SUPPORTED_CHAINS).includes(String(walletState.chainId)) : false,
    chainName: walletState.chainId ? SUPPORTED_CHAINS[walletState.chainId as keyof typeof SUPPORTED_CHAINS] : null
  };
}
