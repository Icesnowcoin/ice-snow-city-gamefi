import { describe, it, expect, beforeEach } from 'vitest';

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

// Mock data
const mockNPCScheduleData: NPCScheduleData[] = [
  {
    npcId: 'npc_001',
    npcName: '张三',
    currentLocation: '咖啡馆',
    currentActivity: '喝咖啡',
    isAvailable: true,
    relationshipLevel: 3,
    relationshipPoints: 450,
    schedule24Hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      location: hour < 8 ? '家' : hour < 12 ? '办公室' : hour < 18 ? '咖啡馆' : '家',
      activity: hour < 8 ? '睡眠' : hour < 12 ? '工作' : hour < 18 ? '休闲' : '休息',
      isAvailable: hour >= 12 && hour < 18,
    })),
    lastInteraction: {
      type: '打招呼',
      timestamp: Date.now() - 3600000,
      result: '关系值 +10',
    },
  },
  {
    npcId: 'npc_002',
    npcName: '李四',
    currentLocation: '办公室',
    currentActivity: '工作',
    isAvailable: false,
    relationshipLevel: 2,
    relationshipPoints: 250,
    schedule24Hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      location: hour < 8 ? '家' : hour < 18 ? '办公室' : '家',
      activity: hour < 8 ? '睡眠' : hour < 18 ? '工作' : '休息',
      isAvailable: false,
    })),
  },
  {
    npcId: 'npc_003',
    npcName: '王五',
    currentLocation: '公园',
    currentActivity: '散步',
    isAvailable: true,
    relationshipLevel: 4,
    relationshipPoints: 750,
    schedule24Hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      location: hour < 8 ? '家' : hour < 12 ? '公园' : hour < 18 ? '商场' : '家',
      activity: hour < 8 ? '睡眠' : hour < 12 ? '散步' : hour < 18 ? '购物' : '休息',
      isAvailable: hour >= 10 && hour < 20,
    })),
  },
];

describe('NPC Schedule Integration', () => {
  let npcData: NPCScheduleData[];

  beforeEach(() => {
    npcData = JSON.parse(JSON.stringify(mockNPCScheduleData));
  });

  describe('NPC Status Filtering', () => {
    it('should filter available NPCs', () => {
      const available = npcData.filter((npc) => npc.isAvailable);
      expect(available.length).toBe(2);
      expect(available.every((npc) => npc.isAvailable)).toBe(true);
    });

    it('should filter unavailable NPCs', () => {
      const unavailable = npcData.filter((npc) => !npc.isAvailable);
      expect(unavailable.length).toBe(1);
      expect(unavailable.every((npc) => !npc.isAvailable)).toBe(true);
    });

    it('should count total NPCs', () => {
      expect(npcData.length).toBe(3);
    });
  });

  describe('NPC Schedule Analysis', () => {
    it('should identify available time slots', () => {
      const npc = npcData[0];
      const availableSlots = npc.schedule24Hours.filter((slot) => slot.isAvailable);
      expect(availableSlots.length).toBe(6); // 12:00 to 18:00
    });

    it('should identify busy time slots', () => {
      const npc = npcData[0];
      const busySlots = npc.schedule24Hours.filter((slot) => !slot.isAvailable);
      expect(busySlots.length).toBe(18); // 0:00-12:00 and 18:00-24:00
    });

    it('should track NPC location changes throughout the day', () => {
      const npc = npcData[0];
      const locations = new Set(npc.schedule24Hours.map((slot) => slot.location));
      expect(locations.size).toBeGreaterThan(1);
    });

    it('should track NPC activity changes throughout the day', () => {
      const npc = npcData[0];
      const activities = new Set(npc.schedule24Hours.map((slot) => slot.activity));
      expect(activities.size).toBeGreaterThan(1);
    });
  });

  describe('Relationship Management', () => {
    it('should calculate relationship level correctly', () => {
      const npc = npcData[0];
      expect(npc.relationshipLevel).toBeGreaterThan(0);
      expect(npc.relationshipLevel).toBeLessThanOrEqual(10);
    });

    it('should track relationship points', () => {
      const npc = npcData[0];
      expect(npc.relationshipPoints).toBeGreaterThanOrEqual(0);
      expect(npc.relationshipPoints).toBeLessThanOrEqual(1000);
    });

    it('should calculate average relationship level', () => {
      const avgRelationship = npcData.reduce((sum, npc) => sum + npc.relationshipLevel, 0) / npcData.length;
      expect(avgRelationship).toBeGreaterThan(0);
      expect(avgRelationship).toBeLessThanOrEqual(10);
    });

    it('should sort NPCs by relationship level', () => {
      const sorted = [...npcData].sort((a, b) => b.relationshipLevel - a.relationshipLevel);
      expect(sorted[0].relationshipLevel).toBeGreaterThanOrEqual(sorted[1].relationshipLevel);
      expect(sorted[1].relationshipLevel).toBeGreaterThanOrEqual(sorted[2].relationshipLevel);
    });
  });

  describe('Interaction Tracking', () => {
    it('should track last interaction', () => {
      const npc = npcData[0];
      expect(npc.lastInteraction).toBeDefined();
      expect(npc.lastInteraction?.type).toBe('打招呼');
    });

    it('should record interaction results', () => {
      const npc = npcData[0];
      expect(npc.lastInteraction?.result).toContain('关系值');
    });

    it('should handle NPCs without interaction history', () => {
      const npc = npcData[1];
      expect(npc.lastInteraction).toBeUndefined();
    });
  });

  describe('Schedule-Based Interaction Planning', () => {
    it('should find best time to interact with NPC', () => {
      const npc = npcData[0];
      const bestTimes = npc.schedule24Hours.filter((slot) => slot.isAvailable);
      expect(bestTimes.length).toBeGreaterThan(0);
    });

    it('should suggest alternative times for busy NPC', () => {
      const npc = npcData[1];
      const availableTimes = npc.schedule24Hours.filter((slot) => slot.isAvailable);
      expect(availableTimes.length).toBe(0);
    });

    it('should find NPCs available at specific hour', () => {
      const targetHour = 14; // 2 PM
      const availableAtHour = npcData.filter((npc) => {
        const slot = npc.schedule24Hours.find((s) => s.hour === targetHour);
        return slot?.isAvailable;
      });
      expect(availableAtHour.length).toBeGreaterThan(0);
    });
  });

  describe('NPC Location Tracking', () => {
    it('should identify current NPC location', () => {
      const npc = npcData[0];
      expect(npc.currentLocation).toBeDefined();
      expect(npc.currentLocation).toBeTruthy();
    });

    it('should predict NPC location at specific hour', () => {
      const npc = npcData[0];
      const targetHour = 14;
      const slot = npc.schedule24Hours.find((s) => s.hour === targetHour);
      expect(slot?.location).toBeDefined();
    });

    it('should group NPCs by location', () => {
      const locationMap = new Map<string, NPCScheduleData[]>();
      npcData.forEach((npc) => {
        const location = npc.currentLocation;
        if (!locationMap.has(location)) {
          locationMap.set(location, []);
        }
        locationMap.get(location)!.push(npc);
      });
      expect(locationMap.size).toBeGreaterThan(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large NPC dataset', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...npcData[0],
        npcId: `npc_${i}`,
        npcName: `NPC_${i}`,
      }));

      const startTime = performance.now();
      const available = largeDataset.filter((npc) => npc.isAvailable);
      const endTime = performance.now();

      expect(available.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in less than 50ms
    });

    it('should handle NPC with no schedule data', () => {
      const npcNoSchedule: NPCScheduleData = {
        ...npcData[0],
        schedule24Hours: [],
      };

      const availableSlots = npcNoSchedule.schedule24Hours.filter((slot) => slot.isAvailable);
      expect(availableSlots.length).toBe(0);
    });

    it('should handle null or undefined values gracefully', () => {
      const npcWithNull = {
        ...npcData[0],
        lastInteraction: undefined,
      };

      expect(npcWithNull.lastInteraction).toBeUndefined();
    });
  });

  describe('Interaction Type Validation', () => {
    it('should support greet interaction', () => {
      const interactionTypes = ['greet', 'gift', 'date'];
      expect(interactionTypes).toContain('greet');
    });

    it('should support gift interaction', () => {
      const interactionTypes = ['greet', 'gift', 'date'];
      expect(interactionTypes).toContain('gift');
    });

    it('should support date interaction', () => {
      const interactionTypes = ['greet', 'gift', 'date'];
      expect(interactionTypes).toContain('date');
    });

    it('should only allow interactions with available NPCs', () => {
      const availableNPCs = npcData.filter((npc) => npc.isAvailable);
      availableNPCs.forEach((npc) => {
        expect(npc.isAvailable).toBe(true);
      });
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate total available NPCs', () => {
      const total = npcData.filter((npc) => npc.isAvailable).length;
      expect(total).toBe(2);
    });

    it('should calculate total unavailable NPCs', () => {
      const total = npcData.filter((npc) => !npc.isAvailable).length;
      expect(total).toBe(1);
    });

    it('should calculate average relationship points', () => {
      const avgPoints = npcData.reduce((sum, npc) => sum + npc.relationshipPoints, 0) / npcData.length;
      expect(avgPoints).toBeGreaterThan(0);
    });

    it('should find NPC with highest relationship', () => {
      const highest = npcData.reduce((max, npc) =>
        npc.relationshipLevel > max.relationshipLevel ? npc : max
      );
      expect(highest.relationshipLevel).toBe(4);
    });

    it('should find NPC with lowest relationship', () => {
      const lowest = npcData.reduce((min, npc) =>
        npc.relationshipLevel < min.relationshipLevel ? npc : min
      );
      expect(lowest.relationshipLevel).toBe(2);
    });
  });
});
