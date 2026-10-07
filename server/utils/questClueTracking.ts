/**
 * 任务线索追踪和提示系统
 * Phase 104: 任务线索追踪和提示
 */

export interface QuestClue {
  id: string;
  questId: string;
  npcName: string;
  clueText: string;
  clueType: 'location' | 'item' | 'person' | 'hint' | 'objective';
  discoveredAt: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
  relatedNPCs?: string[];
  relatedItems?: string[];
  relatedLocations?: string[];
}

export interface QuestHint {
  id: string;
  questId: string;
  hintText: string;
  hintLevel: number; // 1-5, 1 is most vague, 5 is most specific
  unlockedAt: number;
  usedCount: number;
}

export interface QuestProgress {
  questId: string;
  playerId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
  startedAt?: number;
  completedAt?: number;
  cluesDiscovered: string[];
  hintsUsed: string[];
  currentObjective?: string;
  progressPercentage: number;
}

export class QuestClueTracker {
  private clues: Map<string, QuestClue[]> = new Map();
  private hints: Map<string, QuestHint[]> = new Map();
  private progress: Map<string, QuestProgress> = new Map();
  private clueIndex: Map<string, QuestClue> = new Map();

  /**
   * 添加任务线索
   */
  addClue(clue: QuestClue): void {
    if (!this.clues.has(clue.questId)) {
      this.clues.set(clue.questId, []);
    }
    this.clues.get(clue.questId)!.push(clue);
    this.clueIndex.set(clue.id, clue);
  }

  /**
   * 获取任务的所有线索
   */
  getQuestClues(questId: string): QuestClue[] {
    return this.clues.get(questId) || [];
  }

  /**
   * 获取特定线索
   */
  getClue(clueId: string): QuestClue | undefined {
    return this.clueIndex.get(clueId);
  }

  /**
   * 标记线索为已发现
   */
  discoverClue(playerId: string, questId: string, clueId: string): boolean {
    const clue = this.clueIndex.get(clueId);
    if (!clue || clue.questId !== questId) {
      return false;
    }

    const progressKey = `${playerId}-${questId}`;
    if (!this.progress.has(progressKey)) {
      this.progress.set(progressKey, {
        questId,
        playerId,
        status: 'in_progress',
        startedAt: Date.now(),
        cluesDiscovered: [],
        hintsUsed: [],
        progressPercentage: 0,
      });
    }

    const progress = this.progress.get(progressKey)!;
    if (!progress.cluesDiscovered.includes(clueId)) {
      progress.cluesDiscovered.push(clueId);
      this.updateProgress(playerId, questId);
      return true;
    }

    return false;
  }

  /**
   * 添加任务提示
   */
  addHint(hint: QuestHint): void {
    if (!this.hints.has(hint.questId)) {
      this.hints.set(hint.questId, []);
    }
    this.hints.get(hint.questId)!.push(hint);
  }

  /**
   * 获取任务的所有提示
   */
  getQuestHints(questId: string): QuestHint[] {
    return this.hints.get(questId) || [];
  }

  /**
   * 获取可用的提示（按难度级别）
   */
  getAvailableHints(questId: string, hintLevel: number): QuestHint[] {
    const hints = this.hints.get(questId) || [];
    return hints.filter((h) => h.hintLevel <= hintLevel);
  }

  /**
   * 使用提示
   */
  useHint(playerId: string, questId: string, hintId: string): boolean {
    const hints = this.hints.get(questId) || [];
    const hint = hints.find((h) => h.id === hintId);

    if (!hint) {
      return false;
    }

    const progressKey = `${playerId}-${questId}`;
    if (!this.progress.has(progressKey)) {
      this.progress.set(progressKey, {
        questId,
        playerId,
        status: 'in_progress',
        startedAt: Date.now(),
        cluesDiscovered: [],
        hintsUsed: [],
        progressPercentage: 0,
      });
    }

    const progress = this.progress.get(progressKey)!;
    if (!progress.hintsUsed.includes(hintId)) {
      progress.hintsUsed.push(hintId);
      hint.usedCount++;
      return true;
    }

    return false;
  }

  /**
   * 获取任务进度
   */
  getProgress(playerId: string, questId: string): QuestProgress | undefined {
    return this.progress.get(`${playerId}-${questId}`);
  }

  /**
   * 更新任务进度
   */
  updateProgress(playerId: string, questId: string): void {
    const progressKey = `${playerId}-${questId}`;
    const progress = this.progress.get(progressKey);

    if (!progress) {
      return;
    }

    const totalClues = this.getQuestClues(questId).length;
    if (totalClues > 0) {
      progress.progressPercentage = (progress.cluesDiscovered.length / totalClues) * 100;
    }
  }

  /**
   * 完成任务
   */
  completeQuest(playerId: string, questId: string): boolean {
    const progressKey = `${playerId}-${questId}`;
    const progress = this.progress.get(progressKey);

    if (!progress) {
      return false;
    }

    progress.status = 'completed';
    progress.completedAt = Date.now();
    progress.progressPercentage = 100;
    return true;
  }

  /**
   * 放弃任务
   */
  abandonQuest(playerId: string, questId: string): boolean {
    const progressKey = `${playerId}-${questId}`;
    const progress = this.progress.get(progressKey);

    if (!progress) {
      return false;
    }

    progress.status = 'abandoned';
    return true;
  }

  /**
   * 获取玩家的所有任务进度
   */
  getPlayerQuestProgress(playerId: string): QuestProgress[] {
    const results: QuestProgress[] = [];
    this.progress.forEach((progress) => {
      if (progress.playerId === playerId) {
        results.push(progress);
      }
    });
    return results;
  }

  /**
   * 获取按类型分类的线索
   */
  getCluesByType(questId: string, clueType: QuestClue['clueType']): QuestClue[] {
    const clues = this.getQuestClues(questId);
    return clues.filter((c) => c.clueType === clueType);
  }

  /**
   * 获取按重要性分类的线索
   */
  getCluesByImportance(questId: string, importance: QuestClue['importance']): QuestClue[] {
    const clues = this.getQuestClues(questId);
    return clues.filter((c) => c.importance === importance);
  }

  /**
   * 获取相关的 NPC
   */
  getRelatedNPCs(questId: string): Set<string> {
    const clues = this.getQuestClues(questId);
    const npcs = new Set<string>();

    clues.forEach((clue) => {
      npcs.add(clue.npcName);
      if (clue.relatedNPCs) {
        clue.relatedNPCs.forEach((npc) => npcs.add(npc));
      }
    });

    return npcs;
  }

  /**
   * 获取相关的物品
   */
  getRelatedItems(questId: string): Set<string> {
    const clues = this.getQuestClues(questId);
    const items = new Set<string>();

    clues.forEach((clue) => {
      if (clue.relatedItems) {
        clue.relatedItems.forEach((item) => items.add(item));
      }
    });

    return items;
  }

  /**
   * 获取相关的位置
   */
  getRelatedLocations(questId: string): Set<string> {
    const clues = this.getQuestClues(questId);
    const locations = new Set<string>();

    clues.forEach((clue) => {
      if (clue.relatedLocations) {
        clue.relatedLocations.forEach((loc) => locations.add(loc));
      }
    });

    return locations;
  }

  /**
   * 获取任务统计信息
   */
  getQuestStatistics(questId: string) {
    const clues = this.getQuestClues(questId);
    const hints = this.getQuestHints(questId);

    const cluesByType = new Map<string, number>();
    const cluesByImportance = new Map<string, number>();

    clues.forEach((clue) => {
      cluesByType.set(clue.clueType, (cluesByType.get(clue.clueType) || 0) + 1);
      cluesByImportance.set(clue.importance, (cluesByImportance.get(clue.importance) || 0) + 1);
    });

    return {
      totalClues: clues.length,
      totalHints: hints.length,
      cluesByType: Object.fromEntries(cluesByType),
      cluesByImportance: Object.fromEntries(cluesByImportance),
      relatedNPCCount: this.getRelatedNPCs(questId).size,
      relatedItemCount: this.getRelatedItems(questId).size,
      relatedLocationCount: this.getRelatedLocations(questId).size,
    };
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.clues.clear();
    this.hints.clear();
    this.progress.clear();
    this.clueIndex.clear();
  }

  /**
   * 删除任务的所有线索和提示
   */
  deleteQuest(questId: string): boolean {
    const deleted1 = this.clues.delete(questId);
    const deleted2 = this.hints.delete(questId);

    // 删除相关的进度记录
    const keysToDelete: string[] = [];
    this.progress.forEach((progress, key) => {
      if (progress.questId === questId) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.progress.delete(key));

    // 删除索引中的线索
    const clueIdsToDelete: string[] = [];
    this.clueIndex.forEach((clue, id) => {
      if (clue.questId === questId) {
        clueIdsToDelete.push(id);
      }
    });

    clueIdsToDelete.forEach((id) => this.clueIndex.delete(id));

    return deleted1 || deleted2 || keysToDelete.length > 0;
  }
}

export default QuestClueTracker;
