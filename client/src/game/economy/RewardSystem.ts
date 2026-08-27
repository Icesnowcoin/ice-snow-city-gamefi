/**
 * 奖励系统 - 处理任务完成后的奖励发放
 */

import { PlayerEconomySystem, CurrencyType, InventoryItem } from './PlayerEconomySystem';
import { Quest, QuestReward as IQuestReward } from '../quest/QuestLogManager';

type QuestReward = IQuestReward;

export interface RewardDistribution {
  questId: string;
  questTitle: string;
  npcId: string;
  npcName: string;
  rewards: QuestReward[];
  distributedAt: number;
  success: boolean;
  failureReason?: string;
}

export interface RewardMultiplier {
  currencyType: CurrencyType;
  multiplier: number; // 1.0 = 100%
  reason: string;
}

export class RewardSystem {
  private economySystem: PlayerEconomySystem;
  private rewardHistory: RewardDistribution[] = [];
  private multipliers: Map<CurrencyType, RewardMultiplier[]> = new Map();
  private maxHistorySize: number = 500;

  constructor(economySystem: PlayerEconomySystem) {
    this.economySystem = economySystem;
    this.initializeMultipliers();
  }

  /**
   * 初始化倍数系统
   */
  private initializeMultipliers(): void {
    const currencyTypes: CurrencyType[] = ['coin', 'experience', 'isc', 'energy', 'water'];
    for (const type of currencyTypes) {
      this.multipliers.set(type, []);
    }
  }

  /**
   * 分发任务奖励
   */
  distributeRewards(quest: Quest): RewardDistribution {
    const distribution: RewardDistribution = {
      questId: quest.id,
      questTitle: quest.title,
      npcId: quest.npcId,
      npcName: quest.npcName,
      rewards: quest.rewards,
      distributedAt: Date.now(),
      success: true,
    };

    try {
      // 处理每个奖励
      for (const reward of quest.rewards) {
        if (reward.type === 'coin' || reward.type === 'experience') {
          this.distributeCurrencyReward(reward.type as CurrencyType, reward.amount, quest);
        } else if (reward.type === 'item') {
          this.distributeItemReward(reward as any, quest);
        } else if (reward.type === 'reputation') {
          // 声誉系统可在后续扩展
          console.log(`Reputation reward: +${reward.amount}`);
        }
      }

      distribution.success = true;
    } catch (error) {
      distribution.success = false;
      distribution.failureReason = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to distribute rewards:', error);
    }

    // 记录到历史
    this.recordDistribution(distribution);

    return distribution;
  }

  /**
   * 分发货币奖励
   */
  private distributeCurrencyReward(currencyType: CurrencyType, amount: number, quest: Quest): void {
    // 应用倍数
    const multiplier = this.calculateMultiplier(currencyType);
    const finalAmount = Math.floor(amount * multiplier);

    // 添加货币
    const success = this.economySystem.addCurrency(
      currencyType,
      finalAmount,
      `Quest reward: ${quest.title}`,
      quest.id,
      quest.npcId
    );

    if (!success) {
      throw new Error(`Failed to add ${currencyType}`);
    }
  }

  /**
   * 分发物品奖励
   */
  private distributeItemReward(reward: any, quest: Quest): void {
    const item: InventoryItem = {
      id: reward.itemId || `item-${Date.now()}`,
      name: reward.itemName || 'Unknown Item',
      description: reward.itemDescription || '',
      quantity: reward.quantity || 1,
      rarity: reward.rarity || 'common',
      type: reward.itemType || 'material',
    };

    const success = this.economySystem.addItem(item, reward.quantity || 1);

    if (!success) {
      throw new Error(`Failed to add item ${item.name}`);
    }
  }

  /**
   * 计算货币倍数
   */
  private calculateMultiplier(currencyType: CurrencyType): number {
    const multipliers = this.multipliers.get(currencyType) || [];
    let totalMultiplier = 1.0;

    for (const m of multipliers) {
      totalMultiplier *= m.multiplier;
    }

    return Math.max(0.1, Math.min(5.0, totalMultiplier)); // 限制在 0.1 - 5.0 之间
  }

  /**
   * 添加奖励倍数
   */
  addMultiplier(currencyType: CurrencyType, multiplier: number, reason: string, durationMs?: number): void {
    const multipliers = this.multipliers.get(currencyType) || [];
    const m: RewardMultiplier = { currencyType, multiplier, reason };

    multipliers.push(m);
    this.multipliers.set(currencyType, multipliers);

    // 如果指定了持续时间，则在时间后移除
    if (durationMs) {
      setTimeout(() => {
        this.removeMultiplier(currencyType, reason);
      }, durationMs);
    }
  }

  /**
   * 移除奖励倍数
   */
  removeMultiplier(currencyType: CurrencyType, reason: string): void {
    const multipliers = this.multipliers.get(currencyType) || [];
    const filtered = multipliers.filter((m) => m.reason !== reason);
    this.multipliers.set(currencyType, filtered);
  }

  /**
   * 获取当前倍数
   */
  getCurrentMultipliers(): Record<CurrencyType, number> {
    const result: Record<CurrencyType, number> = {
      coin: 1.0,
      experience: 1.0,
      isc: 1.0,
      energy: 1.0,
      water: 1.0,
    };

    this.multipliers.forEach((_, type) => {
      result[type] = this.calculateMultiplier(type);
    });

    return result;
  }

  /**
   * 记录奖励分发
   */
  private recordDistribution(distribution: RewardDistribution): void {
    this.rewardHistory.push(distribution);

    // 限制历史大小
    if (this.rewardHistory.length > this.maxHistorySize) {
      this.rewardHistory = this.rewardHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 获取奖励历史
   */
  getRewardHistory(limit: number = 50): RewardDistribution[] {
    return this.rewardHistory.slice(-limit).reverse();
  }

  /**
   * 获取奖励统计
   */
  getRewardStatistics(): {
    totalQuestsCompleted: number;
    totalRewardsDistributed: Record<CurrencyType, number>;
    averageRewardPerQuest: Record<CurrencyType, number>;
    successRate: number;
  } {
    const totalQuestsCompleted = this.rewardHistory.length;
    const totalRewardsDistributed: Record<CurrencyType, number> = {
      coin: 0,
      experience: 0,
      isc: 0,
      energy: 0,
      water: 0,
    };

    let successCount = 0;

    for (const distribution of this.rewardHistory) {
      if (distribution.success) {
        successCount++;

      for (const reward of distribution.rewards) {
        if (reward.type === 'coin' || reward.type === 'experience') {
          const type = reward.type as CurrencyType;
          totalRewardsDistributed[type] += reward.amount;
        }
      }
      }
    }

    const averageRewardPerQuest: Record<CurrencyType, number> = {
      coin: totalQuestsCompleted > 0 ? totalRewardsDistributed.coin / totalQuestsCompleted : 0,
      experience: totalQuestsCompleted > 0 ? totalRewardsDistributed.experience / totalQuestsCompleted : 0,
      isc: totalQuestsCompleted > 0 ? totalRewardsDistributed.isc / totalQuestsCompleted : 0,
      energy: 0,
      water: 0,
    };

    const successRate = totalQuestsCompleted > 0 ? (successCount / totalQuestsCompleted) * 100 : 0;

    return {
      totalQuestsCompleted,
      totalRewardsDistributed,
      averageRewardPerQuest,
      successRate,
    };
  }

  /**
   * 验证奖励
   */
  validateRewards(rewards: QuestReward[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const reward of rewards) {
      if (!reward.type) {
        errors.push('Reward type is required');
      }

      if (reward.type === 'coin' || reward.type === 'experience') {
        if (typeof reward.amount !== 'number' || reward.amount <= 0) {
          errors.push(`Invalid amount for ${reward.type} reward`);
        }
      }

      if (reward.type === 'item') {
        const itemReward = reward as any;
        if (!itemReward.itemId || !itemReward.itemName) {
          errors.push('Item reward must have itemId and itemName');
        }
        if (typeof itemReward.quantity !== 'number' || itemReward.quantity <= 0) {
          errors.push('Item quantity must be positive');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 导出数据
   */
  export(): { history: RewardDistribution[]; multipliers: Record<CurrencyType, RewardMultiplier[]> } {
    const multipliers: Record<CurrencyType, RewardMultiplier[]> = {
      coin: [],
      experience: [],
      isc: [],
      energy: [],
      water: [],
    };

    this.multipliers.forEach((mults, type) => {
      multipliers[type] = mults;
    });

    return {
      history: this.rewardHistory,
      multipliers,
    };
  }

  /**
   * 导入数据
   */
  import(data: { history: RewardDistribution[]; multipliers: Record<CurrencyType, RewardMultiplier[]> }): void {
    this.rewardHistory = data.history;

    Object.entries(data.multipliers).forEach(([type, mults]) => {
      this.multipliers.set(type as CurrencyType, mults);
    });
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.rewardHistory = [];
    this.initializeMultipliers();
  }
}
