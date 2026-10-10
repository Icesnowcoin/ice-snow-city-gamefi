import { describe, expect, it } from "vitest";
import { ethers } from "ethers";
import {
  DRAFT_MARKETPLACE_DOMAIN_NAME,
  DRAFT_MARKETPLACE_DOMAIN_VERSION,
  SIMULATED_CHAIN_ID,
  assertSimulationNetwork,
  buildDraftDomain,
} from "./iscMarketplaceDraft";

describe("iscMarketplaceDraft", () => {
  it("builds the exact EIP-712 domain used by the Draft contract", () => {
    const verifyingContract = "0x0000000000000000000000000000000000000001";
    expect(buildDraftDomain(SIMULATED_CHAIN_ID, verifyingContract)).toEqual({
      name: DRAFT_MARKETPLACE_DOMAIN_NAME,
      version: DRAFT_MARKETPLACE_DOMAIN_VERSION,
      chainId: SIMULATED_CHAIN_ID,
      verifyingContract,
    });
  });

  it("rejects non-local networks in simulation-only mode", () => {
    expect(() => assertSimulationNetwork(1)).toThrow(/expected 31337/);
    expect(() => assertSimulationNetwork(SIMULATED_CHAIN_ID)).not.toThrow();
    expect(() => assertSimulationNetwork(1, false)).not.toThrow();
  });

  it("normalizes numeric order fields before ethers submission", async () => {
    const wallet = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    const order = {
      offerer: wallet.address,
      nftContract: "0x0000000000000000000000000000000000000002",
      tokenId: 7n,
      amount: 1n,
      price: ethers.parseEther("1000"),
      expiration: BigInt(Math.floor(Date.now() / 1000) + 86400),
      nonce: 1n,
      itemType: 0,
      orderType: 0,
      salt: ethers.id("test"),
    };
    const domain = buildDraftDomain(SIMULATED_CHAIN_ID, "0x0000000000000000000000000000000000000003");
    const signature = await wallet.signTypedData(domain, {
      Order: [
        { name: "offerer", type: "address" }, { name: "nftContract", type: "address" }, { name: "tokenId", type: "uint256" },
        { name: "amount", type: "uint256" }, { name: "price", type: "uint256" }, { name: "expiration", type: "uint256" },
        { name: "nonce", type: "uint256" }, { name: "itemType", type: "uint8" }, { name: "orderType", type: "uint8" }, { name: "salt", type: "bytes32" },
      ],
    }, order);
    expect(ethers.verifyTypedData(domain, {
      Order: [
        { name: "offerer", type: "address" }, { name: "nftContract", type: "address" }, { name: "tokenId", type: "uint256" },
        { name: "amount", type: "uint256" }, { name: "price", type: "uint256" }, { name: "expiration", type: "uint256" },
        { name: "nonce", type: "uint256" }, { name: "itemType", type: "uint8" }, { name: "orderType", type: "uint8" }, { name: "salt", type: "bytes32" },
      ],
    }, order, signature)).toBe(wallet.address);
  });
});
