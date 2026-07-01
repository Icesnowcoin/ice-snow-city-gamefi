import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Home, TrendingUp, Users } from "lucide-react";

export const GameProperty: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  // 获取玩家房产
  const { data: properties, isLoading: propertiesLoading, refetch: refetchProperties } = 
    trpc.game.npc.getNpcsByScene.useQuery({ sceneId: "real_estate" }, { staleTime: 30000 });

  // 购买房产 mutation
  const buyMutation = trpc.game.npc.interactWithNPC.useMutation({
    onSuccess: () => {
      refetchProperties();
      console.log("房产购买成功");
    },
    onError: (error: any) => {
      console.error("购买失败:", error.message);
    },
  });

  const handleBuy = async (propertyId: string) => {
    await buyMutation.mutateAsync({
      npcId: propertyId,
      action: "greet",
    });
  };

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">房地产系统</h1>

      {/* 房产列表 */}
      <div className="space-y-3 mb-6">
        {properties && properties.length > 0 ? (
          properties.map((property: any) => (
            <Card
              key={property.id}
              className="bg-amber-700 bg-opacity-30 border-amber-500 p-4 cursor-pointer hover:bg-opacity-50 transition-all"
              onClick={() => setSelectedProperty(property.id)}
            >
              <div className="flex items-start gap-4">
                <Home className="w-8 h-8 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">{property.name}</h3>
                  <p className="text-amber-200 text-sm mt-1">{property.title}</p>
                  
                  {/* 房产信息 */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-amber-900 bg-opacity-30 p-2 rounded">
                      <p className="text-amber-300 text-xs">价格</p>
                      <p className="text-white font-bold">{property.affinity || 50000} ISC</p>
                    </div>
                    <div className="bg-amber-900 bg-opacity-30 p-2 rounded">
                      <p className="text-amber-300 text-xs">租金收入</p>
                      <p className="text-white font-bold">+{Math.floor((property.affinity || 50000) * 0.05)} ISC/月</p>
                    </div>
                  </div>

                  {/* 购买按钮 */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuy(property.id);
                    }}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  >
                    购买房产
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-amber-300 text-center py-8">暂无房产</p>
        )}
      </div>

      {/* 房产统计 */}
      <Card className="bg-amber-700 bg-opacity-30 border-amber-500 p-4 mb-6">
        <h3 className="font-bold text-white mb-4">房产统计</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200">已拥有房产</span>
            </div>
            <span className="text-white font-bold">3</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-amber-200">月租金收入</span>
            </div>
            <span className="text-green-400 font-bold">+15000 ISC</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-amber-200">租户数量</span>
            </div>
            <span className="text-white font-bold">12</span>
          </div>
        </div>
      </Card>

      {/* 房产投资建议 */}
      <Card className="bg-amber-700 bg-opacity-30 border-amber-500 p-4">
        <h3 className="font-bold text-white mb-3">投资建议</h3>
        <p className="text-amber-200 text-sm">
          房地产是长期投资的最佳选择。购买房产后，每月可获得稳定的租金收入。房产价值会随着城市发展而增长。
        </p>
      </Card>
    </div>
  );
};

export default GameProperty;
