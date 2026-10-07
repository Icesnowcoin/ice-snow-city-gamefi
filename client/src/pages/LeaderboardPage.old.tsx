import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Medal, TrendingUp, DollarSign, Zap, Users } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
  change?: number;
  isCurrentPlayer?: boolean;
}

const LEADERBOARD_TYPES = [
  { id: "wealth", name: "财富排行", icon: <DollarSign className="w-4 h-4" />, unit: "ISC" },
  { id: "level", name: "等级排行", icon: <TrendingUp className="w-4 h-4" />, unit: "Level" },
  { id: "experience", name: "经验排行", icon: <Zap className="w-4 h-4" />, unit: "XP" },
  { id: "social", name: "社交排行", icon: <Users className="w-4 h-4" />, unit: "关系" },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>("wealth");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch game state for mock data
  const { data: gameState, isLoading: isLoadingState } = trpc.game.core.getState.useQuery();

  // Mock leaderboard data
  const leaderboards = useMemo(() => {
    if (!gameState?.player) return {};

    const mockLeaderboards: Record<string, LeaderboardEntry[]> = {
      wealth: [
        { rank: 1, playerId: "p001", playerName: "金币大亨", value: 1000000, change: 5 },
        { rank: 2, playerId: "p002", playerName: "富豪", value: 850000, change: -2 },
        { rank: 3, playerId: "p003", playerName: "商业精英", value: 750000, change: 8 },
        { rank: 4, playerId: "p004", playerName: "投资家", value: 650000, change: 3 },
        { rank: 5, playerId: "p005", playerName: "创业者", value: 550000, change: 12 },
        {
          rank: 6,
          playerId: (user?.id as unknown as string) || "current",
          playerName: (user?.name as unknown as string) || "你",
          value: (gameState.player as any).wallet?.balance || 50000,
          change: 2,
          isCurrentPlayer: true,
        },
        { rank: 7, playerId: "p006", playerName: "新手", value: 45000, change: -1 },
        { rank: 8, playerId: "p007", playerName: "探险家", value: 40000, change: 4 },
        { rank: 9, playerId: "p008", playerName: "冒险者", value: 35000, change: 0 },
        { rank: 10, playerId: "p009", playerName: "学徒", value: 30000, change: -3 },
      ],
      level: [
        { rank: 1, playerId: "p001", playerName: "传奇玩家", value: 50, change: 0 },
        { rank: 2, playerId: "p002", playerName: "大师", value: 48, change: 1 },
        { rank: 3, playerId: "p003", playerName: "高手", value: 45, change: 2 },
        { rank: 4, playerId: "p004", playerName: "能手", value: 42, change: -1 },
        { rank: 5, playerId: "p005", playerName: "老手", value: 40, change: 3 },
        {
          rank: 6,
          playerId: (user?.id as unknown as string) || "current",
          playerName: (user?.name as unknown as string) || "你",
          value: (gameState.player as any).level || 25,
          change: 1,
          isCurrentPlayer: true,
        },
        { rank: 7, playerId: "p006", playerName: "新人", value: 20, change: 2 },
        { rank: 8, playerId: "p007", playerName: "初学者", value: 18, change: 0 },
        { rank: 9, playerId: "p008", playerName: "萌新", value: 15, change: -1 },
        { rank: 10, playerId: "p009", playerName: "菜鸟", value: 12, change: 1 },
      ],
      experience: [
        { rank: 1, playerId: "p001", playerName: "经验大师", value: 500000, change: 5 },
        { rank: 2, playerId: "p002", playerName: "经验丰富", value: 450000, change: -2 },
        { rank: 3, playerId: "p003", playerName: "资深玩家", value: 400000, change: 8 },
        { rank: 4, playerId: "p004", playerName: "老司机", value: 350000, change: 3 },
        { rank: 5, playerId: "p005", playerName: "经验者", value: 300000, change: 12 },
        {
          rank: 6,
          playerId: (user?.id as unknown as string) || "current",
          playerName: (user?.name as unknown as string) || "你",
          value: 150000,
          change: 2,
          isCurrentPlayer: true,
        },
        { rank: 7, playerId: "p006", playerName: "学习者", value: 100000, change: -1 },
        { rank: 8, playerId: "p007", playerName: "探索者", value: 80000, change: 4 },
        { rank: 9, playerId: "p008", playerName: "冒险者", value: 60000, change: 0 },
        { rank: 10, playerId: "p009", playerName: "新手", value: 40000, change: -3 },
      ],
      social: [
        { rank: 1, playerId: "p001", playerName: "社交达人", value: 150, change: 5 },
        { rank: 2, playerId: "p002", playerName: "人脉王", value: 140, change: -2 },
        { rank: 3, playerId: "p003", playerName: "交际花", value: 130, change: 8 },
        { rank: 4, playerId: "p004", playerName: "朋友圈", value: 120, change: 3 },
        { rank: 5, playerId: "p005", playerName: "社交家", value: 110, change: 12 },
        {
          rank: 6,
          playerId: (user?.id as unknown as string) || "current",
          playerName: (user?.name as unknown as string) || "你",
          value: 50,
          change: 2,
          isCurrentPlayer: true,
        },
        { rank: 7, playerId: "p006", playerName: "交友者", value: 40, change: -1 },
        { rank: 8, playerId: "p007", playerName: "社交新手", value: 30, change: 4 },
        { rank: 9, playerId: "p008", playerName: "孤独者", value: 20, change: 0 },
        { rank: 10, playerId: "p009", playerName: "隐士", value: 10, change: -3 },
      ],
    };

    return mockLeaderboards;
  }, [gameState, user]);

  const currentLeaderboard = leaderboards[selectedType] || [];

  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery) return currentLeaderboard;
    return currentLeaderboard.filter((entry) =>
      entry.playerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentLeaderboard, searchQuery]);

  const currentPlayerRank = useMemo(() => {
    return currentLeaderboard.find((entry) => entry.isCurrentPlayer);
  }, [currentLeaderboard]);

  const leaderboardType = LEADERBOARD_TYPES.find((t) => t.id === selectedType);

  if (isLoadingState) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">排行榜</h1>
        </div>
        <p className="text-muted-foreground">查看全球玩家排名和统计数据</p>
      </div>

      {/* Current Player Rank Card */}
      {currentPlayerRank && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">你的排名</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">排名</p>
                <p className="text-2xl font-bold text-blue-600">#{currentPlayerRank.rank}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">数值</p>
                <p className="text-2xl font-bold">{currentPlayerRank.value.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">排名变化</p>
                <p
                  className={`text-2xl font-bold ${
                    (currentPlayerRank.change ?? 0) > 0
                      ? "text-green-600"
                      : (currentPlayerRank.change ?? 0) < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {(currentPlayerRank.change ?? 0) > 0 ? "↑" : (currentPlayerRank.change ?? 0) < 0 ? "↓" : "→"}
                  {Math.abs(currentPlayerRank.change ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">单位</p>
                <p className="text-2xl font-bold">{leaderboardType?.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid w-full grid-cols-4">
        {LEADERBOARD_TYPES.map((type) => (
          <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-1">
              {type.icon}
              <span className="hidden sm:inline">{type.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {LEADERBOARD_TYPES.map((type) => (
          <TabsContent key={type.id} value={type.id} className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="搜索玩家名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4"
              />
            </div>

            {/* Leaderboard Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">排名</TableHead>
                        <TableHead>玩家名称</TableHead>
                        <TableHead className="text-right">{type.unit}</TableHead>
                        <TableHead className="text-right">变化</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaderboard.map((entry) => (
                        <TableRow
                          key={entry.playerId}
                          className={entry.isCurrentPlayer ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {entry.rank === 1 && <Crown className="w-5 h-5 text-yellow-500" />}
                              {entry.rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                              {entry.rank === 3 && <Medal className="w-5 h-5 text-orange-600" />}
                              <span className="font-bold">#{entry.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{entry.playerName}</span>
                              {entry.isCurrentPlayer && <Badge className="bg-blue-600">你</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {entry.value.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-semibold ${
                                (entry.change ?? 0) > 0
                                  ? "text-green-600"
                                  : (entry.change ?? 0) < 0
                                    ? "text-red-600"
                                    : "text-gray-600"
                              }`}
                            >
                              {(entry.change ?? 0) > 0 ? "↑" : (entry.change ?? 0) < 0 ? "↓" : "→"}
                              {Math.abs(entry.change ?? 0)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {filteredLeaderboard.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  没有找到匹配的玩家
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">图例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>第 1 名</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-gray-400" />
              <span>第 2 名</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-orange-600" />
              <span>第 3 名</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
