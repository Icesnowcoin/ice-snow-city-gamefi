import type { NftHoldingKey, NftTransferEvent } from "./nftHoldingsIndexer";
import { reduceTransferToDeltas } from "./nftHoldingsIndexer";

export type IndexedNftTransferEvent = NftTransferEvent & {
  eventId: string;
};

export type HoldingProjection = NftHoldingKey & {
  amount: bigint;
  lastSyncedBlock: bigint;
};

export type ProjectionState = {
  holdings: Map<string, HoldingProjection>;
  processedEventIds: Set<string>;
  lastSyncedBlock: bigint;
};

export function createProjectionState(): ProjectionState {
  return { holdings: new Map(), processedEventIds: new Set(), lastSyncedBlock: BigInt(0) };
}

function keyOf(holding: NftHoldingKey): string {
  return `${holding.chainId}:${holding.walletAddress.toLowerCase()}:${holding.nftContract.toLowerCase()}:${holding.tokenId}`;
}

export function applyTransferEvent(state: ProjectionState, event: IndexedNftTransferEvent): ProjectionState {
  if (!event.eventId.trim()) throw new Error("NFT Transfer 事件缺少确定性 eventId");
  if (state.processedEventIds.has(event.eventId)) return state;

  const next: ProjectionState = {
    holdings: new Map(state.holdings),
    processedEventIds: new Set(state.processedEventIds).add(event.eventId),
    lastSyncedBlock: state.lastSyncedBlock > event.blockNumber ? state.lastSyncedBlock : event.blockNumber,
  };

  for (const delta of reduceTransferToDeltas(event)) {
    const key = keyOf(delta);
    const previous = next.holdings.get(key);
    const nextAmount = (previous?.amount ?? BigInt(0)) + delta.amount;
    if (nextAmount < BigInt(0)) throw new Error(`NFT 持仓不能为负数：${key}`);
    if (nextAmount === BigInt(0)) {
      next.holdings.delete(key);
    } else {
      next.holdings.set(key, {
        walletAddress: delta.walletAddress,
        chainId: delta.chainId,
        nftContract: delta.nftContract,
        tokenId: delta.tokenId,
        amount: nextAmount,
        lastSyncedBlock: delta.lastSyncedBlock,
      });
    }
  }
  return next;
}

export function listProjectedHoldings(state: ProjectionState): HoldingProjection[] {
  return Array.from(state.holdings.values()).sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
}
