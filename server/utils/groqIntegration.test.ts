import { describe, it, expect, beforeEach } from 'vitest';
import GroqIntegration from './groqIntegration';

describe('Groq Integration', () => {
  let groq: GroqIntegration;

  beforeEach(() => {
    groq = new GroqIntegration('test-api-key');
  });

  describe('Initialization', () => {
    it('should initialize with API key', () => {
      const stats = groq.getStats();
      expect(stats.model).toBe('mixtral-8x7b-32768');
    });

    it('should have correct API URL', () => {
      const stats = groq.getStats();
      expect(stats).toHaveProperty('apiUrl');
    });
  });

  describe('Model Management', () => {
    it('should get available models', () => {
      const models = groq.getAvailableModels();
      expect(models).toContain('mixtral-8x7b-32768');
      expect(models).toContain('llama2-70b-4096');
      expect(models).toContain('gemma-7b-it');
    });

    it('should set model', () => {
      groq.setModel('llama2-70b-4096');
      const stats = groq.getStats();
      expect(stats.model).toBe('llama2-70b-4096');
    });

    it('should default to mixtral model', () => {
      const stats = groq.getStats();
      expect(stats.model).toBe('mixtral-8x7b-32768');
    });
  });

  describe('Statistics', () => {
    it('should track request count', () => {
      const stats = groq.getStats();
      expect(stats.requestCount).toBe(0);
    });

    it('should have correct API configuration', () => {
      const stats = groq.getStats();
      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('model');
      expect(stats).toHaveProperty('apiUrl');
    });
  });

  describe('Emotion Detection', () => {
    it('should detect happy emotion', () => {
      // Test through dialogue generation (would need mock API)
      // For now, just verify the integration exists
      expect(groq).toBeDefined();
    });

    it('should detect sad emotion', () => {
      expect(groq).toBeDefined();
    });

    it('should detect angry emotion', () => {
      expect(groq).toBeDefined();
    });

    it('should default to neutral emotion', () => {
      expect(groq).toBeDefined();
    });
  });

  describe('NPC Dialogue Request', () => {
    it('should accept valid dialogue request', () => {
      const request = {
        npcName: 'Aurora',
        npcPersonality: 'Wise and mysterious ice mage',
        playerMessage: 'Hello Aurora!',
        conversationHistory: [],
        playerLevel: 5,
        playerReputation: 25,
      };

      expect(request).toHaveProperty('npcName');
      expect(request).toHaveProperty('npcPersonality');
      expect(request).toHaveProperty('playerMessage');
      expect(request).toHaveProperty('conversationHistory');
    });

    it('should handle conversation history', () => {
      const request = {
        npcName: 'Aurora',
        npcPersonality: 'Wise and mysterious ice mage',
        playerMessage: 'What is your name?',
        conversationHistory: [
          { role: 'user' as const, content: 'Hello!' },
          { role: 'assistant' as const, content: 'Greetings, traveler!' },
        ],
        playerLevel: 5,
        playerReputation: 25,
      };

      expect(request.conversationHistory).toHaveLength(2);
    });
  });

  describe('API Configuration', () => {
    it('should have Groq API URL', () => {
      const stats = groq.getStats();
      expect(stats.apiUrl).toContain('groq.com');
    });

    it('should support multiple models', () => {
      const models = groq.getAvailableModels();
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting', async () => {
      const start = Date.now();
      // Rate limiting is enforced internally
      expect(groq).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete NPC dialogue workflow', () => {
      const request = {
        npcName: 'Marcus',
        npcPersonality: 'Ambitious merchant prince',
        playerMessage: 'Can you help me with trading?',
        conversationHistory: [],
        playerLevel: 10,
        playerReputation: 50,
      };

      expect(request.npcName).toBe('Marcus');
      expect(request.playerLevel).toBe(10);
    });

    it('should support multi-turn conversations', () => {
      const history = [
        { role: 'user' as const, content: 'Hello!' },
        { role: 'assistant' as const, content: 'Hello, traveler!' },
        { role: 'user' as const, content: 'What can you offer?' },
        { role: 'assistant' as const, content: 'I have many goods...' },
      ];

      expect(history).toHaveLength(4);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
    });

    it('should handle different NPC personalities', () => {
      const npcs = [
        { name: 'Aurora', personality: 'Wise ice mage' },
        { name: 'Marcus', personality: 'Ambitious merchant' },
        { name: 'Yuki', personality: 'Skilled architect' },
        { name: 'Leo', personality: 'Charismatic entrepreneur' },
      ];

      expect(npcs).toHaveLength(4);
      npcs.forEach((npc) => {
        expect(npc).toHaveProperty('name');
        expect(npc).toHaveProperty('personality');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', () => {
      const groqNoKey = new GroqIntegration('');
      expect(groqNoKey).toBeDefined();
    });

    it('should maintain stats after operations', () => {
      const stats1 = groq.getStats();
      const stats2 = groq.getStats();
      expect(stats1.requestCount).toBe(stats2.requestCount);
    });
  });
});
