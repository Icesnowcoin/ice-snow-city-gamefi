/**
 * 多钱包授权集成系统
 * 支持 MetaMask, WalletConnect, Coinbase, Trust Wallet, Ledger, Trezor 等
 */

import type { WalletType, WalletAuthorizationRequest, WalletAuthorizationResponse } from '../../shared/types/wallet';

// Type definitions for wallet providers
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (data: any) => void) => void;
      removeListener: (event: string, callback: (data: any) => void) => void;
    };
    coinbaseWallet?: any;
    trustwallet?: any;
  }
}

export class WalletIntegration {
  /**
   * MetaMask 钱包授权
   */
  static async authorizeWithMetaMask(
    request: WalletAuthorizationRequest
  ): Promise<WalletAuthorizationResponse> {
    try {
      // 检查 MetaMask 是否安装
      if (typeof window === 'undefined' || !window.ethereum) {
        return {
          success: false,
          error: 'MetaMask not installed. Please install MetaMask extension.',
        };
      }

      const ethereum = window.ethereum;

      // 请求账户连接
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts available',
        };
      }

      // 切换网络
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${request.chainId.toString(16)}` }],
        });
      } catch (error: any) {
        if (error.code === 4902) {
          // 网络不存在，添加网络
          await this.addNetworkToMetaMask(request.chainId);
        }
      }

      // 发送交易
      const txHash = await this.sendTransactionWithMetaMask(request);

      return {
        success: true,
        txHash,
        message: 'Transaction sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'MetaMask authorization failed',
      };
    }
  }

  /**
   * WalletConnect 授权
   */
  static async authorizeWithWalletConnect(
    request: WalletAuthorizationRequest
  ): Promise<WalletAuthorizationResponse> {
    try {
      // WalletConnect 初始化
      const projectId = process.env.VITE_WALLETCONNECT_PROJECT_ID || '';
      if (!projectId) {
        return {
          success: false,
          error: 'WalletConnect project ID not configured',
        };
      }

      // 创建 WalletConnect 会话
      const sessionTopic = await this.createWalletConnectSession(projectId);

      // 发送交易
      const txHash = await this.sendTransactionWithWalletConnect(
        sessionTopic,
        request
      );

      return {
        success: true,
        txHash,
        message: 'Transaction sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'WalletConnect authorization failed',
      };
    }
  }

  /**
   * Coinbase Wallet 授权
   */
  static async authorizeWithCoinbase(
    request: WalletAuthorizationRequest
  ): Promise<WalletAuthorizationResponse> {
    try {
      if (typeof window === 'undefined' || !window.coinbaseWallet) {
        return {
          success: false,
          error: 'Coinbase Wallet not installed',
        };
      }

      const provider = window.coinbaseWallet.getProvider();

      // 请求账户
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts available',
        };
      }

      // 发送交易
      const txHash = await this.sendTransactionWithProvider(provider, request);

      return {
        success: true,
        txHash,
        message: 'Transaction sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Coinbase Wallet authorization failed',
      };
    }
  }

  /**
   * Trust Wallet 授权
   */
  static async authorizeWithTrustWallet(
    request: WalletAuthorizationRequest
  ): Promise<WalletAuthorizationResponse> {
    try {
      if (typeof window === 'undefined' || !window.trustwallet) {
        return {
          success: false,
          error: 'Trust Wallet not installed',
        };
      }

      const provider = window.trustwallet;

      // 请求账户
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts available',
        };
      }

      // 发送交易
      const txHash = await this.sendTransactionWithProvider(provider, request);

      return {
        success: true,
        txHash,
        message: 'Transaction sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Trust Wallet authorization failed',
      };
    }
  }

  /**
   * Ledger 硬件钱包授权
   */
  static async authorizeWithLedger(
    request: WalletAuthorizationRequest
  ): Promise<WalletAuthorizationResponse> {
    try {
      // Ledger 需要通过 WalletConnect 或其他中间件
      return {
        success: false,
        error: 'Ledger authorization requires WalletConnect or Ledger Live',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Ledger authorization failed',
      };
    }
  }

  /**
   * Trezor 硬件钱包授权
   */
  static async authorizeWithTrezor(
    request: WalletAuthorizationRequest
  ): Promise<WalletAuthorizationResponse> {
    try {
      // Trezor 需要通过 WalletConnect 或其他中间件
      return {
        success: false,
        error: 'Trezor authorization requires WalletConnect or Trezor Connect',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Trezor authorization failed',
      };
    }
  }

  /**
   * 通用授权方法
   */
  static async authorize(
    walletType: WalletType,
    request: WalletAuthorizationRequest
  ): Promise<WalletAuthorizationResponse> {
    switch (walletType) {
      case 'metamask':
        return this.authorizeWithMetaMask(request);
      case 'walletconnect':
        return this.authorizeWithWalletConnect(request);
      case 'coinbase':
        return this.authorizeWithCoinbase(request);
      case 'trust':
        return this.authorizeWithTrustWallet(request);
      case 'ledger':
        return this.authorizeWithLedger(request);
      case 'trezor':
        return this.authorizeWithTrezor(request);
      default:
        return {
          success: false,
          error: `Unsupported wallet type: ${walletType}`,
        };
    }
  }

  /**
   * 辅助方法：添加网络到 MetaMask
   */
  private static async addNetworkToMetaMask(chainId: number) {
    const chainConfig = this.getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [chainConfig],
    });
  }

  /**
   * 辅助方法：发送交易（MetaMask）
   */
  private static async sendTransactionWithMetaMask(
    request: WalletAuthorizationRequest
  ): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: request.recipientAddress,
          to: request.contractAddress,
          value: request.amount,
          data: request.data?.encodedData || '0x',
          gas: request.data?.gasLimit || '0x5208',
          gasPrice: request.data?.gasPrice || undefined,
        },
      ],
    });

    return txHash;
  }

  /**
   * 辅助方法：发送交易（通用 Provider）
   */
  private static async sendTransactionWithProvider(
    provider: any,
    request: WalletAuthorizationRequest
  ): Promise<string> {
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: request.recipientAddress,
          to: request.contractAddress,
          value: request.amount,
          data: request.data?.encodedData || '0x',
          gas: request.data?.gasLimit || '0x5208',
          gasPrice: request.data?.gasPrice || undefined,
        },
      ],
    });

    return txHash;
  }

  /**
   * 辅助方法：创建 WalletConnect 会话
   */
  private static async createWalletConnectSession(projectId: string): Promise<string> {
    // 实现 WalletConnect 会话创建逻辑
    // 这里是占位符实现
    return 'session_topic_placeholder';
  }

  /**
   * 辅助方法：发送交易（WalletConnect）
   */
  private static async sendTransactionWithWalletConnect(
    sessionTopic: string,
    request: WalletAuthorizationRequest
  ): Promise<string> {
    // 实现 WalletConnect 交易发送逻辑
    // 这里是占位符实现
    return '0x' + 'tx_hash_placeholder';
  }

  /**
   * 获取链配置
   */
  private static getChainConfig(chainId: number): any {
    const chains: Record<number, any> = {
      56: {
        chainId: '0x38',
        chainName: 'Binance Smart Chain',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18,
        },
        rpcUrls: [process.env.BSC_TESTNET_RPC_URL || 'https://bsc-dataseed.binance.org'],
        blockExplorerUrls: ['https://bscscan.com'],
      },
      97: {
        chainId: '0x61',
        chainName: 'BSC Testnet',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18,
        },
        rpcUrls: [process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-b.binance.org:8545'],
        blockExplorerUrls: ['https://testnet.bscscan.com'],
      },
      1: {
        chainId: '0x1',
        chainName: 'Ethereum',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://eth.llamarpc.com'],
        blockExplorerUrls: ['https://etherscan.io'],
      },
    };

    return chains[chainId];
  }
}


