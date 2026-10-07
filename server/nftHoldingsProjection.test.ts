import { describe, expect, it } from "vitest";
import { applyTransferEvent, createProjectionState, listProjectedHoldings } from "./nftHoldingsProjection";

const zero = "0x0000000000000000000000000000000000000000";
const alice = "0x00000000000000000000000000000000000000a1";
const bob = "0x00000000000000000000000000000000000000b2";
const nft = "0x00000000000000000000000000000000000000c3";

const event = (eventId: string, from: string, to: string, blockNumber: bigint, amount = BigInt(1)) => ({
  eventId,
  kind: "ERC721" as const,
  chainId: 97,
  blockNumber,
  nftContract: nft,
  from,
  to,
  tokenId: BigInt(7),
  amount,
});

describe("nft holdings projection", () => {
  it("deduplicates the same event and advances the sync checkpoint", () => {
    const minted = applyTransferEvent(createProjectionState(), event("tx-1:0", zero, alice, BigInt(10)));
    const repeated = applyTransferEvent(minted, event("tx-1:0", zero, alice, BigInt(10)));
    expect(repeated.lastSyncedBlock).toBe(BigInt(10));
    expect(listProjectedHoldings(repeated)[0].amount).toBe(BigInt(1));
  });

  it("moves ownership without leaving the previous owner balance", () => {
    let state = applyTransferEvent(createProjectionState(), event("tx-1:0", zero, alice, BigInt(10)));
    state = applyTransferEvent(state, event("tx-2:0", alice, bob, BigInt(12)));
    const holdings = listProjectedHoldings(state);
    expect(holdings).toHaveLength(1);
    expect(holdings[0]).toMatchObject({ walletAddress: bob, tokenId: "7" });
  });

  it("rejects a transfer that would create a negative holding", () => {
    expect(() => applyTransferEvent(createProjectionState(), event("tx-invalid:0", alice, bob, BigInt(3)))).toThrow("不能为负数");
  });
});
