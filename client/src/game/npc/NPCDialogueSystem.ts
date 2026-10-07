/**
 * 对话选项
 */
export interface DialogueOption {
  id: string;
  text: string;
  nextDialogueId?: string;
  action?: string;
  reward?: {
    type: string;
    amount: number;
  };
}

/**
 * 对话节点
 */
export interface DialogueNode {
  id: string;
  npcId: string;
  text: string;
  emotion?: 'happy' | 'sad' | 'angry' | 'neutral' | 'surprised';
  options: DialogueOption[];
  nextDialogueId?: string;
  condition?: () => boolean;
  action?: () => void;
}

/**
 * NPC 对话配置
 */
export interface NPCDialogueConfig {
  npcId: string;
  npcName: string;
  greetings: DialogueNode[];
  mainDialogues: DialogueNode[];
  questDialogues: DialogueNode[];
  tradeDialogues: DialogueNode[];
}

/**
 * 对话状态
 */
export interface DialogueState {
  npcId: string;
  currentDialogueId: string;
  dialogueHistory: string[];
  isActive: boolean;
  selectedOption?: DialogueOption;
}

/**
 * NPC 对话系统
 */
export class NPCDialogueSystem {
  private dialogueConfigs: Map<string, NPCDialogueConfig> = new Map();
  private dialogueStates: Map<string, DialogueState> = new Map();
  private currentDialogue: DialogueNode | null = null;
  private onDialogueChangeCallback: ((dialogue: DialogueNode | null) => void) | null = null;

  constructor() {
    this.initializeDefaultDialogues();
  }

  /**
   * 初始化默认对话
   */
  private initializeDefaultDialogues(): void {
    // NPC 1: 李农民 - 对话配置
    this.addDialogueConfig({
      npcId: 'li-farmer',
      npcName: '李农民',
      greetings: [
        {
          id: 'li-greeting-1',
          npcId: 'li-farmer',
          text: '早上好！今天天气真不错，适合干活。',
          emotion: 'happy',
          options: [
            {
              id: 'li-greeting-opt-1',
              text: '你好！',
              nextDialogueId: 'li-main-1',
            },
            {
              id: 'li-greeting-opt-2',
              text: '我想和你做交易',
              nextDialogueId: 'li-trade-1',
            },
          ],
        },
      ],
      mainDialogues: [
        {
          id: 'li-main-1',
          npcId: 'li-farmer',
          text: '我是这个农业区的农民，已经在这里种了 10 年的地。',
          emotion: 'neutral',
          options: [
            {
              id: 'li-main-opt-1',
              text: '你喜欢这份工作吗？',
              nextDialogueId: 'li-main-2',
            },
            {
              id: 'li-main-opt-2',
              text: '我想离开',
              nextDialogueId: 'li-greeting-1',
            },
          ],
        },
        {
          id: 'li-main-2',
          npcId: 'li-farmer',
          text: '当然喜欢！看着庄稼从种子长成成熟的粮食，那种成就感无与伦比。',
          emotion: 'happy',
          options: [
            {
              id: 'li-main-opt-3',
              text: '我也想学习农业',
              nextDialogueId: 'li-main-3',
            },
            {
              id: 'li-main-opt-4',
              text: '再见',
              nextDialogueId: 'li-greeting-1',
            },
          ],
        },
        {
          id: 'li-main-3',
          npcId: 'li-farmer',
          text: '很好！我可以教你一些基本的农业知识。首先要了解土壤、水分和阳光的重要性。',
          emotion: 'happy',
          options: [
            {
              id: 'li-main-opt-5',
              text: '谢谢你！',
              nextDialogueId: 'li-greeting-1',
            },
          ],
        },
      ],
      questDialogues: [
        {
          id: 'li-quest-1',
          npcId: 'li-farmer',
          text: '我需要你帮我收割麦田。你能帮我吗？',
          emotion: 'neutral',
          options: [
            {
              id: 'li-quest-opt-1',
              text: '当然可以！',
              action: 'accept_quest',
              reward: { type: 'experience', amount: 100 },
            },
            {
              id: 'li-quest-opt-2',
              text: '我现在没时间',
              nextDialogueId: 'li-greeting-1',
            },
          ],
        },
      ],
      tradeDialogues: [
        {
          id: 'li-trade-1',
          npcId: 'li-farmer',
          text: '我有新鲜的麦子、玉米和大豆。你想买什么？',
          emotion: 'neutral',
          options: [
            {
              id: 'li-trade-opt-1',
              text: '我想买麦子',
              action: 'buy_wheat',
              reward: { type: 'item', amount: 10 },
            },
            {
              id: 'li-trade-opt-2',
              text: '我想买玉米',
              action: 'buy_corn',
              reward: { type: 'item', amount: 10 },
            },
            {
              id: 'li-trade-opt-3',
              text: '我想买大豆',
              action: 'buy_soybean',
              reward: { type: 'item', amount: 10 },
            },
            {
              id: 'li-trade-opt-4',
              text: '我先不买',
              nextDialogueId: 'li-greeting-1',
            },
          ],
        },
      ],
    });

    // NPC 2: 王温室管理员 - 对话配置
    this.addDialogueConfig({
      npcId: 'wang-greenhouse-manager',
      npcName: '王温室管理员',
      greetings: [
        {
          id: 'wang-greeting-1',
          npcId: 'wang-greenhouse-manager',
          text: '欢迎来到我的温室！这里种植了各种蔬菜和花卉。',
          emotion: 'happy',
          options: [
            {
              id: 'wang-greeting-opt-1',
              text: '你好！',
              nextDialogueId: 'wang-main-1',
            },
            {
              id: 'wang-greeting-opt-2',
              text: '我想购买蔬菜',
              nextDialogueId: 'wang-trade-1',
            },
          ],
        },
      ],
      mainDialogues: [
        {
          id: 'wang-main-1',
          npcId: 'wang-greenhouse-manager',
          text: '我在这个温室工作已经 5 年了。通过精心的管理，我们可以全年种植新鲜的蔬菜。',
          emotion: 'neutral',
          options: [
            {
              id: 'wang-main-opt-1',
              text: '这很了不起！',
              nextDialogueId: 'wang-main-2',
            },
            {
              id: 'wang-main-opt-2',
              text: '再见',
              nextDialogueId: 'wang-greeting-1',
            },
          ],
        },
        {
          id: 'wang-main-2',
          npcId: 'wang-greenhouse-manager',
          text: '是的，通过温度、湿度和光照的精确控制，我们可以创造最适合植物生长的环境。',
          emotion: 'happy',
          options: [
            {
              id: 'wang-main-opt-3',
              text: '我想学习温室管理',
              nextDialogueId: 'wang-main-3',
            },
            {
              id: 'wang-main-opt-4',
              text: '再见',
              nextDialogueId: 'wang-greeting-1',
            },
          ],
        },
        {
          id: 'wang-main-3',
          npcId: 'wang-greenhouse-manager',
          text: '很好！温室管理需要耐心和细心。我很乐意分享我的经验。',
          emotion: 'happy',
          options: [
            {
              id: 'wang-main-opt-5',
              text: '谢谢你！',
              nextDialogueId: 'wang-greeting-1',
            },
          ],
        },
      ],
      questDialogues: [
        {
          id: 'wang-quest-1',
          npcId: 'wang-greenhouse-manager',
          text: '我需要你帮我浇灌温室里的植物。你能帮我吗？',
          emotion: 'neutral',
          options: [
            {
              id: 'wang-quest-opt-1',
              text: '当然可以！',
              action: 'accept_quest',
              reward: { type: 'experience', amount: 80 },
            },
            {
              id: 'wang-quest-opt-2',
              text: '我现在没时间',
              nextDialogueId: 'wang-greeting-1',
            },
          ],
        },
      ],
      tradeDialogues: [
        {
          id: 'wang-trade-1',
          npcId: 'wang-greenhouse-manager',
          text: '我有新鲜的番茄、黄瓜和生菜。你想买什么？',
          emotion: 'neutral',
          options: [
            {
              id: 'wang-trade-opt-1',
              text: '我想买番茄',
              action: 'buy_tomato',
              reward: { type: 'item', amount: 5 },
            },
            {
              id: 'wang-trade-opt-2',
              text: '我想买黄瓜',
              action: 'buy_cucumber',
              reward: { type: 'item', amount: 5 },
            },
            {
              id: 'wang-trade-opt-3',
              text: '我想买生菜',
              action: 'buy_lettuce',
              reward: { type: 'item', amount: 5 },
            },
            {
              id: 'wang-trade-opt-4',
              text: '我先不买',
              nextDialogueId: 'wang-greeting-1',
            },
          ],
        },
      ],
    });
  }

  /**
   * 添加对话配置
   */
  public addDialogueConfig(config: NPCDialogueConfig): void {
    this.dialogueConfigs.set(config.npcId, config);
  }

  /**
   * 开始与 NPC 对话
   */
  public startDialogue(npcId: string): DialogueNode | null {
    const config = this.dialogueConfigs.get(npcId);
    if (!config || config.greetings.length === 0) {
      return null;
    }

    const greeting = config.greetings[0];
    this.currentDialogue = greeting;

    // 初始化对话状态
    const state: DialogueState = {
      npcId,
      currentDialogueId: greeting.id,
      dialogueHistory: [greeting.id],
      isActive: true,
    };
    this.dialogueStates.set(npcId, state);

    // 触发回调
    if (this.onDialogueChangeCallback) {
      this.onDialogueChangeCallback(greeting);
    }

    return greeting;
  }

  /**
   * 选择对话选项
   */
  public selectOption(npcId: string, optionId: string): DialogueNode | null {
    const state = this.dialogueStates.get(npcId);
    if (!state || !this.currentDialogue) {
      return null;
    }

    // 找到选中的选项
    const option = this.currentDialogue.options.find((opt) => opt.id === optionId);
    if (!option) {
      return null;
    }

    state.selectedOption = option;

    // 执行选项的动作
    if (option.action) {
      this.executeAction(npcId, option.action, option.reward);
    }

    // 获取下一个对话
    let nextDialogue: DialogueNode | null = null;
    if (option.nextDialogueId) {
      nextDialogue = this.getDialogueById(npcId, option.nextDialogueId);
    }

    if (nextDialogue) {
      this.currentDialogue = nextDialogue;
      state.currentDialogueId = nextDialogue.id;
      state.dialogueHistory.push(nextDialogue.id);

      // 触发回调
      if (this.onDialogueChangeCallback) {
        this.onDialogueChangeCallback(nextDialogue);
      }

      return nextDialogue;
    } else {
      // 对话结束
      this.endDialogue(npcId);
      return null;
    }
  }

  /**
   * 结束对话
   */
  public endDialogue(npcId: string): void {
    const state = this.dialogueStates.get(npcId);
    if (state) {
      state.isActive = false;
    }
    this.currentDialogue = null;

    // 触发回调
    if (this.onDialogueChangeCallback) {
      this.onDialogueChangeCallback(null);
    }
  }

  /**
   * 获取对话节点
   */
  private getDialogueById(npcId: string, dialogueId: string): DialogueNode | null {
    const config = this.dialogueConfigs.get(npcId);
    if (!config) {
      return null;
    }

    // 搜索所有对话类型
    const allDialogues = [
      ...config.greetings,
      ...config.mainDialogues,
      ...config.questDialogues,
      ...config.tradeDialogues,
    ];

    return allDialogues.find((d) => d.id === dialogueId) || null;
  }

  /**
   * 执行对话动作
   */
  private executeAction(
    npcId: string,
    action: string,
    reward?: { type: string; amount: number }
  ): void {
    console.log(`执行动作: ${action}, NPC: ${npcId}, 奖励:`, reward);
    // 这里可以添加实际的动作执行逻辑
    // 例如：接受任务、购买物品等
  }

  /**
   * 获取当前对话
   */
  public getCurrentDialogue(): DialogueNode | null {
    return this.currentDialogue;
  }

  /**
   * 获取对话状态
   */
  public getDialogueState(npcId: string): DialogueState | undefined {
    return this.dialogueStates.get(npcId);
  }

  /**
   * 设置对话变更回调
   */
  public setOnDialogueChangeCallback(callback: (dialogue: DialogueNode | null) => void): void {
    this.onDialogueChangeCallback = callback;
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.dialogueConfigs.clear();
    this.dialogueStates.clear();
    this.currentDialogue = null;
    this.onDialogueChangeCallback = null;
  }
}
