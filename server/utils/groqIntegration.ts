/**
 * Groq LLM 集成模块
 * 使用 Groq 免费 API 进行 NPC 对话生成
 */

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NPCDialogueRequest {
  npcName: string;
  npcPersonality: string;
  playerMessage: string;
  conversationHistory: GroqMessage[];
  playerLevel?: number;
  playerReputation?: number;
}

export interface NPCDialogueResponse {
  response: string;
  emotion: string;
  questHint?: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export class GroqIntegration {
  private apiKey: string;
  private apiUrl: string = 'https://api.groq.com/openai/v1/chat/completions';
  private model: string = 'mixtral-8x7b-32768'; // Groq 推荐的快速模型
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private rateLimitDelay: number = 100; // 毫秒

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Warning: GROQ_API_KEY not set. Groq integration may not work.');
    }
  }

  /**
   * 生成 NPC 系统提示词
   */
  private generateSystemPrompt(npcName: string, npcPersonality: string, playerLevel: number, playerReputation: number): string {
    return `You are ${npcName}, an NPC in the Ice Snow City game.

Personality: ${npcPersonality}

Player Information:
- Level: ${playerLevel}
- Reputation: ${playerReputation}

Guidelines:
1. Stay in character at all times
2. Respond naturally and conversationally
3. Be helpful but maintain your personality
4. Keep responses concise (1-3 sentences)
5. If appropriate, provide a quest hint or task suggestion
6. Use appropriate emotions (happy, sad, angry, neutral)

Respond in a natural, engaging way that fits your character.`;
  }

  /**
   * 调用 Groq API 生成对话
   */
  async generateDialogue(request: NPCDialogueRequest): Promise<NPCDialogueResponse> {
    // 速率限制
    await this.enforceRateLimit();

    // 构建消息
    const systemPrompt = this.generateSystemPrompt(
      request.npcName,
      request.npcPersonality,
      request.playerLevel || 1,
      request.playerReputation || 0
    );

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      ...request.conversationHistory,
      { role: 'user', content: request.playerMessage },
    ];

    try {
      const response = await this.callGroqAPI(messages);
      const npcResponse = response.choices[0].message.content;

      return {
        response: npcResponse,
        emotion: this.detectEmotion(npcResponse),
        questHint: this.extractQuestHint(npcResponse),
        tokens: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw new Error('Failed to generate NPC dialogue');
    }
  }

  /**
   * 调用 Groq API
   */
  private async callGroqAPI(messages: GroqMessage[]): Promise<GroqResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * 速率限制
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * 检测情感
   */
  private detectEmotion(text: string): string {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('wonderful') ||
      lowerText.includes('amazing') ||
      lowerText.includes('great') ||
      lowerText.includes('excellent')
    ) {
      return 'happy';
    } else if (
      lowerText.includes('sorry') ||
      lowerText.includes('sad') ||
      lowerText.includes('unfortunate') ||
      lowerText.includes('terrible')
    ) {
      return 'sad';
    } else if (
      lowerText.includes('angry') ||
      lowerText.includes('furious') ||
      lowerText.includes('outraged')
    ) {
      return 'angry';
    }

    return 'neutral';
  }

  /**
   * 提取任务提示
   */
  private extractQuestHint(text: string): string | undefined {
    const questKeywords = ['quest', 'task', 'mission', 'help', 'need', 'want'];
    const lowerText = text.toLowerCase();

    if (questKeywords.some((keyword) => lowerText.includes(keyword))) {
      // 返回最后一句作为任务提示
      const sentences = text.split(/[.!?]+/);
      const lastSentence = sentences[sentences.length - 2]?.trim();
      return lastSentence || undefined;
    }

    return undefined;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      model: this.model,
      apiUrl: this.apiUrl,
    };
  }

  /**
   * 设置模型
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels(): string[] {
    return [
      'mixtral-8x7b-32768', // 推荐，速度快
      'llama2-70b-4096',
      'gemma-7b-it',
    ];
  }
}

export default GroqIntegration;
