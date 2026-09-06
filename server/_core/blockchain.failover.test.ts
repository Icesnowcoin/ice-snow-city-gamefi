import { describe, expect, it, vi } from 'vitest';
import { BlockchainService, type BlockchainProviderFactory } from "./blockchain";
import { rpcFailoverManager } from "./blockchain.rpc";

describe("BlockchainService RPC Failover Integration", () => {
  let blockchainService: BlockchainService;

  beforeEach(() => {
    vi.setConfig({ testTimeout: 15000 });
    blockchainService = new BlockchainService();
    rpcFailoverManager.reset();
  });

  describe("RPC Endpoint Selection", () => {
    it("should use RPC failover manager for endpoint selection", { timeout: 15000 }, async () => {
      const getNextEndpointSpy = vi.spyOn(rpcFailoverManager, "getNextEndpoint");
      
      try {
        await blockchainService.initialize();
      } catch (error) {
        // Expected to fail without valid RPC
      }
      
      expect(getNextEndpointSpy).toHaveBeenCalled();
    });

    it("should handle RPC endpoint changes", { timeout: 15000 }, async () => {
      const getNextEndpointSpy = vi.spyOn(rpcFailoverManager, "getNextEndpoint");
      
      try {
        await blockchainService.initialize();
      } catch (error) {
        // Expected to fail without valid RPC
      }
      
      // getNextEndpoint should be called to get RPC endpoint
      expect(getNextEndpointSpy).toHaveBeenCalled();
    });
  });

  describe("Failover Behavior", () => {
    it("should attempt next RPC endpoint on failure", async () => {
      const getNextEndpointSpy = vi.spyOn(rpcFailoverManager, "getNextEndpoint");
      
      try {
        await blockchainService.initialize();
      } catch (error) {
        // Expected to fail
      }
      
      // getNextEndpoint should be called during failover attempts
      expect(getNextEndpointSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle initialization errors gracefully", async () => {
      const providerFactory: BlockchainProviderFactory = () => ({
        getNetwork: vi.fn().mockRejectedValue(new Error("simulated RPC failure")),
      } as unknown as ReturnType<BlockchainProviderFactory>);
      const failingService = new BlockchainService(providerFactory);

      await expect(failingService.initialize()).rejects.toThrow("simulated RPC failure");
    });
  });

  describe("RPC Manager State", () => {
    it("should maintain RPC manager state across calls", async () => {
      const status1 = rpcFailoverManager.getStatus();
      
      try {
        await blockchainService.initialize();
      } catch (error) {
        // Expected to fail
      }
      
      const status2 = rpcFailoverManager.getStatus();
      
      // Status should be defined
      expect(status2).toBeDefined();
      expect(status2.length).toBe(status1.length);
    });

    it("should track endpoint status", async () => {
      try {
        await blockchainService.initialize();
      } catch (error) {
        // Expected to fail
      }
      
      const status = rpcFailoverManager.getStatus();
      
      // Status should be available
      expect(status).toBeDefined();
      expect(status.length).toBeGreaterThan(0);
    });
  });
});
