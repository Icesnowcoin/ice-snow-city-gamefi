/**
 * Upgrade System - Players can upgrade buildings, skills, and equipment
 */

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: 'building' | 'skill' | 'equipment' | 'facility';
  cost: number; // ISC cost
  requirements: {
    level?: number;
    previousUpgrade?: string;
    items?: { itemId: string; quantity: number }[];
  };
  benefits: {
    productionBonus?: number; // Percentage increase
    speedBonus?: number; // Percentage increase
    capacityBonus?: number; // Percentage increase
    incomeBonus?: number; // Percentage increase
    experienceBonus?: number; // Percentage increase
  };
  duration: number; // milliseconds to complete upgrade
  icon?: string;
}

export interface UpgradeProgress {
  upgradeId: string;
  startTime: number;
  endTime: number;
  completed: boolean;
  targetId?: string; // Building or facility ID being upgraded
}

// Available upgrades
export const AVAILABLE_UPGRADES: Record<string, Upgrade> = {
  // Building upgrades
  FARM_EXPANSION: {
    id: 'farm_expansion',
    name: '农场扩张',
    description: '扩大农场面积，增加产量',
    category: 'building',
    cost: 500,
    requirements: {
      level: 5,
    },
    benefits: {
      productionBonus: 30,
      capacityBonus: 50,
    },
    duration: 3600000, // 1 hour
    icon: '🌾',
  },

  SHOP_UPGRADE: {
    id: 'shop_upgrade',
    name: '商店升级',
    description: '升级商店，增加商品种类和销售量',
    category: 'building',
    cost: 400,
    requirements: {
      level: 3,
    },
    benefits: {
      incomeBonus: 25,
      capacityBonus: 40,
    },
    duration: 3600000,
    icon: '🏪',
  },

  HOUSE_RENOVATION: {
    id: 'house_renovation',
    name: '房屋装修',
    description: '装修房屋，提升舒适度和幸福度',
    category: 'building',
    cost: 300,
    requirements: {
      level: 2,
    },
    benefits: {},
    duration: 1800000, // 30 minutes
    icon: '🏠',
  },

  // Skill upgrades
  FARMING_MASTERY: {
    id: 'farming_mastery',
    name: '农业精通',
    description: '提升农业技能，增加农作物产量',
    category: 'skill',
    cost: 200,
    requirements: {
      level: 3,
    },
    benefits: {
      productionBonus: 20,
      experienceBonus: 15,
    },
    duration: 1800000,
    icon: '🌱',
  },

  TRADING_EXPERTISE: {
    id: 'trading_expertise',
    name: '交易专长',
    description: '提升交易技能，增加收益',
    category: 'skill',
    cost: 250,
    requirements: {
      level: 4,
    },
    benefits: {
      incomeBonus: 20,
      experienceBonus: 10,
    },
    duration: 1800000,
    icon: '💰',
  },

  // Equipment upgrades
  BETTER_TOOLS: {
    id: 'better_tools',
    name: '更好的工具',
    description: '获得更好的工具，工作效率提升',
    category: 'equipment',
    cost: 150,
    requirements: {
      level: 2,
    },
    benefits: {
      speedBonus: 25,
      productionBonus: 15,
    },
    duration: 900000, // 15 minutes
    icon: '🔧',
  },

  ADVANCED_EQUIPMENT: {
    id: 'advanced_equipment',
    name: '高级装备',
    description: '使用高级装备，显著提升工作效率',
    category: 'equipment',
    cost: 350,
    requirements: {
      level: 6,
      previousUpgrade: 'better_tools',
    },
    benefits: {
      speedBonus: 40,
      productionBonus: 30,
    },
    duration: 1800000,
    icon: '⚙️',
  },

  // Facility upgrades
  STORAGE_EXPANSION: {
    id: 'storage_expansion',
    name: '仓库扩张',
    description: '扩大仓库容量',
    category: 'facility',
    cost: 200,
    requirements: {
      level: 3,
    },
    benefits: {
      capacityBonus: 50,
    },
    duration: 1200000, // 20 minutes
    icon: '📦',
  },

  BANK_UPGRADE: {
    id: 'bank_upgrade',
    name: '银行升级',
    description: '升级银行设施，提升利息收益',
    category: 'facility',
    cost: 600,
    requirements: {
      level: 8,
    },
    benefits: {
      incomeBonus: 30,
    },
    duration: 3600000,
    icon: '🏦',
  },
};

export class UpgradeSystem {
  /**
   * Get available upgrades for a player
   */
  static getAvailableUpgrades(playerLevel: number, completedUpgrades: string[] = []): Upgrade[] {
    return Object.values(AVAILABLE_UPGRADES).filter(upgrade => {
      // Check level requirement
      if (upgrade.requirements.level && upgrade.requirements.level > playerLevel) {
        return false;
      }

      // Check previous upgrade requirement
      if (upgrade.requirements.previousUpgrade && !completedUpgrades.includes(upgrade.requirements.previousUpgrade)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Start an upgrade
   */
  static startUpgrade(
    upgradeId: string,
    playerLevel: number,
    completedUpgrades: string[] = [],
    playerISC: number = 0
  ): { success: boolean; error?: string; progress?: UpgradeProgress } {
    const upgrade = AVAILABLE_UPGRADES[upgradeId];
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' };
    }

    // Check level requirement
    if (upgrade.requirements.level && upgrade.requirements.level > playerLevel) {
      return { success: false, error: `Required level: ${upgrade.requirements.level}` };
    }

    // Check previous upgrade requirement
    if (upgrade.requirements.previousUpgrade && !completedUpgrades.includes(upgrade.requirements.previousUpgrade)) {
      return { success: false, error: 'Previous upgrade required' };
    }

    // Check ISC cost
    if (playerISC < upgrade.cost) {
      return { success: false, error: `Insufficient ISC. Required: ${upgrade.cost}` };
    }

    const now = Date.now();
    const progress: UpgradeProgress = {
      upgradeId,
      startTime: now,
      endTime: now + upgrade.duration,
      completed: false,
    };

    return { success: true, progress };
  }

  /**
   * Complete an upgrade
   */
  static completeUpgrade(
    progress: UpgradeProgress
  ): { success: boolean; error?: string; benefits?: Upgrade['benefits'] } {
    if (progress.completed) {
      return { success: false, error: 'Upgrade already completed' };
    }

    const now = Date.now();
    if (now < progress.endTime) {
      const timeRemaining = Math.ceil((progress.endTime - now) / 1000);
      return { success: false, error: `Upgrade not finished. Time remaining: ${timeRemaining}s` };
    }

    const upgrade = AVAILABLE_UPGRADES[progress.upgradeId];
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' };
    }

    return { success: true, benefits: upgrade.benefits };
  }

  /**
   * Cancel an upgrade
   */
  static cancelUpgrade(progress: UpgradeProgress): { success: boolean; error?: string; refund?: number } {
    if (progress.completed) {
      return { success: false, error: 'Upgrade already completed' };
    }

    const upgrade = AVAILABLE_UPGRADES[progress.upgradeId];
    if (!upgrade) {
      return { success: false, error: 'Upgrade not found' };
    }

    // Refund 50% of the cost
    const refund = Math.floor(upgrade.cost * 0.5);
    return { success: true, refund };
  }

  /**
   * Get upgrade progress (0-100%)
   */
  static getUpgradeProgress(progress: UpgradeProgress): number {
    const now = Date.now();
    const total = progress.endTime - progress.startTime;
    const elapsed = Math.max(0, Math.min(now - progress.startTime, total));

    return Math.floor((elapsed / total) * 100);
  }

  /**
   * Get time remaining for upgrade (in seconds)
   */
  static getTimeRemaining(progress: UpgradeProgress): number {
    const now = Date.now();
    const remaining = Math.max(0, progress.endTime - now);

    return Math.ceil(remaining / 1000);
  }

  /**
   * Get upgrade by ID
   */
  static getUpgrade(upgradeId: string): Upgrade | undefined {
    return AVAILABLE_UPGRADES[upgradeId];
  }

  /**
   * Get all upgrades
   */
  static getAllUpgrades(): Upgrade[] {
    return Object.values(AVAILABLE_UPGRADES);
  }

  /**
   * Calculate total benefits from multiple upgrades
   */
  static calculateTotalBenefits(upgrades: Upgrade[]): Upgrade['benefits'] {
    const total: Upgrade['benefits'] = {};

    for (const upgrade of upgrades) {
      if (upgrade.benefits.productionBonus) {
        total.productionBonus = (total.productionBonus || 0) + upgrade.benefits.productionBonus;
      }
      if (upgrade.benefits.speedBonus) {
        total.speedBonus = (total.speedBonus || 0) + upgrade.benefits.speedBonus;
      }
      if (upgrade.benefits.capacityBonus) {
        total.capacityBonus = (total.capacityBonus || 0) + upgrade.benefits.capacityBonus;
      }
      if (upgrade.benefits.incomeBonus) {
        total.incomeBonus = (total.incomeBonus || 0) + upgrade.benefits.incomeBonus;
      }
      if (upgrade.benefits.experienceBonus) {
        total.experienceBonus = (total.experienceBonus || 0) + upgrade.benefits.experienceBonus;
      }
    }

    return total;
  }
}
