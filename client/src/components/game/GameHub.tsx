import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Zap,
  Users,
  ShoppingCart,
  Home,
  Sprout,
  Heart,
  MapPin,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import PlayableGameScene from "./PlayableGameScene";
import GameEconomy from "./GameEconomy";
import GameTasks from "./GameTasks";
import GameProperty from "./GameProperty";
import GameFarm from "./GameFarm";
import GameShop from "./GameShop";
import GameSocial from "./GameSocial";
import { GameSceneSystem } from "./GameSceneSystem";
import { NPCSystem } from "./NPCSystem";

type GameTab = "scenes" | "scene" | "npc" | "economy" | "tasks" | "property" | "farm" | "shop" | "social";

export const GameHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>("scenes");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameTime, setGameTime] = useState(0);

  // 模拟游戏时间流逝（100倍速）
  React.useEffect(() => {
    const interval = setInterval(() => {
      setGameTime((prev) => (prev + 1) % 2400); // 24小时 = 2400分钟
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const displayTime = `${String(Math.floor(gameTime / 100)).padStart(2, "0")}:${String((gameTime % 100) * 0.6).padStart(2, "0")}`;

  const tabs: { id: GameTab; label: string; icon: React.ReactNode }[] = [
    { id: "scenes", label: "🏙️ 城市", icon: <MapPin className="w-4 h-4" /> },
    { id: "scene", label: "游戏", icon: <MapPin className="w-4 h-4" /> },
    { id: "npc", label: "👥 NPC", icon: <Users className="w-4 h-4" /> },
    { id: "economy", label: "经济", icon: <Zap className="w-4 h-4" /> },
    { id: "tasks", label: "任务", icon: <Clock className="w-4 h-4" /> },
    { id: "property", label: "房产", icon: <Home className="w-4 h-4" /> },
    { id: "farm", label: "农业", icon: <Sprout className="w-4 h-4" /> },
    { id: "shop", label: "商城", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "social", label: "社交", icon: <Heart className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "scenes":
        return <GameSceneSystem />;
      case "scene":
        return <PlayableGameScene />;
      case "npc":
        return <NPCSystem />;
      case "economy":
        return <GameEconomy />;
      case "tasks":
        return <GameTasks />;
      case "property":
        return <GameProperty />;
      case "farm":
        return <GameFarm />;
      case "shop":
        return <GameShop />;
      case "social":
        return <GameSocial />;
      default:
        return <PlayableGameScene />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* 顶部信息栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 bg-opacity-95 border-b border-blue-500 p-3">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-400">Ice Snow City</h1>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-mono text-sm">{displayTime}</span>
            </div>
          </div>
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="pt-16 pb-24">
        {renderContent()}
      </div>

      {/* 底部标签栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-blue-500 p-2">
        <div className="grid grid-cols-9 gap-1 max-w-full">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`flex flex-col items-center gap-1 py-2 text-xs ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-blue-400 hover:text-blue-300"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 游戏提示 */}
      <div className="fixed bottom-24 right-4 z-40">
        <Card className="bg-blue-900 bg-opacity-90 border-blue-500 p-3 max-w-xs">
          <p className="text-blue-200 text-xs">
            💡 提示：使用底部菜单切换不同的游戏系统。每个系统都有独特的玩法和奖励。
          </p>
        </Card>
      </div>
    </div>
  );
};

export default GameHub;
