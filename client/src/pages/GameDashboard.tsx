import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  TrendingUp,
  Users,
  Home,
  Sprout,
  Award,
  Activity,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";

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
  const playerLevel = playerStats?.level ?? playerProfile?.level ?? 1;
  const playerExp = playerStats?.experience ?? 0;

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
        <p className="text-blue-100">
          {profileLoading ? (
            <Skeleton className="h-5 w-40 bg-blue-400/30" />
          ) : (
            lang === "zh"
              ? `等级 ${playerLevel} · 经验值 ${playerExp}`
              : `Level ${playerLevel} · EXP ${playerExp}`
          )}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ISC Balance */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/wallet")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "ISC 余额" : "ISC Balance"}
            </CardTitle>
            <Wallet className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{iscBalance.toLocaleString()}</div>
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
                      <span className="font-bold text-cyan-400">
                        {(walletBalance as any)?.bankBalance?.toLocaleString() ?? "0"} ISC
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
