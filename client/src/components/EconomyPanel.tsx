"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Leaf, Droplets, Zap, DollarSign, RefreshCw } from "lucide-react";
import {
  useEconomyData,
  useBankInfo,
  useMarketPrices,
  useSeasonInfo,
  usePrefetchEconomyAll,
} from "@/hooks/useEconomyDataWithCache";
import {
  EconomyPanelSkeleton,
  MarketPricesSkeleton,
  BankInfoSkeleton,
  LoadingState,
} from "@/components/SkeletonLoaders";
import AdvancedErrorBoundary from "@/components/AdvancedErrorBoundary";
import { useRetry } from "@/hooks/useRetry";
import { RefreshControl, useRefreshControl } from "@/components/RefreshControl";
import MacroEconomyDashboard from "@/components/economy/MacroEconomyDashboard";
import { ISCLogo } from "@/components/ISCLogo";

const ITEM_NAMES: Record<string, string> = {
  wheat: "小麦",
  corn: "玉米",
  rice: "水稻",
  tomato: "番茄",
  carrot: "胡萝卜",
  apple: "苹果",
  milk: "牛奶",
  egg: "鸡蛋",
  meat: "肉类",
  fish: "鱼类",
};

const ITEM_ICONS: Record<string, React.ReactNode> = {
  wheat: "🌾",
  corn: "🌽",
  rice: "🍚",
  tomato: "🍅",
  carrot: "🥕",
  apple: "🍎",
  milk: "🥛",
  egg: "🥚",
  meat: "🍖",
  fish: "🐟",
};

export default function EconomyPanel() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh control state
  const { lastUpdateTime, isError, errorMessage, handleRefresh: handleRefreshControl } =
    useRefreshControl();

  // Fetch economy data with optimized cache
  const { data: economyData, isLoading: isLoadingEconomy, refetch: refetchEconomy } = useEconomyData();
  const { data: bankInfo, isLoading: isLoadingBank, refetch: refetchBank } = useBankInfo();
  const { data: marketData, isLoading: isLoadingMarket, refetch: refetchMarket } = useMarketPrices();
  const { data: seasonInfo, isLoading: isLoadingSeason, refetch: refetchSeason } = useSeasonInfo();

  const isLoading = isLoadingEconomy || isLoadingBank || isLoadingMarket || isLoadingSeason;

  // Prefetch hook for warming up cache
  const prefetchEconomyAll = usePrefetchEconomyAll();

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchEconomy(),
        refetchBank(),
        refetchMarket(),
        refetchSeason(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Prefetch economy data on component mount
  useEffect(() => {
    prefetchEconomyAll().catch(() => {
      // Silently fail - data will load when needed
    });
  }, [prefetchEconomyAll]);

  // Auto-refresh every 60 seconds (now relies on cache strategy)
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSeasonEmoji = (season: string | undefined): ReactNode => {
    switch (season) {
      case "spring":
        return "🌸";
      case "summer":
        return "☀️";
      case "autumn":
        return "🍂";
      case "winter":
        return <ISCLogo size="lg" className="inline-block align-middle drop-shadow-[0_0_8px_rgba(103,232,249,0.75)]" aria-label="ISC winter mark" />;
      default:
        return "📅";
    }
  };

  const getSeasonName = (season: string | undefined) => {
    switch (season) {
      case "spring":
        return "春季";
      case "summer":
        return "夏季";
      case "autumn":
        return "秋季";
      case "winter":
        return "冬季";
      default:
        return "未知";
    }
  };

  return (
    <AdvancedErrorBoundary level="section" onError={(error) => {
      console.error('Economy Panel Error:', error);
    }}>
      <div className="space-y-6">
        {isLoading ? (
          <EconomyPanelSkeleton />
        ) : (
          <>
          {/* Header */}
          <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-500" />
          <h2 className="text-2xl font-bold">经济面板</h2>
        </div>
        <RefreshControl
          onRefresh={async () => {
            await handleRefreshControl(async () => {
              await Promise.all([
                refetchEconomy(),
                refetchBank(),
                refetchMarket(),
                refetchSeason(),
              ]);
            });
          }}
          lastUpdateTime={lastUpdateTime}
          isLoading={isRefreshing || isLoading}
          isError={isError}
          errorMessage={errorMessage}
          showLastUpdate={true}
          size="md"
        />
      </div>

      {/* Economy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Money */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">总资金</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{economyData?.totalMoney?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">游戏币</p>
          </CardContent>
        </Card>

        {/* Total ISC */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">ISC 余额</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{economyData?.totalISC?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">冰雪币</p>
          </CardContent>
        </Card>

        {/* Bank Balance */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">银行存款</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bankInfo?.balance?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">年利率 {bankInfo?.interestRate}%</p>
          </CardContent>
        </Card>

        {/* Daily Income */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">每日收入</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">+{economyData?.dailyIncome?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">利息收入</p>
          </CardContent>
        </Card>
      </div>

      <MacroEconomyDashboard
        initialSupply={10_000_000}
        liveBurnedTotal={undefined}
        liveTreasuryBalance={undefined}
      />

      {/* Tabs */}
      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="market">市场价格</TabsTrigger>
          <TabsTrigger value="season">季节信息</TabsTrigger>
          <TabsTrigger value="bank">银行详情</TabsTrigger>
        </TabsList>

        {/* Market Prices Tab */}
        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>市场价格</CardTitle>
              <CardDescription>实时商品市场价格（ISC）</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMarket ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-muted rounded-lg animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead className="text-right">价格</TableHead>
                      <TableHead className="text-right">变化</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketData?.prices?.map((item: any, index: number) => (
                      <TableRow
                        key={item.itemId}
                        style={{
                          animation: `slideIn 0.3s ease-out ${index * 50}ms both`,
                        }}
                      >
                        <TableCell className="font-medium">
                          <span className="mr-2">{ITEM_ICONS[item.itemId] || "📦"}</span>
                          {ITEM_NAMES[item.itemId] || item.itemId}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.price?.toFixed(2) || 0} ISC
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +5%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Season Info Tab */}
        <TabsContent value="season" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>季节信息</CardTitle>
              <CardDescription>当前游戏季节和市场修饰符</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSeason ? (
                <div className="h-32 bg-muted rounded-lg animate-pulse" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">当前季节</p>
                      <p className="text-2xl font-bold">
                        {getSeasonEmoji(seasonInfo?.season)} {getSeasonName(seasonInfo?.season)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">季节修饰符</p>
                      <p className="text-2xl font-bold text-green-500">
                        {seasonInfo?.modifier && typeof seasonInfo.modifier === 'number' ? `×${(seasonInfo.modifier as number).toFixed(2)}` : "×1.00"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">游戏时间</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground">年份</p>
                        <p className="font-semibold">{seasonInfo?.gameTime?.year || 1}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">月份</p>
                        <p className="font-semibold">{seasonInfo?.gameTime?.month || 1}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">日期</p>
                        <p className="font-semibold">{seasonInfo?.gameTime?.day || 1}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">小时</p>
                        <p className="font-semibold">{seasonInfo?.gameTime?.hour || 0}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Info Tab */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>银行详情</CardTitle>
              <CardDescription>银行账户信息和利息计算</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingBank ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-muted-foreground">账户余额</span>
                    <span className="font-semibold">{bankInfo?.balance?.toLocaleString() || 0} ISC</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-muted-foreground">年利率</span>
                    <span className="font-semibold">{bankInfo?.interestRate}%</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-muted-foreground">日利息</span>
                    <span className="font-semibold text-green-500">+{bankInfo?.dailyInterest?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-muted-foreground">月利息</span>
                    <span className="font-semibold text-green-500">+{bankInfo?.monthlyInterest?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-muted-foreground">年利息</span>
                    <span className="font-semibold text-green-500">+{bankInfo?.yearlyInterest?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-muted-foreground">待领利息</span>
                    <span className="font-semibold text-yellow-500">+{bankInfo?.pendingInterest?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">存款次数</span>
                    <span className="font-semibold">{bankInfo?.depositCount || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }}
      `}</style>
        </>
      )}
      </div>
    </AdvancedErrorBoundary>
  );
}
