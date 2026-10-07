export type TransferKind = "ERC721" | "ERC1155";

export interface NftTransferEvent {
  kind: TransferKind;
  chainId: number;
  blockNumber: bigint;
  nftContract: string;
  from: string;
  to: string;
  tokenId: bigint;
  amount: bigint;
}

export interface NftHoldingKey {
  walletAddress: string;
  chainId: number;
  nftContract: string;
  tokenId: string;
}

export interface NftHoldingDelta extends NftHoldingKey {
  amount: bigint;
  lastSyncedBlock: bigint;
}

import { findVerifiedNftContract } from "./nftContractRegistry";

export function reduceTransferToDeltas(event: NftTransferEvent): NftHoldingDelta[] {
  if (event.chainId <= 0 || event.blockNumber < BigInt(0) || event.tokenId < BigInt(0) || event.amount <= BigInt(0)) throw new Error("NFT Transfer 事件参数无效");
  const contract = event.nftContract.toLowerCase();
  const from = event.from.toLowerCase();
  const to = event.to.toLowerCase();
  const tokenId = event.tokenId.toString();
  const amount = event.kind === "ERC721" ? BigInt(1) : event.amount;
  const deltas: NftHoldingDelta[] = [];
  if (from !== "0x0000000000000000000000000000000000000000") deltas.push({ walletAddress: from, chainId: event.chainId, nftContract: contract, tokenId, amount: -amount, lastSyncedBlock: event.blockNumber });
  if (to !== "0x0000000000000000000000000000000000000000") deltas.push({ walletAddress: to, chainId: event.chainId, nftContract: contract, tokenId, amount, lastSyncedBlock: event.blockNumber });
  return deltas;
}

export function reduceVerifiedTransferToDeltas(event: NftTransferEvent): NftHoldingDelta[] {
  if (!findVerifiedNftContract(event.chainId, event.nftContract)) throw new Error("NFT 合约未登记或未通过验证，拒绝生成持仓增量");
  return reduceTransferToDeltas(event);
}
