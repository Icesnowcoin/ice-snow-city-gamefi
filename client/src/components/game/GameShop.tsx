import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShoppingCart, Star, TrendingUp, AlertCircle, CheckCircle2, Package } from "lucide-react";

type FeedbackMessage = {
  type: "success" | "error";
  text: string;
} | null;

export const GameShop: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);

  // 获取商品列表（从真实后端）
  const { data: items, isLoading: itemsLoading, refetch: refetchItems } =
    trpc.game.consumption.getAvailableItems.useQuery(undefined, { staleTime: 30000 });

  // 获取钱包余额
  const { data: wallet } =
    trpc.game.core.getWalletBalance.useQuery(undefined, { staleTime: 30000 });

  // 购买 mutation
  const buyMutation = trpc.game.consumption.consumeItem.useMutation({
    onSuccess: (data) => {
      refetchItems();
      setQuantity(1);
      setSelectedItem(null);
      showFeedback("success", `成功购买 ${data.itemName} x${data.quantity}！花费 ${data.totalCost} ISC`);
    },
    onError: (error: any) => {
      showFeedback("error", `购买失败: ${error.message}`);
    },
  });

  // 显示反馈
  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleBuy = async (itemId: string) => {
    const item = items?.find((i: any) => i.id === itemId);
    if (!item) return;

    const totalCost = item.price * quantity;
    if (!wallet || wallet.money < totalCost) {
      showFeedback("error", `余额不足！需要 ${totalCost} ISC，当前余额 ${wallet?.money || 0} ISC`);
      return;
    }

    await buyMutation.mutateAsync({ itemId, quantity });
  };

  if (itemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-2 text-blue-200">加载商品数据...</span>
      </div>
    );
  }

  // 按分类分组商品
  const categories = items ? Array.from(new Set(items.map((i: any) => i.category))) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">🛒 商城系统</h1>

      {/* 反馈消息 */}
      {feedback && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          feedback.type === "success" ? "bg-green-900/50 border border-green-500" : "bg-red-900/50 border border-red-500"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={feedback.type === "success" ? "text-green-200" : "text-red-200"}>
            {feedback.text}
          </span>
        </div>
      )}

      {/* 钱包余额 */}
      <Card className="bg-blue-700/30 border-blue-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <span className="text-blue-200">可用余额</span>
          </div>
          <span className="text-white font-bold text-lg">{wallet?.money || 0} ISC</span>
        </div>
      </Card>

      {/* 商品列表 - 按分类显示 */}
      {categories.length > 0 ? (
        categories.map((category: string) => {
          const categoryItems = items?.filter((i: any) => i.category === category) || [];
          const categoryLabel = category === "food" ? "🍔 食品" :
            category === "drink" ? "🥤 饮品" :
            category === "entertainment" ? "🎮 娱乐" :
            category === "medicine" ? "💊 药品" : category;

          return (
            <div key={category} className="mb-6">
              <h3 className="font-bold text-white mb-3">{categoryLabel}</h3>
              <div className="grid grid-cols-2 gap-3">
                {categoryItems.map((item: any) => {
                  const isSelected = selectedItem === item.id;
                  const totalCost = item.price * (isSelected ? quantity : 1);
                  const canAfford = (wallet?.money || 0) >= totalCost;

                  return (
                    <Card
                      key={item.id}
                      className={`bg-blue-700 bg-opacity-30 border-blue-500 p-3 cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-blue-400 bg-opacity-50" : "hover:bg-opacity-50"
                      }`}
                      onClick={() => {
                        setSelectedItem(isSelected ? null : item.id);
                        setQuantity(1);
                      }}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{item.icon || "📦"}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            item.effect === "health" ? "bg-red-900/50 text-red-300" :
                            item.effect === "energy" ? "bg-yellow-900/50 text-yellow-300" :
                            item.effect === "happiness" ? "bg-pink-900/50 text-pink-300" :
                            "bg-blue-900/50 text-blue-300"
                          }`}>
                            +{item.effectAmount} {item.effect === "health" ? "生命" :
                              item.effect === "energy" ? "能量" :
                              item.effect === "happiness" ? "快乐" : item.effect}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-2">{item.name}</h4>
                        <p className="text-blue-300 text-xs mt-1 flex-1">{item.description}</p>
                        <p className="text-green-400 font-bold text-sm mt-2">{item.price} ISC</p>

                        {/* 展开的购买面板 */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-blue-500/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-200 text-xs">数量:</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 text-xs"
                                  onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                                >
                                  -
                                </Button>
                                <span className="text-white font-bold text-sm w-6 text-center">{quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 text-xs"
                                  onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1); }}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <p className="text-yellow-400 text-xs mb-2">
                              总计: {totalCost} ISC
                            </p>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuy(item.id);
                              }}
                              disabled={!canAfford || buyMutation.isPending}
                              className={`w-full text-xs py-1 ${
                                canAfford ? "bg-green-600 hover:bg-green-700" : "bg-red-600 cursor-not-allowed"
                              }`}
                            >
                              {buyMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : canAfford ? (
                                <>
                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                  确认购买
                                </>
                              ) : (
                                "余额不足"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-50" />
          <p className="text-blue-300">商城暂无商品</p>
          <p className="text-blue-400 text-sm mt-1">稍后再来看看吧！</p>
        </div>
      )}

      {/* 商城统计 */}
      <Card className="bg-blue-700 bg-opacity-30 border-blue-500 p-4 mt-6">
        <h3 className="font-bold text-white mb-4">📊 商城数据</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <span className="text-blue-200">商品总数</span>
            </div>
            <span className="text-white font-bold">{items?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-blue-200">分类数量</span>
            </div>
            <span className="text-yellow-400 font-bold">{categories.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-blue-200">当前余额</span>
            </div>
            <span className="text-green-400 font-bold">{wallet?.money || 0} ISC</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GameShop;
