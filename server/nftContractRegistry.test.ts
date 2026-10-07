import { describe, expect, it, beforeEach } from "vitest";
import { clearRegistryForTests, findVerifiedNftContract, registerVerifiedNftContract } from "./nftContractRegistry";

describe("nft contract registry", () => {
  beforeEach(() => clearRegistryForTests());
  it("only returns explicitly registered contracts", () => {
    const address = "0x0000000000000000000000000000000000000001";
    expect(findVerifiedNftContract(97, address)).toBeNull();
    registerVerifiedNftContract({ chainId: 97, address, standard: "erc721", startBlock: BigInt(1), verifiedAt: "2026-08-27T00:00:00.000Z" });
    expect(findVerifiedNftContract(97, address)?.standard).toBe("erc721");
    expect(findVerifiedNftContract(56, address)).toBeNull();
  });
  it("does not duplicate the same chain and address", () => {
    const address = "0x0000000000000000000000000000000000000002";
    const config = { chainId: 97, address, standard: "erc1155" as const, startBlock: BigInt(5), verifiedAt: "2026-08-27T00:00:00.000Z" };
    registerVerifiedNftContract(config);
    registerVerifiedNftContract(config);
    expect(findVerifiedNftContract(97, address)?.standard).toBe("erc1155");
  });
});
