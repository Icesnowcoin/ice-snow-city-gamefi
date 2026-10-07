import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Home, Users, Briefcase, MapPin, Trophy } from 'lucide-react';

/**
 * Game System Integration Component
 * 
 * 整合游戏的核心系统：
 * 1. 婚姻系统 - 玩家可与 NPC 建立关系并结婚
 * 2. 房地产系统 - 玩家可购买、出租、开发房产
 * 3. 商业系统 - 玩家可开店、经营、扩展业务
 * 4. 社交系统 - 玩家互动、组织活动、建立社区
 * 5. 私密空间 - 玩家的私人住宅和办公室
 * 6. 成就系统 - 玩家成就追踪和奖励
 */

interface MarriageData {
  partnerId: string;
  partnerName: string;
  marriageDate: number;
  relationshipLevel: number;
  sharedAssets: number;
  children: number;
}

interface PropertyData {
  propertyId: string;
  propertyName: string;
  location: string;
  purchasePrice: number;
  currentValue: number;
  rentalIncome: number;
  developmentLevel: number;
  isPrivateSpace: boolean;
}

interface BusinessData {
  businessId: string;
  businessName: string;
  businessType: string;
  location: string;
  revenue: number;
  employees: number;
  level: number;
}

interface PlayerGameStatus {
  playerId: string;
  playerName: string;
  level: number;
  experience: number;
  marriage?: MarriageData;
  properties: PropertyData[];
  businesses: BusinessData[];
  achievements: string[];
  privateSpaceAccess: string[];
}

interface GameSystemIntegrationProps {
  playerStatus: PlayerGameStatus[];
  onGameUpdate?: (data: PlayerGameStatus) => void;
  isLoading?: boolean;
}

/**
 * Marriage Status Card
 */
const MarriageStatusCard: React.FC<{ data: MarriageData }> = ({ data }) => {
  const yearsMarried = Math.floor((Date.now() - data.marriageDate) / (1000 * 60 * 60 * 24 * 365));

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="font-semibold">{data.partnerName}</span>
          </div>
          <Badge variant="default">已婚</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">婚龄</p>
            <p className="font-semibold">{yearsMarried} 年</p>
          </div>
          <div>
            <p className="text-muted-foreground">关系等级</p>
            <p className="font-semibold">{data.relationshipLevel}/10</p>
          </div>
          <div>
            <p className="text-muted-foreground">共同资产</p>
            <p className="font-semibold">{(data.sharedAssets / 1000).toFixed(1)}K</p>
          </div>
          <div>
            <p className="text-muted-foreground">子女数</p>
            <p className="font-semibold">{data.children}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Property Portfolio Card
 */
const PropertyPortfolioCard: React.FC<{ properties: PropertyData[] }> = ({ properties }) => {
  const totalValue = useMemo(() => {
    return properties.reduce((sum, p) => sum + p.currentValue, 0);
  }, [properties]);

  const totalRentalIncome = useMemo(() => {
    return properties.reduce((sum, p) => sum + p.rentalIncome, 0);
  }, [properties]);

  const privateSpaces = useMemo(() => {
    return properties.filter(p => p.isPrivateSpace);
  }, [properties]);

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">房地产投资组合</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">总资产</p>
            <p className="font-semibold text-blue-600">{(totalValue / 1000).toFixed(1)}K</p>
          </div>
          <div>
            <p className="text-muted-foreground">租赁收入</p>
            <p className="font-semibold text-green-600">{(totalRentalIncome / 1000).toFixed(1)}K</p>
          </div>
          <div>
            <p className="text-muted-foreground">房产数</p>
            <p className="font-semibold">{properties.length}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">房产列表</p>
          {properties.map((property) => (
            <div key={property.propertyId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2 flex-1">
                <Home className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs font-medium">{property.propertyName}</p>
                  <p className="text-xs text-muted-foreground">{property.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold">{(property.currentValue / 1000).toFixed(1)}K</p>
                {property.isPrivateSpace && (
                  <Badge variant="outline" className="text-xs">私密</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {privateSpaces.length > 0 && (
          <div className="bg-blue-50 p-2 rounded text-xs">
            <p className="font-medium">🏠 私密空间: {privateSpaces.map(p => p.propertyName).join(', ')}</p>
            <p className="text-muted-foreground">未受邀请的用户无法访问</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Business Empire Card
 */
const BusinessEmpireCard: React.FC<{ businesses: BusinessData[] }> = ({ businesses }) => {
  const totalRevenue = useMemo(() => {
    return businesses.reduce((sum, b) => sum + b.revenue, 0);
  }, [businesses]);

  const totalEmployees = useMemo(() => {
    return businesses.reduce((sum, b) => sum + b.employees, 0);
  }, [businesses]);

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">商业帝国</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">总收入</p>
            <p className="font-semibold text-green-600">{(totalRevenue / 1000).toFixed(1)}K</p>
          </div>
          <div>
            <p className="text-muted-foreground">员工数</p>
            <p className="font-semibold">{totalEmployees}</p>
          </div>
          <div>
            <p className="text-muted-foreground">业务数</p>
            <p className="font-semibold">{businesses.length}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">业务列表</p>
          {businesses.map((business) => (
            <div key={business.businessId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2 flex-1">
                <Briefcase className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs font-medium">{business.businessName}</p>
                  <p className="text-xs text-muted-foreground">{business.businessType} · {business.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold">{(business.revenue / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">Lv.{business.level}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Achievement Showcase
 */
const AchievementShowcase: React.FC<{ achievements: string[] }> = ({ achievements }) => {
  const achievementCategories = {
    marriage: achievements.filter(a => a.includes('婚')),
    property: achievements.filter(a => a.includes('房')),
    business: achievements.filter(a => a.includes('商')),
    social: achievements.filter(a => a.includes('社')),
  };

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">成就系统</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">总成就</p>
            <p className="font-semibold">{achievements.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">完成度</p>
            <p className="font-semibold">{((achievements.length / 50) * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(achievementCategories).map(([category, items]) => (
            items.length > 0 && (
              <div key={category}>
                <p className="text-xs font-medium mb-1">
                  {category === 'marriage' && '💍 婚姻成就'}
                  {category === 'property' && '🏠 房产成就'}
                  {category === 'business' && '💼 商业成就'}
                  {category === 'social' && '👥 社交成就'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {items.map((achievement, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Player Level Card
 */
const PlayerLevelCard: React.FC<{ level: number; experience: number }> = ({ level, experience }) => {
  const nextLevelExp = level * 1000;
  const expProgress = (experience % nextLevelExp) / nextLevelExp;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">等级</span>
          <span className="text-2xl font-bold text-blue-600">{level}</span>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>经验值</span>
            <span>{experience.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${expProgress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Main Game System Integration Component
 */
export const GameSystemIntegration: React.FC<GameSystemIntegrationProps> = ({
  playerStatus,
  onGameUpdate,
  isLoading = false,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    playerStatus.length > 0 ? playerStatus[0].playerId : null
  );

  const selectedPlayer = useMemo(() => {
    return playerStatus.find((p) => p.playerId === selectedPlayerId);
  }, [playerStatus, selectedPlayerId]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  if (playerStatus.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64 text-gray-400">
          没有玩家数据
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="marriage">婚姻</TabsTrigger>
          <TabsTrigger value="property">房产</TabsTrigger>
          <TabsTrigger value="business">商业</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {selectedPlayer && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PlayerLevelCard level={selectedPlayer.level} experience={selectedPlayer.experience} />
                <Card className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">玩家信息</p>
                    <div className="text-sm space-y-1">
                      <p>ID: {selectedPlayer.playerId}</p>
                      <p>名称: {selectedPlayer.playerName}</p>
                      <p>房产: {selectedPlayer.properties.length}</p>
                      <p>业务: {selectedPlayer.businesses.length}</p>
                      <p>成就: {selectedPlayer.achievements.length}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {selectedPlayer.marriage && (
                <MarriageStatusCard data={selectedPlayer.marriage} />
              )}
            </>
          )}

          {/* Player Selection */}
          <Card className="p-4">
            <p className="text-sm font-medium mb-2">选择玩家</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {playerStatus.map((player) => (
                <Button
                  key={player.playerId}
                  variant={selectedPlayerId === player.playerId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlayerId(player.playerId)}
                  className="text-xs"
                >
                  {player.playerName}
                </Button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="marriage" className="space-y-4">
          {selectedPlayer?.marriage ? (
            <MarriageStatusCard data={selectedPlayer.marriage} />
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                该玩家未结婚
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="property" className="space-y-4">
          {selectedPlayer && selectedPlayer.properties.length > 0 ? (
            <PropertyPortfolioCard properties={selectedPlayer.properties} />
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                该玩家没有房产
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          {selectedPlayer && selectedPlayer.businesses.length > 0 ? (
            <BusinessEmpireCard businesses={selectedPlayer.businesses} />
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                该玩家没有业务
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Achievements */}
      {selectedPlayer && selectedPlayer.achievements.length > 0 && (
        <AchievementShowcase achievements={selectedPlayer.achievements} />
      )}

      {/* Statistics */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">总玩家</p>
            <p className="text-2xl font-semibold">{playerStatus.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">已婚玩家</p>
            <p className="text-2xl font-semibold text-red-600">
              {playerStatus.filter(p => p.marriage).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">平均等级</p>
            <p className="text-2xl font-semibold">
              {(playerStatus.reduce((sum, p) => sum + p.level, 0) / playerStatus.length).toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">总房产</p>
            <p className="text-2xl font-semibold">
              {playerStatus.reduce((sum, p) => sum + p.properties.length, 0)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GameSystemIntegration;
