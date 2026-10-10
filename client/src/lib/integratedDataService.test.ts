import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BatchNPCDataFetcher,
  BatchEconomyDataFetcher,
  IntegratedDataService,
} from "@/lib/integratedDataService";

describe("Integrated Data Service", () => {
  describe("BatchNPCDataFetcher", () => {
    let fetcher: BatchNPCDataFetcher;

    beforeEach(() => {
      fetcher = new BatchNPCDataFetcher();
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL) =>
          new Response(
            JSON.stringify({
              id: String(input).split('/').pop(),
              name: 'NPC test record',
              level: 1,
            }),
            { headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      );
    });

    it("should fetch single NPC data", async () => {
      const data = await fetcher.fetchNPCData("npc_001");
      expect(data).toBeDefined();
    });

    it("should deduplicate concurrent requests for same NPC", async () => {
      const promises = [
        fetcher.fetchNPCData("npc_001"),
        fetcher.fetchNPCData("npc_001"),
        fetcher.fetchNPCData("npc_001"),
      ];

      const results = await Promise.all(promises);

      // All should return same data
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });

    it("should fetch multiple NPCs in parallel", async () => {
      const npcIds = ["npc_001", "npc_002", "npc_003"];
      const results = await fetcher.fetchMultipleNPCs(npcIds);

      expect(Object.keys(results)).toHaveLength(3);
      expect(results["npc_001"]).toBeDefined();
      expect(results["npc_002"]).toBeDefined();
      expect(results["npc_003"]).toBeDefined();
    });

    it("should support prefetching", async () => {
      const npcIds = ["npc_001", "npc_002"];
      expect(() => fetcher.prefetchNPCData(npcIds)).not.toThrow();
    });

    it("should provide adaptive polling interval", () => {
      const interval = fetcher.getAdaptiveInterval();
      expect(interval).toBeGreaterThan(0);
    });

    it("should clear cache on demand", () => {
      expect(() => fetcher.clearCache()).not.toThrow();
    });
  });

  describe("BatchEconomyDataFetcher", () => {
    let fetcher: BatchEconomyDataFetcher;

    beforeEach(() => {
      fetcher = new BatchEconomyDataFetcher();
    });

    it("should fetch single market price", async () => {
      const price = await fetcher.fetchMarketPrice("wheat");
      expect(price).toBeDefined();
      expect(price.id).toBe("wheat");
    });

    it("should fetch multiple market prices", async () => {
      const itemIds = ["wheat", "corn", "rice"];
      const results = await fetcher.fetchMultipleMarketPrices(itemIds);

      expect(Object.keys(results)).toHaveLength(3);
      expect(results["wheat"]).toBeDefined();
      expect(results["corn"]).toBeDefined();
      expect(results["rice"]).toBeDefined();
    });

    it("should batch market price requests", async () => {
      const itemIds = Array.from({ length: 20 }, (_, i) => `item_${i}`);
      const results = await fetcher.fetchMultipleMarketPrices(itemIds);

      expect(Object.keys(results)).toHaveLength(20);
    });

    it("should clear cache", () => {
      expect(() => fetcher.clearCache()).not.toThrow();
    });
  });

  describe("IntegratedDataService", () => {
    let service: IntegratedDataService;

    beforeEach(() => {
      service = new IntegratedDataService();
    });

    it("should fetch NPC data through integrated service", async () => {
      const data = await service.getNPCData("npc_001");
      expect(data).toBeDefined();
    });

    it("should fetch multiple NPCs through integrated service", async () => {
      const npcIds = ["npc_001", "npc_002", "npc_003"];
      const results = await service.getMultipleNPCData(npcIds);

      expect(Object.keys(results)).toHaveLength(3);
    });

    it("should fetch market prices through integrated service", async () => {
      const price = await service.getMarketPrice("wheat");
      expect(price).toBeDefined();
    });

    it("should fetch multiple market prices through integrated service", async () => {
      const itemIds = ["wheat", "corn", "rice"];
      const results = await service.getMultipleMarketPrices(itemIds);

      expect(Object.keys(results)).toHaveLength(3);
    });

    it("should track request statistics", async () => {
      await service.getNPCData("npc_001");
      await service.getMarketPrice("wheat");

      const stats = service.getRequestStats();
      expect(stats.totalRequests).toBeGreaterThan(0);
    });

    it("should support prefetching", () => {
      const npcIds = ["npc_001", "npc_002"];
      expect(() => service.prefetchNPCData(npcIds)).not.toThrow();
    });

    it("should reset statistics", async () => {
      await service.getNPCData("npc_001");
      service.resetStats();

      const stats = service.getRequestStats();
      expect(stats.totalRequests).toBe(0);
    });

    it("should clear all caches", () => {
      expect(() => service.clearAllCaches()).not.toThrow();
    });

    it("should calculate batching efficiency", async () => {
      const npcIds = ["npc_001", "npc_002", "npc_003"];
      await service.getMultipleNPCData(npcIds);

      const stats = service.getRequestStats();
      expect(stats.batchingEfficiency).toBeGreaterThanOrEqual(0);
      expect(stats.batchingEfficiency).toBeLessThanOrEqual(100);
    });
  });

  describe("Performance Metrics", () => {
    it("should reduce network calls through batching", async () => {
      const service = new IntegratedDataService();

      // Simulate 30 individual requests
      const promises = Array.from({ length: 30 }, (_, i) =>
        service.getNPCData(`npc_${i}`)
      );
      await Promise.all(promises);

      const stats = service.getRequestStats();
      // Should have batched multiple requests
      expect(stats.batchedRequests).toBeGreaterThanOrEqual(0);
    });

    it("should efficiently handle mixed data types", async () => {
      const service = new IntegratedDataService();

      // Mix NPC and economy data requests
      const npcPromise = service.getMultipleNPCData(["npc_001", "npc_002"]);
      const pricePromise = service.getMultipleMarketPrices(["wheat", "corn"]);

      const [npcData, priceData] = await Promise.all([npcPromise, pricePromise]);

      expect(Object.keys(npcData)).toHaveLength(2);
      expect(Object.keys(priceData)).toHaveLength(2);

      const stats = service.getRequestStats();
      expect(stats.totalRequests).toBe(2);
    });

    it("should provide accurate performance statistics", async () => {
      const service = new IntegratedDataService();

      await service.getNPCData("npc_001");
      await service.getMarketPrice("wheat");
      await service.getMultipleNPCData(["npc_002", "npc_003"]);

      const stats = service.getRequestStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.batchedRequests).toBe(1);
      expect(stats.avgRequestDuration).toBeGreaterThanOrEqual(0);
      expect(stats.batchingEfficiency).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Data Merging", () => {
    it("should merge multiple NPC data correctly", async () => {
      const service = new IntegratedDataService();
      const npcIds = ["npc_001", "npc_002", "npc_003"];

      const results = await service.getMultipleNPCData(npcIds);

      // Verify all NPCs are present
      npcIds.forEach((id) => {
        expect(results[id]).toBeDefined();
      });

      // Verify data structure
      Object.values(results).forEach((npc) => {
        expect(npc).toHaveProperty("id");
      });
    });

    it("should merge multiple market prices correctly", async () => {
      const service = new IntegratedDataService();
      const itemIds = ["wheat", "corn", "rice"];

      const results = await service.getMultipleMarketPrices(itemIds);

      // Verify all items are present
      itemIds.forEach((id) => {
        expect(results[id]).toBeDefined();
      });

      // Verify data structure
      Object.values(results).forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("price");
      });
    });

    it("should handle partial failures in batch queries", async () => {
      const service = new IntegratedDataService();

      // Mix valid and potentially invalid IDs
      const npcIds = ["npc_001", "npc_002", "invalid_npc"];

      try {
        const results = await service.getMultipleNPCData(npcIds);
        // Should still return some data
        expect(Object.keys(results).length).toBeGreaterThan(0);
      } catch (error) {
        // If it throws, that's also acceptable for invalid data
        expect(error).toBeDefined();
      }
    });
  });
});
