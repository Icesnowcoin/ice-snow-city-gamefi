'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Heart, MessageCircle, Gift, Star, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface NPCData {
  id: string;
  name: string;
  profession: string;
  location: string;
  personality: string;
  favorability: number;
  relationship: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'lover';
  avatar: string;
  bio: string;
  likes: string[];
  dislikes: string[];
  schedule: string;
}

export function NPCSystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNPC, setSelectedNPC] = useState<NPCData | null>(null);
  const [filterRelationship, setFilterRelationship] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch NPC list from backend
  const { data: npcList, isLoading: npcListLoading } = trpc.game.npc.getNpcsByScene.useQuery(
    { sceneId: 'main_square' },
    { retry: 1 }
  );

  // Fetch NPC detail
  const { data: npcDetail, refetch: refetchNPCDetail } = trpc.game.npc.getNpcDetail.useQuery(
    { npcId: selectedNPC?.id || '' },
    { enabled: !!selectedNPC?.id }
  );

  // NPC interaction mutation
  const interactNPC = trpc.game.npc.interact.useMutation({
    onSuccess: (data) => {
      setFeedback({
        type: 'success',
        message: `互动成功！好感度 +${data.favorabilityChange}`,
      });
      // Refetch NPC detail to get updated favorability
      refetchNPCDetail();
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: `互动失败: ${error.message}`,
      });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Generate NPC list from backend data
  const npcDataList: NPCData[] = useMemo(() => {
    if (!npcList) return [];

    const professions = [
      '银行家', '商人', '农民', '医生', '教师', '艺术家', '工程师', '律师',
      '咖啡师', '餐厅老板', '店员', '保安', '清洁工', '快递员', '出租车司机',
    ];

    const locations = [
      'ISC 银行', 'ISC 广场', '咖啡店', '农场', '书店', '超市', '商场',
      '公园', '居民楼', '工会大厅', '医院', '学校', '餐厅', '酒吧',
    ];

    const personalities = [
      '热情开朗', '内向安静', '聪慧理性', '感性浪漫', '幽默风趣', '认真严肃',
      '温柔体贴', '直爽坦率', '神秘高冷', '活泼好动',
    ];

    return npcList.map((npc, index) => ({
      id: npc.id,
      name: npc.name,
      profession: professions[index % professions.length],
      location: locations[index % locations.length],
      personality: personalities[index % personalities.length],
      favorability: npc.favorability,
      relationship: (['stranger', 'acquaintance', 'friend', 'close_friend', 'lover'] as const)[
        Math.min(4, Math.floor((npc.favorability / 100) * 5))
      ],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${npc.id}`,
      bio: `${npc.name}是一位${professions[index % professions.length]}。`,
      likes: ['鲜花', '巧克力', '咖啡'],
      dislikes: ['谎言', '冷漠', '傲慢'],
      schedule: `每天 09:00 在${locations[index % locations.length]}`,
    }));
  }, [npcList]);

  // Filter NPCs
  const filteredNPCs = useMemo(() => {
    return npcDataList.filter((npc) => {
      const matchesSearch =
        npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        npc.profession.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRelationship = filterRelationship === 'all' || npc.relationship === filterRelationship;
      const matchesLocation = filterLocation === 'all' || npc.location === filterLocation;

      return matchesSearch && matchesRelationship && matchesLocation;
    });
  }, [npcDataList, searchTerm, filterRelationship, filterLocation]);

  // Update selected NPC when detail data changes
  useEffect(() => {
    if (selectedNPC && npcDetail) {
      const relationshipMap: Record<number, 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'lover'> = {
        0: 'stranger',
        1: 'acquaintance',
        2: 'friend',
        3: 'close_friend',
        4: 'lover',
      };
      const relationship = relationshipMap[npcDetail.relationship as number] || 'stranger';
      setSelectedNPC((prev) =>
        prev
          ? {
              ...prev,
              favorability: npcDetail.favorability,
              relationship,
            }
          : null
      );
    }
  }, [npcDetail]);

  const relationshipColors = {
    stranger: 'text-slate-400',
    acquaintance: 'text-blue-400',
    friend: 'text-green-400',
    close_friend: 'text-purple-400',
    lover: 'text-red-400',
  };

  const relationshipLabels = {
    stranger: '陌生人',
    acquaintance: '熟人',
    friend: '朋友',
    close_friend: '亲密朋友',
    lover: '恋人',
  };

  const handleInteraction = async (type: 'greet' | 'gift' | 'date') => {
    if (!selectedNPC) return;

    setLoadingAction(type);
    try {
      await interactNPC.mutateAsync({
        npcId: selectedNPC.id,
        type,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">👥 NPC 系统</h1>
          <p className="text-slate-400">共有 {npcDataList.length} 个 NPC，当前显示 {filteredNPCs.length} 个</p>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-green-900 text-green-200'
                : 'bg-red-900 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NPC List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <div className="p-4 border-b border-slate-700">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="搜索 NPC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">关系筛选</label>
                    <select
                      value={filterRelationship}
                      onChange={(e) => setFilterRelationship(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                    >
                      <option value="all">全部</option>
                      <option value="stranger">陌生人</option>
                      <option value="acquaintance">熟人</option>
                      <option value="friend">朋友</option>
                      <option value="close_friend">亲密朋友</option>
                      <option value="lover">恋人</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">位置筛选</label>
                    <select
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                    >
                      <option value="all">全部</option>
                      <option value="ISC 银行">ISC 银行</option>
                      <option value="ISC 广场">ISC 广场</option>
                      <option value="咖啡店">咖啡店</option>
                      <option value="农场">农场</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* NPC List Items */}
              <div className="overflow-y-auto max-h-96">
                {npcListLoading ? (
                  <div className="p-4 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    加载中...
                  </div>
                ) : filteredNPCs.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">没有找到 NPC</div>
                ) : (
                  filteredNPCs.map((npc) => (
                    <div
                      key={npc.id}
                      onClick={() => setSelectedNPC(npc)}
                      className={`p-3 border-b border-slate-700 cursor-pointer transition-colors ${
                        selectedNPC?.id === npc.id
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={npc.avatar}
                          alt={npc.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{npc.name}</p>
                          <p className="text-xs text-slate-400 truncate">{npc.profession}</p>
                        </div>
                        <Star className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* NPC Details */}
          {selectedNPC && (
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700">
                <div className="p-6">
                  {/* NPC Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <img
                      src={selectedNPC.avatar}
                      alt={selectedNPC.name}
                      className="w-24 h-24 rounded-full border-2 border-blue-400"
                    />
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedNPC.name}</h2>
                      <p className="text-slate-400 mb-2">{selectedNPC.profession}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all"
                            style={{ width: `${selectedNPC.favorability}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-400">{selectedNPC.favorability}%</span>
                      </div>
                      <p className={`text-sm ${relationshipColors[selectedNPC.relationship]}`}>
                        {relationshipLabels[selectedNPC.relationship]}
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                      <TabsTrigger value="info">信息</TabsTrigger>
                      <TabsTrigger value="preferences">偏好</TabsTrigger>
                      <TabsTrigger value="actions">互动</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">个人简介</p>
                        <p className="text-white">{selectedNPC.bio}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">位置</p>
                        <p className="text-white">{selectedNPC.location}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">性格</p>
                        <p className="text-white">{selectedNPC.personality}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">日程</p>
                        <p className="text-white">{selectedNPC.schedule}</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-2">喜欢的东西</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedNPC.likes.map((like, index) => (
                            <span key={index} className="bg-green-900 text-green-200 px-3 py-1 rounded-full text-sm">
                              ❤️ {like}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-2">不喜欢的东西</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedNPC.dislikes.map((dislike, index) => (
                            <span key={index} className="bg-red-900 text-red-200 px-3 py-1 rounded-full text-sm">
                              💔 {dislike}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="actions" className="space-y-3">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
                        disabled={loadingAction === 'greet'}
                        onClick={() => handleInteraction('greet')}
                      >
                        {loadingAction === 'greet' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageCircle className="w-4 h-4 mr-2" />
                        )}
                        对话
                      </Button>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10"
                        disabled={loadingAction === 'gift'}
                        onClick={() => handleInteraction('gift')}
                      >
                        {loadingAction === 'gift' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Gift className="w-4 h-4 mr-2" />
                        )}
                        送礼
                      </Button>
                      <Button
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white h-10"
                        disabled={loadingAction === 'date'}
                        onClick={() => handleInteraction('date')}
                      >
                        {loadingAction === 'date' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4 mr-2" />
                        )}
                        约会
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



export default NPCSystem;
