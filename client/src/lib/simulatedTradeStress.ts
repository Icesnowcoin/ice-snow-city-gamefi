import type { SimulatedTradeRecord } from "./simulatedTradeHistory";

const MICRO_UNITS = BigInt("1000000");
const ZERO = BigInt("0");
const TEN = BigInt("10");
const BPS_TOTAL = BigInt("10000");
const TREASURY_BPS = BigInt("6000");
const MARKETING_BPS = BigInt("4000");

export interface SimulatedTradeStressSummary {
  orderCount: number;
  completedCount: number;
  pendingCount: number;
  cancelledCount: number;
  totalFeeMicros: bigint;
  treasuryMicros: bigint;
  marketingMicros: bigint;
  remainderMicros: bigint;
}

export function generateSimulatedTrades(count: number): SimulatedTradeRecord[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error("Trade count must be a non-negative integer");
  }

  return Array.from({ length: count }, (_, index) => {
    const kind = index % 2 === 0 ? "SELL" : "BUY_OFFER";
    const status = index % 11 === 0 ? "PENDING" : index % 17 === 0 ? "CANCELLED" : "COMPLETED";
    const priceMicros = BigInt("10000000000") + BigInt(index % 250) * BigInt("125000");
    const feeMicros = status === "CANCELLED" ? ZERO : priceMicros / TEN;
    return {
      id: `stress-trade-${String(index + 1).padStart(5, "0")}`,
      kind,
      status,
      nftName: `Stress District ${index % 12 + 1}`,
      tokenId: `#${5000 + index}`,
      priceIsc: formatMicros(priceMicros),
      feeIsc: formatMicros(feeMicros),
      txHash: `0xstress${String(index + 1).padStart(8, "0")}`,
      createdAt: new Date(Date.UTC(2026, 7, 27, 5, 0, index % 60)).toISOString(),
      seller: `0xSELL${String(index % 100).padStart(3, "0")}`,
      buyer: kind === "BUY_OFFER" ? `0xBUY${String(index % 100).padStart(3, "0")}` : `0xBUY${String((index + 1) % 100).padStart(3, "0")}`,
      network: "local-hardhat",
    };
  });
}

export function formatMicros(value: bigint): string {
  const whole = value / MICRO_UNITS;
  const fraction = (value % MICRO_UNITS).toString().padStart(6, "0");
  return `${whole}.${fraction}`;
}

export function toMicros(value: string): bigint {
  const [wholePart, fractionPart = ""] = value.trim().split(".");
  if (!/^\d+$/.test(wholePart) || !/^\d*$/.test(fractionPart) || fractionPart.length > 6) {
    throw new Error(`Invalid ISC amount: ${value}`);
  }
  return BigInt(wholePart) * MICRO_UNITS + BigInt(fractionPart.padEnd(6, "0") || "0");
}

export function summarizeSimulatedTrades(trades: readonly SimulatedTradeRecord[]): SimulatedTradeStressSummary {
  let totalFeeMicros = ZERO;
  let completedCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  for (const trade of trades) {
    if (trade.status === "COMPLETED") {
      completedCount += 1;
      totalFeeMicros += toMicros(trade.feeIsc);
    } else if (trade.status === "PENDING") {
      pendingCount += 1;
    } else if (trade.status === "CANCELLED") {
      cancelledCount += 1;
    }
  }

  const treasuryMicros = (totalFeeMicros * TREASURY_BPS) / BPS_TOTAL;
  const marketingMicros = (totalFeeMicros * MARKETING_BPS) / BPS_TOTAL;
  return {
    orderCount: trades.length,
    completedCount,
    pendingCount,
    cancelledCount,
    totalFeeMicros,
    treasuryMicros,
    marketingMicros,
    remainderMicros: totalFeeMicros - treasuryMicros - marketingMicros,
  };
}
