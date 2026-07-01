import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Heart, MessageCircle, Gift, Users } from "lucide-react";

export const GameSocial: React.FC = () => {
  const [selectedNpc, setSelectedNpc] = useState<string | null>(null);

  // 获取 NPC 列表
  const { data: npcs, isLoading: npcsLoading, refetch: refetchNpcs } = 
    trpc.game.npc.getNpcsByScene.useQuery({ sceneId: "social" }, { staleTime: 30000 });

  // 互动 mutation
  const interactMutation = trpc.game.core.interactWithNPC.useMutation({
    onSuccess: () => {
      refetchNpcs();
      console.log("互动成功");
    },
    onError: (error: any) => {
      console.error("互动失败:", error.message);
    },
  });

  const handleInteract = async (npcId: string, action: "trade" | "greet" | "talk" | "gift" | "romance") => {
    await interactMutation.mutateAsync({
      npcId,
      action,
    });
  };

  if (npcsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // 模拟 NPC 数据
  const npcList = [
    { id: "npc1", name: "小美", profession: "咖啡师", affinity: 75, status: "single", gift: "咖啡" },
    { id: "npc2", name: "小王", profession: "医生", affinity: 60, status: "single", gift: "药" },
    { id: "npc3", name: "小李", profession: "老师", affinity: 80, status: "married", gift: "书" },
    { id: "npc4", name: "小张", profession: "商人", affinity: 45, status: "single", gift: "金币" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900 to-pink-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">社交系统</h1>

      {/* NPC 列表 */}
      <div className="space-y-3 mb-6">
        {npcList.map((npc) => (
          <Card
            key={npc.id}
            className="bg-pink-700 bg-opacity-30 border-pink-500 p-4 cursor-pointer hover:bg-opacity-50 transition-all"
            onClick={() => setSelectedNpc(npc.id)}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-lg">{npc.name}</h3>
                  {npc.status === "married" && (
                    <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                  )}
                </div>
                <p className="text-pink-200 text-sm mt-1">{npc.profession}</p>
                
                {/* 亲密度 */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-pink-300 text-xs">亲密度</span>
                    <span className="text-white font-bold text-xs">{npc.affinity}%</span>
                  </div>
                  <div className="flex-1 bg-pink-900 rounded-full h-2">
                    <div
                      className="bg-red-400 h-2 rounded-full transition-all"
                      style={{ width: `${npc.affinity}%` }}
                    />
                  </div>
                </div>

                {/* 互动按钮 */}
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInteract(npc.id, "talk");
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs py-1"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    聊天
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInteract(npc.id, "greet");
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs py-1"
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    送礼 ({npc.gift})
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 社交统计 */}
      <Card className="bg-pink-700 bg-opacity-30 border-pink-500 p-4 mb-6">
        <h3 className="font-bold text-white mb-4">社交数据</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              <span className="text-pink-200">已认识 NPC</span>
            </div>
            <span className="text-white font-bold">{npcList.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-pink-200">已结婚</span>
            </div>
            <span className="text-white font-bold">{npcList.filter(n => n.status === "married").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="text-pink-200">平均亲密度</span>
            </div>
            <span className="text-white font-bold">{Math.round(npcList.reduce((a, b) => a + b.affinity, 0) / npcList.length)}%</span>
          </div>
        </div>
      </Card>

      {/* 约会建议 */}
      <Card className="bg-pink-700 bg-opacity-30 border-pink-500 p-4">
        <h3 className="font-bold text-white mb-3">约会建议</h3>
        <p className="text-pink-200 text-sm">
          通过聊天和送礼来增加亲密度。当亲密度达到 100% 时，可以向喜欢的 NPC 求婚。结婚后可以获得额外的游戏奖励。
        </p>
      </Card>
    </div>
  );
};

export default GameSocial;
