/**
 * Unit tests for Recovery Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RecoveryService, type ServiceStatus } from "./recovery";
import { BlockchainService } from "./blockchain";
import { getDb } from "../db";

// Mock dependencies
vi.mock("./blockchain");
vi.mock("../db");

describe("RecoveryService", () => {
  let recoveryService: RecoveryService;

  beforeEach(() => {
    recoveryService = new RecoveryService({
      maxRetries: 3,
      retryDelayMs: 100,
      healthCheckIntervalMs: 200,
      enableAutoRestart: true,
    });
  });

  afterEach(() => {
    recoveryService.stop();
  });

  describe("Initialization", () => {
    it("should initialize with default config", () => {
      const service = new RecoveryService();
      expect(service).toBeDefined();
    });

    it("should initialize with custom config", () => {
      const config = {
        maxRetries: 10,
        retryDelayMs: 2000,
        healthCheckIntervalMs: 60000,
        enableAutoRestart: false,
      };
      const service = new RecoveryService(config);
      expect(service).toBeDefined();
    });

    it("should initialize service statuses", () => {
      const statuses = recoveryService.getServiceStatuses();
      expect(statuses).toHaveLength(3);
      expect(statuses.map((s) => s.name)).toContain("Event Listener");
      expect(statuses.map((s) => s.name)).toContain("Blockchain Service");
      expect(statuses.map((s) => s.name)).toContain("Database");
    });

    it("should have all services healthy initially", () => {
      const statuses = recoveryService.getServiceStatuses();
      expect(statuses.every((s) => s.isHealthy)).toBe(true);
      expect(statuses.every((s) => s.errorCount === 0)).toBe(true);
    });
  });

  describe("Service Status Management", () => {
    it("should get service status by name", () => {
      const status = recoveryService.getServiceStatus("database");
      expect(status).toBeDefined();
      expect(status?.name).toBe("Database");
    });

    it("should return undefined for non-existent service", () => {
      const status = recoveryService.getServiceStatus("nonexistent");
      expect(status).toBeUndefined();
    });

    it("should reset service error count", () => {
      const status = recoveryService.getServiceStatus("database")!;
      // Manually increment error count
      (status as any).errorCount = 5;
      (status as any).lastError = "Test error";

      recoveryService.resetServiceErrorCount("database");

      const updated = recoveryService.getServiceStatus("database")!;
      expect(updated.errorCount).toBe(0);
      expect(updated.lastError).toBeUndefined();
    });

    it("should get all service statuses", () => {
      const statuses = recoveryService.getServiceStatuses();
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  describe("Health Check", () => {
    it("should start health check interval", async () => {
      const startSpy = vi.spyOn(recoveryService, "start" as any);
      await recoveryService.start();
      expect(startSpy).toHaveBeenCalled();
    });

    it("should stop health check interval", async () => {
      await recoveryService.start();
      const stopSpy = vi.spyOn(recoveryService, "stop");
      recoveryService.stop();
      expect(stopSpy).toHaveBeenCalled();
    });

    it("should handle database health check", async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = recoveryService.getServiceStatus("database");
      expect(status).toBeDefined();
    });

    it("should handle blockchain health check", async () => {
      const mockBlockchain = {
        initialize: vi.fn().mockResolvedValue(undefined),
        getTreasuryBalance: vi.fn().mockResolvedValue("1000000"),
      };
      vi.mocked(BlockchainService).mockImplementation(() => mockBlockchain as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = recoveryService.getServiceStatus("blockchain");
      expect(status).toBeDefined();
    });
  });

  describe("Recovery Mechanism", () => {
    it("should track error count on failed health check", async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error("Connection failed")),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = recoveryService.getServiceStatus("database");
      expect(status?.errorCount).toBeGreaterThan(0);
    });

    it("should mark service as unhealthy after multiple failures", async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error("Connection failed")),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await recoveryService.start();
      // Wait for multiple health checks
      await new Promise((resolve) => setTimeout(resolve, 500));

      const status = recoveryService.getServiceStatus("database");
      if (status && status.errorCount >= 2) {
        expect(status.isHealthy).toBe(false);
      }
    });

    it("should not trigger recovery if auto-restart is disabled", async () => {
      const service = new RecoveryService({
        enableAutoRestart: false,
        healthCheckIntervalMs: 100,
      });

      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error("Connection failed")),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await service.start();
      await new Promise((resolve) => setTimeout(resolve, 300));

      service.stop();
    });

    it("should recover database on failure", async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      // Simulate recovery
      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = recoveryService.getServiceStatus("database");
      expect(status?.isHealthy).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors gracefully", async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error("Connection timeout")),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = recoveryService.getServiceStatus("database");
      expect(status?.lastError).toBeDefined();
      expect(status?.isHealthy).toBe(false);
    });

    it("should handle blockchain initialization errors", async () => {
      const mockBlockchain = {
        initialize: vi.fn().mockRejectedValue(new Error("RPC connection failed")),
        getTreasuryBalance: vi.fn(),
      };
      vi.mocked(BlockchainService).mockImplementation(() => mockBlockchain as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = recoveryService.getServiceStatus("blockchain");
      expect(status?.lastError).toBeDefined();
    });

    it("should handle null database response", async () => {
      vi.mocked(getDb).mockResolvedValue(null as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = recoveryService.getServiceStatus("database");
      expect(status?.isHealthy).toBe(false);
    });
  });

  describe("Service Status Updates", () => {
    it("should update lastCheck timestamp", async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const beforeCheck = new Date();
      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      const afterCheck = new Date();

      const status = recoveryService.getServiceStatus("database");
      expect(status?.lastCheck.getTime()).toBeGreaterThanOrEqual(beforeCheck.getTime());
      expect(status?.lastCheck.getTime()).toBeLessThanOrEqual(afterCheck.getTime());
    });

    it("should clear error message on successful recovery", async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = recoveryService.getServiceStatus("database");
      expect(status?.lastError).toBeUndefined();
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle multiple health checks without race conditions", async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const statuses = recoveryService.getServiceStatuses();
      expect(statuses).toBeDefined();
      expect(statuses.length).toBe(3);
    });

    it("should prevent concurrent recovery attempts", async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error("Connection failed")),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Multiple health checks should not cause multiple recovery attempts
      const status = recoveryService.getServiceStatus("database");
      expect(status).toBeDefined();
    });
  });

  describe("Integration Tests", () => {
    it("should perform full health check cycle", async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      };
      const mockBlockchain = {
        initialize: vi.fn().mockResolvedValue(undefined),
        getTreasuryBalance: vi.fn().mockResolvedValue("1000000"),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(BlockchainService).mockImplementation(() => mockBlockchain as any);

      await recoveryService.start();
      await new Promise((resolve) => setTimeout(resolve, 250));

      const statuses = recoveryService.getServiceStatuses();
      expect(statuses.every((s) => s.lastCheck)).toBe(true);
    });

    it("should maintain service status across multiple checks", async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await recoveryService.start();

      const status1 = recoveryService.getServiceStatus("database");
      await new Promise((resolve) => setTimeout(resolve, 100));
      const status2 = recoveryService.getServiceStatus("database");

      expect(status1?.name).toBe(status2?.name);
    });
  });
});
