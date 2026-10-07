/**
 * Game State Persistence Layer
 * Handles saving and loading game state from database using Drizzle ORM
 */

import { GameState } from './types';
import { getDb } from '../db';
import { gameStates, gameStatesBackup, InsertGameState, InsertGameStateBackup } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Serialize game state to JSON string
 */
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state, (key, value) => {
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
}

/**
 * Deserialize game state from JSON string
 */
export function deserializeGameState(json: string): GameState {
  return JSON.parse(json, (key, value) => {
    // Convert ISO strings back to Date objects
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  });
}

/**
 * Save game state to database
 */
export async function saveGameState(userId: number, state: GameState): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const stateJson = serializeGameState(state);
  
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

/**
 * Load game state from database
 */
export async function loadGameState(userId: number): Promise<GameState | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select()
    .from(gameStates)
    .where(eq(gameStates.userId, userId))
    .limit(1);

  if (!result || result.length === 0) {
    return null;
  }

  return deserializeGameState(result[0].stateJson);
}

/**
 * Delete game state from database
 */
export async function deleteGameState(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(gameStates).where(eq(gameStates.userId, userId));
}

/**
 * Get game state version
 */
export async function getGameStateVersion(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
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

/**
 * Get game state metadata (without full state)
 */
export async function getGameStateMetadata(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
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

/**
 * Backup game state (create a versioned copy)
 */
export async function backupGameState(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Load current state
  const state = await loadGameState(userId);
  if (!state) return;

  const stateJson = serializeGameState(state);
  
  // Get current version
  const metadata = await getGameStateMetadata(userId);
  if (!metadata) return;

  const backupData: InsertGameStateBackup = {
    userId,
    stateJson,
    version: metadata.version,
  };

  await db.insert(gameStatesBackup).values(backupData);
}

/**
 * Restore game state from backup
 */
export async function restoreGameStateFromBackup(userId: number, backupId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select()
    .from(gameStatesBackup)
    .where(eq(gameStatesBackup.userId, userId))
    .limit(1);

  if (!result || result.length === 0) {
    throw new Error('Backup not found');
  }

  const stateJson = result[0].stateJson;
  
  await db
    .update(gameStates)
    .set({
      stateJson,
      version: result[0].version + 1,
      updatedAt: new Date(),
    })
    .where(eq(gameStates.userId, userId));
}

/**
 * Get all backups for a user
 */
export async function getGameStateBackups(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
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

/**
 * Auto-save game state (called periodically)
 */
export async function autoSaveGameState(userId: number, state: GameState): Promise<void> {
  try {
    await saveGameState(userId, state);
  } catch (error) {
    console.error(`Failed to auto-save game state for user ${userId}:`, error);
    // Don't throw - auto-save failures shouldn't break the game
  }
}

/**
 * Initialize game state for new player
 */
export async function initializeGameState(userId: number, initialState: GameState): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const stateJson = serializeGameState(initialState);

  const insertData: InsertGameState = {
    userId,
    stateJson,
    version: 1,
  };

  await db.insert(gameStates).values(insertData);
}
