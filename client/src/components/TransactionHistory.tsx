import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Zap,
  Search,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { TransactionFilterPanel, FilterCriteria } from '@/components/TransactionFilterPanel';
import { TransactionDetailModal, TransactionDetail } from '@/components/TransactionDetailModal';

export type TransactionType = 'deposit' | 'withdrawal' | 'refund' | 'fee' | 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: string;
  balance: string;
  description: string;
  createdAt: Date;
  status: 'success' | 'pending' | 'failed';
  txHash?: string;
}

interface TransactionHistoryProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const TRANSACTION_CONFIG: Record<TransactionType, { icon: React.ReactNode; color: string; label: string }> = {
  deposit: {
    icon: <ArrowDownLeft className="w-4 h-4" />,
    color: 'text-blue-500',
    label: 'Deposit',
  },
  withdrawal: {
    icon: <ArrowDownLeft className="w-4 h-4" />,
    color: 'text-orange-500',
    label: 'Withdrawal',
  },
  refund: {
    icon: <ArrowUpRight className="w-4 h-4" />,
    color: 'text-green-500',
    label: 'Refund',
  },
  fee: {
    icon: <Zap className="w-4 h-4" />,
    color: 'text-yellow-500',
    label: 'Fee',
  },
  income: {
    icon: <ArrowUpRight className="w-4 h-4" />,
    color: 'text-green-500',
    label: 'Income',
  },
  expense: {
    icon: <ArrowDownLeft className="w-4 h-4" />,
    color: 'text-red-500',
    label: 'Expense',
  },
};

const ITEMS_PER_PAGE = 10;

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'purchase' | 'withdrawal' | 'income' | 'expense' | 'refund' | 'fee' | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>({
    status: 'all',
    type: 'all',
  });
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleTransactionClick = (tx: any) => {
    const detail: TransactionDetail = {
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      balance: tx.balance,
      description: tx.description,
      createdAt: tx.createdAt,
      status: tx.status,
      txHash: tx.txHash,
      gasFee: tx.gasFee,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
      network: tx.network,
      confirmations: tx.confirmations,
    };
    setSelectedTransaction(detail);
    setIsDetailModalOpen(true);
  };

  // tRPC query with pagination
  const { data: historyData, isLoading, refetch } = trpc.wallet.getTransactionHistory.useQuery(
    {
      type: filterType === 'all' ? undefined : filterType,
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
    },
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
    }
  );

  // Auto-refetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    refetch();
  }, [filterType, filterStatus, advancedFilters, refetch]);

  const handleFilterChange = (filters: FilterCriteria) => {
    setAdvancedFilters(filters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setAdvancedFilters({ status: 'all', type: 'all' });
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const transactions = historyData?.transactions || [];
  const totalCount = historyData?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Local filtering for search, status, and advanced filters
  const filteredTransactions = transactions.filter((tx: any) => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount.includes(searchTerm) ||
      tx.txHash?.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;

    // Advanced filters
    const txDate = new Date(tx.createdAt);
    const matchesDateRange =
      (!advancedFilters.startDate || txDate >= advancedFilters.startDate) &&
      (!advancedFilters.endDate ||
        txDate <= new Date(advancedFilters.endDate.getTime() + 86400000));

    const txAmount = parseFloat(tx.amount);
    const matchesAmountRange =
      (!advancedFilters.minAmount || txAmount >= advancedFilters.minAmount) &&
      (!advancedFilters.maxAmount || txAmount <= advancedFilters.maxAmount);

    const matchesAdvancedStatus =
      advancedFilters.status === 'all' || tx.status === advancedFilters.status;

    const matchesAdvancedType =
      advancedFilters.type === 'all' || tx.type === advancedFilters.type;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDateRange &&
      matchesAmountRange &&
      matchesAdvancedStatus &&
      matchesAdvancedType
    );
  });

  const calculateStats = () => {
    const income = transactions
      .filter((tx: any) => tx.type === 'income' || tx.type === 'refund' || tx.type === 'deposit')
      .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);

    const expense = transactions
      .filter((tx: any) => tx.type === 'withdrawal' || tx.type === 'expense' || tx.type === 'fee')
      .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);

    return { income, expense, net: income - expense };
  };

  const stats = calculateStats();

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600">✓ {lang === 'zh' ? '成功' : 'Success'}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">⏳ {lang === 'zh' ? '待处理' : 'Pending'}</Badge>;
      case 'failed':
        return <Badge className="bg-red-600">✗ {lang === 'zh' ? '失败' : 'Failed'}</Badge>;
      default:
        return null;
    }
  };

  const handleExport = () => {
    // Export current filtered transactions as CSV
    const headers = ['Type', 'Amount', 'Balance', 'Status', 'Date', 'Hash'];
    const rows = filteredTransactions.map((tx: any) => [
      TRANSACTION_CONFIG[tx.type as TransactionType]?.label || tx.type,
      tx.amount,
      tx.balance,
      tx.status,
      formatDate(tx.createdAt),
      tx.txHash || '-',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="w-full space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  {lang === 'zh' ? '总收入' : 'Total Income'}
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-400">{formatAmount(stats.income.toString())} ISC</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  {lang === 'zh' ? '总支出' : 'Total Expense'}
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-red-400">{formatAmount(stats.expense.toString())} ISC</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-500" />
                  {lang === 'zh' ? '净额' : 'Net'}
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className={`text-2xl font-bold ${stats.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatAmount(stats.net.toString())} ISC
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-cyan-400">{lang === 'zh' ? '筛选和搜索' : 'Filter & Search'}</CardTitle>
            <div className="flex gap-2">
              <TransactionFilterPanel
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {lang === 'zh' ? '导出' : 'Export'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder={lang === 'zh' ? '搜索交易...' : 'Search transactions...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Filter Tabs */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-300">{lang === 'zh' ? '交易类型' : 'Transaction Type'}</div>
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as 'purchase' | 'withdrawal' | 'income' | 'expense' | 'refund' | 'fee' | 'all')}>
              <TabsList className="grid grid-cols-4 w-full bg-slate-800">
                <TabsTrigger value="all">{lang === 'zh' ? '全部' : 'All'}</TabsTrigger>
                <TabsTrigger value="deposit">{lang === 'zh' ? '充值' : 'Deposit'}</TabsTrigger>
                <TabsTrigger value="withdrawal">{lang === 'zh' ? '提取' : 'Withdraw'}</TabsTrigger>
                <TabsTrigger value="fee">{lang === 'zh' ? '手续费' : 'Fee'}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-300">{lang === 'zh' ? '状态' : 'Status'}</div>
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'success' | 'pending' | 'failed')}>
              <TabsList className="grid grid-cols-4 w-full bg-slate-800">
                <TabsTrigger value="all">{lang === 'zh' ? '全部' : 'All'}</TabsTrigger>
                <TabsTrigger value="success">{lang === 'zh' ? '成功' : 'Success'}</TabsTrigger>
                <TabsTrigger value="pending">{lang === 'zh' ? '待处理' : 'Pending'}</TabsTrigger>
                <TabsTrigger value="failed">{lang === 'zh' ? '失败' : 'Failed'}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full border-slate-700 text-gray-300 hover:bg-slate-800"
          >
            <Download className="w-4 h-4 mr-2" />
            {lang === 'zh' ? '导出为 CSV' : 'Export as CSV'}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-400">
            {lang === 'zh' ? '交易历史' : 'Transaction History'} ({filteredTransactions.length} / {totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="text-cyan-400" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              {lang === 'zh' ? '没有交易记录' : 'No transactions found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-gray-300">{lang === 'zh' ? '类型' : 'Type'}</TableHead>
                    <TableHead className="text-gray-300 text-right">{lang === 'zh' ? '金额' : 'Amount'}</TableHead>
                    <TableHead className="text-gray-300 text-right">{lang === 'zh' ? '余额' : 'Balance'}</TableHead>
                    <TableHead className="text-gray-300">{lang === 'zh' ? '状态' : 'Status'}</TableHead>
                    <TableHead className="text-gray-300">{lang === 'zh' ? '时间' : 'Date'}</TableHead>
                    <TableHead className="text-gray-300">{lang === 'zh' ? '交易哈希' : 'Hash'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx: any) => (
                    <TableRow
                      key={tx.id}
                      className="border-slate-700 hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => handleTransactionClick(tx)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={TRANSACTION_CONFIG[tx.type as TransactionType]?.color}>
                            {TRANSACTION_CONFIG[tx.type as TransactionType]?.icon}
                          </span>
                          <span className="text-white">{TRANSACTION_CONFIG[tx.type as TransactionType]?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-cyan-400">
                        {tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'income' ? '+' : '-'}
                        {formatAmount(tx.amount)} ISC
                      </TableCell>
                      <TableCell className="text-right text-gray-300">{formatAmount(tx.balance)} ISC</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{formatDate(tx.createdAt)}</TableCell>
                      <TableCell className="text-gray-400 text-xs max-w-xs truncate">{tx.txHash || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
              <div className="text-sm text-gray-400">
                {lang === 'zh'
                  ? `第 ${currentPage} 页，共 ${totalPages} 页`
                  : `Page ${currentPage} of ${totalPages}`}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-gray-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-gray-300 hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};
