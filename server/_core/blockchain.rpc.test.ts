import { describe, it, expect, beforeEach } from "vitest";
import { RpcFailoverManager, DEFAULT_BSC_ENDPOINTS } from "./blockchain.rpc";

describe("RpcFailoverManager", () => {
  let manager: RpcFailoverManager;

  beforeEach(() => {
    manager = new RpcFailoverManager(DEFAULT_BSC_ENDPOINTS);
  });

  describe("Endpoint Management", () => {
    it("should initialize with provided endpoints", () => {
      expect(manager.getStatus()).toHaveLength(4);
    });

    it("should return first endpoint initially", () => {
      const endpoint = manager.getNextEndpoint();
      expect(endpoint).toBe(DEFAULT_BSC_ENDPOINTS[0]);
    });

    it("should track endpoint usage", () => {
      manager.getNextEndpoint();
      const status = manager.getStatus();
      expect(status[0].lastUsed).toBeDefined();
    });
  });

  describe("Failure Handling", () => {
    it("should record failures", () => {
      const error = new Error("Connection failed");
      manager.recordFailure(error);
      const status = manager.getStatus();
      expect(status[0].failureCount).toBe(1);
    });

    it("should switch endpoints after max failures", () => {
      const error = new Error("Connection failed");
      manager.recordFailure(error);
      manager.recordFailure(error);
      manager.recordFailure(error);
      
      const endpoint = manager.getNextEndpoint();
      expect(endpoint).toBe(DEFAULT_BSC_ENDPOINTS[1]);
    });

    it("should track error messages", () => {
      const error = new Error("RPC error");
      manager.recordFailure(error);
      const status = manager.getStatus();
      expect(status[0].lastError).toBe("RPC error");
    });
  });

  describe("Success Handling", () => {
    it("should record success", () => {
      manager.recordFailure(new Error("Failed"));
      manager.recordSuccess();
      const status = manager.getStatus();
      expect(status[0].failureCount).toBe(0);
    });

    it("should reduce failure count on success", () => {
      manager.recordFailure(new Error("Failed"));
      manager.recordFailure(new Error("Failed"));
      manager.recordSuccess();
      const status = manager.getStatus();
      expect(status[0].failureCount).toBe(1);
    });

    it("should clear error message on success", () => {
      manager.recordFailure(new Error("RPC error"));
      manager.recordSuccess();
      const status = manager.getStatus();
      expect(status[0].lastError).toBeUndefined();
    });
  });

  describe("Status Reporting", () => {
    it("should report active endpoint", () => {
      manager.getNextEndpoint();
      const status = manager.getStatus();
      expect(status[0].active).toBe(true);
      expect(status[1].active).toBe(false);
    });

    it("should report all endpoints", () => {
      const status = manager.getStatus();
      expect(status).toHaveLength(4);
      status.forEach((ep, index) => {
        expect(ep.url).toBe(DEFAULT_BSC_ENDPOINTS[index]);
        expect(ep.failureCount).toBe(0);
      });
    });
  });

  describe("Reset", () => {
    it("should reset all endpoints", () => {
      manager.recordFailure(new Error("Failed"));
      manager.recordFailure(new Error("Failed"));
      manager.reset();
      
      const status = manager.getStatus();
      status.forEach(ep => {
        expect(ep.failureCount).toBe(0);
        expect(ep.lastError).toBeUndefined();
      });
    });

    it("should reset to first endpoint", () => {
      manager.recordFailure(new Error("Failed"));
      manager.recordFailure(new Error("Failed"));
      manager.recordFailure(new Error("Failed"));
      manager.getNextEndpoint(); // Switch to second
      manager.reset();
      
      const endpoint = manager.getNextEndpoint();
      expect(endpoint).toBe(DEFAULT_BSC_ENDPOINTS[0]);
    });
  });

  describe("Recovery Mechanism", () => {
    it("should attempt recovery after timeout", () => {
      const error = new Error("Connection failed");
      manager.recordFailure(error);
      manager.recordFailure(error);
      manager.recordFailure(error);
      
      // First call switches to next endpoint
      let endpoint = manager.getNextEndpoint();
      expect(endpoint).toBe(DEFAULT_BSC_ENDPOINTS[1]);
      
      // Simulate recovery by resetting
      manager.reset();
      endpoint = manager.getNextEndpoint();
      expect(endpoint).toBe(DEFAULT_BSC_ENDPOINTS[0]);
    });
  });

  describe("Round-robin Failover", () => {
    it("should cycle through endpoints", () => {
      const error = new Error("Failed");
      
      // Fail first endpoint
      for (let i = 0; i < 3; i++) {
        manager.recordFailure(error);
      }
      let endpoint = manager.getNextEndpoint();
      expect(endpoint).toBe(DEFAULT_BSC_ENDPOINTS[1]);
      
      // Fail second endpoint
      for (let i = 0; i < 3; i++) {
        manager.recordFailure(error);
      }
      endpoint = manager.getNextEndpoint();
      expect(endpoint).toBe(DEFAULT_BSC_ENDPOINTS[2]);
    });
  });
});
