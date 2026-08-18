/**
 * 对话记录导出和分享系统
 * Phase 105: 对话记录导出和分享
 */

import { SearchResult } from './dialogueHistorySearch';

export interface ExportFormat {
  format: 'json' | 'csv' | 'markdown' | 'pdf';
  includeTimestamps: boolean;
  includeEmotions: boolean;
  includeQuestHints: boolean;
  includeAudio: boolean;
}

export interface ShareSettings {
  shareId: string;
  playerId: string;
  questId?: string;
  npcName?: string;
  createdAt: number;
  expiresAt: number;
  isPublic: boolean;
  allowComments: boolean;
  accessCount: number;
}

export interface ExportedDialogue {
  exportId: string;
  playerId: string;
  exportedAt: number;
  format: string;
  recordCount: number;
  fileSize: number;
  content: string;
  metadata: {
    npcCount: number;
    messageCount: number;
    voiceMessageCount: number;
    textMessageCount: number;
    questHintCount: number;
    dateRange: {
      start: number;
      end: number;
    };
  };
}

export class DialogueExporter {
  private exports: Map<string, ExportedDialogue> = new Map();
  private shares: Map<string, ShareSettings> = new Map();
  private shareIndex: Map<string, string> = new Map();

  /**
   * 导出为 JSON 格式
   */
  exportToJSON(results: SearchResult[], options: ExportFormat): string {
    const data = {
      exportedAt: Date.now(),
      recordCount: results.length,
      records: results.map((result) => ({
        sessionId: result.sessionId,
        npcName: result.npcName,
        messageId: result.messageId,
        content: result.content,
        timestamp: options.includeTimestamps ? result.timestamp : undefined,
        type: result.type,
        emotion: options.includeEmotions ? result.emotion : undefined,
        questHint: options.includeQuestHints ? result.questHint : undefined,
        relevanceScore: result.relevanceScore,
      })),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导出为 CSV 格式
   */
  exportToCSV(results: SearchResult[], options: ExportFormat): string {
    const headers = [
      'Session ID',
      'NPC Name',
      'Message ID',
      'Content',
      options.includeTimestamps ? 'Timestamp' : '',
      'Type',
      options.includeEmotions ? 'Emotion' : '',
      options.includeQuestHints ? 'Quest Hint' : '',
      'Relevance Score',
    ]
      .filter((h) => h)
      .join(',');

    const rows = results.map((result) => {
      const row = [
        this.escapeCsvField(result.sessionId),
        this.escapeCsvField(result.npcName),
        this.escapeCsvField(result.messageId),
        this.escapeCsvField(result.content),
      ];

      if (options.includeTimestamps) {
        row.push(result.timestamp.toString());
      }

      row.push(this.escapeCsvField(result.type));

      if (options.includeEmotions) {
        row.push(this.escapeCsvField(result.emotion || ''));
      }

      if (options.includeQuestHints) {
        row.push(this.escapeCsvField(result.questHint || ''));
      }

      row.push(result.relevanceScore.toString());

      return row.join(',');
    });

    return [headers, ...rows].join('\n');
  }

  /**
   * 导出为 Markdown 格式
   */
  exportToMarkdown(results: SearchResult[], options: ExportFormat): string {
    let markdown = `# Dialogue Export\n\n`;
    markdown += `**Exported at:** ${new Date(Date.now()).toISOString()}\n`;
    markdown += `**Total Records:** ${results.length}\n\n`;

    // 按 NPC 分组
    const groupedByNPC = new Map<string, SearchResult[]>();
    results.forEach((result) => {
      if (!groupedByNPC.has(result.npcName)) {
        groupedByNPC.set(result.npcName, []);
      }
      groupedByNPC.get(result.npcName)!.push(result);
    });

    groupedByNPC.forEach((npcResults, npcName) => {
      markdown += `## ${npcName}\n\n`;

      npcResults.forEach((result) => {
        markdown += `### Message ${result.messageId}\n\n`;

        if (options.includeTimestamps) {
          markdown += `**Time:** ${new Date(result.timestamp).toISOString()}\n\n`;
        }

        markdown += `**Type:** ${result.type}\n\n`;

        if (options.includeEmotions && result.emotion) {
          markdown += `**Emotion:** ${result.emotion}\n\n`;
        }

        markdown += `**Content:**\n\n${result.content}\n\n`;

        if (options.includeQuestHints && result.questHint) {
          markdown += `**Quest Hint:** ${result.questHint}\n\n`;
        }

        markdown += `---\n\n`;
      });
    });

    return markdown;
  }

  /**
   * 导出为 PDF 格式（返回 HTML，可转换为 PDF）
   */
  exportToPDF(results: SearchResult[], options: ExportFormat): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Dialogue Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 20px; }
    .message { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
    .timestamp { color: #999; font-size: 0.9em; }
    .emotion { color: #0066cc; font-weight: bold; }
    .quest-hint { background-color: #fffacd; padding: 5px; }
  </style>
</head>
<body>
  <h1>Dialogue Export</h1>
  <p>Exported at: ${new Date(Date.now()).toISOString()}</p>
  <p>Total Records: ${results.length}</p>
`;

    const groupedByNPC = new Map<string, SearchResult[]>();
    results.forEach((result) => {
      if (!groupedByNPC.has(result.npcName)) {
        groupedByNPC.set(result.npcName, []);
      }
      groupedByNPC.get(result.npcName)!.push(result);
    });

    groupedByNPC.forEach((npcResults, npcName) => {
      html += `<h2>${npcName}</h2>`;

      npcResults.forEach((result) => {
        html += `<div class="message">`;
        html += `<p><strong>Message ID:</strong> ${result.messageId}</p>`;

        if (options.includeTimestamps) {
          html += `<p class="timestamp"><strong>Time:</strong> ${new Date(result.timestamp).toISOString()}</p>`;
        }

        html += `<p><strong>Type:</strong> ${result.type}</p>`;

        if (options.includeEmotions && result.emotion) {
          html += `<p class="emotion"><strong>Emotion:</strong> ${result.emotion}</p>`;
        }

        html += `<p><strong>Content:</strong></p>`;
        html += `<p>${result.content}</p>`;

        if (options.includeQuestHints && result.questHint) {
          html += `<div class="quest-hint"><strong>Quest Hint:</strong> ${result.questHint}</div>`;
        }

        html += `</div>`;
      });
    });

    html += `</body></html>`;
    return html;
  }

  /**
   * 执行导出
   */
  export(
    playerId: string,
    results: SearchResult[],
    format: ExportFormat,
  ): ExportedDialogue {
    let content: string;

    switch (format.format) {
      case 'json':
        content = this.exportToJSON(results, format);
        break;
      case 'csv':
        content = this.exportToCSV(results, format);
        break;
      case 'markdown':
        content = this.exportToMarkdown(results, format);
        break;
      case 'pdf':
        content = this.exportToPDF(results, format);
        break;
      default:
        content = this.exportToJSON(results, format);
    }

    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 计算元数据
    const npcSet = new Set<string>();
    let voiceCount = 0;
    let textCount = 0;
    let questHintCount = 0;
    let minTime = Date.now();
    let maxTime = 0;

    results.forEach((result) => {
      npcSet.add(result.npcName);
      if (result.type === 'voice') {
        voiceCount++;
      } else {
        textCount++;
      }
      if (result.questHint) {
        questHintCount++;
      }
      minTime = Math.min(minTime, result.timestamp);
      maxTime = Math.max(maxTime, result.timestamp);
    });

    const exported: ExportedDialogue = {
      exportId,
      playerId,
      exportedAt: Date.now(),
      format: format.format,
      recordCount: results.length,
      fileSize: content.length,
      content,
      metadata: {
        npcCount: npcSet.size,
        messageCount: results.length,
        voiceMessageCount: voiceCount,
        textMessageCount: textCount,
        questHintCount,
        dateRange: {
          start: minTime,
          end: maxTime,
        },
      },
    };

    this.exports.set(exportId, exported);
    return exported;
  }

  /**
   * 创建分享
   */
  createShare(
    playerId: string,
    exportId: string,
    expirationDays: number = 7,
    isPublic: boolean = false,
  ): ShareSettings | null {
    const exported = this.exports.get(exportId);
    if (!exported || exported.playerId !== playerId) {
      return null;
    }

    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const expiresAt = now + expirationDays * 24 * 60 * 60 * 1000;

    const share: ShareSettings = {
      shareId,
      playerId,
      createdAt: now,
      expiresAt,
      isPublic,
      allowComments: false,
      accessCount: 0,
    };

    this.shares.set(shareId, share);
    this.shareIndex.set(shareId, exportId);
    return share;
  }

  /**
   * 获取分享
   */
  getShare(shareId: string): ShareSettings | null {
    const share = this.shares.get(shareId);
    if (!share) {
      return null;
    }

    // 检查是否过期
    if (share.expiresAt < Date.now()) {
      this.shares.delete(shareId);
      this.shareIndex.delete(shareId);
      return null;
    }

    share.accessCount++;
    return share;
  }

  /**
   * 获取分享的导出内容
   */
  getSharedExport(shareId: string): ExportedDialogue | null {
    const share = this.getShare(shareId);
    if (!share) {
      return null;
    }

    const exportId = this.shareIndex.get(shareId);
    if (!exportId) {
      return null;
    }

    return this.exports.get(exportId) || null;
  }

  /**
   * 删除分享
   */
  deleteShare(shareId: string, playerId: string): boolean {
    const share = this.shares.get(shareId);
    if (!share || share.playerId !== playerId) {
      return false;
    }

    this.shares.delete(shareId);
    this.shareIndex.delete(shareId);
    return true;
  }

  /**
   * 删除导出
   */
  deleteExport(exportId: string, playerId: string): boolean {
    const exported = this.exports.get(exportId);
    if (!exported || exported.playerId !== playerId) {
      return false;
    }

    // 删除相关的分享
    const sharesToDelete: string[] = [];
    this.shareIndex.forEach((expId, shareId) => {
      if (expId === exportId) {
        sharesToDelete.push(shareId);
      }
    });

    sharesToDelete.forEach((shareId) => {
      this.shares.delete(shareId);
      this.shareIndex.delete(shareId);
    });

    this.exports.delete(exportId);
    return true;
  }

  /**
   * 获取玩家的所有导出
   */
  getPlayerExports(playerId: string): ExportedDialogue[] {
    const results: ExportedDialogue[] = [];
    this.exports.forEach((exported) => {
      if (exported.playerId === playerId) {
        results.push(exported);
      }
    });
    return results;
  }

  /**
   * 获取玩家的所有分享
   */
  getPlayerShares(playerId: string): ShareSettings[] {
    const results: ShareSettings[] = [];
    this.shares.forEach((share) => {
      if (share.playerId === playerId && share.expiresAt >= Date.now()) {
        results.push(share);
      }
    });
    return results;
  }

  /**
   * 清理过期的分享
   */
  cleanupExpiredShares(): number {
    const now = Date.now();
    const toDelete: string[] = [];

    this.shares.forEach((share, shareId) => {
      if (share.expiresAt < now) {
        toDelete.push(shareId);
      }
    });

    toDelete.forEach((shareId) => {
      this.shares.delete(shareId);
      this.shareIndex.delete(shareId);
    });

    return toDelete.length;
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.exports.clear();
    this.shares.clear();
    this.shareIndex.clear();
  }

  /**
   * 转义 CSV 字段
   */
  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}

export default DialogueExporter;
