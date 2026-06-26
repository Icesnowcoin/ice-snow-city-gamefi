import { useLanguage } from "@/contexts/LanguageContext";
import { usePlayerProfile, usePlayerAssets, useWalletBalance } from "@/hooks/useGameData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Wallet,
  TrendingUp,
  Users,
  ShoppingCart,
  Home,
  Sprout,
  Award,
  Activity,
} from "lucide-react";

// Mock data for charts
const economyData = [
  { time: "00:00", price: 100, volume: 4000 },
  { time: "04:00", price: 105, volume: 3000 },
  { time: "08:00", price: 102, volume: 2000 },
  { time: "12:00", price: 108, volume: 2780 },
  { time: "16:00", price: 110, volume: 1890 },
  { time: "20:00", price: 115, volume: 2390 },
  { time: "24:00", price: 120, volume: 2500 },
];

const npcActivityData = [
  { name: "商人", value: 45 },
  { name: "农民", value: 32 },
  { name: "工人", value: 28 },
  { name: "艺术家", value: 22 },
  { name: "医生", value: 18 },
];

export default function GameDashboard() {
  const { lang } = useLanguage();
  const { data: player, isLoading: playerLoading } = usePlayerProfile();
  const { data: assets, isLoading: assetsLoading } = usePlayerAssets();
  const { data: wallet, isLoading: walletLoading } = useWalletBalance();

  const isLoading = playerLoading || assetsLoading || walletLoading;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {lang === "zh" ? "欢迎来到冰雪城市" : "Welcome to Ice Snow City"}
        </h1>
        <p className="text-blue-100">
          {lang === "zh"
            ? "在这个充满机遇的城市中开始你的经营之旅"
            : "Start your business journey in this city full of opportunities"}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ISC Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "ISC 余额" : "ISC Balance"}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{wallet?.isc.toString() || "0"}</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh" ? "可用余额" : "Available balance"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "总资产" : "Total Assets"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{wallet?.totalAssets.toString() || "0"}</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh" ? "总资产" : "Total assets"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Properties */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "房产数量" : "Properties"}
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh" ? "拥有房产" : "Properties owned"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Quests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "zh" ? "活跃任务" : "Active Quests"}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{player?.level || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh" ? "当前等级" : "Current level"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Economy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{lang === "zh" ? "ISC 价格趋势" : "ISC Price Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={economyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  name={lang === "zh" ? "价格" : "Price"}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NPC Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{lang === "zh" ? "NPC 职业分布" : "NPC Profession Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={npcActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#06b6d4" name={lang === "zh" ? "数量" : "Count"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{lang === "zh" ? "快速操作" : "Quick Actions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-xs">{lang === "zh" ? "购物" : "Shop"}</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Home className="h-6 w-6" />
              <span className="text-xs">{lang === "zh" ? "房产" : "Property"}</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Sprout className="h-6 w-6" />
              <span className="text-xs">{lang === "zh" ? "农业" : "Farm"}</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Users className="h-6 w-6" />
              <span className="text-xs">{lang === "zh" ? "NPC" : "NPC"}</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Activity className="h-6 w-6" />
              <span className="text-xs">{lang === "zh" ? "任务" : "Tasks"}</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Wallet className="h-6 w-6" />
              <span className="text-xs">{lang === "zh" ? "钱包" : "Wallet"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>{lang === "zh" ? "最近活动" : "Recent Activities"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                    {i}
                  </div>
                  <div>
                    <p className="font-medium">
                      {lang === "zh" ? `活动 ${i}` : `Activity ${i}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lang === "zh" ? "2 小时前" : "2 hours ago"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">+100 ISC</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
