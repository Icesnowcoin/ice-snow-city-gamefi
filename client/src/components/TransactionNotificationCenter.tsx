import React, { useState } from 'react';
import { useTransactionNotification, Transaction } from '@/contexts/TransactionNotificationContext';
import { useSimulatedTradeNotifications, type SimulatedTradeNotification } from '@/contexts/SimulatedTradeNotificationContext';
import type { SimulatedTradeStatus } from '@/lib/simulatedTradeHistory';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
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
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearRead, retryAllFailed } = useSimulatedTradeNotifications();
  const [open, setOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [simulatedFilter, setSimulatedFilter] = useState<'ALL' | SimulatedTradeStatus>('ALL');
  const [expandedSimulatedId, setExpandedSimulatedId] = useState<string | null>(null);
  const [copiedSimulatedId, setCopiedSimulatedId] = useState<string | null>(null);
  const [batchRetrying, setBatchRetrying] = useState(false);
  const [batchRetryMessage, setBatchRetryMessage] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState({ processed: 0, total: 0 });
  const [batchResult, setBatchResult] = useState<{ success: number; failed: number; skipped: number } | null>(null);

  const pendingCount = transactions.filter((tx) => tx.status === 'pending').length;
  const confirmedCount = transactions.filter((tx) => tx.status === 'confirmed').length;
  const failedCount = transactions.filter((tx) => tx.status === 'failed').length;
  const simulatedStatusLabel: Record<SimulatedTradeStatus, { zh: string; en: string }> = {
    PENDING: { zh: '待处理', en: 'Pending' },
    COMPLETED: { zh: '已完成', en: 'Completed' },
    FAILED: { zh: '失败', en: 'Failed' },
    CANCELLED: { zh: '已取消', en: 'Cancelled' },
  };
  const filteredSimulatedNotifications = notifications.filter((item) => simulatedFilter === 'ALL' || item.trade.status === simulatedFilter);
  const failedSimulatedCount = new Set(notifications.filter((item) => item.trade.status === 'FAILED').map((item) => item.trade.id)).size;

  const handleRetryAllFailed = async () => {
    if (batchRetrying || failedSimulatedCount === 0) return;
    setBatchRetrying(true);
    setBatchResult(null);
    setBatchProgress({ processed: 0, total: failedSimulatedCount });
    const result = await retryAllFailed((processed, total) => setBatchProgress({ processed, total }));
    setBatchProgress({ processed: result.total, total: result.total });
    setBatchResult({ success: result.success, failed: result.failed, skipped: result.skipped });
    setBatchRetryMessage(lang === 'zh' ? `批量重试完成：成功 ${result.success}，失败 ${result.failed}，跳过 ${result.skipped}` : `Batch retry complete: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`);
    window.setTimeout(() => {
      setBatchRetrying(false);
      setBatchRetryMessage(null);
    }, 3200);
  };

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

  const copySimulatedLog = async (item: SimulatedTradeNotification) => {
    const trade = item.trade;
    const text = [
      'Ice Snow City simulated trade notification',
      `Trade ID: ${trade.id}`,
      `Event sequence: ${item.sequence}`,
      `Status: ${trade.status}`,
      `Order type: ${trade.kind}`,
      `NFT: ${trade.nftName}`,
      `Token ID: ${trade.tokenId}`,
      `Price: ${trade.priceIsc} ISC`,
      `Fee: ${trade.feeIsc} ISC`,
      `Network: ${trade.network}`,
      `Transaction hash: ${trade.txHash}`,
      ...(trade.status === 'FAILED' ? ['Error: Simulated trade reported FAILED; no provider error payload was supplied.'] : []),
    ].join('\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      setCopiedSimulatedId(item.eventKey);
      markAsRead(item.eventKey);
      window.setTimeout(() => setCopiedSimulatedId((current) => current === item.eventKey ? null : current), 1800);
    } catch {
      setCopiedSimulatedId(null);
    }
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
        <button aria-label={lang === 'zh' ? '打开通知中心' : 'Open notification center'} className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {(pendingCount + failedCount) > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </DialogTrigger>

        <DialogContent className="h-[100dvh] w-full max-w-md overflow-hidden rounded-none border-cyan-400/20 bg-slate-950/95 p-4 sm:rounded-xl" data-testid="transaction-notification-sidebar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lang === 'zh' ? '通知中心' : 'Notification Center'}
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount} {lang === 'zh' ? '未读' : 'unread'}</Badge>}
          </DialogTitle>
          <DialogDescription className="sr-only">{lang === 'zh' ? '查看和管理模拟交易通知历史' : 'Review and manage simulated trade notification history'}</DialogDescription>
        </DialogHeader>

        <section className="rounded-xl border border-cyan-400/20 bg-slate-950/30 p-3" data-testid="simulated-notification-center">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-cyan-200">{lang === 'zh' ? '模拟交易历史' : 'Simulated trade history'}</h3>
              <p className="text-xs text-muted-foreground">{lang === 'zh' ? '仅包含 local-hardhat Toast 事件' : 'local-hardhat Toast events only'}</p>
            </div>
            <div className="flex items-center gap-2">
              <select aria-label={lang === 'zh' ? '模拟交易状态筛选' : 'Filter simulated trade status'} value={simulatedFilter} onChange={(event) => setSimulatedFilter(event.target.value as 'ALL' | SimulatedTradeStatus)} className="rounded-md border border-cyan-400/20 bg-slate-900 px-2 py-1 text-xs text-slate-200">
                <option value="ALL">{lang === 'zh' ? '全部状态' : 'All statuses'}</option>
                <option value="PENDING">{lang === 'zh' ? '待处理' : 'Pending'}</option>
                <option value="COMPLETED">{lang === 'zh' ? '已完成' : 'Completed'}</option>
                <option value="FAILED">{lang === 'zh' ? '失败' : 'Failed'}</option>
              </select>
              <button type="button" onClick={markAllAsRead} className="text-xs text-cyan-200 underline underline-offset-2" data-testid="simulated-mark-all-read">{lang === 'zh' ? '全部已读' : 'Mark all read'}</button>
              <button type="button" onClick={() => void handleRetryAllFailed()} disabled={batchRetrying || failedSimulatedCount === 0} aria-busy={batchRetrying} className="inline-flex items-center gap-1 rounded-md border border-rose-300/30 px-2 py-1 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70 disabled:cursor-not-allowed disabled:opacity-50" data-testid="simulated-retry-all-failed">
                <RotateCcw className={`h-3 w-3 ${batchRetrying ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
                {batchRetrying ? (lang === 'zh' ? '批量重试中…' : 'Retrying…') : (lang === 'zh' ? '重试所有失败' : 'Retry all failed')}
              </button>
            </div>
          </div>
          {batchRetrying && batchProgress.total > 0 && <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/5 p-3" data-testid="simulated-batch-progress" aria-live="polite">
            <div className="mb-2 flex items-center justify-between text-xs text-amber-100"><span>{lang === 'zh' ? '批量重试处理中' : 'Batch retry in progress'}</span><span>{batchProgress.processed}/{batchProgress.total}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-amber-950/60" role="progressbar" aria-label={lang === 'zh' ? '批量重试进度' : 'Batch retry progress'} aria-valuemin={0} aria-valuemax={batchProgress.total} aria-valuenow={batchProgress.processed}><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-cyan-300 transition-[width] duration-200" style={{ width: `${batchProgress.total ? (batchProgress.processed / batchProgress.total) * 100 : 0}%` }} /></div>
          </div>}
          {!batchRetrying && batchResult && <div className="mb-3 grid grid-cols-3 gap-2" data-testid="simulated-batch-result" role="status" aria-live="polite"><div className="rounded-md bg-emerald-500/10 p-2 text-center text-xs text-emerald-200"><strong className="block text-lg">{batchResult.success}</strong>{lang === 'zh' ? '成功' : 'Succeeded'}</div><div className="rounded-md bg-rose-500/10 p-2 text-center text-xs text-rose-200"><strong className="block text-lg">{batchResult.failed}</strong>{lang === 'zh' ? '失败' : 'Failed'}</div><div className="rounded-md bg-slate-500/10 p-2 text-center text-xs text-slate-200"><strong className="block text-lg">{batchResult.skipped}</strong>{lang === 'zh' ? '跳过' : 'Skipped'}</div></div>}
          {filteredSimulatedNotifications.length > 0 ? (
            <ScrollArea className="max-h-72 pr-2">
              <div className="space-y-2">
                {filteredSimulatedNotifications.map((item) => {
                  const trade = item.trade;
                  const expanded = expandedSimulatedId === item.eventKey;
                  const statusTone = trade.status === 'COMPLETED' ? 'border-emerald-400/30 bg-emerald-500/5' : trade.status === 'FAILED' ? 'border-rose-400/30 bg-rose-500/5' : trade.status === 'PENDING' ? 'border-amber-400/30 bg-amber-500/5' : 'border-slate-400/30 bg-slate-500/5';
                  return <article key={item.eventKey} className={`rounded-lg border p-3 ${statusTone} ${item.read ? 'opacity-75' : ''}`} data-testid={`simulated-notification-${trade.status.toLowerCase()}`}>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{STATUS_ICONS[trade.status === 'COMPLETED' ? 'confirmed' : trade.status === 'FAILED' ? 'failed' : trade.status === 'PENDING' ? 'pending' : 'cancelled']}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{trade.nftName}</p>
                          {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-300" aria-label={lang === 'zh' ? '未读' : 'Unread'} />}
                        </div>
                        <p className="text-xs opacity-70">{simulatedStatusLabel[trade.status][lang === 'zh' ? 'zh' : 'en']} · {trade.tokenId} · seq {item.sequence}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => { setExpandedSimulatedId(expanded ? null : item.eventKey); markAsRead(item.eventKey); }} className="inline-flex items-center gap-1 text-xs text-cyan-200 underline underline-offset-2" aria-expanded={expanded} data-testid="simulated-notification-details">{expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}{expanded ? (lang === 'zh' ? '收起详情' : 'Hide details') : (lang === 'zh' ? '查看详情' : 'View details')}</button>
                          <button type="button" onClick={() => void copySimulatedLog(item)} className="inline-flex items-center gap-1 text-xs text-cyan-200 underline underline-offset-2" data-testid="simulated-notification-copy">{copiedSimulatedId === item.eventKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copiedSimulatedId === item.eventKey ? (lang === 'zh' ? '已复制' : 'Copied') : (lang === 'zh' ? '复制日志' : 'Copy log')}</button>
                        </div>
                        {expanded && <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3 text-xs"><div><dt className="opacity-60">Trade ID</dt><dd className="break-all font-mono">{trade.id}</dd></div><div><dt className="opacity-60">{lang === 'zh' ? '交易哈希' : 'Transaction hash'}</dt><dd className="break-all font-mono">{trade.txHash}</dd></div><div><dt className="opacity-60">{lang === 'zh' ? '价格' : 'Price'}</dt><dd>{trade.priceIsc} ISC</dd></div><div><dt className="opacity-60">{lang === 'zh' ? '网络' : 'Network'}</dt><dd>{trade.network}</dd></div>{trade.status === 'FAILED' && <div className="col-span-2 text-rose-300"><dt>{lang === 'zh' ? '错误' : 'Error'}</dt><dd>{lang === 'zh' ? '模拟交易失败；未提供 provider 错误载荷。' : 'Simulated trade failed; no provider error payload supplied.'}</dd></div>}</dl>}
                      </div>
                    </div>
                  </article>;
                })}
              </div>
            </ScrollArea>
          ) : <p className="py-5 text-center text-xs text-muted-foreground">{lang === 'zh' ? '暂无模拟 Toast 记录' : 'No simulated Toast records'}</p>}
          <div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-emerald-300" role="status" aria-live="polite">{batchRetryMessage}</span><Button variant="outline" size="sm" onClick={clearRead} disabled={notifications.length === 0} data-testid="simulated-clear-read">{lang === 'zh' ? '清空已读' : 'Clear read'}</Button></div>
        </section>

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
