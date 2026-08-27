import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, MapPin, Users, Briefcase, Home, Leaf } from 'lucide-react';

interface Scene {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  npcCount: number;
  features: string[];
  activities: string[];
}

const scenes: Scene[] = [
  {
    id: 'isc-bank',
    name: 'ISC 银行',
    description: '现代化的金融中心，提供存款、投资、贷款等服务',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/isc_bank_scene-duEfhZZZLTxSticgV7fsex.webp',
    icon: <Briefcase className="w-6 h-6" />,
    npcCount: 8,
    features: ['存款', '取款', '投资', '贷款', '购买ISC代币'],
    activities: ['咨询理财', '办理业务', '查看账户'],
  },
  {
    id: 'isc-plaza',
    name: 'ISC 广场',
    description: '充满生活气息的商业中心，汇聚各类商业业态',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/isc_plaza_scene-jh6wDsAhNgjJQ9GPeSeWW2.webp',
    icon: <MapPin className="w-6 h-6" />,
    npcCount: 30,
    features: ['购物', '用餐', '社交', '参加活动'],
    activities: ['逛街', '聊天', '观看表演', '参加活动'],
  },
  {
    id: 'coffee-shop',
    name: '咖啡店',
    description: '温暖舒适的社交中心，是放松休闲的理想场所',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/coffee_shop_scene-HYvCLWVTBRcvKFm4kDpw7C.webp',
    icon: <Users className="w-6 h-6" />,
    npcCount: 8,
    features: ['点餐', '社交', '约会', '阅读'],
    activities: ['喝咖啡', '聊天', '约会', '工作'],
  },
  {
    id: 'farm',
    name: '农场',
    description: '宁静自然的农业基地，体验农业生产系统',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/farm_scene-4AZWSvk46Z8oRZ5vYn6ByW.webp',
    icon: <Leaf className="w-6 h-6" />,
    npcCount: 5,
    features: ['种植', '收获', '饲养', '销售'],
    activities: ['种植作物', '收获产品', '饲养动物', '销售农产品'],
  },
];

export function GameSceneSystem() {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(scenes[0]);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🏙️ 冰雪城市</h1>
          <p className="text-slate-400">探索城市的各个角落，体验丰富的游戏内容</p>
        </div>

        {/* Scene Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {scenes.map((scene) => (
            <Card
              key={scene.id}
              className={`cursor-pointer transition-all transform hover:scale-105 ${
                selectedScene?.id === scene.id
                  ? 'ring-2 ring-blue-500 bg-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              onClick={() => setSelectedScene(scene)}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-blue-400">{scene.icon}</div>
                  <h3 className="text-white font-semibold">{scene.name}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-3">{scene.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>{scene.npcCount} 个 NPC</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Scene Details */}
        {selectedScene && (
          <div className="space-y-6">
            {/* Scene Image */}
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="relative w-full h-96 bg-slate-900">
                <img
                  src={selectedScene.image}
                  alt={selectedScene.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              </div>
            </Card>

            {/* Scene Information */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                <TabsTrigger value="overview" className="text-slate-400">
                  场景概览
                </TabsTrigger>
                <TabsTrigger value="features" className="text-slate-400">
                  功能特性
                </TabsTrigger>
                <TabsTrigger value="activities" className="text-slate-400">
                  可进行的活动
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">{selectedScene.name}</h3>
                  <p className="text-slate-300 mb-4">{selectedScene.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-1">NPC 数量</p>
                      <p className="text-2xl font-bold text-blue-400">{selectedScene.npcCount}</p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-1">场景类型</p>
                      <p className="text-lg font-bold text-green-400">
                        {selectedScene.id === 'isc-bank'
                          ? '金融'
                          : selectedScene.id === 'isc-plaza'
                          ? '商业'
                          : selectedScene.id === 'coffee-shop'
                          ? '社交'
                          : '农业'}
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">功能特性</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedScene.features.map((feature, index) => (
                      <div
                        key={index}
                        className="bg-slate-700 rounded-lg p-3 flex items-center gap-2"
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">可进行的活动</h3>
                  <div className="space-y-2">
                    {selectedScene.activities.map((activity, index) => (
                      <div
                        key={index}
                        className="bg-slate-700 rounded-lg p-3 flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-slate-300">{activity}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
                onClick={() => {
                  console.log(`进入场景: ${selectedScene.name}`);
                }}
              >
                进入场景
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 h-12 text-lg"
                onClick={() => {
                  console.log(`查看${selectedScene.name}的NPC列表`);
                }}
              >
                查看 NPC
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
