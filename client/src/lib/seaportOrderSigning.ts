import {
  BrowserProvider,
  Contract,
  Signature,
  TypedDataDomain,
  Wallet,
  verifyTypedData,
} from "ethers";

export const SEAPORT_STYLE_DOMAIN_NAME = "Ice Snow City Seaport Style Marketplace";
export const SEAPORT_STYLE_DOMAIN_VERSION = "1";

export const SEAPORT_STYLE_ORDER_TYPES = {
  Order: [
    { name: "offerer", type: "address" },
    { name: "nftContract", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "price", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "itemType", type: "uint8" },
    { name: "salt", type: "bytes32" },
  ],
};

export type SeaportStyleOrder = {
  offerer: string;
  nftContract: string;
  tokenId: bigint;
  amount: bigint;
  price: bigint;
  expiration: bigint;
  nonce: bigint;
  itemType: 0 | 1;
  salt: string;
};

export type SeaportStyleDomain = TypedDataDomain & {
  name: typeof SEAPORT_STYLE_DOMAIN_NAME;
  version: typeof SEAPORT_STYLE_DOMAIN_VERSION;
  chainId: bigint | number;
  verifyingContract: string;
};

export function buildSeaportStyleDomain(
  chainId: bigint | number,
  verifyingContract: string,
): SeaportStyleDomain {
  return {
    name: SEAPORT_STYLE_DOMAIN_NAME,
    version: SEAPORT_STYLE_DOMAIN_VERSION,
    chainId,
    verifyingContract,
  };
}

export function buildSeaportStyleOrder(
  input: Omit<SeaportStyleOrder, "offerer" | "salt"> & {
    offerer: string;
    salt: string;
  },
): SeaportStyleOrder {
  if (input.itemType === 0 && input.amount !== BigInt(1)) {
    throw new Error("ERC-721 orders must have amount = 1");
  }
  if (input.itemType === 1 && input.amount <= BigInt(0)) {
    throw new Error("ERC-1155 orders must have amount > 0");
  }
  if (input.price <= BigInt(0)) throw new Error("Order price must be greater than zero");
  if (input.expiration <= BigInt(Math.floor(Date.now() / 1000))) {
    throw new Error("Order expiration must be in the future");
  }

  return {
    ...input,
    tokenId: BigInt(input.tokenId),
    amount: BigInt(input.amount),
    price: BigInt(input.price),
    expiration: BigInt(input.expiration),
    nonce: BigInt(input.nonce),
  };
}

/**
 * Signs an order with the connected browser wallet. No transaction is sent here.
 * The caller should request NFT approval separately before a buyer executes it.
 */
export async function signSeaportStyleOrder(
  provider: BrowserProvider,
  order: SeaportStyleOrder,
  chainId: bigint | number,
  marketplaceAddress: string,
): Promise<{ order: SeaportStyleOrder; signature: string; signer: string }> {
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  if (signerAddress.toLowerCase() !== order.offerer.toLowerCase()) {
    throw new Error("Connected wallet does not match order.offerer");
  }

  const domain = buildSeaportStyleDomain(chainId, marketplaceAddress);
  const signature = await signer.signTypedData(domain, SEAPORT_STYLE_ORDER_TYPES, order);
  return { order, signature, signer: signerAddress };
}

/**
 * Verifies the same EIP-712 payload locally before publishing an order.
 */
export function recoverSeaportStyleOrderSigner(
  order: SeaportStyleOrder,
  signature: string,
  chainId: bigint | number,
  marketplaceAddress: string,
): string {
  return verifyTypedData(
    buildSeaportStyleDomain(chainId, marketplaceAddress),
    SEAPORT_STYLE_ORDER_TYPES,
    order,
    signature,
  );
}

/**
 * Optional helper for a buyer: approve ISC, then submit the signed payload.
 * This function deliberately does not broadcast; the UI must show the final
 * price, 10% commission, approval and Gas estimate before calling executeOrder.
 */
export async function buildExecuteOrderCall(
  provider: BrowserProvider,
  marketplaceAddress: string,
  order: SeaportStyleOrder,
  signature: string,
) {
  const signer = await provider.getSigner();
  const marketplace = new Contract(
    marketplaceAddress,
    [
      "function executeOrder((address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,bytes32 salt) order, bytes signature)",
    ],
    signer,
  );

  return {
    contract: marketplace,
    args: [order, signature] as const,
    // The caller may use contract.executeOrder(...). This helper only prepares
    // the call and never sends a transaction implicitly.
  };
}

/**
 * Deterministic offline example useful in tests and documentation.
 */
export async function signWithEphemeralWallet(
  privateKey: string,
  order: SeaportStyleOrder,
  chainId: bigint | number,
  marketplaceAddress: string,
) {
  const wallet = new Wallet(privateKey);
  const signature = await wallet.signTypedData(
    buildSeaportStyleDomain(chainId, marketplaceAddress),
    SEAPORT_STYLE_ORDER_TYPES,
    order,
  );
  return {
    signature,
    signer: wallet.address,
    recovered: recoverSeaportStyleOrderSigner(
      order,
      signature,
      chainId,
      marketplaceAddress,
    ),
    normalizedSignature: Signature.from(signature).serialized,
  };
}
