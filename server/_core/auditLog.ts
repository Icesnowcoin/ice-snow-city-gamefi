/**
 * Audit Logging Service for Ice Snow City Admin Agent
 * 
 * Provides comprehensive audit trail for all administrative actions,
 * contract interactions, and security-sensitive operations.
 */

import {
  insertAuditLog,
  queryAuditLogs,
  getAuditLogCount,
  deleteOldAuditLogs,
  getAuditStatistics,
} from "../db.audit";
import { type InsertAuditLog } from "../../drizzle/schema";

export interface AuditLogEntry {
  id: number;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  status: "success" | "failure";
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
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
  successRate: number;
  entries: AuditLogEntry[];
}

export class AuditLogService {
  /**
   * Log an administrative action
   */
  async logAction(entry: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    status: "success" | "failure";
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const dbEntry: InsertAuditLog = {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId || null,
        status: entry.status,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        errorMessage: entry.errorMessage || null,
      };

      await insertAuditLog(dbEntry);
      console.log(
        `[AuditLog] Action logged: ${entry.action} on ${entry.resource} by ${entry.userId}`
      );
    } catch (error) {
      console.error("[AuditLog] Failed to log action:", error);
      throw error;
    }
  }

  /**
   * Query audit logs with filtering
   */
  async queryLogs(filter: AuditLogFilter = {}): Promise<AuditLogEntry[]> {
    try {
      const logs = await queryAuditLogs({
        userId: filter.userId,
        action: filter.action,
        resource: filter.resource,
        status: filter.status,
        startDate: filter.startDate,
        endDate: filter.endDate,
        limit: filter.limit || 100,
        offset: filter.offset || 0,
      });

      // Parse JSON details field
      return logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      }));
    } catch (error) {
      console.error("[AuditLog] Failed to query logs:", error);
      return [];
    }
  }

  /**
   * Get audit log count
   */
  async getLogCount(filter: AuditLogFilter = {}): Promise<number> {
    try {
      return await getAuditLogCount({
        userId: filter.userId,
        action: filter.action,
        resource: filter.resource,
        status: filter.status,
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    } catch (error) {
      console.error("[AuditLog] Failed to get log count:", error);
      return 0;
    }
  }

  /**
   * Generate audit report
   */
  async generateReport(startDate: Date, endDate: Date): Promise<AuditReport> {
    try {
      const stats = await getAuditStatistics(startDate, endDate);
      const entries = await this.queryLogs({
        startDate,
        endDate,
        limit: 1000,
      });

      return {
        totalEntries: stats.totalActions,
        dateRange: { start: startDate, end: endDate },
        actionSummary: stats.actionSummary,
        userSummary: stats.userSummary,
        successRate: stats.successRate,
        entries,
      };
    } catch (error) {
      console.error("[AuditLog] Failed to generate report:", error);
      return {
        totalEntries: 0,
        dateRange: { start: startDate, end: endDate },
        actionSummary: {},
        userSummary: {},
        successRate: 0,
        entries: [],
      };
    }
  }

  /**
   * Export audit logs as JSON
   */
  async exportAsJSON(startDate: Date, endDate: Date): Promise<string> {
    try {
      const report = await this.generateReport(startDate, endDate);
      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error("[AuditLog] Failed to export as JSON:", error);
      return JSON.stringify({ error: "Export failed" });
    }
  }

  /**
   * Export audit logs as CSV
   */
  async exportAsCSV(startDate: Date, endDate: Date): Promise<string> {
    try {
      const entries = await this.queryLogs({
        startDate,
        endDate,
        limit: 10000,
      });

      if (entries.length === 0) {
        return "No audit logs found";
      }

      // CSV header
      const headers = [
        "ID",
        "Timestamp",
        "User ID",
        "Action",
        "Resource",
        "Resource ID",
        "Status",
        "Details",
        "IP Address",
        "User Agent",
        "Error Message",
      ];

      // CSV rows
      const rows = entries.map((log) => [
        log.id,
        log.timestamp.toISOString(),
        log.userId,
        log.action,
        log.resource,
        log.resourceId || "",
        log.status,
        log.details ? JSON.stringify(log.details) : "",
        log.ipAddress || "",
        log.userAgent || "",
        log.errorMessage || "",
      ]);

      // Combine headers and rows
      const csv = [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              // Escape quotes and wrap in quotes if contains comma
              const str = String(cell);
              if (str.includes(",") || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(",")
        )
        .join("\n");

      return csv;
    } catch (error) {
      console.error("[AuditLog] Failed to export as CSV:", error);
      return "Export failed";
    }
  }

  /**
   * Cleanup old audit logs (alias for cleanupOldLogs)
   */
  async cleanup(retentionDays: number = 90): Promise<number> {
    try {
      const deletedCount = await deleteOldAuditLogs(retentionDays);
      console.log(
        `[AuditLog] Cleaned up ${deletedCount} logs older than ${retentionDays} days`
      );
      return deletedCount || 0;
    } catch (error) {
      console.error("[AuditLog] Failed to cleanup old logs:", error);
      return 0;
    }
  }

  /**
   * Cleanup old audit logs
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<void> {
    try {
      await deleteOldAuditLogs(retentionDays);
      console.log(
        `[AuditLog] Cleanup scheduled for logs older than ${retentionDays} days`
      );
    } catch (error) {
      console.error("[AuditLog] Failed to cleanup old logs:", error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(startDate: Date, endDate: Date) {
    try {
      return await getAuditStatistics(startDate, endDate);
    } catch (error) {
      console.error("[AuditLog] Failed to get statistics:", error);
      return {
        totalActions: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        actionSummary: {},
        userSummary: {},
      };
    }
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
