import { describe, expect, it } from "vitest";
import { generateSimulatedTrades, summarizeSimulatedTrades, toMicros } from "./simulatedTradeStress";

describe("simulatedTradeStress", () => {
  it("generates a deterministic 1000-order local dataset", () => {
    const trades = generateSimulatedTrades(1200);
    expect(trades).toHaveLength(1200);
    expect(trades[0]).toMatchObject({ id: "stress-trade-00001", network: "local-hardhat", kind: "SELL" });
    expect(trades[1]).toMatchObject({ id: "stress-trade-00002", kind: "BUY_OFFER" });
    expect(new Set(trades.map((trade) => trade.id)).size).toBe(1200);
  });

  it("aggregates completed fees with integer micro-ISC arithmetic", () => {
    const trades = generateSimulatedTrades(1200);
    const summary = summarizeSimulatedTrades(trades);
    expect(summary.orderCount).toBe(1200);
    expect(summary.completedCount + summary.pendingCount + summary.cancelledCount).toBe(1200);
    expect(summary.totalFeeMicros).toBe(summary.treasuryMicros + summary.marketingMicros + summary.remainderMicros);
    expect(summary.remainderMicros).toBe(0n);
    expect(summary.treasuryMicros * 10_000n).toBe(summary.totalFeeMicros * 6000n);
    expect(summary.marketingMicros * 10_000n).toBe(summary.totalFeeMicros * 4000n);
  });

  it("rejects precision beyond six decimal places", () => {
    expect(toMicros("1.123456")).toBe(1_123_456n);
    expect(() => toMicros("1.1234567")).toThrow("Invalid ISC amount");
  });
});
