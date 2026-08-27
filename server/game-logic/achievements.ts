/**
 * Achievement System
 * Manages player achievements and unlocks
 */

import { GameState, PlayerProgress } from "./types";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: "progress" | "wealth" | "social" | "farming" | "property" | "special";
  unlockCondition: (state: GameState, progress: PlayerProgress) => boolean;
  reward?: {
    money?: number;
    isc?: number;
    experience?: number;
  };
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  // Progress achievements
  level_5: {
    id: "level_5",
    name: "新手村民",
    description: "达到等级 5",
    category: "progress",
    unlockCondition: (state) => state.player.level >= 5,
    reward: { experience: 100 },
  },
  level_10: {
    id: "level_10",
    name: "城市居民",
    description: "达到等级 10",
    category: "progress",
    unlockCondition: (state) => state.player.level >= 10,
    reward: { experience: 500 },
  },
  level_20: {
    id: "level_20",
    name: "城市精英",
    description: "达到等级 20",
    category: "progress",
    unlockCondition: (state) => state.player.level >= 20,
    reward: { experience: 2000 },
  },

  // Wealth achievements
  first_1000: {
    id: "first_1000",
    name: "初步积累",
    description: "积累 1000 ISC",
    category: "wealth",
    unlockCondition: (state) => state.wallet.isc >= 1000,
    reward: { isc: 100 },
  },
  first_10000: {
    id: "first_10000",
    name: "小有成就",
    description: "积累 10000 ISC",
    category: "wealth",
    unlockCondition: (state) => state.wallet.isc >= 10000,
    reward: { isc: 500 },
  },
  first_100000: {
    id: "first_100000",
    name: "富甲一方",
    description: "积累 100000 ISC",
    category: "wealth",
    unlockCondition: (state) => state.wallet.isc >= 100000,
    reward: { isc: 5000 },
  },

  // Social achievements
  first_friend: {
    id: "first_friend",
    name: "社交新手",
    description: "与 1 个 NPC 建立友谊",
    category: "social",
    unlockCondition: (state, progress) => progress.npcsFriended >= 1,
    reward: { experience: 100 },
  },
  five_friends: {
    id: "five_friends",
    name: "人气王",
    description: "与 5 个 NPC 建立友谊",
    category: "social",
    unlockCondition: (state, progress) => progress.npcsFriended >= 5,
    reward: { experience: 500 },
  },

  // Farming achievements
  first_farm: {
    id: "first_farm",
    name: "农场主",
    description: "创建第一个农场",
    category: "farming",
    unlockCondition: (state, progress) => progress.farmsCreated >= 1,
    reward: { experience: 200 },
  },
  five_farms: {
    id: "five_farms",
    name: "农业大亨",
    description: "创建 5 个农场",
    category: "farming",
    unlockCondition: (state, progress) => progress.farmsCreated >= 5,
    reward: { experience: 1000 },
  },

  // Property achievements
  first_property: {
    id: "first_property",
    name: "地产新手",
    description: "购买第一处房产",
    category: "property",
    unlockCondition: (state, progress) => progress.propertiesOwned >= 1,
    reward: { experience: 300 },
  },
  five_properties: {
    id: "five_properties",
    name: "地产大亨",
    description: "拥有 5 处房产",
    category: "property",
    unlockCondition: (state, progress) => progress.propertiesOwned >= 5,
    reward: { experience: 2000 },
  },

  // Task achievements
  first_task: {
    id: "first_task",
    name: "任务新手",
    description: "完成第一个任务",
    category: "progress",
    unlockCondition: (state, progress) => progress.tasksCompleted >= 1,
    reward: { experience: 50 },
  },
  ten_tasks: {
    id: "ten_tasks",
    name: "任务高手",
    description: "完成 10 个任务",
    category: "progress",
    unlockCondition: (state, progress) => progress.tasksCompleted >= 10,
    reward: { experience: 500 },
  },
  fifty_tasks: {
    id: "fifty_tasks",
    name: "任务大师",
    description: "完成 50 个任务",
    category: "progress",
    unlockCondition: (state, progress) => progress.tasksCompleted >= 50,
    reward: { experience: 5000 },
  },
};

export class AchievementService {
  /**
   * Get all achievements
   */
  static getAllAchievements(): Achievement[] {
    return Object.values(ACHIEVEMENTS);
  }

  /**
   * Get achievements by category
   */
  static getAchievementsByCategory(category: string): Achievement[] {
    return Object.values(ACHIEVEMENTS).filter((a) => a.category === category);
  }

  /**
   * Check if achievement is unlocked
   */
  static isAchievementUnlocked(
    achievementId: string,
    state: GameState,
    progress: PlayerProgress
  ): boolean {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return false;
    return achievement.unlockCondition(state, progress);
  }

  /**
   * Get all unlocked achievements
   */
  static getUnlockedAchievements(
    state: GameState,
    progress: PlayerProgress
  ): Achievement[] {
    return Object.values(ACHIEVEMENTS).filter((a) =>
      a.unlockCondition(state, progress)
    );
  }

  /**
   * Get newly unlocked achievements (not in progress.achievements)
   */
  static getNewlyUnlockedAchievements(
    state: GameState,
    progress: PlayerProgress
  ): Achievement[] {
    const unlocked = this.getUnlockedAchievements(state, progress);
    return unlocked.filter((a) => !progress.achievements.includes(a.id));
  }

  /**
   * Calculate total achievement reward
   */
  static calculateTotalReward(
    state: GameState,
    progress: PlayerProgress
  ): { money: number; isc: number; experience: number } {
    const unlocked = this.getUnlockedAchievements(state, progress);
    return unlocked.reduce(
      (total, achievement) => ({
        money: total.money + (achievement.reward?.money || 0),
        isc: total.isc + (achievement.reward?.isc || 0),
        experience: total.experience + (achievement.reward?.experience || 0),
      }),
      { money: 0, isc: 0, experience: 0 }
    );
  }

  /**
   * Get achievement progress (percentage to unlock)
   */
  static getAchievementProgress(
    achievementId: string,
    state: GameState,
    progress: PlayerProgress
  ): number {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return 0;

    // Check if already unlocked
    if (achievement.unlockCondition(state, progress)) return 100;

    // Estimate progress based on condition
    if (achievementId.includes("level")) {
      const targetLevel = parseInt(achievementId.split("_")[1]);
      return Math.min(100, Math.round((state.player.level / targetLevel) * 100));
    }

    if (achievementId.includes("friend")) {
      const targetFriends = achievementId === "first_friend" ? 1 : 5;
      return Math.min(100, Math.round((progress.npcsFriended / targetFriends) * 100));
    }

    if (achievementId.includes("farm")) {
      const targetFarms = achievementId === "first_farm" ? 1 : 5;
      return Math.min(100, Math.round((progress.farmsCreated / targetFarms) * 100));
    }

    if (achievementId.includes("propert")) {
      const targetProperties = achievementId === "first_property" ? 1 : 5;
      return Math.min(100, Math.round((progress.propertiesOwned / targetProperties) * 100));
    }

    if (achievementId.includes("task")) {
      const targetTasks =
        achievementId === "first_task" ? 1 : achievementId === "ten_tasks" ? 10 : 50;
      return Math.min(100, Math.round((progress.tasksCompleted / targetTasks) * 100));
    }

    return 0;
  }
}
