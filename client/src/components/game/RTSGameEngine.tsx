import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home, Zap, Droplet, Users, ShoppingCart, Leaf, Hammer, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Building {
  id: string;
  x: number;
  y: number;
  type: 'house' | 'farm' | 'shop' | 'factory' | 'bank' | 'townhall';
  level: number;
  owner: string;
  health: number;
  maxHealth: number;
  production?: number;
  workers?: number;
}

interface Unit {
  id: string;
  x: number;
  y: number;
  type: 'worker' | 'trader' | 'farmer';
  owner: string;
  health: number;
  maxHealth: number;
  carrying?: string;
  carryingAmount?: number;
}

interface GameState {
  playerX: number;
  playerY: number;
  money: number;
  energy: number;
  water: number;
  food: number;
  population: number;
  buildings: Building[];
  units: Unit[];
  selectedBuilding: Building | null;
  selectedUnit: Unit | null;
  gameTime: number;
  dayNightCycle: number; // 0-100 representing day/night
}

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const MAP_WIDTH = 16;
const MAP_HEIGHT = 12;

export default function RTSGameEngine() {
  const { lang } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    playerX: 8,
    playerY: 6,
    money: 50000,
    energy: 100,
    water: 100,
    food: 100,
    population: 5,
    buildings: generateInitialBuildings(),
    units: generateInitialUnits(),
    selectedBuilding: null,
    selectedUnit: null,
    gameTime: 0,
    dayNightCycle: 50,
  });

  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [showUnitMenu, setShowUnitMenu] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  function generateInitialBuildings(): Building[] {
    return [
      { id: 'townhall-1', x: 8, y: 6, type: 'townhall', level: 1, owner: 'player', health: 100, maxHealth: 100 },
      { id: 'farm-1', x: 6, y: 5, type: 'farm', level: 1, owner: 'player', health: 80, maxHealth: 80, production: 10, workers: 2 },
      { id: 'farm-2', x: 10, y: 5, type: 'farm', level: 1, owner: 'player', health: 80, maxHealth: 80, production: 10, workers: 2 },
      { id: 'house-1', x: 7, y: 8, type: 'house', level: 1, owner: 'player', health: 60, maxHealth: 60 },
      { id: 'house-2', x: 9, y: 8, type: 'house', level: 1, owner: 'player', health: 60, maxHealth: 60 },
      { id: 'shop-1', x: 8, y: 10, type: 'shop', level: 1, owner: 'player', health: 70, maxHealth: 70 },
      { id: 'bank-1', x: 6, y: 8, type: 'bank', level: 1, owner: 'player', health: 90, maxHealth: 90 },
    ];
  }

  function generateInitialUnits(): Unit[] {
    return [
      { id: 'worker-1', x: 7, y: 6, type: 'worker', owner: 'player', health: 50, maxHealth: 50 },
      { id: 'worker-2', x: 9, y: 6, type: 'worker', owner: 'player', health: 50, maxHealth: 50 },
      { id: 'trader-1', x: 8, y: 7, type: 'trader', owner: 'player', health: 40, maxHealth: 40 },
    ];
  }

  // Main game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        const newState = { ...prev };
        
        // Update game time and day/night cycle
        newState.gameTime = (prev.gameTime + 1) % 10000;
        newState.dayNightCycle = Math.sin((newState.gameTime / 10000) * Math.PI * 2) * 50 + 50;

        // Simulate production
        newState.buildings = newState.buildings.map((building) => {
          if (building.type === 'farm' && building.production) {
            return {
              ...building,
              production: Math.min(building.production + 0.1, 20),
            };
          }
          return building;
        });

        return newState;
      });
    }, 100);

    return () => clearInterval(gameLoop);
  }, []);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient based on day/night
    const lightness = gameState.dayNightCycle / 100;
    const bgColor = `rgb(${Math.floor(135 * lightness)}, ${Math.floor(206 * lightness)}, ${Math.floor(235 * lightness)})`;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid and terrain
    drawTerrain(ctx);

    // Draw buildings
    gameState.buildings.forEach((building) => {
      drawBuilding(ctx, building, gameState.selectedBuilding?.id === building.id);
    });

    // Draw units
    gameState.units.forEach((unit) => {
      drawUnit(ctx, unit, gameState.selectedUnit?.id === unit.id);
    });

    // Draw selection indicators
    if (gameState.selectedBuilding) {
      drawSelectionBox(ctx, gameState.selectedBuilding.x, gameState.selectedBuilding.y);
    }
    if (gameState.selectedUnit) {
      drawSelectionBox(ctx, gameState.selectedUnit.x, gameState.selectedUnit.y);
    }

    // Draw hovered tile
    if (hoveredTile) {
      drawHoverBox(ctx, hoveredTile.x, hoveredTile.y);
    }
  }, [gameState, hoveredTile]);

  function drawTerrain(ctx: CanvasRenderingContext2D) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const screenX = (x - y) * (TILE_WIDTH / 2) + canvas.width / 2;
        const screenY = (x + y) * (TILE_HEIGHT / 2) + 50;

        // Draw grass tile with gradient
        const gradient = ctx.createLinearGradient(screenX - TILE_WIDTH / 2, screenY, screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT);
        gradient.addColorStop(0, '#90EE90');
        gradient.addColorStop(1, '#7CCD7C');
        ctx.fillStyle = gradient;

        drawIsometricTile(ctx, screenX, screenY);

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function drawBuilding(ctx: CanvasRenderingContext2D, building: Building, selected: boolean) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const screenX = (building.x - building.y) * (TILE_WIDTH / 2) + canvas.width / 2;
    const screenY = (building.x + building.y) * (TILE_HEIGHT / 2) + 50;

    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + TILE_HEIGHT / 2 + 5, TILE_WIDTH / 3, TILE_HEIGHT / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw building base (3D effect)
    const buildingColors: { [key: string]: string } = {
      townhall: '#8B4513',
      farm: '#FFD700',
      shop: '#FF69B4',
      factory: '#696969',
      bank: '#4169E1',
      house: '#CD853F',
    };

    ctx.fillStyle = buildingColors[building.type] || '#CD853F';

    // Draw 3D building
    const width = TILE_WIDTH / 2;
    const height = TILE_HEIGHT;
    const depth = 15;

    // Front face
    ctx.fillRect(screenX - width / 2, screenY - height / 2, width, height / 2);

    // Side face (3D effect)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(screenX + width / 2, screenY - height / 2);
    ctx.lineTo(screenX + width / 2 + depth, screenY - height / 2 - depth / 2);
    ctx.lineTo(screenX + width / 2 + depth, screenY - height / 2 - depth / 2 + height / 2);
    ctx.lineTo(screenX + width / 2, screenY - height / 2 + height / 2);
    ctx.closePath();
    ctx.fill();

    // Top face
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(screenX - width / 2, screenY - height / 2);
    ctx.lineTo(screenX + width / 2, screenY - height / 2);
    ctx.lineTo(screenX + width / 2 + depth, screenY - height / 2 - depth / 2);
    ctx.lineTo(screenX - width / 2 + depth, screenY - height / 2 - depth / 2);
    ctx.closePath();
    ctx.fill();

    // Draw building name
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(building.type.toUpperCase(), screenX, screenY + TILE_HEIGHT / 2 + 15);

    // Draw health bar
    const barWidth = 40;
    const barHeight = 3;
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX - barWidth / 2, screenY - height / 2 - 10, barWidth, barHeight);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(screenX - barWidth / 2, screenY - height / 2 - 10, (barWidth * building.health) / building.maxHealth, barHeight);

    if (selected) {
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, selected: boolean) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const screenX = (unit.x - unit.y) * (TILE_WIDTH / 2) + canvas.width / 2;
    const screenY = (unit.x + unit.y) * (TILE_HEIGHT / 2) + 50;

    // Draw unit as a circle with color based on type
    const unitColors: { [key: string]: string } = {
      worker: '#FF6B6B',
      trader: '#4ECDC4',
      farmer: '#95E1D3',
    };

    ctx.fillStyle = unitColors[unit.type] || '#FF6B6B';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw unit outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw health bar above unit
    const barWidth = 20;
    const barHeight = 2;
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX - barWidth / 2, screenY - 25, barWidth, barHeight);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(screenX - barWidth / 2, screenY - 25, (barWidth * unit.health) / unit.maxHealth, barHeight);

    if (selected) {
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenX, screenY - 10, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

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
  }

  function drawSelectionBox(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const screenX = (x - y) * (TILE_WIDTH / 2) + canvas.width / 2;
    const screenY = (x + y) * (TILE_HEIGHT / 2) + 50;

    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    const points = [
      [screenX, screenY],
      [screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2],
      [screenX, screenY + TILE_HEIGHT],
      [screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2],
    ];

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
    ctx.stroke();
  }

  function drawHoverBox(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const screenX = (x - y) * (TILE_WIDTH / 2) + canvas.width / 2;
    const screenY = (x + y) * (TILE_HEIGHT / 2) + 50;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    const points = [
      [screenX, screenY],
      [screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2],
      [screenX, screenY + TILE_HEIGHT],
      [screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2],
    ];

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
    ctx.stroke();
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen coordinates to isometric coordinates
    const relX = mouseX - (canvas?.width || 1024) / 2;
    const relY = mouseY - 50;

    const x = Math.round((relX / (TILE_WIDTH / 2) + relY / (TILE_HEIGHT / 2)) / 2);
    const y = Math.round((relY / (TILE_HEIGHT / 2) - relX / (TILE_WIDTH / 2)) / 2);

    // Check if clicked on building
    const clickedBuilding = gameState.buildings.find((b) => b.x === x && b.y === y);
    if (clickedBuilding) {
      setGameState((prev) => ({ ...prev, selectedBuilding: clickedBuilding, selectedUnit: null }));
      return;
    }

    // Check if clicked on unit
    const clickedUnit = gameState.units.find((u) => u.x === x && u.y === y);
    if (clickedUnit) {
      setGameState((prev) => ({ ...prev, selectedUnit: clickedUnit, selectedBuilding: null }));
      return;
    }

    setGameState((prev) => ({ ...prev, selectedBuilding: null, selectedUnit: null }));
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const relX = mouseX - (canvas?.width || 1024) / 2;
    const relY = mouseY - 50;

    const x = Math.round((relX / (TILE_WIDTH / 2) + relY / (TILE_HEIGHT / 2)) / 2);
    const y = Math.round((relY / (TILE_HEIGHT / 2) - relX / (TILE_WIDTH / 2)) / 2);

    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
      setHoveredTile({ x, y });
    } else {
      setHoveredTile(null);
    }
  }

  function buildBuilding(type: Building['type']) {
    const cost: { [key: string]: number } = {
      house: 500,
      farm: 300,
      shop: 800,
      factory: 1000,
      bank: 1500,
      townhall: 5000,
    };

    if (gameState.money < (cost[type] || 0)) {
      toast.error(lang === 'zh' ? '金币不足' : 'Not enough money');
      return;
    }

    const newBuilding: Building = {
      id: `${type}-${Date.now()}`,
      x: gameState.playerX,
      y: gameState.playerY,
      type: type as Building['type'],
      level: 1,
      owner: 'player',
      health: 80,
      maxHealth: 80,
    };

    setGameState((prev) => ({
      ...prev,
      money: prev.money - (cost[type] || 0),
      buildings: [...prev.buildings, newBuilding],
      population: type === 'house' ? prev.population + 2 : prev.population,
    }));

    toast.success(lang === 'zh' ? '建筑已建造' : 'Building constructed');
    setShowBuildMenu(false);
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-100 to-green-100 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* Game Canvas */}
        <div className="lg:col-span-3">
          <Card className="w-full h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
              <h1 className="text-2xl font-bold">{lang === 'zh' ? '冰雪城市' : 'Ice Snow City'}</h1>
              <p className="text-sm opacity-90">{lang === 'zh' ? 'RTS 模拟经营游戏' : 'RTS Simulation Game'}</p>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-sky-100 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={1024}
                height={768}
                className="border-4 border-gray-400 cursor-pointer bg-sky-200"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setHoveredTile(null)}
              />
            </div>

            {/* Controls */}
            <div className="bg-gray-100 p-4 border-t">
              <div className="flex justify-center gap-2">
                <Button size="sm" className="w-10 h-10 p-0">
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex justify-center gap-2">
                <Button size="sm" className="w-10 h-10 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" className="w-10 h-10 p-0">
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button size="sm" className="w-10 h-10 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Game Stats */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
            <h2 className="font-bold mb-3 text-lg">{lang === 'zh' ? '城市状态' : 'City Status'}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {lang === 'zh' ? '金币' : 'Money'}:
                </span>
                <span className="font-bold text-yellow-600">{gameState.money}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {lang === 'zh' ? '人口' : 'Population'}:
                </span>
                <span className="font-bold text-red-600">{gameState.population}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  {lang === 'zh' ? '食物' : 'Food'}:
                </span>
                <span className="font-bold text-green-600">{gameState.food}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {lang === 'zh' ? '能量' : 'Energy'}:
                </span>
                <span className="font-bold text-orange-600">{gameState.energy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Droplet className="w-4 h-4" />
                  {lang === 'zh' ? '水' : 'Water'}:
                </span>
                <span className="font-bold text-blue-600">{gameState.water}%</span>
              </div>
            </div>
          </Card>

          {/* Building Info */}
          {gameState.selectedBuilding && (
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50">
              <h3 className="font-bold mb-2">{gameState.selectedBuilding.type.toUpperCase()}</h3>
              <div className="space-y-1 text-xs">
                <p>
                  {lang === 'zh' ? '等级' : 'Level'}: {gameState.selectedBuilding.level}
                </p>
                <p>
                  {lang === 'zh' ? '生命值' : 'Health'}: {gameState.selectedBuilding.health}/{gameState.selectedBuilding.maxHealth}
                </p>
                {gameState.selectedBuilding.production && (
                  <p>
                    {lang === 'zh' ? '产量' : 'Production'}: {gameState.selectedBuilding.production.toFixed(1)}/s
                  </p>
                )}
                {gameState.selectedBuilding.workers && (
                  <p>
                    {lang === 'zh' ? '工人' : 'Workers'}: {gameState.selectedBuilding.workers}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Unit Info */}
          {gameState.selectedUnit && (
            <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50">
              <h3 className="font-bold mb-2">{gameState.selectedUnit.type.toUpperCase()}</h3>
              <div className="space-y-1 text-xs">
                <p>
                  {lang === 'zh' ? '位置' : 'Position'}: ({gameState.selectedUnit.x}, {gameState.selectedUnit.y})
                </p>
                <p>
                  {lang === 'zh' ? '生命值' : 'Health'}: {gameState.selectedUnit.health}/{gameState.selectedUnit.maxHealth}
                </p>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="font-bold mb-3">{lang === 'zh' ? '快速操作' : 'Quick Actions'}</h3>
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowBuildMenu(true)}
              >
                <Hammer className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '建造' : 'Build'}
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '招募' : 'Recruit'}
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '交易' : 'Trade'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Build Menu Dialog */}
      <Dialog open={showBuildMenu} onOpenChange={setShowBuildMenu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'zh' ? '建造菜单' : 'Build Menu'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button className="w-full justify-start" onClick={() => buildBuilding('house')}>
              <Home className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '房屋 (500 ISC)' : 'House (500 ISC)'}
            </Button>
            <Button className="w-full justify-start" onClick={() => buildBuilding('farm')}>
              <Leaf className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '农场 (300 ISC)' : 'Farm (300 ISC)'}
            </Button>
            <Button className="w-full justify-start" onClick={() => buildBuilding('shop')}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '商店 (800 ISC)' : 'Shop (800 ISC)'}
            </Button>
            <Button className="w-full justify-start" onClick={() => buildBuilding('factory')}>
              <Hammer className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '工厂 (1000 ISC)' : 'Factory (1000 ISC)'}
            </Button>
            <Button className="w-full justify-start" onClick={() => buildBuilding('bank')}>
              <DollarSign className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '银行 (1500 ISC)' : 'Bank (1500 ISC)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
