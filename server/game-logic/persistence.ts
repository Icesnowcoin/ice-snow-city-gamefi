/**
 * Game State Persistence Layer
 * Handles saving and loading game state from database
 */

import { GameState } from './types';
import { getDb } from '../db';

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
export async function saveGameState(userId: string, state: GameState): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const stateJson = serializeGameState(state);
  
  // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert
  await db.execute(
    `INSERT INTO game_states (user_id, state_json, version, updated_at)
     VALUES (?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE
       state_json = VALUES(state_json),
       version = version + 1,
       updated_at = NOW()`,
    [userId, stateJson]
  );
}

/**
 * Load game state from database
 */
export async function loadGameState(userId: string): Promise<GameState | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.query(
    'SELECT state_json FROM game_states WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (!result || result.length === 0) {
    return null;
  }

  return deserializeGameState(result[0].state_json);
}

/**
 * Delete game state from database
 */
export async function deleteGameState(userId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute('DELETE FROM game_states WHERE user_id = ?', [userId]);
}

/**
 * Get game state version
 */
export async function getGameStateVersion(userId: string): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.query(
    'SELECT version FROM game_states WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (!result || result.length === 0) {
    return null;
  }

  return result[0].version;
}

/**
 * Get game state metadata (without full state)
 */
export async function getGameStateMetadata(userId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.query(
    `SELECT user_id, version, created_at, updated_at 
     FROM game_states WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (!result || result.length === 0) {
    return null;
  }

  return result[0];
}

/**
 * Backup game state (create a versioned copy)
 */
export async function backupGameState(userId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Create a backup table entry
  const state = await loadGameState(userId);
  if (!state) return;

  const stateJson = serializeGameState(state);
  const timestamp = new Date().toISOString();

  await db.execute(
    `INSERT INTO game_states_backup (user_id, state_json, version, backup_at)
     SELECT ?, ?, version, NOW()
     FROM game_states WHERE user_id = ?`,
    [userId, stateJson, userId]
  );
}

/**
 * Restore game state from backup
 */
export async function restoreGameStateFromBackup(userId: string, backupId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.query(
    'SELECT state_json FROM game_states_backup WHERE id = ? AND user_id = ? LIMIT 1',
    [backupId, userId]
  );

  if (!result || result.length === 0) {
    throw new Error('Backup not found');
  }

  const stateJson = result[0].state_json;
  await db.execute(
    `UPDATE game_states SET state_json = ?, version = version + 1, updated_at = NOW()
     WHERE user_id = ?`,
    [stateJson, userId]
  );
}

/**
 * Get all backups for a user
 */
export async function getGameStateBackups(userId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return await db.query(
    `SELECT id, version, backup_at FROM game_states_backup 
     WHERE user_id = ? ORDER BY backup_at DESC LIMIT 10`,
    [userId]
  );
}

/**
 * Auto-save game state (called periodically)
 */
export async function autoSaveGameState(userId: string, state: GameState): Promise<void> {
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
export async function initializeGameState(userId: string, initialState: GameState): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const stateJson = serializeGameState(initialState);

  await db.execute(
    `INSERT INTO game_states (user_id, state_json, version, created_at, updated_at)
     VALUES (?, ?, 1, NOW(), NOW())`,
    [userId, stateJson]
  );
}
