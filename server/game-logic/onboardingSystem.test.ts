import { describe, it, expect, beforeEach } from 'vitest';
import {
  OnboardingManager,
  TUTORIAL_STEPS,
  type TutorialStep,
} from './onboardingSystem';

describe('OnboardingManager', () => {
  let manager: OnboardingManager;
  const playerId = 'player-123';

  beforeEach(() => {
    manager = new OnboardingManager();
  });

  describe('startOnboarding', () => {
    it('should start onboarding for new player', () => {
      const progress = manager.startOnboarding(playerId);

      expect(progress).toBeDefined();
      expect(progress.playerId).toBe(playerId);
      expect(progress.stage).toBe('tutorial');
      expect(progress.currentStep).toBe('build_first_house');
      expect(progress.completedSteps).toHaveLength(0);
      expect(progress.protectionActive).toBe(true);
    });

    it('should throw error if player already has onboarding', () => {
      manager.startOnboarding(playerId);

      expect(() => {
        manager.startOnboarding(playerId);
      }).toThrow('Player already has active onboarding');
    });

    it('should activate new player protection for 7 days', () => {
      manager.startOnboarding(playerId);
      const protection = manager.getProtection(playerId);

      expect(protection).toBeDefined();
      expect(protection?.protectionActive).toBe(true);
      expect(protection?.durationDays).toBe(7);
      expect(protection?.restrictions.canBePvPAttacked).toBe(false);
      expect(protection?.restrictions.canBeRobbed).toBe(false);
    });

    it('should set protection end time correctly', () => {
      const beforeStart = Date.now();
      manager.startOnboarding(playerId);
      const afterStart = Date.now();

      const protection = manager.getProtection(playerId);
      const expectedEndTime = 7 * 24 * 60 * 60 * 1000;

      expect(protection?.endTime).toBeGreaterThanOrEqual(beforeStart + expectedEndTime);
      expect(protection?.endTime).toBeLessThanOrEqual(afterStart + expectedEndTime);
    });
  });

  describe('completeStep', () => {
    it('should complete first step successfully', () => {
      manager.startOnboarding(playerId);
      const rewards = manager.completeStep(playerId, 'build_first_house');

      expect(rewards).toBeDefined();
      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards.some((r) => r.type === 'isc')).toBe(true);
    });

    it('should move to next step after completion', () => {
      manager.startOnboarding(playerId);
      manager.completeStep(playerId, 'build_first_house');

      const progress = manager.getProgress(playerId);
      expect(progress?.currentStep).toBe('collect_resources');
    });

    it('should add completed step to list', () => {
      manager.startOnboarding(playerId);
      manager.completeStep(playerId, 'build_first_house');

      const progress = manager.getProgress(playerId);
      expect(progress?.completedSteps).toContain('build_first_house');
    });

    it('should accumulate rewards', () => {
      manager.startOnboarding(playerId);
      manager.completeStep(playerId, 'build_first_house');
      manager.completeStep(playerId, 'collect_resources');

      const progress = manager.getProgress(playerId);
      expect(progress?.rewards.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw error if no active onboarding', () => {
      expect(() => {
        manager.completeStep(playerId, 'build_first_house');
      }).toThrow('No active onboarding found');
    });

    it('should throw error if wrong step', () => {
      manager.startOnboarding(playerId);

      expect(() => {
        manager.completeStep(playerId, 'collect_resources');
      }).toThrow();
    });

    it('should complete all steps in order', () => {
      manager.startOnboarding(playerId);

      const steps: TutorialStep[] = [
        'build_first_house',
        'collect_resources',
        'interact_npc',
        'complete_task',
        'first_trade',
        'upgrade_building',
      ];

      for (const step of steps) {
        manager.completeStep(playerId, step);
      }

      const progress = manager.getProgress(playerId);
      expect(progress?.stage).toBe('completed');
      expect(progress?.completedSteps).toHaveLength(6);
    });
  });

  describe('skipStep', () => {
    it('should skip current step', () => {
      manager.startOnboarding(playerId);
      manager.skipStep(playerId, 'build_first_house');

      const progress = manager.getProgress(playerId);
      expect(progress?.currentStep).toBe('collect_resources');
    });

    it('should not add rewards when skipping', () => {
      manager.startOnboarding(playerId);
      manager.skipStep(playerId, 'build_first_house');

      const progress = manager.getProgress(playerId);
      expect(progress?.rewards).toHaveLength(0);
    });

    it('should throw error if wrong step', () => {
      manager.startOnboarding(playerId);

      expect(() => {
        manager.skipStep(playerId, 'collect_resources');
      }).toThrow();
    });

    it('should not add to completed steps', () => {
      manager.startOnboarding(playerId);
      manager.skipStep(playerId, 'build_first_house');

      const progress = manager.getProgress(playerId);
      expect(progress?.completedSteps).not.toContain('build_first_house');
    });
  });

  describe('abandonOnboarding', () => {
    it('should abandon onboarding', () => {
      manager.startOnboarding(playerId);
      manager.abandonOnboarding(playerId);

      const progress = manager.getProgress(playerId);
      expect(progress).toBeUndefined();
    });

    it('should throw error if no active onboarding', () => {
      expect(() => {
        manager.abandonOnboarding(playerId);
      }).toThrow('No active onboarding found');
    });

    it('should allow restarting after abandoning', () => {
      manager.startOnboarding(playerId);
      manager.abandonOnboarding(playerId);

      const newProgress = manager.startOnboarding(playerId);
      expect(newProgress).toBeDefined();
      expect(newProgress.currentStep).toBe('build_first_house');
    });
  });

  describe('getProgress', () => {
    it('should return progress for active player', () => {
      manager.startOnboarding(playerId);
      const progress = manager.getProgress(playerId);

      expect(progress).toBeDefined();
      expect(progress?.playerId).toBe(playerId);
    });

    it('should return undefined for inactive player', () => {
      const progress = manager.getProgress(playerId);
      expect(progress).toBeUndefined();
    });
  });

  describe('getCurrentStepConfig', () => {
    it('should return current step config', () => {
      manager.startOnboarding(playerId);
      const config = manager.getCurrentStepConfig(playerId);

      expect(config).toBeDefined();
      expect(config?.step).toBe('build_first_house');
      expect(config?.title).toBeDefined();
      expect(config?.description).toBeDefined();
      expect(config?.objective).toBeDefined();
    });

    it('should return undefined if no active onboarding', () => {
      const config = manager.getCurrentStepConfig(playerId);
      expect(config).toBeUndefined();
    });

    it('should update config after step completion', () => {
      manager.startOnboarding(playerId);
      manager.completeStep(playerId, 'build_first_house');

      const config = manager.getCurrentStepConfig(playerId);
      expect(config?.step).toBe('collect_resources');
    });
  });

  describe('isOnboarding', () => {
    it('should return true if player is onboarding', () => {
      manager.startOnboarding(playerId);
      expect(manager.isOnboarding(playerId)).toBe(true);
    });

    it('should return false if player is not onboarding', () => {
      expect(manager.isOnboarding(playerId)).toBe(false);
    });

    it('should return false after completion', () => {
      manager.startOnboarding(playerId);

      const steps: TutorialStep[] = [
        'build_first_house',
        'collect_resources',
        'interact_npc',
        'complete_task',
        'first_trade',
        'upgrade_building',
      ];

      for (const step of steps) {
        manager.completeStep(playerId, step);
      }

      expect(manager.isOnboarding(playerId)).toBe(false);
    });
  });

  describe('Protection System', () => {
    it('should activate protection on start', () => {
      manager.startOnboarding(playerId);
      expect(manager.isProtected(playerId)).toBe(true);
    });

    it('should prevent PvP attacks during protection', () => {
      manager.startOnboarding(playerId);
      const protection = manager.getProtection(playerId);

      expect(protection?.restrictions.canBePvPAttacked).toBe(false);
    });

    it('should prevent robbery during protection', () => {
      manager.startOnboarding(playerId);
      const protection = manager.getProtection(playerId);

      expect(protection?.restrictions.canBeRobbed).toBe(false);
    });

    it('should apply trade discount during protection', () => {
      manager.startOnboarding(playerId);
      const protection = manager.getProtection(playerId);

      expect(protection?.restrictions.tradeDiscountPercent).toBe(10);
      expect(protection?.restrictions.priceMultiplier).toBe(0.9);
    });
  });

  describe('Rewards System', () => {
    it('should provide rewards for each step', () => {
      manager.startOnboarding(playerId);

      for (const step of Object.values(TUTORIAL_STEPS)) {
        expect(step.rewards.length).toBeGreaterThan(0);
      }
    });

    it('should accumulate total rewards', () => {
      manager.startOnboarding(playerId);

      const steps: TutorialStep[] = [
        'build_first_house',
        'collect_resources',
        'interact_npc',
      ];

      for (const step of steps) {
        manager.completeStep(playerId, step);
      }

      const totalRewards = manager.getTotalRewards(playerId);
      expect(totalRewards.length).toBeGreaterThanOrEqual(3);
    });

    it('should include ISC rewards', () => {
      manager.startOnboarding(playerId);
      manager.completeStep(playerId, 'build_first_house');

      const rewards = manager.getTotalRewards(playerId);
      expect(rewards.some((r) => r.type === 'isc')).toBe(true);
    });
  });

  describe('Completion Rate', () => {
    it('should return 0% for new player', () => {
      manager.startOnboarding(playerId);
      const rate = manager.getCompletionRate(playerId);

      expect(rate).toBe(0);
    });

    it('should return 50% after completing 3 steps', () => {
      manager.startOnboarding(playerId);

      const steps: TutorialStep[] = [
        'build_first_house',
        'collect_resources',
        'interact_npc',
      ];

      for (const step of steps) {
        manager.completeStep(playerId, step);
      }

      const rate = manager.getCompletionRate(playerId);
      expect(rate).toBe(50);
    });

    it('should return 100% after all steps', () => {
      manager.startOnboarding(playerId);

      const steps: TutorialStep[] = [
        'build_first_house',
        'collect_resources',
        'interact_npc',
        'complete_task',
        'first_trade',
        'upgrade_building',
      ];

      for (const step of steps) {
        manager.completeStep(playerId, step);
      }

      const rate = manager.getCompletionRate(playerId);
      expect(rate).toBe(100);
    });
  });

  describe('Estimated Time', () => {
    it('should return time for new player', () => {
      manager.startOnboarding(playerId);
      const time = manager.getEstimatedTimeRemaining(playerId);

      expect(time).toBeGreaterThan(0);
    });

    it('should decrease after step completion', () => {
      manager.startOnboarding(playerId);
      const initialTime = manager.getEstimatedTimeRemaining(playerId);

      manager.completeStep(playerId, 'build_first_house');
      const updatedTime = manager.getEstimatedTimeRemaining(playerId);

      expect(updatedTime).toBeLessThan(initialTime);
    });

    it('should return 0 after completion', () => {
      manager.startOnboarding(playerId);

      const steps: TutorialStep[] = [
        'build_first_house',
        'collect_resources',
        'interact_npc',
        'complete_task',
        'first_trade',
        'upgrade_building',
      ];

      for (const step of steps) {
        manager.completeStep(playerId, step);
      }

      const time = manager.getEstimatedTimeRemaining(playerId);
      expect(time).toBe(0);
    });
  });

  describe('Tutorial Steps Configuration', () => {
    it('should have all 6 tutorial steps', () => {
      expect(Object.keys(TUTORIAL_STEPS)).toHaveLength(6);
    });

    it('should have correct step order', () => {
      const steps = Object.values(TUTORIAL_STEPS).sort((a, b) => a.order - b.order);

      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].order).toBe(i + 1);
      }
    });

    it('should have hints for each step', () => {
      for (const step of Object.values(TUTORIAL_STEPS)) {
        expect(step.hints.length).toBeGreaterThan(0);
      }
    });

    it('should have guidance NPC for each step', () => {
      for (const step of Object.values(TUTORIAL_STEPS)) {
        expect(step.guidanceNPCName).toBeDefined();
        expect(step.guidanceNPCName.length).toBeGreaterThan(0);
      }
    });

    it('should have estimated duration for each step', () => {
      for (const step of Object.values(TUTORIAL_STEPS)) {
        expect(step.estimatedDuration).toBeGreaterThan(0);
      }
    });
  });

  describe('Multiple Players', () => {
    it('should handle multiple players independently', () => {
      const player1 = 'player-1';
      const player2 = 'player-2';

      manager.startOnboarding(player1);
      manager.startOnboarding(player2);

      manager.completeStep(player1, 'build_first_house');

      const progress1 = manager.getProgress(player1);
      const progress2 = manager.getProgress(player2);

      expect(progress1?.currentStep).toBe('collect_resources');
      expect(progress2?.currentStep).toBe('build_first_house');
    });

    it('should not interfere protection between players', () => {
      const player1 = 'player-1';
      const player2 = 'player-2';

      manager.startOnboarding(player1);
      manager.startOnboarding(player2);

      expect(manager.isProtected(player1)).toBe(true);
      expect(manager.isProtected(player2)).toBe(true);
    });
  });
});
