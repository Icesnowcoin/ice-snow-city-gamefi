import { useMemo } from 'react';
import { Flame, Landmark, LineChart, Megaphone, ReceiptText, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  buildMacroEconomySnapshot,
  calculateMarketplaceCommission,
  ISC_MARKETPLACE_COMMISSION,
  ISC_MINT_DISTRIBUTION,
  normalizeMacroPeriods,
  type MacroEconomyPeriod,
} from '@/lib/macroEconomyUtils';

interface MacroEconomyDashboardProps {
  initialSupply?: number;
  periods?: MacroEconomyPeriod[];
  liveTreasuryBalance?: number;
  liveBurnedTotal?: number;
}

const DEFAULT_PERIODS: MacroEconomyPeriod[] = [
  { period: '06月', minted: 18000, burned: 180, treasuryInflow: 12420, marketingInflow: 5400, marketplaceVolume: 42000, marketplaceCommission: 4200, circulatingSupply: 10001820 },
  { period: '07月', minted: 24000, burned: 240, treasuryInflow: 16560, marketingInflow: 7200, marketplaceVolume: 55000, marketplaceCommission: 5500, circulatingSupply: 10002580 },
  { period: '08月', minted: 31000, burned: 310, treasuryInflow: 21390, marketingInflow: 9300, marketplaceVolume: 68000, marketplaceCommission: 6800, circulatingSupply: 10003270 },
];

const formatISC = (value: number) => `${Math.round(value).toLocaleString()} ISC`;

export function MacroEconomyDashboard({
  initialSupply = 10_000_000,
  periods = DEFAULT_PERIODS,
  liveTreasuryBalance,
  liveBurnedTotal,
}: MacroEconomyDashboardProps) {
  const normalizedPeriods = useMemo(() => normalizeMacroPeriods(periods), [periods]);
  const snapshot = useMemo(() => buildMacroEconomySnapshot(normalizedPeriods, initialSupply), [initialSupply, normalizedPeriods]);
  const latestPeriod = normalizedPeriods[normalizedPeriods.length - 1];
  const maxMinted = Math.max(...normalizedPeriods.map((period) => period.minted), 1);
  const burnedTotal = liveBurnedTotal ?? snapshot.totalBurned;
  const treasuryBalance = liveTreasuryBalance ?? snapshot.totalTreasuryInflow;
  const commission = snapshot.totalMarketplaceCommission || normalizedPeriods.reduce((sum, period) => sum + calculateMarketplaceCommission(period.marketplaceVolume), 0);

  return (
    <section className="space-y-4" aria-labelledby="macro-economy-dashboard-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">ISC ECONOMY · PHASE 74–75</p>
          <h2 id="macro-economy-dashboard-title" className="text-2xl font-bold tracking-tight">ISC 宏观经济循环</h2>
          <p className="text-sm text-muted-foreground">监测铸造分账、市场佣金、燃烧量和流通供给变化。</p>
        </div>
        <Badge variant="outline" className="w-fit border-violet-200 bg-violet-50 text-violet-800">规则口径已锁定</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5"><p className="text-xs text-muted-foreground">累计燃烧</p><p className="mt-1 text-2xl font-bold text-orange-600">{formatISC(burnedTotal)}</p><p className="text-xs text-muted-foreground">铸造金额的 1%</p></CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5"><p className="text-xs text-muted-foreground">国库流入</p><p className="mt-1 text-2xl font-bold text-cyan-600">{formatISC(treasuryBalance)}</p><p className="text-xs text-muted-foreground">铸造金额的 69%</p></CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5"><p className="text-xs text-muted-foreground">市场佣金</p><p className="mt-1 text-2xl font-bold text-emerald-600">{formatISC(commission)}</p><p className="text-xs text-muted-foreground">交易额的 10%</p></CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5"><p className="text-xs text-muted-foreground">流通供给</p><p className="mt-1 text-2xl font-bold text-violet-600">{formatISC(snapshot.circulatingSupply)}</p><p className="text-xs text-muted-foreground">模型期末值</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><LineChart className="h-4 w-4 text-violet-600" /> 铸造与流通趋势</CardTitle>
            <CardDescription>按月展示前端经济数据接口返回的周期聚合结果。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3" role="img" aria-label="ISC 铸造趋势条形图">
              {normalizedPeriods.map((period) => (
                <div key={period.period} className="space-y-2">
                  <div className="flex h-36 items-end justify-center rounded-lg bg-slate-50 p-3">
                    <div className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-cyan-400 transition-all" style={{ height: `${Math.max(8, (period.minted / maxMinted) * 100)}%` }} title={`${period.period} 铸造 ${formatISC(period.minted)}`} />
                  </div>
                  <p className="text-center text-xs font-medium">{period.period}</p>
                  <p className="text-center text-[11px] text-muted-foreground">{formatISC(period.minted)}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3" aria-live="polite">
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">累计通胀率</span><span className="font-semibold text-violet-700">{snapshot.inflationRate.toFixed(2)}%</span></div>
              <Progress value={Math.min(100, Math.max(0, snapshot.inflationRate))} className="mt-2 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">已扣除永久销毁量；锁仓量需要链上数据源接入后再计入。</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">ISC 分账规则</CardTitle><CardDescription>铸造费用按永久记录的官方比例分配。</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div><div className="mb-1 flex justify-between text-sm"><span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-600" />永久销毁</span><span className="font-semibold">1%</span></div><Progress value={ISC_MINT_DISTRIBUTION.burn * 100} className="h-2 [&>div]:bg-orange-500" /></div>
              <div><div className="mb-1 flex justify-between text-sm"><span className="flex items-center gap-1"><Landmark className="h-3.5 w-3.5 text-cyan-600" />国库</span><span className="font-semibold">69%</span></div><Progress value={ISC_MINT_DISTRIBUTION.treasury * 100} className="h-2 [&>div]:bg-cyan-500" /></div>
              <div><div className="mb-1 flex justify-between text-sm"><span className="flex items-center gap-1"><Megaphone className="h-3.5 w-3.5 text-violet-600" />营销钱包</span><span className="font-semibold">30%</span></div><Progress value={ISC_MINT_DISTRIBUTION.marketing * 100} className="h-2 [&>div]:bg-violet-500" /></div>
              <div><div className="mb-1 flex justify-between text-sm"><span className="flex items-center gap-1"><ReceiptText className="h-3.5 w-3.5 text-emerald-600" />交易中心佣金</span><span className="font-semibold">10%</span></div><Progress value={ISC_MARKETPLACE_COMMISSION * 100} className="h-2 [&>div]:bg-emerald-500" /></div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-muted-foreground"><TrendingUp className="mr-1 inline h-3.5 w-3.5" />最近周期：{latestPeriod?.period ?? '暂无'}，铸造 {formatISC(latestPeriod?.minted ?? 0)}，市场成交 {formatISC(latestPeriod?.marketplaceVolume ?? 0)}。</div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default MacroEconomyDashboard;
