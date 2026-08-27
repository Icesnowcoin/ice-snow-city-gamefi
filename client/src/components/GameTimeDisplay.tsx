import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Cloud, Wind, Loader2 } from "lucide-react";

export default function GameTimeDisplay() {
  const { lang } = useLanguage();
  const { data: gameState } = trpc.game.core.getState.useQuery();
  const advanceTimeMutation = trpc.game.core.advanceTime.useMutation({
    onSuccess: () => {
      // Refetch game state after advancing time
    },
  });

  const gameTime = gameState?.gameTime;
  if (!gameTime) return null;

  const hourStr = String(gameTime.hour).padStart(2, "0");
  const minuteStr = String(gameTime.minute).padStart(2, "0");

  const getTimeOfDay = (hour: number) => {
    if (hour >= 6 && hour < 12) return { label: lang === "zh" ? "早晨" : "Morning", icon: Sun, color: "text-yellow-500" };
    if (hour >= 12 && hour < 18) return { label: lang === "zh" ? "下午" : "Afternoon", icon: Sun, color: "text-orange-500" };
    if (hour >= 18 && hour < 20) return { label: lang === "zh" ? "傍晚" : "Evening", icon: Cloud, color: "text-purple-500" };
    return { label: lang === "zh" ? "夜晚" : "Night", icon: Moon, color: "text-blue-900" };
  };

  const timeOfDay = getTimeOfDay(gameTime.hour);
  const TimeIcon = timeOfDay.icon;

  const seasonLabels: Record<string, string> = {
    spring: lang === "zh" ? "春季" : "Spring",
    summer: lang === "zh" ? "夏季" : "Summer",
    autumn: lang === "zh" ? "秋季" : "Autumn",
    winter: lang === "zh" ? "冬季" : "Winter",
  };

  const seasonColors: Record<string, string> = {
    spring: "from-green-400 to-blue-400",
    summer: "from-yellow-400 to-orange-400",
    autumn: "from-orange-400 to-red-400",
    winter: "from-blue-400 to-cyan-400",
  };

  return (
    <Card className={`bg-gradient-to-r ${seasonColors[gameTime.season]} text-white border-0`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TimeIcon className={`w-8 h-8 ${timeOfDay.color}`} />
            <div>
              <p className="text-sm opacity-90">
                {seasonLabels[gameTime.season]} {gameTime.day}, Year {gameTime.year}
              </p>
              <p className="text-2xl font-bold">
                {hourStr}:{minuteStr}
              </p>
              <p className="text-xs opacity-75">{timeOfDay.label}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => advanceTimeMutation.mutate({ minutes: 60 })}
              disabled={advanceTimeMutation.isPending}
              title={lang === "zh" ? "快进 1 小时" : "Skip 1 hour"}
            >
              {advanceTimeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wind className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
