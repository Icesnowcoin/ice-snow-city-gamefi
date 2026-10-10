import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { SimulatedTradeRecord } from "@/lib/simulatedTradeHistory";

export interface SimulatedTradeNotification {
  id: string;
  eventKey: string;
  sequence: number;
  trade: SimulatedTradeRecord;
  read: boolean;
  receivedAt: number;
}

export interface BatchRetrySummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

type RetryHandler = (trades: SimulatedTradeRecord[], onProgress?: (processed: number, total: number) => void) => BatchRetrySummary | number | Promise<BatchRetrySummary | number>;

interface SimulatedTradeNotificationContextValue {
  notifications: SimulatedTradeNotification[];
  unreadCount: number;
  recordNotification: (trade: SimulatedTradeRecord, sequence: number) => void;
  markAsRead: (eventKey: string) => void;
  markAllAsRead: () => void;
  clearRead: () => void;
  registerRetryHandler: (handler: (trades: SimulatedTradeRecord[], onProgress?: (processed: number, total: number) => void) => BatchRetrySummary | number | Promise<BatchRetrySummary | number>) => () => void;
  retryAllFailed: (onProgress?: (processed: number, total: number) => void) => Promise<BatchRetrySummary>;
}

const SimulatedTradeNotificationContext = createContext<SimulatedTradeNotificationContextValue | undefined>(undefined);

export function SimulatedTradeNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SimulatedTradeNotification[]>([]);
  const [retryHandler, setRetryHandler] = useState<RetryHandler | null>(null);

  const recordNotification = useCallback((trade: SimulatedTradeRecord, sequence: number) => {
    const eventKey = `${trade.id}:${sequence}`;
    setNotifications((current) => {
      if (current.some((item) => item.eventKey === eventKey)) return current;
      return [
        {
          id: `${eventKey}:${trade.status}`,
          eventKey,
          sequence,
          trade,
          read: false,
          receivedAt: Date.now(),
        },
        ...current,
      ].slice(0, 100);
    });
  }, []);

  const markAsRead = useCallback((eventKey: string) => {
    setNotifications((current) => current.map((item) => item.eventKey === eventKey ? { ...item, read: true } : item));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const clearRead = useCallback(() => {
    setNotifications((current) => current.filter((item) => !item.read));
  }, []);

  const registerRetryHandler = useCallback((handler: RetryHandler) => {
    setRetryHandler(() => handler);
    return () => setRetryHandler((current: RetryHandler | null) => current === handler ? null : current);
  }, []);

  const retryAllFailed = useCallback(async (onProgress?: (processed: number, total: number) => void): Promise<BatchRetrySummary> => {
    const latestFailed = new Map<string, SimulatedTradeRecord>();
    notifications.filter((item) => item.trade.status === "FAILED").forEach((item) => latestFailed.set(item.trade.id, item.trade));
    const trades = Array.from(latestFailed.values());
    if (!retryHandler) return { total: trades.length, success: 0, failed: 0, skipped: trades.length };
    const result = await retryHandler(trades, onProgress);
    if (typeof result === "number") return { total: trades.length, success: result, failed: 0, skipped: Math.max(0, trades.length - result) };
    return result;
  }, [notifications, retryHandler]);

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    recordNotification,
    markAsRead,
    markAllAsRead,
    clearRead,
    registerRetryHandler,
    retryAllFailed,
  }), [clearRead, markAllAsRead, markAsRead, notifications, recordNotification, registerRetryHandler, retryAllFailed]);

  return <SimulatedTradeNotificationContext.Provider value={value}>{children}</SimulatedTradeNotificationContext.Provider>;
}

export function useSimulatedTradeNotifications() {
  const context = useContext(SimulatedTradeNotificationContext);
  if (!context) throw new Error("useSimulatedTradeNotifications must be used within SimulatedTradeNotificationProvider");
  return context;
}

export function useOptionalSimulatedTradeNotifications() {
  return useContext(SimulatedTradeNotificationContext);
}
