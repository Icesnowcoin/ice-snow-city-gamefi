/**
 * Audit Log Database Helpers
 * 
 * Provides database operations for audit logging functionality.
 */

import { desc, eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { auditLogs, type InsertAuditLog } from "../drizzle/schema";

/**
 * Insert an audit log entry
 */
export async function insertAuditLog(entry: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditLog] Cannot insert audit log: database not available");
    return;
  }

  try {
    await db.insert(auditLogs).values(entry);
    console.log(`[AuditLog] Logged action: ${entry.action} on ${entry.resource}`);
  } catch (error) {
    console.error("[AuditLog] Failed to insert audit log:", error);
    throw error;
  }
}

/**
 * Query audit logs with filtering
 */
export async function queryAuditLogs(options: {
  userId?: string;
  action?: string;
  resource?: string;
  status?: "success" | "failure";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
} = {}) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions: any[] = [];

    if (options.userId) {
      conditions.push(eq(auditLogs.userId, options.userId));
    }

    if (options.action) {
      conditions.push(eq(auditLogs.action, options.action));
    }

    if (options.resource) {
      conditions.push(eq(auditLogs.resource, options.resource));
    }

    if (options.status) {
      conditions.push(eq(auditLogs.status, options.status));
    }

    if (options.startDate) {
      conditions.push(gte(auditLogs.timestamp, options.startDate));
    }

    if (options.endDate) {
      conditions.push(lte(auditLogs.timestamp, options.endDate));
    }

    let query = db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    if (options.limit) {
      query = query.limit(options.limit) as typeof query;
    }

    if (options.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return await query;
  } catch (error) {
    console.error("[AuditLog] Failed to query audit logs:", error);
    return [];
  }
}

/**
 * Get audit log count
 */
export async function getAuditLogCount(options: {
  userId?: string;
  action?: string;
  resource?: string;
  status?: "success" | "failure";
  startDate?: Date;
  endDate?: Date;
} = {}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const conditions: any[] = [];

    if (options.userId) {
      conditions.push(eq(auditLogs.userId, options.userId));
    }

    if (options.action) {
      conditions.push(eq(auditLogs.action, options.action));
    }

    if (options.resource) {
      conditions.push(eq(auditLogs.resource, options.resource));
    }

    if (options.status) {
      conditions.push(eq(auditLogs.status, options.status));
    }

    if (options.startDate) {
      conditions.push(gte(auditLogs.timestamp, options.startDate));
    }

    if (options.endDate) {
      conditions.push(lte(auditLogs.timestamp, options.endDate));
    }

    let query = db.select().from(auditLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const result = await query;
    return result.length;
  } catch (error) {
    console.error("[AuditLog] Failed to get audit log count:", error);
    return 0;
  }
}

/**
 * Delete old audit logs (retention policy)
 */
export async function deleteOldAuditLogs(olderThanDays: number = 90): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    await db.delete(auditLogs).where(lte(auditLogs.timestamp, cutoffDate));

    console.log(`[AuditLog] Deleted audit logs older than ${olderThanDays} days`);
    return 1;
  } catch (error) {
    console.error("[AuditLog] Failed to delete old audit logs:", error);
    return 0;
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(startDate: Date, endDate: Date) {
  const logs = await queryAuditLogs({
    startDate,
    endDate,
    limit: 10000,
  });

  const actionSummary: Record<string, number> = {};
  const userSummary: Record<string, number> = {};
  let successCount = 0;
  let failureCount = 0;

  const logArray = Array.isArray(logs) ? logs : [];
  for (const log of logArray) {
    // Action summary
    actionSummary[log.action] = (actionSummary[log.action] || 0) + 1;

    // User summary
    userSummary[log.userId] = (userSummary[log.userId] || 0) + 1;

    // Status count
    if (log.status === "success") {
      successCount++;
    } else {
      failureCount++;
    }
  }

  const total = successCount + failureCount;
  const successRate = total > 0 ? (successCount / total) * 100 : 0;

  return {
    totalActions: total,
    successCount,
    failureCount,
    successRate,
    actionSummary,
    userSummary,
  };
}
