export type SimulatedTradeKind = "SELL" | "BUY_OFFER";
export type SimulatedTradeStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED";

export interface SimulatedTradeRecord {
  id: string;
  kind: SimulatedTradeKind;
  status: SimulatedTradeStatus;
  nftName: string;
  tokenId: string;
  priceIsc: string;
  feeIsc: string;
  txHash: string;
  createdAt: string;
  seller: string;
  buyer?: string;
  network: "local-hardhat";
}

export interface FeeAllocation {
  totalFeeIsc: string;
  treasuryIsc: string;
  marketingIsc: string;
  treasuryBps: 6000;
  marketingBps: 4000;
}

export function calculateSimulatedFeeAllocation(feeIsc: string): FeeAllocation {
  const fee = Number(feeIsc);
  if (!Number.isFinite(fee) || fee < 0) {
    throw new Error("Fee must be a non-negative finite number");
  }

  const treasury = (fee * 0.6).toFixed(6);
  const marketing = (fee * 0.4).toFixed(6);
  return {
    totalFeeIsc: fee.toFixed(6),
    treasuryIsc: treasury,
    marketingIsc: marketing,
    treasuryBps: 6000,
    marketingBps: 4000,
  };
}

export const SIMULATED_TRADE_HISTORY: readonly SimulatedTradeRecord[] = [
  {
    id: "sim-trade-001",
    kind: "SELL",
    status: "COMPLETED",
    nftName: "Aurora Business Plot",
    tokenId: "#1042",
    priceIsc: "125000.000000",
    feeIsc: "12500.000000",
    txHash: "0xsimulatedsell1042",
    createdAt: "2026-08-27T05:30:00.000Z",
    seller: "0x71C7...9A10",
    buyer: "0x90F1...42BC",
    network: "local-hardhat",
  },
  {
    id: "sim-trade-002",
    kind: "BUY_OFFER",
    status: "COMPLETED",
    nftName: "North Gate Tower",
    tokenId: "#2088",
    priceIsc: "80000.000000",
    feeIsc: "8000.000000",
    txHash: "0xsimulatedoffer2088",
    createdAt: "2026-08-27T04:10:00.000Z",
    seller: "0x3AA4...D018",
    buyer: "0x71C7...9A10",
    network: "local-hardhat",
  },
  {
    id: "sim-trade-003",
    kind: "SELL",
    status: "CANCELLED",
    nftName: "Winter Transit Hub",
    tokenId: "#3091",
    priceIsc: "45000.000000",
    feeIsc: "0.000000",
    txHash: "0xsimulatedcancel3091",
    createdAt: "2026-08-27T02:45:00.000Z",
    seller: "0x71C7...9A10",
    network: "local-hardhat",
  },
  {
    id: "sim-trade-004",
    kind: "BUY_OFFER",
    status: "PENDING",
    nftName: "Crystal Market Residence",
    tokenId: "#4017",
    priceIsc: "22000.000000",
    feeIsc: "2200.000000",
    txHash: "0xsimulatedpending4017",
    createdAt: "2026-08-27T01:20:00.000Z",
    seller: "0xB02A...CE88",
    buyer: "0x71C7...9A10",
    network: "local-hardhat",
  },
];

export function shortenHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

export function formatSimulatedIsc(amount: string): string {
  const value = Number(amount);
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : amount;
}
