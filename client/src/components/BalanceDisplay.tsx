import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Zap,
  Clock,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface BalanceInfo {
  iscBalance: string;
  usdtBalance: string;
  bankBalance: string;
  totalAssets: string;
  lastUpdated: Date;
  isUpdating: boolean;
}

interface BalanceDisplayProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showTrend?: boolean;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showTrend = true,
}) => {
  const { lang } = useLanguage();
  const [previousBalance, setPreviousBalance] = useState<BalanceInfo | null>(null);
  const [balanceChange, setBalanceChange] = useState<{
    isc: number;
    usdt: number;
    total: number;
  }>({ isc: 0, usdt: 0, total: 0 });
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // tRPC query with auto-refresh
  const { data: balanceData, isLoading, refetch } = trpc.wallet.getBalance.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
    }
  );

  // Manual refresh handler
  const handleRefresh = async () => {
    setLastRefreshTime(new Date());
    await refetch();
  };

  // Convert tRPC data to BalanceInfo format
  const balance: BalanceInfo = {
    iscBalance: balanceData?.iscBalance || '0',
    usdtBalance: balanceData?.usdtBalance || '0',
    bankBalance: balanceData?.bankBalance || '0',
    totalAssets: balanceData?.totalValue || '0',
    lastUpdated: new Date(),
    isUpdating: isLoading,
  };

  // Track balance changes
  useEffect(() => {
    if (previousBalance) {
      const iscChange = parseFloat(balance.iscBalance) - parseFloat(previousBalance.iscBalance);
      const usdtChange = parseFloat(balance.usdtBalance) - parseFloat(previousBalance.usdtBalance);
      const totalChange = parseFloat(balance.totalAssets) - parseFloat(previousBalance.totalAssets);

      setBalanceChange({
        isc: iscChange,
        usdt: usdtChange,
        total: totalChange,
      });
    }
    setPreviousBalance(balance);
  }, [balance]);

  const formatNumber = (num: string) => {
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const totalAssets = parseFloat(balance.totalAssets);
  const iscPercent = (parseFloat(balance.iscBalance) / totalAssets) * 100 || 0;
  const usdtPercent = (parseFloat(balance.usdtBalance) / totalAssets) * 100 || 0;
  const bankPercent = (parseFloat(balance.bankBalance) / totalAssets) * 100 || 0;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-cyan-900 to-slate-900 border-cyan-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              {lang === 'zh' ? '总资产' : 'Total Assets'}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              )}
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:bg-cyan-800"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !balanceData ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-cyan-400">
                  ${formatNumber(balance.totalAssets)}
                </div>
                {showTrend && balanceChange.total !== 0 && (
                  <div className={`flex items-center gap-2 ${getTrendColor(balanceChange.total)}`}>
                    {getTrendIcon(balanceChange.total)}
                    <span className="text-sm font-semibold">
                      {balanceChange.total > 0 ? '+' : ''}{formatNumber(balanceChange.total.toString())}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>
                  {lang === 'zh' ? '最后更新: ' : 'Last updated: '}
                  {formatTime(balance.lastUpdated)}
                </span>
              </div>
              {autoRefresh && (
                <div className="text-xs text-gray-500">
                  {lang === 'zh' ? '自动刷新中...' : 'Auto-refreshing...'}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Balance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ISC Balance */}
        <Card className="bg-slate-800 border-slate-700 hover:border-cyan-600 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                {lang === 'zh' ? 'ISC 余额' : 'ISC Balance'}
              </span>
              {showTrend && balanceChange.isc !== 0 && getTrendIcon(balanceChange.isc)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && !balanceData ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-cyan-400">
                  {formatNumber(balance.iscBalance)}
                </div>
                {showTrend && balanceChange.isc !== 0 && (
                  <div className={`text-xs font-semibold ${getTrendColor(balanceChange.isc)}`}>
                    {balanceChange.isc > 0 ? '+' : ''}{formatNumber(balanceChange.isc.toString())}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{lang === 'zh' ? '占比' : 'Percentage'}</span>
                    <span>{iscPercent.toFixed(1)}%</span>
                  </div>
                  <Progress value={iscPercent} className="h-1 bg-slate-700" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* USDT Balance */}
        <Card className="bg-slate-800 border-slate-700 hover:border-green-600 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                {lang === 'zh' ? 'USDT 余额' : 'USDT Balance'}
              </span>
              {showTrend && balanceChange.usdt !== 0 && getTrendIcon(balanceChange.usdt)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && !balanceData ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-400">
                  {formatNumber(balance.usdtBalance)}
                </div>
                {showTrend && balanceChange.usdt !== 0 && (
                  <div className={`text-xs font-semibold ${getTrendColor(balanceChange.usdt)}`}>
                    {balanceChange.usdt > 0 ? '+' : ''}{formatNumber(balanceChange.usdt.toString())}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{lang === 'zh' ? '占比' : 'Percentage'}</span>
                    <span>{usdtPercent.toFixed(1)}%</span>
                  </div>
                  <Progress value={usdtPercent} className="h-1 bg-slate-700" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bank Balance */}
        <Card className="bg-slate-800 border-slate-700 hover:border-blue-600 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              {lang === 'zh' ? '银行余额' : 'Bank Balance'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && !balanceData ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(balance.bankBalance)}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{lang === 'zh' ? '占比' : 'Percentage'}</span>
                    <span>{bankPercent.toFixed(1)}%</span>
                  </div>
                  <Progress value={bankPercent} className="h-1 bg-slate-700" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {isLoading ? (
        <Alert className="bg-blue-900/50 border-blue-700">
          <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
          <AlertDescription className="text-blue-200">
            {lang === 'zh' ? '正在更新余额...' : 'Updating balance...'}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-900/50 border-green-700">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">
            {lang === 'zh' ? '余额已同步' : 'Balance synchronized'}
            {autoRefresh && (
              <span className="ml-2 text-xs text-green-300">
                ({lang === 'zh' ? '每' : 'Every'} {refreshInterval / 1000}s)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Info Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm text-gray-300">
            {lang === 'zh' ? '余额信息' : 'Balance Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">{lang === 'zh' ? '总资产价值' : 'Total Value'}</span>
              <div className="text-lg font-semibold text-cyan-400">
                ${formatNumber(balance.totalAssets)}
              </div>
            </div>
            <div>
              <span className="text-gray-400">{lang === 'zh' ? '更新频率' : 'Update Frequency'}</span>
              <div className="text-lg font-semibold text-gray-300">
                {autoRefresh ? `${refreshInterval / 1000}s` : lang === 'zh' ? '手动' : 'Manual'}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-700">
            <div className="text-xs text-gray-500">
              {lang === 'zh'
                ? `最后刷新: ${formatTime(lastRefreshTime)}`
                : `Last refresh: ${formatTime(lastRefreshTime)}`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceDisplay;
