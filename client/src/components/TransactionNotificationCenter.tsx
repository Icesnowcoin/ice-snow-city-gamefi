import React, { useState } from 'react';
import { useTransactionNotification, Transaction } from '@/contexts/TransactionNotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  X,
  RotateCcw,
} from 'lucide-react';

const STATUS_ICONS = {
  pending: <Clock className="w-4 h-4 text-yellow-500 animate-spin" />,
  confirmed: <CheckCircle className="w-4 h-4 text-green-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  cancelled: <X className="w-4 h-4 text-gray-500" />,
};

const STATUS_COLORS = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  confirmed: 'bg-green-500/10 text-green-600 border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  cancelled: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const TYPE_LABELS = {
  deposit: { zh: '充值', en: 'Deposit' },
  withdrawal: { zh: '提取', en: 'Withdrawal' },
  swap: { zh: '交换', en: 'Swap' },
  approve: { zh: '授权', en: 'Approve' },
  transfer: { zh: '转账', en: 'Transfer' },
};

export const TransactionNotificationCenter: React.FC = () => {
  const { lang } = useLanguage();
  const { transactions, removeTransaction, clearTransactions, retryTransaction } = useTransactionNotification();
  const [open, setOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const pendingCount = transactions.filter((tx) => tx.status === 'pending').length;
  const confirmedCount = transactions.filter((tx) => tx.status === 'confirmed').length;
  const failedCount = transactions.filter((tx) => tx.status === 'failed').length;

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return lang === 'zh' ? '刚刚' : 'Just now';
    if (minutes < 60) return `${minutes}${lang === 'zh' ? '分钟前' : 'm ago'}`;
    if (hours < 24) return `${hours}${lang === 'zh' ? '小时前' : 'h ago'}`;
    return `${days}${lang === 'zh' ? '天前' : 'd ago'}`;
  };

  const renderTransaction = (tx: Transaction) => (
    <div
      key={tx.id}
      className={`p-3 rounded-lg border ${STATUS_COLORS[tx.status]} flex items-start justify-between gap-3`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5">{STATUS_ICONS[tx.status]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {TYPE_LABELS[tx.type][lang as 'zh' | 'en']}
            </span>
            <Badge variant="secondary" className="text-xs">
              {tx.amount} {tx.currency}
            </Badge>
          </div>
          <div className="text-xs opacity-75 truncate">
            {tx.hash && `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`}
          </div>
          <div className="text-xs opacity-60 mt-1">
            {formatTime(tx.timestamp)}
          </div>
          {tx.error && (
            <div className="text-xs mt-1 opacity-75">
              {lang === 'zh' ? '错误: ' : 'Error: '}
              {tx.error}
            </div>
          )}
          {tx.retryCount && (
            <div className="text-xs mt-1 opacity-60">
              {lang === 'zh' ? '重试次数: ' : 'Retry attempts: '}
              {tx.retryCount}/{tx.maxRetries || 3}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {tx.status === 'failed' && (
          <button
            onClick={async () => {
              setRetryingId(tx.id);
              try {
                await retryTransaction(tx.id);
              } finally {
                setRetryingId(null);
              }
            }}
            disabled={retryingId === tx.id}
            className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={lang === 'zh' ? '重试' : 'Retry'}
          >
            {retryingId === tx.id ? (
              <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </button>
        )}
        {tx.explorerUrl && (
          <button
            onClick={() => window.open(tx.explorerUrl, '_blank')}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title={lang === 'zh' ? '在浏览器中查看' : 'View on explorer'}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => removeTransaction(tx.id)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title={lang === 'zh' ? '删除' : 'Remove'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {(pendingCount + failedCount) > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {lang === 'zh' ? '交易通知' : 'Transaction Notifications'}
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-yellow-500/10 rounded-lg p-3 text-center border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-yellow-600/75">
              {lang === 'zh' ? '待处理' : 'Pending'}
            </div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/20">
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            <div className="text-xs text-green-600/75">
              {lang === 'zh' ? '已确认' : 'Confirmed'}
            </div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/20">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-xs text-red-600/75">
              {lang === 'zh' ? '失败' : 'Failed'}
            </div>
          </div>
        </div>

        {/* Transaction List */}
        {transactions.length > 0 ? (
          <>
            <ScrollArea className="h-96 pr-4">
              <div className="space-y-2">
                {transactions.map(renderTransaction)}
              </div>
            </ScrollArea>

            {/* Clear Button */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={clearTransactions}
              >
                {lang === 'zh' ? '清空全部' : 'Clear All'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            {lang === 'zh' ? '暂无交易记录' : 'No transactions'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionNotificationCenter;
