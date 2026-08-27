import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home, Zap, Droplet, Users, ShoppingCart, Leaf } from 'lucide-react';

interface GameTile {
  x: number;
  y: number;
  type: 'grass' | 'water' | 'stone' | 'farm' | 'building' | 'shop' | 'house';
  building?: {
    id: string;
    name: string;
    type: 'farm' | 'shop' | 'house' | 'factory';
    level: number;
    owner: string;
  };
}

interface GameState {
  playerX: number;
  playerY: number;
  money: number;
  energy: number;
  water: number;
  inventory: { [key: string]: number };
  buildings: GameTile[];
}

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;

export default function IsometricGame() {
  const { lang } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    playerX: 5,
    playerY: 5,
    money: 10000,
    energy: 100,
    water: 100,
    inventory: { wheat: 5, corn: 3, apple: 2 },
    buildings: generateInitialMap(),
  });
  const [selectedBuilding, setSelectedBuilding] = useState<GameTile | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);

  // Generate initial map with random tiles
  function generateInitialMap(): GameTile[] {
    const tiles: GameTile[] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const rand = Math.random();
        let type: GameTile['type'] = 'grass';
        
        if (rand > 0.9) type = 'water';
        else if (rand > 0.8) type = 'stone';
        else if (rand > 0.6 && x !== 5 && y !== 5) type = 'farm';
        
        tiles.push({
          x,
          y,
          type,
          building: rand > 0.85 && x !== 5 && y !== 5 ? {
            id: `building-${x}-${y}`,
            name: lang === 'zh' ? '农场' : 'Farm',
            type: 'farm',
            level: 1,
            owner: 'player',
          } : undefined,
        });
      }
    }
    return tiles;
  }

  // Draw isometric map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    gameState.buildings.forEach((tile) => {
      const screenX = (tile.x - tile.y) * (TILE_WIDTH / 2);
      const screenY = (tile.x + tile.y) * (TILE_HEIGHT / 2);

      // Draw tile base
      ctx.fillStyle = getTileColor(tile.type);
      drawIsometricTile(ctx, screenX, screenY);

      // Draw building if exists
      if (tile.building) {
        ctx.fillStyle = getBuildingColor(tile.building.type);
        drawIsometricBuilding(ctx, screenX, screenY);
      }

      // Draw player
      if (gameState.playerX === tile.x && gameState.playerY === tile.y) {
        ctx.fillStyle = '#FF6B6B';
        drawIsometricPlayer(ctx, screenX, screenY);
      }
    });
  }, [gameState, lang]);

  function drawIsometricTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const points = [
      [x, y],
      [x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2],
      [x, y + TILE_HEIGHT],
      [x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2],
    ];

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawIsometricBuilding(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const width = TILE_WIDTH / 2;
    const height = TILE_HEIGHT;
    
    // Draw building as a 3D box
    ctx.fillRect(x - width / 2, y - height / 2, width, height / 2);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - width / 2, y - height / 2 + 5, width, height / 2 - 5);
  }

  function drawIsometricPlayer(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function getTileColor(type: GameTile['type']): string {
    const colors: { [key in GameTile['type']]: string } = {
      grass: '#90EE90',
      water: '#4A90E2',
      stone: '#A9A9A9',
      farm: '#FFD700',
      building: '#CD853F',
      shop: '#FF69B4',
      house: '#8B4513',
    };
    return colors[type];
  }

  function getBuildingColor(type: string): string {
    const colors: { [key: string]: string } = {
      farm: '#FFD700',
      shop: '#FF69B4',
      house: '#8B4513',
      factory: '#696969',
    };
    return colors[type] || '#CD853F';
  }

  function movePlayer(dx: number, dy: number) {
    const newX = gameState.playerX + dx;
    const newY = gameState.playerY + dy;

    if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
      setGameState((prev) => ({
        ...prev,
        playerX: newX,
        playerY: newY,
        energy: Math.max(0, prev.energy - 2),
      }));
    }
  }

  function handleTileClick(x: number, y: number) {
    const tile = gameState.buildings.find((t) => t.x === x && t.y === y);
    if (tile) {
      setSelectedBuilding(tile);
    }
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-100 to-green-100 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* Game Canvas */}
        <div className="lg:col-span-3">
          <Card className="w-full h-full overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Game Title */}
              <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-4">
                <h1 className="text-2xl font-bold">{lang === 'zh' ? '冰雪城市' : 'Ice Snow City'}</h1>
                <p className="text-sm opacity-90">{lang === 'zh' ? '欢迎来到你的城市' : 'Welcome to your city'}</p>
              </div>

              {/* Canvas */}
              <div className="flex-1 overflow-auto bg-sky-100 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="border-2 border-gray-300 cursor-pointer"
                  onClick={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      const x = Math.floor((e.clientX - rect.left) / (TILE_WIDTH / 2));
                      const y = Math.floor((e.clientY - rect.top) / (TILE_HEIGHT / 2));
                      handleTileClick(x, y);
                    }
                  }}
                />
              </div>

              {/* Controls */}
              <div className="bg-gray-100 p-4 border-t">
                <div className="flex justify-center gap-2 mb-4">
                  <Button
                    size="sm"
                    onClick={() => movePlayer(0, -1)}
                    className="w-10 h-10 p-0"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex justify-center gap-2 mb-4">
                  <Button
                    size="sm"
                    onClick={() => movePlayer(-1, 0)}
                    className="w-10 h-10 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => movePlayer(0, 1)}
                    className="w-10 h-10 p-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => movePlayer(1, 0)}
                    className="w-10 h-10 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stats */}
          <Card className="p-4">
            <h2 className="font-bold mb-3">{lang === 'zh' ? '玩家状态' : 'Player Status'}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{lang === 'zh' ? '金币' : 'Money'}:</span>
                <span className="font-bold text-yellow-600">{gameState.money}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'zh' ? '体力' : 'Energy'}:</span>
                <span className="font-bold text-red-600">{gameState.energy}%</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'zh' ? '饮水' : 'Water'}:</span>
                <span className="font-bold text-blue-600">{gameState.water}%</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'zh' ? '位置' : 'Position'}:</span>
                <span className="font-bold">({gameState.playerX}, {gameState.playerY})</span>
              </div>
            </div>
          </Card>

          {/* Inventory */}
          <Card className="p-4">
            <h2 className="font-bold mb-3">{lang === 'zh' ? '背包' : 'Inventory'}</h2>
            <div className="space-y-2 text-sm">
              {Object.entries(gameState.inventory).map(([item, count]) => (
                <div key={item} className="flex justify-between">
                  <span className="capitalize">{item}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h2 className="font-bold mb-3">{lang === 'zh' ? '快速操作' : 'Quick Actions'}</h2>
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowBuildMenu(true)}
              >
                <Home className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '建造' : 'Build'}
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Leaf className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '种植' : 'Plant'}
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '交易' : 'Trade'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Building Info Dialog */}
      <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBuilding?.building?.name}</DialogTitle>
          </DialogHeader>
          {selectedBuilding && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">{lang === 'zh' ? '类型' : 'Type'}:</p>
                <p className="font-bold">{selectedBuilding.building?.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{lang === 'zh' ? '等级' : 'Level'}:</p>
                <p className="font-bold">{selectedBuilding.building?.level}</p>
              </div>
              <Button className="w-full">{lang === 'zh' ? '进入' : 'Enter'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Build Menu Dialog */}
      <Dialog open={showBuildMenu} onOpenChange={setShowBuildMenu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '建造菜单' : 'Build Menu'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button className="w-full justify-start">
              <Home className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '建造房屋 (500 ISC)' : 'Build House (500 ISC)'}
            </Button>
            <Button className="w-full justify-start">
              <Leaf className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '建造农场 (300 ISC)' : 'Build Farm (300 ISC)'}
            </Button>
            <Button className="w-full justify-start">
              <ShoppingCart className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '建造商店 (800 ISC)' : 'Build Shop (800 ISC)'}
            </Button>
            <Button className="w-full justify-start">
              <Zap className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '建造工厂 (1000 ISC)' : 'Build Factory (1000 ISC)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
