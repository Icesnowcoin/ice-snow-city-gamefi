import { describe, expect, it } from "vitest";
import { reduceTransferToDeltas } from "./nftHoldingsIndexer";

const ZERO = "0x0000000000000000000000000000000000000000";
const ALICE = "0x00000000000000000000000000000000000000aa";
const BOB = "0x00000000000000000000000000000000000000bb";
const NFT = "0x00000000000000000000000000000000000000cc";

describe("nft holdings indexer", () => {
  it("creates a positive delta for mint and a negative/positive pair for transfer", () => {
    expect(reduceTransferToDeltas({ kind: "ERC721", chainId: 97, blockNumber: BigInt(10), nftContract: NFT, from: ZERO, to: ALICE, tokenId: BigInt(4), amount: BigInt(99) })).toEqual([{ walletAddress: ALICE, chainId: 97, nftContract: NFT, tokenId: "4", amount: BigInt(1), lastSyncedBlock: BigInt(10) }]);
    expect(reduceTransferToDeltas({ kind: "ERC1155", chainId: 97, blockNumber: BigInt(11), nftContract: NFT, from: ALICE, to: BOB, tokenId: BigInt(4), amount: BigInt(3) })).toHaveLength(2);
  });

  it("does not create a delta for the zero address on burn and rejects invalid events", () => {
    expect(reduceTransferToDeltas({ kind: "ERC721", chainId: 97, blockNumber: BigInt(12), nftContract: NFT, from: ALICE, to: ZERO, tokenId: BigInt(4), amount: BigInt(1) })).toEqual([{ walletAddress: ALICE, chainId: 97, nftContract: NFT, tokenId: "4", amount: BigInt(-1), lastSyncedBlock: BigInt(12) }]);
    expect(() => reduceTransferToDeltas({ kind: "ERC1155", chainId: 97, blockNumber: BigInt(12), nftContract: NFT, from: ALICE, to: BOB, tokenId: BigInt(4), amount: BigInt(0) })).toThrow();
  });
});
