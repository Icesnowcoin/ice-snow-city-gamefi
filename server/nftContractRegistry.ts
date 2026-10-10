import { getAddress } from "ethers";

export type NftStandard = "erc721" | "erc1155";
export type NftContractConfig = { chainId: number; address: string; standard: NftStandard; startBlock: bigint; verifiedAt: string };

const registry: NftContractConfig[] = [];

export function registerVerifiedNftContract(config: NftContractConfig): void {
  if (config.chainId <= 0 || config.startBlock < BigInt(0) || !config.verifiedAt) throw new Error("NFT 合约配置无效");
  const normalized = getAddress(config.address);
  if (registry.some((item) => item.chainId === config.chainId && item.address.toLowerCase() === normalized.toLowerCase())) return;
  registry.push({ ...config, address: normalized });
}

export function findVerifiedNftContract(chainId: number, address: string): NftContractConfig | null {
  const normalized = getAddress(address);
  return registry.find((item) => item.chainId === chainId && item.address.toLowerCase() === normalized.toLowerCase()) ?? null;
}

export function listVerifiedNftContracts(): readonly NftContractConfig[] { return registry.map((item) => ({ ...item })); }

export function clearRegistryForTests(): void { registry.length = 0; }
