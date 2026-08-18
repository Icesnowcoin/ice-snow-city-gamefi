import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  InsertUser,
  users,
  contractEvents,
  contractParams,
  secretKeys,
  treasuryTransactions,
  gameStates,
  gameStatesBackup,
  gameAccounts,
  gameTransactions,
  blockchainTransactions,
  transactionRecords,
  shareStatistics,
  referrals,
  InsertReferral,
  InsertContractEvent,
  InsertContractParam,
  InsertSecretKey,
  InsertTreasuryTransaction,
  InsertGameState,
  InsertGameStateBackup,
  InsertGameAccount,
  InsertGameTransaction,
  InsertBlockchainTransaction,
  InsertTransactionRecord,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Contract Events Helpers ────────────────────────────────────────────────

export async function getContractEvents(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractEvents).orderBy(desc(contractEvents.createdAt)).limit(limit).offset(offset);
}

export async function getContractEventsByName(eventName: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contractEvents)
    .where(eq(contractEvents.eventName, eventName))
    .orderBy(desc(contractEvents.createdAt))
    .limit(limit);
}

export async function insertContractEvent(event: InsertContractEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contractEvents).values(event);
}

// ─── Contract Params Helpers ────────────────────────────────────────────────

export async function getAllContractParams() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contractParams);
}

export async function getContractParam(paramName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contractParams).where(eq(contractParams.paramName, paramName)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContractParam(paramName: string, paramValue: string, updatedBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(contractParams)
    .set({ paramValue, updatedBy })
    .where(eq(contractParams.paramName, paramName));
}

// ─── Secret Keys Helpers ────────────────────────────────────────────────────

export async function getActiveSecretKey() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(secretKeys)
    .where(eq(secretKeys.isActive, "yes"))
    .orderBy(desc(secretKeys.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSecretKeyHistory(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(secretKeys).orderBy(desc(secretKeys.createdAt)).limit(limit);
}

export async function createSecretKey(keyHash: string, createdBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Deactivate all existing keys
  await db.update(secretKeys).set({ isActive: "no" });
  // Insert new active key
  await db.insert(secretKeys).values({ keyHash, isActive: "yes", createdBy });
}

// ─── Treasury Transactions Helpers ──────────────────────────────────────────

export async function getTreasuryTransactions(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(treasuryTransactions)
    .orderBy(desc(treasuryTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function insertTreasuryTransaction(tx: InsertTreasuryTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(treasuryTransactions).values(tx);
}

// ─── Game States Helpers ───────────────────────────────────────────────────

export async function saveGameState(userId: number, stateJson: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if state exists
  const existing = await db
    .select()
    .from(gameStates)
    .where(eq(gameStates.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing state
    await db
      .update(gameStates)
      .set({
        stateJson,
        version: existing[0].version + 1,
        updatedAt: new Date(),
      })
      .where(eq(gameStates.userId, userId));
  } else {
    // Insert new state
    const insertData: InsertGameState = {
      userId,
      stateJson,
      version: 1,
    };
    await db.insert(gameStates).values(insertData);
  }
}

export async function loadGameState(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(gameStates)
    .where(eq(gameStates.userId, userId))
    .limit(1);

  if (!result || result.length === 0) {
    return null;
  }

  return result[0].stateJson;
}

export async function deleteGameState(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(gameStates).where(eq(gameStates.userId, userId));
}

export async function getGameStateVersion(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(gameStates)
    .where(eq(gameStates.userId, userId))
    .limit(1);

  if (!result || result.length === 0) {
    return null;
  }

  return result[0].version;
}

export async function getGameStateMetadata(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      userId: gameStates.userId,
      version: gameStates.version,
      createdAt: gameStates.createdAt,
      updatedAt: gameStates.updatedAt,
    })
    .from(gameStates)
    .where(eq(gameStates.userId, userId))
    .limit(1);

  if (!result || result.length === 0) {
    return null;
  }

  return result[0];
}

export async function backupGameState(userId: number, stateJson: string, version: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const backupData: InsertGameStateBackup = {
    userId,
    stateJson,
    version,
  };

  await db.insert(gameStatesBackup).values(backupData);
}

export async function getGameStateBackups(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: gameStatesBackup.id,
      version: gameStatesBackup.version,
      backupAt: gameStatesBackup.backupAt,
    })
    .from(gameStatesBackup)
    .where(eq(gameStatesBackup.userId, userId))
    .orderBy(gameStatesBackup.backupAt)
    .limit(10);
}


// ─── Game Accounts Helpers (Gas Optimization) ───────────────────────────────

export async function getGameAccount(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(gameAccounts)
    .where(eq(gameAccounts.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createGameAccount(data: InsertGameAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gameAccounts).values(data);
}

export async function updateGameAccount(userId: number, updates: Partial<InsertGameAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(gameAccounts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(gameAccounts.userId, userId));
}

// ─── Game Transactions Helpers ─────────────────────────────────────────────

export async function insertGameTransaction(data: InsertGameTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gameTransactions).values(data);
}

export async function getGameTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(gameTransactions)
    .where(eq(gameTransactions.userId, userId))
    .orderBy(desc(gameTransactions.createdAt))
    .limit(limit);
}

// ─── Blockchain Transactions Helpers ───────────────────────────────────────

export async function insertBlockchainTransaction(data: InsertBlockchainTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(blockchainTransactions).values(data);
}

export async function getBlockchainTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blockchainTransactions)
    .where(eq(blockchainTransactions.userId, userId))
    .orderBy(desc(blockchainTransactions.createdAt))
    .limit(limit);
}

// ─── Transaction Records Helpers ────────────────────────────────────────────

export async function insertTransactionRecord(
  userId: number,
  type: "purchase" | "withdrawal" | "refund" | "fee" | "income" | "expense",
  amount: string | number,
  balance: string | number,
  description: string,
  relatedOrderId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const record: InsertTransactionRecord = {
    userId,
    type,
    amount: (typeof amount === "string" ? amount : amount.toString()),
    balance: (typeof balance === "string" ? balance : balance.toString()),
    description,
    ...(relatedOrderId && { relatedOrderId }),
  };

  return await db.insert(transactionRecords).values(record);
}

export async function getTransactionHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transactionRecords)
    .where(eq(transactionRecords.userId, userId))
    .orderBy(desc(transactionRecords.createdAt))
    .limit(limit);
}


// ─── Share Statistics Helpers ──────────────────────────────────────────────

export async function recordShareStatistic(data: {
  userId: number;
  transactionId?: number;
  platform: 'twitter' | 'telegram' | 'clipboard' | 'download';
  transactionType?: string;
  amount?: string;
  success?: boolean;
  userAgent?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  try {
    const result = await db.insert(shareStatistics).values({
      userId: data.userId,
      transactionId: data.transactionId,
      platform: data.platform,
      transactionType: data.transactionType,
      amount: data.amount,
      success: data.success ?? true,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    });
    return result;
  } catch (error) {
    console.error('Failed to record share statistic:', error);
    throw error;
  }
}

export async function getShareStatistics(userId: number, options?: {
  platform?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  try {
    let conditions = [eq(shareStatistics.userId, userId)];
    
    if (options?.platform) {
      conditions.push(eq(shareStatistics.platform, options.platform as any));
    }
    if (options?.startDate) {
      conditions.push(gte(shareStatistics.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(shareStatistics.createdAt, options.endDate));
    }

    const baseQuery = db.select().from(shareStatistics).where(and(...conditions)).orderBy(desc(shareStatistics.createdAt));
    
    let finalQuery: any = baseQuery;
    
    if (options?.limit) {
      finalQuery = finalQuery.limit(options.limit);
    }
    if (options?.offset) {
      finalQuery = finalQuery.offset(options.offset);
    }

    return await finalQuery;
  } catch (error) {
    console.error('Failed to get share statistics:', error);
    throw error;
  }
}

export async function getShareStatisticsSummary(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  try {
    const stats = await db.select({
      platform: shareStatistics.platform,
      count: sql<number>`COUNT(*)`,
      successCount: sql<number>`SUM(CASE WHEN success = true THEN 1 ELSE 0 END)`,
    }).from(shareStatistics)
      .where(eq(shareStatistics.userId, userId))
      .groupBy(shareStatistics.platform);

    return stats;
  } catch (error) {
    console.error('Failed to get share statistics summary:', error);
    throw error;
  }
}

// ─── Referral Leaderboard Helpers ───────────────────────────────────────────

export async function claimReferral(data: {
  referrerUserId: number;
  referredUserId: number;
  referralCode: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  if (data.referrerUserId === data.referredUserId) {
    return { claimed: false, reason: 'self_referral' as const };
  }

  const [referrer] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, data.referrerUserId))
    .limit(1);

  if (!referrer) {
    return { claimed: false, reason: 'referrer_not_found' as const };
  }

  const [existingReferral] = await db
    .select({ id: referrals.id })
    .from(referrals)
    .where(eq(referrals.referredUserId, data.referredUserId))
    .limit(1);

  if (existingReferral) {
    return { claimed: false, reason: 'already_claimed' as const };
  }

  const referral: InsertReferral = {
    referrerUserId: data.referrerUserId,
    referredUserId: data.referredUserId,
    referralCode: data.referralCode,
    status: 'claimed',
  };

  try {
    await db.insert(referrals).values(referral);
    return { claimed: true as const, reason: 'claimed' as const };
  } catch (error) {
    // The unique referredUserId index makes concurrent claims idempotent.
    console.warn('[Referral] Claim skipped:', error);
    return { claimed: false, reason: 'already_claimed' as const };
  }
}

export async function getReferralLeaderboard(currentUserId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  const rows = await db
    .select({
      userId: users.id,
      displayName: users.name,
      invitationCount: sql<number>`COUNT(${referrals.id})`,
    })
    .from(referrals)
    .innerJoin(users, eq(users.id, referrals.referrerUserId))
    .where(eq(referrals.status, 'claimed'))
    .groupBy(users.id, users.name)
    .orderBy(desc(sql`COUNT(${referrals.id})`), users.id);

  const normalizedRows = rows.map((row) => ({
    userId: row.userId,
    displayName: row.displayName || `玩家 #${row.userId}`,
    invitationCount: Number(row.invitationCount) || 0,
  }));

  const currentIndex = normalizedRows.findIndex((row) => row.userId === currentUserId);
  const currentUserEntry = currentIndex >= 0
    ? { ...normalizedRows[currentIndex], rank: currentIndex + 1 }
    : null;

  return {
    entries: normalizedRows.slice(0, Math.max(1, Math.min(limit, 50))),
    currentUserRank: currentIndex >= 0 ? currentIndex + 1 : null,
    currentUserInvitations: currentIndex >= 0 ? normalizedRows[currentIndex].invitationCount : 0,
    currentUserEntry,
  };
}
