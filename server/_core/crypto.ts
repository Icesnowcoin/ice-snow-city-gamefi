import crypto from "crypto";

/**
 * Compute keccak256 hash compatible with Solidity smart contracts.
 * This uses Node.js's native SHA-3 (keccak256) support.
 * 
 * @param data - Input string to hash
 * @returns Hex string with "0x" prefix (64 hex chars)
 */
export function keccak256(data: string): string {
  // Node.js 15+ supports SHA3-256 which is keccak256
  const hash = crypto.createHash("sha3-256").update(data).digest("hex");
  return "0x" + hash;
}

/**
 * Verify a secret key against its stored hash.
 * Uses constant-time comparison to prevent timing attacks.
 * 
 * @param rawKey - The raw secret key to verify
 * @param storedHash - The stored hash to compare against
 * @returns true if the key matches the hash
 */
export function verifySecretKey(rawKey: string, storedHash: string): boolean {
  const computedHash = keccak256(rawKey);
  
  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(storedHash)
    );
  } catch {
    // If buffers are different lengths, timingSafeEqual throws
    return false;
  }
}

/**
 * Generate a cryptographically secure random secret key.
 * 
 * @param length - Byte length of the random key (default: 32)
 * @returns Hex string representation of the random key
 */
export function generateRandomSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash a secret key for storage in the database.
 * This is the production-grade hashing function used for all secret storage.
 * 
 * @param rawKey - The raw secret key
 * @returns Hashed key with "0x" prefix
 */
export function hashSecretKey(rawKey: string): string {
  return keccak256(rawKey);
}
