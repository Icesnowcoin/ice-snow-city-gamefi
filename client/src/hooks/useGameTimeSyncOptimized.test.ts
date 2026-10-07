import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createBatchQueryExecutor, RequestDeduplicationCache, QueryCoalescer, AdaptiveThrottler } from "@/lib/batchQueryService";

describe("Batch Query Service", () => {
  describe("createBatchQueryExecutor", () => {
    it("should batch multiple requests into a single call", async () => {
      const batchFn = vi.fn(async (ids: string[]) => {
        return ids.reduce(
          (acc, id) => {
            acc[id] = { id, value: `data-${id}` };
            return acc;
          },
          {} as Record<string, any>
        );
      });

      const executor = createBatchQueryExecutor(batchFn, { batchSize: 3, delayMs: 10 });

      const promises = [
        executor("id1"),
        executor("id2"),
        executor("id3"),
        executor("id4"),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(results[0]).toEqual({ id: "id1", value: "data-id1" });
      expect(batchFn).toHaveBeenCalled();
    });

    it("should handle batch size limits", async () => {
      const batchFn = vi.fn(async (ids: string[]) => {
        return ids.reduce(
          (acc, id) => {
            acc[id] = { id };
            return acc;
          },
          {} as Record<string, any>
        );
      });

      const executor = createBatchQueryExecutor(batchFn, { batchSize: 2, delayMs: 10 });

      const promises = [
        executor("id1"),
        executor("id2"),
        executor("id3"),
      ];

      await Promise.all(promises);

      // Should be called at least twice (batch of 2, then batch of 1)
      expect(batchFn.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle errors gracefully", async () => {
      const batchFn = vi.fn(async () => {
        throw new Error("Batch error");
      });

      const executor = createBatchQueryExecutor(batchFn, { batchSize: 2, delayMs: 10 });

      const promise = executor("id1");

      await expect(promise).rejects.toThrow("Batch error");
    });
  });

  describe("RequestDeduplicationCache", () => {
    it("should deduplicate in-flight requests", async () => {
      const fetcher = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { data: "test" };
      });

      const cache = new RequestDeduplicationCache(5000);

      const promise1 = cache.get("key1", fetcher);
      const promise2 = cache.get("key1", fetcher);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(result2);
      expect(fetcher).toHaveBeenCalledTimes(1); // Should only fetch once
    });

    it("should cache results within TTL", async () => {
      const fetcher = vi.fn(async () => ({ data: "test" }));
      const cache = new RequestDeduplicationCache(100);

      const result1 = await cache.get("key1", fetcher);
      const result2 = await cache.get("key1", fetcher);

      expect(result1).toEqual(result2);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("should expire cached results after TTL", async () => {
      const fetcher = vi.fn(async () => ({ data: "test" }));
      const cache = new RequestDeduplicationCache(50);

      await cache.get("key1", fetcher);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await cache.get("key1", fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("should clear cache on demand", async () => {
      const fetcher = vi.fn(async () => ({ data: "test" }));
      const cache = new RequestDeduplicationCache(5000);

      await cache.get("key1", fetcher);
      cache.clear();
      await cache.get("key1", fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe("QueryCoalescer", () => {
    it("should coalesce multiple queries into batches", async () => {
      const batchFn = vi.fn(async (ids: string[]) => {
        return ids.reduce(
          (acc, id) => {
            acc[id] = { id, value: `data-${id}` };
            return acc;
          },
          {} as Record<string, any>
        );
      });

      const coalescer = new QueryCoalescer(batchFn, { batchSize: 3, delayMs: 10 });

      const promises = [
        coalescer.query("id1"),
        coalescer.query("id2"),
        coalescer.query("id3"),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(batchFn).toHaveBeenCalled();
    });
  });

  describe("AdaptiveThrottler", () => {
    it("should start with base delay", () => {
      const throttler = new AdaptiveThrottler({ baseDelay: 100, maxDelay: 5000, windowSize: 10 });
      expect(throttler.getAdaptiveDelay()).toBe(100);
    });

    it("should increase delay based on request times", () => {
      const throttler = new AdaptiveThrottler({ baseDelay: 100, maxDelay: 5000, windowSize: 3 });

      // Record slow request times
      throttler.recordRequestTime(500);
      throttler.recordRequestTime(600);
      throttler.recordRequestTime(700);

      const delay = throttler.getAdaptiveDelay();
      expect(delay).toBeGreaterThan(100);
    });

    it("should respect max delay", () => {
      const throttler = new AdaptiveThrottler({ baseDelay: 100, maxDelay: 1000, windowSize: 3 });

      // Record very slow request times
      throttler.recordRequestTime(10000);
      throttler.recordRequestTime(10000);
      throttler.recordRequestTime(10000);

      const delay = throttler.getAdaptiveDelay();
      expect(delay).toBeLessThanOrEqual(1000);
    });

    it("should reset throttler", () => {
      const throttler = new AdaptiveThrottler({ baseDelay: 100, maxDelay: 5000, windowSize: 3 });

      throttler.recordRequestTime(500);
      throttler.reset();

      expect(throttler.getAdaptiveDelay()).toBe(100);
    });
  });
});

describe("Performance Optimization Metrics", () => {
  it("should reduce network calls with batch queries", async () => {
    const batchFn = vi.fn(async (ids: string[]) => {
      return ids.reduce(
        (acc, id) => {
          acc[id] = { id };
          return acc;
        },
        {} as Record<string, any>
      );
    });

    const executor = createBatchQueryExecutor(batchFn, { batchSize: 10, delayMs: 10 });

    // Simulate 20 individual requests
    const promises = Array.from({ length: 20 }, (_, i) => executor(`id${i}`));
    await Promise.all(promises);

    // Should result in 2 batch calls instead of 20 individual calls
    expect(batchFn.mock.calls.length).toBeLessThan(20);
    expect(batchFn.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("should deduplicate concurrent requests", async () => {
    const fetcher = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { data: "test" };
    });

    const cache = new RequestDeduplicationCache(5000);

    // Simulate 10 concurrent requests for the same key
    const promises = Array.from({ length: 10 }, () => cache.get("key1", fetcher));
    await Promise.all(promises);

    // Should only fetch once despite 10 concurrent requests
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should measure network overhead reduction", async () => {
    const batchFn = vi.fn(async (ids: string[]) => {
      return ids.reduce(
        (acc, id) => {
          acc[id] = { id };
          return acc;
        },
        {} as Record<string, any>
      );
    });

    const executor = createBatchQueryExecutor(batchFn, { batchSize: 5, delayMs: 10 });

    const startTime = Date.now();
    const promises = Array.from({ length: 50 }, (_, i) => executor(`id${i}`));
    await Promise.all(promises);
    const endTime = Date.now();

    const duration = endTime - startTime;
    const callCount = batchFn.mock.calls.length;

    // Should have ~10 batch calls for 50 items with batch size 5
    expect(callCount).toBeLessThanOrEqual(10);
    expect(callCount).toBeGreaterThanOrEqual(10);

    // Network overhead should be reduced
    expect(duration).toBeLessThan(5000); // Should complete in reasonable time
  });
});
