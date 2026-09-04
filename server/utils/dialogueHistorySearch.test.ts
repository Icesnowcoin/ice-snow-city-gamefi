import { describe, it, expect, beforeEach } from 'vitest';
import DialogueHistorySearch from './dialogueHistorySearch';

describe('Dialogue History Search', () => {
  let search: DialogueHistorySearch;

  beforeEach(() => {
    search = new DialogueHistorySearch();
  });

  describe('Session Management', () => {
    it('should add session', () => {
      const session = {
        sessionId: 'session1',
        npcName: 'Aurora',
        startTime: Date.now(),
        messages: [],
        totalDuration: 1000,
      };

      search.addSession('session1', session);
      const stats = search.getStatistics();
      expect(stats.totalSessions).toBe(1);
    });

    it('should delete session', () => {
      const session = {
        sessionId: 'session1',
        npcName: 'Aurora',
        startTime: Date.now(),
        messages: [],
        totalDuration: 1000,
      };

      search.addSession('session1', session);
      const deleted = search.deleteSession('session1');
      expect(deleted).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      const session = {
        sessionId: 'session1',
        npcName: 'Aurora',
        startTime: Date.now(),
        messages: [
          {
            id: 'msg1',
            type: 'text',
            sender: 'player',
            content: 'Hello Aurora',
            timestamp: Date.now(),
          },
          {
            id: 'msg2',
            type: 'text',
            sender: 'npc',
            content: 'Greetings, traveler',
            timestamp: Date.now() + 1000,
            emotion: 'happy',
          },
        ],
        totalDuration: 2000,
      };

      search.addSession('session1', session);
    });

    it('should search by query', () => {
      const results = search.search({ query: 'Hello' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by NPC name', () => {
      const results = search.search({ npcName: 'Aurora' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by message type', () => {
      const results = search.search({ messageType: 'text' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by emotion', () => {
      const results = search.search({ emotion: 'happy' });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Grouping', () => {
    beforeEach(() => {
      const session = {
        sessionId: 'session1',
        npcName: 'Aurora',
        startTime: Date.now(),
        messages: [
          {
            id: 'msg1',
            type: 'text',
            sender: 'player',
            content: 'Hello',
            timestamp: Date.now(),
          },
        ],
        totalDuration: 1000,
      };

      search.addSession('session1', session);
    });

    it('should group by NPC', () => {
      const results = search.search({});
      const grouped = search.groupByNPC(results);
      expect(grouped.has('Aurora')).toBe(true);
    });

    it('should group by date', () => {
      const results = search.search({});
      const grouped = search.groupByDate(results);
      expect(grouped.size).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics', () => {
      const stats = search.getStatistics();
      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('totalMessages');
      expect(stats).toHaveProperty('totalVoiceMessages');
      expect(stats).toHaveProperty('totalTextMessages');
      expect(stats).toHaveProperty('totalQuestHints');
      expect(stats).toHaveProperty('npcCount');
    });
  });

  describe('NPC Names', () => {
    it('should get NPC names', () => {
      const session = {
        sessionId: 'session1',
        npcName: 'Aurora',
        startTime: Date.now(),
        messages: [],
        totalDuration: 1000,
      };

      search.addSession('session1', session);
      const names = search.getNPCNames();
      expect(names).toContain('Aurora');
    });
  });

  describe('Emotions', () => {
    it('should get emotions', () => {
      const session = {
        sessionId: 'session1',
        npcName: 'Aurora',
        startTime: Date.now(),
        messages: [
          {
            id: 'msg1',
            type: 'text',
            sender: 'npc',
            content: 'Hello',
            timestamp: Date.now(),
            emotion: 'happy',
          },
        ],
        totalDuration: 1000,
      };

      search.addSession('session1', session);
      const emotions = search.getEmotions();
      expect(emotions).toContain('happy');
    });
  });

  describe('Clear', () => {
    it('should clear all data', () => {
      const session = {
        sessionId: 'session1',
        npcName: 'Aurora',
        startTime: Date.now(),
        messages: [],
        totalDuration: 1000,
      };

      search.addSession('session1', session);
      search.clear();
      const stats = search.getStatistics();
      expect(stats.totalSessions).toBe(0);
    });
  });
});
