/**
 * 成就和排行榜系统
 * Phase 19: 成就和排行榜系统（遗留功能）
 */

export interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  category: 'wealth' | 'trading' | 'exploration' | 'social' | 'milestone';
  requirement: number;
  reward: number; // ISC 奖励
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isSecret: boolean;
}

export interface PlayerAchievement {
  playerId: string;
  achievementId: string;
  unlockedAt: number;
  progress: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
  lastUpdated: number;
}

export interface Leaderboard {
  leaderboardId: string;
  name: string;
  type: 'wealth' | 'trading' | 'exploration' | 'social' | 'overall';
  entries: LeaderboardEntry[];
  lastUpdated: number;
}

export interface PlayerStats {
  playerId: string;
  totalWealth: number;
  totalTrades: number;
  totalExplorations: number;
  totalSocialInteractions: number;
  totalAchievements: number;
  totalRewards: number;
  lastActivityAt: number;
}

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private playerAchievements: Map<string, PlayerAchievement[]> = new Map();
  private leaderboards: Map<string, Leaderboard> = new Map();
  private playerStats: Map<string, PlayerStats> = new Map();

  /**
   * 注册成就
   */
  registerAchievement(
    name: string,
    description: string,
    icon: string,
    category: Achievement['category'],
    requirement: number,
    reward: number,
    rarity: Achievement['rarity'] = 'common',
    isSecret: boolean = false,
  ): Achievement {
    const achievementId = `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const achievement: Achievement = {
      achievementId,
      name,
      description,
      icon,
      category,
      requirement,
      reward,
      rarity,
      isSecret,
    };

    this.achievements.set(achievementId, achievement);
    return achievement;
  }

  /**
   * 获取成就
   */
  getAchievement(achievementId: string): Achievement | undefined {
    return this.achievements.get(achievementId);
  }

  /**
   * 获取所有成就
   */
  getAllAchievements(includeSecret: boolean = false): Achievement[] {
    const achievements = Array.from(this.achievements.values());
    if (!includeSecret) {
      return achievements.filter((a) => !a.isSecret);
    }
    return achievements;
  }

  /**
   * 获取分类成就
   */
  getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return Array.from(this.achievements.values()).filter((a) => a.category === category);
  }

  /**
   * 解锁成就
   */
  unlockAchievement(playerId: string, achievementId: string): boolean {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      return false;
    }

    // 检查是否已解锁
    const playerAchievements = this.playerAchievements.get(playerId) || [];
    if (playerAchievements.some((a) => a.achievementId === achievementId)) {
      return false;
    }

    const playerAchievement: PlayerAchievement = {
      playerId,
      achievementId,
      unlockedAt: Date.now(),
      progress: 100,
    };

    if (!this.playerAchievements.has(playerId)) {
      this.playerAchievements.set(playerId, []);
    }

    this.playerAchievements.get(playerId)!.push(playerAchievement);

    // 更新玩家统计
    this.updatePlayerStats(playerId, 'achievement', achievement.reward);

    return true;
  }

  /**
   * 获取玩家成就
   */
  getPlayerAchievements(playerId: string): PlayerAchievement[] {
    return this.playerAchievements.get(playerId) || [];
  }

  /**
   * 获取玩家的成就数量
   */
  getPlayerAchievementCount(playerId: string): number {
    return this.getPlayerAchievements(playerId).length;
  }

  /**
   * 检查玩家是否解锁成就
   */
  hasAchievement(playerId: string, achievementId: string): boolean {
    const playerAchievements = this.playerAchievements.get(playerId) || [];
    return playerAchievements.some((a) => a.achievementId === achievementId);
  }

  /**
   * 更新成就进度
   */
  updateAchievementProgress(playerId: string, achievementId: string, progress: number): void {
    const playerAchievements = this.playerAchievements.get(playerId) || [];
    const achievement = playerAchievements.find((a) => a.achievementId === achievementId);

    if (achievement) {
      achievement.progress = Math.min(100, Math.max(0, progress));

      // 如果进度达到 100%，自动解锁
      if (achievement.progress === 100 && achievement.unlockedAt === 0) {
        achievement.unlockedAt = Date.now();
      }
    }
  }

  /**
   * 创建排行榜
   */
  createLeaderboard(name: string, type: Leaderboard['type']): Leaderboard {
    const leaderboardId = `leaderboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const leaderboard: Leaderboard = {
      leaderboardId,
      name,
      type,
      entries: [],
      lastUpdated: Date.now(),
    };

    this.leaderboards.set(leaderboardId, leaderboard);
    return leaderboard;
  }

  /**
   * 获取排行榜
   */
  getLeaderboard(leaderboardId: string): Leaderboard | undefined {
    return this.leaderboards.get(leaderboardId);
  }

  /**
   * 获取所有排行榜
   */
  getAllLeaderboards(): Leaderboard[] {
    return Array.from(this.leaderboards.values());
  }

  /**
   * 更新排行榜条目
   */
  updateLeaderboardEntry(
    leaderboardId: string,
    playerId: string,
    playerName: string,
    score: number,
  ): void {
    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) {
      return;
    }

    // 查找或创建条目
    let entry = leaderboard.entries.find((e) => e.playerId === playerId);
    if (!entry) {
      entry = {
        playerId,
        playerName,
        score,
        rank: 0,
        lastUpdated: Date.now(),
      };
      leaderboard.entries.push(entry);
    } else {
      entry.score = score;
      entry.playerName = playerName;
      entry.lastUpdated = Date.now();
    }

    // 重新排序和更新排名
    leaderboard.entries.sort((a, b) => b.score - a.score);
    leaderboard.entries.forEach((e, index) => {
      e.rank = index + 1;
    });

    leaderboard.lastUpdated = Date.now();
  }

  /**
   * 获取排行榜条目
   */
  getLeaderboardEntries(leaderboardId: string, limit: number = 100): LeaderboardEntry[] {
    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) {
      return [];
    }

    return leaderboard.entries.slice(0, limit);
  }

  /**
   * 获取玩家在排行榜中的排名
   */
  getPlayerRank(leaderboardId: string, playerId: string): number {
    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) {
      return -1;
    }

    const entry = leaderboard.entries.find((e) => e.playerId === playerId);
    return entry ? entry.rank : -1;
  }

  /**
   * 更新玩家统计
   */
  private updatePlayerStats(
    playerId: string,
    type: 'wealth' | 'trading' | 'exploration' | 'social' | 'achievement',
    value: number,
  ): void {
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {
        playerId,
        totalWealth: 0,
        totalTrades: 0,
        totalExplorations: 0,
        totalSocialInteractions: 0,
        totalAchievements: 0,
        totalRewards: 0,
        lastActivityAt: Date.now(),
      });
    }

    const stats = this.playerStats.get(playerId)!;

    switch (type) {
      case 'wealth':
        stats.totalWealth += value;
        break;
      case 'trading':
        stats.totalTrades += value;
        break;
      case 'exploration':
        stats.totalExplorations += value;
        break;
      case 'social':
        stats.totalSocialInteractions += value;
        break;
      case 'achievement':
        stats.totalAchievements++;
        stats.totalRewards += value;
        break;
    }

    stats.lastActivityAt = Date.now();
  }

  /**
   * 获取玩家统计
   */
  getPlayerStats(playerId: string): PlayerStats | undefined {
    return this.playerStats.get(playerId);
  }

  /**
   * 更新玩家活动
   */
  updatePlayerActivity(
    playerId: string,
    type: 'wealth' | 'trading' | 'exploration' | 'social',
    value: number,
  ): void {
    this.updatePlayerStats(playerId, type, value);
  }

  /**
   * 获取统计排行榜
   */
  getStatLeaderboard(
    stat: 'totalWealth' | 'totalTrades' | 'totalExplorations' | 'totalSocialInteractions',
    limit: number = 10,
  ): Array<{ playerId: string; value: number; rank: number }> {
    const stats = Array.from(this.playerStats.values());
    const sorted = stats
      .map((s) => ({
        playerId: s.playerId,
        value: s[stat],
        rank: 0,
      }))
      .sort((a, b) => b.value - a.value);

    sorted.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return sorted.slice(0, limit);
  }

  /**
   * 获取成就完成率
   */
  getAchievementCompletionRate(playerId: string): number {
    const totalAchievements = this.achievements.size;
    if (totalAchievements === 0) {
      return 0;
    }

    const playerAchievements = this.getPlayerAchievements(playerId).length;
    return Math.round((playerAchievements / totalAchievements) * 100 * 100) / 100;
  }

  /**
   * 获取稀有成就
   */
  getRareAchievements(rarity: Achievement['rarity']): Achievement[] {
    return Array.from(this.achievements.values()).filter((a) => a.rarity === rarity);
  }

  /**
   * 获取成就解锁统计
   */
  getAchievementUnlockStats(): {
    achievementId: string;
    name: string;
    unlockedCount: number;
    unlockedPercentage: number;
  }[] {
    const totalPlayers = this.playerStats.size;
    if (totalPlayers === 0) {
      return [];
    }

    return Array.from(this.achievements.values()).map((achievement) => {
      let unlockedCount = 0;

      this.playerAchievements.forEach((playerAchievements) => {
        if (playerAchievements.some((a) => a.achievementId === achievement.achievementId)) {
          unlockedCount++;
        }
      });

      return {
        achievementId: achievement.achievementId,
        name: achievement.name,
        unlockedCount,
        unlockedPercentage: Math.round((unlockedCount / totalPlayers) * 100 * 100) / 100,
      };
    });
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.achievements.clear();
    this.playerAchievements.clear();
    this.leaderboards.clear();
    this.playerStats.clear();
  }
}

export default AchievementSystem;
