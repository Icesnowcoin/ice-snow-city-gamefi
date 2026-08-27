import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerEconomySystem } from './PlayerEconomySystem';
import { RewardSystem } from './RewardSystem';
import { Quest, QuestReward } from '../quest/QuestLogManager';

describe('RewardSystem', () => {
  let economySystem: PlayerEconomySystem;
  let rewardSystem: RewardSystem;

  beforeEach(() => {
    economySystem = new PlayerEconomySystem('test-player');
    rewardSystem = new RewardSystem(economySystem);
  });

  describe('distributeRewards', () => {
    it('should distribute coin rewards correctly', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: 'Farmer John',
        title: 'Harvest Wheat',
        description: 'Harvest 10 wheat',
        status: 'completed',
        objectives: [],
        rewards: [{ type: 'coin', amount: 100 }],
        acceptedTime: Date.now(),
        completedTime: Date.now(),
        progress: 100,
        difficulty: 'easy',
      };

      const initialBalance = economySystem.getBalance('coin');
      const distribution = rewardSystem.distributeRewards(quest);

      expect(distribution.success).toBe(true);
      expect(economySystem.getBalance('coin')).toBe(initialBalance + 100);
    });

    it('should distribute experience rewards correctly', () => {
      const quest: Quest = {
        id: 'quest-2',
        npcId: 'npc-1',
        npcName: 'Farmer John',
        title: 'Plant Seeds',
        description: 'Plant 5 seeds',
        status: 'completed',
        objectives: [],
        rewards: [{ type: 'experience', amount: 50 }],
        acceptedTime: Date.now(),
        completedTime: Date.now(),
        progress: 100,
        difficulty: 'normal',
      };

      const initialExp = economySystem.getBalance('experience');
      const distribution = rewardSystem.distributeRewards(quest);

      expect(distribution.success).toBe(true);
      expect(economySystem.getBalance('experience')).toBe(initialExp + 50);
    });

    it('should distribute multiple rewards', () => {
      const quest: Quest = {
        id: 'quest-3',
        npcId: 'npc-1',
        npcName: 'Farmer John',
        title: 'Complete Farm Tasks',
        description: 'Complete all farm tasks',
        status: 'completed',
        objectives: [],
        rewards: [
          { type: 'coin', amount: 200 },
          { type: 'experience', amount: 100 },
          { type: 'item', amount: 1, itemId: 'seed-1', itemName: 'Golden Seed' },
        ],
        acceptedTime: Date.now(),
        completedTime: Date.now(),
        progress: 100,
        difficulty: 'hard',
      };

      const initialCoin = economySystem.getBalance('coin');
      const initialExp = economySystem.getBalance('experience');

      const distribution = rewardSystem.distributeRewards(quest);

      expect(distribution.success).toBe(true);
      expect(economySystem.getBalance('coin')).toBe(initialCoin + 200);
      expect(economySystem.getBalance('experience')).toBe(initialExp + 100);
      expect(economySystem.getItem('seed-1')).toBeDefined();
    });
  });

  describe('Multipliers', () => {
    it('should apply multiplier to rewards', () => {
      rewardSystem.addMultiplier('coin', 1.5, 'bonus');

      const quest: Quest = {
        id: 'quest-4',
        npcId: 'npc-1',
        npcName: 'Farmer John',
        title: 'Bonus Quest',
        description: 'Bonus quest',
        status: 'completed',
        objectives: [],
        rewards: [{ type: 'coin', amount: 100 }],
        acceptedTime: Date.now(),
        completedTime: Date.now(),
        progress: 100,
        difficulty: 'easy',
      };

      const initialBalance = economySystem.getBalance('coin');
      rewardSystem.distributeRewards(quest);

      // 100 * 1.5 = 150
      expect(economySystem.getBalance('coin')).toBe(initialBalance + 150);
    });

    it('should remove multiplier after duration', (done) => {
      rewardSystem.addMultiplier('coin', 2.0, 'temporary', 100);

      setTimeout(() => {
        const multipliers = rewardSystem.getCurrentMultipliers();
        expect(multipliers.coin).toBe(1.0);
        done();
      }, 150);
    });
  });

  describe('Statistics', () => {
    it('should track reward statistics', () => {
      const quest1: Quest = {
        id: 'quest-5',
        npcId: 'npc-1',
        npcName: 'Farmer John',
        title: 'Quest 1',
        description: 'Quest 1',
        status: 'completed',
        objectives: [],
        rewards: [{ type: 'coin', amount: 100 }],
        acceptedTime: Date.now(),
        completedTime: Date.now(),
        progress: 100,
        difficulty: 'easy',
      };

      const quest2: Quest = {
        id: 'quest-6',
        npcId: 'npc-1',
        npcName: 'Farmer John',
        title: 'Quest 2',
        description: 'Quest 2',
        status: 'completed',
        objectives: [],
        rewards: [{ type: 'coin', amount: 50 }],
        acceptedTime: Date.now(),
        completedTime: Date.now(),
        progress: 100,
        difficulty: 'easy',
      };

      rewardSystem.distributeRewards(quest1);
      rewardSystem.distributeRewards(quest2);

      const stats = rewardSystem.getRewardStatistics();

      expect(stats.totalQuestsCompleted).toBe(2);
      expect(stats.totalRewardsDistributed.coin).toBe(150);
      expect(stats.averageRewardPerQuest.coin).toBe(75);
      expect(stats.successRate).toBe(100);
    });
  });

  describe('Validation', () => {
    it('should validate rewards correctly', () => {
      const validRewards: QuestReward[] = [
        { type: 'coin', amount: 100 },
        { type: 'experience', amount: 50 },
      ];

      const result = rewardSystem.validateRewards(validRewards);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid rewards', () => {
      const invalidRewards: QuestReward[] = [
        { type: 'coin', amount: -100 },
        { type: 'experience', amount: 0 },
      ];

      const result = rewardSystem.validateRewards(invalidRewards);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('History', () => {
    it('should maintain reward history', () => {
      const quest: Quest = {
        id: 'quest-7',
        npcId: 'npc-1',
        npcName: 'Farmer John',
        title: 'History Quest',
        description: 'History quest',
        status: 'completed',
        objectives: [],
        rewards: [{ type: 'coin', amount: 100 }],
        acceptedTime: Date.now(),
        completedTime: Date.now(),
        progress: 100,
        difficulty: 'easy',
      };

      rewardSystem.distributeRewards(quest);

      const history = rewardSystem.getRewardHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].questId).toBe('quest-7');
      expect(history[0].success).toBe(true);
    });
  });
});
