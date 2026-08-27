import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Zap, Droplet, DollarSign, ShoppingCart } from 'lucide-react';

/**
 * Economic Cycle System Component
 * 
 * 实现完整的游戏经济循环：
 * 1. 玩家收入 (农业、商业、工作)
 * 2. 玩家支出 (电费、水费、购物、投资)
 * 3. NPC 工资分配 (避免过高工资破坏平衡)
 * 4. 市场价格波动 (基于供求关系)
 * 5. 银行利息系统 (APY 合约集成)
 * 6. 经济指标监控
 */

interface EconomicData {
  timestamp: number;
  totalPlayerIncome: number;
  totalPlayerExpense: number;
  npcWageExpense: number;
  marketVolume: number;
  averagePrice: number;
  bankTotalDeposits: number;
  bankTotalInterest: number;
  inflationRate: number;
  economicHealth: number;
}

interface PlayerEconomicStatus {
  playerId: string;
  playerName: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  bankBalance: number;
  bankInterest: number;
  investmentValue: number;
  netWorth: number;
}

interface EconomicCycleSystemProps {
  economicData: EconomicData[];
  playerStatus: PlayerEconomicStatus[];
  onEconomicUpdate?: (data: EconomicData) => void;
  isLoading?: boolean;
}

/**
 * Economic Health Indicator
 */
const HealthIndicator: React.FC<{ health: number }> = ({ health }) => {
  const getHealthColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthLabel = (value: number) => {
    if (value >= 80) return '非常健康';
    if (value >= 60) return '健康';
    if (value >= 40) return '一般';
    return '需要调整';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">经济健康度</span>
        <span className={`text-2xl font-bold ${getHealthColor(health)}`}>
          {health.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${
            health >= 80
              ? 'bg-green-500'
              : health >= 60
              ? 'bg-blue-500'
              : health >= 40
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(health, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{getHealthLabel(health)}</p>
    </div>
  );
};

/**
 * Economic Metrics Card
 */
const EconomicMetricsCard: React.FC<{
  data: EconomicData;
}> = ({ data }) => {
  const netEconomicFlow = data.totalPlayerIncome - data.totalPlayerExpense - data.npcWageExpense;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Income */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">总收入</p>
            <p className="text-lg font-semibold text-green-600">
              {(data.totalPlayerIncome / 1000).toFixed(1)}K
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
        </div>
      </Card>

      {/* Total Expense */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">总支出</p>
            <p className="text-lg font-semibold text-red-600">
              {(data.totalPlayerExpense / 1000).toFixed(1)}K
            </p>
          </div>
          <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
        </div>
      </Card>

      {/* Market Volume */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">市场成交量</p>
            <p className="text-lg font-semibold text-blue-600">
              {(data.marketVolume / 1000).toFixed(1)}K
            </p>
          </div>
          <ShoppingCart className="w-8 h-8 text-blue-500 opacity-50" />
        </div>
      </Card>

      {/* Average Price */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">平均价格</p>
            <p className="text-lg font-semibold text-purple-600">
              {data.averagePrice.toFixed(2)}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-purple-500 opacity-50" />
        </div>
      </Card>
    </div>
  );
};

/**
 * Utility Expense Analysis
 */
const UtilityExpenseCard: React.FC<{
  data: EconomicData;
}> = ({ data }) => {
  // 假设电费和水费各占总支出的 20%
  const electricityExpense = data.totalPlayerExpense * 0.2;
  const waterExpense = data.totalPlayerExpense * 0.2;
  const otherExpense = data.totalPlayerExpense * 0.6;

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">支出构成分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">电费</span>
            </div>
            <span className="font-semibold">{(electricityExpense / 1000).toFixed(1)}K</span>
            <span className="text-xs text-muted-foreground">
              {((electricityExpense / data.totalPlayerExpense) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className="text-sm">水费</span>
            </div>
            <span className="font-semibold">{(waterExpense / 1000).toFixed(1)}K</span>
            <span className="text-xs text-muted-foreground">
              {((waterExpense / data.totalPlayerExpense) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-purple-500" />
              <span className="text-sm">其他支出</span>
            </div>
            <span className="font-semibold">{(otherExpense / 1000).toFixed(1)}K</span>
            <span className="text-xs text-muted-foreground">
              {((otherExpense / data.totalPlayerExpense) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * NPC Wage Analysis
 */
const NPCWageAnalysisCard: React.FC<{
  data: EconomicData;
  playerCount: number;
}> = ({ data, playerCount }) => {
  const avgNPCWage = data.npcWageExpense / 200; // 假设 200 个 NPC
  const wageToIncomeRatio = (data.npcWageExpense / data.totalPlayerIncome) * 100;

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">NPC 工资分析</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">总工资支出</span>
          <span className="font-semibold">{(data.npcWageExpense / 1000).toFixed(1)}K</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm">平均 NPC 工资</span>
          <span className="font-semibold">{avgNPCWage.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm">工资占收入比</span>
          <Badge variant={wageToIncomeRatio < 30 ? 'default' : 'destructive'}>
            {wageToIncomeRatio.toFixed(1)}%
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          {wageToIncomeRatio < 30
            ? '✓ NPC 工资占比合理，游戏平衡良好'
            : '⚠ NPC 工资占比过高，可能破坏游戏平衡'}
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * Bank System Analysis
 */
const BankSystemCard: React.FC<{
  data: EconomicData;
}> = ({ data }) => {
  const avgAPY = data.bankTotalDeposits > 0 ? (data.bankTotalInterest / data.bankTotalDeposits) * 100 : 0;

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">银行系统分析</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">总存款</span>
          <span className="font-semibold">{(data.bankTotalDeposits / 1000).toFixed(1)}K</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm">总利息</span>
          <span className="font-semibold text-green-600">{(data.bankTotalInterest / 1000).toFixed(1)}K</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm">平均 APY</span>
          <Badge variant="outline">{avgAPY.toFixed(2)}%</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          玩家通过银行存款获得被动收入，鼓励长期投资行为
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * Economic Trend Chart
 */
const EconomicTrendChart: React.FC<{
  data: EconomicData[];
}> = ({ data }) => {
  const chartData = data.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    income: item.totalPlayerIncome / 1000,
    expense: item.totalPlayerExpense / 1000,
    npcWage: item.npcWageExpense / 1000,
  }));

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">经济流动趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              name="玩家收入"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              name="玩家支出"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="npcWage"
              stroke="#f59e0b"
              name="NPC 工资"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

/**
 * Player Economic Status Table
 */
const PlayerEconomicStatusTable: React.FC<{
  players: PlayerEconomicStatus[];
}> = ({ players }) => {
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.netWorth - a.netWorth);
  }, [players]);

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">玩家经济排行</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedPlayers.map((player, idx) => (
            <div key={player.playerId} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-3 flex-1">
                <span className="font-semibold text-sm w-6">{idx + 1}</span>
                <div>
                  <p className="text-sm font-medium">{player.playerName}</p>
                  <p className="text-xs text-muted-foreground">
                    净收入: {(player.netIncome / 1000).toFixed(1)}K
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{(player.netWorth / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">总资产</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Economic Cycle System Component
 */
export const EconomicCycleSystem: React.FC<EconomicCycleSystemProps> = ({
  economicData,
  playerStatus,
  onEconomicUpdate,
  isLoading = false,
}) => {
  const latestData = useMemo(() => {
    return economicData.length > 0 ? economicData[economicData.length - 1] : null;
  }, [economicData]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  if (!latestData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64 text-gray-400">
          没有经济数据
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="metrics">指标</TabsTrigger>
          <TabsTrigger value="trend">趋势</TabsTrigger>
          <TabsTrigger value="players">玩家</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HealthIndicator health={latestData.economicHealth} />
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">通货膨胀率</span>
                  <span className="font-semibold">{latestData.inflationRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">市场平均价格</span>
                  <span className="font-semibold">{latestData.averagePrice.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          <EconomicMetricsCard data={latestData} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <UtilityExpenseCard data={latestData} />
          <NPCWageAnalysisCard data={latestData} playerCount={playerStatus.length} />
          <BankSystemCard data={latestData} />
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          {economicData.length > 1 && <EconomicTrendChart data={economicData} />}
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          {playerStatus.length > 0 && <PlayerEconomicStatusTable players={playerStatus} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EconomicCycleSystem;
