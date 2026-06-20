/**
 * Encryption Service Module
 * 
 * Provides AES-256-GCM encryption/decryption for sensitive data:
 * - Audit logs
 * - Secret key hashes
 * - Backup data
 * - Database credentials
 * 
 * Uses AES-256-GCM for authenticated encryption with per-record random IV.
 * Environment variables:
 * - ENCRYPTION_KEY: Main encryption key (256-bit)
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCODING = 'hex';

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }
  
  // Convert hex string to buffer (256 bits = 32 bytes)
  const buffer = Buffer.from(key, 'hex');
  if (buffer.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be 256 bits (32 bytes), got ${buffer.length} bytes`);
  }
  
  return buffer;
}

/**
 * Generate random initialization vector
 */
function generateRandomIv(): Buffer {
  return crypto.randomBytes(IV_LENGTH);
}

/**
 * Encrypt sensitive data using AES-256-GCM with random IV
 * Returns: base64(iv + authTag + ciphertext)
 */
export function encryptData(data: string): string {
  try {
    const key = getEncryptionKey();
    const iv = generateRandomIv();
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + ciphertext
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
    return combined.toString('base64');
  } catch (error) {
    console.error('[Encryption] Failed to encrypt data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * Input: base64(iv + authTag + ciphertext)
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[Encryption] Failed to decrypt data:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt JSON object
 */
export function encryptJson<T extends Record<string, any>>(data: T): string {
  const jsonString = JSON.stringify(data);
  return encryptData(jsonString);
}

/**
 * Decrypt JSON object
 */
export function decryptJson<T extends Record<string, any>>(encryptedData: string): T {
  const jsonString = decryptData(encryptedData);
  return JSON.parse(jsonString) as T;
}

/**
 * Generate encryption key (for setup/initialization)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate initialization vector (for setup/initialization - deprecated)
 * Use per-record random IV instead
 */
export function generateEncryptionIv(): string {
  console.warn('[Encryption] generateEncryptionIv is deprecated. Use per-record random IV instead.');
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Encrypt audit log details
 */
export function encryptAuditLog(details: Record<string, any>): string {
  return encryptJson(details);
}

/**
 * Decrypt audit log details
 */
export function decryptAuditLog(encryptedDetails: string): Record<string, any> {
  return decryptJson(encryptedDetails);
}

/**
 * Encrypt secret key hash
 */
export function encryptSecretKeyHash(keyHash: string): string {
  return encryptData(keyHash);
}

/**
 * Decrypt secret key hash
 */
export function decryptSecretKeyHash(encryptedHash: string): string {
  return decryptData(encryptedHash);
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize encryption keys (for development/testing)
 */
export function initializeEncryptionKeys(): { key: string } {
  const key = generateEncryptionKey();
  
  console.log('[Encryption] Generated encryption key:');
  console.log(`ENCRYPTION_KEY=${key}`);
  console.log('[Encryption] Note: IV is generated per-record for each encryption');
  
  return { key };
}
