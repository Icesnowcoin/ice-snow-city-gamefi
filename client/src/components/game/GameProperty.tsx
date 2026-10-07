import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Home, TrendingUp, Users, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";

type FeedbackMessage = {
  type: "success" | "error";
  text: string;
} | null;

export const GameProperty: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);

  // 获取游戏状态（包含房产数据）
  const { data: gameState, isLoading: stateLoading, refetch: refetchState } =
    trpc.game.core.getState.useQuery(undefined, { staleTime: 30000 });

  // 获取玩家统计
  const { data: playerStats } =
    trpc.game.core.getPlayerStats.useQuery(undefined, { staleTime: 30000 });

  // 获取钱包余额
  const { data: wallet } =
    trpc.game.core.getWalletBalance.useQuery(undefined, { staleTime: 30000 });

  // 显示反馈
  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  // 可购买的房产列表（模拟市场）
  const marketProperties = [
    { id: "apt_001", name: "冰雪公寓 A座", type: "公寓", price: 50000, monthlyRent: 2500, area: 80, location: "市中心" },
    { id: "apt_002", name: "冰雪公寓 B座", type: "公寓", price: 35000, monthlyRent: 1800, area: 60, location: "东区" },
    { id: "villa_001", name: "雪景别墅", type: "别墅", price: 150000, monthlyRent: 8000, area: 200, location: "北区" },
    { id: "shop_001", name: "商业门面 1号", type: "商铺", price: 80000, monthlyRent: 5000, area: 50, location: "商业街" },
    { id: "farm_001", name: "城郊农场", type: "农场", price: 25000, monthlyRent: 1200, area: 500, location: "郊区" },
    { id: "office_001", name: "写字楼单元", type: "办公", price: 120000, monthlyRent: 6500, area: 100, location: "CBD" },
  ];

  // 获取玩家已拥有的房产
  const ownedProperties = gameState?.properties || [];
  const ownedPropertyIds = ownedProperties.map((p: any) => p.id);

  // 计算月租金收入
  const monthlyIncome = ownedProperties.reduce((total: number, p: any) => total + (p.rentalIncome || 0), 0);
  const totalValue = ownedProperties.reduce((total: number, p: any) => total + (p.price || 0), 0);

  // 购买房产 mutation
  const purchaseMutation = trpc.game.core.purchaseProperty.useMutation({
    onSuccess: () => {
      refetchState();
    },
  });

  const handleBuy = async (property: typeof marketProperties[0]) => {
    if (!wallet || wallet.money < property.price) {
      showFeedback("error", `余额不足！需要 ${property.price} ISC，当前余额 ${wallet?.money || 0} ISC`);
      return;
    }
    if (ownedPropertyIds.includes(property.id)) {
      showFeedback("error", "您已拥有此房产！");
      return;
    }
    try {
      await purchaseMutation.mutateAsync({ propertyId: property.id, price: property.price });
      showFeedback("success", `成功购买 ${property.name}！每月可获得 ${property.monthlyRent} ISC 租金收入`);
    } catch (error: any) {
      showFeedback("error", `购买失败: ${error.message}`);
    }
  };

  if (stateLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <span className="ml-2 text-amber-200">加载房产数据...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">🏠 房地产系统</h1>

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

      {/* 房产统计 */}
      <Card className="bg-amber-700 bg-opacity-30 border-amber-500 p-4 mb-6">
        <h3 className="font-bold text-white mb-4">📊 我的房产统计</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-900/30 p-3 rounded-lg text-center">
            <Home className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{playerStats?.propertiesOwned || ownedProperties.length}</p>
            <p className="text-amber-300 text-xs">已拥有房产</p>
          </div>
          <div className="bg-amber-900/30 p-3 rounded-lg text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-400">+{monthlyIncome}</p>
            <p className="text-amber-300 text-xs">月租金收入 (ISC)</p>
          </div>
          <div className="bg-amber-900/30 p-3 rounded-lg text-center">
            <DollarSign className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-400">{totalValue}</p>
            <p className="text-amber-300 text-xs">总资产价值 (ISC)</p>
          </div>
          <div className="bg-amber-900/30 p-3 rounded-lg text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{wallet?.money || 0}</p>
            <p className="text-amber-300 text-xs">可用余额 (ISC)</p>
          </div>
        </div>
      </Card>

      {/* 我的房产 */}
      {ownedProperties.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-white mb-3">🏘️ 我的房产</h3>
          <div className="space-y-3">
            {ownedProperties.map((property: any) => (
              <Card key={property.id} className="bg-green-900/30 border-green-500 p-4">
                <div className="flex items-start gap-3">
                  <Home className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{property.name || property.id}</h4>
                    <p className="text-green-200 text-sm">月租金: +{property.rentalIncome || 0} ISC</p>
                    <p className="text-amber-200 text-xs mt-1">状态: {property.condition || 100}% 完好</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm">已拥有</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 房产市场 */}
      <h3 className="font-bold text-white mb-3">🏪 房产市场</h3>
      <div className="space-y-3 mb-6">
        {marketProperties.map((property) => {
          const isOwned = ownedPropertyIds.includes(property.id);
          const canAfford = (wallet?.money || 0) >= property.price;
          return (
            <Card
              key={property.id}
              className={`bg-amber-700 bg-opacity-30 border-amber-500 p-4 cursor-pointer hover:bg-opacity-50 transition-all ${
                isOwned ? "opacity-60" : ""
              }`}
              onClick={() => setSelectedProperty(property.id === selectedProperty ? null : property.id)}
            >
              <div className="flex items-start gap-4">
                <Home className="w-8 h-8 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">{property.name}</h3>
                    <span className="text-amber-300 text-xs bg-amber-900/50 px-2 py-1 rounded">{property.type}</span>
                  </div>
                  <p className="text-amber-200 text-sm mt-1">📍 {property.location} · {property.area}m²</p>

                  {/* 房产信息 */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-amber-900 bg-opacity-30 p-2 rounded">
                      <p className="text-amber-300 text-xs">售价</p>
                      <p className="text-white font-bold">{property.price.toLocaleString()} ISC</p>
                    </div>
                    <div className="bg-amber-900 bg-opacity-30 p-2 rounded">
                      <p className="text-amber-300 text-xs">月租金收入</p>
                      <p className="text-green-400 font-bold">+{property.monthlyRent.toLocaleString()} ISC</p>
                    </div>
                  </div>

                  {/* 投资回报率 */}
                  <div className="mt-2 text-xs text-amber-300">
                    投资回报率: {((property.monthlyRent * 12 / property.price) * 100).toFixed(1)}%/年
                  </div>

                  {/* 购买按钮 */}
                  {selectedProperty === property.id && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuy(property);
                      }}
                      disabled={isOwned || !canAfford}
                      className={`w-full mt-3 ${
                        isOwned
                          ? "bg-gray-600 cursor-not-allowed"
                          : canAfford
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 cursor-not-allowed"
                      }`}
                    >
                      {isOwned ? "已拥有" : canAfford ? "确认购买" : "余额不足"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 投资建议 */}
      <Card className="bg-amber-700 bg-opacity-30 border-amber-500 p-4">
        <h3 className="font-bold text-white mb-3">💡 投资建议</h3>
        <p className="text-amber-200 text-sm">
          房地产是长期投资的最佳选择。购买房产后，每月可获得稳定的租金收入。
          建议优先购买投资回报率高的房产，逐步积累资产。
        </p>
      </Card>
    </div>
  );
};

export default GameProperty;
