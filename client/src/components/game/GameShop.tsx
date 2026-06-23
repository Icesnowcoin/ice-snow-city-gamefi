import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShoppingCart, Star, TrendingUp } from "lucide-react";

export const GameShop: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // 获取商品列表
  const { data: items, isLoading: itemsLoading, refetch: refetchItems } = 
    trpc.gameCore.npc.getNpcsByScene.useQuery({ scene: "shop" }, { staleTime: 30000 });

  // 购买 mutation
  const buyMutation = trpc.gameCore.npc.interactWithNpc.useMutation({
    onSuccess: () => {
      refetchItems();
      setQuantity(1);
      console.log("购买成功");
    },
    onError: (error: any) => {
      console.error("购买失败:", error.message);
    },
  });

  const handleBuy = async (itemId: string) => {
    await buyMutation.mutateAsync({
      npcId: itemId,
      action: "greet",
    });
  };

  if (itemsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // 模拟商品数据
  const products = [
    { id: "food", name: "食物", price: 50, rating: 4.5, sales: 1200, category: "日用品" },
    { id: "water", name: "水", price: 30, rating: 4.8, sales: 2000, category: "日用品" },
    { id: "clothes", name: "衣服", price: 200, rating: 4.3, sales: 500, category: "服装" },
    { id: "furniture", name: "家具", price: 500, rating: 4.6, sales: 300, category: "家居" },
    { id: "electronics", name: "电子产品", price: 1000, rating: 4.7, sales: 150, category: "电子" },
    { id: "book", name: "书籍", price: 80, rating: 4.9, sales: 800, category: "文化" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">商城系统</h1>

      {/* 商品列表 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="bg-blue-700 bg-opacity-30 border-blue-500 p-3 cursor-pointer hover:bg-opacity-50 transition-all"
            onClick={() => setSelectedItem(product.id)}
          >
            <div className="flex flex-col h-full">
              <h3 className="font-bold text-white text-sm">{product.name}</h3>
              <p className="text-blue-300 text-xs mt-1">{product.category}</p>
              
              {/* 评分 */}
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold">{product.rating}</span>
                <span className="text-blue-300 text-xs">({product.sales})</span>
              </div>

              {/* 价格 */}
              <p className="text-green-400 font-bold text-sm mt-2">{product.price} ISC</p>

              {/* 购买按钮 */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuy(product.id);
                }}
                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs py-1"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                购买
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* 商城统计 */}
      <Card className="bg-blue-700 bg-opacity-30 border-blue-500 p-4 mb-6">
        <h3 className="font-bold text-white mb-4">商城数据</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <span className="text-blue-200">商品总数</span>
            </div>
            <span className="text-white font-bold">{products.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-blue-200">总销售额</span>
            </div>
            <span className="text-green-400 font-bold">+50000 ISC</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-blue-200">平均评分</span>
            </div>
            <span className="text-yellow-400 font-bold">4.6</span>
          </div>
        </div>
      </Card>

      {/* 热销商品 */}
      <Card className="bg-blue-700 bg-opacity-30 border-blue-500 p-4">
        <h3 className="font-bold text-white mb-3">热销排行</h3>
        <div className="space-y-2">
          {products
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3)
            .map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold text-sm">#{index + 1}</span>
                  <span className="text-blue-200 text-sm">{product.name}</span>
                </div>
                <span className="text-green-400 text-sm font-bold">{product.sales} 件</span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default GameShop;
