import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getCacheService, resetCacheService } from "./cache";

/**
 * Unit Tests for Cache Service
 * 
 * Tests caching functionality, TTL expiration, and statistics
 */

describe("CacheService", () => {
  beforeEach(() => {
    resetCacheService();
  });

  afterEach(() => {
    resetCacheService();
  });

  describe("Basic Operations", () => {
    it("should set and get cache entry", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      const value = cache.get<string>("key1");

      expect(value).toBe("value1");
    });

    it("should return undefined for non-existent key", () => {
      const cache = getCacheService();
      cache.initialize();

      const value = cache.get("nonexistent");

      expect(value).toBeUndefined();
    });

    it("should check if key exists", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");

      expect(cache.has("key1")).toBe(true);
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("should delete cache entry", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      const deleted = cache.delete("key1");

      expect(deleted).toBe(true);
      expect(cache.get("key1")).toBeUndefined();
    });

    it("should return false when deleting non-existent key", () => {
      const cache = getCacheService();
      cache.initialize();

      const deleted = cache.delete("nonexistent");

      expect(deleted).toBe(false);
    });
  });

  describe("TTL Expiration", () => {
    it("should expire entry after TTL", async () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1", 100); // 100ms TTL

      expect(cache.get("key1")).toBe("value1");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.get("key1")).toBeUndefined();
    });

    it("should use default TTL", async () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1"); // Default TTL

      expect(cache.get("key1")).toBe("value1");

      // Should still exist shortly after
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cache.get("key1")).toBe("value1");
    });

    it("should remove expired entry on access", async () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1", 50);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.has("key1")).toBe(false);
    });
  });

  describe("Statistics", () => {
    it("should track cache hits", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      cache.get("key1");
      cache.get("key1");

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(2);
    });

    it("should track cache misses", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.get("nonexistent");
      cache.get("nonexistent");

      const stats = cache.getStats();
      expect(stats.missCount).toBe(2);
    });

    it("should calculate hit rate", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      cache.get("key1"); // Hit
      cache.get("key1"); // Hit
      cache.get("nonexistent"); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it("should track entry count", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(3);
    });

    it("should calculate average hits", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      cache.set("key2", "value2");

      cache.get("key1");
      cache.get("key1");
      cache.get("key2");

      const stats = cache.getStats();
      expect(stats.averageHits).toBe(1.5);
    });

    it("should reset statistics", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      cache.get("key1");

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
    });
  });

  describe("Cleanup", () => {
    it("should clean up expired entries", async () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1", 50);
      cache.set("key2", "value2", 5000);

      await new Promise((resolve) => setTimeout(resolve, 100));

      cache.cleanup();

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
    });

    it("should clean up on initialization", async () => {
      const cache = getCacheService();
      cache.initialize(100); // 100ms cleanup interval

      cache.set("key1", "value1", 50);

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be cleaned up by automatic cleanup
      expect(cache.has("key1")).toBe(false);
    });
  });

  describe("Clear", () => {
    it("should clear all entries", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      cache.clear();

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
      expect(cache.has("key3")).toBe(false);
    });
  });

  describe("Data Types", () => {
    it("should cache objects", () => {
      const cache = getCacheService();
      cache.initialize();

      const obj = { name: "test", value: 123 };
      cache.set("key1", obj);

      const retrieved = cache.get<typeof obj>("key1");
      expect(retrieved).toEqual(obj);
    });

    it("should cache arrays", () => {
      const cache = getCacheService();
      cache.initialize();

      const arr = [1, 2, 3, 4, 5];
      cache.set("key1", arr);

      const retrieved = cache.get<typeof arr>("key1");
      expect(retrieved).toEqual(arr);
    });

    it("should cache null values", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", null);

      const retrieved = cache.get("key1");
      expect(retrieved).toBeNull();
    });

    it("should cache numbers", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", 42);

      const retrieved = cache.get<number>("key1");
      expect(retrieved).toBe(42);
    });
  });

  describe("Size Calculation", () => {
    it("should calculate cache size", () => {
      const cache = getCacheService();
      cache.initialize();

      cache.set("key1", "value1");
      cache.set("key2", { data: "test" });

      const size = cache.getSize();
      expect(size).toBeGreaterThan(0);
    });
  });

  describe("Singleton Pattern", () => {
    it("should return same instance", () => {
      const cache1 = getCacheService();
      const cache2 = getCacheService();

      expect(cache1).toBe(cache2);
    });

    it("should reset singleton", () => {
      const cache1 = getCacheService();
      cache1.initialize();
      cache1.set("key1", "value1");

      resetCacheService();

      const cache2 = getCacheService();
      expect(cache2.has("key1")).toBe(false);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type consistency", () => {
      const cache = getCacheService();
      cache.initialize();

      const obj = { name: "test", count: 42 };
      cache.set("key1", obj);

      const retrieved = cache.get<typeof obj>("key1");
      expect(retrieved?.name).toBe("test");
      expect(retrieved?.count).toBe(42);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty cache", () => {
      const cache = getCacheService();
      cache.initialize();

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.averageHits).toBe(0);
    });

    it("should handle large values", () => {
      const cache = getCacheService();
      cache.initialize();

      const largeValue = new Array(10000).fill("x").join("");
      cache.set("key1", largeValue);

      const retrieved = cache.get<string>("key1");
      expect(retrieved).toBe(largeValue);
    });

    it("should handle many entries", () => {
      const cache = getCacheService();
      cache.initialize();

      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(1000);
    });
  });
});
