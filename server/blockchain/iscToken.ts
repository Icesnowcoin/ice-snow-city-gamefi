/**
 * ISC Token (Ice Snow Coin) Contract Integration
 * Handles interactions with the ISC ERC20 token on BSC testnet
 */

import { ethers } from "ethers";

// ISC Token Contract ABI (ERC20 + custom functions)
export const ISC_TOKEN_ABI = [
  // Standard ERC20 functions
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  // Custom game function
  {
    constant: false,
    inputs: [
      { name: "player", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "payForGameItem",
    outputs: [],
    type: "function",
  },
  // Cooldown function
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "getCooldownRemaining",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
];

export interface ISCTokenConfig {
  contractAddress: string;
  rpcUrl: string;
  decimals: number;
}

export class ISCTokenService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private config: ISCTokenConfig;

  constructor(config: ISCTokenConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.contract = new ethers.Contract(
      config.contractAddress,
      ISC_TOKEN_ABI,
      this.provider
    );
  }

  /**
   * Get player's ISC token balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(address);
      // Convert from wei to ISC (divide by 10^decimals)
      return ethers.formatUnits(balance, this.config.decimals);
    } catch (error) {
      console.error("Error getting balance:", error);
      throw new Error(`Failed to get balance for ${address}`);
    }
  }

  /**
   * Get player's ISC token balance in wei
   */
  async getBalanceWei(address: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(address);
      return balance.toString();
    } catch (error) {
      console.error("Error getting balance in wei:", error);
      throw new Error(`Failed to get balance for ${address}`);
    }
  }

  /**
   * Get token info (name, symbol, decimals, totalSupply)
   */
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.decimals(),
        this.contract.totalSupply(),
      ]);

      return {
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
      };
    } catch (error) {
      console.error("Error getting token info:", error);
      throw new Error("Failed to get token info");
    }
  }

  /**
   * Get cooldown remaining time for an address
   */
  async getCooldownRemaining(address: string): Promise<number> {
    try {
      const remaining = await this.contract.getCooldownRemaining(address);
      return Number(remaining);
    } catch (error) {
      console.error("Error getting cooldown remaining:", error);
      return 0; // Return 0 if cooldown is not applicable
    }
  }

  /**
   * Check if address is blacklisted
   */
  async isBlacklisted(address: string): Promise<boolean> {
    try {
      // Note: isBlacklisted is a public mapping, we need to call it directly
      // This requires the contract to expose it as a function or we need to use eth_call
      const result = await this.provider.call({
        to: this.config.contractAddress,
        data: ethers.AbiCoder.defaultAbiCoder().encode(
          ["function isBlacklisted(address)"],
          [address]
        ),
      });
      return result !== "0x0000000000000000000000000000000000000000000000000000000000000000";
    } catch (error) {
      console.error("Error checking blacklist:", error);
      return false;
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.config.contractAddress;
  }

  /**
   * Get provider
   */
  getProvider(): ethers.Provider {
    return this.provider;
  }

  /**
   * Get contract instance
   */
  getContract(): ethers.Contract {
    return this.contract;
  }
}

// Create singleton instance
let iscTokenService: ISCTokenService | null = null;

export function getISCTokenService(): ISCTokenService {
  if (!iscTokenService) {
    const contractAddress =
      process.env.ICESNOWCOIN_CONTRACT_ADDRESS ||
      "0x11229a3f976566FA8a3ba462C432122f3B8876f6";
    const rpcUrl =
      process.env.BSC_TESTNET_RPC_URL ||
      "https://data-seed-prebsc-1-b.binance.org:8545";
    const decimals = parseInt(process.env.ICESNOWCOIN_DECIMALS || "18", 10);

    iscTokenService = new ISCTokenService({
      contractAddress,
      rpcUrl,
      decimals,
    });
  }
  return iscTokenService;
}
