import { ethers } from "ethers";

export const DRAFT_MARKETPLACE_DOMAIN_NAME = "Ice Snow City Seaport Style Marketplace";
export const DRAFT_MARKETPLACE_DOMAIN_VERSION = "2";
export const SIMULATED_CHAIN_ID = 31337;

export const DRAFT_ORDER_TYPES: Record<string, Array<{ name: string; type: string }>> = {
  Order: [
    { name: "offerer", type: "address" },
    { name: "nftContract", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "price", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "itemType", type: "uint8" },
    { name: "orderType", type: "uint8" },
    { name: "salt", type: "bytes32" },
  ],
};

export type DraftOrder = {
  offerer: string;
  nftContract: string;
  tokenId: bigint;
  amount: bigint;
  price: bigint;
  expiration: bigint;
  nonce: bigint;
  itemType: number;
  orderType: number;
  salt: string;
};

export const DRAFT_MARKETPLACE_ABI = [
  "function executeSellOrder((address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,uint8 orderType,bytes32 salt),bytes) external",
  "function acceptBuyOffer((address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,uint8 orderType,bytes32 salt),bytes) external",
  "function cancelNonce(uint256 nonce) external",
  "function hashOrder((address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,uint8 orderType,bytes32 salt)) view returns (bytes32)",
  "function cancelledNonces(address,uint256) view returns (bool)",
  "function COMMISSION_BPS() view returns (uint256)",
];

export const ISC_TOKEN_ABI = [
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

function normalizeOrder(order: DraftOrder) {
  return {
    ...order,
    tokenId: BigInt(order.tokenId),
    amount: BigInt(order.amount),
    price: BigInt(order.price),
    expiration: BigInt(order.expiration),
    nonce: BigInt(order.nonce),
  };
}

export function buildDraftDomain(chainId: number, verifyingContract: string) {
  if (!Number.isInteger(chainId) || chainId <= 0) throw new Error("Invalid chain ID");
  return {
    name: DRAFT_MARKETPLACE_DOMAIN_NAME,
    version: DRAFT_MARKETPLACE_DOMAIN_VERSION,
    chainId,
    verifyingContract: ethers.getAddress(verifyingContract),
  };
}

export function assertSimulationNetwork(chainId: number, simulatedOnly = true) {
  if (simulatedOnly && chainId !== SIMULATED_CHAIN_ID) {
    throw new Error(`Simulation adapter refuses chain ${chainId}; expected ${SIMULATED_CHAIN_ID}`);
  }
}

export async function signDraftOrder(
  signer: ethers.Signer,
  order: DraftOrder,
  chainId: number,
  marketplaceAddress: string,
  simulatedOnly = true,
) {
  assertSimulationNetwork(chainId, simulatedOnly);
  const normalized = normalizeOrder(order);
  const signature = await signer.signTypedData(
    buildDraftDomain(chainId, marketplaceAddress),
    DRAFT_ORDER_TYPES,
    normalized,
  );
  return { order: normalized, signature };
}

export function createDraftMarketplaceClient(options: {
  signer: ethers.Signer;
  marketplaceAddress: string;
  iscTokenAddress: string;
  chainId: number;
  simulatedOnly?: boolean;
}) {
  const { signer, marketplaceAddress, iscTokenAddress, chainId, simulatedOnly = true } = options;
  assertSimulationNetwork(chainId, simulatedOnly);
  const market = new ethers.Contract(marketplaceAddress, DRAFT_MARKETPLACE_ABI, signer);
  const isc = new ethers.Contract(iscTokenAddress, ISC_TOKEN_ABI, signer);
  return {
    async sign(order: DraftOrder) {
      return signDraftOrder(signer, order, chainId, marketplaceAddress, simulatedOnly);
    },
    async executeSell(order: DraftOrder, signature: string) {
      return market.executeSellOrder(normalizeOrder(order), signature);
    },
    async acceptBuyOffer(order: DraftOrder, signature: string) {
      return market.acceptBuyOffer(normalizeOrder(order), signature);
    },
    async cancelNonce(nonce: bigint) {
      return market.cancelNonce(nonce);
    },
    async isNonceCancelled(offerer: string, nonce: bigint) {
      return market.cancelledNonces(offerer, nonce);
    },
    async approve(amount: bigint) {
      return isc.approve(marketplaceAddress, amount);
    },
    async balanceOf(address: string) {
      return isc.balanceOf(address) as Promise<bigint>;
    },
  };
}
