import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MessageCircle, Gift, Coins } from "lucide-react";

interface GameSceneProps {
  sceneName: string;
}

/**
 * 游戏场景组件 - 移动优先设计
 * 显示场景信息、NPC 列表、交互选项
 */
export const GameScene: React.FC<GameSceneProps> = ({ sceneName }) => {
  const [selectedNpc, setSelectedNpc] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // 获取场景信息
  const { data: scene, isLoading: sceneLoading } = trpc.game.scene.getSceneList.useQuery(
    { sceneName },
    { staleTime: 30000 }
  );

  // 获取场景 NPC
  const { data: npcs, isLoading: npcsLoading } = trpc.game.npc.getNpcsByScene.useQuery(
    { sceneId: sceneName },
    { staleTime: 30000 }
  );

  // NPC 交互 mutation
  const interactMutation = trpc.game.npc.interactWithNPC.useMutation({
    onSuccess: (data) => {
      console.log("NPC 对话:", data.dialogue);
      setIsInteracting(false);
    },
    onError: (error) => {
      console.error("交互错误:", error.message);
    },
  });

  const handleInteract = async (npcId: string, action: "greet" | "talk" | "gift") => {
    setIsInteracting(true);
    try {
      await interactMutation.mutateAsync({
        npcId,
        action,
      });
    } finally {
      setIsInteracting(false);
    }
  };

  if (sceneLoading || npcsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>场景未找到</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 p-4 pb-20">
      {/* 场景标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{scene.displayName}</h1>
        <p className="text-blue-100 text-sm">{scene.description}</p>
      </div>

      {/* 场景特性 */}
      {scene.features && scene.features.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-2">
          {scene.features.map((feature: string) => (
            <div
              key={feature}
              className="bg-blue-700 bg-opacity-50 rounded-lg p-3 text-white text-sm text-center"
            >
              {feature}
            </div>
          ))}
        </div>
      )}

      {/* NPC 列表 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">场景中的 NPC</h2>
        <div className="space-y-3">
          {npcs && npcs.length > 0 ? (
            npcs.map((npc) => (
              <Card
                key={npc.id}
                className="bg-blue-700 bg-opacity-30 border-blue-500 p-4 cursor-pointer hover:bg-opacity-50 transition-all"
                onClick={() => setSelectedNpc(npc.id)}
              >
                <div className="flex items-start gap-4">
                  {/* NPC 头像 */}
                  <div className="flex-shrink-0">
                    <img
                      src={npc.avatar}
                      alt={npc.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>

                  {/* NPC 信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg">{npc.name}</h3>
                    <p className="text-blue-200 text-sm">{npc.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-blue-900 rounded-full h-2">
                        <div
                          className="bg-green-400 h-2 rounded-full transition-all"
                          style={{ width: `${npc.affinity}%` }}
                        />
                      </div>
                      <span className="text-blue-200 text-xs whitespace-nowrap">
                        好感度 {npc.affinity}%
                      </span>
                    </div>
                  </div>

                  {/* 状态标签 */}
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {npc.status === "stranger" && "陌生人"}
                      {npc.status === "acquaintance" && "熟人"}
                      {npc.status === "friend" && "朋友"}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-blue-200 text-center py-8">这个场景没有 NPC</p>
          )}
        </div>
      </div>

      {/* NPC 交互对话框 */}
      <Dialog open={!!selectedNpc} onOpenChange={(open) => !open && setSelectedNpc(null)}>
        <DialogContent className="bg-blue-800 border-blue-600">
          <DialogHeader>
            <DialogTitle className="text-white">
              {npcs?.find((n) => n.id === selectedNpc)?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 交互选项 */}
            <div className="space-y-2">
              <Button
                onClick={() => handleInteract(selectedNpc!, "greet")}
                disabled={isInteracting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                问候
              </Button>

              <Button
                onClick={() => handleInteract(selectedNpc!, "talk")}
                disabled={isInteracting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                聊天
              </Button>

              <Button
                onClick={() => handleInteract(selectedNpc!, "gift")}
                disabled={isInteracting}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Gift className="w-4 h-4 mr-2" />
                送礼
              </Button>
            </div>

            {/* 加载状态 */}
            {isInteracting && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-white">正在交互...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameScene;
