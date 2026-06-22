import { useLanguage } from "@/contexts/LanguageContext";
import { usePlayerProfile } from "@/hooks/useGameData";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Award,
  TrendingUp,
  Calendar,
  MapPin,
  Mail,
  Edit2,
  Trophy,
  Star,
  Zap,
} from "lucide-react";

export default function PlayerProfile() {
  const { t, lang } = useLanguage();
  const { data: player, isLoading: playerLoading } = usePlayerProfile();

  const mockAchievements = [
    { id: 1, name: lang === "zh" ? "首次交易" : "First Trade", icon: "🎯", progress: 100 },
    { id: 2, name: lang === "zh" ? "富豪" : "Millionaire", icon: "💰", progress: 75 },
    { id: 3, name: lang === "zh" ? "房地产大亨" : "Real Estate Tycoon", icon: "🏠", progress: 50 },
    { id: 4, name: lang === "zh" ? "农业专家" : "Agriculture Expert", icon: "🌾", progress: 30 },
    { id: 5, name: lang === "zh" ? "社交大师" : "Social Master", icon: "👥", progress: 60 },
    { id: 6, name: lang === "zh" ? "任务完成者" : "Quest Completer", icon: "✅", progress: 85 },
  ];
  const achievements = mockAchievements;

  const mockPlayer = (player as any) || { level: 42, experience: 8500, totalExperience: 10000, username: "Player" };

  const statistics = [
    { label: lang === "zh" ? "总交易数" : "Total Trades", value: "234" },
    { label: lang === "zh" ? "成功率" : "Success Rate", value: "98.5%" },
    { label: lang === "zh" ? "平均交易额" : "Avg Trade", value: "156.78 ISC" },
    { label: lang === "zh" ? "总收入" : "Total Income", value: "12,345.67 ISC" },
    { label: lang === "zh" ? "总支出" : "Total Expense", value: "8,234.56 ISC" },
    { label: lang === "zh" ? "净利润" : "Net Profit", value: "4,111.11 ISC" },
  ];

  const badges = [
    { name: lang === "zh" ? "新手" : "Newcomer", color: "bg-blue-500" },
    { name: lang === "zh" ? "商人" : "Merchant", color: "bg-green-500" },
    { name: lang === "zh" ? "投资者" : "Investor", color: "bg-purple-500" },
    { name: lang === "zh" ? "社交达人" : "Socialite", color: "bg-pink-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-5xl font-bold">
                U
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit2 className="w-4 h-4" />
                {lang === "zh" ? "编辑资料" : "Edit Profile"}
              </Button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">玩家昵称</h1>
                <p className="text-muted-foreground">Player ID: #123456789</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{lang === "zh" ? "等级" : "Level"}</p>
                  <p className="text-3xl font-bold">{mockPlayer.level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{lang === "zh" ? "经验值" : "Experience"}</p>
                  <p className="text-2xl font-bold">{mockPlayer.experience}/{(mockPlayer as any).totalExperience || 10000}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{lang === "zh" ? "排名" : "Ranking"}</p>
                  <p className="text-2xl font-bold text-yellow-500">#42</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{lang === "zh" ? "加入时间" : "Joined"}</p>
                  <p className="text-sm">2026-01-15</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{lang === "zh" ? "升级进度" : "Level Progress"}</p>
                <Progress value={(mockPlayer.experience / ((mockPlayer as any).totalExperience || 10000)) * 100} className="h-2" />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <Badge key={badge.name} className={`${badge.color} text-white`}>
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>player@example.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{lang === "zh" ? "冰雪城市" : "Ice Snow City"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{lang === "zh" ? "最后活动: 2 小时前" : "Last Active: 2h ago"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="w-4 h-4" />
            {lang === "zh" ? "成就" : "Achievements"}
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            {lang === "zh" ? "统计" : "Statistics"}
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Star className="w-4 h-4" />
            {lang === "zh" ? "社交" : "Social"}
          </TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "zh" ? "成就列表" : "Achievement List"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement: any) => (
                  <div key={achievement.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{achievement.icon}</div>
                      <span className="text-sm font-medium">{achievement.progress}%</span>
                    </div>
                    <h3 className="font-medium">{achievement.name}</h3>
                    <Progress value={achievement.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "zh" ? "游戏统计" : "Game Statistics"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statistics.map((stat: any, index: number) => (
                  <div key={index} className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "zh" ? "社交关系" : "Social Connections"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{lang === "zh" ? "好友" : "Friends"}</p>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "已添加 42 个好友" : "42 friends added"}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {lang === "zh" ? "管理" : "Manage"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{lang === "zh" ? "粉丝" : "Followers"}</p>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "获得 156 个粉丝" : "156 followers"}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {lang === "zh" ? "查看" : "View"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{lang === "zh" ? "公会" : "Guild"}</p>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "加入公会: 冰雪商人团" : "Guild: Ice Snow Merchants"}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {lang === "zh" ? "详情" : "Details"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{lang === "zh" ? "最近活动" : "Recent Activity"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white">
                    <Zap className="w-5 h-5" />
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
