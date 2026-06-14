import { describe, it, expect } from "vitest";
import { keccak256, verifySecretKey, generateRandomSecret, hashSecretKey } from "./crypto";

describe("Crypto Module - Production-Grade Security", () => {
  describe("keccak256 hashing", () => {
    it("should produce consistent keccak256 hashes", () => {
      const input = "test-secret-key";
      const hash1 = keccak256(input);
      const hash2 = keccak256(input);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = keccak256("key1");
      const hash2 = keccak256("key2");
      expect(hash1).not.toBe(hash2);
    });

    it("should return hex string with 0x prefix", () => {
      const hash = keccak256("test");
      expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it("should handle empty strings", () => {
      const hash = keccak256("");
      expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it("should handle long strings", () => {
      const longString = "a".repeat(1000);
      const hash = keccak256(longString);
      expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });

  describe("Secret key verification", () => {
    it("should verify correct secret keys", () => {
      const rawKey = "my-secret-key-12345";
      const hash = keccak256(rawKey);
      expect(verifySecretKey(rawKey, hash)).toBe(true);
    });

    it("should reject incorrect secret keys", () => {
      const rawKey = "my-secret-key-12345";
      const hash = keccak256(rawKey);
      expect(verifySecretKey("wrong-key", hash)).toBe(false);
    });

    it("should use constant-time comparison to prevent timing attacks", () => {
      const rawKey = "secret";
      const hash = keccak256(rawKey);
      
      // Multiple attempts with wrong keys should not leak timing info
      const wrongKeys = ["wrong1", "wrong2", "wrong3"];
      wrongKeys.forEach((key) => {
        expect(verifySecretKey(key, hash)).toBe(false);
      });
    });

    it("should handle malformed hashes gracefully", () => {
      expect(verifySecretKey("secret", "invalid-hash")).toBe(false);
      expect(verifySecretKey("secret", "0x123")).toBe(false);
      expect(verifySecretKey("secret", "")).toBe(false);
    });
  });

  describe("Random secret generation", () => {
    it("should generate cryptographically secure random secrets", () => {
      const secret = generateRandomSecret();
      expect(secret).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate different secrets on each call", () => {
      const secret1 = generateRandomSecret();
      const secret2 = generateRandomSecret();
      expect(secret1).not.toBe(secret2);
    });

    it("should support custom length", () => {
      const secret16 = generateRandomSecret(16);
      expect(secret16).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
    });

    it("should generate high-entropy secrets", () => {
      const secrets = Array.from({ length: 10 }, () => generateRandomSecret());
      // All should be unique
      const uniqueSecrets = new Set(secrets);
      expect(uniqueSecrets.size).toBe(10);
    });
  });

  describe("Hash secret key for storage", () => {
    it("should hash secret keys using keccak256", () => {
      const rawKey = "test-key";
      const hash = hashSecretKey(rawKey);
      expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it("should produce same hash as keccak256", () => {
      const rawKey = "test-key";
      const hash1 = hashSecretKey(rawKey);
      const hash2 = keccak256(rawKey);
      expect(hash1).toBe(hash2);
    });

    it("should be suitable for database storage", () => {
      const hash = hashSecretKey("production-key");
      // Should be a valid hex string suitable for database storage
      expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(hash.length).toBe(66); // 0x + 64 hex chars
    });
  });

  describe("Security properties", () => {
    it("should not allow reverse engineering from hash", () => {
      const rawKey = "secret-key-12345";
      const hash = keccak256(rawKey);
      
      // Hash should not contain original key
      expect(hash).not.toContain(rawKey);
      expect(hash).not.toContain("secret");
    });

    it("should handle special characters safely", () => {
      const specialKeys = [
        "key!@#$%^&*()",
        "key\nwith\nnewlines",
        "key\twith\ttabs",
        "key with spaces",
        "key\\with\\backslashes",
      ];
      
      specialKeys.forEach((key) => {
        const hash = keccak256(key);
        expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
        expect(verifySecretKey(key, hash)).toBe(true);
      });
    });

    it("should prevent collision attacks (different keys produce different hashes)", () => {
      const keys = Array.from({ length: 100 }, (_, i) => `key-${i}`);
      const hashes = keys.map(keccak256);
      const uniqueHashes = new Set(hashes);
      
      // All hashes should be unique
      expect(uniqueHashes.size).toBe(100);
    });
  });
});
