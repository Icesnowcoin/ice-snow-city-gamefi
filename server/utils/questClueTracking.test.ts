import { describe, it, expect, beforeEach } from 'vitest';
import QuestClueTracker from './questClueTracking';

describe('Quest Clue Tracking', () => {
  let tracker: QuestClueTracker;

  beforeEach(() => {
    tracker = new QuestClueTracker();
  });

  describe('Clue Management', () => {
    it('should add clue', () => {
      const clue = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      };

      tracker.addClue(clue);
      const clues = tracker.getQuestClues('quest1');
      expect(clues.length).toBe(1);
      expect(clues[0].clueText).toBe('Look for the ancient temple');
    });

    it('should get specific clue', () => {
      const clue = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      };

      tracker.addClue(clue);
      const retrieved = tracker.getClue('clue1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.clueText).toBe('Look for the ancient temple');
    });

    it('should get clues by type', () => {
      const clue1 = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Location clue',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      };

      const clue2 = {
        id: 'clue2',
        questId: 'quest1',
        npcName: 'Marcus',
        clueText: 'Item clue',
        clueType: 'item' as const,
        discoveredAt: Date.now(),
        importance: 'medium' as const,
      };

      tracker.addClue(clue1);
      tracker.addClue(clue2);

      const locationClues = tracker.getCluesByType('quest1', 'location');
      expect(locationClues.length).toBe(1);
      expect(locationClues[0].clueType).toBe('location');
    });

    it('should get clues by importance', () => {
      const clue1 = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Critical clue',
        clueType: 'hint' as const,
        discoveredAt: Date.now(),
        importance: 'critical' as const,
      };

      const clue2 = {
        id: 'clue2',
        questId: 'quest1',
        npcName: 'Marcus',
        clueText: 'Low importance clue',
        clueType: 'hint' as const,
        discoveredAt: Date.now(),
        importance: 'low' as const,
      };

      tracker.addClue(clue1);
      tracker.addClue(clue2);

      const criticalClues = tracker.getCluesByImportance('quest1', 'critical');
      expect(criticalClues.length).toBe(1);
      expect(criticalClues[0].importance).toBe('critical');
    });
  });

  describe('Clue Discovery', () => {
    it('should discover clue', () => {
      const clue = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      };

      tracker.addClue(clue);
      const discovered = tracker.discoverClue('player1', 'quest1', 'clue1');
      expect(discovered).toBe(true);

      const progress = tracker.getProgress('player1', 'quest1');
      expect(progress?.cluesDiscovered).toContain('clue1');
    });

    it('should not discover same clue twice', () => {
      const clue = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      };

      tracker.addClue(clue);
      tracker.discoverClue('player1', 'quest1', 'clue1');
      const discovered2 = tracker.discoverClue('player1', 'quest1', 'clue1');
      expect(discovered2).toBe(false);
    });
  });

  describe('Hint Management', () => {
    it('should add hint', () => {
      const hint = {
        id: 'hint1',
        questId: 'quest1',
        hintText: 'Try looking in the north',
        hintLevel: 2,
        unlockedAt: Date.now(),
        usedCount: 0,
      };

      tracker.addHint(hint);
      const hints = tracker.getQuestHints('quest1');
      expect(hints.length).toBe(1);
    });

    it('should get available hints by level', () => {
      const hint1 = {
        id: 'hint1',
        questId: 'quest1',
        hintText: 'Vague hint',
        hintLevel: 1,
        unlockedAt: Date.now(),
        usedCount: 0,
      };

      const hint2 = {
        id: 'hint2',
        questId: 'quest1',
        hintText: 'Specific hint',
        hintLevel: 3,
        unlockedAt: Date.now(),
        usedCount: 0,
      };

      tracker.addHint(hint1);
      tracker.addHint(hint2);

      const availableHints = tracker.getAvailableHints('quest1', 2);
      expect(availableHints.length).toBe(1);
      expect(availableHints[0].hintLevel).toBe(1);
    });

    it('should use hint', () => {
      const hint = {
        id: 'hint1',
        questId: 'quest1',
        hintText: 'Try looking in the north',
        hintLevel: 2,
        unlockedAt: Date.now(),
        usedCount: 0,
      };

      tracker.addHint(hint);
      const used = tracker.useHint('player1', 'quest1', 'hint1');
      expect(used).toBe(true);

      const progress = tracker.getProgress('player1', 'quest1');
      expect(progress?.hintsUsed).toContain('hint1');
    });
  });

  describe('Quest Progress', () => {
    it('should track quest progress', () => {
      const clue = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      };

      tracker.addClue(clue);
      tracker.discoverClue('player1', 'quest1', 'clue1');

      const progress = tracker.getProgress('player1', 'quest1');
      expect(progress?.status).toBe('in_progress');
      expect(progress?.progressPercentage).toBe(100);
    });

    it('should complete quest', () => {
      tracker.addClue({
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      });

      tracker.discoverClue('player1', 'quest1', 'clue1');
      const completed = tracker.completeQuest('player1', 'quest1');
      expect(completed).toBe(true);

      const progress = tracker.getProgress('player1', 'quest1');
      expect(progress?.status).toBe('completed');
      expect(progress?.progressPercentage).toBe(100);
    });

    it('should abandon quest', () => {
      tracker.addClue({
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      });

      tracker.discoverClue('player1', 'quest1', 'clue1');
      const abandoned = tracker.abandonQuest('player1', 'quest1');
      expect(abandoned).toBe(true);

      const progress = tracker.getProgress('player1', 'quest1');
      expect(progress?.status).toBe('abandoned');
    });
  });

  describe('Related Information', () => {
    it('should get related NPCs', () => {
      const clue = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
        relatedNPCs: ['Marcus', 'Yuki'],
      };

      tracker.addClue(clue);
      const npcs = tracker.getRelatedNPCs('quest1');
      expect(npcs.has('Aurora')).toBe(true);
      expect(npcs.has('Marcus')).toBe(true);
      expect(npcs.has('Yuki')).toBe(true);
    });

    it('should get related items', () => {
      const clue = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Find the key',
        clueType: 'item' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
        relatedItems: ['ancient_key', 'map'],
      };

      tracker.addClue(clue);
      const items = tracker.getRelatedItems('quest1');
      expect(items.has('ancient_key')).toBe(true);
      expect(items.has('map')).toBe(true);
    });

    it('should get related locations', () => {
      const clue = {
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Go to the temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
        relatedLocations: ['ancient_temple', 'forest'],
      };

      tracker.addClue(clue);
      const locations = tracker.getRelatedLocations('quest1');
      expect(locations.has('ancient_temple')).toBe(true);
      expect(locations.has('forest')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should calculate quest statistics', () => {
      tracker.addClue({
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Location clue',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      });

      tracker.addHint({
        id: 'hint1',
        questId: 'quest1',
        hintText: 'Hint text',
        hintLevel: 2,
        unlockedAt: Date.now(),
        usedCount: 0,
      });

      const stats = tracker.getQuestStatistics('quest1');
      expect(stats.totalClues).toBe(1);
      expect(stats.totalHints).toBe(1);
      expect(stats.relatedNPCCount).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should clear all data', () => {
      tracker.addClue({
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      });

      tracker.clear();
      const clues = tracker.getQuestClues('quest1');
      expect(clues.length).toBe(0);
    });

    it('should delete quest', () => {
      tracker.addClue({
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      });

      const deleted = tracker.deleteQuest('quest1');
      expect(deleted).toBe(true);

      const clues = tracker.getQuestClues('quest1');
      expect(clues.length).toBe(0);
    });
  });

  describe('Player Quest Progress', () => {
    it('should get player quest progress', () => {
      tracker.addClue({
        id: 'clue1',
        questId: 'quest1',
        npcName: 'Aurora',
        clueText: 'Look for the ancient temple',
        clueType: 'location' as const,
        discoveredAt: Date.now(),
        importance: 'high' as const,
      });

      tracker.discoverClue('player1', 'quest1', 'clue1');
      const progress = tracker.getPlayerQuestProgress('player1');
      expect(progress.length).toBe(1);
      expect(progress[0].questId).toBe('quest1');
    });
  });
});
