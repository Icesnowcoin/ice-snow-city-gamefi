import { describe, it, expect, beforeEach } from 'vitest';
import DialogueExporter from './dialogueExport';
import { SearchResult } from './dialogueHistorySearch';

describe('Dialogue Export', () => {
  let exporter: DialogueExporter;
  let mockResults: SearchResult[];

  beforeEach(() => {
    exporter = new DialogueExporter();

    mockResults = [
      {
        sessionId: 'session1',
        npcName: 'Aurora',
        messageId: 'msg1',
        content: 'Hello, traveler!',
        timestamp: Date.now(),
        type: 'text',
        emotion: 'happy',
        questHint: 'Find the ancient temple',
        relevanceScore: 100,
      },
      {
        sessionId: 'session1',
        npcName: 'Aurora',
        messageId: 'msg2',
        content: 'Good luck on your journey',
        timestamp: Date.now() + 1000,
        type: 'voice',
        emotion: 'friendly',
        relevanceScore: 90,
      },
    ];
  });

  describe('Export Formats', () => {
    it('should export to JSON', () => {
      const json = exporter.exportToJSON(mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const parsed = JSON.parse(json);
      expect(parsed.recordCount).toBe(2);
      expect(parsed.records[0].content).toBe('Hello, traveler!');
    });

    it('should export to CSV', () => {
      const csv = exporter.exportToCSV(mockResults, {
        format: 'csv',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      expect(csv).toContain('Hello, traveler!');
      expect(csv).toContain('Aurora');
    });

    it('should export to Markdown', () => {
      const markdown = exporter.exportToMarkdown(mockResults, {
        format: 'markdown',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      expect(markdown).toContain('# Dialogue Export');
      expect(markdown).toContain('## Aurora');
      expect(markdown).toContain('Hello, traveler!');
    });

    it('should export to PDF (HTML)', () => {
      const html = exporter.exportToPDF(mockResults, {
        format: 'pdf',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Aurora');
      expect(html).toContain('Hello, traveler!');
    });
  });

  describe('Export Management', () => {
    it('should export dialogue', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      expect(exported.playerId).toBe('player1');
      expect(exported.recordCount).toBe(2);
      expect(exported.metadata.npcCount).toBe(1);
      expect(exported.metadata.messageCount).toBe(2);
      expect(exported.metadata.voiceMessageCount).toBe(1);
      expect(exported.metadata.textMessageCount).toBe(1);
      expect(exported.metadata.questHintCount).toBe(1);
    });

    it('should get player exports', () => {
      exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const exports = exporter.getPlayerExports('player1');
      expect(exports.length).toBe(1);
    });

    it('should delete export', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const deleted = exporter.deleteExport(exported.exportId, 'player1');
      expect(deleted).toBe(true);

      const exports = exporter.getPlayerExports('player1');
      expect(exports.length).toBe(0);
    });
  });

  describe('Share Management', () => {
    it('should create share', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const share = exporter.createShare('player1', exported.exportId, 7, true);
      expect(share).toBeDefined();
      expect(share?.isPublic).toBe(true);
      expect(share?.accessCount).toBe(0);
    });

    it('should get share', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const share = exporter.createShare('player1', exported.exportId, 7, true);
      if (!share) throw new Error('Share not created');

      const retrieved = exporter.getShare(share.shareId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.accessCount).toBe(1);
    });

    it('should get shared export', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const share = exporter.createShare('player1', exported.exportId, 7, true);
      if (!share) throw new Error('Share not created');

      const sharedExport = exporter.getSharedExport(share.shareId);
      expect(sharedExport).toBeDefined();
      expect(sharedExport?.recordCount).toBe(2);
    });

    it('should delete share', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const share = exporter.createShare('player1', exported.exportId, 7, true);
      if (!share) throw new Error('Share not created');

      const deleted = exporter.deleteShare(share.shareId, 'player1');
      expect(deleted).toBe(true);

      const retrieved = exporter.getShare(share.shareId);
      expect(retrieved).toBeNull();
    });

    it('should get player shares', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      exporter.createShare('player1', exported.exportId, 7, true);

      const shares = exporter.getPlayerShares('player1');
      expect(shares.length).toBe(1);
    });
  });

  describe('Share Expiration', () => {
    it('should handle expired shares', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const share = exporter.createShare('player1', exported.exportId, -1, true); // Expired
      if (!share) throw new Error('Share not created');

      const retrieved = exporter.getShare(share.shareId);
      expect(retrieved).toBeNull();
    });

    it('should cleanup expired shares', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      exporter.createShare('player1', exported.exportId, -1, true); // Expired

      const cleaned = exporter.cleanupExpiredShares();
      expect(cleaned).toBe(1);
    });
  });

  describe('CSV Escaping', () => {
    it('should escape CSV fields', () => {
      const resultsWithCommas: SearchResult[] = [
        {
          sessionId: 'session1',
          npcName: 'Aurora',
          messageId: 'msg1',
          content: 'Hello, "world"!',
          timestamp: Date.now(),
          type: 'text',
          emotion: 'happy',
          relevanceScore: 100,
        },
      ];

      const csv = exporter.exportToCSV(resultsWithCommas, {
        format: 'csv',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      expect(csv).toContain('"Hello, ""world""!"');
    });
  });

  describe('Cleanup', () => {
    it('should clear all data', () => {
      const exported = exporter.export('player1', mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      exporter.createShare('player1', exported.exportId, 7, true);
      exporter.clear();

      const exports = exporter.getPlayerExports('player1');
      const shares = exporter.getPlayerShares('player1');

      expect(exports.length).toBe(0);
      expect(shares.length).toBe(0);
    });
  });

  describe('Format Options', () => {
    it('should respect includeTimestamps option', () => {
      const json = exporter.exportToJSON(mockResults, {
        format: 'json',
        includeTimestamps: false,
        includeEmotions: true,
        includeQuestHints: true,
        includeAudio: false,
      });

      const parsed = JSON.parse(json);
      expect(parsed.records[0].timestamp).toBeUndefined();
    });

    it('should respect includeEmotions option', () => {
      const json = exporter.exportToJSON(mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: false,
        includeQuestHints: true,
        includeAudio: false,
      });

      const parsed = JSON.parse(json);
      expect(parsed.records[0].emotion).toBeUndefined();
    });

    it('should respect includeQuestHints option', () => {
      const json = exporter.exportToJSON(mockResults, {
        format: 'json',
        includeTimestamps: true,
        includeEmotions: true,
        includeQuestHints: false,
        includeAudio: false,
      });

      const parsed = JSON.parse(json);
      expect(parsed.records[0].questHint).toBeUndefined();
    });
  });
});
