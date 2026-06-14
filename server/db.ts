import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  contractEvents,
  contractParams,
  secretKeys,
  treasuryTransactions,
  InsertContractEvent,
  InsertContractParam,
  InsertSecretKey,
  InsertTreasuryTransaction,
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
