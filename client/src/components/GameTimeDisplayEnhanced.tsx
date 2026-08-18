import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Cloud, Wind, Loader2, Clock, Calendar } from "lucide-react";

export default function GameTimeDisplayEnhanced() {
  const { lang } = useLanguage();
  const { data: gameState, refetch } = trpc.game.core.getState.useQuery();
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const advanceTimeMutation = trpc.game.core.advanceTime.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Auto-advance time every 5 seconds if enabled
  useEffect(() => {
    if (autoAdvance) {
      const interval = setInterval(() => {
        advanceTimeMutation.mutate({ minutes: 30 });
      }, 5000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoAdvance]);

  // Refetch game state every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  const gameTime = gameState?.gameTime;
  if (!gameTime) return null;

  const hourStr = String(gameTime.hour).padStart(2, "0");
  const minuteStr = String(gameTime.minute).padStart(2, "0");

  const monthLabels: Record<number, string> = {
    1: lang === "zh" ? "1月" : "January",
    2: lang === "zh" ? "2月" : "February",
    3: lang === "zh" ? "3月" : "March",
    4: lang === "zh" ? "4月" : "April",
    5: lang === "zh" ? "5月" : "May",
    6: lang === "zh" ? "6月" : "June",
    7: lang === "zh" ? "7月" : "July",
    8: lang === "zh" ? "8月" : "August",
    9: lang === "zh" ? "9月" : "September",
    10: lang === "zh" ? "10月" : "October",
    11: lang === "zh" ? "11月" : "November",
    12: lang === "zh" ? "12月" : "December",
  };

  const getTimeOfDay = (hour: number) => {
    if (hour >= 6 && hour < 12)
      return {
        label: lang === "zh" ? "早晨" : "Morning",
        icon: Sun,
        color: "text-yellow-500",
      };
    if (hour >= 12 && hour < 18)
      return {
        label: lang === "zh" ? "下午" : "Afternoon",
        icon: Sun,
        color: "text-orange-500",
      };
    if (hour >= 18 && hour < 20)
      return {
        label: lang === "zh" ? "傍晚" : "Evening",
        icon: Cloud,
        color: "text-purple-500",
      };
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

  const seasonEmojis: Record<string, string> = {
    spring: "🌸",
    summer: "☀️",
    autumn: "🍂",
    winter: "❄️",
  };

  const daysInMonth = (month: number, year: number) => {
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && year % 4 === 0) return 29;
    return daysPerMonth[month - 1];
  };

  const maxDay = daysInMonth(gameTime.month, gameTime.year);
  const dayProgress = (gameTime.day / maxDay) * 100;
  const hourProgress = (gameTime.hour / 24) * 100;

  return (
    <div className="space-y-3">
      {/* Main Time Card */}
      <Card className={`bg-gradient-to-r ${seasonColors[gameTime.season]} text-white border-0 shadow-lg`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <TimeIcon className={`w-10 h-10 ${timeOfDay.color}`} />
                <span className="text-2xl absolute -top-1 -right-1">{seasonEmojis[gameTime.season]}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-90 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {monthLabels[gameTime.month]} {gameTime.day}, {lang === "zh" ? "第" : "Year"} {gameTime.year}
                  {lang === "zh" ? "年" : ""}
                </p>
                <p className="text-3xl font-bold font-mono">
                  {hourStr}:{minuteStr}
                </p>
                <p className="text-xs opacity-75 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {timeOfDay.label} • {seasonLabels[gameTime.season]}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
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
              <Button
                size="sm"
                variant={autoAdvance ? "default" : "ghost"}
                className={autoAdvance ? "bg-white/30 text-white hover:bg-white/40" : "text-white hover:bg-white/20"}
                onClick={() => setAutoAdvance(!autoAdvance)}
                title={lang === "zh" ? (autoAdvance ? "暂停时间" : "自动推进") : autoAdvance ? "Pause" : "Auto-advance"}
              >
                <Clock className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Hour Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs opacity-75">
              <span>{lang === "zh" ? "今日进度" : "Day Progress"}</span>
              <span>{hourProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white/80 h-2 rounded-full transition-all duration-500"
                style={{ width: `${hourProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Progress Card */}
      <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-0">
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">{lang === "zh" ? "月份进度" : "Month Progress"}</span>
            <span className="text-sm font-semibold">
              {gameTime.day}/{maxDay}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs opacity-75 mt-2">
            <span>{lang === "zh" ? "开始" : "Start"}</span>
            <span>{dayProgress.toFixed(0)}%</span>
            <span>{lang === "zh" ? "结束" : "End"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Time Info Card */}
      <Card className="bg-slate-900 text-white border-0">
        <CardContent className="pt-3 pb-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 p-2 rounded">
              <p className="opacity-75">{lang === "zh" ? "季节" : "Season"}</p>
              <p className="font-semibold">{seasonLabels[gameTime.season]}</p>
            </div>
            <div className="bg-white/10 p-2 rounded">
              <p className="opacity-75">{lang === "zh" ? "时段" : "Time of Day"}</p>
              <p className="font-semibold">{timeOfDay.label}</p>
            </div>
            <div className="bg-white/10 p-2 rounded">
              <p className="opacity-75">{lang === "zh" ? "游戏年份" : "Year"}</p>
              <p className="font-semibold">{gameTime.year}</p>
            </div>
            <div className="bg-white/10 p-2 rounded">
              <p className="opacity-75">{lang === "zh" ? "自动推进" : "Auto-advance"}</p>
              <p className="font-semibold">{autoAdvance ? "✓ ON" : "○ OFF"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
