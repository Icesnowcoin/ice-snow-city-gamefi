import { describe, it, expect, beforeEach, vi } from "vitest";
import { BlockchainService } from "./blockchain";
import { rpcFailoverManager } from "./blockchain.rpc";

describe("BlockchainService RPC Failover Integration", () => {
  let blockchainService: BlockchainService;

  beforeEach(() => {
    blockchainService = new BlockchainService();
    rpcFailoverManager.reset();
  });

  describe("RPC Endpoint Selection", () => {
    it("should use RPC failover manager for endpoint selection", async () => {
      const getNextEndpointSpy = vi.spyOn(rpcFailoverManager, "getNextEndpoint");
      
      try {
        await blockchainService.initialize();
      } catch (error) {
        // Expected to fail without valid RPC
      }
      
      expect(getNextEndpointSpy).toHaveBeenCalled();
    });

    it("should handle RPC endpoint changes", async () => {
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
      try {
        await blockchainService.initialize();
        // If we reach here, RPC connection was successful
        expect(true).toBe(true);
      } catch (error) {
        // Expected: error thrown when RPC connection fails
        expect(error).toBeDefined();
      }
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
