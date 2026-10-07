import { describe, it, expect, beforeEach } from 'vitest';
import AchievementSystem from './achievementSystem';

describe('Achievement System', () => {
  let achievements: AchievementSystem;

  beforeEach(() => {
    achievements = new AchievementSystem();
  });

  describe('Achievement Management', () => {
    it('should register achievement', () => {
      const achievement = achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
        'common',
        false,
      );

      expect(achievement.name).toBe('First Trade');
      expect(achievement.category).toBe('trading');
    });

    it('should get achievement', () => {
      const registered = achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );

      const retrieved = achievements.getAchievement(registered.achievementId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('First Trade');
    });

    it('should get all achievements', () => {
      achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );
      achievements.registerAchievement(
        'Millionaire',
        'Accumulate 1 million ISC',
        '💰',
        'wealth',
        1000000,
        1000,
      );

      const all = achievements.getAllAchievements();
      expect(all.length).toBe(2);
    });

    it('should get achievements by category', () => {
      achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );
      achievements.registerAchievement(
        'Millionaire',
        'Accumulate 1 million ISC',
        '💰',
        'wealth',
        1000000,
        1000,
      );

      const trading = achievements.getAchievementsByCategory('trading');
      expect(trading.length).toBe(1);
      expect(trading[0].category).toBe('trading');
    });
  });

  describe('Achievement Unlocking', () => {
    it('should unlock achievement', () => {
      const achievement = achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );

      const unlocked = achievements.unlockAchievement('player1', achievement.achievementId);
      expect(unlocked).toBe(true);
    });

    it('should not unlock same achievement twice', () => {
      const achievement = achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );

      achievements.unlockAchievement('player1', achievement.achievementId);
      const unlocked2 = achievements.unlockAchievement('player1', achievement.achievementId);
      expect(unlocked2).toBe(false);
    });

    it('should get player achievements', () => {
      const achievement = achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );

      achievements.unlockAchievement('player1', achievement.achievementId);
      const playerAchievements = achievements.getPlayerAchievements('player1');
      expect(playerAchievements.length).toBe(1);
    });

    it('should check if player has achievement', () => {
      const achievement = achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );

      achievements.unlockAchievement('player1', achievement.achievementId);
      const has = achievements.hasAchievement('player1', achievement.achievementId);
      expect(has).toBe(true);
    });
  });

  describe('Leaderboards', () => {
    it('should create leaderboard', () => {
      const leaderboard = achievements.createLeaderboard('Wealth Leaderboard', 'wealth');
      expect(leaderboard.name).toBe('Wealth Leaderboard');
      expect(leaderboard.type).toBe('wealth');
    });

    it('should update leaderboard entry', () => {
      const leaderboard = achievements.createLeaderboard('Wealth Leaderboard', 'wealth');
      achievements.updateLeaderboardEntry(leaderboard.leaderboardId, 'player1', 'Alice', 10000);

      const entries = achievements.getLeaderboardEntries(leaderboard.leaderboardId);
      expect(entries.length).toBe(1);
      expect(entries[0].playerName).toBe('Alice');
      expect(entries[0].score).toBe(10000);
    });

    it('should sort leaderboard by score', () => {
      const leaderboard = achievements.createLeaderboard('Wealth Leaderboard', 'wealth');
      achievements.updateLeaderboardEntry(leaderboard.leaderboardId, 'player1', 'Alice', 10000);
      achievements.updateLeaderboardEntry(leaderboard.leaderboardId, 'player2', 'Bob', 20000);
      achievements.updateLeaderboardEntry(leaderboard.leaderboardId, 'player3', 'Charlie', 15000);

      const entries = achievements.getLeaderboardEntries(leaderboard.leaderboardId);
      expect(entries[0].playerName).toBe('Bob');
      expect(entries[1].playerName).toBe('Charlie');
      expect(entries[2].playerName).toBe('Alice');
    });

    it('should get player rank', () => {
      const leaderboard = achievements.createLeaderboard('Wealth Leaderboard', 'wealth');
      achievements.updateLeaderboardEntry(leaderboard.leaderboardId, 'player1', 'Alice', 10000);
      achievements.updateLeaderboardEntry(leaderboard.leaderboardId, 'player2', 'Bob', 20000);

      const rank = achievements.getPlayerRank(leaderboard.leaderboardId, 'player1');
      expect(rank).toBe(2);
    });
  });

  describe('Player Statistics', () => {
    it('should update player activity', () => {
      achievements.updatePlayerActivity('player1', 'wealth', 10000);
      const stats = achievements.getPlayerStats('player1');
      expect(stats?.totalWealth).toBe(10000);
    });

    it('should get stat leaderboard', () => {
      achievements.updatePlayerActivity('player1', 'wealth', 10000);
      achievements.updatePlayerActivity('player2', 'wealth', 20000);

      const leaderboard = achievements.getStatLeaderboard('totalWealth', 10);
      expect(leaderboard.length).toBe(2);
      expect(leaderboard[0].playerId).toBe('player2');
      expect(leaderboard[0].value).toBe(20000);
    });
  });

  describe('Achievement Completion', () => {
    it('should calculate achievement completion rate', () => {
      achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );
      achievements.registerAchievement(
        'Millionaire',
        'Accumulate 1 million ISC',
        '💰',
        'wealth',
        1000000,
        1000,
      );

      const achievement1 = achievements.getAllAchievements()[0];
      achievements.unlockAchievement('player1', achievement1.achievementId);

      const rate = achievements.getAchievementCompletionRate('player1');
      expect(rate).toBe(50);
    });

    it('should get achievement unlock stats', () => {
      const achievement1 = achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );
      const achievement2 = achievements.registerAchievement(
        'Millionaire',
        'Accumulate 1 million ISC',
        '💰',
        'wealth',
        1000000,
        1000,
      );

      achievements.unlockAchievement('player1', achievement1.achievementId);
      achievements.unlockAchievement('player2', achievement1.achievementId);
      achievements.unlockAchievement('player2', achievement2.achievementId);

      const stats = achievements.getAchievementUnlockStats();
      expect(stats.length).toBe(2);
      expect(stats[0].unlockedCount).toBe(2);
    });
  });

  describe('Rarity System', () => {
    it('should get rare achievements', () => {
      achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
        'common',
      );
      achievements.registerAchievement(
        'Legendary Trader',
        'Complete 1000 trades',
        '👑',
        'trading',
        1000,
        10000,
        'legendary',
      );

      const legendary = achievements.getRareAchievements('legendary');
      expect(legendary.length).toBe(1);
      expect(legendary[0].name).toBe('Legendary Trader');
    });
  });

  describe('Cleanup', () => {
    it('should clear all data', () => {
      const achievement = achievements.registerAchievement(
        'First Trade',
        'Complete your first trade',
        '🎉',
        'trading',
        1,
        100,
      );

      achievements.unlockAchievement('player1', achievement.achievementId);
      const leaderboard = achievements.createLeaderboard('Wealth Leaderboard', 'wealth');
      achievements.updateLeaderboardEntry(leaderboard.leaderboardId, 'player1', 'Alice', 10000);

      achievements.clear();

      expect(achievements.getAllAchievements().length).toBe(0);
      expect(achievements.getPlayerAchievements('player1').length).toBe(0);
      expect(achievements.getAllLeaderboards().length).toBe(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should update achievement progress', () => {
      const achievement = achievements.registerAchievement(
        'Trader',
        'Complete trades',
        '🎉',
        'trading',
        100,
        100,
      );

      achievements.unlockAchievement('player1', achievement.achievementId);
      achievements.updateAchievementProgress('player1', achievement.achievementId, 50);
      const playerAchievements = achievements.getPlayerAchievements('player1');
      expect(playerAchievements[0]?.progress).toBe(50);
    });
  });
});
