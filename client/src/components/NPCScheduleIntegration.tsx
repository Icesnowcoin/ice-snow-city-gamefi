import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, Heart, Gift } from 'lucide-react';

/**
 * NPC Schedule Integration Component
 * 
 * This component integrates NPC schedule system into the real game flow:
 * 1. Shows NPC current location and availability
 * 2. Displays 24-hour schedule for interaction planning
 * 3. Enables player interactions (greet, gift, date)
 * 4. Tracks relationship changes
 * 5. Integrates with player activity log
 */

interface NPCScheduleData {
  npcId: string;
  npcName: string;
  currentLocation: string;
  currentActivity: string;
  isAvailable: boolean;
  relationshipLevel: number;
  relationshipPoints: number;
  schedule24Hours: Array<{
    hour: number;
    location: string;
    activity: string;
    isAvailable: boolean;
  }>;
  lastInteraction?: {
    type: string;
    timestamp: number;
    result: string;
  };
}

interface NPCScheduleIntegrationProps {
  npcData: NPCScheduleData[];
  onNPCInteraction?: (npcId: string, interactionType: string) => void;
  onScheduleView?: (npcId: string) => void;
  isLoading?: boolean;
}

/**
 * NPC Status Card - Shows current NPC status and quick actions
 */
const NPCStatusCard: React.FC<{
  npc: NPCScheduleData;
  onInteract: (type: string) => void;
}> = ({ npc, onInteract }) => {
  const getAvailabilityColor = (available: boolean) => {
    return available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* NPC Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{npc.npcName}</h3>
            <p className="text-sm text-muted-foreground">关系等级 {npc.relationshipLevel}</p>
          </div>
          <Badge className={getAvailabilityColor(npc.isAvailable)}>
            {npc.isAvailable ? '可交互' : '不可用'}
          </Badge>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>{npc.currentLocation}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>{npc.currentActivity}</span>
          </div>
        </div>

        {/* Relationship Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>关系值</span>
            <span>{npc.relationshipPoints} / 1000</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((npc.relationshipPoints / 1000) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Last Interaction */}
        {npc.lastInteraction && (
          <div className="bg-blue-50 p-2 rounded text-xs">
            <p className="font-medium">最后交互: {npc.lastInteraction.type}</p>
            <p className="text-muted-foreground">{npc.lastInteraction.result}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInteract('greet')}
            disabled={!npc.isAvailable}
            className="flex-1"
          >
            <User className="w-4 h-4 mr-1" />
            打招呼
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInteract('gift')}
            disabled={!npc.isAvailable}
            className="flex-1"
          >
            <Gift className="w-4 h-4 mr-1" />
            送礼
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInteract('date')}
            disabled={!npc.isAvailable}
            className="flex-1"
          >
            <Heart className="w-4 h-4 mr-1" />
            约会
          </Button>
        </div>
      </div>
    </Card>
  );
};

/**
 * NPC Schedule Timeline - Shows 24-hour schedule
 */
const NPCScheduleTimeline: React.FC<{
  npc: NPCScheduleData;
}> = ({ npc }) => {
  const getCurrentHour = () => {
    const now = new Date();
    return now.getHours();
  };

  const currentHour = getCurrentHour();

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{npc.npcName} 的 24 小时日程</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {npc.schedule24Hours.map((slot) => (
            <div
              key={slot.hour}
              className={`p-3 rounded-lg border-l-4 ${
                slot.hour === currentHour
                  ? 'bg-blue-50 border-l-blue-500'
                  : slot.isAvailable
                  ? 'bg-green-50 border-l-green-500'
                  : 'bg-gray-50 border-l-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-semibold w-12">{slot.hour}:00</span>
                  <div>
                    <p className="text-sm font-medium">{slot.location}</p>
                    <p className="text-xs text-muted-foreground">{slot.activity}</p>
                  </div>
                </div>
                <Badge variant={slot.isAvailable ? 'default' : 'secondary'}>
                  {slot.isAvailable ? '可交互' : '忙碌'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main NPC Schedule Integration Component
 */
export const NPCScheduleIntegration: React.FC<NPCScheduleIntegrationProps> = ({
  npcData,
  onNPCInteraction,
  onScheduleView,
  isLoading = false,
}) => {
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(
    npcData.length > 0 ? npcData[0].npcId : null
  );

  const selectedNPC = useMemo(() => {
    return npcData.find((npc) => npc.npcId === selectedNPCId);
  }, [npcData, selectedNPCId]);

  const handleNPCInteraction = useCallback(
    (interactionType: string) => {
      if (selectedNPC) {
        onNPCInteraction?.(selectedNPC.npcId, interactionType);
      }
    },
    [selectedNPC, onNPCInteraction]
  );

  const availableNPCs = useMemo(() => {
    return npcData.filter((npc) => npc.isAvailable);
  }, [npcData]);

  const unavailableNPCs = useMemo(() => {
    return npcData.filter((npc) => !npc.isAvailable);
  }, [npcData]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  if (npcData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64 text-gray-400">
          没有 NPC 数据
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">
            可交互 ({availableNPCs.length})
          </TabsTrigger>
          <TabsTrigger value="unavailable">
            忙碌 ({unavailableNPCs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableNPCs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableNPCs.map((npc) => (
                <div
                  key={npc.npcId}
                  onClick={() => setSelectedNPCId(npc.npcId)}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                >
                  <NPCStatusCard npc={npc} onInteract={handleNPCInteraction} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                当前没有可交互的 NPC
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unavailable" className="space-y-4">
          {unavailableNPCs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unavailableNPCs.map((npc) => (
                <div
                  key={npc.npcId}
                  onClick={() => setSelectedNPCId(npc.npcId)}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                >
                  <NPCStatusCard npc={npc} onInteract={handleNPCInteraction} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                所有 NPC 都可交互
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Timeline */}
      {selectedNPC && (
        <div className="mt-6">
          <NPCScheduleTimeline npc={selectedNPC} />
        </div>
      )}

      {/* Statistics */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">总 NPC 数</p>
            <p className="text-2xl font-semibold">{npcData.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">可交互</p>
            <p className="text-2xl font-semibold text-green-600">{availableNPCs.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">忙碌</p>
            <p className="text-2xl font-semibold text-orange-600">{unavailableNPCs.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">平均关系</p>
            <p className="text-2xl font-semibold">
              {(npcData.reduce((sum, npc) => sum + npc.relationshipLevel, 0) / npcData.length).toFixed(1)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NPCScheduleIntegration;
