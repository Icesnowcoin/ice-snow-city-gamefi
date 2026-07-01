import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sprout, Droplets, Sun } from "lucide-react";

export const GameFarm: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  // 获取农场数据
  const { data: farmData, isLoading: farmLoading, refetch: refetchFarm } = 
    trpc.game.npc.getNpcsByScene.useQuery({ sceneId: "farm" }, { staleTime: 30000 });

  // 种植 mutation
  const plantMutation = trpc.game.npc.interactWithNPC.useMutation({
    onSuccess: () => {
      refetchFarm();
      console.log("种植成功");
    },
    onError: (error: any) => {
      console.error("种植失败:", error.message);
    },
  });

  // 收获 mutation
  const harvestMutation = trpc.game.npc.interactWithNPC.useMutation({
    onSuccess: () => {
      refetchFarm();
      console.log("收获成功");
    },
    onError: (error: any) => {
      console.error("收获失败:", error.message);
    },
  });

  const handlePlant = async (cropId: string) => {
    await plantMutation.mutateAsync({
      npcId: cropId,
      action: "greet",
    });
  };

  const handleHarvest = async (cropId: string) => {
    await harvestMutation.mutateAsync({
      npcId: cropId,
      action: "talk",
    });
  };

  if (farmLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // 模拟农作物数据
  const crops = [
    { id: "wheat", name: "小麦", growTime: "5天", yield: 100, price: 50, status: "ready" },
    { id: "corn", name: "玉米", growTime: "7天", yield: 150, price: 75, status: "growing" },
    { id: "rice", name: "水稻", growTime: "6天", yield: 120, price: 60, status: "ready" },
    { id: "tomato", name: "番茄", growTime: "4天", yield: 80, price: 40, status: "empty" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">农业系统</h1>

      {/* 农作物列表 */}
      <div className="space-y-3 mb-6">
        {crops.map((crop) => (
          <Card
            key={crop.id}
            className="bg-green-700 bg-opacity-30 border-green-500 p-4 cursor-pointer hover:bg-opacity-50 transition-all"
            onClick={() => setSelectedCrop(crop.id)}
          >
            <div className="flex items-start gap-4">
              <Sprout className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{crop.name}</h3>
                
                {/* 作物信息 */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-green-900 bg-opacity-30 p-2 rounded">
                    <p className="text-green-300 text-xs">生长时间</p>
                    <p className="text-white font-bold text-sm">{crop.growTime}</p>
                  </div>
                  <div className="bg-green-900 bg-opacity-30 p-2 rounded">
                    <p className="text-green-300 text-xs">产量</p>
                    <p className="text-white font-bold text-sm">{crop.yield}kg</p>
                  </div>
                  <div className="bg-green-900 bg-opacity-30 p-2 rounded">
                    <p className="text-green-300 text-xs">价格</p>
                    <p className="text-white font-bold text-sm">{crop.price} ISC</p>
                  </div>
                </div>

                {/* 生长进度 */}
                {crop.status === "growing" && (
                  <div className="mt-3">
                    <div className="flex-1 bg-green-900 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: "60%" }}
                      />
                    </div>
                    <p className="text-green-300 text-xs mt-1">生长中 60%</p>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3">
                  {crop.status === "empty" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlant(crop.id);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      <Sprout className="w-4 h-4 mr-1" />
                      种植
                    </Button>
                  )}
                  {crop.status === "ready" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHarvest(crop.id);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                    >
                      <Sprout className="w-4 h-4 mr-1" />
                      收获
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 农场统计 */}
      <Card className="bg-green-700 bg-opacity-30 border-green-500 p-4 mb-6">
        <h3 className="font-bold text-white mb-4">农场统计</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-400" />
              <span className="text-green-200">已种植作物</span>
            </div>
            <span className="text-white font-bold">2</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-400" />
              <span className="text-green-200">可收获作物</span>
            </div>
            <span className="text-white font-bold">2</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              <span className="text-green-200">月产值</span>
            </div>
            <span className="text-green-400 font-bold">+8000 ISC</span>
          </div>
        </div>
      </Card>

      {/* 农业建议 */}
      <Card className="bg-green-700 bg-opacity-30 border-green-500 p-4">
        <h3 className="font-bold text-white mb-3">农业建议</h3>
        <p className="text-green-200 text-sm">
          农业是稳定收入的来源。不同作物有不同的生长时间和产量。合理规划种植计划可以最大化收益。
        </p>
      </Card>
    </div>
  );
};

export default GameFarm;
