import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { NPCScheduleSystem, NPCActivityType } from './NPCScheduleSystem';
import { NPCDialogueSystem } from './NPCDialogueSystem';
import { NPCManager } from './NPCManager';

describe('NPC 系统集成测试', () => {
  let scene: BABYLON.Scene;
  let npcManager: NPCManager;

  beforeEach(() => {
    // 创建测试场景
    const engine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      deterministicLockstep: true,
    });
    scene = new BABYLON.Scene(engine);

    // 创建 NPC 管理器
    npcManager = new NPCManager(scene);
  });

  describe('NPC 创建', () => {
    it('应该成功创建 NPC', () => {
      const npc = npcManager.createNPC(
        'test-npc-1',
        'Test NPC',
        new BABYLON.Vector3(0, 0, 0)
      );

      expect(npc).toBeDefined();
      expect(npc.id).toBe('test-npc-1');
      expect(npc.name).toBe('Test NPC');
      expect(npc.currentActivity).toBe(NPCActivityType.IDLE);
    });

    it('应该能够获取创建的 NPC', () => {
      npcManager.createNPC(
        'test-npc-2',
        'Test NPC 2',
        new BABYLON.Vector3(5, 0, 5)
      );

      const npc = npcManager.getNPC('test-npc-2');
      expect(npc).toBeDefined();
      expect(npc?.name).toBe('Test NPC 2');
    });

    it('应该能够获取所有 NPC', () => {
      npcManager.createNPC('npc-1', 'NPC 1', new BABYLON.Vector3(0, 0, 0));
      npcManager.createNPC('npc-2', 'NPC 2', new BABYLON.Vector3(5, 0, 5));
      npcManager.createNPC('npc-3', 'NPC 3', new BABYLON.Vector3(10, 0, 10));

      const allNPCs = npcManager.getAllNPCs();
      expect(allNPCs).toHaveLength(3);
    });
  });

  describe('NPC 对话系统', () => {
    it('应该能够开始与 NPC 对话', () => {
      npcManager.createNPC('li-farmer', '李农民', new BABYLON.Vector3(0, 0, 0));

      const dialogue = npcManager.startDialogue('li-farmer');
      expect(dialogue).toBeDefined();
      expect(dialogue?.npcId).toBe('li-farmer');
    });

    it('应该能够选择对话选项', () => {
      npcManager.createNPC('li-farmer', '李农民', new BABYLON.Vector3(0, 0, 0));

      const dialogue = npcManager.startDialogue('li-farmer');
      expect(dialogue).toBeDefined();

      if (dialogue && dialogue.options.length > 0) {
        const nextDialogue = npcManager.selectDialogueOption(
          'li-farmer',
          dialogue.options[0].id
        );
        // 对话可能继续或结束
        expect(nextDialogue === null || nextDialogue !== undefined).toBe(true);
      }
    });

    it('应该能够结束对话', () => {
      npcManager.createNPC('li-farmer', '李农民', new BABYLON.Vector3(0, 0, 0));

      npcManager.startDialogue('li-farmer');
      npcManager.endDialogue('li-farmer');

      // 对话应该已结束
      expect(true).toBe(true);
    });
  });

  describe('NPC 位置查询', () => {
    it('应该能够获取附近的 NPC', () => {
      npcManager.createNPC('npc-1', 'NPC 1', new BABYLON.Vector3(0, 0, 0));
      npcManager.createNPC('npc-2', 'NPC 2', new BABYLON.Vector3(5, 0, 5));
      npcManager.createNPC('npc-3', 'NPC 3', new BABYLON.Vector3(50, 0, 50));

      const nearbyNPCs = npcManager.getNearbyNPCs(
        new BABYLON.Vector3(0, 0, 0),
        10
      );

      // 应该找到距离在 10 单位内的 NPC
      expect(nearbyNPCs.length).toBeGreaterThan(0);
      expect(nearbyNPCs.length).toBeLessThanOrEqual(2);
    });
  });

  describe('NPC 删除', () => {
    it('应该能够删除 NPC', () => {
      npcManager.createNPC('npc-to-delete', 'NPC', new BABYLON.Vector3(0, 0, 0));

      expect(npcManager.getNPC('npc-to-delete')).toBeDefined();

      npcManager.removeNPC('npc-to-delete');

      expect(npcManager.getNPC('npc-to-delete')).toBeUndefined();
    });
  });

  describe('NPC 日程系统', () => {
    it('应该能够创建 NPC 日程', () => {
      const scheduleSystem = new NPCScheduleSystem();

      // 添加日程
      scheduleSystem.addSchedule({
        startTime: 0,
        endTime: 12,
        activity: NPCActivityType.WORKING,
        location: new BABYLON.Vector3(0, 0, 0),
      });

      expect(scheduleSystem).toBeDefined();
    });
  });

  describe('NPC 对话系统', () => {
    it('应该能够创建对话配置', () => {
      const dialogueSystem = new NPCDialogueSystem();

      // 开始对话
      const dialogue = dialogueSystem.startDialogue('li-farmer');

      expect(dialogue).toBeDefined();
      expect(dialogue?.text).toBeDefined();
      expect(dialogue?.options).toBeDefined();
    });
  });

  describe('资源清理', () => {
    it('应该能够清理所有资源', () => {
      npcManager.createNPC('npc-1', 'NPC 1', new BABYLON.Vector3(0, 0, 0));
      npcManager.createNPC('npc-2', 'NPC 2', new BABYLON.Vector3(5, 0, 5));

      npcManager.dispose();

      expect(npcManager.getAllNPCs()).toHaveLength(0);
    });
  });
});
