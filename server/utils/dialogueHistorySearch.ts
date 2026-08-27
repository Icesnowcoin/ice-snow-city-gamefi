/**
 * 对话历史搜索和筛选系统
 * Phase 103: 互动历史显示和搜索
 */

export interface SearchFilter {
  query?: string;
  npcName?: string;
  messageType?: 'text' | 'voice' | 'all';
  emotion?: string;
  startDate?: number;
  endDate?: number;
  hasQuestHint?: boolean;
}

export interface SearchResult {
  sessionId: string;
  npcName: string;
  messageId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'voice';
  emotion?: string;
  questHint?: string;
  relevanceScore: number;
}

export class DialogueHistorySearch {
  private dialogueSessions: Map<string, any> = new Map();
  private searchIndex: Map<string, SearchResult[]> = new Map();

  /**
   * 添加对话会话
   */
  addSession(sessionId: string, session: any): void {
    this.dialogueSessions.set(sessionId, session);
    this.updateSearchIndex(sessionId, session);
  }

  /**
   * 更新搜索索引
   */
  private updateSearchIndex(sessionId: string, session: any): void {
    const results: SearchResult[] = [];

    session.messages.forEach((msg: any) => {
      const result: SearchResult = {
        sessionId,
        npcName: session.npcName,
        messageId: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.type,
        emotion: msg.emotion,
        questHint: msg.questHint,
        relevanceScore: 0,
      };
      results.push(result);
    });

    this.searchIndex.set(sessionId, results);
  }

  /**
   * 搜索对话
   */
  search(filter: SearchFilter): SearchResult[] {
    const results: SearchResult[] = [];

    this.searchIndex.forEach((sessionResults) => {
      for (const result of sessionResults) {
        if (this.matchesFilter(result, filter)) {
          result.relevanceScore = this.calculateRelevance(result, filter);
          results.push(result);
        }
      }
    });

    // 按相关性排序
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results;
  }

  /**
   * 检查是否匹配筛选条件
   */
  private matchesFilter(result: SearchResult, filter: SearchFilter): boolean {
    // 查询文本
    if (filter.query) {
      const query = filter.query.toLowerCase();
      if (!result.content.toLowerCase().includes(query)) {
        return false;
      }
    }

    // NPC 名称
    if (filter.npcName && result.npcName !== filter.npcName) {
      return false;
    }

    // 消息类型
    if (filter.messageType && filter.messageType !== 'all' && result.type !== filter.messageType) {
      return false;
    }

    // 情感
    if (filter.emotion && result.emotion !== filter.emotion) {
      return false;
    }

    // 日期范围
    if (filter.startDate && result.timestamp < filter.startDate) {
      return false;
    }
    if (filter.endDate && result.timestamp > filter.endDate) {
      return false;
    }

    // 是否有任务提示
    if (filter.hasQuestHint !== undefined) {
      const hasHint = !!result.questHint;
      if (filter.hasQuestHint !== hasHint) {
        return false;
      }
    }

    return true;
  }

  /**
   * 计算相关性分数
   */
  private calculateRelevance(result: SearchResult, filter: SearchFilter): number {
    let score = 0;

    // 查询匹配
    if (filter.query) {
      const query = filter.query.toLowerCase();
      const content = result.content.toLowerCase();

      // 完全匹配
      if (content === query) {
        score += 100;
      }
      // 开头匹配
      else if (content.startsWith(query)) {
        score += 50;
      }
      // 包含匹配
      else if (content.includes(query)) {
        score += 25;
      }
    }

    // NPC 匹配
    if (filter.npcName === result.npcName) {
      score += 10;
    }

    // 消息类型匹配
    if (filter.messageType === result.type) {
      score += 5;
    }

    // 情感匹配
    if (filter.emotion === result.emotion) {
      score += 5;
    }

    // 任务提示匹配
    if (filter.hasQuestHint && result.questHint) {
      score += 15;
    }

    return score;
  }

  /**
   * 获取所有 NPC 名称
   */
  getNPCNames(): string[] {
    const names = new Set<string>();
    this.dialogueSessions.forEach((session) => {
      names.add(session.npcName);
    });
    return Array.from(names);
  }

  /**
   * 获取所有情感类型
   */
  getEmotions(): string[] {
    const emotions = new Set<string>();
    this.searchIndex.forEach((results) => {
      results.forEach((result) => {
        if (result.emotion) {
          emotions.add(result.emotion);
        }
      });
    });
    return Array.from(emotions);
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    let totalMessages = 0;
    let totalVoiceMessages = 0;
    let totalTextMessages = 0;
    let totalQuestHints = 0;

    this.searchIndex.forEach((results) => {
      results.forEach((result) => {
        totalMessages++;
        if (result.type === 'voice') {
          totalVoiceMessages++;
        } else {
          totalTextMessages++;
        }
        if (result.questHint) {
          totalQuestHints++;
        }
      });
    });

    return {
      totalSessions: this.dialogueSessions.size,
      totalMessages,
      totalVoiceMessages,
      totalTextMessages,
      totalQuestHints,
      npcCount: this.getNPCNames().length,
    };
  }

  /**
   * 按 NPC 分组搜索结果
   */
  groupByNPC(results: SearchResult[]): Map<string, SearchResult[]> {
    const grouped = new Map<string, SearchResult[]>();

    results.forEach((result) => {
      if (!grouped.has(result.npcName)) {
        grouped.set(result.npcName, []);
      }
      grouped.get(result.npcName)!.push(result);
    });

    return grouped;
  }

  /**
   * 按日期分组搜索结果
   */
  groupByDate(results: SearchResult[]): Map<string, SearchResult[]> {
    const grouped = new Map<string, SearchResult[]>();

    results.forEach((result) => {
      const date = new Date(result.timestamp).toLocaleDateString();
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(result);
    });

    return grouped;
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.dialogueSessions.clear();
    this.searchIndex.clear();
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    const deleted1 = this.dialogueSessions.delete(sessionId);
    const deleted2 = this.searchIndex.delete(sessionId);
    return deleted1 || deleted2;
  }
}

export default DialogueHistorySearch;
