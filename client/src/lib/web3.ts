import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';

// Network configuration
export const NETWORKS = {
  bsc_testnet: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-b.binance.org:8545',
    blockExplorer: 'https://testnet.bscscan.com',
    nativeCurrency: 'BNB',
  },
  bsc_mainnet: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: 'BNB',
  },
};

// Wallet types
export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'ledger' | 'trezor';

export interface WalletConnection {
  address: string;
  provider: BrowserProvider;
  chainId: number;
  balance: string;
  walletType: WalletProvider;
}

export interface TransactionResult {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  status: 'success' | 'failed' | 'pending';
}

/**
 * Check if wallet is available
 */
export const isWalletAvailable = (walletType: WalletProvider): boolean => {
  if (typeof window === 'undefined') return false;

  const ethereum = (window as any).ethereum;
  if (!ethereum) return false;

  switch (walletType) {
    case 'metamask':
      return !!(ethereum.isMetaMask);
    case 'coinbase':
      return !!(ethereum.isCoinbaseWallet);
    case 'trust':
      return !!(ethereum.isTrust);
    default:
      return true;
  }
};

/**
 * Connect to wallet
 */
export const connectWallet = async (walletType: WalletProvider): Promise<WalletConnection> => {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }

  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error(`${walletType} wallet not installed`);
  }

  try {
    // Request account access
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];

    // Create provider
    const provider = new BrowserProvider(ethereum);

    // Get network info
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Get balance
    const balanceWei = await provider.getBalance(address);
    const balance = formatUnits(balanceWei, 18);

    return {
      address,
      provider,
      chainId,
      balance,
      walletType,
    };
  } catch (error) {
    throw new Error(`Failed to connect ${walletType}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = async (): Promise<void> => {
  // Most wallets don't have a disconnect method, but we can clear the connection
  // This is handled on the frontend by clearing state
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (
  provider: BrowserProvider,
  address: string
): Promise<string> => {
  try {
    const balanceWei = await provider.getBalance(address);
    return formatUnits(balanceWei, 18);
  } catch (error) {
    throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Switch network
 */
export const switchNetwork = async (chainId: number): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }

  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error('Wallet not available');
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    // If network not added, add it
    if (error.code === 4902) {
      const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
      if (network) {
        await addNetwork(network);
      }
    } else {
      throw error;
    }
  }
};

/**
 * Add network to wallet
 */
export const addNetwork = async (network: (typeof NETWORKS)[keyof typeof NETWORKS]): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }

  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error('Wallet not available');
  }

  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorer],
          nativeCurrency: {
            name: network.nativeCurrency,
            symbol: network.nativeCurrency,
            decimals: 18,
          },
        },
      ],
    });
  } catch (error) {
    throw new Error(`Failed to add network: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Send transaction
 */
export const sendTransaction = async (
  provider: BrowserProvider,
  to: string,
  value: string,
  data?: string
): Promise<TransactionResult> => {
  try {
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Create transaction
    const tx = {
      to,
      value: parseUnits(value, 18),
      data,
    };

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);

    // Wait for confirmation
    const receipt = await txResponse.wait();

    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return {
      hash: txResponse.hash,
      from: address,
      to,
      value,
      gasUsed: receipt.gasUsed?.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  } catch (error) {
    throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Sign message
 */
export const signMessage = async (provider: BrowserProvider, message: string): Promise<string> => {
  try {
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get transaction receipt
 */
export const getTransactionReceipt = async (
  provider: BrowserProvider,
  txHash: string
): Promise<TransactionResult | null> => {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return null;
    }

    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      return null;
    }

    return {
      hash: txHash,
      from: tx.from || '',
      to: tx.to || '',
      value: formatUnits(tx.value, 18),
      gasUsed: receipt.gasUsed?.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  } catch (error) {
    throw new Error(`Failed to get transaction receipt: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Estimate gas
 */
export const estimateGas = async (
  provider: BrowserProvider,
  to: string,
  value: string,
  data?: string
): Promise<string> => {
  try {
    const gasEstimate = await provider.estimateGas({
      to,
      value: parseUnits(value, 18),
      data,
    });

    return formatUnits(gasEstimate, 0);
  } catch (error) {
    throw new Error(`Failed to estimate gas: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get gas price
 */
export const getGasPrice = async (provider: BrowserProvider): Promise<string> => {
  try {
    const feeData = await provider.getFeeData();
    if (!feeData.gasPrice) {
      throw new Error('Unable to fetch gas price');
    }
    return formatUnits(feeData.gasPrice, 'gwei');
  } catch (error) {
    throw new Error(`Failed to get gas price: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Format address
 */
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Validate address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Get network name
 */
export const getNetworkName = (chainId: number): string => {
  const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
  return network?.name || `Chain ${chainId}`;
};

/**
 * Get block explorer URL
 */
export const getBlockExplorerUrl = (chainId: number, txHash: string): string => {
  const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
  if (!network) return '';
  return `${network.blockExplorer}/tx/${txHash}`;
};
