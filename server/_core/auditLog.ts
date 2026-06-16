/**
 * Audit Logging Service for Ice Snow City Admin Agent
 * 
 * Provides comprehensive audit trail for all administrative actions,
 * contract interactions, and security-sensitive operations.
 */

import { getDb } from "../db";
import { desc, and, eq, gte, lte } from "drizzle-orm";

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: "success" | "failure";
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resource?: string;
  status?: "success" | "failure";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  totalEntries: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  actionSummary: Record<string, number>;
  userSummary: Record<string, number>;
  failureRate: number;
  entries: AuditLogEntry[];
}

export class AuditLogService {
  /**
   * Log an administrative action
   */
  async logAction(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry> {
    const id = this.generateId();
    const timestamp = new Date();

    const logEntry: AuditLogEntry = {
      id,
      timestamp,
      ...entry,
    };

    try {
      // Store in memory or database
      // For now, just log to console
      console.log(`[AuditLog] Action logged: ${entry.action} on ${entry.resource} by ${entry.userId}`);
      return logEntry;
    } catch (error) {
      console.error("[AuditLog] Failed to log action:", error);
      throw error;
    }
  }

  /**
   * Query audit logs with filtering
   */
  async queryLogs(filter: AuditLogFilter = {}): Promise<AuditLogEntry[]> {
    // For now, return empty array
    // In production, this would query from database
    console.log("[AuditLog] Querying logs with filter:", filter);
    return [];
  }

  /**
   * Generate audit report
   */
  async generateReport(
    startDate: Date,
    endDate: Date,
    limit: number = 1000
  ): Promise<AuditReport> {
    const entries = await this.queryLogs({
      startDate,
      endDate,
      limit,
    });

    // Calculate statistics
    const actionSummary: Record<string, number> = {};
    const userSummary: Record<string, number> = {};
    let failureCount = 0;

    for (const entry of entries) {
      // Action summary
      actionSummary[entry.action] = (actionSummary[entry.action] || 0) + 1;

      // User summary
      userSummary[entry.userId] = (userSummary[entry.userId] || 0) + 1;

      // Failure count
      if (entry.status === "failure") {
        failureCount++;
      }
    }

    const failureRate = entries.length > 0 ? (failureCount / entries.length) * 100 : 0;

    return {
      totalEntries: entries.length,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      actionSummary,
      userSummary,
      failureRate,
      entries,
    };
  }

  /**
   * Export audit logs as JSON
   */
  async exportAsJSON(filter: AuditLogFilter = {}): Promise<string> {
    const entries = await this.queryLogs(filter);
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Export audit logs as CSV
   */
  async exportAsCSV(filter: AuditLogFilter = {}): Promise<string> {
    const entries = await this.queryLogs(filter);

    if (entries.length === 0) {
      return "id,timestamp,userId,action,resource,resourceId,status,details,ipAddress,userAgent,errorMessage\n";
    }

    const headers = [
      "id",
      "timestamp",
      "userId",
      "action",
      "resource",
      "resourceId",
      "status",
      "details",
      "ipAddress",
      "userAgent",
      "errorMessage",
    ];

    const rows = entries.map((entry) => [
      this.escapeCSV(entry.id),
      this.escapeCSV(entry.timestamp.toISOString()),
      this.escapeCSV(entry.userId),
      this.escapeCSV(entry.action),
      this.escapeCSV(entry.resource),
      this.escapeCSV(entry.resourceId || ""),
      this.escapeCSV(entry.status),
      this.escapeCSV(JSON.stringify(entry.details)),
      this.escapeCSV(entry.ipAddress || ""),
      this.escapeCSV(entry.userAgent || ""),
      this.escapeCSV(entry.errorMessage || ""),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    return csv;
  }

  /**
   * Get audit statistics
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<{
    totalActions: number;
    successRate: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    const report = await this.generateReport(startDate, endDate);

    const topActions = Object.entries(report.actionSummary)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topUsers = Object.entries(report.userSummary)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActions: report.totalEntries,
      successRate: 100 - report.failureRate,
      topActions,
      topUsers,
    };
  }

  /**
   * Clean up old audit logs
   */
  async cleanup(olderThanDays: number = 90): Promise<number> {
    console.log(`[AuditLog] Cleanup scheduled for logs older than ${olderThanDays} days`);
    return 0;
  }

  /**
   * Helper: Generate unique ID
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Escape CSV values
   */
  private escapeCSV(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
