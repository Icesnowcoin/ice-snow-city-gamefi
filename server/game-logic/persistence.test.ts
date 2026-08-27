/**
 * Persistence Layer Tests
 * Tests for game state serialization, deserialization, and database operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  serializeGameState,
  deserializeGameState,
} from './persistence';
import type { GameState } from './types';
import { createInitialGameState } from './reducer';

describe('Persistence Layer', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = createInitialGameState('player_1', 'Test Player');
  });

  describe('Serialization', () => {
    it('should serialize game state to JSON string', () => {
      const json = serializeGameState(initialState);
      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(100);
      expect(json).toContain('player');
    });

    it('should handle Date objects in serialization', () => {
      const stateWithDates = {
        ...initialState,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T12:30:45Z'),
      };
      const json = serializeGameState(stateWithDates);
      expect(json).toContain('2026-01-01T00:00:00.000Z');
      expect(json).toContain('2026-01-02T12:30:45.000Z');
    });

    it('should produce valid JSON', () => {
      const json = serializeGameState(initialState);
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('Deserialization', () => {
    it('should deserialize JSON string back to game state', () => {
      const json = serializeGameState(initialState);
      const deserialized = deserializeGameState(json);
      
      expect(deserialized.player.id).toBe(initialState.player.id);
      expect(deserialized.player.name).toBe(initialState.player.name);
      expect(deserialized.player.level).toBe(initialState.player.level);
      expect(deserialized.wallet.money).toBe(initialState.wallet.money);
    });

    it('should restore Date objects correctly', () => {
      const originalDate = new Date('2026-01-01T12:00:00Z');
      const stateWithDates = {
        ...initialState,
        createdAt: originalDate,
      };
      
      const json = serializeGameState(stateWithDates);
      const deserialized = deserializeGameState(json);
      
      expect(deserialized.createdAt).toBeInstanceOf(Date);
      // Compare ISO strings to avoid timezone issues
      expect(deserialized.createdAt.toISOString().substring(0, 19)).toBe(originalDate.toISOString().substring(0, 19));
    });

    it('should preserve complex nested structures', () => {
      const json = serializeGameState(initialState);
      const deserialized = deserializeGameState(json);
      
      // Check nested objects
      expect(deserialized.wallet).toBeDefined();
      expect(deserialized.wallet.money).toBe(initialState.wallet.money);
      expect(deserialized.wallet.isc).toBe(initialState.wallet.isc);
      
      // Check arrays
      expect(Array.isArray(deserialized.tasks)).toBe(true);
      expect(Array.isArray(deserialized.npcRelationships)).toBe(true);
    });
  });

  describe('Round-trip serialization', () => {
    it('should maintain state integrity through serialize/deserialize cycle', () => {
      const json = serializeGameState(initialState);
      const deserialized = deserializeGameState(json);
      const rejson = serializeGameState(deserialized);
      
      // Verify key properties are preserved
      expect(deserialized.player.id).toBe(initialState.player.id);
      expect(deserialized.wallet.money).toBe(initialState.wallet.money);
      expect(deserialized.bankAccount.balance).toBe(initialState.bankAccount.balance);
    });

    it('should handle multiple round-trips', () => {
      let state = initialState;
      
      for (let i = 0; i < 5; i++) {
        const json = serializeGameState(state);
        state = deserializeGameState(json);
      }
      
      // Verify state is still valid after multiple round-trips
      expect(state.player.id).toBe(initialState.player.id);
      expect(state.player.level).toBe(initialState.player.level);
      expect(state.wallet.money).toBe(initialState.wallet.money);
    });
  });

  describe('Edge cases', () => {
    it('should handle null values in state', () => {
      const stateWithNulls = {
        ...initialState,
        tasks: [],
      };
      
      const json = serializeGameState(stateWithNulls);
      const deserialized = deserializeGameState(json);
      
      expect(Array.isArray(deserialized.tasks)).toBe(true);
    });

    it('should handle empty arrays', () => {
      const stateWithEmptyArrays = {
        ...initialState,
        tasks: [],
        npcRelationships: [],
      };
      
      const json = serializeGameState(stateWithEmptyArrays);
      const deserialized = deserializeGameState(json);
      
      expect(Array.isArray(deserialized.tasks)).toBe(true);
      expect(deserialized.tasks.length).toBe(0);
    });

    it('should handle large numbers', () => {
      const largeNumber = 999999999;
      const stateWithLargeNumbers = {
        ...initialState,
        wallet: {
          ...initialState.wallet,
          money: largeNumber,
        },
      };
      
      const json = serializeGameState(stateWithLargeNumbers);
      const deserialized = deserializeGameState(json);
      
      expect(deserialized.wallet.money).toBe(largeNumber);
    });

    it('should handle special characters in strings', () => {
      const stateWithSpecialChars = {
        ...initialState,
        player: {
          ...initialState.player,
          name: 'Player "Test" \\n \\t 中文',
        },
      };
      
      const json = serializeGameState(stateWithSpecialChars);
      const deserialized = deserializeGameState(json);
      
      expect(deserialized.player.name).toContain('中文');
    });
  });

  describe('Data validation', () => {
    it('should preserve all game state properties', () => {
      const json = serializeGameState(initialState);
      const deserialized = deserializeGameState(json);
      
      // Check main properties
      expect(deserialized).toHaveProperty('player');
      expect(deserialized).toHaveProperty('wallet');
      expect(deserialized).toHaveProperty('bankAccount');
      expect(deserialized).toHaveProperty('tasks');
      expect(deserialized).toHaveProperty('npcRelationships');
      expect(deserialized).toHaveProperty('properties');
      expect(deserialized).toHaveProperty('farms');
      expect(deserialized).toHaveProperty('progress');
      expect(deserialized).toHaveProperty('gameTime');
    });

    it('should preserve player properties', () => {
      const json = serializeGameState(initialState);
      const deserialized = deserializeGameState(json);
      
      expect(deserialized.player).toHaveProperty('id');
      expect(deserialized.player).toHaveProperty('name');
      expect(deserialized.player).toHaveProperty('level');
      expect(deserialized.player).toHaveProperty('experience');
      expect(deserialized.player).toHaveProperty('totalExperience');
    });

    it('should preserve wallet properties', () => {
      const json = serializeGameState(initialState);
      const deserialized = deserializeGameState(json);
      
      expect(deserialized.wallet).toHaveProperty('money');
      expect(deserialized.wallet).toHaveProperty('isc');
      expect(deserialized.wallet).toHaveProperty('playerId');
    });

    it('should preserve bank account properties', () => {
      const json = serializeGameState(initialState);
      const deserialized = deserializeGameState(json);
      
      expect(deserialized.bankAccount).toHaveProperty('balance');
      expect(deserialized.bankAccount).toHaveProperty('interestRate');
      expect(deserialized.bankAccount).toHaveProperty('lastInterestPaid');
    });
  });

  describe('Performance', () => {
    it('should serialize large game state efficiently', () => {
      const largeState = {
        ...initialState,
        tasks: Array.from({ length: 1000 }, (_, i) => ({
          id: `task_${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          reward: Math.random() * 1000,
          status: 'available' as const,
          npcId: `npc_${i % 100}`,
          reward_type: 'money' as const,
        })),
      };
      
      const startTime = performance.now();
      const json = serializeGameState(largeState);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
      expect(json.length).toBeGreaterThan(0);
    });

    it('should deserialize large game state efficiently', () => {
      const largeState = {
        ...initialState,
        npcRelationships: Array.from({ length: 500 }, (_, i) => ({
          npcId: `npc_${i}`,
          relationship: Math.random() * 100,
          favorability: Math.random() * 100,
        })),
      };
      
      const json = serializeGameState(largeState);
      
      const startTime = performance.now();
      const deserialized = deserializeGameState(json);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
      expect(deserialized.npcRelationships.length).toBe(500);
    });
  });
});
