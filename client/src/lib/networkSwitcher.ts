/**
 * Network Switcher Utility
 * Handles switching between different blockchain networks via wallet provider
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  symbol: string;
  blockExplorer: string;
  icon: string;
  color: string;
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  56: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    symbol: 'BNB',
    blockExplorer: 'https://bscscan.com',
    icon: '🟡',
    color: 'bg-yellow-500',
  },
  97: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-b7a9b.bnbchain.org:8545',
    symbol: 'tBNB',
    blockExplorer: 'https://testnet.bscscan.com',
    icon: '🟠',
    color: 'bg-orange-500',
  },
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io',
    icon: '🔵',
    color: 'bg-blue-500',
  },
  5: {
    chainId: 5,
    name: 'Ethereum Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR-PROJECT-ID',
    symbol: 'gETH',
    blockExplorer: 'https://goerli.etherscan.io',
    icon: '🟣',
    color: 'bg-purple-500',
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
    icon: '🟣',
    color: 'bg-purple-500',
  },
  80001: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    symbol: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com',
    icon: '🟡',
    color: 'bg-yellow-500',
  },
};

/**
 * Get network config by chain ID
 */
export function getNetworkConfig(chainId: number): NetworkConfig | null {
  return SUPPORTED_NETWORKS[chainId] || null;
}

/**
 * Get all supported networks
 */
export function getAllNetworks(): NetworkConfig[] {
  return Object.values(SUPPORTED_NETWORKS);
}

/**
 * Get mainnet networks only
 */
export function getMainnetNetworks(): NetworkConfig[] {
  return [
    SUPPORTED_NETWORKS[56],  // BSC Mainnet
    SUPPORTED_NETWORKS[1],   // Ethereum Mainnet
    SUPPORTED_NETWORKS[137], // Polygon Mainnet
  ];
}

/**
 * Switch network via MetaMask or other EIP-1193 compatible wallet
 */
export async function switchNetwork(chainId: number): Promise<boolean> {
  try {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }

    const network = getNetworkConfig(chainId);
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Try to switch to the network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        // Add the network
        await addNetwork(chainId);
        return true;
      }
      throw switchError;
    }
  } catch (error) {
    console.error('Failed to switch network:', error);
    return false;
  }
}

/**
 * Add a new network to the wallet
 */
export async function addNetwork(chainId: number): Promise<boolean> {
  try {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }

    const network = getNetworkConfig(chainId);
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorer],
          nativeCurrency: {
            name: network.symbol,
            symbol: network.symbol,
            decimals: 18,
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Failed to add network:', error);
    return false;
  }
}

/**
 * Get current network from wallet
 */
export async function getCurrentNetwork(): Promise<number | null> {
  try {
    if (!window.ethereum) {
      return null;
    }

    const chainIdHex = await window.ethereum.request({
      method: 'eth_chainId',
    });

    return parseInt(chainIdHex as string, 16);
  } catch (error) {
    console.error('Failed to get current network:', error);
    return null;
  }
}

/**
 * Listen for network changes
 */
export function onNetworkChange(callback: (chainId: number) => void): () => void {
  if (!window.ethereum) {
    return () => {};
  }

  const handleChainChanged = (chainIdHex: string) => {
    const chainId = parseInt(chainIdHex, 16);
    callback(chainId);
  };

  window.ethereum.on('chainChanged', handleChainChanged);

  // Return unsubscribe function
  return () => {
    window.ethereum?.removeListener('chainChanged', handleChainChanged);
  };
}

/**
 * Format chain ID for display
 */
export function formatChainId(chainId: number): string {
  const network = getNetworkConfig(chainId);
  return network ? network.name : `Chain ${chainId}`;
}

/**
 * Get network color for UI
 */
export function getNetworkColor(chainId: number): string {
  const network = getNetworkConfig(chainId);
  return network?.color || 'bg-gray-500';
}

/**
 * Get network icon for UI
 */
export function getNetworkIcon(chainId: number): string {
  const network = getNetworkConfig(chainId);
  return network?.icon || '🔗';
}

// Extend window interface for Ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (data: any) => void) => void;
      removeListener: (event: string, callback: (data: any) => void) => void;
    };
  }
}
