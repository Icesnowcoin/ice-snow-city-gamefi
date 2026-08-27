/**
 * Game Scenes System
 * Implements playable mini-game scenes for Ice Snow City
 * Scenes: Fishing, Mining, Lumberjacking
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export type SceneType = 'fishing' | 'mining' | 'lumberjacking';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface SceneReward {
  resourceType: 'gold' | 'food' | 'energy' | 'water' | 'isc';
  amount: number;
  probability: number; // 0-1
}

export interface SceneConfig {
  type: SceneType;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  duration: number; // milliseconds
  baseReward: SceneReward[];
  difficulty_multiplier: {
    easy: number;
    medium: number;
    hard: number;
  };
  unlockLevel: number;
  energyCost: number;
  maxAttemptsPerDay: number;
}

export interface PlayerSceneProgress {
  playerId: string;
  sceneType: SceneType;
  difficulty: DifficultyLevel;
  startTime: number;
  endTime?: number;
  score: number;
  completed: boolean;
  rewards: SceneReward[];
  attemptsToday: number;
  lastAttemptTime?: number;
}

export interface SceneAction {
  type: 'start' | 'action' | 'complete' | 'fail' | 'abandon';
  playerId: string;
  sceneType: SceneType;
  difficulty: DifficultyLevel;
  actionData?: Record<string, unknown>;
  timestamp: number;
}

// ============================================================================
// Scene Configurations
// ============================================================================

export const SCENE_CONFIGS: Record<SceneType, SceneConfig> = {
  fishing: {
    type: 'fishing',
    name: '钓鱼',
    description: '在河边钓鱼赚取资源',
    difficulty: 'medium',
    duration: 60000, // 1 minute
    baseReward: [
      { resourceType: 'food', amount: 100, probability: 0.8 },
      { resourceType: 'gold', amount: 50, probability: 0.6 },
      { resourceType: 'isc', amount: 5, probability: 0.1 },
    ],
    difficulty_multiplier: {
      easy: 0.8,
      medium: 1.0,
      hard: 1.5,
    },
    unlockLevel: 1,
    energyCost: 10,
    maxAttemptsPerDay: 5,
  },
  mining: {
    type: 'mining',
    name: '采矿',
    description: '在矿山采矿赚取资源',
    difficulty: 'medium',
    duration: 90000, // 1.5 minutes
    baseReward: [
      { resourceType: 'gold', amount: 200, probability: 0.8 },
      { resourceType: 'energy', amount: 50, probability: 0.6 },
      { resourceType: 'isc', amount: 10, probability: 0.15 },
    ],
    difficulty_multiplier: {
      easy: 0.8,
      medium: 1.0,
      hard: 1.5,
    },
    unlockLevel: 5,
    energyCost: 15,
    maxAttemptsPerDay: 4,
  },
  lumberjacking: {
    type: 'lumberjacking',
    name: '伐木',
    description: '在森林伐木赚取资源',
    difficulty: 'medium',
    duration: 75000, // 1.25 minutes
    baseReward: [
      { resourceType: 'food', amount: 150, probability: 0.7 },
      { resourceType: 'water', amount: 75, probability: 0.5 },
      { resourceType: 'isc', amount: 8, probability: 0.12 },
    ],
    difficulty_multiplier: {
      easy: 0.8,
      medium: 1.0,
      hard: 1.5,
    },
    unlockLevel: 3,
    energyCost: 12,
    maxAttemptsPerDay: 5,
  },
};

// ============================================================================
// Game Scene Manager
// ============================================================================

export class GameSceneManager {
  private activeScenes: Map<string, PlayerSceneProgress> = new Map();
  private playerSceneStats: Map<string, Map<SceneType, number>> = new Map();

  /**
   * Start a new scene for a player
   */
  startScene(
    playerId: string,
    sceneType: SceneType,
    difficulty: DifficultyLevel,
  ): PlayerSceneProgress {
    const config = SCENE_CONFIGS[sceneType];
    const sceneKey = `${playerId}:${sceneType}`;

    // Check if player already has active scene of any type
    const keys = Array.from(this.activeScenes.keys());
    if (keys.some((key) => key.startsWith(`${playerId}:`))) {
      throw new Error('Player already has active scene');
    }

    // Check unlock level
    if (!this.isSceneUnlocked(playerId, sceneType)) {
      throw new Error(`Scene ${sceneType} not unlocked yet`);
    }

    // Check daily attempts
    const attemptsToday = this.getAttemptsToday(playerId, sceneType);
    if (attemptsToday >= config.maxAttemptsPerDay) {
      throw new Error(`Max attempts reached for ${sceneType} today`);
    }

    const progress: PlayerSceneProgress = {
      playerId,
      sceneType,
      difficulty,
      startTime: Date.now(),
      score: 0,
      completed: false,
      rewards: [],
      attemptsToday: attemptsToday + 1,
      lastAttemptTime: Date.now(),
    };

    this.activeScenes.set(sceneKey, progress);
    return progress;
  }

  /**
   * Process player action during scene
   */
  processAction(
    playerId: string,
    sceneType: SceneType,
    actionType: string,
    actionData: Record<string, unknown>,
  ): number {
    const sceneKey = `${playerId}:${sceneType}`;
    const progress = this.activeScenes.get(sceneKey);

    if (!progress) {
      throw new Error('No active scene found');
    }

    // Calculate score based on action
    const score = this.calculateActionScore(sceneType, actionType, actionData);
    progress.score += score;

    return score;
  }

  /**
   * Complete a scene and calculate rewards
   */
  completeScene(playerId: string, sceneType: SceneType): SceneReward[] {
    const sceneKey = `${playerId}:${sceneType}`;
    const progress = this.activeScenes.get(sceneKey);

    if (!progress) {
      throw new Error('No active scene found');
    }

    const config = SCENE_CONFIGS[sceneType];
    const elapsedTime = Date.now() - progress.startTime;

    // Calculate completion bonus based on time
    const timeBonus = this.calculateTimeBonus(
      elapsedTime,
      config.duration,
      progress.score,
    );

    // Generate rewards based on difficulty and score
    const rewards = this.generateRewards(
      config,
      progress.difficulty,
      progress.score + timeBonus,
    );

    progress.rewards = rewards;
    progress.completed = true;
    progress.endTime = Date.now();

    this.activeScenes.delete(sceneKey);
    this.incrementAttempts(playerId, sceneType);

    return rewards;
  }

  /**
   * Abandon a scene
   */
  abandonScene(playerId: string, sceneType: SceneType): void {
    const sceneKey = `${playerId}:${sceneType}`;
    const progress = this.activeScenes.get(sceneKey);

    if (!progress) {
      throw new Error('No active scene found');
    }

    progress.completed = false;
    this.activeScenes.delete(sceneKey);
  }

  /**
   * Get active scene for player
   */
  getActiveScene(
    playerId: string,
    sceneType: SceneType,
  ): PlayerSceneProgress | undefined {
    const sceneKey = `${playerId}:${sceneType}`;
    return this.activeScenes.get(sceneKey);
  }

  /**
   * Check if scene is unlocked for player
   */
  private isSceneUnlocked(playerId: string, sceneType: SceneType): boolean {
    // TODO: Implement level check from player data
    // For now, all scenes are unlocked
    return true;
  }

  /**
   * Get attempts made today for a scene
   */
  private getAttemptsToday(playerId: string, sceneType: SceneType): number {
    if (!this.playerSceneStats.has(playerId)) {
      this.playerSceneStats.set(playerId, new Map());
    }
    const stats = this.playerSceneStats.get(playerId)!;
    return stats.get(sceneType) || 0;
  }

  /**
   * Increment attempts for a scene
   */
  private incrementAttempts(playerId: string, sceneType: SceneType): void {
    if (!this.playerSceneStats.has(playerId)) {
      this.playerSceneStats.set(playerId, new Map());
    }
    const stats = this.playerSceneStats.get(playerId)!;
    stats.set(sceneType, (stats.get(sceneType) || 0) + 1);
  }

  /**
   * Calculate score for an action
   */
  private calculateActionScore(
    sceneType: SceneType,
    actionType: string,
    actionData: Record<string, unknown>,
  ): number {
    let score = 0;

    switch (sceneType) {
      case 'fishing':
        score = this.calculateFishingScore(actionType, actionData);
        break;
      case 'mining':
        score = this.calculateMiningScore(actionType, actionData);
        break;
      case 'lumberjacking':
        score = this.calculateLumberjackingScore(actionType, actionData);
        break;
    }

    return score;
  }

  /**
   * Calculate fishing score
   */
  private calculateFishingScore(
    actionType: string,
    actionData: Record<string, unknown>,
  ): number {
    // Base score for each action
    let score = 10;

    // Bonus for successful catch
    if (actionType === 'cast' && actionData.success) {
      score += 20;
    }

    // Bonus for rare fish
    if (actionData.fishType === 'rare') {
      score += 30;
    }

    return score;
  }

  /**
   * Calculate mining score
   */
  private calculateMiningScore(
    actionType: string,
    actionData: Record<string, unknown>,
  ): number {
    let score = 15;

    if (actionType === 'mine' && actionData.success) {
      score += 25;
    }

    if (actionData.oreType === 'rare') {
      score += 40;
    }

    return score;
  }

  /**
   * Calculate lumberjacking score
   */
  private calculateLumberjackingScore(
    actionType: string,
    actionData: Record<string, unknown>,
  ): number {
    let score = 12;

    if (actionType === 'chop' && actionData.success) {
      score += 22;
    }

    if (actionData.treeType === 'rare') {
      score += 35;
    }

    return score;
  }

  /**
   * Calculate time bonus
   */
  private calculateTimeBonus(
    elapsedTime: number,
    targetDuration: number,
    score: number,
  ): number {
    // Bonus if completed faster than target
    if (elapsedTime < targetDuration) {
      const speedBonus = ((targetDuration - elapsedTime) / targetDuration) * 50;
      return Math.floor(speedBonus);
    }

    // Penalty if took too long
    if (elapsedTime > targetDuration * 1.5) {
      return Math.floor(score * -0.1);
    }

    return 0;
  }

  /**
   * Check if player has active scene
   */
  hasActiveScene(playerId: string): boolean {
    const keys = Array.from(this.activeScenes.keys());
    for (const key of keys) {
      if (key.startsWith(playerId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate rewards based on difficulty and score
   */
  private generateRewards(
    config: SceneConfig,
    difficulty: DifficultyLevel,
    score: number,
  ): SceneReward[] {
    const rewards: SceneReward[] = [];
    const multiplier = config.difficulty_multiplier[difficulty];

    for (const baseReward of config.baseReward) {
      // Check if reward is earned based on probability and score
      const adjustedProbability = Math.min(
        1,
        baseReward.probability + (score / 1000) * 0.2,
      );

      if (Math.random() < adjustedProbability) {
        const amount = Math.max(1, Math.floor(baseReward.amount * multiplier));
        rewards.push({
          resourceType: baseReward.resourceType,
          amount,
          probability: adjustedProbability,
        });
      }
    }

    // Ensure at least one reward is generated
    if (rewards.length === 0) {
      const baseReward = config.baseReward[0];
      const amount = Math.max(1, Math.floor(baseReward.amount * multiplier));
      rewards.push({
        resourceType: baseReward.resourceType,
        amount,
        probability: 1.0,
      });
    }

    return rewards;
  }

  /**
   * Get scene statistics for player
   */
  getSceneStats(playerId: string, sceneType: SceneType): {
    totalAttempts: number;
    successfulAttempts: number;
    totalRewards: Record<string, number>;
    averageScore: number;
  } {
    // TODO: Implement statistics tracking
    return {
      totalAttempts: 0,
      successfulAttempts: 0,
      totalRewards: {},
      averageScore: 0,
    };
  }
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const StartSceneSchema = z.object({
  sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const ProcessActionSchema = z.object({
  sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
  actionType: z.string(),
  actionData: z.record(z.string(), z.unknown()).optional(),
});

export const CompleteSceneSchema = z.object({
  sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
});

export const AbandonSceneSchema = z.object({
  sceneType: z.enum(['fishing', 'mining', 'lumberjacking']),
});

export type StartSceneInput = z.infer<typeof StartSceneSchema>;
export type ProcessActionInput = z.infer<typeof ProcessActionSchema>;
export type CompleteSceneInput = z.infer<typeof CompleteSceneSchema>;
