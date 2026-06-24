import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Users, Gift, MessageCircle, MapPin, Zap, Home } from "lucide-react";

interface Character {
  id: string;
  name: string;
  x: number;
  y: number;
  profession: string;
  affinity: number;
  dialogue: string;
}

interface Building {
  id: string;
  name: string;
  x: number;
  y: number;
  type: "bank" | "shop" | "cafe" | "home" | "farm";
  color: string;
}

export const PlayableGameScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 400, y: 300 });
  const [gameTime, setGameTime] = useState(0);
  const [money, setMoney] = useState(50000);
  const [energy, setEnergy] = useState(100);

  // 游戏场景中的 NPC
  const [characters, setCharacters] = useState<Character[]>([
    { id: "1", name: "小美", x: 200, y: 150, profession: "咖啡师", affinity: 75, dialogue: "欢迎来到咖啡店！" },
    { id: "2", name: "小王", x: 600, y: 200, profession: "银行家", affinity: 60, dialogue: "需要理财服务吗？" },
    { id: "3", name: "小李", x: 300, y: 400, profession: "商人", affinity: 80, dialogue: "我有好东西要卖！" },
    { id: "4", name: "小张", x: 700, y: 350, profession: "农民", affinity: 45, dialogue: "今年收成不错！" },
  ]);

  // 游戏场景中的建筑
  const buildings: Building[] = [
    { id: "bank", name: "ISC 银行", x: 550, y: 150, type: "bank", color: "#3b82f6" },
    { id: "shop", name: "商城", x: 150, y: 350, type: "shop", color: "#ec4899" },
    { id: "cafe", name: "咖啡店", x: 200, y: 100, type: "cafe", color: "#f59e0b" },
    { id: "home", name: "我的家", x: 650, y: 450, type: "home", color: "#10b981" },
    { id: "farm", name: "农场", x: 100, y: 500, type: "farm", color: "#84cc16" },
  ];

  // 游戏循环 - 绘制场景
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清除画布
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格背景
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // 绘制建筑
    buildings.forEach((building) => {
      ctx.fillStyle = building.color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(building.x - 30, building.y - 30, 60, 60);
      ctx.globalAlpha = 1;

      // 建筑标签
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(building.name, building.x, building.y + 50);
    });

    // 绘制 NPC
    characters.forEach((char) => {
      // NPC 圆形
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath();
      ctx.arc(char.x, char.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // 选中时高亮
      if (selectedCharacter?.id === char.id) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(char.x, char.y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // NPC 名字
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(char.name, char.x, char.y - 25);
    });

    // 绘制玩家
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(playerPos.x, playerPos.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // 玩家标签
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("你", playerPos.x, playerPos.y - 20);
  }, [playerPos, characters, selectedCharacter, gameTime]);

  // 处理键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 10;
      const newPos = { ...playerPos };

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newPos.y = Math.max(0, playerPos.y - step);
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newPos.y = Math.min(600, playerPos.y + step);
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newPos.x = Math.max(0, playerPos.x - step);
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newPos.x = Math.min(800, playerPos.x + step);
          e.preventDefault();
          break;
        default:
          return;
      }

      setPlayerPos(newPos);
      setEnergy(Math.max(0, energy - 0.5));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerPos, energy]);

  // 检测与 NPC 的碰撞
  const checkNpcCollision = () => {
    characters.forEach((char) => {
      const distance = Math.sqrt(
        Math.pow(playerPos.x - char.x, 2) + Math.pow(playerPos.y - char.y, 2)
      );
      if (distance < 40) {
        setSelectedCharacter(char);
      }
    });
  };

  useEffect(() => {
    checkNpcCollision();
  }, [playerPos]);

  // 与 NPC 互动
  const handleInteract = (action: string) => {
    if (!selectedCharacter) return;

    let affinityChange = 0;
    let moneyChange = 0;
    let message = "";

    switch (action) {
      case "talk":
        affinityChange = 5;
        message = selectedCharacter.dialogue;
        break;
      case "gift":
        if (money >= 100) {
          affinityChange = 15;
          moneyChange = -100;
          message = `${selectedCharacter.name} 很高兴！`;
        } else {
          message = "金币不足！";
        }
        break;
      case "trade":
        moneyChange = Math.floor(Math.random() * 500) - 250;
        message = moneyChange > 0 ? "交易成功！" : "交易失败！";
        break;
    }

    // 更新状态
    setCharacters(
      characters.map((char) =>
        char.id === selectedCharacter.id
          ? { ...char, affinity: Math.min(100, char.affinity + affinityChange) }
          : char
      )
    );

    setMoney(Math.max(0, money + moneyChange));
    setSelectedCharacter({
      ...selectedCharacter,
      affinity: Math.min(100, selectedCharacter.affinity + affinityChange),
    });

    // 显示提示
    alert(message);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-20">
      {/* 游戏信息栏 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="bg-blue-900 bg-opacity-50 border-blue-500 p-3">
          <div className="text-xs text-blue-300">金币</div>
          <div className="text-2xl font-bold text-green-400">{money}</div>
        </Card>
        <Card className="bg-blue-900 bg-opacity-50 border-blue-500 p-3">
          <div className="text-xs text-blue-300">体力</div>
          <div className="w-full bg-blue-800 rounded-full h-2 mt-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${energy}%` }}
            />
          </div>
        </Card>
        <Card className="bg-blue-900 bg-opacity-50 border-blue-500 p-3">
          <div className="text-xs text-blue-300">时间</div>
          <div className="text-xl font-bold text-yellow-400">{gameTime}:00</div>
        </Card>
      </div>

      {/* 游戏画布 */}
      <Card className="bg-slate-800 border-blue-500 p-2 mb-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full border border-blue-500 rounded"
        />
      </Card>

      {/* 控制说明 */}
      <Card className="bg-blue-900 bg-opacity-50 border-blue-500 p-3 mb-4">
        <p className="text-blue-200 text-sm mb-2">
          ⌨️ 使用方向键或 WASD 移动 | 靠近 NPC 后可以互动
        </p>
      </Card>

      {/* NPC 互动面板 */}
      {selectedCharacter && (
        <Card className="bg-pink-900 bg-opacity-50 border-pink-500 p-4 mb-4">
          <h3 className="text-lg font-bold text-white mb-2">{selectedCharacter.name}</h3>
          <p className="text-pink-200 text-sm mb-3">{selectedCharacter.profession}</p>

          {/* 亲密度 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-pink-300 text-xs">亲密度</span>
              <span className="text-white font-bold">{selectedCharacter.affinity}%</span>
            </div>
            <div className="w-full bg-pink-900 rounded-full h-2">
              <div
                className="bg-red-400 h-2 rounded-full transition-all"
                style={{ width: `${selectedCharacter.affinity}%` }}
              />
            </div>
          </div>

          {/* 互动按钮 */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleInteract("talk")}
              className="bg-blue-600 hover:bg-blue-700 text-xs py-1"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              聊天
            </Button>
            <Button
              onClick={() => handleInteract("gift")}
              className="bg-purple-600 hover:bg-purple-700 text-xs py-1"
            >
              <Gift className="w-3 h-3 mr-1" />
              送礼
            </Button>
            <Button
              onClick={() => handleInteract("trade")}
              className="bg-green-600 hover:bg-green-700 text-xs py-1"
            >
              <Zap className="w-3 h-3 mr-1" />
              交易
            </Button>
          </div>
        </Card>
      )}

      {/* NPC 列表 */}
      <Card className="bg-blue-900 bg-opacity-50 border-blue-500 p-4">
        <h3 className="font-bold text-white mb-3">场景中的 NPC</h3>
        <div className="space-y-2">
          {characters.map((char) => (
            <div
              key={char.id}
              className="flex items-center justify-between bg-blue-800 bg-opacity-50 p-2 rounded cursor-pointer hover:bg-opacity-70"
              onClick={() => setSelectedCharacter(char)}
            >
              <div>
                <p className="text-white font-bold text-sm">{char.name}</p>
                <p className="text-blue-300 text-xs">{char.profession}</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 text-xs">❤️ {char.affinity}%</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PlayableGameScene;
