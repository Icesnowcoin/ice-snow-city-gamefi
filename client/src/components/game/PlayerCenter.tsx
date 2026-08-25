/**
 * Player Center Component
 * Complete player profile, wardrobe, and asset management interface
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Character3DViewer } from './Character3DViewer';
import type { PlayerCharacter } from './Character3DViewer';
import { WardrobePanel } from './WardrobePanel';
import { ShoeCabinetPanel } from './ShoeCabinetPanel';
import { JewelryPanel } from './JewelryPanel';
import { AssetsPanel } from './AssetsPanel';
import AchievementsPage from '@/pages/AchievementsPage';
import { MarriagePanel, type MarriageProfile } from '@/components/social/MarriagePanel';
import { ProfessionSelector } from './ProfessionSelector';
import { SkillTree, type SkillKey } from './SkillTree';
import { ProfessionType } from '@shared/types/profession';
import { OutfitShareCard } from './OutfitShareCard';
import { 
  Shirt, 
  Gem, 
  Wallet, 
  Share2, 
  RotateCcw,
  Save,
  Trophy
} from 'lucide-react';

interface PlayerCenterProps {
  playerId: number;
  playerName: string;
  level: number;
  profession: string;
  initialCharacter?: PlayerCharacter | null;
  initialEquippedItems?: EquippedItems;
  initialAssets?: PlayerAssets;
  marriageProfile?: MarriageProfile;
  onMarriagePropose?: (targetName: string) => void | Promise<void>;
  onMarriageRespond?: (accepted: boolean) => void | Promise<void>;
  onMarriageInteract?: (action: 'message' | 'visit') => void;
  onMarriageDivorce?: () => void | Promise<void>;
  onProfessionSelect?: (profession: ProfessionType) => void | Promise<void>;
  activeSkills?: Partial<Record<SkillKey, boolean>>;
  onSkillActivate?: (skill: SkillKey) => void | Promise<void>;
}

interface EquippedItems {
  [key: string]: any;
}

interface PlayerAssets {
  iscBalance: number;
  bankBalance: number;
  investments: number;
  realEstateValue: number;
  businessValue: number;
  totalAssets: number;
}

export const PlayerCenter: React.FC<PlayerCenterProps> = ({
  playerId,
  playerName,
  level,
  profession,
  initialCharacter,
  initialEquippedItems,
  initialAssets,
  marriageProfile,
  onMarriagePropose,
  onMarriageRespond,
  onMarriageInteract,
  onMarriageDivorce,
  onProfessionSelect,
  activeSkills,
  onSkillActivate,
}) => {
  const [activeTab, setActiveTab] = useState('character');
  const [character, setCharacter] = useState<PlayerCharacter | null>(initialCharacter ?? null);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>(initialEquippedItems ?? {});
  const [assets, setAssets] = useState<PlayerAssets>(initialAssets ?? {
    iscBalance: 0,
    bankBalance: 0,
    investments: 0,
    realEstateValue: 0,
    businessValue: 0,
    totalAssets: 0,
  });
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCharacter(initialCharacter ?? null);
    setEquippedItems(initialEquippedItems ?? {});
    setAssets(initialAssets ?? {
      iscBalance: 0,
      bankBalance: 0,
      investments: 0,
      realEstateValue: 0,
      businessValue: 0,
      totalAssets: 0,
    });
  }, [initialAssets, initialCharacter, initialEquippedItems, playerId]);

  const handleEquipItem = (category: string, item: any) => {
    setEquippedItems((prev) => ({
      ...prev,
      [category]: item,
    }));
  };

  const handleSaveOutfit = async () => {
    try {
      // TODO: Replace with actual API call
      // await trpc.playerCenter.saveOutfit.useMutation({
      //   playerId,
      //   items: equippedItems,
      //   name: `Outfit ${new Date().toLocaleString()}`,
      // });
      console.log('Outfit saved:', equippedItems);
    } catch (error) {
      console.error('Failed to save outfit:', error);
    }
  };

  const handleShareOutfit = async () => {
    try {
      const shareData = {
        title: `Check out my outfit in Ice Snow City!`,
        text: `${playerName} - Level ${level} ${profession}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(text);
        console.log('Outfit link copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to share outfit:', error);
    }
  };

  const handleResetOutfit = () => {
    setEquippedItems({});
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-white text-lg">加载玩家中心中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 border-b border-cyan-400/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{playerName}</h1>
            <p className="text-cyan-100 text-sm mt-1">
              Lv.{level} · {profession} · 总资产: ¥{assets.totalAssets.toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveOutfit}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Save className="w-4 h-4 mr-2" />
              保存装扮
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareOutfit}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100%-80px)] overflow-hidden">
        {/* Left Panel - 3D Viewer */}
        <div className="flex-1 border-r border-slate-700 p-4 overflow-auto">
          <Card className="bg-slate-800 border-slate-700 h-full">
            <CardContent className="p-0 h-full">
              {character ? (
                <Character3DViewer
                  character={character}
                  equippedItems={equippedItems}
                  onRotationChange={setRotation}
                  autoRotate={true}
                  width={500}
                  height={600}
                />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center p-6 text-center text-slate-400">
                  尚未加载角色资产。请从真实玩家资料接口提供角色模型后再预览。
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Tabs */}
        <div className="flex-1 border-l border-slate-700 p-4 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-9 bg-slate-700 border border-slate-600">
              <TabsTrigger value="character" className="text-xs">
                <Shirt className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="wardrobe" className="text-xs">
                衣柜
              </TabsTrigger>
              <TabsTrigger value="shoes" className="text-xs">
                👠
              </TabsTrigger>
              <TabsTrigger value="jewelry" className="text-xs">
                <Gem className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-xs">
                <Wallet className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="share" className="text-xs">
                <Share2 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs" aria-label="成就与勋章">
                <Trophy className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="marriage" className="text-xs" aria-label="婚姻与伴侣">💍</TabsTrigger>
              <TabsTrigger value="profession" className="text-xs" aria-label="职业选择">🏢</TabsTrigger>
            </TabsList>

            {/* Character Info Tab */}
            <TabsContent value="character" className="flex-1 overflow-auto mt-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">角色信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {character && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">性别</p>
                        <p className="text-white font-semibold">
                          {character.gender === 'male' ? '男性' : '女性'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">身高</p>
                        <p className="text-white font-semibold">{character.height} cm</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">肤色</p>
                        <p className="text-white font-semibold capitalize">{character.skinTone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">发型</p>
                        <p className="text-white font-semibold capitalize">{character.hairStyle}</p>
                      </div>
                    </div>
                  )}

                  {Object.keys(equippedItems).length > 0 && (
                    <div className="pt-4 border-t border-slate-700">
                      <h3 className="text-white font-semibold mb-3">当前装备</h3>
                      <div className="space-y-2">
                        {Object.entries(equippedItems).map(([category, item]: [string, any]) => (
                          <div
                            key={category}
                            className="flex items-center justify-between bg-slate-700 p-2 rounded"
                          >
                            <span className="text-slate-300 text-sm capitalize">{category}</span>
                            <Badge variant="secondary">{item?.name || '未装备'}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleResetOutfit}
                    variant="outline"
                    className="w-full mt-4 bg-red-600/20 border-red-600/50 text-red-300 hover:bg-red-600/30"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重置装扮
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wardrobe Tab */}
            <TabsContent value="wardrobe" className="flex-1 overflow-auto mt-4">
              <WardrobePanel onEquipItem={handleEquipItem} equippedItems={equippedItems} />
            </TabsContent>

            {/* Shoes Tab */}
            <TabsContent value="shoes" className="flex-1 overflow-auto mt-4">
              <ShoeCabinetPanel onEquipItem={handleEquipItem} equippedItems={equippedItems} />
            </TabsContent>

            {/* Jewelry Tab */}
            <TabsContent value="jewelry" className="flex-1 overflow-auto mt-4">
              <JewelryPanel onEquipItem={handleEquipItem} equippedItems={equippedItems} />
            </TabsContent>

            {/* Assets Tab */}
            <TabsContent value="assets" className="flex-1 overflow-auto mt-4">
              <AssetsPanel assets={assets} />
            </TabsContent>

            {/* Share Tab */}
            <TabsContent value="share" className="flex-1 overflow-auto mt-4">
              <OutfitShareCard
                characterName={playerName}
                characterImage={character?.imageUrl || ''}
                equippedItems={equippedItems}
                totalValue={Object.values(equippedItems).reduce((sum, item: any) => sum + (item?.price || 0), 0)}
                onShare={(imageUrl) => {
                  console.log('Outfit shared:', imageUrl);
                }}
              />
            </TabsContent>

            {/* Personal achievements and badges */}
            <TabsContent value="achievements" className="flex-1 overflow-auto mt-4">
              <AchievementsPage />
            </TabsContent>

            <TabsContent value="marriage" className="flex-1 overflow-auto mt-4">
              {marriageProfile ? (
                <MarriagePanel profile={marriageProfile} onPropose={onMarriagePropose} onRespond={onMarriageRespond} onInteract={onMarriageInteract} onDivorce={onMarriageDivorce} isProcessing={isLoading} />
              ) : (
                <Card className="bg-slate-800 border-slate-700 p-6 text-slate-300">暂无婚姻资料。连接真实关系服务后，此处将显示状态与互动。</Card>
              )}
            </TabsContent>

            <TabsContent value="profession" className="flex-1 overflow-auto mt-4">
              {Object.values(ProfessionType).includes(profession as ProfessionType) ? (
                <div className="space-y-4"><ProfessionSelector currentProfession={profession as ProfessionType} totalAssets={assets.totalAssets} level={level} onSelect={onProfessionSelect ?? (() => undefined)} isProcessing={isLoading} /><SkillTree profession={profession as ProfessionType} level={level} activeSkills={activeSkills} onActivate={onSkillActivate} isProcessing={isLoading} /></div>
              ) : (
                <Card className="bg-slate-800 border-slate-700 p-6 text-slate-300">暂无职业资料。连接真实职业服务后，此处将显示选择与解锁条件。</Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
