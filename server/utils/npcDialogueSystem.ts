/**
 * NPC AI 对话系统 (Phase 91-95)
 * 基于 LLM 的自然语言对话功能
 */

import { invokeLLM } from '../_core/llm';

export interface NPCCharacter {
  id: string;
  name: string;
  role: string;
  background: string;
  personality: string;
  language: string;
  location: string;
  expertise: string[];
  quests: string[];
}

export interface DialogueContext {
  playerId: string;
  npcId: string;
  conversationId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  startedAt: number;
  lastMessageAt: number;
  playerLevel: number;
  playerReputation: number;
}

export interface DialogueResponse {
  message: string;
  questHint?: string;
  reward?: { type: string; amount: number };
  nextAction?: string;
  emotion?: string;
}

export class NPCDialogueSystem {
  private contexts: Map<string, DialogueContext> = new Map();
  private npcCharacters: Map<string, NPCCharacter> = new Map();
  private conversationHistory: Map<string, DialogueContext[]> = new Map();

  /**
   * 初始化 NPC 角色
   */
  registerNPC(character: NPCCharacter): void {
    this.npcCharacters.set(character.id, character);
  }

  /**
   * 开始与 NPC 对话
   */
  startConversation(
    playerId: string,
    npcId: string,
    playerLevel: number,
    playerReputation: number
  ): DialogueContext {
    const npc = this.npcCharacters.get(npcId);
    if (!npc) {
      throw new Error(`NPC ${npcId} not found`);
    }

    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context: DialogueContext = {
      playerId,
      npcId,
      conversationId,
      messages: [],
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      playerLevel,
      playerReputation,
    };

    this.contexts.set(conversationId, context);

    // 记录对话历史
    if (!this.conversationHistory.has(playerId)) {
      this.conversationHistory.set(playerId, []);
    }
    this.conversationHistory.get(playerId)!.push(context);

    return context;
  }

  /**
   * 获取 NPC 系统提示词
   */
  private getNPCSystemPrompt(npc: NPCCharacter, context: DialogueContext): string {
    return `你是 Ice Snow City 游戏中的一个 NPC 角色。

角色信息：
- 名字：${npc.name}
- 职位：${npc.role}
- 背景：${npc.background}
- 性格：${npc.personality}
- 专长：${npc.expertise.join(', ')}
- 可提供的任务：${npc.quests.join(', ')}
- 所在位置：${npc.location}

玩家信息：
- 等级：${context.playerLevel}
- 声誉值：${context.playerReputation}

对话指南：
1. 始终保持角色设定，用第一人称说话
2. 根据玩家等级和声誉值调整对话内容
3. 提供有用的游戏建议和任务提示
4. 可以提供交易、任务或其他游戏内容
5. 保持对话自然、真实、有趣
6. 如果玩家询问游戏相关内容，提供有帮助的建议
7. 可以根据玩家的问题动态生成任务提示
8. 使用玩家的语言进行对话

请用自然、友好的方式回应玩家。`;
  }

  /**
   * 发送消息给 NPC 并获取响应
   */
  async sendMessage(conversationId: string, playerMessage: string): Promise<DialogueResponse> {
    const context = this.contexts.get(conversationId);
    if (!context) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const npc = this.npcCharacters.get(context.npcId);
    if (!npc) {
      throw new Error(`NPC ${context.npcId} not found`);
    }

    // 添加玩家消息到上下文
    context.messages.push({
      role: 'user',
      content: playerMessage,
    });

    // 构建 LLM 请求
    const systemPrompt = this.getNPCSystemPrompt(npc, context);

    try {
      const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
        ...context.messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ];

      const response = await invokeLLM({
        model: 'claude-sonnet-4-6',
        messages: llmMessages,
      });

      const messageContent = response.choices[0]?.message?.content;
      const assistantMessage =
        typeof messageContent === 'string' ? messageContent : 'I am not sure how to respond to that.';

      // 添加 AI 响应到上下文
      context.messages.push({
        role: 'assistant',
        content: assistantMessage as string,
      });

      context.lastMessageAt = Date.now();

      // 解析响应内容
      const dialogueResponse = this.parseDialogueResponse(assistantMessage, npc, context);

      return dialogueResponse;
    } catch (error) {
      console.error('Error invoking LLM:', error);
      throw new Error('Failed to generate NPC response');
    }
  }

  /**
   * 解析 NPC 响应
   */
  private parseDialogueResponse(
    message: string,
    npc: NPCCharacter,
    context: DialogueContext
  ): DialogueResponse {
    const response: DialogueResponse = {
      message,
      emotion: this.detectEmotion(message),
    };

    // 检测是否包含任务提示
    if (
      message.toLowerCase().includes('quest') ||
      message.toLowerCase().includes('task') ||
      message.toLowerCase().includes('mission')
    ) {
      response.questHint = this.generateQuestHint(npc, context);
    }

    // 检测是否包含奖励信息
    if (message.toLowerCase().includes('reward') || message.toLowerCase().includes('payment')) {
      response.reward = {
        type: 'ISC',
        amount: Math.floor(Math.random() * 1000) + 100,
      };
    }

    // 检测下一步行动
    if (message.toLowerCase().includes('accept') || message.toLowerCase().includes('agree')) {
      response.nextAction = 'quest_accepted';
    } else if (
      message.toLowerCase().includes('decline') ||
      message.toLowerCase().includes('refuse')
    ) {
      response.nextAction = 'quest_declined';
    }

    return response;
  }

  /**
   * 检测情感
   */
  private detectEmotion(message: string): string {
    const emotions: { [key: string]: string[] } = {
      happy: ['great', 'wonderful', 'excellent', 'amazing', '😊', '😄'],
      sad: ['sorry', 'unfortunately', 'sad', 'disappointed', '😢'],
      angry: ['angry', 'furious', 'upset', 'frustrated', '😠'],
      neutral: [],
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some((keyword) => message.toLowerCase().includes(keyword))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  /**
   * 生成任务提示
   */
  private generateQuestHint(npc: NPCCharacter, context: DialogueContext): string {
    const availableQuests = npc.quests.filter((quest) => {
      // 根据玩家等级过滤任务
      return context.playerLevel >= 1;
    });

    if (availableQuests.length === 0) {
      return 'I do not have any quests available for you right now.';
    }

    const selectedQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];
    return `I have a quest for you: ${selectedQuest}. Would you like to accept it?`;
  }

  /**
   * 获取对话历史
   */
  getConversationHistory(playerId: string): DialogueContext[] {
    return this.conversationHistory.get(playerId) || [];
  }

  /**
   * 结束对话
   */
  endConversation(conversationId: string): void {
    this.contexts.delete(conversationId);
  }

  /**
   * 获取活跃对话
   */
  getActiveConversation(playerId: string, npcId: string): DialogueContext | null {
    const contextsArray = Array.from(this.contexts.values());
    for (let i = 0; i < contextsArray.length; i++) {
      const context = contextsArray[i];
      if (context.playerId === playerId && context.npcId === npcId) {
        return context;
      }
    }
    return null;
  }

  /**
   * 系统统计
   */
  getSystemStats() {
    const historyArray = Array.from(this.conversationHistory.values());
    let totalConversations = 0;
    for (let i = 0; i < historyArray.length; i++) {
      totalConversations += historyArray[i].length;
    }

    return {
      totalNPCs: this.npcCharacters.size,
      activeConversations: this.contexts.size,
      totalConversations,
    };
  }
}

export default NPCDialogueSystem;
