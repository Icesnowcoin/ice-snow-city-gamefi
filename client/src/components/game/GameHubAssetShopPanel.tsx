import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Check,
  Coins,
  LockKeyhole,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ISCAmount, ISCLogo } from "@/components/ISCLogo";

export type GameHubAssetShopItem = {
  id: string;
  name: string;
  kind: "建筑" | "装饰";
  icon: string;
  price: number;
  description: string;
  benefit: string;
};

export const GAME_HUB_ASSET_SHOP_ITEMS: GameHubAssetShopItem[] = [
  {
    id: "crystal-plaza",
    name: "冰晶广场",
    kind: "建筑",
    icon: "🏙️",
    price: 5000,
    description: "为城市核心增加一座可升级的公共商业空间。",
    benefit: "+120 城市容量 · 解锁广场活动",
  },
  {
    id: "city-skyline",
    name: "天际线塔楼",
    kind: "建筑",
    icon: "🏢",
    price: 6800,
    description: "提升城市天际线层级，提供商业经营加成。",
    benefit: "+4% 商业繁荣度 · +80 收益效率",
  },
  {
    id: "aurora-fountain",
    name: "极光喷泉",
    kind: "装饰",
    icon: "⛲",
    price: 1800,
    description: "可放置在城市公共区域的极光主题景观装饰。",
    benefit: "+3 城市魅力 · 夜景光效",
  },
  {
    id: "snowflake-garden",
    name: "雪花生态花园",
    kind: "装饰",
    icon: "🌲",
    price: 2400,
    description: "为街区增加绿化和冰雪主题的休闲空间。",
    benefit: "+5 居民幸福度 · 生态标签",
  },
];

type ShopFeedback = {
  type: "success" | "error";
  text: string;
} | null;

export type GameHubAssetShopPanelProps = {
  balance: number;
  ownedItemIds: string[];
  onPurchase: (item: GameHubAssetShopItem) => void;
};

export function GameHubAssetShopPanel({
  balance,
  ownedItemIds,
  onPurchase,
}: GameHubAssetShopPanelProps) {
  const [feedback, setFeedback] = useState<ShopFeedback>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const showFeedback = (nextFeedback: NonNullable<ShopFeedback>) => {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 2200);
  };

  const handlePurchase = (item: GameHubAssetShopItem) => {
    if (pendingItemId !== null) return;
    if (ownedItemIds.includes(item.id)) {
      showFeedback({ type: "error", text: `${item.name} 已在本局资产中。` });
      return;
    }
    if (balance < item.price) {
      showFeedback({
        type: "error",
        text: `虚拟 ISC 余额不足：需要 ${item.price.toLocaleString()}，当前 ${balance.toLocaleString()}。`,
      });
      return;
    }

    setPendingItemId(item.id);
    onPurchase(item);
    showFeedback({ type: "success", text: `已购买 ${item.name}，-${item.price.toLocaleString()} 虚拟 ISC。` });
    window.setTimeout(() => setPendingItemId(null), 240);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="fixed bottom-24 left-3 z-40 w-auto border-amber-300/40 bg-slate-950/90 text-amber-100 shadow-xl shadow-amber-950/20 backdrop-blur-md hover:bg-amber-300/20 sm:left-5"
          aria-label="打开虚拟资产商店"
        >
          <Store className="mr-2 h-4 w-4" aria-hidden="true" />
          打开虚拟资产商店
          <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-amber-200/70">模拟</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] w-[min(42rem,calc(100vw-1.5rem))] overflow-y-auto border-cyan-300/30 bg-slate-950 text-slate-100 shadow-2xl shadow-cyan-950/40">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl text-cyan-50">
                <ShoppingBag className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                城市资产商店
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-400">
                使用本局收集的虚拟 ISC 购置新建筑和装饰物，购买后会计入本局库存。
              </DialogDescription>
            </div>
            <Badge className="border border-amber-300/30 bg-amber-300/10 text-amber-200">模拟数据</Badge>
          </div>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-3">
          <div className="flex items-center gap-2">
            <ISCLogo size="sm" label="ISC 官方代币 Logo" />
            <div>
              <p className="text-[11px] text-slate-400">本局可用虚拟资产</p>
              <ISCAmount amount={balance.toLocaleString()} size="sm" label="虚拟 ISC" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{ownedItemIds.length} 件已拥有</span>
          </div>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              feedback.type === "success"
                ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200"
                : "border-rose-300/35 bg-rose-300/10 text-rose-200"
            }`}
            role="status"
            aria-live="polite"
          >
            {feedback.type === "success" ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <X className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2" aria-label="可购买的建筑和装饰物">
          {GAME_HUB_ASSET_SHOP_ITEMS.map((item) => {
            const isOwned = ownedItemIds.includes(item.id);
            const isAffordable = balance >= item.price;
            const isPending = pendingItemId === item.id;

            return (
              <Card
                key={item.id}
                className={`border p-3 text-slate-100 transition-colors ${
                  isOwned
                    ? "border-emerald-300/35 bg-emerald-300/10"
                    : "border-cyan-300/20 bg-slate-900/80 hover:border-cyan-300/45"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-2xl" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-cyan-50">{item.name}</h3>
                        <Badge variant="outline" className="border-cyan-300/25 text-[10px] text-cyan-200/80">{item.kind}</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-sm font-semibold text-amber-100">
                      <Coins className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                      <span>{item.price.toLocaleString()} ISC</span>
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-300/85">{item.benefit}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isOwned || isPending || !isAffordable}
                    onClick={() => handlePurchase(item)}
                    className={isOwned ? "bg-emerald-700/60 text-emerald-100" : isAffordable ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-slate-700 text-slate-400"}
                    aria-label={isOwned ? `已拥有${item.name}` : `购买${item.name}`}
                  >
                    {isOwned ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        已拥有
                      </>
                    ) : !isAffordable ? (
                      <>
                        <LockKeyhole className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        余额不足
                      </>
                    ) : isPending ? (
                      "处理中…"
                    ) : (
                      "购买"
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-slate-500">
          以上商品、价格和收益均为本局模拟数据，不会扣除真实 ISC 或发起链上交易。
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default GameHubAssetShopPanel;
