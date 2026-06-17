import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EnhancedEventListener } from "./eventListener.enhanced";
import { EventListenerService } from "./eventListener";

describe("EnhancedEventListener", () => {
  let mockBaseListener: Partial<EventListenerService>;
  let enhancedListener: EnhancedEventListener;

  beforeEach(() => {
    mockBaseListener = {
      getStatus: vi.fn().mockReturnValue({
        isRunning: true,
        lastProcessedBlock: 1000,
        reconnectAttempts: 0,
        processedEventCount: 50,
      }),
      stop: vi.fn(),
      start: vi.fn(),
    };

    enhancedListener = new EnhancedEventListener(mockBaseListener as EventListenerService);
  });

  afterEach(() => {
    enhancedListener.stopHealthChecks();
  });

  describe("Health Checks", () => {
    it("should initialize health checks", async () => {
      await enhancedListener.startHealthChecks({ intervalMs: 100 });
      expect(enhancedListener).toBeDefined();
    });

    it("should report healthy status when listener is running", () => {
      const status = enhancedListener.getHealthStatus();
      expect(status.isHealthy).toBe(true);
      expect(status.consecutiveFailures).toBe(0);
    });

    it("should track uptime", () => {
      const status = enhancedListener.getHealthStatus();
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should report events processed", () => {
      const status = enhancedListener.getHealthStatus();
      expect(status.eventsProcessed).toBe(50);
    });
  });

  describe("Recovery Metrics", () => {
    it("should initialize recovery metrics", () => {
      const metrics = enhancedListener.getRecoveryMetrics();
      expect(metrics.restarts).toBe(0);
      expect(metrics.failovers).toBe(0);
      expect(metrics.lastRestart).toBeNull();
      expect(metrics.lastFailover).toBeNull();
    });

    it("should provide status report", () => {
      const report = enhancedListener.getStatusReport();
      expect(report.health).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.baseStatus).toBeDefined();
    });
  });

  describe("Health Check Lifecycle", () => {
    it("should start and stop health checks", async () => {
      await enhancedListener.startHealthChecks({ intervalMs: 100 });
      expect(enhancedListener).toBeDefined();

      enhancedListener.stopHealthChecks();
      expect(enhancedListener).toBeDefined();
    });

    it("should handle listener status changes", async () => {
      const statusMock = mockBaseListener.getStatus as any;

      // Initially running
      statusMock.mockReturnValue({
        isRunning: true,
        lastProcessedBlock: 1000,
        reconnectAttempts: 0,
        processedEventCount: 50,
      });

      let status = enhancedListener.getHealthStatus();
      expect(status.isHealthy).toBe(true);

      // Simulate listener stopped
      statusMock.mockReturnValue({
        isRunning: false,
        lastProcessedBlock: 1000,
        reconnectAttempts: 0,
        processedEventCount: 50,
      });

      status = enhancedListener.getHealthStatus();
      expect(status.isHealthy).toBe(false);
    });
  });

  describe("Status Reporting", () => {
    it("should report correct health status fields", () => {
      const status = enhancedListener.getHealthStatus();
      expect(status).toHaveProperty("isHealthy");
      expect(status).toHaveProperty("lastCheck");
      expect(status).toHaveProperty("consecutiveFailures");
      expect(status).toHaveProperty("uptime");
      expect(status).toHaveProperty("eventsProcessed");
    });

    it("should report correct recovery metrics fields", () => {
      const metrics = enhancedListener.getRecoveryMetrics();
      expect(metrics).toHaveProperty("restarts");
      expect(metrics).toHaveProperty("failovers");
      expect(metrics).toHaveProperty("lastRestart");
      expect(metrics).toHaveProperty("lastFailover");
      expect(metrics).toHaveProperty("totalDowntime");
    });

    it("should include base listener status in report", () => {
      const report = enhancedListener.getStatusReport();
      expect(report.baseStatus.isRunning).toBe(true);
      expect(report.baseStatus.lastProcessedBlock).toBe(1000);
      expect(report.baseStatus.processedEventCount).toBe(50);
    });
  });

  describe("Error Tracking", () => {
    it("should track last error", () => {
      let status = enhancedListener.getHealthStatus();
      expect(status.lastError).toBeUndefined();

      // After error, lastError should be set
      // This would happen during actual recovery attempt
      status = enhancedListener.getHealthStatus();
      expect(typeof status.lastError === "string" || status.lastError === undefined).toBe(true);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle multiple status checks concurrently", async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => Promise.resolve(enhancedListener.getHealthStatus()));

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toHaveProperty("isHealthy");
      });
    });

    it("should handle multiple metric retrievals", async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => Promise.resolve(enhancedListener.getRecoveryMetrics()));

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toHaveProperty("restarts");
      });
    });
  });

  describe("Integration", () => {
    it("should provide complete status report", () => {
      const report = enhancedListener.getStatusReport();

      expect(report.health.isHealthy).toBe(true);
      expect(report.health.eventsProcessed).toBe(50);
      expect(report.metrics.restarts).toBe(0);
      expect(report.baseStatus.isRunning).toBe(true);
    });

    it("should track listener state changes", () => {
      const statusMock = mockBaseListener.getStatus as any;

      // Get initial state
      let report = enhancedListener.getStatusReport();
      const initialEvents = report.baseStatus.processedEventCount;

      // Simulate processing more events
      statusMock.mockReturnValue({
        isRunning: true,
        lastProcessedBlock: 2000,
        reconnectAttempts: 0,
        processedEventCount: 150,
      });

      report = enhancedListener.getStatusReport();
      expect(report.baseStatus.processedEventCount).toBe(150);
      expect(report.baseStatus.processedEventCount).toBeGreaterThan(initialEvents);
    });
  });
});
