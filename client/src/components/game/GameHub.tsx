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
  Coins,
  Sparkles,
  TrendingUp,
  CheckCircle2,
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
import GameGuidePanel from "./GameGuidePanel";
import GameHubAssetShopPanel, { GAME_HUB_ASSET_SHOP_ITEMS, type GameHubAssetShopItem } from "./GameHubAssetShopPanel";
import GameHubInventoryPanel, { getBuildingEfficiency } from "./GameHubInventoryPanel";
import { getBuildingYieldAmount, getBuildingYieldParameters } from "./buildingEconomy";
import { ISCAmount, ISCLogo } from "@/components/ISCLogo";

type GameTab = "scenes" | "scene" | "npc" | "economy" | "tasks" | "property" | "farm" | "shop" | "social";

type CompletedBuilding = { id: string; name: string; revenue: number };

const COMPLETED_BUILDINGS: CompletedBuilding[] = [
  { id: "central-commerce-center", name: "中央商业中心", revenue: 6800 },
  { id: "aurora-plaza", name: "极光广场", revenue: 4200 },
  { id: "crystal-logistics-hub", name: "冰晶物流枢纽", revenue: 5100 },
];

export const GameHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>("scenes");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameTime, setGameTime] = useState(0);
  const [virtualAssets, setVirtualAssets] = useState(0);
  const [ownedShopItemIds, setOwnedShopItemIds] = useState<string[]>([]);
  const [placedShopItemIds, setPlacedShopItemIds] = useState<string[]>([]);
  const [recycleCoinFlight, setRecycleCoinFlight] = useState<{ amount: number; id: number } | null>(null);
  const [isAssetPanelPulsing, setIsAssetPanelPulsing] = useState(false);
  const [claimedBuildingIds, setClaimedBuildingIds] = useState<string[]>([]);
  const [buildingUpgradeLevels, setBuildingUpgradeLevels] = useState<Record<string, number>>({});
  const [buildingYieldReadyAt, setBuildingYieldReadyAt] = useState<Record<string, number>>({});
  const [bulkRevenueFlight, setBulkRevenueFlight] = useState<{ amount: number; id: number } | null>(null);

  // 模拟游戏时间流逝（100倍速）
  React.useEffect(() => {
    const interval = setInterval(() => {
      setGameTime((prev) => prev + 1); // 模拟分钟持续递增，展示时间仍按 24 小时循环
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const displayTime = `${String(Math.floor(gameTime / 100)).padStart(2, "0")}:${String((gameTime % 100) * 0.6).padStart(2, "0")}`;

  const handleRevenueClaim = (amount: number) => {
    setVirtualAssets((current) => current + amount);
  };

  const highestBuildingLevel = Math.max(1, ...Object.values(buildingUpgradeLevels));
  const buildingEfficiencyMultiplier = getBuildingEfficiency(highestBuildingLevel) / 100;
  const claimableBuildings = COMPLETED_BUILDINGS.filter((building) => (buildingYieldReadyAt[building.id] ?? 0) <= gameTime);
  const getBuildingLevel = (buildingId: string) => Math.max(1, buildingUpgradeLevels[buildingId] ?? 1);
  const getBuildingClaimAmount = (building: CompletedBuilding) => getBuildingYieldAmount(building.id, getBuildingLevel(building.id));
  const claimableRevenue = claimableBuildings.reduce((total, building) => total + getBuildingClaimAmount(building), 0);
  const buildingYieldStatuses = COMPLETED_BUILDINGS.map((building) => {
    const parameters = getBuildingYieldParameters(building.id);
    const level = getBuildingLevel(building.id);
    return {
      id: building.id,
      name: building.name,
      level,
      yieldAmount: getBuildingClaimAmount(building),
      cycleMinutes: parameters.cycleMinutes,
      readyAtMinute: buildingYieldReadyAt[building.id] ?? gameTime,
    };
  });

  const handleClaimAllRevenue = () => {
    if (claimableRevenue <= 0) return;
    setVirtualAssets((current) => current + claimableRevenue);
    setClaimedBuildingIds([]);
    setBuildingYieldReadyAt((current) => Object.fromEntries(COMPLETED_BUILDINGS.map((building) => [
      building.id,
      gameTime + getBuildingYieldParameters(building.id).cycleMinutes,
    ])));
    setBulkRevenueFlight({ amount: claimableRevenue, id: Date.now() });
    setIsAssetPanelPulsing(true);
    window.setTimeout(() => setBulkRevenueFlight(null), 980);
    window.setTimeout(() => setIsAssetPanelPulsing(false), 820);
  };

  const handleShopPurchase = (item: GameHubAssetShopItem) => {
    setVirtualAssets((current) => Math.max(0, current - item.price));
    setOwnedShopItemIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
  };

  const handleInventoryPlace = (item: GameHubAssetShopItem) => {
    setPlacedShopItemIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
  };

  const handleInventoryUpgrade = (item: GameHubAssetShopItem, cost: number) => {
    if (item.kind !== "建筑" || !placedShopItemIds.includes(item.id) || virtualAssets < cost) return false;
    setVirtualAssets((current) => current - cost);
    setBuildingUpgradeLevels((current) => ({ ...current, [item.id]: Math.min(3, (current[item.id] ?? 1) + 1) }));
    return true;
  };

  const handleInventoryRecycle = (item: GameHubAssetShopItem, refund: number) => {
    setPlacedShopItemIds((current) => current.filter((itemId) => itemId !== item.id));
    setVirtualAssets((current) => current + refund);
    setOwnedShopItemIds((current) => current.filter((itemId) => itemId !== item.id));
    setRecycleCoinFlight({ amount: refund, id: Date.now() });
    setIsAssetPanelPulsing(true);
    window.setTimeout(() => setRecycleCoinFlight(null), 920);
    window.setTimeout(() => setIsAssetPanelPulsing(false), 760);
  };

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
        return <PlayableGameScene placedAssets={GAME_HUB_ASSET_SHOP_ITEMS.filter((item) => placedShopItemIds.includes(item.id))} claimableBuildingIds={claimableBuildings.map((building) => building.id)} buildingYieldStatuses={buildingYieldStatuses} yieldGameTime={gameTime} />;
      case "scene":
        return <PlayableGameScene placedAssets={GAME_HUB_ASSET_SHOP_ITEMS.filter((item) => placedShopItemIds.includes(item.id))} claimableBuildingIds={claimableBuildings.map((building) => building.id)} buildingYieldStatuses={buildingYieldStatuses} yieldGameTime={gameTime} />;
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

      <Card
        data-testid="game-total-assets"
        className={`fixed right-3 top-20 z-40 w-[min(19rem,calc(100vw-1.5rem))] border-cyan-300/40 bg-slate-950/92 text-slate-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-md ${isAssetPanelPulsing ? "game-asset-panel-pulse" : ""}`}
      >
        <div className="flex items-center justify-between border-b border-cyan-300/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-300/40 bg-cyan-300/10">
              <TrendingUp className="h-4 w-4 text-cyan-200" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">资产中枢</p>
              <h2 className="text-sm font-semibold text-cyan-50">总资产 · Total Assets</h2>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] text-amber-200">本局模拟</span>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <ISCLogo size="lg" label="ISC 官方代币 Logo" />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400">虚拟 ISC 资产</p>
              <div data-testid="virtual-isc-total" className="mt-0.5 text-xl font-bold tracking-tight text-amber-100">
                <ISCAmount amount={virtualAssets.toLocaleString()} size="sm" label="虚拟 ISC" />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[11px] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>实时更新</span>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2 text-[11px] text-slate-400">
          <Coins className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
          <span>建设收益领取后自动计入本局总资产</span>
        </div>
      </Card>

      <Card className="fixed right-3 top-[19.5rem] z-40 w-[min(19rem,calc(100vw-1.5rem))] border-amber-300/30 bg-slate-950/92 text-slate-100 shadow-xl shadow-amber-950/20 backdrop-blur-md sm:right-5" data-testid="bulk-revenue-panel">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/70">完工收益</p>
            <p className="mt-1 truncate text-xs text-slate-300">{claimableBuildings.length > 0 ? `${claimableBuildings.length} 栋建筑可领取` : "本局收益已全部领取"}</p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleClaimAllRevenue}
            disabled={claimableRevenue <= 0}
            className="shrink-0 bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={claimableRevenue > 0 ? `一键收取 ${claimableRevenue.toLocaleString()} 虚拟 ISC` : "已收取全部完工建筑收益"}
            data-testid="claim-all-revenue"
          >
            {claimableRevenue > 0 ? <Coins className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />}
            {claimableRevenue > 0 ? "一键收取" : "已收取"}
          </Button>
        </div>
        <div className="border-t border-amber-300/15 px-3 py-2 text-[11px] text-amber-100/80" aria-live="polite" data-testid="claimable-revenue-summary">
          可领取：{claimableRevenue.toLocaleString()} 虚拟 ISC · 本局模拟
        </div>
      </Card>

      {bulkRevenueFlight && (
        <div
          key={bulkRevenueFlight.id}
          className="game-bulk-revenue-coin-flight"
          data-testid="bulk-revenue-coin-flight"
          role="status"
          aria-live="polite"
          aria-label={`一键收取 ${bulkRevenueFlight.amount.toLocaleString()} 虚拟 ISC，金币正在飞向总资产`}
        >
          <Coins className="h-5 w-5" aria-hidden="true" />
          <span>+{bulkRevenueFlight.amount.toLocaleString()}</span>
        </div>
      )}

      {recycleCoinFlight && (
        <div
          key={recycleCoinFlight.id}
          className="game-recycle-coin-flight"
          data-testid="recycle-coin-flight"
          role="status"
          aria-live="polite"
          aria-label={`回收返还 ${recycleCoinFlight.amount.toLocaleString()} 虚拟 ISC，正在计入总资产`}
        >
          <Coins className="h-5 w-5" aria-hidden="true" />
          <span>+{recycleCoinFlight.amount.toLocaleString()}</span>
        </div>
      )}

      <GameGuidePanel activeTab={activeTab} onSelectTab={setActiveTab} onRevenueClaim={handleRevenueClaim} />
      <GameHubAssetShopPanel balance={virtualAssets} ownedItemIds={ownedShopItemIds} onPurchase={handleShopPurchase} />
      <GameHubInventoryPanel ownedItemIds={ownedShopItemIds} placedItemIds={placedShopItemIds} buildingUpgradeLevels={buildingUpgradeLevels} onPlace={handleInventoryPlace} onUpgrade={handleInventoryUpgrade} onRecycle={handleInventoryRecycle} />

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
