import { describe, it, expect, beforeEach } from 'vitest';
import { QuestLogManager, Quest, QuestObjective, QuestReward } from './QuestLogManager';

describe('QuestLogManager', () => {
  let questLogManager: QuestLogManager;

  beforeEach(() => {
    questLogManager = new QuestLogManager();
  });

  describe('接取任务', () => {
    it('应该成功接取任务', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'accepted',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 0,
            completed: false,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: 0,
        progress: 0,
        difficulty: 'easy',
      };

      questLogManager.acceptQuest(quest);

      const quests = questLogManager.getAllQuests();
      expect(quests).toHaveLength(1);
      expect(quests[0].id).toBe('quest-1');
      expect(quests[0].status).toBe('accepted');
    });
  });

  describe('更新任务进度', () => {
    it('应该正确更新目标进度', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'accepted',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 0,
            completed: false,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: Date.now(),
        progress: 0,
        difficulty: 'easy',
      };

      questLogManager.acceptQuest(quest);
      questLogManager.updateQuestProgress('quest-1', 'obj-1', 5);

      const quests = questLogManager.getAllQuests();
      expect(quests[0].objectives[0].currentCount).toBe(5);
      expect(quests[0].progress).toBe(50);
    });

    it('应该标记已完成的目标', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'accepted',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 0,
            completed: false,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: Date.now(),
        progress: 0,
        difficulty: 'easy',
      };

      questLogManager.acceptQuest(quest);
      questLogManager.updateQuestProgress('quest-1', 'obj-1', 10);

      const quests = questLogManager.getAllQuests();
      expect(quests[0].objectives[0].completed).toBe(true);
      expect(quests[0].progress).toBe(100);
    });
  });

  describe('完成任务', () => {
    it('应该正确完成任务', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'accepted',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 10,
            completed: true,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: Date.now(),
        progress: 100,
        difficulty: 'easy',
      };

      questLogManager.acceptQuest(quest);
      questLogManager.completeQuest('quest-1');

      const quests = questLogManager.getAllQuests();
      expect(quests[0].status).toBe('completed');
      expect(quests[0].completedTime).toBeDefined();
    });
  });

  describe('放弃任务', () => {
    it('应该正确放弃任务', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'accepted',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 5,
            completed: false,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: Date.now(),
        progress: 50,
        difficulty: 'easy',
      };

      questLogManager.acceptQuest(quest);
      questLogManager.abandonQuest('quest-1');

      const quests = questLogManager.getAllQuests();
      expect(quests[0].status).toBe('abandoned');
    });
  });

  describe('任务失败', () => {
    it('应该正确标记任务失败', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'accepted',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 3,
            completed: false,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: Date.now(),
        progress: 30,
        difficulty: 'easy',
      };

      questLogManager.acceptQuest(quest);
      questLogManager.failQuest('quest-1');

      const quests = questLogManager.getAllQuests();
      expect(quests[0].status).toBe('failed');
    });
  });

  describe('任务日志', () => {
    it('应该记录所有任务操作', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'accepted',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 0,
            completed: false,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: 0,
        progress: 0,
        difficulty: 'easy',
      };

      questLogManager.acceptQuest(quest);
      questLogManager.updateQuestProgress('quest-1', 'obj-1', 10);
      questLogManager.completeQuest('quest-1');

      const log = questLogManager.getQuestLog();
      expect(log.length).toBeGreaterThanOrEqual(3);
      expect(log[0].action).toBe('completed');
      expect(log[1].action).toBe('objective_completed');
      expect(log[2].action).toBe('accepted');
    });
  });

  describe('任务统计', () => {
    it('应该正确计算任务统计信息', () => {
      const quest1: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'completed',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 10,
            completed: true,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: Date.now(),
        completedTime: Date.now(),
        progress: 100,
        difficulty: 'easy',
      };

      const quest2: Quest = {
        id: 'quest-2',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '修复农舍',
        description: '修复农舍',
        status: 'in_progress',
        objectives: [
          {
            id: 'obj-2',
            description: '修复农舍',
            targetCount: 1,
            currentCount: 0,
            completed: false,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 200,
          },
        ],
        acceptedTime: Date.now(),
        progress: 0,
        difficulty: 'normal',
      };

      questLogManager.acceptQuest(quest1);
      questLogManager.completeQuest('quest-1');
      questLogManager.acceptQuest(quest2);

      const stats = questLogManager.getQuestStatistics();
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.inProgress).toBe(1);
    });
  });

  describe('数据导入导出', () => {
    it('应该正确导出和导入数据', () => {
      const quest: Quest = {
        id: 'quest-1',
        npcId: 'npc-1',
        npcName: '李农民',
        title: '收集麦子',
        description: '收集 10 个麦子',
        status: 'accepted',
        objectives: [
          {
            id: 'obj-1',
            description: '收集麦子',
            targetCount: 10,
            currentCount: 5,
            completed: false,
          },
        ],
        rewards: [
          {
            type: 'coin',
            amount: 100,
          },
        ],
        acceptedTime: Date.now(),
        progress: 50,
        difficulty: 'easy',
      };

      questLogManager.acceptQuest(quest);
      const exported = questLogManager.export();

      const newManager = new QuestLogManager();
      newManager.import(exported);

      const quests = newManager.getAllQuests();
      expect(quests).toHaveLength(1);
      expect(quests[0].id).toBe('quest-1');
      expect(quests[0].progress).toBe(50);
    });
  });
});
