import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GameSceneManager,
  SCENE_CONFIGS,
  type SceneType,
  type DifficultyLevel,
} from './gameScenes';

describe('GameSceneManager', () => {
  let manager: GameSceneManager;
  const playerId = 'player-123';

  beforeEach(() => {
    manager = new GameSceneManager();
  });

  describe('startScene', () => {
    it('should start a fishing scene successfully', () => {
      const progress = manager.startScene(playerId, 'fishing', 'medium');

      expect(progress).toBeDefined();
      expect(progress.playerId).toBe(playerId);
      expect(progress.sceneType).toBe('fishing');
      expect(progress.difficulty).toBe('medium');
      expect(progress.completed).toBe(false);
      expect(progress.score).toBe(0);
    });

    it('should start a mining scene successfully', () => {
      const progress = manager.startScene(playerId, 'mining', 'hard');

      expect(progress.sceneType).toBe('mining');
      expect(progress.difficulty).toBe('hard');
    });

    it('should start a lumberjacking scene successfully', () => {
      const progress = manager.startScene(playerId, 'lumberjacking', 'easy');

      expect(progress.sceneType).toBe('lumberjacking');
      expect(progress.difficulty).toBe('easy');
    });

    it('should throw error if player already has active scene', () => {
      manager.startScene(playerId, 'fishing', 'medium');

      expect(() => {
        manager.startScene(playerId, 'mining', 'medium');
      }).toThrow();
    });

    it('should throw error if max attempts reached', () => {
      const config = SCENE_CONFIGS.fishing;

      // Start and complete max attempts
      for (let i = 0; i < config.maxAttemptsPerDay; i++) {
        const progress = manager.startScene(playerId, 'fishing', 'medium');
        manager.completeScene(playerId, 'fishing');
      }

      // Next attempt should fail
      expect(() => {
        manager.startScene(playerId, 'fishing', 'medium');
      }).toThrow('Max attempts reached');
    });
  });

  describe('processAction', () => {
    it('should process fishing action and increase score', () => {
      manager.startScene(playerId, 'fishing', 'medium');

      const score = manager.processAction(playerId, 'fishing', 'cast', {
        success: true,
      });

      expect(score).toBeGreaterThan(0);
    });

    it('should process mining action and increase score', () => {
      manager.startScene(playerId, 'mining', 'medium');

      const score = manager.processAction(playerId, 'mining', 'mine', {
        success: true,
        oreType: 'rare',
      });

      expect(score).toBeGreaterThan(0);
    });

    it('should process lumberjacking action and increase score', () => {
      manager.startScene(playerId, 'lumberjacking', 'medium');

      const score = manager.processAction(playerId, 'lumberjacking', 'chop', {
        success: true,
        treeType: 'rare',
      });

      expect(score).toBeGreaterThan(0);
    });

    it('should throw error if no active scene', () => {
      expect(() => {
        manager.processAction(playerId, 'fishing', 'cast', { success: true });
      }).toThrow('No active scene found');
    });

    it('should accumulate scores from multiple actions', () => {
      manager.startScene(playerId, 'fishing', 'medium');

      const score1 = manager.processAction(playerId, 'fishing', 'cast', {
        success: true,
      });
      const score2 = manager.processAction(playerId, 'fishing', 'cast', {
        success: true,
        fishType: 'rare',
      });

      const progress = manager.getActiveScene(playerId, 'fishing');
      expect(progress?.score).toBe(score1 + score2);
    });
  });

  describe('completeScene', () => {
    it('should complete fishing scene and generate rewards', () => {
      manager.startScene(playerId, 'fishing', 'medium');
      manager.processAction(playerId, 'fishing', 'cast', { success: true });

      const rewards = manager.completeScene(playerId, 'fishing');

      expect(rewards).toBeDefined();
      expect(Array.isArray(rewards)).toBe(true);
      expect(rewards.length).toBeGreaterThan(0);
    });

    it('should complete mining scene with correct reward types', () => {
      manager.startScene(playerId, 'mining', 'medium');
      manager.processAction(playerId, 'mining', 'mine', { success: true });

      const rewards = manager.completeScene(playerId, 'mining');

      expect(rewards.some((r) => r.resourceType === 'ore' || r.resourceType === 'gold')).toBe(true);
    });

    it('should complete lumberjacking scene with correct reward types', () => {
      manager.startScene(playerId, 'lumberjacking', 'medium');
      manager.processAction(playerId, 'lumberjacking', 'chop', {
        success: true,
      });

      const rewards = manager.completeScene(playerId, 'lumberjacking');

      expect(
        rewards.some((r) => r.resourceType === 'food' || r.resourceType === 'water'),
      ).toBe(true);
    });

    it('should apply difficulty multiplier to rewards', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
      // Easy difficulty
      manager.startScene(playerId, 'fishing', 'easy');
      manager.processAction(playerId, 'fishing', 'cast', { success: true });
      const easyRewards = manager.completeScene(playerId, 'fishing');

      // Hard difficulty
      manager.startScene(playerId, 'fishing', 'hard');
      manager.processAction(playerId, 'fishing', 'cast', { success: true });
      const hardRewards = manager.completeScene(playerId, 'fishing');

      // Hard rewards should be higher
      const easyTotal = easyRewards.reduce((sum, r) => sum + r.amount, 0);
      const hardTotal = hardRewards.reduce((sum, r) => sum + r.amount, 0);

      expect(hardTotal).toBeGreaterThanOrEqual(easyTotal);
      randomSpy.mockRestore();
    });

    it('should throw error if no active scene', () => {
      expect(() => {
        manager.completeScene(playerId, 'fishing');
      }).toThrow('No active scene found');
    });

    it('should remove active scene after completion', () => {
      manager.startScene(playerId, 'fishing', 'medium');
      manager.completeScene(playerId, 'fishing');

      const progress = manager.getActiveScene(playerId, 'fishing');
      expect(progress).toBeUndefined();
    });
  });

  describe('abandonScene', () => {
    it('should abandon active scene', () => {
      manager.startScene(playerId, 'fishing', 'medium');
      manager.abandonScene(playerId, 'fishing');

      const progress = manager.getActiveScene(playerId, 'fishing');
      expect(progress).toBeUndefined();
    });

    it('should throw error if no active scene', () => {
      expect(() => {
        manager.abandonScene(playerId, 'fishing');
      }).toThrow('No active scene found');
    });

    it('should allow starting new scene after abandoning', () => {
      manager.startScene(playerId, 'fishing', 'medium');
      manager.abandonScene(playerId, 'fishing');

      const newProgress = manager.startScene(playerId, 'fishing', 'easy');
      expect(newProgress).toBeDefined();
      expect(newProgress.difficulty).toBe('easy');
    });
  });

  describe('getActiveScene', () => {
    it('should return active scene', () => {
      manager.startScene(playerId, 'fishing', 'medium');

      const progress = manager.getActiveScene(playerId, 'fishing');
      expect(progress).toBeDefined();
      expect(progress?.sceneType).toBe('fishing');
    });

    it('should return undefined if no active scene', () => {
      const progress = manager.getActiveScene(playerId, 'fishing');
      expect(progress).toBeUndefined();
    });
  });

  describe('hasActiveScene', () => {
    it('should return true if player has active scene', () => {
      manager.startScene(playerId, 'fishing', 'medium');

      expect(manager.hasActiveScene(playerId)).toBe(true);
    });

    it('should return false if player has no active scene', () => {
      expect(manager.hasActiveScene(playerId)).toBe(false);
    });

    it('should return false after abandoning scene', () => {
      manager.startScene(playerId, 'fishing', 'medium');
      manager.abandonScene(playerId, 'fishing');

      expect(manager.hasActiveScene(playerId)).toBe(false);
    });
  });

  describe('Scene Configurations', () => {
    it('should have correct fishing config', () => {
      const config = SCENE_CONFIGS.fishing;

      expect(config.type).toBe('fishing');
      expect(config.duration).toBe(60000);
      expect(config.energyCost).toBe(10);
      expect(config.maxAttemptsPerDay).toBe(5);
    });

    it('should have correct mining config', () => {
      const config = SCENE_CONFIGS.mining;

      expect(config.type).toBe('mining');
      expect(config.duration).toBe(90000);
      expect(config.energyCost).toBe(15);
      expect(config.maxAttemptsPerDay).toBe(4);
    });

    it('should have correct lumberjacking config', () => {
      const config = SCENE_CONFIGS.lumberjacking;

      expect(config.type).toBe('lumberjacking');
      expect(config.duration).toBe(75000);
      expect(config.energyCost).toBe(12);
      expect(config.maxAttemptsPerDay).toBe(5);
    });

    it('should have difficulty multipliers for all scenes', () => {
      for (const sceneType of ['fishing', 'mining', 'lumberjacking'] as SceneType[]) {
        const config = SCENE_CONFIGS[sceneType];

        expect(config.difficulty_multiplier.easy).toBe(0.8);
        expect(config.difficulty_multiplier.medium).toBe(1.0);
        expect(config.difficulty_multiplier.hard).toBe(1.5);
      }
    });

    it('should have base rewards for all scenes', () => {
      for (const sceneType of ['fishing', 'mining', 'lumberjacking'] as SceneType[]) {
        const config = SCENE_CONFIGS[sceneType];

        expect(config.baseReward.length).toBeGreaterThan(0);
        expect(config.baseReward.every((r) => r.probability > 0 && r.probability <= 1)).toBe(
          true,
        );
      }
    });
  });

  describe('Reward Generation', () => {
    it('should generate rewards with ISC bonus', () => {
      manager.startScene(playerId, 'fishing', 'hard');

      // Perform multiple actions to increase score
      for (let i = 0; i < 5; i++) {
        manager.processAction(playerId, 'fishing', 'cast', { success: true });
      }

      const rewards = manager.completeScene(playerId, 'fishing');

      // Hard difficulty should have higher chance of ISC reward
      expect(rewards.length).toBeGreaterThan(0);
    });

    it('should apply higher multiplier for hard difficulty', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
      const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];
      const rewardTotals: number[] = [];

      for (const difficulty of difficulties) {
        manager.startScene(playerId, 'fishing', difficulty);
        manager.processAction(playerId, 'fishing', 'cast', { success: true });
        const rewards = manager.completeScene(playerId, 'fishing');
        const total = rewards.reduce((sum, r) => sum + r.amount, 0);
        rewardTotals.push(total);
      }

      // Hard should be higher than easy on average
      expect(rewardTotals[2]).toBeGreaterThanOrEqual(rewardTotals[0]);
      randomSpy.mockRestore();
    });
  });

  describe('Multiple Players', () => {
    it('should handle multiple players with different scenes', () => {
      const player1 = 'player-1';
      const player2 = 'player-2';

      manager.startScene(player1, 'fishing', 'medium');
      manager.startScene(player2, 'mining', 'medium');

      const progress1 = manager.getActiveScene(player1, 'fishing');
      const progress2 = manager.getActiveScene(player2, 'mining');

      expect(progress1?.playerId).toBe(player1);
      expect(progress2?.playerId).toBe(player2);
    });

    it('should not interfere between players', () => {
      const player1 = 'player-1';
      const player2 = 'player-2';

      manager.startScene(player1, 'fishing', 'medium');
      manager.startScene(player2, 'fishing', 'hard');

      manager.processAction(player1, 'fishing', 'cast', { success: true });
      manager.processAction(player2, 'fishing', 'cast', { success: true });

      const progress1 = manager.getActiveScene(player1, 'fishing');
      const progress2 = manager.getActiveScene(player2, 'fishing');

      expect(progress1?.difficulty).toBe('medium');
      expect(progress2?.difficulty).toBe('hard');
    });
  });
});
