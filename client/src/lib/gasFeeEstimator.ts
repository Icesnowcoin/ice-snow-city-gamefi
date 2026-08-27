/**
 * Gas Fee Estimator
 * Provides real-time gas price estimation and transaction cost calculation
 */

export interface GasPrice {
  standard: string;
  fast: string;
  instant: string;
  baseFee?: string;
}

export interface GasFeeEstimate {
  gasPrice: string;
  gasLimit: number;
  totalFee: string;
  totalFeeUSD: string;
  estimatedTime: string;
  speedLevel: 'standard' | 'fast' | 'instant';
}

export interface NetworkGasConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  gasMultiplier: number;
  standardTime: number; // minutes
  fastTime: number;
  instantTime: number;
}

// Network configurations
const NETWORK_CONFIGS: Record<number, NetworkGasConfig> = {
  56: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    gasMultiplier: 1,
    standardTime: 1,
    fastTime: 0.5,
    instantTime: 0.2,
  },
  97: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-b7a9b.bnbchain.org:8545',
    gasMultiplier: 1,
    standardTime: 1,
    fastTime: 0.5,
    instantTime: 0.2,
  },
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    gasMultiplier: 1.2,
    standardTime: 2,
    fastTime: 1,
    instantTime: 0.3,
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    gasMultiplier: 0.8,
    standardTime: 1.5,
    fastTime: 0.8,
    instantTime: 0.2,
  },
};

// Gas limits for different transaction types (in wei)
const GAS_LIMITS = {
  transfer: 21000,
  deposit: 100000,
  withdrawal: 150000,
  swap: 200000,
  approve: 50000,
};

/**
 * Fetch current gas prices from network
 */
export async function fetchGasPrices(chainId: number): Promise<GasPrice> {
  try {
    const config = NETWORK_CONFIGS[chainId];
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // For demo purposes, return mock gas prices
    // In production, you would fetch from actual RPC endpoint
    const mockPrices = getMockGasPrices(chainId);
    return mockPrices;
  } catch (error) {
    console.error('Failed to fetch gas prices:', error);
    // Return fallback prices
    return getFallbackGasPrices(chainId);
  }
}

/**
 * Get mock gas prices (for demo)
 */
function getMockGasPrices(chainId: number): GasPrice {
  const basePrices: Record<number, GasPrice> = {
    56: {
      standard: '3',
      fast: '5',
      instant: '8',
      baseFee: '2',
    },
    97: {
      standard: '10',
      fast: '15',
      instant: '20',
      baseFee: '1',
    },
    1: {
      standard: '25',
      fast: '35',
      instant: '50',
      baseFee: '20',
    },
    137: {
      standard: '50',
      fast: '100',
      instant: '150',
      baseFee: '30',
    },
  };

  return basePrices[chainId] || basePrices[56];
}

/**
 * Get fallback gas prices
 */
function getFallbackGasPrices(chainId: number): GasPrice {
  return getMockGasPrices(chainId);
}

/**
 * Calculate gas fee for a transaction
 */
export function calculateGasFee(
  gasPrice: string,
  gasLimit: number,
  ethPrice: number = 2500 // Default ETH price in USD
): { fee: string; feeUSD: string } {
  try {
    // Convert gas price from Gwei to Wei
    const gasPriceWei = BigInt(gasPrice) * BigInt(10 ** 9);
    const totalFeeWei = gasPriceWei * BigInt(gasLimit);

    // Convert Wei to Ether (1 Ether = 10^18 Wei)
    const totalFeeEther = Number(totalFeeWei) / 10 ** 18;
    const totalFeeUSD = (totalFeeEther * ethPrice).toFixed(2);

    return {
      fee: totalFeeEther.toFixed(6),
      feeUSD: totalFeeUSD,
    };
  } catch (error) {
    console.error('Failed to calculate gas fee:', error);
    return {
      fee: '0',
      feeUSD: '0',
    };
  }
}

/**
 * Estimate transaction fee with different speed levels
 */
export async function estimateTransactionFee(
  chainId: number,
  transactionType: keyof typeof GAS_LIMITS = 'transfer',
  ethPrice: number = 2500
): Promise<Record<'standard' | 'fast' | 'instant', GasFeeEstimate>> {
  try {
    const gasPrices = await fetchGasPrices(chainId);
    const gasLimit = GAS_LIMITS[transactionType];
    const config = NETWORK_CONFIGS[chainId];

    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const standardFee = calculateGasFee(gasPrices.standard, gasLimit, ethPrice);
    const fastFee = calculateGasFee(gasPrices.fast, gasLimit, ethPrice);
    const instantFee = calculateGasFee(gasPrices.instant, gasLimit, ethPrice);

    const estimates: Record<'standard' | 'fast' | 'instant', GasFeeEstimate> = {
      standard: {
        gasPrice: gasPrices.standard,
        gasLimit,
        totalFee: standardFee.fee,
        totalFeeUSD: standardFee.feeUSD,
        estimatedTime: `~${config.standardTime} min`,
        speedLevel: 'standard',
      },
      fast: {
        gasPrice: gasPrices.fast,
        gasLimit,
        totalFee: fastFee.fee,
        totalFeeUSD: fastFee.feeUSD,
        estimatedTime: `~${config.fastTime} min`,
        speedLevel: 'fast',
      },
      instant: {
        gasPrice: gasPrices.instant,
        gasLimit,
        totalFee: instantFee.fee,
        totalFeeUSD: instantFee.feeUSD,
        estimatedTime: `~${config.instantTime} min`,
        speedLevel: 'instant',
      },
    };

    return estimates;
  } catch (error) {
    console.error('Failed to estimate transaction fee:', error);
    // Return fallback estimates
    return getFallbackEstimates(chainId, transactionType, ethPrice);
  }
}

/**
 * Get fallback fee estimates
 */
function getFallbackEstimates(
  chainId: number,
  transactionType: keyof typeof GAS_LIMITS,
  ethPrice: number
): Record<'standard' | 'fast' | 'instant', GasFeeEstimate> {
  const gasPrices = getFallbackGasPrices(chainId);
  const gasLimit = GAS_LIMITS[transactionType];
  const config = NETWORK_CONFIGS[chainId] || NETWORK_CONFIGS[56];

  const standardFee = calculateGasFee(gasPrices.standard, gasLimit, ethPrice);
  const fastFee = calculateGasFee(gasPrices.fast, gasLimit, ethPrice);
  const instantFee = calculateGasFee(gasPrices.instant, gasLimit, ethPrice);

  return {
    standard: {
      gasPrice: gasPrices.standard,
      gasLimit,
      totalFee: standardFee.fee,
      totalFeeUSD: standardFee.feeUSD,
      estimatedTime: `~${config.standardTime} min`,
      speedLevel: 'standard',
    },
    fast: {
      gasPrice: gasPrices.fast,
      gasLimit,
      totalFee: fastFee.fee,
      totalFeeUSD: fastFee.feeUSD,
      estimatedTime: `~${config.fastTime} min`,
      speedLevel: 'fast',
    },
    instant: {
      gasPrice: gasPrices.instant,
      gasLimit,
      totalFee: instantFee.fee,
      totalFeeUSD: instantFee.feeUSD,
      estimatedTime: `~${config.instantTime} min`,
      speedLevel: 'instant',
    },
  };
}

/**
 * Get network name by chain ID
 */
export function getNetworkName(chainId: number): string {
  return NETWORK_CONFIGS[chainId]?.name || 'Unknown Network';
}

/**
 * Get supported networks
 */
export function getSupportedNetworks(): NetworkGasConfig[] {
  return Object.values(NETWORK_CONFIGS);
}

/**
 * Format gas price display
 */
export function formatGasPrice(gasPrice: string, unit: 'gwei' | 'wei' = 'gwei'): string {
  if (unit === 'gwei') {
    return `${gasPrice} Gwei`;
  }
  return `${gasPrice} Wei`;
}

/**
 * Format fee display with currency
 */
export function formatFeeDisplay(fee: string, currency: 'ETH' | 'BNB' | 'MATIC' = 'BNB'): string {
  return `${fee} ${currency}`;
}

/**
 * Calculate total cost including transaction fee
 */
export function calculateTotalCost(
  amount: number,
  fee: number,
  currency: string = 'ISC'
): string {
  const total = amount + fee;
  return `${total.toFixed(6)} ${currency}`;
}
