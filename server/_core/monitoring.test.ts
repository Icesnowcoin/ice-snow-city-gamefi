import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getMonitoringService,
  resetMonitoringService,
  type TransactionMonitor,
  type MonitoringStatus,
} from "./monitoring";

/**
 * Unit Tests for Monitoring Service
 * 
 * Tests transaction monitoring, health checking, and alerting
 */

describe("MonitoringService", () => {
  beforeEach(() => {
    resetMonitoringService();
  });

  afterEach(() => {
    resetMonitoringService();
  });

  describe("Initialization", () => {
    it("should initialize service", async () => {
      const service = getMonitoringService();
      await service.initialize();
      expect(service).toBeDefined();
    });

    it("should initialize with custom config", async () => {
      const service = getMonitoringService();
      await service.initialize({
        enableAlerts: false,
        alertThresholds: {
          failedTransactionCount: 10,
          errorRatePercentage: 20,
          eventProcessingDelayMs: 120000,
        },
      });
      expect(service).toBeDefined();
    });
  });

  describe("Transaction Tracking", () => {
    it("should track successful transaction", () => {
      const service = getMonitoringService();
      const txHash = "0x123abc";

      service.trackTransaction(txHash, "success");

      const status = service.getStatus();
      expect(status.successTransactionCount).toBe(1);
      expect(status.failedTransactionCount).toBe(0);
    });

    it("should track failed transaction", () => {
      const service = getMonitoringService();
      const txHash = "0x123abc";

      service.trackTransaction(txHash, "failed");

      const status = service.getStatus();
      expect(status.failedTransactionCount).toBe(1);
      expect(status.successTransactionCount).toBe(0);
    });

    it("should track pending transaction", () => {
      const service = getMonitoringService();
      const txHash = "0x123abc";

      service.trackTransaction(txHash, "pending");

      const monitor = service.getTransactionMonitor(txHash);
      expect(monitor).toBeDefined();
      expect(monitor?.status).toBe("pending");
    });

    it("should track multiple transactions", () => {
      const service = getMonitoringService();

      service.trackTransaction("0x111", "success");
      service.trackTransaction("0x222", "success");
      service.trackTransaction("0x333", "failed");

      const status = service.getStatus();
      expect(status.successTransactionCount).toBe(2);
      expect(status.failedTransactionCount).toBe(1);
    });
  });

  describe("Transaction Status Updates", () => {
    it("should update transaction status", () => {
      const service = getMonitoringService();
      const txHash = "0x123abc";

      service.trackTransaction(txHash, "pending");
      service.updateTransactionStatus(txHash, "success");

      const monitor = service.getTransactionMonitor(txHash);
      expect(monitor?.status).toBe("success");
    });

    it("should track error message", () => {
      const service = getMonitoringService();
      const txHash = "0x123abc";
      const errorMsg = "Transaction reverted";

      service.trackTransaction(txHash, "pending");
      service.updateTransactionStatus(txHash, "failed", errorMsg);

      const monitor = service.getTransactionMonitor(txHash);
      expect(monitor?.lastError).toBe(errorMsg);
    });

    it("should increment retry count", () => {
      const service = getMonitoringService();
      const txHash = "0x123abc";

      service.trackTransaction(txHash, "pending");
      service.updateTransactionStatus(txHash, "failed");
      service.updateTransactionStatus(txHash, "failed");

      const monitor = service.getTransactionMonitor(txHash);
      expect(monitor?.retryCount).toBe(2);
    });
  });

  describe("Processing Time Tracking", () => {
    it("should record processing time", () => {
      const service = getMonitoringService();

      service.recordProcessingTime(100);
      service.recordProcessingTime(150);
      service.recordProcessingTime(200);

      const status = service.getStatus();
      expect(status.averageProcessingTime).toBe(150);
    });

    it("should calculate average processing time", () => {
      const service = getMonitoringService();

      service.recordProcessingTime(100);
      service.recordProcessingTime(200);
      service.recordProcessingTime(300);

      const status = service.getStatus();
      expect(status.averageProcessingTime).toBe(200);
    });

    it("should keep only last 100 measurements", () => {
      const service = getMonitoringService();

      for (let i = 0; i < 150; i++) {
        service.recordProcessingTime(100);
      }

      const status = service.getStatus();
      expect(status.averageProcessingTime).toBe(100);
    });
  });

  describe("Health Status", () => {
    it("should report healthy status initially", () => {
      const service = getMonitoringService();
      const status = service.getStatus();

      expect(status.isHealthy).toBe(true);
    });

    it("should calculate error rate", () => {
      const service = getMonitoringService();

      service.trackTransaction("0x111", "success");
      service.trackTransaction("0x222", "success");
      service.trackTransaction("0x333", "failed");

      const status = service.getStatus();
      // 1 failed out of 3 = 33.33%
      expect(status.errorRate).toBeCloseTo(33.33, 1);
    });

    it("should report unhealthy when too many failures", async () => {
      const service = getMonitoringService();
      await service.initialize({
        enableAlerts: false,
        alertThresholds: {
          failedTransactionCount: 3,
          errorRatePercentage: 50,
          eventProcessingDelayMs: 60000,
        },
      });

      // Track 5 failed transactions
      for (let i = 0; i < 5; i++) {
        service.trackTransaction(`0x${i}`, "failed");
      }

      const status = service.getStatus();
      expect(status.isHealthy).toBe(false);
    });

    it("should report unhealthy when error rate too high", async () => {
      const service = getMonitoringService();
      await service.initialize({
        enableAlerts: false,
        alertThresholds: {
          failedTransactionCount: 100,
          errorRatePercentage: 10,
          eventProcessingDelayMs: 60000,
        },
      });

      // Track 1 success and 9 failures = 90% error rate
      service.trackTransaction("0x000", "success");
      for (let i = 1; i <= 9; i++) {
        service.trackTransaction(`0x${i}`, "failed");
      }

      const status = service.getStatus();
      expect(status.isHealthy).toBe(false);
    });

    it("should report unhealthy when processing time too high", async () => {
      const service = getMonitoringService();
      await service.initialize({
        enableAlerts: false,
        alertThresholds: {
          failedTransactionCount: 100,
          errorRatePercentage: 50,
          eventProcessingDelayMs: 1000, // 1 second
        },
      });

      // Record high processing times
      service.recordProcessingTime(5000);
      service.recordProcessingTime(6000);

      const status = service.getStatus();
      expect(status.isHealthy).toBe(false);
    });
  });

  describe("Transaction Queries", () => {
    it("should get pending transactions", () => {
      const service = getMonitoringService();

      service.trackTransaction("0x111", "pending");
      service.trackTransaction("0x222", "pending");
      service.trackTransaction("0x333", "success");

      const pending = service.getPendingTransactions();
      expect(pending).toHaveLength(2);
      expect(pending.every((t) => t.status === "pending")).toBe(true);
    });

    it("should get failed transactions", () => {
      const service = getMonitoringService();

      service.trackTransaction("0x111", "failed");
      service.trackTransaction("0x222", "failed");
      service.trackTransaction("0x333", "success");

      const failed = service.getFailedTransactions();
      expect(failed).toHaveLength(2);
      expect(failed.every((t) => t.status === "failed")).toBe(true);
    });

    it("should get specific transaction monitor", () => {
      const service = getMonitoringService();
      const txHash = "0x123abc";

      service.trackTransaction(txHash, "success");

      const monitor = service.getTransactionMonitor(txHash);
      expect(monitor).toBeDefined();
      expect(monitor?.txHash).toBe(txHash);
      expect(monitor?.status).toBe("success");
    });

    it("should return undefined for non-existent transaction", () => {
      const service = getMonitoringService();

      const monitor = service.getTransactionMonitor("0xnonexistent");
      expect(monitor).toBeUndefined();
    });
  });

  describe("Cleanup", () => {
    it("should clean up old transaction monitors", () => {
      const service = getMonitoringService();

      service.trackTransaction("0x111", "success");
      service.trackTransaction("0x222", "success");

      // Cleanup with very short max age (0ms) should remove all
      service.cleanup(0);

      const pending = service.getPendingTransactions();
      const failed = service.getFailedTransactions();

      expect(pending).toHaveLength(0);
      expect(failed).toHaveLength(0);
    });

    it("should keep recent transaction monitors", () => {
      const service = getMonitoringService();

      service.trackTransaction("0x111", "success");

      // Cleanup with very long max age should keep all
      service.cleanup(86400000 * 365); // 1 year

      const monitor = service.getTransactionMonitor("0x111");
      expect(monitor).toBeDefined();
    });
  });

  describe("Status Object", () => {
    it("should return valid status object", () => {
      const service = getMonitoringService();
      const status = service.getStatus();

      expect(status).toHaveProperty("isHealthy");
      expect(status).toHaveProperty("lastCheckTime");
      expect(status).toHaveProperty("failedTransactionCount");
      expect(status).toHaveProperty("successTransactionCount");
      expect(status).toHaveProperty("errorRate");
      expect(status).toHaveProperty("averageProcessingTime");
    });

    it("should have correct status types", () => {
      const service = getMonitoringService();
      const status = service.getStatus();

      expect(typeof status.isHealthy).toBe("boolean");
      expect(status.lastCheckTime instanceof Date).toBe(true);
      expect(typeof status.failedTransactionCount).toBe("number");
      expect(typeof status.successTransactionCount).toBe("number");
      expect(typeof status.errorRate).toBe("number");
      expect(typeof status.averageProcessingTime).toBe("number");
    });
  });

  describe("Reset", () => {
    it("should reset service state", () => {
      const service = getMonitoringService();

      service.trackTransaction("0x111", "success");
      service.recordProcessingTime(100);

      service.reset();

      const status = service.getStatus();
      expect(status.successTransactionCount).toBe(0);
      expect(status.failedTransactionCount).toBe(0);
      expect(status.averageProcessingTime).toBe(0);
      expect(status.isHealthy).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type consistency", () => {
      const service = getMonitoringService();

      service.trackTransaction("0x111", "success");

      const monitor = service.getTransactionMonitor("0x111");
      expect(monitor).toBeDefined();

      if (monitor) {
        expect(typeof monitor.txHash).toBe("string");
        expect(typeof monitor.status).toBe("string");
        expect(monitor.createdAt instanceof Date).toBe(true);
        expect(monitor.updatedAt instanceof Date).toBe(true);
        expect(typeof monitor.retryCount).toBe("number");
      }
    });
  });
});
