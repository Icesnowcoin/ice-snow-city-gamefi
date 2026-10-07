import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameSceneUI } from '@/components/game/GameSceneUI';
import { trpc } from '@/lib/trpc';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GameScenesPage() {
  const [selectedScene, setSelectedScene] = useState<string>('scenes');

  // Fetch scenes list
  const { data: scenesList, isLoading: scenesLoading } = (trpc.gameScenes?.getScenesList as any)?.useQuery?.() || { data: undefined, isLoading: true };

  // Handle scene start
  const startSceneMutation = trpc.gameScenes.startScene.useMutation({
    onSuccess: (data: any) => {
      console.log('Scene started:', data);
    },
    onError: (error: any) => {
      console.error('Failed to start scene:', error);
    },
  });

  // Handle scene complete
  const completeSceneMutation = trpc.gameScenes.completeScene.useMutation({
    onSuccess: (data: any) => {
      console.log('Scene completed with rewards:', data);
    },
    onError: (error: any) => {
      console.error('Failed to complete scene:', error);
    },
  });

  const handleSceneStart = (sceneType: string, difficulty: string) => {
    if (startSceneMutation.mutate) {
      startSceneMutation.mutate({
        sceneType: sceneType as 'fishing' | 'mining' | 'lumberjacking',
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
      });
    }
  };

  const handleSceneComplete = (rewards: any) => {
    // Scene completion is handled by the component
    console.log('Scene completed with rewards:', rewards);
  };

  if (scenesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🎮 游戏场景</CardTitle>
          <p className="text-sm text-gray-400 mt-2">
            参与各种迷你游戏，赚取资源和 ISC 代币
          </p>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedScene} onValueChange={setSelectedScene}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scenes">游戏场景</TabsTrigger>
          <TabsTrigger value="info">场景信息</TabsTrigger>
        </TabsList>

        {/* Game Scenes Tab */}
        <TabsContent value="scenes" className="space-y-6">
          <GameSceneUI
            onSceneStart={handleSceneStart}
            onSceneComplete={handleSceneComplete}
            playerEnergy={100}
            maxEnergy={100}
            isLoading={startSceneMutation.isPending || completeSceneMutation.isPending}
          />

          {/* Error handling */}
          {startSceneMutation.isError && (
            <Alert className="border-red-500/30 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {startSceneMutation.error?.message || '启动场景失败'}
              </AlertDescription>
            </Alert>
          )}

          {completeSceneMutation.isError && (
            <Alert className="border-red-500/30 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {completeSceneMutation.error?.message || '完成场景失败'}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          {scenesList?.scenes && (scenesList.scenes as any[]).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(scenesList.scenes as any[]).map((scene: any) => (
                <Card key={scene.type}>
                  <CardHeader>
                    <CardTitle className="text-lg">{scene.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-400">{scene.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>能量消耗:</span>
                        <span className="font-semibold">{scene.energyCost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>耗时:</span>
                        <span className="font-semibold">{scene.duration}秒</span>
                      </div>
                      <div className="flex justify-between">
                        <span>奖励:</span>
                        <span className="font-semibold text-yellow-400">{scene.rewards}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>暂无场景信息</AlertDescription>
            </Alert>
          )}

          {/* Game Tips */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-base">💡 游戏提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• 每个场景消耗不同的能量，选择适合您的难度</p>
              <p>• 更高的难度会获得更多的奖励</p>
              <p>• 每天有限制的尝试次数，合理安排时间</p>
              <p>• 完成场景可以获得 ISC 代币和其他资源</p>
              <p>• 升级建筑可以增加能量上限</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
