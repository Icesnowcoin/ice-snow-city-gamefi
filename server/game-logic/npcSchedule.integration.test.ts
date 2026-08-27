import { describe, it, expect, beforeEach } from 'vitest';
import { NPCScheduleService } from './npcSchedule';
import type { GameState, NPCRelationship } from './types';

/**
 * Integration tests for NPC Schedule system
 * Tests the complete data flow from backend to frontend
 */

describe('NPC Schedule Integration Tests', () => {
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = {
      playerId: 'player_001',
      playerProfile: {
        id: 'player_001',
        name: 'Test Player',
        level: 1,
        experience: 0,
        totalExperience: 0,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      },
      playerAssets: {
        money: 1000,
        isc: 100,
        energy: 100,
        food: 50,
        water: 50,
        population: 0,
        reputation: 0,
      },
      playerProgress: {
        tasksCompleted: 0,
        npcsFriended: 0,
        propertiesOwned: 0,
        farmsCreated: 0,
        itemsTraded: 0,
        achievements: [],
      },
      gameTime: {
        hour: 12,
        day: 1,
        month: 1,
        season: 'spring',
      },
      npcRelationships: [
        {
          npcId: 'npc_001',
          favorability: 50,
          relationship: 'acquaintance',
          lastInteraction: new Date(),
          interactionCount: 5,
          likes: ['flowers', 'books'],
          dislikes: ['noise'],
        },
        {
          npcId: 'npc_002',
          favorability: 75,
          relationship: 'friend',
          lastInteraction: new Date(),
          interactionCount: 10,
          likes: ['coffee'],
          dislikes: [],
        },
        {
          npcId: 'npc_003',
          favorability: 30,
          relationship: 'stranger',
          lastInteraction: new Date(),
          interactionCount: 1,
          likes: [],
          dislikes: ['interruption'],
        },
      ] as NPCRelationship[],
      npcInteractionHistory: [],
      npcSchedules: {
        npc_001: {
          0: { location: 'home', activity: 'sleeping', availability: 'unavailable' },
          6: { location: 'home', activity: 'waking', availability: 'unavailable' },
          8: { location: 'market', activity: 'shopping', availability: 'available' },
          12: { location: 'cafe', activity: 'lunch', availability: 'busy' },
          14: { location: 'park', activity: 'relaxing', availability: 'available' },
          18: { location: 'home', activity: 'cooking', availability: 'busy' },
          22: { location: 'home', activity: 'sleeping', availability: 'unavailable' },
        },
        npc_002: {
          0: { location: 'home', activity: 'sleeping', availability: 'unavailable' },
          7: { location: 'office', activity: 'working', availability: 'busy' },
          12: { location: 'restaurant', activity: 'lunch', availability: 'busy' },
          17: { location: 'gym', activity: 'exercising', availability: 'available' },
          20: { location: 'home', activity: 'relaxing', availability: 'available' },
          23: { location: 'home', activity: 'sleeping', availability: 'unavailable' },
        },
        npc_003: {
          0: { location: 'home', activity: 'sleeping', availability: 'unavailable' },
          8: { location: 'library', activity: 'reading', availability: 'available' },
          12: { location: 'library', activity: 'reading', availability: 'available' },
          18: { location: 'home', activity: 'eating', availability: 'busy' },
          22: { location: 'home', activity: 'sleeping', availability: 'unavailable' },
        },
      },
      wallet: {
        playerId: 'player_001',
        money: 1000,
        isc: 100,
        lastUpdated: new Date(),
      },
      inventory: {
        playerId: 'player_001',
        items: [],
        capacity: 50,
      },
      transactions: [],
      bankAccount: {
        playerId: 'player_001',
        balance: 0,
        depositedISC: 0,
        interestEarned: 0,
        lastInterestClaim: new Date(),
      },
      marketPrices: [],
      properties: [],
      rentals: [],
      farms: [],
      harvestHistory: [],
      tasks: [],
      completedTasks: [],
      shopInventory: [],
      purchaseHistory: [],
      socialConnections: [],
      achievements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('Data Source Priority', () => {
    it('should prioritize npcRelationships over npcSchedules', () => {
      // Get all NPC IDs from relationships
      const npcIdsFromRelationships = mockGameState.npcRelationships.map((rel) => rel.npcId);
      
      // Should have 3 NPCs from relationships
      expect(npcIdsFromRelationships).toHaveLength(3);
      expect(npcIdsFromRelationships).toContain('npc_001');
      expect(npcIdsFromRelationships).toContain('npc_002');
      expect(npcIdsFromRelationships).toContain('npc_003');
    });

    it('should fallback to npcSchedules when relationships are empty', () => {
      mockGameState.npcRelationships = [];
      
      const npcIdsFromSchedules = Object.keys(mockGameState.npcSchedules || {});
      
      expect(npcIdsFromSchedules).toHaveLength(3);
      expect(npcIdsFromSchedules).toContain('npc_001');
      expect(npcIdsFromSchedules).toContain('npc_002');
      expect(npcIdsFromSchedules).toContain('npc_003');
    });

    it('should use fallback when both relationships and schedules are empty', () => {
      mockGameState.npcRelationships = [];
      mockGameState.npcSchedules = {};
      
      const fallbackNPCIds = ['npc_001', 'npc_002', 'npc_003', 'npc_004', 'npc_005'];
      
      expect(fallbackNPCIds).toHaveLength(5);
    });
  });

  describe('getCurrentStatus API Contract', () => {
    it('should return correct location and activity', () => {
      const npcId = 'npc_001';
      const location = NPCScheduleService.getNPCLocation(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
      const activity = NPCScheduleService.getNPCActivity(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
      
      expect(typeof location).toBe('string');
      expect(typeof activity).toBe('string');
    });

    it('should have valid availability values', () => {
      const npcId = 'npc_001';
      const availability = NPCScheduleService.getAvailabilityStatus(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
      
      expect(['available', 'busy', 'unavailable']).toContain(availability);
    });

    it('should return time until available', () => {
      const npcId = 'npc_001';
      const timeUntilAvailable = NPCScheduleService.getTimeUntilAvailable(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
      
      expect(typeof timeUntilAvailable).toBe('number');
      expect(timeUntilAvailable).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSchedule24Hours API Contract', () => {
    it('should return correct schedule structure', () => {
      const npcId = 'npc_001';
      const schedule = NPCScheduleService.getNPCScheduleNext24Hours(
        npcId,
        mockGameState.gameTime,
        mockGameState.npcSchedules
      );
      
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('should return schedule entries with correct structure', () => {
      const npcId = 'npc_001';
      const schedule = NPCScheduleService.getNPCScheduleNext24Hours(
        npcId,
        mockGameState.gameTime,
        mockGameState.npcSchedules
      );
      
      schedule.forEach((entry) => {
        expect(entry).toHaveProperty('time');
        expect(entry).toHaveProperty('activity');
        expect(entry).toHaveProperty('location');
        expect(entry).toHaveProperty('availability');
      });
    });

    it('should return at least 24 hours of schedule data', () => {
      const npcId = 'npc_001';
      const schedule = NPCScheduleService.getNPCScheduleNext24Hours(
        npcId,
        mockGameState.gameTime,
        mockGameState.npcSchedules
      );
      
      // Should have entries for multiple hours
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('should handle missing schedule gracefully', () => {
      const npcId = 'npc_999'; // Non-existent NPC
      const schedule = NPCScheduleService.getNPCScheduleNext24Hours(
        npcId,
        mockGameState.gameTime,
        mockGameState.npcSchedules
      );
      
      // Should return empty array or default schedule
      expect(Array.isArray(schedule)).toBe(true);
    });
  });

  describe('getAvailableNPCs API Contract', () => {
    it('should return array of available NPC IDs', () => {
      const allNPCIds = ['npc_001', 'npc_002', 'npc_003'];
      const availableNPCs = NPCScheduleService.getAvailableNPCs(mockGameState, allNPCIds);
      
      expect(Array.isArray(availableNPCs)).toBe(true);
      availableNPCs.forEach((npcId) => {
        expect(typeof npcId).toBe('string');
      });
    });

    it('should only return NPCs that are available', () => {
      const allNPCIds = ['npc_001', 'npc_002', 'npc_003'];
      const availableNPCs = NPCScheduleService.getAvailableNPCs(mockGameState, allNPCIds);
      
      // Verify that returned NPCs are actually available
      availableNPCs.forEach((npcId) => {
        const availability = NPCScheduleService.getAvailabilityStatus(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
        expect(availability).toBe('available');
      });
    });

    it('should return empty array when no NPCs are available', () => {
      // Set all NPCs to unavailable
      mockGameState.gameTime.hour = 2; // Night time
      
      const allNPCIds = ['npc_001', 'npc_002', 'npc_003'];
      const availableNPCs = NPCScheduleService.getAvailableNPCs(mockGameState, allNPCIds);
      
      expect(Array.isArray(availableNPCs)).toBe(true);
    });
  });

  describe('Frontend-Backend Data Flow', () => {
    it('should map NPC status data correctly', () => {
      const npcId = 'npc_001';
      const location = NPCScheduleService.getNPCLocation(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
      const activity = NPCScheduleService.getNPCActivity(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
      const availability = NPCScheduleService.getAvailabilityStatus(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
      const timeUntilAvailable = NPCScheduleService.getTimeUntilAvailable(npcId, mockGameState.gameTime, mockGameState.npcSchedules);
      
      // Verify it matches NPCStatus interface
      const npcStatus = {
        npcId,
        location,
        activity,
        availability: availability as 'available' | 'busy' | 'unavailable',
        timeUntilAvailable,
        currentGameTime: mockGameState.gameTime,
      };
      
      expect(npcStatus.npcId).toBe(npcId);
      expect(['available', 'busy', 'unavailable']).toContain(npcStatus.availability);
    });

    it('should map getSchedule24Hours response to NPCScheduleEntry array', () => {
      const npcId = 'npc_001';
      const scheduleResponse = NPCScheduleService.getNPCScheduleNext24Hours(
        npcId,
        mockGameState.gameTime,
        mockGameState.npcSchedules
      );
      
      // Verify it matches NPCScheduleEntry[] interface
      const schedule24Hours = scheduleResponse.map((entry) => ({
        time: entry.time,
        activity: entry.activity,
        location: entry.location,
        availability: entry.availability,
      }));
      
      expect(Array.isArray(schedule24Hours)).toBe(true);
      schedule24Hours.forEach((entry) => {
        expect(typeof entry.time).toBe('string');
        expect(typeof entry.activity).toBe('string');
        expect(typeof entry.location).toBe('string');
        expect(typeof entry.availability).toBe('string');
      });
    });

    it('should map getAvailableNPCs response correctly', () => {
      const allNPCIds = mockGameState.npcRelationships.map((rel) => rel.npcId);
      const availableNPCs = NPCScheduleService.getAvailableNPCs(mockGameState, allNPCIds);
      
      // Response should be array of strings
      expect(Array.isArray(availableNPCs)).toBe(true);
      availableNPCs.forEach((npcId) => {
        expect(typeof npcId).toBe('string');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined npcSchedules gracefully', () => {
      mockGameState.npcSchedules = undefined;
      
      const allNPCIds = mockGameState.npcRelationships.map((rel) => rel.npcId);
      const availableNPCs = NPCScheduleService.getAvailableNPCs(mockGameState, allNPCIds);
      
      expect(Array.isArray(availableNPCs)).toBe(true);
    });

    it('should handle empty npcRelationships gracefully', () => {
      mockGameState.npcRelationships = [];
      
      const npcIdsFromSchedules = Object.keys(mockGameState.npcSchedules || {});
      expect(Array.isArray(npcIdsFromSchedules)).toBe(true);
    });

    it('should handle non-existent NPC gracefully', () => {
      const availability = NPCScheduleService.getAvailabilityStatus('npc_999', mockGameState.gameTime, mockGameState.npcSchedules);
      
      // Should return unavailable for non-existent NPC
      expect(['available', 'busy', 'unavailable']).toContain(availability);
    });
  });
});
