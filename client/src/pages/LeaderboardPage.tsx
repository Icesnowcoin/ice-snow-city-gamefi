"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Crown, Medal, TrendingUp, DollarSign, Zap, Users, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
  change?: number;
  isCurrentPlayer?: boolean;
}

const LEADERBOARD_TYPES = [
  { id: "wealth", name: "财富排行", icon: <DollarSign className="w-4 h-4" />, unit: "ISC", method: "getWealthRanking" },
  { id: "level", name: "等级排行", icon: <TrendingUp className="w-4 h-4" />, unit: "Level", method: "getLevelRanking" },
  { id: "experience", name: "经验排行", icon: <Zap className="w-4 h-4" />, unit: "XP", method: "getExperienceRanking" },
  { id: "social", name: "社交排行", icon: <Users className="w-4 h-4" />, unit: "关系", method: "getSocialRanking" },
];

export default function LeaderboardPageEnhanced() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>("wealth");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch leaderboard data based on selected type
  const { data: wealthRanking = [], isLoading: isLoadingWealth, refetch: refetchWealth } = 
    trpc.game.leaderboard.getWealthRanking.useQuery(undefined, { enabled: selectedType === "wealth" });
  
  const { data: levelRanking = [], isLoading: isLoadingLevel, refetch: refetchLevel } = 
    trpc.game.leaderboard.getLevelRanking.useQuery(undefined, { enabled: selectedType === "level" });
  
  const { data: experienceRanking = [], isLoading: isLoadingExperience, refetch: refetchExperience } = 
    trpc.game.leaderboard.getExperienceRanking.useQuery(undefined, { enabled: selectedType === "experience" });
  
  const { data: socialRanking = [], isLoading: isLoadingSocial, refetch: refetchSocial } = 
    trpc.game.leaderboard.getSocialRanking.useQuery(undefined, { enabled: selectedType === "social" });

  // Get current player rank
  const { data: playerRank } = trpc.game.leaderboard.getPlayerRank.useQuery(
    { type: selectedType as "wealth" | "level" | "experience" | "social" }
  );

  // Determine which data to display
  const leaderboardData = useMemo(() => {
    switch (selectedType) {
      case "wealth":
        return wealthRanking;
      case "level":
        return levelRanking;
      case "experience":
        return experienceRanking;
      case "social":
        return socialRanking;
      default:
        return [];
    }
  }, [selectedType, wealthRanking, levelRanking, experienceRanking, socialRanking]);

  const isLoading = useMemo(() => {
    switch (selectedType) {
      case "wealth":
        return isLoadingWealth;
      case "level":
        return isLoadingLevel;
      case "experience":
        return isLoadingExperience;
      case "social":
        return isLoadingSocial;
      default:
        return false;
    }
  }, [selectedType, isLoadingWealth, isLoadingLevel, isLoadingExperience, isLoadingSocial]);

  // Filter leaderboard data based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery) return leaderboardData;
    return leaderboardData.filter((entry: any) =>
      entry.playerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leaderboardData, searchQuery]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      switch (selectedType) {
        case "wealth":
          await refetchWealth();
          break;
        case "level":
          await refetchLevel();
          break;
        case "experience":
          await refetchExperience();
          break;
        case "social":
          await refetchSocial();
          break;
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedType]);

  const getRankMedal = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-muted-foreground font-semibold">#{rank}</span>;
  };

  const getTrendIcon = (change?: number) => {
    if (!change) return null;
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const currentLeaderboardType = LEADERBOARD_TYPES.find(t => t.id === selectedType);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">排行榜</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "刷新中..." : "刷新"}
          </Button>
        </div>
        <p className="text-muted-foreground">查看全服玩家排名，与其他玩家竞争</p>
      </div>

      {/* Player Rank Card */}
      {playerRank && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">你的排名</p>
                <p className="text-2xl font-bold">第 {playerRank.rank} 名</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">当前数值</p>
                <p className="text-2xl font-bold">{playerRank.value} {currentLeaderboardType?.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {LEADERBOARD_TYPES.map((type) => (
            <TabsTrigger key={type.id} value={type.id} className="gap-2">
              {type.icon}
              <span className="hidden sm:inline">{type.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {LEADERBOARD_TYPES.map((type) => (
          <TabsContent key={type.id} value={type.id} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="搜索玩家名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Loading State */}
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-12 bg-muted rounded-lg animate-pulse"
                        style={{
                          animationDelay: `${i * 100}ms`,
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Leaderboard Table */
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">排名</TableHead>
                        <TableHead>玩家</TableHead>
                        <TableHead className="text-right">{type.unit}</TableHead>
                        <TableHead className="text-right">变化</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaderboard.length > 0 ? (
                        filteredLeaderboard.map((entry: any, index: number) => (
                          <TableRow
                            key={entry.playerId}
                            className={`transition-all duration-300 ${
                              entry.isCurrentPlayer ? "bg-blue-500/10" : ""
                            } hover:bg-muted/50`}
                            style={{
                              animation: `slideIn 0.3s ease-out ${index * 50}ms both`,
                            }}
                          >
                            <TableCell className="font-semibold">
                              <div className="flex items-center justify-center">
                                {getRankMedal(entry.rank)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{entry.playerName}</span>
                                {entry.isCurrentPlayer && (
                                  <Badge variant="secondary" className="text-xs">
                                    你
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {entry.value?.toLocaleString() || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {getTrendIcon(entry.change)}
                                <span
                                  className={
                                    entry.change && entry.change > 0
                                      ? "text-green-500"
                                      : entry.change && entry.change < 0
                                      ? "text-red-500"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {entry.change ? (entry.change > 0 ? "+" : "") + entry.change : "-"}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            没有找到匹配的玩家
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
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
        }
      `}</style>
    </div>
  );
}
