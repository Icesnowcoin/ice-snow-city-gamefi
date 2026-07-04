'use client';

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sprout, Droplets, Sun, CheckCircle2, AlertCircle } from "lucide-react";

export const GameFarm: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 获取农场数据
  const { data: farmData, isLoading: farmLoading, refetch: refetchFarm } = 
    trpc.game.npc.getNpcsByScene.useQuery({ sceneId: "farm" }, { staleTime: 30000 });

  // 种植 mutation
  const plantMutation = trpc.game.npc.interact.useMutation({
    onSuccess: () => {
      refetchFarm();
      setFeedback({ type: 'success', message: '种植成功！' });
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error: any) => {
      setFeedback({ type: 'error', message: `种植失败: ${error.message}` });
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // 浇水 mutation
  const waterMutation = trpc.game.npc.interact.useMutation({
    onSuccess: () => {
      refetchFarm();
      setFeedback({ type: 'success', message: '浇水成功！' });
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error: any) => {
      setFeedback({ type: 'error', message: `浇水失败: ${error.message}` });
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // 收获 mutation
  const harvestMutation = trpc.game.npc.interact.useMutation({
    onSuccess: () => {
      refetchFarm();
      setFeedback({ type: 'success', message: '收获成功！' });
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error: any) => {
      setFeedback({ type: 'error', message: `收获失败: ${error.message}` });
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handlePlant = async (cropId: string) => {
    setIsProcessing(true);
    await plantMutation.mutateAsync({ npcId: cropId, type: "greet" });
  };

  const handleWater = async (cropId: string) => {
    setIsProcessing(true);
    await waterMutation.mutateAsync({ npcId: cropId, type: "gift" });
  };

  const handleHarvest = async (cropId: string) => {
    setIsProcessing(true);
    await harvestMutation.mutateAsync({ npcId: cropId, type: "trade" });
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

      {/* 反馈消息 */}
      {feedback && (
        <div className={`mb-4 p-3 rounded flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <AlertCircle className="w-5 h-5 text-white" />
          )}
          <span className="text-white text-sm">{feedback.message}</span>
        </div>
      )}

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
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Sprout className="w-4 h-4 mr-1" />
                      )}
                      种植
                    </Button>
                  )}
                  {crop.status === "growing" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWater(crop.id);
                      }}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Droplets className="w-4 h-4 mr-1" />
                      )}
                      浇水
                    </Button>
                  )}
                  {crop.status === "ready" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHarvest(crop.id);
                      }}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Sprout className="w-4 h-4 mr-1" />
                      )}
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
