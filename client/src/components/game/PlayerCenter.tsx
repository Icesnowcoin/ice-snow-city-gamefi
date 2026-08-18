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
import { WardrobePanel } from './WardrobePanel';
import { ShoeCabinetPanel } from './ShoeCabinetPanel';
import { JewelryPanel } from './JewelryPanel';
import { AssetsPanel } from './AssetsPanel';
import { OutfitShareCard } from './OutfitShareCard';
import { 
  Shirt, 
  Gem, 
  Wallet, 
  Share2, 
  RotateCcw,
  Save
} from 'lucide-react';

interface PlayerCenterProps {
  playerId: number;
  playerName: string;
  level: number;
  profession: string;
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
}) => {
  const [activeTab, setActiveTab] = useState('character');
  const [character, setCharacter] = useState<any>(null);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({});
  const [assets, setAssets] = useState<PlayerAssets>({
    iscBalance: 0,
    bankBalance: 0,
    investments: 0,
    realEstateValue: 0,
    businessValue: 0,
    totalAssets: 0,
  });
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load player data
  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await trpc.playerCenter.getPlayerData.useQuery({ playerId });
        
        // Mock data for now
        setCharacter({
          id: 1,
          userId: playerId,
          gender: 'female',
          skinTone: 'fair',
          faceShape: 'oval',
          eyeShape: 'almond',
          eyeColor: 'blue',
          noseShape: 'small',
          mouthShape: 'full',
          hairStyle: 'long',
          hairColor: 'white',
          bodyType: 'slim',
          height: 170,
        });

        setEquippedItems({
          shirt: { id: 1, name: 'Blue Dress', category: 'shirt', price: 100 },
          pants: { id: 2, name: 'Black Pants', category: 'pants', price: 80 },
          shoes: { id: 3, name: 'White Heels', category: 'shoes', price: 120 },
          hat: { id: 4, name: 'Winter Hat', category: 'hat', price: 50 },
        });

        setAssets({
          iscBalance: 50000,
          bankBalance: 100000,
          investments: 500000,
          realEstateValue: 1000000,
          businessValue: 2000000,
          totalAssets: 3650000,
        });
      } catch (error) {
        console.error('Failed to load player data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerData();
  }, [playerId]);

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
              <Character3DViewer
                character={character}
                equippedItems={equippedItems}
                onRotationChange={setRotation}
                autoRotate={true}
                width={500}
                height={600}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Tabs */}
        <div className="flex-1 border-l border-slate-700 p-4 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6 bg-slate-700 border border-slate-600">
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};
