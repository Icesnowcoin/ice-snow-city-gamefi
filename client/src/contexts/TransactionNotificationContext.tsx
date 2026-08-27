import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  hash?: string;
  type: 'deposit' | 'withdrawal' | 'swap' | 'approve' | 'transfer';
  amount: string;
  currency: string;
  status: TransactionStatus;
  timestamp: number;
  fromAddress?: string;
  toAddress?: string;
  gasUsed?: string;
  gasFee?: string;
  blockNumber?: number;
  explorerUrl?: string;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  originalData?: Record<string, any>;
  onRetry?: () => Promise<void>;
}

export interface TransactionNotificationContextType {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'timestamp'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getRecentTransactions: (limit?: number) => Transaction[];
  retryTransaction: (id: string) => Promise<void>;
}

const TransactionNotificationContext = createContext<TransactionNotificationContextType | undefined>(
  undefined
);

export const TransactionNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      timestamp: Date.now(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    showTransactionToast(newTx, 'pending');
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
      )
    );

    const tx = transactions.find((t) => t.id === id);
    if (tx && updates.status && updates.status !== tx.status) {
      const updatedTx = { ...tx, ...updates };
      showTransactionToast(updatedTx, updates.status as TransactionStatus);
    }
  }, [transactions]);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  const getTransactionById = useCallback(
    (id: string) => transactions.find((tx) => tx.id === id),
    [transactions]
  );

  const getRecentTransactions = useCallback(
    (limit = 10) => transactions.slice(0, limit),
    [transactions]
  );

  const retryTransaction = useCallback(async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    const retryCount = (tx.retryCount || 0) + 1;
    const maxRetries = tx.maxRetries || 3;

    if (retryCount > maxRetries) {
      toast.error('Maximum retry attempts exceeded');
      return;
    }

    try {
      updateTransaction(id, {
        status: 'pending',
        retryCount,
        error: undefined,
      });

      if (tx.onRetry) {
        await tx.onRetry();
      }

      toast.success(`Retrying transaction (Attempt ${retryCount}/${maxRetries})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      updateTransaction(id, {
        status: 'failed',
        error: errorMessage,
      });
      toast.error(`Retry failed: ${errorMessage}`);
    }
  }, [transactions, updateTransaction]);

  const value: TransactionNotificationContextType = {
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearTransactions,
    getTransactionById,
    getRecentTransactions,
    retryTransaction,
  };

  return (
    <TransactionNotificationContext.Provider value={value}>
      {children}
    </TransactionNotificationContext.Provider>
  );
};

export const useTransactionNotification = (): TransactionNotificationContextType => {
  const context = useContext(TransactionNotificationContext);
  if (!context) {
    throw new Error(
      'useTransactionNotification must be used within TransactionNotificationProvider'
    );
  }
  return context;
};

function showTransactionToast(tx: Transaction, status: TransactionStatus) {
  const messages = {
    pending: {
      zh: `交易已提交: ${tx.type === 'deposit' ? '充值' : tx.type === 'withdrawal' ? '提取' : '交易'} ${tx.amount} ${tx.currency}`,
      en: `Transaction submitted: ${tx.type} ${tx.amount} ${tx.currency}`,
    },
    confirmed: {
      zh: `交易成功: ${tx.amount} ${tx.currency} ${tx.type === 'deposit' ? '充值' : tx.type === 'withdrawal' ? '提取' : '交易'}完成`,
      en: `Transaction confirmed: ${tx.type} ${tx.amount} ${tx.currency} completed`,
    },
    failed: {
      zh: `交易失败: ${tx.error || '未知错误'}`,
      en: `Transaction failed: ${tx.error || 'Unknown error'}`,
    },
    cancelled: {
      zh: `交易已取消`,
      en: `Transaction cancelled`,
    },
  };

  const message = messages[status];
  const lang = localStorage.getItem('language') || 'en';
  const text = lang === 'zh' ? message.zh : message.en;

  if (status === 'pending') {
    toast.loading(text, {
      id: tx.id,
      duration: Infinity,
    });
  } else if (status === 'confirmed') {
    toast.success(text, {
      id: tx.id,
      duration: 5000,
      action: tx.explorerUrl
        ? {
            label: lang === 'zh' ? '查看' : 'View',
            onClick: () => window.open(tx.explorerUrl, '_blank'),
          }
        : undefined,
    });
  } else if (status === 'failed') {
    toast.error(text, {
      id: tx.id,
      duration: 5000,
    });
  } else if (status === 'cancelled') {
    toast.info(text, {
      id: tx.id,
      duration: 3000,
    });
  }
}
