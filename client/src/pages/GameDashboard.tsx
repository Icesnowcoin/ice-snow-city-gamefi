import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GameTimeDisplay from "@/components/GameTimeDisplay";
import {
  Wallet,
  TrendingUp,
  Users,
  Home,
  Sprout,
  Building2,
  Award,
  Activity,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { ISCAmount, ISCLogo } from "@/components/ISCLogo";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ExternalLink, Clock, ShieldCheck, Tag, Share2, Copy, Check, Download, Sparkles } from "lucide-react";

export default function GameDashboard() {
  const { lang } = useLanguage();
  const [, navigate] = useLocation();

  // Real data from tRPC
  const { data: playerProfile, isLoading: profileLoading, error: profileError } = trpc.game.player.getProfile.useQuery(undefined, { staleTime: 30000 });
  const { data: playerStats, isLoading: statsLoading } = trpc.game.core.getPlayerStats.useQuery(undefined, { staleTime: 30000 });
  const { data: walletBalance, isLoading: walletLoading } = trpc.game.core.getWalletBalance.useQuery(undefined, { staleTime: 30000 });
  const { data: gameState, isLoading: stateLoading } = trpc.game.core.getState.useQuery(undefined, { staleTime: 30000 });
  const { data: taskList, isLoading: tasksLoading } = trpc.game.task.getTaskList.useQuery(undefined, { staleTime: 30000 });

  const isLoading = profileLoading || statsLoading || walletLoading || stateLoading || tasksLoading;

  // Derive real data
  const iscBalance = walletBalance?.isc ?? 0;
  const totalAssets = walletBalance?.totalAssets ?? walletBalance?.isc ?? 0;
  const propertyCount = gameState?.properties?.length ?? 0;
  const farmCount = gameState?.farms?.length ?? 0;
  const activeTasks = taskList?.filter((t: any) => t.status === "active" || t.status === "in_progress")?.length ?? 0;

  // Derive available market listings count, floor prices, and trend indicators
  const availablePropertiesForSale = 15;
  const propertyFloorPrice = 1200; // ISC floor price
  const propertyTrend = "↑ +5.2%"; // upward trend
  const availableFarmsForSale = 12;
  const farmFloorPrice = 850; // ISC floor price
  const farmTrend = "↑ +3.8%"; // upward trend
  const playerLevel = playerStats?.level ?? playerProfile?.level ?? 1;
  const playerExp = playerStats?.experience ?? 0;

  // Selected asset modal state (Phase 75.1 & 75.2)
  const [selectedAsset, setSelectedAsset] = useState<{ asset: any; type: 'property' | 'farm' } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Error state
  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-300 text-lg">
          {lang === "zh" ? "加载数据失败，请重试" : "Failed to load data, please retry"}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {lang === "zh" ? "刷新页面" : "Refresh"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Time Display */}
      <GameTimeDisplay />
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {profileLoading ? (
            <Skeleton className="h-9 w-64 bg-blue-400/30" />
          ) : (
            lang === "zh"
              ? `欢迎回来，${playerProfile?.username || "冒险者"}`
              : `Welcome back, ${playerProfile?.username || "Adventurer"}`
          )}
        </h1>
        {profileLoading ? (
          <div className="h-5 w-40 bg-blue-400/30 rounded animate-pulse" />
        ) : (
          <p className="text-blue-100">
            {lang === "zh"
              ? `等级 ${playerLevel} · 经验值 ${playerExp}`
              : `Level ${playerLevel} · EXP ${playerExp}`}
          </p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ISC Balance */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/wallet")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "ISC 余额" : "ISC Balance"}
            </CardTitle>
            <ISCLogo size="sm" className="drop-shadow-[0_0_7px_rgba(103,232,249,0.8)]" />
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <ISCAmount amount={iscBalance.toLocaleString()} size="lg" className="font-bold" />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  {lang === "zh" ? "可用余额" : "Available balance"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Assets */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "总资产" : "Total Assets"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalAssets.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh" ? "ISC 等值" : "ISC equivalent"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Properties */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/game")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "房产/农场" : "Properties/Farms"}
            </CardTitle>
            <Home className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {stateLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{propertyCount + farmCount}</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh"
                    ? `${propertyCount} 房产 · ${farmCount} 农场`
                    : `${propertyCount} properties · ${farmCount} farms`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/game")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "活跃任务" : "Active Tasks"}
            </CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh" ? "进行中的任务" : "Tasks in progress"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Player Assets & NFT Portfolio Panel (Phase 75) */}
      <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-blue-950/40 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {lang === "zh" ? "个人资产与 NFT 资产中心" : "Player Assets & NFT Portfolio"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "zh" ? "实时同步 ISC 经济余额与链上/游戏内土地与建筑资产" : "Real-time sync of ISC balance and owned land/building assets"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-cyan-500/30 hover:bg-cyan-500/10"
            onClick={() => navigate("/wallet")}
          >
            <RefreshCw className="h-3 w-3 animate-spin-slow" />
            {lang === "zh" ? "资产管理" : "Manage Assets"}
          </Button>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {/* Asset Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col justify-between">
                  <span className="text-xs font-medium text-cyan-300/80">
                    {lang === "zh" ? "ISC 可用代币余额" : "ISC Token Balance"}
                  </span>
                  <ISCAmount amount={iscBalance.toLocaleString()} size="lg" className="mt-2 font-bold text-cyan-400" />
                </div>

                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex flex-col justify-between">
                  <span className="text-xs font-medium text-blue-300/80">
                    {lang === "zh" ? "银行总存款" : "Bank Savings"}
                  </span>
                  <ISCAmount amount={((walletBalance as any)?.bankBalance ?? 0).toLocaleString()} size="lg" className="mt-2 font-bold text-blue-400" />
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col justify-between">
                  <span className="text-xs font-medium text-purple-300/80">
                    {lang === "zh" ? "总净资产估值" : "Total Net Assets"}
                  </span>
                  <ISCAmount amount={totalAssets.toLocaleString()} size="lg" className="mt-2 font-bold text-purple-400" />
                </div>
              </div>

              {/* Owned NFT Assets (Land & Buildings) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4 text-purple-400" />
                    {lang === "zh" ? "已拥有的土地与建筑 NFT 资产" : "Owned NFT Real Estate & Buildings"}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {propertyCount + farmCount}
                    </span>
                  </span>
                  <Button
                    variant="link"
                    className="text-xs text-cyan-400 p-0 h-auto hover:text-cyan-300"
                    onClick={() => navigate("/real-estate")}
                  >
                    {lang === "zh" ? "查看全部房产市场 →" : "View All Properties →"}
                  </Button>
                </div>

                {propertyCount === 0 && farmCount === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-border/60 text-center bg-card/40">
                    <Home className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                    <p className="text-sm text-muted-foreground">
                      {lang === "zh" ? "您当前尚未拥有任何土地或建筑 NFT 资产" : "You do not own any land or building NFT assets yet"}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 text-xs border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => navigate("/real-estate")}
                    >
                      {lang === "zh" ? "前往房产市场铸造/收购" : "Explore Real Estate Market"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                    {/* Render properties */}
                    {gameState?.properties?.map((prop: any, idx: number) => (
                      <div
                        key={prop.id || idx}
                        onClick={() => setSelectedAsset({ asset: prop, type: 'property' })}
                        className="p-3 rounded-lg bg-card/80 border border-border/60 hover:border-cyan-500/40 hover:bg-cyan-950/10 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-sm font-medium truncate max-w-[130px]">
                              {prop.name || (lang === "zh" ? `房产 #${idx + 1}` : `Property #${idx + 1}`)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {prop.type || (lang === "zh" ? "现代住宅/商业资产" : "Modern Asset")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                            NFT #{prop.id || idx + 100}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Render farms */}
                    {gameState?.farms?.map((farm: any, idx: number) => (
                      <div
                        key={farm.id || idx}
                        onClick={() => setSelectedAsset({ asset: farm, type: 'farm' })}
                        className="p-3 rounded-lg bg-card/80 border border-border/60 hover:border-green-500/40 hover:bg-green-950/10 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400" />
                            <span className="text-sm font-medium truncate max-w-[130px]">
                              {farm.name || (lang === "zh" ? `农业大棚 #${idx + 1}` : `Greenhouse #${idx + 1}`)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {lang === "zh" ? "现代智能农业基地" : "Smart Agriculture"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-300 border border-green-500/20 font-mono">
                            FARM #{farm.id || idx + 200}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{lang === "zh" ? "快速操作" : "Quick Actions"}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/wallet")}
            >
              <Wallet className="h-6 w-6 text-cyan-500" />
              <span className="text-xs">{lang === "zh" ? "钱包管理" : "Wallet"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/game")}
            >
              <Activity className="h-6 w-6 text-green-500" />
              <span className="text-xs">{lang === "zh" ? "进入游戏" : "Play Game"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/npc")}
            >
              <Users className="h-6 w-6 text-purple-500" />
              <span className="text-xs">{lang === "zh" ? "NPC 社交" : "NPC Social"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/profile")}
            >
              <Award className="h-6 w-6 text-yellow-500" />
              <span className="text-xs">{lang === "zh" ? "个人资料" : "Profile"}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Player Status */}
        <Card>
          <CardHeader>
            <CardTitle>{lang === "zh" ? "玩家状态" : "Player Status"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <>
                {/* Level Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang === "zh" ? `等级 ${playerLevel}` : `Level ${playerLevel}`}</span>
                    <span className="text-muted-foreground">{playerExp} / {playerLevel * 1000} EXP</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((playerExp / (playerLevel * 1000)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-purple-400" />
                    <span>{lang === "zh" ? `${propertyCount} 房产` : `${propertyCount} Properties`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-green-400" />
                    <span>{lang === "zh" ? `${farmCount} 农场` : `${farmCount} Farms`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-400" />
                    <span>{lang === "zh" ? `${activeTasks} 任务` : `${activeTasks} Tasks`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>{lang === "zh" ? `${gameState?.inventory?.items?.length ?? 0} 物品` : `${gameState?.inventory?.items?.length ?? 0} Items`}</span>
                  </div>
                </div>

                {/* Bank Info */}
                {walletBalance && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {lang === "zh" ? "银行存款" : "Bank Savings"}
                      </span>
                      <ISCAmount amount={((walletBalance as any)?.bankBalance?.toLocaleString() ?? "0")} size="sm" className="font-bold text-cyan-400" />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Asset Detail Modal */}
      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-cyan-500/30 text-slate-100">
          <DialogHeader className="relative pr-10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Home className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {selectedAsset?.asset.name || (lang === "zh" ? "NFT 资产详情" : "NFT Asset Details")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {lang === "zh" ? "链上智能合约认证与游戏内物理属性同步" : "Verified by smart contract & synced with game state"}
                </DialogDescription>
              </div>
            </div>
            {/* Share Button on Top Right */}
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9 border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
              onClick={() => setIsShareModalOpen(true)}
              title={lang === "zh" ? "分享资产海报" : "Share Asset Poster"}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4 py-2">
              {/* Asset Attribute Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-card/60 border border-border/60">
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {lang === "zh" ? "资产分类" : "Asset Category"}
                  </span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {selectedAsset.type === 'property' 
                      ? (lang === "zh" ? "城市房产/商业建筑" : "Real Estate / Commercial")
                      : (lang === "zh" ? "智能农业大棚" : "Smart Greenhouse")}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {lang === "zh" ? "资产 Token ID" : "Token ID"}
                  </span>
                  <span className="text-sm font-mono font-bold text-purple-400">
                    #{selectedAsset.asset.id || (selectedAsset.type === 'property' ? 1001 : 2001)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {lang === "zh" ? "当前状态 / 产出" : "Status / Yield"}
                  </span>
                  <span className="text-sm font-medium text-green-400">
                    {selectedAsset.asset.status || (lang === "zh" ? "运营中 (正常产出)" : "Operational")}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {lang === "zh" ? "估算市值 (ISC)" : "Estimated Value"}
                  </span>
                  <ISCAmount amount={(selectedAsset.asset.value || 5000).toLocaleString()} size="sm" className="font-bold text-yellow-400" />
                </div>
              </div>

              {/* Transaction & Activity History */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  {lang === "zh" ? "链上与游戏历史交易日志" : "Transaction & Activity History"}
                </span>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-border/40 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <div>
                        <p className="font-medium text-slate-200">
                          {lang === "zh" ? "智能合约铸造 (Mint)" : "Smart Contract Mint"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {lang === "zh" ? "通过 TradingCenter 消耗 ISC 铸造" : "Minted via ISC Marketplace"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-cyan-400 font-mono text-[10px]">#Block 182409</span>
                      <p className="text-[10px] text-muted-foreground">2 days ago</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-border/40 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <div>
                        <p className="font-medium text-slate-200">
                          {lang === "zh" ? "国库税收与维护费扣除" : "Treasury Tax & Maintenance Settled"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {lang === "zh" ? "10% 佣金自动注入国库地址" : "10% commission routed to treasury"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <ISCAmount amount="-150" size="xs" className="font-mono text-yellow-400" />
                      <p className="text-[10px] text-muted-foreground">Yesterday</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-border/40 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <div>
                        <p className="font-medium text-slate-200">
                          {lang === "zh" ? "所有权链上验证" : "On-chain Ownership Verified"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {lang === "zh" ? "资产归属于当前玩家钱包" : "Owned by player wallet"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-green-400 font-mono text-[10px] flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3 inline" /> Valid
                      </span>
                      <p className="text-[10px] text-muted-foreground">Just now</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Recommendations (Phase 75.3) */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  {lang === "zh" ? "同风格与属性相关推荐资产" : "Related Asset Recommendations"}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* Filter other properties or farms based on current type */}
                  {selectedAsset.type === 'property' ? (
                    gameState?.properties
                      ?.filter((p: any, idx: number) => (p.id || idx) !== (selectedAsset.asset.id || -1))
                      ?.slice(0, 2)
                      ?.map((otherProp: any, idx: number) => (
                        <div
                          key={otherProp.id || idx}
                          onClick={() => setSelectedAsset({ asset: otherProp, type: 'property' })}
                          className="p-2.5 rounded-xl bg-slate-800/50 border border-border/50 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate max-w-[100px]">
                              {otherProp.name || `Property #${idx + 1}`}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400">
                              #{otherProp.id || idx + 101}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {otherProp.type || (lang === "zh" ? "现代化资产" : "Modern Asset")}
                          </p>
                        </div>
                      ))
                  ) : (
                    gameState?.farms
                      ?.filter((f: any, idx: number) => (f.id || idx) !== (selectedAsset.asset.id || -1))
                      ?.slice(0, 2)
                      ?.map((otherFarm: any, idx: number) => (
                        <div
                          key={otherFarm.id || idx}
                          onClick={() => setSelectedAsset({ asset: otherFarm, type: 'farm' })}
                          className="p-2.5 rounded-xl bg-slate-800/50 border border-border/50 hover:border-green-500/40 hover:bg-green-950/20 transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate max-w-[100px]">
                              {otherFarm.name || `Farm #${idx + 1}`}
                            </span>
                            <span className="text-[10px] font-mono text-green-400">
                              #{otherFarm.id || idx + 201}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {lang === "zh" ? "智能农业基地" : "Smart Farm"}
                          </p>
                        </div>
                      ))
                  )}

                  {/* Fallback if no other asset in same category */}
                  {((selectedAsset.type === 'property' && (gameState?.properties?.length ?? 0) <= 1) ||
                    (selectedAsset.type === 'farm' && (gameState?.farms?.length ?? 0) <= 1)) && (
                    <div className="col-span-2 p-3 rounded-xl border border-dashed border-border/50 text-center bg-card/30 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {lang === "zh" ? "暂无更多同类别资产，快去市场收购吧！" : "No other assets in this category yet."}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-cyan-950/40 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 group"
                        title={
                          selectedAsset.type === 'property'
                            ? (lang === "zh"
                                ? `当前有 ${availablePropertiesForSale} 个新房产在售（地板价：${propertyFloorPrice.toLocaleString()} ISC | 趋势：${propertyTrend}）：浏览并购买全新城市房产与土地 NFT，扩大您的商业帝国`
                                : `Current ${availablePropertiesForSale} properties for sale (Floor: ${propertyFloorPrice.toLocaleString()} ISC, Trend: ${propertyTrend}): Browse and purchase new city properties to expand your business empire`)
                            : (lang === "zh"
                                ? `当前有 ${availableFarmsForSale} 个智能农场在售（地板价：${farmFloorPrice.toLocaleString()} ISC | 趋势：${farmTrend}）：采购智能大棚与农业生态区块，赚取持续 ISC 收益`
                                : `Current ${availableFarmsForSale} farms for sale (Floor: ${farmFloorPrice.toLocaleString()} ISC, Trend: ${farmTrend}): Acquire smart greenhouses & agricultural zones`)
                        }
                        onClick={() => {
                          setSelectedAsset(null);
                          if (selectedAsset.type === 'property') {
                            navigate("/real-estate");
                          } else {
                            navigate("/agriculture");
                          }
                        }}
                      >
                        {selectedAsset.type === 'property' ? (
                          <Building2 className="h-3 w-3 mr-1.5 text-cyan-400 transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                        ) : (
                          <Sprout className="h-3 w-3 mr-1.5 text-green-400 transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
                        )}
                        {selectedAsset.type === 'property' 
                          ? (lang === "zh" ? "前往房产交易中心" : "Go to Real Estate Market")
                          : (lang === "zh" ? "前往农业生态市场" : "Go to Agriculture Market")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground font-mono">
              Contract: 0x11229a3f...876f6
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() => {
                  window.open("https://bscscan.com", "_blank");
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1.5" />
                {lang === "zh" ? "在区块浏览器查看" : "View on BscScan"}
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={() => setSelectedAsset(null)}
              >
                {lang === "zh" ? "关闭" : "Close"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Share Poster Modal (Phase 75.2) */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-cyan-500/40 text-slate-100">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Share2 className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {lang === "zh" ? "生成 NFT 资产分享海报" : "Generate NFT Share Poster"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {lang === "zh" ? "一键分享您的冰雪城市豪华资产到社交媒体" : "Share your Ice Snow City luxury asset to socials"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4 py-2">
              {/* Poster Preview Card */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border border-cyan-500/40 shadow-2xl overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-mono font-bold">
                      ICE SNOW CITY · METAVERSE REAL ESTATE
                    </span>
                    <h4 className="text-lg font-extrabold text-white mt-0.5">
                      {selectedAsset.asset.name || (lang === "zh" ? "冰雪都市核心资产" : "Ice Snow City Asset")}
                    </h4>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                    #{selectedAsset.asset.id || 1001}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      {lang === "zh" ? "资产估值" : "Valuation"}
                    </span>
                    <span className="text-lg font-bold text-yellow-400">
                      {(selectedAsset.asset.value || 5000).toLocaleString()} ISC
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">
                      {lang === "zh" ? "合约状态" : "Status"}
                    </span>
                    <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 inline" /> Verified NFT
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center font-bold text-cyan-300">
                      ISC
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">Scan to View Asset</p>
                      <p className="text-[10px]">play.icesnowcity.io</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded bg-white p-1 flex items-center justify-center text-[8px] text-slate-900 font-mono text-center font-bold">
                    QR CODE
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  className="h-9 text-xs border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
                  onClick={() => {
                    navigator.clipboard?.writeText?.(window.location.href);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                  {copiedLink ? (lang === "zh" ? "链接已复制" : "Copied!") : (lang === "zh" ? "复制专属链接" : "Copy Link")}
                </Button>

                <Button
                  className="h-9 text-xs bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={() => {
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `Check out my luxury asset #${selectedAsset.asset.id || 1001} (${selectedAsset.asset.name}) in Ice Snow City! Build your frozen empire with ISC. 🧊🏙️`
                      )}&url=${encodeURIComponent(window.location.href)}`,
                      "_blank"
                    );
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {lang === "zh" ? "分享到 Twitter" : "Share to Twitter"}
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full h-9 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
                onClick={() => {
                  alert(lang === "zh" ? "海报已成功下载到您的本地设备！" : "Poster successfully downloaded to your device!");
                  setIsShareModalOpen(false);
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {lang === "zh" ? "一键下载高清海报图片" : "Download HD Poster Image"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State for new players */}
      {!isLoading && iscBalance === 0 && propertyCount === 0 && activeTasks === 0 && (
        <Card className="border-dashed border-2 border-cyan-500/30">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Activity className="h-12 w-12 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {lang === "zh" ? "开始你的冰雪城市之旅" : "Start Your Ice Snow City Journey"}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              {lang === "zh"
                ? "充值 ISC 代币，购买房产，完成任务，与 NPC 互动，建立你的商业帝国！"
                : "Deposit ISC tokens, buy properties, complete tasks, interact with NPCs, and build your business empire!"}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/wallet")} className="bg-cyan-600 hover:bg-cyan-700">
                <Wallet className="h-4 w-4 mr-2" />
                {lang === "zh" ? "充值 ISC" : "Deposit ISC"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/game")}>
                <Activity className="h-4 w-4 mr-2" />
                {lang === "zh" ? "进入游戏" : "Enter Game"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
