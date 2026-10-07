import * as BABYLON from '@babylonjs/core';
import { NPCScheduleSystem, NPCActivityType } from './NPCScheduleSystem';
import { NPCModelManager, NPCModelConfig } from './NPCModelManager';
import { NPCDialogueSystem, DialogueNode } from './NPCDialogueSystem';

/**
 * NPC 实例
 */
export interface NPCInstance {
  id: string;
  name: string;
  model: BABYLON.Mesh;
  scheduleSystem: NPCScheduleSystem;
  modelManager: NPCModelManager;
  dialogueSystem: NPCDialogueSystem;
  currentActivity: NPCActivityType;
  currentLocation: BABYLON.Vector3;
}

/**
 * NPC 管理器
 */
export class NPCManager {
  private scene: BABYLON.Scene;
  private npcs: Map<string, NPCInstance> = new Map();
  private scheduleSystem: NPCScheduleSystem;
  private modelManager: NPCModelManager;
  private dialogueSystem: NPCDialogueSystem;
  private onNPCActivityChangeCallback:
    | ((npcId: string, activity: NPCActivityType) => void)
    | null = null;
  private onNPCDialogueChangeCallback:
    | ((npcId: string, dialogue: DialogueNode | null) => void)
    | null = null;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.scheduleSystem = new NPCScheduleSystem();
    this.modelManager = new NPCModelManager(scene);
    this.dialogueSystem = new NPCDialogueSystem();

    // 设置对话变更回调
    this.dialogueSystem.setOnDialogueChangeCallback((dialogue) => {
      const npcId = dialogue?.npcId;
      if (npcId && this.onNPCDialogueChangeCallback) {
        this.onNPCDialogueChangeCallback(npcId, dialogue);
      }
    });
  }

  /**
   * 创建 NPC
   */
  public createNPC(
    npcId: string,
    npcName: string,
    position: BABYLON.Vector3,
    skinColor: BABYLON.Color3 = new BABYLON.Color3(0.9, 0.8, 0.7),
    clothColor: BABYLON.Color3 = new BABYLON.Color3(0.3, 0.5, 0.7),
    hairColor: BABYLON.Color3 = new BABYLON.Color3(0.2, 0.1, 0.05)
  ): NPCInstance {
    // 创建 NPC 模型
    const modelConfig: NPCModelConfig = {
      npcId,
      npcName,
      position,
      scale: 1.0,
      skinColor,
      clothColor,
      hairColor,
    };
    const model = this.modelManager.createNPCModel(modelConfig);

    // 创建 NPC 实例
    const npcInstance: NPCInstance = {
      id: npcId,
      name: npcName,
      model: model as BABYLON.Mesh,
      scheduleSystem: this.scheduleSystem,
      modelManager: this.modelManager,
      dialogueSystem: this.dialogueSystem,
      currentActivity: NPCActivityType.IDLE,
      currentLocation: position.clone(),
    };

    this.npcs.set(npcId, npcInstance);

    // 初始化动画
    this.modelManager.playAnimation(npcId, NPCActivityType.IDLE);

    return npcInstance;
  }

  /**
   * 更新 NPC（每帧调用）
   */
  public update(gameTime: number): void {
    this.npcs.forEach((npc) => {
      // 更新 NPC 动画和位置
      // 实际实现应根据具体的日程管理逻辑进行
    });
  }

  /**
   * 与 NPC 开始对话
   */
  public startDialogue(npcId: string): DialogueNode | null {
    return this.dialogueSystem.startDialogue(npcId);
  }

  /**
   * 选择对话选项
   */
  public selectDialogueOption(npcId: string, optionId: string): DialogueNode | null {
    return this.dialogueSystem.selectOption(npcId, optionId);
  }

  /**
   * 结束对话
   */
  public endDialogue(npcId: string): void {
    this.dialogueSystem.endDialogue(npcId);
  }

  /**
   * 获取 NPC
   */
  public getNPC(npcId: string): NPCInstance | undefined {
    return this.npcs.get(npcId);
  }

  /**
   * 获取所有 NPC
   */
  public getAllNPCs(): NPCInstance[] {
    return Array.from(this.npcs.values());
  }

  /**
   * 获取附近的 NPC
   */
  public getNearbyNPCs(position: BABYLON.Vector3, radius: number = 10): NPCInstance[] {
    return Array.from(this.npcs.values()).filter((npc) => {
      const distance = BABYLON.Vector3.Distance(npc.currentLocation, position);
      return distance <= radius;
    });
  }

  /**
   * 设置 NPC 活动变更回调
   */
  public setOnNPCActivityChangeCallback(
    callback: (npcId: string, activity: NPCActivityType) => void
  ): void {
    this.onNPCActivityChangeCallback = callback;
  }

  /**
   * 设置 NPC 对话变更回调
   */
  public setOnNPCDialogueChangeCallback(
    callback: (npcId: string, dialogue: DialogueNode | null) => void
  ): void {
    this.onNPCDialogueChangeCallback = callback;
  }

  /**
   * 删除 NPC
   */
  public removeNPC(npcId: string): void {
    const npc = this.npcs.get(npcId);
    if (npc) {
      this.modelManager.removeNPCModel(npcId);
      this.npcs.delete(npcId);
    }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.npcs.forEach((npc) => {
      this.modelManager.removeNPCModel(npc.id);
    });
    this.npcs.clear();
    this.modelManager.dispose();
    this.dialogueSystem.dispose();
  }
}
