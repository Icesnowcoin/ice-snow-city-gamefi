import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { estimateTransactionFee, GasFeeEstimate } from '@/lib/gasFeeEstimator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Clock, DollarSign, AlertCircle, Loader2 } from 'lucide-react';

export interface GasFeeSelectorProps {
  chainId?: number;
  transactionType?: 'transfer' | 'deposit' | 'withdrawal' | 'swap' | 'approve';
  amount?: number;
  onSpeedChange?: (speed: 'standard' | 'fast' | 'instant') => void;
  selectedSpeed?: 'standard' | 'fast' | 'instant';
  ethPrice?: number;
}

const SPEED_COLORS = {
  standard: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  fast: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  instant: 'bg-red-500/10 border-red-500/20 text-red-400',
};

const SPEED_ICONS = {
  standard: Clock,
  fast: Zap,
  instant: Zap,
};

export const GasFeeSelector: React.FC<GasFeeSelectorProps> = ({
  chainId = 56,
  transactionType = 'deposit',
  amount = 0,
  onSpeedChange,
  selectedSpeed = 'standard',
  ethPrice = 2500,
}) => {
  const { lang } = useLanguage();
  const [estimates, setEstimates] = useState<Record<'standard' | 'fast' | 'instant', GasFeeEstimate> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch gas fee estimates
  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await estimateTransactionFee(chainId, transactionType, ethPrice);
        setEstimates(result);
      } catch (err) {
        setError(lang === 'zh' ? '无法获取 Gas 费用估算' : 'Failed to fetch gas fee estimates');
        console.error('Gas fee estimation error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimates();

    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(fetchEstimates, 30000);
      return () => clearInterval(interval);
    }
  }, [chainId, transactionType, ethPrice, autoRefresh, lang]);

  const selectedEstimate = estimates?.[selectedSpeed];

  const handleSpeedChange = (speed: 'standard' | 'fast' | 'instant') => {
    onSpeedChange?.(speed);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {lang === 'zh' ? 'Gas 费用' : 'Gas Fees'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-500/10 border-red-500/20">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-400">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!estimates) {
    return null;
  }

  const totalCost = amount + (selectedEstimate ? parseFloat(selectedEstimate.totalFee) : 0);

  return (
    <div className="space-y-4">
      {/* Gas Fee Options */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {lang === 'zh' ? 'Gas 费用' : 'Gas Fees'}
            </CardTitle>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              {autoRefresh ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '刷新'
              )}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Speed Options */}
          <div className="grid grid-cols-3 gap-3">
            {(['standard', 'fast', 'instant'] as const).map((speed) => {
              const estimate = estimates[speed];
              const Icon = SPEED_ICONS[speed];
              const isSelected = selectedSpeed === speed;

              return (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `${SPEED_COLORS[speed]} border-current`
                      : `bg-slate-900 border-slate-700 hover:border-slate-600`
                  }`}
                >
                  <div className="space-y-2">
                    {/* Speed Label */}
                    <div className="flex items-center gap-1 justify-center">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold capitalize">
                        {lang === 'zh'
                          ? speed === 'standard'
                            ? '标准'
                            : speed === 'fast'
                            ? '快速'
                            : '即时'
                          : speed}
                      </span>
                    </div>

                    {/* Fee Amount */}
                    <div className="text-sm font-mono">
                      {estimate.totalFee} BNB
                    </div>

                    {/* Time Estimate */}
                    <div className="text-xs text-gray-400">
                      {estimate.estimatedTime}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Fee Details */}
          {selectedEstimate && (
            <div className={`p-3 rounded-lg border ${SPEED_COLORS[selectedSpeed]}`}>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">
                    {lang === 'zh' ? 'Gas 价格' : 'Gas Price'}
                  </span>
                  <span className="font-mono">{selectedEstimate.gasPrice} Gwei</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">
                    {lang === 'zh' ? 'Gas 限额' : 'Gas Limit'}
                  </span>
                  <span className="font-mono">{selectedEstimate.gasLimit.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">
                    {lang === 'zh' ? '预计费用' : 'Estimated Fee'}
                  </span>
                  <span className="font-mono">{selectedEstimate.totalFee} BNB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">USD</span>
                  <span className="font-mono">${selectedEstimate.totalFeeUSD}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Cost Summary */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {lang === 'zh' ? '交易金额' : 'Transaction Amount'}
              </span>
              <span className="font-mono">{amount.toFixed(6)} ISC</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {lang === 'zh' ? '手续费' : 'Fee'}
              </span>
              <span className="font-mono">
                {selectedEstimate?.totalFee} BNB (~${selectedEstimate?.totalFeeUSD})
              </span>
            </div>
            <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
              <span className="font-semibold">
                {lang === 'zh' ? '总计' : 'Total'}
              </span>
              <span className="font-mono font-semibold text-lg">
                {totalCost.toFixed(6)} ISC
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-400 text-sm">
          {lang === 'zh'
            ? '选择更快的速度会增加 Gas 费用。费用每 30 秒自动更新一次。'
            : 'Faster speeds increase gas fees. Fees update automatically every 30 seconds.'}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default GasFeeSelector;
