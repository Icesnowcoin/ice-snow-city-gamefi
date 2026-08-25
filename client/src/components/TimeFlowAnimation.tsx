import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle, Zap, Moon, Sun } from "lucide-react";

interface TimeFlowAnimationProps {
  gameTime?: {
    hour: number;
    day: number;
    month: number;
    year: number;
    season: string;
  };
  isAutoAdvancing?: boolean;
  onAnimationComplete?: () => void;
}

export default function TimeFlowAnimation({
  gameTime,
  isAutoAdvancing = false,
  onAnimationComplete,
}: TimeFlowAnimationProps) {
  const { lang } = useLanguage();
  const [showPulse, setShowPulse] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionType, setTransitionType] = useState<"day" | "night" | "month" | "season">("day");
  const [lastHour, setLastHour] = useState(gameTime?.hour ?? 0);
  const [lastDay, setLastDay] = useState(gameTime?.day ?? 1);
  const [lastMonth, setLastMonth] = useState(gameTime?.month ?? 1);
  const [lastSeason, setLastSeason] = useState(gameTime?.season ?? "spring");

  // Detect time transitions
  useEffect(() => {
    if (!gameTime) return;

    // Day transition (6:00 AM)
    if (lastHour < 6 && gameTime.hour >= 6 && gameTime.hour < 7) {
      setTransitionType("day");
      setShowTransition(true);
      setTimeout(() => setShowTransition(false), 2000);
    }

    // Night transition (20:00 / 8:00 PM)
    if (lastHour < 20 && gameTime.hour >= 20) {
      setTransitionType("night");
      setShowTransition(true);
      setTimeout(() => setShowTransition(false), 2000);
    }

    // Month transition
    if (lastDay !== gameTime.day && gameTime.day === 1) {
      setTransitionType("month");
      setShowTransition(true);
      setTimeout(() => setShowTransition(false), 2500);
    }

    // Season transition
    if (lastSeason !== gameTime.season) {
      setTransitionType("season");
      setShowTransition(true);
      setTimeout(() => setShowTransition(false), 3000);
    }

    setLastHour(gameTime.hour);
    setLastDay(gameTime.day);
    setLastMonth(gameTime.month);
    setLastSeason(gameTime.season);
  }, [gameTime, lastHour, lastDay, lastMonth, lastSeason]);

  // Pulse effect when auto-advancing
  useEffect(() => {
    if (!isAutoAdvancing) return;

    const interval = setInterval(() => {
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoAdvancing]);

  const getTransitionMessage = () => {
    switch (transitionType) {
      case "day":
        return lang === "zh" ? "☀️ 新的一天开始了！" : "☀️ A new day begins!";
      case "night":
        return lang === "zh" ? "🌙 夜晚降临" : "🌙 Night falls";
      case "month":
        return lang === "zh" ? "📅 新的一个月" : "📅 New month";
      case "season":
        return lang === "zh" ? "🌍 季节变化" : "🌍 Season changed";
      default:
        return "";
    }
  };

  const getTransitionColor = () => {
    switch (transitionType) {
      case "day":
        return "from-yellow-400 to-orange-400";
      case "night":
        return "from-blue-900 to-purple-900";
      case "month":
        return "from-cyan-400 to-blue-400";
      case "season":
        return "from-green-400 to-teal-400";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Auto-advance pulse indicator */}
      {isAutoAdvancing && (
        <div className="fixed top-4 right-4 z-40">
          <div
            className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-semibold transition-all duration-300 ${
              showPulse ? "scale-110 shadow-lg shadow-blue-500/50" : "scale-100"
            }`}
          >
            <Zap className="w-4 h-4 animate-pulse" />
            {lang === "zh" ? "自动推进中" : "Auto-advancing"}
          </div>
        </div>
      )}

      {/* Time transition animation */}
      {showTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/40 animate-pulse" />

          {/* Transition content */}
          <div className="relative z-10 text-center">
            {/* Animated icon */}
            <div className="mb-4 flex justify-center">
              {transitionType === "day" && (
                <Sun className="w-20 h-20 text-yellow-400 animate-bounce drop-shadow-lg" />
              )}
              {transitionType === "night" && (
                <Moon className="w-20 h-20 text-blue-300 animate-bounce drop-shadow-lg" />
              )}
              {transitionType === "month" && (
                <AlertCircle className="w-20 h-20 text-cyan-400 animate-spin drop-shadow-lg" />
              )}
              {transitionType === "season" && (
                <div className="w-20 h-20 text-green-400 animate-spin drop-shadow-lg">
                  🌍
                </div>
              )}
            </div>

            {/* Message */}
            <div
              className={`bg-gradient-to-r ${getTransitionColor()} text-white px-8 py-4 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-500`}
            >
              <p className="text-2xl font-bold">{getTransitionMessage()}</p>
            </div>

            {/* Particles effect */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 bg-white rounded-full animate-ping`}
                  style={{
                    left: `${50 + Math.cos((i / 12) * Math.PI * 2) * 60}%`,
                    top: `${50 + Math.sin((i / 12) * Math.PI * 2) * 60}%`,
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtle background color transition based on time of day */}
      {gameTime && (
        <div
          className="fixed inset-0 pointer-events-none transition-colors duration-1000"
          style={{
            backgroundColor:
              gameTime.hour >= 6 && gameTime.hour < 12
                ? "rgba(255, 200, 100, 0.02)" // Morning
                : gameTime.hour >= 12 && gameTime.hour < 18
                  ? "rgba(255, 150, 50, 0.02)" // Afternoon
                  : gameTime.hour >= 18 && gameTime.hour < 20
                    ? "rgba(200, 100, 200, 0.02)" // Evening
                    : "rgba(50, 50, 150, 0.02)", // Night
          }}
        />
      )}
    </div>
  );
}
