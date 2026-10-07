/**
 * Onboarding System
 * Implements complete new player tutorial and guidance system
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export type OnboardingStage = 'welcome' | 'tutorial' | 'protection' | 'completed';
export type TutorialStep =
  | 'build_first_house'
  | 'collect_resources'
  | 'interact_npc'
  | 'complete_task'
  | 'first_trade'
  | 'upgrade_building';

export interface OnboardingProgress {
  playerId: string;
  stage: OnboardingStage;
  completedSteps: TutorialStep[];
  currentStep: TutorialStep;
  startTime: number;
  completionTime?: number;
  rewards: OnboardingReward[];
  protectionActive: boolean;
  protectionEndTime?: number;
  guidanceNPCId?: string;
}

export interface TutorialStepConfig {
  step: TutorialStep;
  title: string;
  description: string;
  objective: string;
  rewards: OnboardingReward[];
  hints: string[];
  guidanceNPCName: string;
  estimatedDuration: number; // milliseconds
  order: number;
}

export interface OnboardingReward {
  type: 'isc' | 'resource' | 'item' | 'building';
  resourceType?: 'gold' | 'food' | 'energy' | 'water';
  amount: number;
  description: string;
}

export interface NewPlayerProtection {
  playerId: string;
  protectionActive: boolean;
  startTime: number;
  durationDays: number;
  endTime: number;
  restrictions: {
    canBePvPAttacked: boolean;
    canBeRobbed: boolean;
    tradeDiscountPercent: number;
    priceMultiplier: number;
  };
}

export interface OnboardingAction {
  type: 'start' | 'complete_step' | 'skip_step' | 'abandon' | 'restart';
  playerId: string;
  step?: TutorialStep;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Tutorial Steps Configuration
// ============================================================================

export const TUTORIAL_STEPS: Record<TutorialStep, TutorialStepConfig> = {
  build_first_house: {
    step: 'build_first_house',
    title: '建造第一个房屋',
    description: '在您的土地上建造第一个房屋，这是您在冰雪城的家园',
    objective: '使用 100 金币建造一个木制房屋',
    rewards: [
      { type: 'isc', amount: 100, description: '完成奖励' },
      { type: 'item', amount: 1, description: '新手房屋装饰' },
    ],
    hints: [
      '点击空地选择建造',
      '在菜单中选择房屋',
      '确认建造即可开始',
      '建造需要 30 秒完成',
    ],
    guidanceNPCName: '建筑师 Alice',
    estimatedDuration: 120000, // 2 minutes
    order: 1,
  },
  collect_resources: {
    step: 'collect_resources',
    title: '收集第一批资源',
    description: '从您的建筑中收集资源，这是获得收入的基本方式',
    objective: '收集 500 金币',
    rewards: [
      { type: 'isc', amount: 100, description: '完成奖励' },
      { type: 'resource', resourceType: 'gold', amount: 200, description: '额外金币' },
    ],
    hints: [
      '点击建筑查看资源',
      '点击"收集"按钮获取资源',
      '资源每小时自动生成',
      '升级建筑可增加产出',
    ],
    guidanceNPCName: '商人 Bob',
    estimatedDuration: 180000, // 3 minutes
    order: 2,
  },
  interact_npc: {
    step: 'interact_npc',
    title: '与 NPC 交互',
    description: '与城市中的 NPC 建立关系，他们会提供任务和交易机会',
    objective: '与 3 个不同的 NPC 交互',
    rewards: [
      { type: 'isc', amount: 150, description: '完成奖励' },
      { type: 'item', amount: 1, description: '友谊礼物' },
    ],
    hints: [
      '打开 NPC 列表',
      '点击 NPC 查看详情',
      '选择"问候"进行交互',
      '建立关系可解锁新功能',
    ],
    guidanceNPCName: '社交大使 Carol',
    estimatedDuration: 120000, // 2 minutes
    order: 3,
  },
  complete_task: {
    step: 'complete_task',
    title: '完成第一个任务',
    description: '接受并完成 NPC 发布的任务，赚取奖励',
    objective: '完成 1 个任务',
    rewards: [
      { type: 'isc', amount: 200, description: '完成奖励' },
      { type: 'resource', resourceType: 'food', amount: 100, description: '食物奖励' },
    ],
    hints: [
      '打开任务列表',
      '选择推荐的新手任务',
      '按照任务要求完成',
      '返回 NPC 提交任务',
    ],
    guidanceNPCName: '任务管理员 David',
    estimatedDuration: 300000, // 5 minutes
    order: 4,
  },
  first_trade: {
    step: 'first_trade',
    title: '进行第一笔交易',
    description: '与其他玩家或 NPC 进行交易，体验经济系统',
    objective: '完成 1 笔交易',
    rewards: [
      { type: 'isc', amount: 250, description: '完成奖励' },
      { type: 'item', amount: 1, description: '交易徽章' },
    ],
    hints: [
      '打开商城或玩家市场',
      '选择一件商品',
      '确认交易',
      '查看库存中的新物品',
    ],
    guidanceNPCName: '交易员 Eve',
    estimatedDuration: 180000, // 3 minutes
    order: 5,
  },
  upgrade_building: {
    step: 'upgrade_building',
    title: '升级第一个建筑',
    description: '升级建筑以增加产出和功能',
    objective: '将一个建筑升级到 2 级',
    rewards: [
      { type: 'isc', amount: 300, description: '完成奖励' },
      { type: 'building', amount: 1, description: '升级加速券' },
    ],
    hints: [
      '选择一个建筑',
      '点击"升级"按钮',
      '确认升级需要的资源',
      '升级需要 1 分钟完成',
    ],
    guidanceNPCName: '工程师 Frank',
    estimatedDuration: 120000, // 2 minutes
    order: 6,
  },
};

// ============================================================================
// Onboarding Manager
// ============================================================================

export class OnboardingManager {
  private playerProgress: Map<string, OnboardingProgress> = new Map();
  private playerProtection: Map<string, NewPlayerProtection> = new Map();
  private completedActions: Map<string, OnboardingAction[]> = new Map();

  /**
   * Start onboarding for a new player
   */
  startOnboarding(playerId: string): OnboardingProgress {
    if (this.playerProgress.has(playerId)) {
      throw new Error('Player already has active onboarding');
    }

    const firstStep: TutorialStep = 'build_first_house';
    const progress: OnboardingProgress = {
      playerId,
      stage: 'tutorial',
      completedSteps: [],
      currentStep: firstStep,
      startTime: Date.now(),
      rewards: [],
      protectionActive: true,
      protectionEndTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    this.playerProgress.set(playerId, progress);

    // Activate new player protection
    this.activateProtection(playerId, 7);

    // Record action
    this.recordAction(playerId, {
      type: 'start',
      playerId,
      timestamp: Date.now(),
    });

    return progress;
  }

  /**
   * Complete a tutorial step
   */
  completeStep(playerId: string, step: TutorialStep): OnboardingReward[] {
    const progress = this.playerProgress.get(playerId);
    if (!progress) {
      throw new Error('No active onboarding found');
    }

    if (progress.currentStep !== step) {
      throw new Error(`Current step is ${progress.currentStep}, not ${step}`);
    }

    const config = TUTORIAL_STEPS[step];
    const rewards = config.rewards;

    // Update progress
    progress.completedSteps.push(step);
    progress.rewards.push(...rewards);

    // Move to next step
    const nextStepOrder = config.order + 1;
    const nextStep = Object.values(TUTORIAL_STEPS).find((s) => s.order === nextStepOrder);

    if (nextStep) {
      progress.currentStep = nextStep.step;
    } else {
      // All steps completed
      progress.stage = 'completed';
      progress.completionTime = Date.now();
    }

    // Record action
    this.recordAction(playerId, {
      type: 'complete_step',
      playerId,
      step,
      timestamp: Date.now(),
    });

    return rewards;
  }

  /**
   * Skip a tutorial step
   */
  skipStep(playerId: string, step: TutorialStep): void {
    const progress = this.playerProgress.get(playerId);
    if (!progress) {
      throw new Error('No active onboarding found');
    }

    if (progress.currentStep !== step) {
      throw new Error(`Current step is ${progress.currentStep}, not ${step}`);
    }

    // Move to next step without rewards
    const config = TUTORIAL_STEPS[step];
    const nextStepOrder = config.order + 1;
    const nextStep = Object.values(TUTORIAL_STEPS).find((s) => s.order === nextStepOrder);

    if (nextStep) {
      progress.currentStep = nextStep.step;
    } else {
      progress.stage = 'completed';
      progress.completionTime = Date.now();
    }

    // Record action
    this.recordAction(playerId, {
      type: 'skip_step',
      playerId,
      step,
      timestamp: Date.now(),
    });
  }

  /**
   * Abandon onboarding
   */
  abandonOnboarding(playerId: string): void {
    const progress = this.playerProgress.get(playerId);
    if (!progress) {
      throw new Error('No active onboarding found');
    }

    this.playerProgress.delete(playerId);

    // Record action
    this.recordAction(playerId, {
      type: 'abandon',
      playerId,
      timestamp: Date.now(),
    });
  }

  /**
   * Get current onboarding progress
   */
  getProgress(playerId: string): OnboardingProgress | undefined {
    return this.playerProgress.get(playerId);
  }

  /**
   * Get current tutorial step config
   */
  getCurrentStepConfig(playerId: string): TutorialStepConfig | undefined {
    const progress = this.playerProgress.get(playerId);
    if (!progress) {
      return undefined;
    }

    return TUTORIAL_STEPS[progress.currentStep];
  }

  /**
   * Check if player is in onboarding
   */
  isOnboarding(playerId: string): boolean {
    const progress = this.playerProgress.get(playerId);
    return progress !== undefined && progress.stage !== 'completed';
  }

  /**
   * Activate new player protection
   */
  private activateProtection(playerId: string, durationDays: number): void {
    const startTime = Date.now();
    const endTime = startTime + durationDays * 24 * 60 * 60 * 1000;

    const protection: NewPlayerProtection = {
      playerId,
      protectionActive: true,
      startTime,
      durationDays,
      endTime,
      restrictions: {
        canBePvPAttacked: false,
        canBeRobbed: false,
        tradeDiscountPercent: 10,
        priceMultiplier: 0.9,
      },
    };

    this.playerProtection.set(playerId, protection);
  }

  /**
   * Get player protection status
   */
  getProtection(playerId: string): NewPlayerProtection | undefined {
    const protection = this.playerProtection.get(playerId);
    if (!protection) {
      return undefined;
    }

    // Check if protection has expired
    if (Date.now() > protection.endTime) {
      protection.protectionActive = false;
    }

    return protection;
  }

  /**
   * Check if player is protected
   */
  isProtected(playerId: string): boolean {
    const protection = this.getProtection(playerId);
    return protection?.protectionActive ?? false;
  }

  /**
   * Record onboarding action
   */
  private recordAction(playerId: string, action: OnboardingAction): void {
    if (!this.completedActions.has(playerId)) {
      this.completedActions.set(playerId, []);
    }

    const actions = this.completedActions.get(playerId)!;
    actions.push(action);
  }

  /**
   * Get onboarding actions history
   */
  getActions(playerId: string): OnboardingAction[] {
    return this.completedActions.get(playerId) ?? [];
  }

  /**
   * Get onboarding completion rate
   */
  getCompletionRate(playerId: string): number {
    const progress = this.playerProgress.get(playerId);
    if (!progress) {
      return 0;
    }

    const totalSteps = Object.keys(TUTORIAL_STEPS).length;
    return (progress.completedSteps.length / totalSteps) * 100;
  }

  /**
   * Get total onboarding rewards
   */
  getTotalRewards(playerId: string): OnboardingReward[] {
    const progress = this.playerProgress.get(playerId);
    if (!progress) {
      return [];
    }

    return progress.rewards;
  }

  /**
   * Get estimated time to complete onboarding
   */
  getEstimatedTimeRemaining(playerId: string): number {
    const progress = this.playerProgress.get(playerId);
    if (!progress || progress.stage === 'completed') {
      return 0;
    }

    const currentConfig = TUTORIAL_STEPS[progress.currentStep];
    let totalTime = currentConfig.estimatedDuration;

    // Add time for remaining steps
    const currentOrder = currentConfig.order;
    for (const step of Object.values(TUTORIAL_STEPS)) {
      if (step.order > currentOrder) {
        totalTime += step.estimatedDuration;
      }
    }

    return totalTime;
  }
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const StartOnboardingSchema = z.object({
  playerId: z.string(),
});

export const CompleteStepSchema = z.object({
  step: z.enum([
    'build_first_house',
    'collect_resources',
    'interact_npc',
    'complete_task',
    'first_trade',
    'upgrade_building',
  ]),
});

export const SkipStepSchema = z.object({
  step: z.enum([
    'build_first_house',
    'collect_resources',
    'interact_npc',
    'complete_task',
    'first_trade',
    'upgrade_building',
  ]),
});

export type StartOnboardingInput = z.infer<typeof StartOnboardingSchema>;
export type CompleteStepInput = z.infer<typeof CompleteStepSchema>;
export type SkipStepInput = z.infer<typeof SkipStepSchema>;
