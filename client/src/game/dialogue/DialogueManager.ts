/**
 * 对话系统管理器
 * 管理 NPC 对话流程、选项和历史记录
 */

export interface DialogueNode {
  id: string;
  text: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking';
  options: DialogueOption[];
  soundEffect?: string;
  voiceFile?: string;
}

export interface DialogueOption {
  id: string;
  text: string;
  nextNodeId?: string;
  affectionChange?: number; // 好感度变化
  rewardId?: string;
  condition?: () => boolean;
  action?: () => void;
}

export interface DialogueHistory {
  npcId: string;
  npcName: string;
  messages: DialogueMessage[];
  startTime: number;
  endTime?: number;
}

export interface DialogueMessage {
  id: string;
  speaker: 'npc' | 'player';
  name: string;
  text: string;
  emotion?: string;
  timestamp: number;
}

export class DialogueManager {
  private dialogueTree: Map<string, DialogueNode> = new Map();
  private currentDialogue: DialogueNode | null = null;
  private dialogueHistory: DialogueHistory | null = null;
  private messageId: number = 0;
  private npcAffection: Map<string, number> = new Map();

  /**
   * 注册对话树
   */
  public registerDialogueTree(npcId: string, tree: DialogueNode[]): void {
    tree.forEach((node) => {
      this.dialogueTree.set(`${npcId}:${node.id}`, node);
    });
  }

  /**
   * 开始对话
   */
  public startDialogue(npcId: string, npcName: string, startNodeId: string): DialogueNode | null {
    const nodeKey = `${npcId}:${startNodeId}`;
    const node = this.dialogueTree.get(nodeKey);

    if (!node) {
      console.warn(`Dialogue node not found: ${nodeKey}`);
      return null;
    }

    this.currentDialogue = node;
    this.dialogueHistory = {
      npcId,
      npcName,
      messages: [],
      startTime: Date.now(),
    };

    // 添加 NPC 首条消息
    this.addMessage('npc', npcName, node.text, node.emotion);

    return node;
  }

  /**
   * 选择对话选项
   */
  public selectOption(optionId: string, playerName: string): DialogueNode | null {
    if (!this.currentDialogue || !this.dialogueHistory) {
      console.warn('No active dialogue');
      return null;
    }

    const option = this.currentDialogue.options.find((opt) => opt.id === optionId);
    if (!option) {
      console.warn(`Option not found: ${optionId}`);
      return null;
    }

    // 检查条件
    if (option.condition && !option.condition()) {
      console.warn(`Option condition not met: ${optionId}`);
      return null;
    }

    // 添加玩家消息
    this.addMessage('player', playerName, option.text);

    // 更新好感度
    if (option.affectionChange) {
      const npcId = this.dialogueHistory.npcId;
      const currentAffection = this.npcAffection.get(npcId) || 0;
      this.npcAffection.set(npcId, currentAffection + option.affectionChange);
    }

    // 执行选项动作
    option.action?.();

    // 获取下一个对话节点
    if (option.nextNodeId) {
      const nextNodeKey = `${this.dialogueHistory.npcId}:${option.nextNodeId}`;
      const nextNode = this.dialogueTree.get(nextNodeKey);

      if (nextNode) {
        this.currentDialogue = nextNode;
        this.addMessage('npc', this.dialogueHistory.npcName, nextNode.text, nextNode.emotion);
        return nextNode;
      }
    }

    // 对话结束
    this.endDialogue();
    return null;
  }

  /**
   * 结束对话
   */
  public endDialogue(): void {
    if (this.dialogueHistory) {
      this.dialogueHistory.endTime = Date.now();
    }
    this.currentDialogue = null;
  }

  /**
   * 添加消息到历史记录
   */
  private addMessage(
    speaker: 'npc' | 'player',
    name: string,
    text: string,
    emotion?: string
  ): void {
    if (!this.dialogueHistory) return;

    this.dialogueHistory.messages.push({
      id: `msg-${this.messageId++}`,
      speaker,
      name,
      text,
      emotion,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取当前对话
   */
  public getCurrentDialogue(): DialogueNode | null {
    return this.currentDialogue;
  }

  /**
   * 获取可用的对话选项
   */
  public getAvailableOptions(): DialogueOption[] {
    if (!this.currentDialogue) return [];

    return this.currentDialogue.options.filter((opt) => {
      if (opt.condition) {
        return opt.condition();
      }
      return true;
    });
  }

  /**
   * 获取对话历史
   */
  public getDialogueHistory(): DialogueHistory | null {
    return this.dialogueHistory;
  }

  /**
   * 获取 NPC 好感度
   */
  public getNPCAffection(npcId: string): number {
    return this.npcAffection.get(npcId) || 0;
  }

  /**
   * 设置 NPC 好感度
   */
  public setNPCAffection(npcId: string, affection: number): void {
    this.npcAffection.set(npcId, affection);
  }

  /**
   * 清除对话数据
   */
  public clear(): void {
    this.dialogueTree.clear();
    this.currentDialogue = null;
    this.dialogueHistory = null;
    this.messageId = 0;
  }
}

/**
 * 全局对话管理器实例
 */
export const dialogueManager = new DialogueManager();

/**
 * 示例对话树
 */
export const createExampleDialogueTree = (): DialogueNode[] => [
  {
    id: 'greeting',
    text: '你好！很高兴见到你。今天天气真好呢。',
    emotion: 'happy',
    options: [
      {
        id: 'opt-1',
        text: '你好！最近怎么样？',
        nextNodeId: 'response-1',
        affectionChange: 1,
      },
      {
        id: 'opt-2',
        text: '你在这里做什么？',
        nextNodeId: 'response-2',
        affectionChange: 0,
      },
      {
        id: 'opt-3',
        text: '我没时间聊天。',
        affectionChange: -1,
      },
    ],
  },
  {
    id: 'response-1',
    text: '我很好，谢谢关心！最近在忙一些事情。对了，你能帮我一个忙吗？',
    emotion: 'neutral',
    options: [
      {
        id: 'opt-4',
        text: '当然可以，什么事？',
        nextNodeId: 'quest-offer',
        affectionChange: 2,
      },
      {
        id: 'opt-5',
        text: '可能不行，我很忙。',
        affectionChange: -1,
      },
    ],
  },
  {
    id: 'response-2',
    text: '我在这里等朋友。你呢？',
    emotion: 'neutral',
    options: [
      {
        id: 'opt-6',
        text: '我在散步。',
        nextNodeId: 'chat-1',
        affectionChange: 1,
      },
      {
        id: 'opt-7',
        text: '这不关你事。',
        affectionChange: -2,
      },
    ],
  },
  {
    id: 'quest-offer',
    text: '太好了！我需要你帮我收集一些物品。你愿意吗？',
    emotion: 'happy',
    options: [
      {
        id: 'opt-8',
        text: '我接受这个任务！',
        affectionChange: 3,
        action: () => {
          console.log('Quest accepted');
        },
      },
      {
        id: 'opt-9',
        text: '让我考虑一下。',
        affectionChange: 0,
      },
    ],
  },
  {
    id: 'chat-1',
    text: '散步很不错。希望下次能再见到你！',
    emotion: 'happy',
    options: [
      {
        id: 'opt-10',
        text: '再见！',
        affectionChange: 1,
      },
    ],
  },
];
