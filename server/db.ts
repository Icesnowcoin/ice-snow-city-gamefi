import { desc, eq } from "drizzle-orm";
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
  InsertContractEvent,
  InsertContractParam,
  InsertSecretKey,
  InsertTreasuryTransaction,
  InsertGameState,
  InsertGameStateBackup,
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
