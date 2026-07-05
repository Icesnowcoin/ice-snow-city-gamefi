import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sprout, Droplets, Sun, CheckCircle2, AlertCircle, Plus } from "lucide-react";

type FeedbackMessage = {
  type: "success" | "error";
  text: string;
} | null;

export const GameFarm: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);
  const [newFarmName, setNewFarmName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 获取游戏状态（包含农场数据）
  const { data: gameState, isLoading: stateLoading, refetch: refetchState } =
    trpc.game.core.getState.useQuery(undefined, { staleTime: 30000 });

  // 获取玩家统计
  const { data: playerStats } =
    trpc.game.core.getPlayerStats.useQuery(undefined, { staleTime: 30000 });

  // 创建农场 mutation
  const createFarmMutation = trpc.game.core.createFarm.useMutation({
    onSuccess: () => {
      refetchState();
      setNewFarmName("");
      setShowCreateForm(false);
      showFeedbackMsg("success", "农场创建成功！");
    },
    onError: (error: any) => {
      showFeedbackMsg("error", `创建失败: ${error.message}`);
    },
  });

  // 收获 mutation
  const harvestMutation = trpc.game.core.harvestCrop.useMutation({
    onSuccess: () => {
      refetchState();
      showFeedbackMsg("success", "收获成功！获得作物收益");
    },
    onError: (error: any) => {
      showFeedbackMsg("error", `收获失败: ${error.message}`);
    },
  });

  const showFeedbackMsg = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreateFarm = async () => {
    if (!newFarmName.trim()) {
      showFeedbackMsg("error", "请输入农场名称");
      return;
    }
    await createFarmMutation.mutateAsync({
      name: newFarmName,
      location: "city_farm",
      size: 4,
    });
  };

  const handleHarvest = async (farmId: string, cropId: string) => {
    await harvestMutation.mutateAsync({ farmId, cropId, yieldAmount: 10 });
  };

  if (stateLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
        <span className="ml-2 text-green-200">加载农场数据...</span>
      </div>
    );
  }

  const farms = gameState?.farms || [];

  // 可种植的作物类型
  const cropTypes = [
    { id: "wheat", name: "小麦", growTime: "5天", yield: 100, price: 50 },
    { id: "corn", name: "玉米", growTime: "7天", yield: 150, price: 75 },
    { id: "rice", name: "水稻", growTime: "6天", yield: 120, price: 60 },
    { id: "tomato", name: "番茄", growTime: "4天", yield: 80, price: 40 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">🌾 农业系统</h1>

      {/* 反馈消息 */}
      {feedback && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          feedback.type === "success" ? "bg-green-600/50 border border-green-500" : "bg-red-600/50 border border-red-500"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-300" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-300" />
          )}
          <span className="text-white text-sm">{feedback.text}</span>
        </div>
      )}

      {/* 农场统计 */}
      <Card className="bg-green-700/30 border-green-500 p-4 mb-6">
        <h3 className="font-bold text-white mb-4">📊 农场统计</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-900/30 p-3 rounded-lg text-center">
            <Sprout className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{playerStats?.farmsCreated || farms.length}</p>
            <p className="text-green-300 text-xs">农场数量</p>
          </div>
          <div className="bg-green-900/30 p-3 rounded-lg text-center">
            <Sun className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">
              {farms.reduce((total: number, f: any) => total + (f.crops?.length || 0), 0)}
            </p>
            <p className="text-green-300 text-xs">种植中</p>
          </div>
          <div className="bg-green-900/30 p-3 rounded-lg text-center">
            <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">
              {farms.reduce((total: number, f: any) => total + (f.availablePlots || 0), 0)}
            </p>
            <p className="text-green-300 text-xs">空闲地块</p>
          </div>
        </div>
      </Card>

      {/* 创建农场 */}
      <div className="mb-6">
        {!showCreateForm ? (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建新农场
          </Button>
        ) : (
          <Card className="bg-green-700/30 border-green-500 p-4">
            <h4 className="font-bold text-white mb-3">创建新农场</h4>
            <input
              type="text"
              value={newFarmName}
              onChange={(e) => setNewFarmName(e.target.value)}
              placeholder="输入农场名称..."
              className="w-full bg-green-900/50 border border-green-500 rounded-lg px-3 py-2 text-white placeholder-green-400 mb-3"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateFarm}
                disabled={createFarmMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {createFarmMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Sprout className="w-4 h-4 mr-1" />
                )}
                确认创建
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="border-green-500 text-green-300"
              >
                取消
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* 我的农场列表 */}
      {farms.length > 0 ? (
        <div className="mb-6">
          <h3 className="font-bold text-white mb-3">🏡 我的农场</h3>
          <div className="space-y-3">
            {farms.map((farm: any) => (
              <Card key={farm.id} className="bg-green-700/30 border-green-500 p-4">
                <div className="flex items-start gap-3">
                  <Sprout className="w-8 h-8 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{farm.name}</h4>
                    <p className="text-green-300 text-sm">
                      {farm.totalPlots} 块地 · {farm.availablePlots} 块空闲
                    </p>

                    {/* 作物列表 */}
                    {farm.crops && farm.crops.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {farm.crops.map((crop: any) => (
                          <div key={crop.id} className="flex items-center justify-between bg-green-900/30 p-2 rounded">
                            <span className="text-green-200 text-sm">{crop.type || crop.id}</span>
                            <Button
                              size="sm"
                              onClick={() => handleHarvest(farm.id, crop.id)}
                              disabled={harvestMutation.isPending}
                              className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                            >
                              {harvestMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "收获"
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-green-400 text-xs mt-2">暂无种植作物</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 mb-6">
          <Sprout className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
          <p className="text-green-300">暂无农场</p>
          <p className="text-green-400 text-sm mt-1">创建一个农场开始种植吧！</p>
        </div>
      )}

      {/* 作物百科 */}
      <h3 className="font-bold text-white mb-3">📖 作物百科</h3>
      <div className="grid grid-cols-2 gap-3">
        {cropTypes.map((crop) => (
          <Card key={crop.id} className="bg-green-700/30 border-green-500 p-3">
            <h4 className="font-bold text-white text-sm">{crop.name}</h4>
            <div className="mt-2 space-y-1">
              <p className="text-green-300 text-xs">生长: {crop.growTime}</p>
              <p className="text-green-300 text-xs">产量: {crop.yield}kg</p>
              <p className="text-yellow-400 text-xs font-bold">{crop.price} ISC/kg</p>
            </div>
          </Card>
        ))}
      </div>

      {/* 农业建议 */}
      <Card className="bg-green-700/30 border-green-500 p-4 mt-6">
        <h3 className="font-bold text-white mb-3">💡 农业建议</h3>
        <p className="text-green-200 text-sm">
          农业是稳定收入的来源。不同作物有不同的生长时间和产量。合理规划种植计划可以最大化收益。
        </p>
      </Card>
    </div>
  );
};

export default GameFarm;
