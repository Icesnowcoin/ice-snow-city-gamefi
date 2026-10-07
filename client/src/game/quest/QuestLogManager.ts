import { RewardSystem } from '../economy/RewardSystem';
import { PlayerEconomySystem } from '../economy/PlayerEconomySystem';

/**
 * 任务日志管理系统
 * 负责记录、追踪和管理从 NPC 处接取的任务进度及奖励信息
 */

export interface QuestReward {
  type: 'coin' | 'item' | 'experience' | 'reputation';
  amount: number;
  itemName?: string;
  itemId?: string;
}

export interface QuestObjective {
  id: string;
  description: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  npcId: string;
  npcName: string;
  title: string;
  description: string;
  status: 'accepted' | 'in_progress' | 'completed' | 'abandoned' | 'failed';
  objectives: QuestObjective[];
  rewards: QuestReward[];
  acceptedTime: number;
  completedTime?: number;
  progress: number; // 0-100
  difficulty: 'easy' | 'normal' | 'hard' | 'legendary';
  timeLimit?: number; // 毫秒，可选的时间限制
  remainingTime?: number; // 剩余时间
}

export interface QuestLogEntry {
  timestamp: number;
  questId: string;
  action: 'accepted' | 'objective_completed' | 'completed' | 'abandoned' | 'failed' | 'progress_updated';
  details: string;
  rewards?: QuestReward[];
}

export class QuestLogManager {
  private quests: Map<string, Quest> = new Map();
  private questLog: QuestLogEntry[] = [];
  private maxLogEntries: number = 1000;
  private updateCallbacks: ((quest: Quest) => void)[] = [];
  private rewardSystem: RewardSystem | null = null;
  private economySystem: PlayerEconomySystem | null = null;

  /**
   * 接取任务
   */
  acceptQuest(quest: Quest): void {
    quest.acceptedTime = Date.now();
    quest.status = quest.progress > 0 && quest.progress < 100 ? 'in_progress' : quest.status || 'accepted';
    this.quests.set(quest.id, quest);

    this.addLogEntry({
      timestamp: Date.now(),
      questId: quest.id,
      action: 'accepted',
      details: `接取任务: ${quest.title}`,
    });

    this.notifyUpdate(quest);
  }

  /**
   * 更新任务进度
   */
  updateQuestProgress(questId: string, objectiveId: string, increment: number): void {
    const quest = this.quests.get(questId);
    if (!quest) return;

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return;

    objective.currentCount = Math.min(objective.currentCount + increment, objective.targetCount);
    objective.completed = objective.currentCount >= objective.targetCount;

    // 计算总进度：若为单目标且进行到一半，直接反映 50% 进度
    const totalTarget = quest.objectives.reduce((sum, obj) => sum + Math.max(1, obj.targetCount), 0);
    const totalCurrent = quest.objectives.reduce((sum, obj) => sum + Math.min(obj.currentCount, obj.targetCount), 0);
    quest.progress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

    if (quest.status !== 'completed' && quest.status !== 'failed' && quest.status !== 'abandoned') {
      quest.status = objective.completed ? 'completed' : 'in_progress';
    }

    if (objective.completed) {
      this.addLogEntry({
        timestamp: Date.now(),
        questId: questId,
        action: 'objective_completed',
        details: `完成目标: ${objective.description}`,
      });
    } else {
      this.addLogEntry({
        timestamp: Date.now(),
        questId: questId,
        action: 'progress_updated',
        details: `进度更新: ${objective.description} (${objective.currentCount}/${objective.targetCount})`,
      });
    }

    this.notifyUpdate(quest);
  }

  /**
   * 完成任务
   */
  completeQuest(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest) return;

    quest.status = 'completed';
    quest.completedTime = Date.now();
    quest.progress = 100;

    this.addLogEntry({
      timestamp: Date.now(),
      questId: questId,
      action: 'completed',
      details: `完成任务: ${quest.title}`,
      rewards: quest.rewards,
    });

    // 发放奖励
    if (this.rewardSystem && this.economySystem) {
      try {
        this.rewardSystem.distributeRewards(quest);
      } catch (error) {
        console.error('Failed to distribute rewards:', error);
      }
    }

    this.notifyUpdate(quest);
  }

  /**
   * 放弃任务
   */
  abandonQuest(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest) return;

    quest.status = 'abandoned';

    this.addLogEntry({
      timestamp: Date.now(),
      questId: questId,
      action: 'abandoned',
      details: `放弃任务: ${quest.title}`,
    });

    this.notifyUpdate(quest);
  }

  /**
   * 任务失败
   */
  failQuest(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest) return;

    quest.status = 'failed';

    this.addLogEntry({
      timestamp: Date.now(),
      questId: questId,
      action: 'failed',
      details: `任务失败: ${quest.title}`,
    });

    this.notifyUpdate(quest);
  }

  /**
   * 获取所有任务
   */
  getAllQuests(): Quest[] {
    return Array.from(this.quests.values());
  }

  /**
   * 获取特定状态的任务
   */
  getQuestsByStatus(status: Quest['status']): Quest[] {
    return Array.from(this.quests.values()).filter(q => q.status === status);
  }

  /**
   * 获取特定 NPC 的任务
   */
  getQuestsByNPC(npcId: string): Quest[] {
    return Array.from(this.quests.values()).filter(q => q.npcId === npcId);
  }

  /**
   * 获取任务日志条目
   */
  getQuestLog(limit?: number): QuestLogEntry[] {
    const entries = [...this.questLog].reverse();
    return limit ? entries.slice(0, limit) : entries;
  }

  /**
   * 获取特定任务的日志条目
   */
  getQuestLogEntries(questId: string): QuestLogEntry[] {
    return this.questLog.filter(entry => entry.questId === questId);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.quests.clear();
    this.questLog = [];
    this.updateCallbacks = [];
    this.rewardSystem = null;
    this.economySystem = null;
  }

  /**
   * 获取任务统计信息
   */
  getQuestStatistics(): {
    total: number;
    accepted: number;
    inProgress: number;
    completed: number;
    abandoned: number;
    failed: number;
    totalRewards: Record<string, number>;
  } {
    const quests = Array.from(this.quests.values());
    return {
      total: quests.length,
      accepted: quests.filter(q => q.status === 'accepted').length,
      inProgress: quests.filter(q => q.status === 'in_progress').length,
      completed: quests.filter(q => q.status === 'completed').length,
      abandoned: quests.filter(q => q.status === 'abandoned').length,
      failed: quests.filter(q => q.status === 'failed').length,
      totalRewards: this.calculateTotalRewards(),
    };
  }

  /**
   * 计算总奖励
   */
  private calculateTotalRewards() {
    const completedQuests = this.getQuestsByStatus('completed');
    const rewards: Record<string, number> = {};

    completedQuests.forEach(quest => {
      quest.rewards.forEach(reward => {
        const key = `${reward.type}:${reward.itemName || ''}`;
        rewards[key] = (rewards[key] || 0) + reward.amount;
      });
    });

    return rewards;
  }

  /**
   * 添加日志条目
   */
  private addLogEntry(entry: QuestLogEntry): void {
    this.questLog.push(entry);

    // 限制日志条目数量
    if (this.questLog.length > this.maxLogEntries) {
      this.questLog = this.questLog.slice(-this.maxLogEntries);
    }
  }

  /**
   * 设置奖励系统实例
   */
  setRewardSystem(rewardSystem: RewardSystem): void {
    this.rewardSystem = rewardSystem;
  }

  /**
   * 设置经济系统实例
   */
  setEconomySystem(economySystem: PlayerEconomySystem): void {
    this.economySystem = economySystem;
  }

  /**
   * 订阅任务更新
   */
  onQuestUpdate(callback: (quest: Quest) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知更新
   */
  private notifyUpdate(quest: Quest): void {
    this.updateCallbacks.forEach(callback => callback(quest));
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.quests.clear();
    this.questLog = [];
    this.updateCallbacks = [];
  }

  /**
   * 导出数据
   */
  export() {
    return {
      quests: Array.from(this.quests.values()),
      log: this.questLog,
    };
  }

  /**
   * 导入数据
   */
  import(data: { quests: Quest[]; log: QuestLogEntry[] }): void {
    this.quests.clear();
    data.quests.forEach(quest => this.quests.set(quest.id, quest));
    this.questLog = data.log;
  }
}
