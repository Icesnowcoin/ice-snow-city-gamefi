import { Wallet } from "ethers";
import { describe, expect, it } from "vitest";

import {
  buildSeaportStyleDomain,
  buildSeaportStyleOrder,
  recoverSeaportStyleOrderSigner,
  signWithEphemeralWallet,
} from "./seaportOrderSigning";

const MARKETPLACE = "0x0000000000000000000000000000000000000001";
const NFT = "0x0000000000000000000000000000000000000002";
const PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";
const SALT = "0x0000000000000000000000000000000000000000000000000000000000000001";

describe("Seaport-style EIP-712 order signing", () => {
  it("signs and locally recovers the seller address", async () => {
    const order = buildSeaportStyleOrder({
      offerer: new Wallet(PRIVATE_KEY).address,
      nftContract: NFT,
      tokenId: 7n,
      amount: 1n,
      price: 1_000_000n,
      expiration: BigInt(Math.floor(Date.now() / 1000) + 3600),
      nonce: 4n,
      itemType: 0,
      salt: SALT,
    });

    const walletResult = await signWithEphemeralWallet(PRIVATE_KEY, order, 56, MARKETPLACE);
    expect(walletResult.signature).toMatch(/^0x[0-9a-f]{130}$/i);
    expect(walletResult.recovered).toBe(walletResult.signer);
    expect(recoverSeaportStyleOrderSigner(order, walletResult.signature, 56, MARKETPLACE)).toBe(
      walletResult.signer,
    );
  });

  it("uses the contract's exact EIP-712 domain", () => {
    expect(buildSeaportStyleDomain(56, MARKETPLACE)).toEqual({
      name: "Ice Snow City Seaport Style Marketplace",
      version: "1",
      chainId: 56,
      verifyingContract: MARKETPLACE,
    });
  });

  it("rejects invalid item quantities", () => {
    const base = {
      offerer: "0x0000000000000000000000000000000000000003",
      nftContract: NFT,
      tokenId: 1n,
      price: 10n,
      expiration: BigInt(Math.floor(Date.now() / 1000) + 3600),
      nonce: 1n,
      salt: SALT,
    };

    expect(() => buildSeaportStyleOrder({ ...base, amount: 2n, itemType: 0 })).toThrow(
      "ERC-721 orders must have amount = 1",
    );
    expect(() => buildSeaportStyleOrder({ ...base, amount: 0n, itemType: 1 })).toThrow(
      "ERC-1155 orders must have amount > 0",
    );
  });
});
