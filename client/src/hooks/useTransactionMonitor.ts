import { useEffect, useRef } from 'react';
import { useTransactionNotification, Transaction } from '@/contexts/TransactionNotificationContext';
import { trpc } from '@/lib/trpc';

export interface TransactionMonitorOptions {
  pollInterval?: number; // milliseconds
  maxRetries?: number;
  autoRemoveAfter?: number; // milliseconds
}

const DEFAULT_OPTIONS: TransactionMonitorOptions = {
  pollInterval: 5000, // 5 seconds
  maxRetries: 60, // 5 minutes with 5s interval
  autoRemoveAfter: 3600000, // 1 hour
};

/**
 * Hook for monitoring transaction status and updating notifications
 */
export function useTransactionMonitor(options: TransactionMonitorOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { transactions, updateTransaction, removeTransaction } = useTransactionNotification();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<Record<string, number>>({});

  // Note: Transaction polling is handled by the effect below
  // In production, integrate with real blockchain RPC or backend API

  // Poll pending transactions
  useEffect(() => {
    const pollTransactions = async () => {
      const pendingTxs = transactions.filter((tx) => tx.status === 'pending');

      for (const tx of pendingTxs) {
        if (!tx.hash) continue;

        const retryCount = retryCountRef.current[tx.id] || 0;

        // Check if max retries exceeded
        if (retryCount >= mergedOptions.maxRetries!) {
          updateTransaction(tx.id, {
            status: 'failed',
            error: 'Transaction timeout - no confirmation after maximum retries',
          });
          delete retryCountRef.current[tx.id];
          continue;
        }

        // Increment retry count
        retryCountRef.current[tx.id] = retryCount + 1;

        try {
          // Simulate checking transaction status
          // In production, this would call a real API
          const isConfirmed = Math.random() > 0.8; // 20% chance to confirm

          if (isConfirmed) {
            updateTransaction(tx.id, {
              status: 'confirmed',
              blockNumber: Math.floor(Math.random() * 1000000),
            });
            delete retryCountRef.current[tx.id];
          }
        } catch (error) {
          console.error(`Error polling transaction ${tx.id}:`, error);
        }
      }
    };

    if (transactions.some((tx) => tx.status === 'pending')) {
      pollIntervalRef.current = setInterval(pollTransactions, mergedOptions.pollInterval);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [transactions, updateTransaction, mergedOptions]);

  // Auto-remove old transactions
  useEffect(() => {
    const now = Date.now();
    const oldTxs = transactions.filter(
      (tx) => now - tx.timestamp > mergedOptions.autoRemoveAfter!
    );

    oldTxs.forEach((tx) => {
      removeTransaction(tx.id);
    });
  }, [transactions, removeTransaction, mergedOptions.autoRemoveAfter]);

  return {
    pendingCount: transactions.filter((tx) => tx.status === 'pending').length,
    confirmedCount: transactions.filter((tx) => tx.status === 'confirmed').length,
    failedCount: transactions.filter((tx) => tx.status === 'failed').length,
  };
}
