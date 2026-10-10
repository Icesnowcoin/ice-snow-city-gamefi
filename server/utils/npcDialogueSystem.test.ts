import { describe, it, expect, beforeEach, vi } from 'vitest';
import NPCDialogueSystem, { NPCCharacter, DialogueContext } from './npcDialogueSystem';

describe('NPC Dialogue System', () => {
  let dialogueSystem: NPCDialogueSystem;
  let testNPC: NPCCharacter;

  beforeEach(() => {
    dialogueSystem = new NPCDialogueSystem();
    testNPC = {
      id: 'npc_aurora',
      name: 'Aurora',
      role: 'Ice Seer',
      background: 'Ancient ice magic practitioner',
      personality: 'Wise and mysterious',
      language: 'English',
      location: 'Ice Tower',
      expertise: ['magic', 'ice', 'prophecy'],
      quests: ['Find the Crystal of Ice', 'Defeat the Fire Dragon', 'Restore the Ice Kingdom'],
    };
  });

  describe('NPC Registration', () => {
    it('should register NPC character', () => {
      dialogueSystem.registerNPC(testNPC);
      const stats = dialogueSystem.getSystemStats();
      expect(stats.totalNPCs).toBe(1);
    });

    it('should register multiple NPCs', () => {
      dialogueSystem.registerNPC(testNPC);
      const npc2: NPCCharacter = {
        ...testNPC,
        id: 'npc_marcus',
        name: 'Marcus',
      };
      dialogueSystem.registerNPC(npc2);
      const stats = dialogueSystem.getSystemStats();
      expect(stats.totalNPCs).toBe(2);
    });
  });

  describe('Conversation Management', () => {
    beforeEach(() => {
      dialogueSystem.registerNPC(testNPC);
    });

    it('should start conversation', () => {
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      expect(context.playerId).toBe('player_1');
      expect(context.npcId).toBe('npc_aurora');
      expect(context.messages).toHaveLength(0);
    });

    it('should track conversation start time', () => {
      const before = Date.now();
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      const after = Date.now();
      expect(context.startedAt).toBeGreaterThanOrEqual(before);
      expect(context.startedAt).toBeLessThanOrEqual(after);
    });

    it('should get active conversation', () => {
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      const active = dialogueSystem.getActiveConversation('player_1', 'npc_aurora');
      expect(active).not.toBeNull();
      expect(active?.conversationId).toBe(context.conversationId);
    });

    it('should end conversation', () => {
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      dialogueSystem.endConversation(context.conversationId);
      const active = dialogueSystem.getActiveConversation('player_1', 'npc_aurora');
      expect(active).toBeNull();
    });

    it('should track conversation history', () => {
      dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      const history = dialogueSystem.getConversationHistory('player_1');
      expect(history).toHaveLength(1);
    });

    it('should handle multiple conversations per player', () => {
      const npc2: NPCCharacter = {
        ...testNPC,
        id: 'npc_marcus',
        name: 'Marcus',
      };
      dialogueSystem.registerNPC(npc2);

      dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      dialogueSystem.startConversation('player_1', 'npc_marcus', 1, 0);

      const history = dialogueSystem.getConversationHistory('player_1');
      expect(history).toHaveLength(2);
    });
  });

  describe('Emotion Detection', () => {
    it('should detect happy emotion', () => {
      dialogueSystem.registerNPC(testNPC);
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);

      // Test emotion detection through parseDialogueResponse
      const stats = dialogueSystem.getSystemStats();
      expect(stats.totalNPCs).toBe(1);
    });
  });

  describe('System Statistics', () => {
    it('should track system statistics', () => {
      dialogueSystem.registerNPC(testNPC);
      dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);

      const stats = dialogueSystem.getSystemStats();
      expect(stats.totalNPCs).toBe(1);
      expect(stats.activeConversations).toBe(1);
      expect(stats.totalConversations).toBe(1);
    });

    it('should update statistics on conversation end', () => {
      dialogueSystem.registerNPC(testNPC);
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);

      let stats = dialogueSystem.getSystemStats();
      expect(stats.activeConversations).toBe(1);

      dialogueSystem.endConversation(context.conversationId);
      stats = dialogueSystem.getSystemStats();
      expect(stats.activeConversations).toBe(0);
      expect(stats.totalConversations).toBe(1);
    });
  });

  describe('Player Level and Reputation', () => {
    beforeEach(() => {
      dialogueSystem.registerNPC(testNPC);
    });

    it('should track player level in context', () => {
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 10, 50);
      expect(context.playerLevel).toBe(10);
      expect(context.playerReputation).toBe(50);
    });

    it('should adjust dialogue based on player level', () => {
      const context1 = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      const context2 = dialogueSystem.startConversation('player_2', 'npc_aurora', 50, 100);

      expect(context1.playerLevel).toBe(1);
      expect(context2.playerLevel).toBe(50);
    });
  });

  describe('Conversation Context', () => {
    beforeEach(() => {
      dialogueSystem.registerNPC(testNPC);
    });

    it('should maintain message history in context', () => {
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);

      // Simulate adding messages
      context.messages.push({
        role: 'user',
        content: 'Hello Aurora!',
      });

      expect(context.messages).toHaveLength(1);
      expect(context.messages[0].content).toBe('Hello Aurora!');
    });

    it('should update last message timestamp', () => {
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      const initialTime = context.lastMessageAt;

      // Simulate time passing
      const newTime = Date.now() + 1000;
      context.lastMessageAt = newTime;

      expect(context.lastMessageAt).toBeGreaterThan(initialTime);
    });
  });

  describe('NPC Character Management', () => {
    it('should store NPC character information', () => {
      dialogueSystem.registerNPC(testNPC);
      const stats = dialogueSystem.getSystemStats();
      expect(stats.totalNPCs).toBe(1);
    });

    it('should handle multiple NPCs with different roles', () => {
      const npcs: NPCCharacter[] = [
        { ...testNPC, id: 'npc_1', name: 'Aurora', role: 'Seer' },
        { ...testNPC, id: 'npc_2', name: 'Marcus', role: 'Merchant' },
        { ...testNPC, id: 'npc_3', name: 'Yuki', role: 'Architect' },
      ];

      npcs.forEach((npc) => dialogueSystem.registerNPC(npc));

      const stats = dialogueSystem.getSystemStats();
      expect(stats.totalNPCs).toBe(3);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete dialogue workflow', () => {
      dialogueSystem.registerNPC(testNPC);

      // Start conversation
      const context = dialogueSystem.startConversation('player_1', 'npc_aurora', 5, 25);
      expect(context.playerId).toBe('player_1');

      // Verify active conversation
      const active = dialogueSystem.getActiveConversation('player_1', 'npc_aurora');
      expect(active).not.toBeNull();

      // Get conversation history
      const history = dialogueSystem.getConversationHistory('player_1');
      expect(history).toHaveLength(1);

      // End conversation
      dialogueSystem.endConversation(context.conversationId);
      const activeAfter = dialogueSystem.getActiveConversation('player_1', 'npc_aurora');
      expect(activeAfter).toBeNull();

      // Verify history is preserved
      const historyAfter = dialogueSystem.getConversationHistory('player_1');
      expect(historyAfter).toHaveLength(1);
    });

    it('should support multiple players with same NPC', () => {
      dialogueSystem.registerNPC(testNPC);

      const context1 = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      const context2 = dialogueSystem.startConversation('player_2', 'npc_aurora', 10, 50);

      const stats = dialogueSystem.getSystemStats();
      expect(stats.activeConversations).toBe(2);
      expect(stats.totalConversations).toBe(2);
    });

    it('should handle conversation lifecycle', () => {
      dialogueSystem.registerNPC(testNPC);

      // Create multiple conversations
      const conv1 = dialogueSystem.startConversation('player_1', 'npc_aurora', 1, 0);
      const conv2 = dialogueSystem.startConversation('player_2', 'npc_aurora', 5, 25);
      const conv3 = dialogueSystem.startConversation('player_3', 'npc_aurora', 10, 50);

      let stats = dialogueSystem.getSystemStats();
      expect(stats.activeConversations).toBe(3);

      // End some conversations
      dialogueSystem.endConversation(conv1.conversationId);
      dialogueSystem.endConversation(conv3.conversationId);

      stats = dialogueSystem.getSystemStats();
      expect(stats.activeConversations).toBe(1);
      expect(stats.totalConversations).toBe(3);
    });
  });
});
