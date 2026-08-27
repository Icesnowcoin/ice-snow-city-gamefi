import { getDb } from "./db";
import { recoveryEvents, recoveryMetrics, type InsertRecoveryEvent, type InsertRecoveryMetric } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Database operations for recovery events and metrics
 */

export async function insertRecoveryEvent(event: InsertRecoveryEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(recoveryEvents).values(event);
  return result;
}

export async function queryRecoveryEvents(
  serviceType?: string,
  eventType?: string,
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (serviceType) conditions.push(eq(recoveryEvents.serviceType, serviceType));
  if (eventType) conditions.push(eq(recoveryEvents.eventType, eventType));
  
  const query = conditions.length > 0 
    ? db.select().from(recoveryEvents).where(and(...conditions))
    : db.select().from(recoveryEvents);
  
  const result = await query.limit(limit).offset(offset);
  return result;
}

export async function getRecoveryEventCount(serviceType?: string, eventType?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (serviceType) conditions.push(eq(recoveryEvents.serviceType, serviceType));
  if (eventType) conditions.push(eq(recoveryEvents.eventType, eventType));
  
  const query = conditions.length > 0
    ? db.select().from(recoveryEvents).where(and(...conditions))
    : db.select().from(recoveryEvents);
  
  const result = await query;
  return result.length;
}

export async function updateRecoveryEvent(id: number, updates: Partial<InsertRecoveryEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(recoveryEvents)
    .set(updates)
    .where(eq(recoveryEvents.id, id));
  
  return result;
}

export async function deleteRecoveryEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(recoveryEvents).where(eq(recoveryEvents.id, id));
  return result;
}

export async function insertRecoveryMetric(metric: InsertRecoveryMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(recoveryMetrics).values(metric);
  return result;
}

export async function queryRecoveryMetrics(
  serviceType?: string,
  metricType?: string,
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (serviceType) conditions.push(eq(recoveryMetrics.serviceType, serviceType));
  if (metricType) conditions.push(eq(recoveryMetrics.metricType, metricType));
  
  const query = conditions.length > 0
    ? db.select().from(recoveryMetrics).where(and(...conditions))
    : db.select().from(recoveryMetrics);
  
  const result = await query.limit(limit).offset(offset);
  return result;
}

export async function getRecoveryMetricCount(serviceType?: string, metricType?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (serviceType) conditions.push(eq(recoveryMetrics.serviceType, serviceType));
  if (metricType) conditions.push(eq(recoveryMetrics.metricType, metricType));
  
  const query = conditions.length > 0
    ? db.select().from(recoveryMetrics).where(and(...conditions))
    : db.select().from(recoveryMetrics);
  
  const result = await query;
  return result.length;
}

export async function deleteOldRecoveryEvents(daysOld: number = 90) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await db.delete(recoveryEvents)
    .where(lte(recoveryEvents.createdAt, cutoffDate));
  
  return result;
}

export async function deleteOldRecoveryMetrics(daysOld: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await db.delete(recoveryMetrics)
    .where(lte(recoveryMetrics.createdAt, cutoffDate));
  
  return result;
}

export async function getRecoveryStatistics(serviceType?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = serviceType ? [eq(recoveryEvents.serviceType, serviceType)] : [];
  const events = conditions.length > 0
    ? await db.select().from(recoveryEvents).where(and(...conditions))
    : await db.select().from(recoveryEvents);
  
  const successCount = events.filter(e => e.status === "success").length;
  const failedCount = events.filter(e => e.status === "failed").length;
  const pendingCount = events.filter(e => e.status === "pending").length;
  
  const stats = {
    totalEvents: events.length,
    successCount,
    failedCount,
    pendingCount,
    successRate: events.length > 0 ? (successCount / events.length * 100).toFixed(2) : "0",
    averageRecoveryAttempts: events.length > 0 
      ? (events.reduce((sum, e) => sum + (e.recoveryAttempts || 0), 0) / events.length).toFixed(2)
      : "0",
  };
  
  return stats;
}
