'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Heart, MessageCircle, Gift, Star, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface NPC {
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

// 生成 200+ NPC 数据
const generateNPCs = (): NPC[] => {
  const professions = [
    '银行家', '商人', '农民', '医生', '教师', '艺术家', '工程师', '律师',
    '咖啡师', '餐厅老板', '店员', '保安', '清洁工', '快递员', '出租车司机',
    '警察', '消防员', '建筑工', '电工', '水管工', '美发师', '美容师',
    '健身教练', '瑜伽师', '营养师', '心理咨询师', '摄影师', '音乐家',
    '作家', '编辑', '记者', '设计师', '程序员', '数据分析师', '产品经理',
  ];

  const locations = [
    'ISC 银行', 'ISC 广场', '咖啡店', '农场', '书店', '超市', '商场', '4S 店',
    '公园', '居民楼', '工会大厅', '医院', '学校', '餐厅', '酒吧', '健身房',
  ];

  const personalities = [
    '热情开朗', '内向安静', '聪慧理性', '感性浪漫', '幽默风趣', '认真严肃',
    '温柔体贴', '直爽坦率', '神秘高冷', '活泼好动', '深思熟虑', '天真烂漫',
  ];

  const likes = [
    '鲜花', '巧克力', '咖啡', '红酒', '书籍', '音乐', '运动', '旅游',
    '美食', '艺术', '电影', '游戏', '购物', '聚会', '冒险', '学习',
  ];

  const npcs: NPC[] = [];
  const names = [
    '李明', '王芳', '张三', '刘四', '陈五', '杨六', '黄七', '周八',
    '吴九', '郑十', '何十一', '罗十二', '高十三', '林十四', '郭十五',
    '贺十六', '韦十七', '唐十八', '许十九', '邓二十', '曾二十一', '彭二十二',
    '蔡二十三', '潘二十四', '朱二十五', '魏二十六', '薛二十七', '叶二十八',
    '阎二十九', '余三十', '苏三十一', '卢三十二', '仲三十三', '孙三十四',
    '陶三十五', '姜三十六', '戚三十七', '祝三十八', '董三十九', '梁四十',
  ];

  for (let i = 0; i < 200; i++) {
    const nameIndex = i % names.length;
    const professionIndex = i % professions.length;
    const locationIndex = i % locations.length;
    const personalityIndex = i % personalities.length;

    npcs.push({
      id: `npc_${i}`,
      name: `${names[nameIndex]}${i > names.length ? Math.floor(i / names.length) : ''}`,
      profession: professions[professionIndex],
      location: locations[locationIndex],
      personality: personalities[personalityIndex],
      favorability: Math.floor(Math.random() * 100),
      relationship: ['stranger', 'acquaintance', 'friend', 'close_friend', 'lover'][
        Math.floor(Math.random() * 5)
      ] as any,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      bio: `${names[nameIndex]}是一位${professions[professionIndex]}，性格${personalities[personalityIndex]}。`,
      likes: [likes[Math.floor(Math.random() * likes.length)], likes[Math.floor(Math.random() * likes.length)]],
      dislikes: [likes[Math.floor(Math.random() * likes.length)], likes[Math.floor(Math.random() * likes.length)]],
      schedule: `每天 ${Math.floor(Math.random() * 24)}:00 在${locations[locationIndex]}`,
    });
  }

  return npcs;
};

const allNPCs = generateNPCs();

export function NPCSystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(allNPCs[0]);
  const [filterRelationship, setFilterRelationship] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // tRPC mutations for NPC interactions
  const interactNPC = trpc.game.npc.interact.useMutation();

  const filteredNPCs = useMemo(() => {
    return allNPCs.filter((npc) => {
      const matchesSearch =
        npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        npc.profession.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRelationship = filterRelationship === 'all' || npc.relationship === filterRelationship;
      const matchesLocation = filterLocation === 'all' || npc.location === filterLocation;

      return matchesSearch && matchesRelationship && matchesLocation;
    });
  }, [searchTerm, filterRelationship, filterLocation]);

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

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">👥 NPC 系统</h1>
          <p className="text-slate-400">共有 {allNPCs.length} 个 NPC，当前显示 {filteredNPCs.length} 个</p>
        </div>

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
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
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
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                    >
                      <option value="all">全部</option>
                      <option value="ISC 银行">ISC 银行</option>
                      <option value="ISC 广场">ISC 广场</option>
                      <option value="咖啡店">咖啡店</option>
                      <option value="农场">农场</option>
                      <option value="书店">书店</option>
                      <option value="超市">超市</option>
                      <option value="商场">商场</option>
                      <option value="4S 店">4S 店</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-96">
                {filteredNPCs.map((npc) => (
                  <div
                    key={npc.id}
                    onClick={() => setSelectedNPC(npc)}
                    className={`p-3 border-b border-slate-700 cursor-pointer transition-colors ${
                      selectedNPC?.id === npc.id ? 'bg-blue-900 bg-opacity-50' : 'hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={npc.avatar} alt={npc.name} className="w-10 h-10 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{npc.name}</p>
                        <p className="text-xs text-slate-400 truncate">{npc.profession}</p>
                        <p className={`text-xs ${relationshipColors[npc.relationship]}`}>
                          {relationshipLabels[npc.relationship]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full"
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
                        disabled={loadingAction === 'interact'}
                        onClick={async () => {
                          if (!selectedNPC) return;
                          setLoadingAction('interact');
                          try {
                            await interactNPC.mutateAsync({
                              npcId: selectedNPC.id,
                              type: 'greet',
                            });
                            console.log(`对话成功: 与 ${selectedNPC.name} 的对话很愉快！好感度 +5`);
                          } catch (error) {
                            console.error('对话失败: 请稍后重试');
                          } finally {
                            setLoadingAction(null);
                          }
                        }}
                      >
                        {loadingAction === 'interact' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageCircle className="w-4 h-4 mr-2" />
                        )}
                        对话
                      </Button>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10"
                        disabled={loadingAction === 'gift'}
                        onClick={async () => {
                          if (!selectedNPC) return;
                          setLoadingAction('gift');
                          try {
                            await interactNPC.mutateAsync({
                              npcId: selectedNPC.id,
                              type: 'gift',
                            });
                            console.log(`送礼成功: ${selectedNPC.name} 很高兴！好感度 +10`);
                          } catch (error) {
                            console.error('送礼失败: 请稍后重试');
                          } finally {
                            setLoadingAction(null);
                          }
                        }}
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
                        onClick={async () => {
                          if (!selectedNPC) return;
                          setLoadingAction('date');
                          try {
                            await interactNPC.mutateAsync({
                              npcId: selectedNPC.id,
                              type: 'date',
                            });
                            console.log(`约会成功: 与 ${selectedNPC.name} 的约会很美妙！好感度 +20`);
                          } catch (error) {
                            console.error('约会失败: 请稍后重试');
                          } finally {
                            setLoadingAction(null);
                          }
                        }}
                      >
                        {loadingAction === 'date' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4 mr-2" />
                        )}
                        约会
                      </Button>
                      <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-10">
                        <Star className="w-4 h-4 mr-2" />
                        查看任务
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
