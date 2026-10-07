/**
 * 成就系统管理器
 * 管理成就解锁、排行榜、通知等
 */

export type AchievementCategory = 
  | 'exploration'    // 探索
  | 'combat'         // 战斗
  | 'social'        // 社交
  | 'economy'       // 经济
  | 'farming'       // 农业
  | 'building'      // 建筑
  | 'collection'    // 收集
  | 'milestone';    // 里程碑

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  reward: {
    gold?: number;
    experience?: number;
    badge?: string;
  };
  condition: {
    type: string;
    target: number;
    [key: string]: any;
  };
  hidden: boolean;           // 隐藏成就
  createdAt: number;
}

export interface PlayerAchievement {
  achievementId: string;
  playerId: string;
  unlockedAt: number;
  progress: number;          // 进度 (0-100)
  completed: boolean;
}

export interface AchievementNotification {
  id: string;
  playerId: string;
  achievementId: string;
  achievementName: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface Leaderboard {
  type: 'wealth' | 'level' | 'achievement' | 'farming' | 'building';
  entries: LeaderboardEntry[];
  updatedAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  value: number;
  badge?: string;
}

export type AchievementEventType = 
  | 'achievementUnlocked'
  | 'achievementProgress'
  | 'badgeEarned'
  | 'leaderboardUpdated';

export interface AchievementEvent {
  type: AchievementEventType;
  playerId: string;
  timestamp: number;
  data: Record<string, any>;
}

type AchievementEventListener = (event: AchievementEvent) => void;

export class AchievementManager {
  private achievements: Map<string, Achievement> = new Map();
  private playerAchievements: Map<string, PlayerAchievement[]> = new Map();
  private notifications: Map<string, AchievementNotification[]> = new Map();
  private leaderboards: Map<string, Leaderboard> = new Map();
  private eventListeners: AchievementEventListener[] = [];

  constructor() {
    this.initializeAchievements();
    this.initializeLeaderboards();
  }

  /**
   * 初始化成就数据库
   */
  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // 探索成就
      {
        id: 'first_step',
        name: '迈出第一步',
        description: '完成新手教程',
        category: 'exploration',
        rarity: 'common',
        icon: '/icons/achievements/first-step.png',
        reward: { gold: 100, experience: 50 },
        condition: { type: 'tutorial_complete', target: 1 },
        hidden: false,
        createdAt: Date.now(),
      },
      {
        id: 'explorer',
        name: '探险家',
        description: '访问所有地区',
        category: 'exploration',
        rarity: 'rare',
        icon: '/icons/achievements/explorer.png',
        reward: { gold: 1000, experience: 500, badge: 'explorer' },
        condition: { type: 'regions_visited', target: 10 },
        hidden: false,
        createdAt: Date.now(),
      },
      // 战斗成就
      {
        id: 'first_victory',
        name: '首次胜利',
        description: '赢得第一场战斗',
        category: 'combat',
        rarity: 'common',
        icon: '/icons/achievements/first-victory.png',
        reward: { gold: 50, experience: 100 },
        condition: { type: 'battles_won', target: 1 },
        hidden: false,
        createdAt: Date.now(),
      },
      {
        id: 'warrior',
        name: '战士',
        description: '赢得 100 场战斗',
        category: 'combat',
        rarity: 'epic',
        icon: '/icons/achievements/warrior.png',
        reward: { gold: 5000, experience: 2000, badge: 'warrior' },
        condition: { type: 'battles_won', target: 100 },
        hidden: false,
        createdAt: Date.now(),
      },
      // 社交成就
      {
        id: 'socialite',
        name: '社交达人',
        description: '添加 50 个好友',
        category: 'social',
        rarity: 'uncommon',
        icon: '/icons/achievements/socialite.png',
        reward: { gold: 500, experience: 300 },
        condition: { type: 'friends_added', target: 50 },
        hidden: false,
        createdAt: Date.now(),
      },
      {
        id: 'guild_founder',
        name: '工会创始人',
        description: '创建一个工会',
        category: 'social',
        rarity: 'rare',
        icon: '/icons/achievements/guild-founder.png',
        reward: { gold: 1000, experience: 500, badge: 'guild_founder' },
        condition: { type: 'guilds_created', target: 1 },
        hidden: false,
        createdAt: Date.now(),
      },
      // 经济成就
      {
        id: 'wealthy',
        name: '富豪',
        description: '拥有 100,000 金币',
        category: 'economy',
        rarity: 'rare',
        icon: '/icons/achievements/wealthy.png',
        reward: { gold: 2000, experience: 1000 },
        condition: { type: 'gold_accumulated', target: 100000 },
        hidden: false,
        createdAt: Date.now(),
      },
      // 农业成就
      {
        id: 'farmer',
        name: '农民',
        description: '收获 100 次作物',
        category: 'farming',
        rarity: 'uncommon',
        icon: '/icons/achievements/farmer.png',
        reward: { gold: 500, experience: 400 },
        condition: { type: 'crops_harvested', target: 100 },
        hidden: false,
        createdAt: Date.now(),
      },
      // 建筑成就
      {
        id: 'builder',
        name: '建筑师',
        description: '建造 20 座建筑',
        category: 'building',
        rarity: 'uncommon',
        icon: '/icons/achievements/builder.png',
        reward: { gold: 800, experience: 600 },
        condition: { type: 'buildings_built', target: 20 },
        hidden: false,
        createdAt: Date.now(),
      },
      // 收集成就
      {
        id: 'collector',
        name: '收集家',
        description: '收集 50 种物品',
        category: 'collection',
        rarity: 'rare',
        icon: '/icons/achievements/collector.png',
        reward: { gold: 1500, experience: 800, badge: 'collector' },
        condition: { type: 'items_collected', target: 50 },
        hidden: false,
        createdAt: Date.now(),
      },
      // 里程碑成就
      {
        id: 'level_10',
        name: '十级成就',
        description: '达到 10 级',
        category: 'milestone',
        rarity: 'common',
        icon: '/icons/achievements/level-10.png',
        reward: { gold: 200, experience: 300 },
        condition: { type: 'level_reached', target: 10 },
        hidden: false,
        createdAt: Date.now(),
      },
      {
        id: 'level_50',
        name: '五十级成就',
        description: '达到 50 级',
        category: 'milestone',
        rarity: 'epic',
        icon: '/icons/achievements/level-50.png',
        reward: { gold: 5000, experience: 5000, badge: 'level_50' },
        condition: { type: 'level_reached', target: 50 },
        hidden: false,
        createdAt: Date.now(),
      },
    ];

    achievements.forEach((achievement) => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * 初始化排行榜
   */
  private initializeLeaderboards(): void {
    this.leaderboards.set('wealth', {
      type: 'wealth',
      entries: [],
      updatedAt: Date.now(),
    });
    this.leaderboards.set('level', {
      type: 'level',
      entries: [],
      updatedAt: Date.now(),
    });
    this.leaderboards.set('achievement', {
      type: 'achievement',
      entries: [],
      updatedAt: Date.now(),
    });
    this.leaderboards.set('farming', {
      type: 'farming',
      entries: [],
      updatedAt: Date.now(),
    });
    this.leaderboards.set('building', {
      type: 'building',
      entries: [],
      updatedAt: Date.now(),
    });
  }

  /**
   * 初始化玩家成就数据
   */
  initializePlayerAchievements(playerId: string): void {
    if (!this.playerAchievements.has(playerId)) {
      this.playerAchievements.set(playerId, []);
      this.notifications.set(playerId, []);
    }
  }

  /**
   * 更新成就进度
   */
  updateProgress(
    playerId: string,
    conditionType: string,
    value: number
  ): { unlockedAchievements: Achievement[]; progressUpdates: Achievement[] } {
    this.initializePlayerAchievements(playerId);

    const unlockedAchievements: Achievement[] = [];
    const progressUpdates: Achievement[] = [];

    this.achievements.forEach((achievement) => {
      if (achievement.condition.type !== conditionType) {
        return;
      }

      let playerAchievement = this.playerAchievements.get(playerId)?.find(
        (pa) => pa.achievementId === achievement.id
      );

      if (!playerAchievement) {
        playerAchievement = {
          achievementId: achievement.id,
          playerId,
          unlockedAt: 0,
          progress: 0,
          completed: false,
        };
        this.playerAchievements.get(playerId)?.push(playerAchievement);
      }

      if (!playerAchievement.completed) {
        // 更新进度
        playerAchievement.progress = Math.min(
          100,
          Math.floor((value / achievement.condition.target) * 100)
        );

        // 检查是否解锁
        if (value >= achievement.condition.target) {
          playerAchievement.completed = true;
          playerAchievement.unlockedAt = Date.now();
          unlockedAchievements.push(achievement);

          // 创建通知
          this.createNotification(playerId, achievement);

          // 触发事件
          this.emitEvent({
            type: 'achievementUnlocked',
            playerId,
            timestamp: Date.now(),
            data: { achievementId: achievement.id, achievementName: achievement.name },
          });
        } else {
          progressUpdates.push(achievement);

          // 触发进度事件
          this.emitEvent({
            type: 'achievementProgress',
            playerId,
            timestamp: Date.now(),
            data: {
              achievementId: achievement.id,
              progress: playerAchievement.progress,
            },
          });
        }
      }
    });

    return { unlockedAchievements, progressUpdates };
  }

  /**
   * 创建通知
   */
  private createNotification(playerId: string, achievement: Achievement): void {
    const notification: AchievementNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      achievementId: achievement.id,
      achievementName: achievement.name,
      message: `恭喜！你获得了成就：${achievement.name}`,
      timestamp: Date.now(),
      read: false,
    };

    const notifications = this.notifications.get(playerId);
    if (notifications) {
      notifications.push(notification);
    }
  }

  /**
   * 获取玩家成就列表
   */
  getPlayerAchievements(playerId: string): PlayerAchievement[] {
    return this.playerAchievements.get(playerId) || [];
  }

  /**
   * 获取玩家已解锁的成就
   */
  getUnlockedAchievements(playerId: string): Achievement[] {
    const playerAchievements = this.getPlayerAchievements(playerId);
    return playerAchievements
      .filter((pa) => pa.completed)
      .map((pa) => this.achievements.get(pa.achievementId))
      .filter((a) => a !== undefined) as Achievement[];
  }

  /**
   * 获取玩家成就进度
   */
  getAchievementProgress(playerId: string, achievementId: string): number {
    const playerAchievement = this.playerAchievements
      .get(playerId)
      ?.find((pa) => pa.achievementId === achievementId);
    return playerAchievement?.progress || 0;
  }

  /**
   * 获取玩家通知列表
   */
  getNotifications(playerId: string): AchievementNotification[] {
    return this.notifications.get(playerId) || [];
  }

  /**
   * 标记通知为已读
   */
  markNotificationAsRead(playerId: string, notificationId: string): boolean {
    const notifications = this.notifications.get(playerId);
    if (!notifications) {
      return false;
    }

    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }

    return false;
  }

  /**
   * 清空所有通知
   */
  clearNotifications(playerId: string): void {
    const notifications = this.notifications.get(playerId);
    if (notifications) {
      notifications.length = 0;
    }
  }

  /**
   * 更新排行榜
   */
  updateLeaderboard(
    type: 'wealth' | 'level' | 'achievement' | 'farming' | 'building',
    entries: LeaderboardEntry[]
  ): void {
    const leaderboard = this.leaderboards.get(type);
    if (leaderboard) {
      leaderboard.entries = entries.sort((a, b) => a.rank - b.rank);
      leaderboard.updatedAt = Date.now();

      this.emitEvent({
        type: 'leaderboardUpdated',
        playerId: '',
        timestamp: Date.now(),
        data: { leaderboardType: type, topEntries: entries.slice(0, 10) },
      });
    }
  }

  /**
   * 获取排行榜
   */
  getLeaderboard(type: 'wealth' | 'level' | 'achievement' | 'farming' | 'building'): Leaderboard | undefined {
    return this.leaderboards.get(type);
  }

  /**
   * 获取玩家在排行榜中的排名
   */
  getPlayerRank(
    type: 'wealth' | 'level' | 'achievement' | 'farming' | 'building',
    playerId: string
  ): number {
    const leaderboard = this.leaderboards.get(type);
    if (!leaderboard) {
      return -1;
    }

    const entry = leaderboard.entries.find((e) => e.playerId === playerId);
    return entry?.rank || -1;
  }

  /**
   * 获取所有成就
   */
  getAllAchievements(): Achievement[] {
    const achievements: Achievement[] = [];
    this.achievements.forEach((achievement) => {
      achievements.push(achievement);
    });
    return achievements;
  }

  /**
   * 按分类获取成就
   */
  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    const achievements: Achievement[] = [];
    this.achievements.forEach((achievement) => {
      if (achievement.category === category) {
        achievements.push(achievement);
      }
    });
    return achievements;
  }

  /**
   * 获取成就详情
   */
  getAchievement(achievementId: string): Achievement | undefined {
    return this.achievements.get(achievementId);
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: AchievementEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: AchievementEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: AchievementEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  /**
   * 获取玩家成就统计
   */
  getAchievementStats(playerId: string): {
    totalAchievements: number;
    unlockedCount: number;
    completionRate: number;
    badges: string[];
  } {
    const playerAchievements = this.getPlayerAchievements(playerId);
    const unlockedCount = playerAchievements.filter((pa) => pa.completed).length;
    const totalAchievements = this.achievements.size;
    const completionRate = Math.round((unlockedCount / totalAchievements) * 100);

    const badges: string[] = [];
    playerAchievements.forEach((pa) => {
      if (pa.completed) {
        const achievement = this.achievements.get(pa.achievementId);
        if (achievement?.reward.badge) {
          badges.push(achievement.reward.badge);
        }
      }
    });

    return {
      totalAchievements,
      unlockedCount,
      completionRate,
      badges,
    };
  }
}
