import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowUpCircle,
  Check,
  Coins,
  Eye,
  MapPinPlus,
  Package,
  Pin,
  RefreshCw,
  Sparkles,
  Store,
} from "lucide-react";
import {
  GAME_HUB_ASSET_SHOP_ITEMS,
  type GameHubAssetShopItem,
} from "./GameHubAssetShopPanel";

type InventoryFilter = "全部" | "建筑" | "装饰";
type InventoryFeedback = { type: "success" | "info"; text: string } | null;

export const INVENTORY_RECYCLE_RATE = 0.6;

export const getInventoryRecycleValue = (item: GameHubAssetShopItem) =>
  Math.floor(item.price * INVENTORY_RECYCLE_RATE);

export const MAX_BUILDING_LEVEL = 3;
export const getBuildingUpgradeCost = (item: GameHubAssetShopItem, level: number) =>
  Math.floor(item.price * 0.5 * level);
export const getBuildingEfficiency = (level: number) => 100 + Math.max(0, level - 1) * 25;

export type GameHubInventoryPanelProps = {
  ownedItemIds: string[];
  placedItemIds?: string[];
  buildingUpgradeLevels?: Record<string, number>;
  onPlace?: (item: GameHubAssetShopItem) => void;
  onUpgrade?: (item: GameHubAssetShopItem, cost: number) => boolean;
  onRecycle?: (item: GameHubAssetShopItem, refund: number) => void;
};

export function GameHubInventoryPanel({
  ownedItemIds,
  placedItemIds = [],
  buildingUpgradeLevels = {},
  onPlace = () => undefined,
  onUpgrade = () => false,
  onRecycle = () => undefined,
}: GameHubInventoryPanelProps) {
  const [filter, setFilter] = useState<InventoryFilter>("全部");
  const [featuredItemId, setFeaturedItemId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InventoryFeedback>(null);
  const [pendingRecycleItemId, setPendingRecycleItemId] = useState<string | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const ownedItems = useMemo(
    () => GAME_HUB_ASSET_SHOP_ITEMS.filter((item) => ownedItemIds.includes(item.id)),
    [ownedItemIds],
  );

  const visibleItems = useMemo(
    () => (filter === "全部" ? ownedItems : ownedItems.filter((item) => item.kind === filter)),
    [filter, ownedItems],
  );

  const pendingRecycleItem = ownedItems.find((item) => item.id === pendingRecycleItemId) ?? null;

  useEffect(() => {
    if (featuredItemId && !ownedItemIds.includes(featuredItemId)) {
      setFeaturedItemId(null);
    }
  }, [featuredItemId, ownedItemIds]);

  useEffect(() => () => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
  }, []);

  const showFeedback = (nextFeedback: NonNullable<InventoryFeedback>) => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    setFeedback(nextFeedback);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 2200);
  };

  const manageItem = (item: GameHubAssetShopItem) => {
    const isFeatured = featuredItemId === item.id;
    setFeaturedItemId(isFeatured ? null : item.id);
    showFeedback({
      type: "info",
      text: isFeatured ? `已取消 ${item.name} 的城市焦点。` : `已将 ${item.name} 设为城市焦点。`,
    });
  };

  const confirmRecycle = () => {
    if (!pendingRecycleItem) return;
    const refund = getInventoryRecycleValue(pendingRecycleItem);
    onRecycle(pendingRecycleItem, refund);
    setFeaturedItemId((current) => (current === pendingRecycleItem.id ? null : current));
    setPendingRecycleItemId(null);
    showFeedback({
      type: "success",
      text: `已回收 ${pendingRecycleItem.name}，返还 ${refund.toLocaleString()} 虚拟 ISC。`,
    });
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="fixed bottom-24 right-3 z-40 border-cyan-300/40 bg-slate-950/90 text-cyan-100 shadow-xl shadow-cyan-950/20 backdrop-blur-md hover:bg-cyan-300/20 sm:right-5"
            aria-label={`打开我的背包，已有 ${ownedItems.length} 件物品`}
            data-testid="game-inventory-open"
          >
            <Package className="mr-2 h-4 w-4" aria-hidden="true" />
            我的背包
            <Badge className="ml-2 border border-cyan-200/30 bg-cyan-200/10 px-1.5 text-[10px] text-cyan-100">
              {ownedItems.length}
            </Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[88vh] w-[min(42rem,calc(100vw-1.5rem))] overflow-y-auto border-cyan-300/30 bg-slate-950 text-slate-100 shadow-2xl shadow-cyan-950/40">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl text-cyan-50">
                  <Package className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                  我的背包
                </DialogTitle>
                <DialogDescription className="mt-1 text-slate-400">
                  查看本局商店已购的建筑与装饰物，并设置一个城市焦点展示。
                </DialogDescription>
              </div>
              <Badge className="border border-amber-300/30 bg-amber-300/10 text-amber-200">本局模拟</Badge>
            </div>
          </DialogHeader>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <Card className="border-cyan-300/20 bg-cyan-300/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/70">全部物品</p>
              <p data-testid="inventory-owned-count" className="mt-1 text-2xl font-semibold text-cyan-50">{ownedItems.length}</p>
            </Card>
            <Card className="border-emerald-300/20 bg-emerald-300/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-200/70">建筑</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-100">{ownedItems.filter((item) => item.kind === "建筑").length}</p>
            </Card>
            <Card className="border-violet-300/20 bg-violet-300/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-violet-200/70">装饰</p>
              <p className="mt-1 text-2xl font-semibold text-violet-100">{ownedItems.filter((item) => item.kind === "装饰").length}</p>
            </Card>
          </div>

          <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="背包分类筛选">
            {(["全部", "建筑", "装饰"] as InventoryFilter[]).map((itemFilter) => (
              <Button
                key={itemFilter}
                type="button"
                size="sm"
                variant={filter === itemFilter ? "default" : "outline"}
                role="tab"
                aria-selected={filter === itemFilter}
                data-testid={`inventory-filter-${itemFilter}`}
                onClick={() => setFilter(itemFilter)}
                className={filter === itemFilter ? "bg-cyan-600 text-white hover:bg-cyan-500" : "border-cyan-300/25 text-cyan-100"}
              >
                {itemFilter}
              </Button>
            ))}
          </div>

          {feedback && (
            <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${feedback.type === "success" ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200" : "border-cyan-300/35 bg-cyan-300/10 text-cyan-200"}`} role="status" aria-live="polite">
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>{feedback.text}</span>
            </div>
          )}

          {visibleItems.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="已拥有物品">
              {visibleItems.map((item) => {
                const isFeatured = featuredItemId === item.id;
                const isPlaced = placedItemIds.includes(item.id);
                const buildingLevel = buildingUpgradeLevels[item.id] ?? 1;
                const canUpgrade = item.kind === "建筑" && isPlaced && buildingLevel < MAX_BUILDING_LEVEL;
                const upgradeCost = getBuildingUpgradeCost(item, buildingLevel);
                const refund = getInventoryRecycleValue(item);
                return (
                  <Card
                    key={item.id}
                    data-testid={`inventory-item-${item.id}`}
                    className={`border p-3 transition-colors ${isFeatured ? "border-amber-300/55 bg-amber-300/10 shadow-lg shadow-amber-950/20" : "border-cyan-300/20 bg-slate-900/80"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-2xl" aria-hidden="true">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-cyan-50">{item.name}</h3>
                            <Badge variant="outline" className="border-cyan-300/25 text-[10px] text-cyan-200/80">{item.kind}</Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                        </div>
                      </div>
                      {isFeatured && <Pin className="h-4 w-4 shrink-0 text-amber-300" aria-label="城市焦点" />}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <div className="flex items-center gap-1 text-xs text-emerald-300">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>                          {isPlaced ? `已布置到城市 · L${buildingLevel} · 效率 ${getBuildingEfficiency(buildingLevel)}%` : isFeatured ? "城市焦点中" : "已存入背包"}</span>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={isPlaced ? "default" : "outline"}
                          onClick={() => {
                            if (!isPlaced) {
                              onPlace(item);
                              showFeedback({ type: "success", text: `已将 ${item.name} 布置到城市场景。` });
                            }
                          }}
                          disabled={isPlaced}
                          className={isPlaced ? "bg-emerald-600 text-white hover:bg-emerald-500" : "border-cyan-300/30 text-cyan-100"}
                          aria-label={isPlaced ? `${item.name}已布置` : `放置${item.name}到城市场景`}
                          data-testid={`inventory-place-${item.id}`}
                        >
                          <MapPinPlus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                          {isPlaced ? "已布置" : "放置"}
                        </Button>
                        {item.kind === "建筑" && isPlaced && (
                          <Button
                            type="button"
                            size="sm"
                            variant={canUpgrade ? "outline" : "default"}
                            disabled={!canUpgrade}
                            onClick={() => {
                              if (!canUpgrade) return;
                              const upgraded = onUpgrade(item, upgradeCost);
                              showFeedback({
                                type: upgraded ? "success" : "info",
                                text: upgraded ? `${item.name} 已升级至 L${buildingLevel + 1}，收益效率提升至 ${getBuildingEfficiency(buildingLevel + 1)}%。` : `升级 ${item.name} 需要 ${upgradeCost.toLocaleString()} 虚拟 ISC。`,
                              });
                            }}
                            className={canUpgrade ? "border-amber-300/30 text-amber-100 hover:bg-amber-300/10" : "bg-emerald-600 text-white"}
                            aria-label={canUpgrade ? `升级${item.name}，消耗${upgradeCost.toLocaleString()}虚拟 ISC` : buildingLevel >= MAX_BUILDING_LEVEL ? `${item.name}已达到最高等级` : `升级${item.name}不可用`}
                            data-testid={`inventory-upgrade-${item.id}`}
                          >
                            <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                            {buildingLevel >= MAX_BUILDING_LEVEL ? "MAX" : `升级 · ${upgradeCost.toLocaleString()}`}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={isFeatured ? "default" : "outline"}
                          onClick={() => manageItem(item)}
                          className={isFeatured ? "bg-amber-500 text-slate-950 hover:bg-amber-400" : "border-cyan-300/30 text-cyan-100"}
                          aria-label={isFeatured ? `取消${item.name}城市焦点` : `将${item.name}设为城市焦点`}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                          {isFeatured ? "取消焦点" : "设为焦点"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-rose-300/30 text-rose-200 hover:bg-rose-300/10"
                          onClick={() => setPendingRecycleItemId(item.id)}
                          aria-label={`回收${item.name}，返还${refund.toLocaleString()}虚拟 ISC`}
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                          回收
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-amber-200/80">
                      {item.kind === "建筑" && isPlaced && <span className="inline-flex items-center gap-1"><ArrowUpCircle className="h-3.5 w-3.5" aria-hidden="true" />升级后每级收益效率 +25%</span>}
                      <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5" aria-hidden="true" />回收返还 {refund.toLocaleString()} ISC（{Math.round(INVENTORY_RECYCLE_RATE * 100)}%）</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-cyan-300/25 bg-cyan-300/5 px-5 py-10 text-center">
              <Package className="mx-auto h-10 w-10 text-cyan-200/55" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-cyan-50">{ownedItems.length === 0 ? "背包还是空的" : "此分类暂无物品"}</h3>
              <p className="mt-1 text-sm text-slate-400">{ownedItems.length === 0 ? "前往城市资产商店购买建筑或装饰物，它们会自动出现在这里。" : "切换分类查看其他已购物品。"}</p>
              {ownedItems.length === 0 && <div className="mt-4 inline-flex items-center gap-2 text-xs text-amber-200"><Store className="h-3.5 w-3.5" aria-hidden="true" /><span>购买后实时同步至背包</span></div>}
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-slate-500">背包内容、回收比例和管理状态仅属于本局模拟会话，不代表真实链上 NFT 或资产所有权。</p>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingRecycleItem)} onOpenChange={(open) => !open && setPendingRecycleItemId(null)}>
        <AlertDialogContent className="border-rose-300/30 bg-slate-950 text-slate-100 shadow-2xl shadow-rose-950/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-100">确认回收{pendingRecycleItem ? `「${pendingRecycleItem.name}」` : "物品"}？</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              本局模拟将按购买价的 {Math.round(INVENTORY_RECYCLE_RATE * 100)}% 返还 {pendingRecycleItem ? `${getInventoryRecycleValue(pendingRecycleItem).toLocaleString()} 虚拟 ISC` : "虚拟 ISC"}，物品会从背包移除。此操作不可在本局模拟中撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-200">取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRecycle} className="bg-rose-600 text-white hover:bg-rose-500">确认回收</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default GameHubInventoryPanel;
