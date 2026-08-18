import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Shirt, Sparkles, Building, Coins, Crown, Shield, TrendingUp } from "lucide-react";
import { EquipmentPanelContainer } from "@/components/equipment/EquipmentPanelContainer";

export default function PlayerHub() {
  const [selectedCategory, setSelectedCategory] = useState("clothes");
  const [equippedItems, setEquippedItems] = useState({
    hats: "冬季毛线帽",
    clothes: "高级羽绒服",
    pants: "休闲保暖裤",
    shoes: "时尚雪地靴",
    accessories: "黄金耳环",
    glasses: "太阳镜"
  });

  const inventory = {
    hats: ["冬季毛线帽", "时尚棒球帽", "商务礼帽"],
    clothes: ["高级羽绒服", "修身西装", "潮流卫衣", "JK制服裙"],
    pants: ["休闲保暖裤", "修身牛仔裤", "西装长裤"],
    shoes: ["时尚雪地靴", "商务皮鞋", "运动休闲鞋"],
    accessories: ["黄金耳环", "钻石戒指", "翡翠手镯"],
    glasses: ["太阳镜", "金丝眼镜", "无框眼镜"]
  };

  const playerStats = {
    name: "IceSnowBuilder",
    level: 45,
    title: "高级工业家",
    iscBalance: "450,230 ISC",
    usdtBalance: "12,500 USDT",
    propertiesCount: 8,
    businessesCount: 3,
    tradeBonus: "+30%"
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="text-blue-500" /> 360 度玩家中心与衣柜
          </h1>
          <p className="text-muted-foreground mt-1">
            管理您的角色形象、时尚装扮、资产与商业帝国
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1 text-sm py-1.5 px-3">
            <Crown className="w-4 h-4 text-yellow-500" /> {playerStats.title} (Lv.{playerStats.level})
          </Badge>
          <Badge variant="default" className="flex items-center gap-1 text-sm py-1.5 px-3">
            <Coins className="w-4 h-4" /> {playerStats.iscBalance}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：360度角色预览与统计 */}
        <Card className="lg:col-span-1 flex flex-col items-center p-6 text-center">
          <div className="w-48 h-96 bg-muted rounded-xl flex items-center justify-center relative mb-4 shadow-inner border border-border">
            {/* 模拟 3D 角色形象展示 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Sparkles className="w-12 h-12 text-blue-400 mb-2 animate-pulse" />
              <span className="font-bold text-lg">{playerStats.name}</span>
              <span className="text-xs text-muted-foreground mt-1">360° 交互式 3D 角色</span>
            </div>
          </div>
          <div className="w-full space-y-2 text-left mt-2">
            <div className="flex justify-between text-sm py-1 border-b">
              <span className="text-muted-foreground">房产数量:</span>
              <span className="font-semibold">{playerStats.propertiesCount} 套</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b">
              <span className="text-muted-foreground">企业数量:</span>
              <span className="font-semibold">{playerStats.businessesCount} 家</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">贸易加成:</span>
              <span className="font-semibold text-green-500">{playerStats.tradeBonus}</span>
            </div>
          </div>
        </Card>

        {/* 右侧：衣柜与资产管理 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="text-blue-500" /> 个人衣柜与道具管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="clothes" className="w-full" onValueChange={setSelectedCategory}>
              <TabsList className="grid grid-cols-6 mb-4">
                <TabsTrigger value="hats">帽子</TabsTrigger>
                <TabsTrigger value="clothes">衣服</TabsTrigger>
                <TabsTrigger value="pants">裤子</TabsTrigger>
                <TabsTrigger value="shoes">鞋子</TabsTrigger>
                <TabsTrigger value="accessories">首饰</TabsTrigger>
                <TabsTrigger value="glasses">眼镜</TabsTrigger>
              </TabsList>

              {Object.keys(inventory).map((category) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="text-sm font-semibold text-muted-foreground mb-2 capitalize">
                    当前分类: {category} (已穿戴: <span className="text-blue-500">{equippedItems[category as keyof typeof equippedItems]}</span>)
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {inventory[category as keyof typeof inventory].map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                          equippedItems[category as keyof typeof equippedItems] === item 
                            ? 'border-blue-500 bg-blue-500/10 shadow-sm' 
                            : 'border-border hover:border-blue-400 bg-card'
                        }`}
                        onClick={() => {
                          setEquippedItems(prev => ({ ...prev, [category]: item }));
                        }}
                      >
                        <span className="font-medium text-sm">{item}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {equippedItems[category as keyof typeof equippedItems] === item ? '已穿戴' : '点击穿戴'}
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-amber-500" /> 装备强化与属性管理
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-[520px]">
          <EquipmentPanelContainer />
        </CardContent>
      </Card>
    </div>
  );
}
