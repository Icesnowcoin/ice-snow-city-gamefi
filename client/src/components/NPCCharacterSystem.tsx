import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * NPC 角色数据接口
 */
export interface NPCCharacter {
  id: string;
  name: string;
  title: string;
  role: 'mentor' | 'merchant' | 'architect' | 'investor' | 'other';
  background: string;
  personality: string[];
  description: string;
  imageUrl: string;
  region: string; // 全球化背景
  skills: string[];
  questsAvailable: number;
  relationshipLevel: number; // 0-100
  isUnlocked: boolean;
}

/**
 * NPC 角色系统组件
 */
export const NPCCharacterSystem: React.FC = () => {
  const [selectedNPC, setSelectedNPC] = useState<NPCCharacter | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  // 初始化 NPC 数据
  const npcCharacters: NPCCharacter[] = useMemo(
    () => [
      {
        id: 'aurora',
        name: 'Aurora',
        title: 'The Seer of Ice',
        role: 'mentor',
        background: 'Ancient ice seer from the frozen north',
        personality: ['Mysterious', 'Kind', 'Knowledgeable'],
        description:
          'Aurora is the ancient ice seer who guides newcomers through the frozen empire. With centuries of wisdom, she helps players understand the secrets of Ice Snow City and the path to prosperity.',
        imageUrl:
          'https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/npc_character_aurora-dyUh6PgEfVgrw5NAxKdKTp.webp',
        region: 'Nordic',
        skills: ['Magic', 'Guidance', 'Prophecy'],
        questsAvailable: 5,
        relationshipLevel: 100,
        isUnlocked: true,
      },
      {
        id: 'marcus',
        name: 'Marcus',
        title: 'The Merchant Prince',
        role: 'merchant',
        background: 'European-inspired merchant from a trading dynasty',
        personality: ['Ambitious', 'Charismatic', 'Business-savvy'],
        description:
          'Marcus is a shrewd merchant who has built his fortune through clever trading and business ventures. He offers valuable trading opportunities and investment advice to those with ambition.',
        imageUrl:
          'https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/npc_character_marcus-XtmqtWzRHXePnEa89j94mN.webp',
        region: 'European',
        skills: ['Trading', 'Negotiation', 'Investment'],
        questsAvailable: 8,
        relationshipLevel: 75,
        isUnlocked: true,
      },
      {
        id: 'yuki',
        name: 'Yuki',
        title: 'The Ice Architect',
        role: 'architect',
        background: 'Japanese-inspired master craftsperson',
        personality: ['Perfectionist', 'Wise', 'Creative', 'Humble'],
        description:
          'Yuki is a legendary architect who has designed the most beautiful structures in Ice Snow City. She mentors builders and helps players create magnificent properties with perfect aesthetics.',
        imageUrl:
          'https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/npc_character_yuki-PybC3ciiiC3efQJZsEmcVc.webp',
        region: 'Asian',
        skills: ['Architecture', 'Design', 'Construction'],
        questsAvailable: 6,
        relationshipLevel: 60,
        isUnlocked: true,
      },
      {
        id: 'leo',
        name: 'Leo',
        title: 'The Golden Entrepreneur',
        role: 'investor',
        background: 'Brazilian-inspired charismatic entrepreneur',
        personality: ['Energetic', 'Optimistic', 'Risk-taker', 'Generous'],
        description:
          'Leo is a charismatic entrepreneur who sees opportunities everywhere. He invests in promising ventures and helps players scale their businesses to unprecedented heights.',
        imageUrl:
          'https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/npc_character_leo-WsKe8sjzHFHcqEgwTMu6qZ.webp',
        region: 'South American',
        skills: ['Investment', 'Business', 'Scaling'],
        questsAvailable: 7,
        relationshipLevel: 50,
        isUnlocked: true,
      },
    ],
    []
  );

  // 筛选 NPC
  const filteredNPCs = useMemo(() => {
    return npcCharacters.filter((npc) => {
      const roleMatch = filterRole === 'all' || npc.role === filterRole;
      const regionMatch = filterRegion === 'all' || npc.region === filterRegion;
      return roleMatch && regionMatch;
    });
  }, [npcCharacters, filterRole, filterRegion]);

  // 获取所有区域
  const regions = useMemo(() => {
    const regionSet = new Set(npcCharacters.map((npc) => npc.region));
    const regionArray: string[] = [];
    regionSet.forEach((region) => regionArray.push(region));
    return regionArray;
  }, [npcCharacters]);

  // 获取所有角色类型
  const roles = useMemo(() => {
    const roleSet = new Set(npcCharacters.map((npc) => npc.role));
    const roleArray: string[] = [];
    roleSet.forEach((role) => roleArray.push(role));
    return roleArray;
  }, [npcCharacters]);

  return (
    <div className="w-full space-y-6">
      {/* 标题 */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">NPC Characters</h2>
        <p className="text-muted-foreground">
          Meet the diverse characters of Ice Snow City. Each NPC offers unique quests, advice, and
          opportunities.
        </p>
      </div>

      {/* 筛选选项 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Filter by Role</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Roles</option>
            {roles.map((role: string) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Filter by Region</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Regions</option>
            {regions.map((region: string) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NPC 列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredNPCs.map((npc) => (
          <Card
            key={npc.id}
            className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
            onClick={() => setSelectedNPC(npc)}
          >
            <div className="relative h-64 bg-gradient-to-b from-blue-400 to-blue-600">
              <img
                src={npc.imageUrl}
                alt={npc.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-lg text-foreground">{npc.name}</h3>
                <p className="text-sm text-muted-foreground">{npc.title}</p>
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {npc.role}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {npc.region}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Relationship</span>
                  <span className="font-semibold text-foreground">{npc.relationshipLevel}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${npc.relationshipLevel}%` }}
                  />
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNPC(npc);
                }}
              >
                View Profile
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* NPC 详细信息 */}
      {selectedNPC && (
        <Card className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              <img
                src={selectedNPC.imageUrl}
                alt={selectedNPC.name}
                className="w-48 h-64 rounded-lg object-cover"
              />

              <div className="space-y-4 flex-1">
                <div>
                  <h2 className="text-3xl font-bold text-foreground">{selectedNPC.name}</h2>
                  <p className="text-xl text-muted-foreground">{selectedNPC.title}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Background</p>
                  <p className="text-sm text-muted-foreground">{selectedNPC.background}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Personality Traits</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNPC.personality.map((trait) => (
                      <Badge key={trait} variant="secondary">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNPC.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNPC(null)}
            >
              ✕
            </Button>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-foreground">{selectedNPC.description}</p>
          </div>

          <Tabs defaultValue="quests" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quests">Quests</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
            </TabsList>

            <TabsContent value="quests" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedNPC.questsAvailable} quests available from {selectedNPC.name}
              </p>
              <div className="space-y-2">
                {Array.from({ length: selectedNPC.questsAvailable }).map((_, i) => (
                  <Card key={i} className="p-3">
                    <p className="font-medium text-sm text-foreground">Quest {i + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      Complete tasks to earn rewards and increase relationship
                    </p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Rewards from completing {selectedNPC.name}'s quests
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">💰</p>
                  <p className="text-sm font-medium text-foreground">Gold</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">⭐</p>
                  <p className="text-sm font-medium text-foreground">Experience</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">🎁</p>
                  <p className="text-sm font-medium text-foreground">Items</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">💎</p>
                  <p className="text-sm font-medium text-foreground">Bonuses</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              <div className="space-y-2">
                <Button className="w-full">💬 Talk to {selectedNPC.name}</Button>
                <Button variant="outline" className="w-full">
                  🎁 Give Gift
                </Button>
                <Button variant="outline" className="w-full">
                  📋 View Quests
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* 统计信息 */}
      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-primary">{npcCharacters.length}</p>
            <p className="text-sm text-muted-foreground">Total NPCs</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{regions.length}</p>
            <p className="text-sm text-muted-foreground">Global Regions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {npcCharacters.reduce((sum, npc) => sum + npc.questsAvailable, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Quests</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {Math.round(
                npcCharacters.reduce((sum, npc) => sum + npc.relationshipLevel, 0) /
                  npcCharacters.length
              )}
              %
            </p>
            <p className="text-sm text-muted-foreground">Avg Relationship</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NPCCharacterSystem;
