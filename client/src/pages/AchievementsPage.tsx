import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Users, Leaf, Home, Sparkles } from "lucide-react";

interface AchievementDisplay {
  id: string;
  name: string;
  description: string;
  category: string;
  isUnlocked: boolean;
  unlockedAt?: number;
  reward?: {
    money?: number;
    isc?: number;
    experience?: number;
  };
  icon?: string;
  progress?: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  progress: <Star className="w-5 h-5" />,
  wealth: <Zap className="w-5 h-5" />,
  social: <Users className="w-5 h-5" />,
  farming: <Leaf className="w-5 h-5" />,
  property: <Home className="w-5 h-5" />,
  special: <Sparkles className="w-5 h-5" />,
};

const CATEGORY_NAMES: Record<string, string> = {
  progress: "进度成就",
  wealth: "财富成就",
  social: "社交成就",
  farming: "农业成就",
  property: "房产成就",
  special: "特殊成就",
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch all available achievements
  const { data: allAchievements = [], isLoading: isLoadingAll } = trpc.game.achievement.getList.useQuery();
  
  // Fetch player's unlocked achievements
  const { data: unlockedAchievements = [], isLoading: isLoadingUnlocked } = trpc.game.achievement.getUnlocked.useQuery();
  
  // Fetch achievement progress
  const { data: progress } = trpc.game.achievement.checkProgress.useQuery();

  // Combine achievements data
  const achievements: AchievementDisplay[] = useMemo(() => {
    if (!allAchievements || allAchievements.length === 0) return [];

    const unlockedIds = new Set(unlockedAchievements?.map((a: any) => a.id) || []);
    const achievementsList: AchievementDisplay[] = allAchievements.map((achievement: any) => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        isUnlocked: unlockedIds.has(achievement.id),
        unlockedAt: unlockedIds.has(achievement.id) ? Date.now() : undefined,
        reward: achievement.reward,
      }));

    return achievementsList;
  }, [allAchievements, unlockedAchievements]);

  const unlockedCount = progress?.unlocked || 0;
  const totalCount = progress?.total || 0;
  const completionPercentage = progress?.percentage || 0;

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const categories = ["all", ...Object.keys(CATEGORY_NAMES)] as const;

  const isLoading = isLoadingAll || isLoadingUnlocked;

  if (isLoading) {
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
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">成就系统</h1>
        </div>
        <p className="text-muted-foreground">完成各种任务和挑战来解锁成就</p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>总体进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {unlockedCount} / {totalCount} 成就已解锁
            </span>
            <span className="text-2xl font-bold text-yellow-500">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Categories Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all" className="text-xs">
            全部
          </TabsTrigger>
          {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {name.split("")[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {category === "all" ? (
              <div className="space-y-6">
                {Object.entries(CATEGORY_NAMES).map(([catKey, catName]) => {
                  const categoryAchievements = achievements.filter((a) => a.category === catKey);
                  const categoryUnlocked = categoryAchievements.filter((a) => a.isUnlocked).length;

                  return (
                    <div key={catKey} className="space-y-3">
                      <div className="flex items-center gap-2">
                        {CATEGORY_ICONS[catKey]}
                        <h3 className="text-lg font-semibold">
                          {catName} ({categoryUnlocked}/{categoryAchievements.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryAchievements.map((achievement) => (
                          <AchievementCard key={achievement.id} achievement={achievement} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementDisplay }) {
  return (
    <Card
      className={`transition-all ${
        achievement.isUnlocked
          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
          : "opacity-60 grayscale"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{achievement.name}</CardTitle>
            <CardDescription className="text-xs mt-1">{achievement.description}</CardDescription>
          </div>
          {achievement.isUnlocked && <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        {achievement.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>进度</span>
              <span>{achievement.progress}%</span>
            </div>
            <Progress value={achievement.progress} className="h-2" />
          </div>
        )}

        {/* Rewards */}
        {achievement.reward && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">奖励</p>
            <div className="flex flex-wrap gap-2">
              {achievement.reward.money && (
                <Badge variant="secondary" className="text-xs">
                  💰 {achievement.reward.money.toLocaleString()}
                </Badge>
              )}
              {achievement.reward.isc && (
                <Badge variant="secondary" className="text-xs">
                  🪙 {achievement.reward.isc.toLocaleString()} ISC
                </Badge>
              )}
              {achievement.reward.experience && (
                <Badge variant="secondary" className="text-xs">
                  ⭐ {achievement.reward.experience} XP
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Unlock Date */}
        {achievement.isUnlocked && achievement.unlockedAt && (
          <p className="text-xs text-muted-foreground">
            解锁于 {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}

        {/* Status Badge */}
        <div className="flex gap-2">
          {achievement.isUnlocked ? (
            <Badge className="bg-green-600 text-white">已解锁</Badge>
          ) : (
            <Badge variant="outline">未解锁</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
