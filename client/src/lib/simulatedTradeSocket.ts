import { useEffect, useRef, useState } from "react";
import type { SimulatedTradeRecord, SimulatedTradeStatus } from "@/lib/simulatedTradeHistory";

export type SimulatedTradeSocketState = "CLOSED" | "CONNECTING" | "OPEN" | "RECONNECTING";
export type SimulatedTradeSocketErrorCode = "DISCONNECTED" | "RECONNECT_EXHAUSTED" | "INVALID_STREAM" | "INVALID_EVENT";

export interface SimulatedTradeSocketError {
  code: SimulatedTradeSocketErrorCode;
  message: string;
  retryable: boolean;
}

export interface SimulatedTradeStatusEvent {
  type: "trade.status";
  stream: "local-hardhat";
  eventId: string;
  sequence: number;
  emittedAt: string;
  tradeId: string;
  status: SimulatedTradeStatus;
  txHash?: string;
}

export type SimulatedTradeSocketListener = (event: SimulatedTradeStatusEvent) => void;
export type SimulatedTradeSocketStateListener = (state: SimulatedTradeSocketState, error?: SimulatedTradeSocketError) => void;

export interface SimulatedTradeSocket {
  readonly state: SimulatedTradeSocketState;
  connect(): void;
  close(): void;
  reconnect(): void;
  subscribe(listener: SimulatedTradeSocketListener): () => void;
  subscribeState?(listener: SimulatedTradeSocketStateListener): () => void;
  publish(event: SimulatedTradeStatusEvent): void;
  disconnect?(message?: string): void;
  fail?(message?: string): void;
}

export interface SimulatedTradePollingSource {
  fetchSince(sequence: number): Promise<readonly SimulatedTradeStatusEvent[]> | readonly SimulatedTradeStatusEvent[];
}

class InMemorySimulatedTradeSocket implements SimulatedTradeSocket {
  state: SimulatedTradeSocketState = "CLOSED";
  private readonly listeners = new Set<SimulatedTradeSocketListener>();
  private readonly stateListeners = new Set<SimulatedTradeSocketStateListener>();

  private setState(state: SimulatedTradeSocketState, error?: SimulatedTradeSocketError) {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state, error));
  }

  connect() {
    this.setState("OPEN");
  }

  close() {
    this.setState("CLOSED");
  }

  reconnect() {
    this.setState("RECONNECTING");
    this.setState("OPEN");
  }

  disconnect(message = "模拟连接已断开") {
    this.setState("RECONNECTING", { code: "DISCONNECTED", message, retryable: true });
  }

  fail(message = "模拟连接发生错误") {
    this.setState("RECONNECTING", { code: "DISCONNECTED", message, retryable: true });
  }

  subscribe(listener: SimulatedTradeSocketListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeState(listener: SimulatedTradeSocketStateListener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  publish(event: SimulatedTradeStatusEvent) {
    if (event.stream !== "local-hardhat") {
      this.setState(this.state, { code: "INVALID_STREAM", message: "仅允许 local-hardhat 模拟流", retryable: false });
      return;
    }
    if (this.state !== "OPEN") return;
    this.listeners.forEach((listener) => listener(event));
  }
}

export function createSimulatedTradeSocket(): SimulatedTradeSocket {
  return new InMemorySimulatedTradeSocket();
}

class PollingSimulatedTradeSocket implements SimulatedTradeSocket {
  state: SimulatedTradeSocketState = "CLOSED";
  private readonly listeners = new Set<SimulatedTradeSocketListener>();
  private readonly stateListeners = new Set<SimulatedTradeSocketStateListener>();
  private timer: number | undefined;
  private disposed = false;
  private cursor = 0;

  constructor(
    private readonly source: SimulatedTradePollingSource,
    private readonly intervalMs: number,
  ) {
    if (!Number.isFinite(intervalMs) || intervalMs < 0) {
      throw new Error("intervalMs must be non-negative");
    }
  }

  private setState(state: SimulatedTradeSocketState, error?: SimulatedTradeSocketError) {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state, error));
  }

  connect() {
    if (this.disposed || this.state === "OPEN" || this.state === "CONNECTING") return;
    this.setState("CONNECTING");
    void this.pollOnce();
  }

  close() {
    this.disposed = true;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
    this.setState("CLOSED");
  }

  reconnect() {
    if (this.disposed) return;
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
    this.setState("RECONNECTING");
    this.connect();
  }

  subscribe(listener: SimulatedTradeSocketListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeState(listener: SimulatedTradeSocketStateListener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  publish(event: SimulatedTradeStatusEvent) {
    if (event.stream !== "local-hardhat") {
      this.setState(this.state, { code: "INVALID_STREAM", message: "仅允许 local-hardhat 模拟流", retryable: false });
      return;
    }
    if (event.sequence <= this.cursor || this.state !== "OPEN") return;
    this.cursor = event.sequence;
    this.listeners.forEach((listener) => listener(event));
  }

  private scheduleNextPoll() {
    if (this.disposed || this.state !== "OPEN") return;
    this.timer = window.setTimeout(() => void this.pollOnce(), this.intervalMs);
  }

  private async pollOnce() {
    if (this.disposed) return;
    try {
      const events = await this.source.fetchSince(this.cursor);
      if (this.disposed) return;
      this.setState("OPEN");
      const sorted = [...events].sort((a, b) => a.sequence - b.sequence);
      for (const event of sorted) this.publish(event);
      this.scheduleNextPoll();
    } catch (error) {
      if (this.disposed) return;
      const message = error instanceof Error ? error.message : "模拟轮询失败";
      this.setState("RECONNECTING", { code: "DISCONNECTED", message, retryable: true });
    }
  }
}

export function createSimulatedTradePollingSocket(
  source: SimulatedTradePollingSource,
  intervalMs = 900,
): SimulatedTradeSocket {
  return new PollingSimulatedTradeSocket(source, intervalMs);
}

export function applySimulatedTradeStatusEvent(
  trades: readonly SimulatedTradeRecord[],
  event: SimulatedTradeStatusEvent,
  lastSequence: number,
): { trades: SimulatedTradeRecord[]; lastSequence: number; applied: boolean } {
  if (event.stream !== "local-hardhat" || event.sequence <= lastSequence) {
    return { trades: [...trades], lastSequence, applied: false };
  }

  let changed = false;
  const nextTrades = trades.map((trade) => {
    if (trade.id !== event.tradeId || trade.status === event.status) return trade;
    changed = true;
    return { ...trade, status: event.status, txHash: event.txHash ?? trade.txHash };
  });

  return { trades: nextTrades, lastSequence: event.sequence, applied: changed };
}

export interface UseSimulatedTradeSocketOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
}

export function useSimulatedTradeSocket(
  socket: SimulatedTradeSocket | undefined,
  initialTrades: readonly SimulatedTradeRecord[],
  options: UseSimulatedTradeSocketOptions = {},
): {
  trades: SimulatedTradeRecord[];
  connectionState: SimulatedTradeSocketState;
  lastSequence: number;
  lastEventTradeId: string | null;
  lastError: SimulatedTradeSocketError | null;
  reconnectAttempt: number;
} {
  const { autoReconnect = true, maxReconnectAttempts = 3, reconnectBaseDelayMs = 250 } = options;
  const [trades, setTrades] = useState(() => [...initialTrades]);
  const [connectionState, setConnectionState] = useState<SimulatedTradeSocketState>(() => (socket ? "CONNECTING" : "CLOSED"));
  const [lastEventTradeId, setLastEventTradeId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<SimulatedTradeSocketError | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const lastSequenceRef = useRef(0);
  const tradesRef = useRef(trades);
  const reconnectTimerRef = useRef<number | undefined>(undefined);
  const reconnectAttemptRef = useRef(0);
  tradesRef.current = trades;

  useEffect(() => {
    if (!socket) {
      setConnectionState("CLOSED");
      return;
    }

    let disposed = false;
    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== undefined) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = undefined;
      }
    };
    const scheduleReconnect = () => {
      if (!autoReconnect || disposed || reconnectAttemptRef.current >= maxReconnectAttempts) {
        if (reconnectAttemptRef.current >= maxReconnectAttempts) {
          const error: SimulatedTradeSocketError = { code: "RECONNECT_EXHAUSTED", message: "模拟连接重试次数已用尽", retryable: false };
          setLastError(error);
          setConnectionState("CLOSED");
        }
        return;
      }
      reconnectAttemptRef.current += 1;
      setReconnectAttempt(reconnectAttemptRef.current);
      const delay = reconnectBaseDelayMs * 2 ** (reconnectAttemptRef.current - 1);
      reconnectTimerRef.current = window.setTimeout(() => {
        if (!disposed) socket.reconnect();
      }, delay);
    };

    socket.connect();
    setConnectionState(socket.state === "CLOSED" ? "CONNECTING" : socket.state);
    const unsubscribe = socket.subscribe((event) => {
      const result = applySimulatedTradeStatusEvent(tradesRef.current, event, lastSequenceRef.current);
      if (result.applied) {
        setTrades(result.trades);
        setLastEventTradeId(event.tradeId);
      }
      lastSequenceRef.current = result.lastSequence;
    });
    const unsubscribeState = socket.subscribeState?.((state, error) => {
      if (disposed) return;
      setConnectionState(state);
      if (error) setLastError(error);
      if (state === "OPEN") {
        clearReconnectTimer();
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
      } else if (state === "RECONNECTING") {
        scheduleReconnect();
      }
    });

    return () => {
      disposed = true;
      clearReconnectTimer();
      unsubscribe();
      unsubscribeState?.();
      socket.close();
      setConnectionState("CLOSED");
    };
  }, [autoReconnect, maxReconnectAttempts, reconnectBaseDelayMs, socket]);

  return { trades, connectionState, lastSequence: lastSequenceRef.current, lastEventTradeId, lastError, reconnectAttempt };
}

export function createSimulatedStatusEvent(
  tradeId: string,
  sequence: number,
  status: SimulatedTradeStatus,
  txHash?: string,
): SimulatedTradeStatusEvent {
  return {
    type: "trade.status",
    stream: "local-hardhat",
    eventId: `local-hardhat:${tradeId}:${sequence}`,
    sequence,
    emittedAt: new Date(0).toISOString(),
    tradeId,
    status,
    ...(txHash ? { txHash } : {}),
  };
}

export function startSimulatedTradeStream(
  socket: SimulatedTradeSocket,
  events: readonly SimulatedTradeStatusEvent[],
  intervalMs = 900,
): () => void {
  if (intervalMs < 0 || !Number.isFinite(intervalMs)) throw new Error("intervalMs must be non-negative");
  socket.connect();
  let cursor = 0;
  let timer: number | undefined;
  const publishNext = () => {
    if (cursor >= events.length) return;
    socket.publish(events[cursor]);
    cursor += 1;
    if (cursor < events.length) timer = window.setTimeout(publishNext, intervalMs);
  };
  publishNext();
  return () => {
    if (timer !== undefined) window.clearTimeout(timer);
    socket.close();
  };
}
