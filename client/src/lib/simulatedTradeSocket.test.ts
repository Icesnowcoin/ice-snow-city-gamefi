import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applySimulatedTradeStatusEvent,
  createSimulatedStatusEvent,
  createSimulatedTradePollingSocket,
  createSimulatedTradeSocket,
  startSimulatedTradeStream,
} from "@/lib/simulatedTradeSocket";
import { calculateSimulatedFeeAllocation, SIMULATED_TRADE_HISTORY } from "@/lib/simulatedTradeHistory";

describe("simulatedTradeSocket", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it("only publishes while connected to the local-hardhat stream", () => {
    const socket = createSimulatedTradeSocket();
    const received: string[] = [];
    socket.subscribe((event) => received.push(event.eventId));
    const event = createSimulatedStatusEvent("sim-trade-004", 1, "COMPLETED");

    socket.publish(event);
    expect(received).toEqual([]);
    socket.connect();
    socket.publish(event);
    expect(received).toEqual([event.eventId]);
    socket.close();
    socket.publish(createSimulatedStatusEvent("sim-trade-004", 2, "CANCELLED"));
    expect(received).toHaveLength(1);
  });

  it("applies newer events once and ignores duplicates or out-of-order events", () => {
    const pending = SIMULATED_TRADE_HISTORY.find((trade) => trade.id === "sim-trade-004");
    if (!pending) throw new Error("fixture missing");
    const completed = createSimulatedStatusEvent(pending.id, 2, "COMPLETED", "0xlocalcompleted");

    const first = applySimulatedTradeStatusEvent(SIMULATED_TRADE_HISTORY, completed, 0);
    expect(first.applied).toBe(true);
    expect(first.lastSequence).toBe(2);
    expect(first.trades.find((trade) => trade.id === pending.id)?.status).toBe("COMPLETED");

    const duplicate = applySimulatedTradeStatusEvent(first.trades, completed, first.lastSequence);
    expect(duplicate.applied).toBe(false);
    expect(duplicate.lastSequence).toBe(2);

    const older = applySimulatedTradeStatusEvent(first.trades, createSimulatedStatusEvent(pending.id, 1, "CANCELLED"), 2);
    expect(older.applied).toBe(false);
    expect(older.trades.find((trade) => trade.id === pending.id)?.status).toBe("COMPLETED");
  });

  it("publishes scripted events in order and stops cleanly", () => {
    const socket = createSimulatedTradeSocket();
    const received: string[] = [];
    socket.subscribe((event) => received.push(event.tradeId + ":" + event.status));
    const stop = startSimulatedTradeStream(socket, [
      createSimulatedStatusEvent("sim-trade-004", 1, "COMPLETED"),
      createSimulatedStatusEvent("sim-trade-001", 2, "CANCELLED"),
    ], 100);
    expect(received).toEqual(["sim-trade-004:COMPLETED"]);
    vi.advanceTimersByTime(100);
    expect(received).toEqual(["sim-trade-004:COMPLETED", "sim-trade-001:CANCELLED"]);
    stop();
    vi.advanceTimersByTime(500);
    expect(socket.state).toBe("CLOSED");
    expect(received).toHaveLength(2);
  });

  it("polls ordered events through the same replaceable transport contract", async () => {
    const first = createSimulatedStatusEvent("sim-trade-004", 2, "COMPLETED");
    const second = createSimulatedStatusEvent("sim-trade-001", 3, "CANCELLED");
    const fetchSince = vi.fn().mockResolvedValueOnce([second, first]).mockResolvedValueOnce([]);
    const socket = createSimulatedTradePollingSocket({ fetchSince }, 100);
    const received: string[] = [];
    const states: string[] = [];
    socket.subscribe((event) => received.push(`${event.sequence}:${event.tradeId}`));
    socket.subscribeState?.((state) => states.push(state));

    socket.connect();
    await Promise.resolve();
    await Promise.resolve();
    expect(received).toEqual(["2:sim-trade-004", "3:sim-trade-001"]);
    expect(socket.state).toBe("OPEN");
    expect(states).toContain("CONNECTING");
    expect(states).toContain("OPEN");
    vi.advanceTimersByTime(100);
    await Promise.resolve();
    expect(fetchSince).toHaveBeenCalledWith(3);
    socket.close();
    vi.advanceTimersByTime(500);
    expect(socket.state).toBe("CLOSED");
  });

  it("surfaces polling failures as retryable reconnect state", async () => {
    const fetchSince = vi.fn().mockRejectedValue(new Error("模拟轮询失败"));
    const socket = createSimulatedTradePollingSocket({ fetchSince }, 100);
    const errors: string[] = [];
    socket.subscribeState?.((_state, error) => {
      if (error) errors.push(`${error.code}:${error.message}`);
    });

    socket.connect();
    await Promise.resolve();
    await Promise.resolve();
    expect(socket.state).toBe("RECONNECTING");
    expect(errors).toEqual(["DISCONNECTED:模拟轮询失败"]);
    socket.close();
  });

  it("keeps fee allocation exact after a streamed status update", () => {
    const result = applySimulatedTradeStatusEvent(
      SIMULATED_TRADE_HISTORY,
      createSimulatedStatusEvent("sim-trade-004", 4, "COMPLETED"),
      0,
    );
    const totalFee = result.trades
      .filter((trade) => trade.status === "COMPLETED")
      .reduce((sum, trade) => sum + BigInt(trade.feeIsc.replace(".", "")), 0n);
    const allocation = calculateSimulatedFeeAllocation((Number(totalFee) / 1_000_000).toFixed(6));
    expect(Number(allocation.treasuryIsc) + Number(allocation.marketingIsc)).toBe(Number(allocation.totalFeeIsc));
  });

  it("rejects events from another stream and preserves all trades", () => {
    const foreign = { ...createSimulatedStatusEvent("sim-trade-004", 3, "FAILED"), stream: "mainnet" as const };
    const result = applySimulatedTradeStatusEvent(SIMULATED_TRADE_HISTORY, foreign, 0);
    expect(result.applied).toBe(false);
    expect(result.lastSequence).toBe(0);
    expect(result.trades).toEqual(SIMULATED_TRADE_HISTORY);
  });
});
