import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecoveryMetricsService } from "./recoveryMetrics";

describe("RecoveryMetricsService", () => {
  let service: RecoveryMetricsService;

  beforeEach(() => {
    service = new RecoveryMetricsService();
  });

  describe("Recovery Events", () => {
    it("should log recovery event", async () => {
      const event = {
        eventType: "health_check" as const,
        status: "success" as const,
        component: "event_listener",
        details: { isRunning: true, processedEvents: 100 },
      };

      await expect(service.logRecoveryEvent(event)).resolves.toBeUndefined();
    });

    it("should handle different event types", async () => {
      const eventTypes: Array<"health_check" | "recovery_attempt" | "failover" | "restart" | "error"> = [
        "health_check",
        "recovery_attempt",
        "failover",
        "restart",
        "error",
      ];

      for (const eventType of eventTypes) {
        const event = {
          eventType,
          status: "success" as const,
          component: "test_component",
          details: {},
        };

        await expect(service.logRecoveryEvent(event)).resolves.toBeUndefined();
      }
    });

    it("should handle event status", async () => {
      const successEvent = {
        eventType: "recovery_attempt" as const,
        status: "success" as const,
        component: "blockchain_service",
        details: { rpcEndpoint: "https://bsc.example.com" },
      };

      const failureEvent = {
        eventType: "recovery_attempt" as const,
        status: "failure" as const,
        component: "blockchain_service",
        details: { error: "Connection timeout" },
      };

      await expect(service.logRecoveryEvent(successEvent)).resolves.toBeUndefined();
      await expect(service.logRecoveryEvent(failureEvent)).resolves.toBeUndefined();
    });
  });

  describe("Metrics Snapshots", () => {
    it("should record metrics snapshot", async () => {
      const snapshot = {
        component: "event_listener",
        uptime: 3600000,
        restarts: 0,
        failovers: 0,
        totalErrors: 0,
        snapshot: {
          lastProcessedBlock: 5000,
          processedEventCount: 150,
        },
      };

      await expect(service.recordMetricsSnapshot(snapshot)).resolves.toBeUndefined();
    });

    it("should handle snapshot with error information", async () => {
      const snapshot = {
        component: "blockchain_service",
        uptime: 1800000,
        restarts: 1,
        failovers: 2,
        totalErrors: 3,
        lastRestart: new Date(),
        lastFailover: new Date(),
        lastError: "RPC connection failed",
        snapshot: { currentRpc: "https://bsc.example.com" },
      };

      await expect(service.recordMetricsSnapshot(snapshot)).resolves.toBeUndefined();
    });
  });

  describe("Recovery Events Query", () => {
    it("should get recovery events for component", async () => {
      const events = await service.getRecoveryEvents("event_listener", 50, 0);
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(0);
    });

    it("should support pagination", async () => {
      const events1 = await service.getRecoveryEvents("event_listener", 10, 0);
      const events2 = await service.getRecoveryEvents("event_listener", 10, 10);

      expect(Array.isArray(events1)).toBe(true);
      expect(Array.isArray(events2)).toBe(true);
    });
  });

  describe("Metrics Summary", () => {
    it("should get metrics summary", async () => {
      const summary = await service.getMetricsSummary("event_listener");

      expect(summary).toHaveProperty("component");
      expect(summary).toHaveProperty("totalEvents");
      expect(summary).toHaveProperty("successRate");
      expect(summary.component).toBe("event_listener");
    });

    it("should return valid success rate", async () => {
      const summary = await service.getMetricsSummary("blockchain_service");
      expect(summary.successRate).toBeGreaterThanOrEqual(0);
      expect(summary.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe("Health Summary", () => {
    it("should get overall health summary", async () => {
      const summary = await service.getHealthSummary();

      expect(summary).toHaveProperty("components");
      expect(summary).toHaveProperty("overallHealth");
      expect(Array.isArray(summary.components)).toBe(true);
    });

    it("should include component status", async () => {
      const summary = await service.getHealthSummary();

      summary.components.forEach((component) => {
        expect(component).toHaveProperty("name");
        expect(component).toHaveProperty("status");
        expect(component).toHaveProperty("uptime");
        expect(component).toHaveProperty("restarts");
        expect(["healthy", "degraded", "failed"]).toContain(component.status);
      });
    });

    it("should report overall health status", async () => {
      const summary = await service.getHealthSummary();
      expect(["healthy", "degraded", "failed"]).toContain(summary.overallHealth);
    });
  });

  describe("Recovery Report Export", () => {
    it("should export recovery report", async () => {
      const startDate = new Date(Date.now() - 86400000); // 1 day ago
      const endDate = new Date();

      const report = await service.exportRecoveryReport(startDate, endDate);

      expect(report).toHaveProperty("period");
      expect(report).toHaveProperty("totalEvents");
      expect(report).toHaveProperty("eventsByType");
      expect(report).toHaveProperty("componentsSummary");
      expect(report).toHaveProperty("successRate");
    });

    it("should include event type breakdown", async () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();

      const report = await service.exportRecoveryReport(startDate, endDate);

      expect(report.eventsByType).toHaveProperty("health_check");
      expect(report.eventsByType).toHaveProperty("recovery_attempt");
      expect(report.eventsByType).toHaveProperty("failover");
      expect(report.eventsByType).toHaveProperty("restart");
      expect(report.eventsByType).toHaveProperty("error");
    });

    it("should report date range", async () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();

      const report = await service.exportRecoveryReport(startDate, endDate);

      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup old events", async () => {
      const deletedCount = await service.cleanupOldEvents(30);
      expect(typeof deletedCount).toBe("number");
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });

    it("should support custom retention period", async () => {
      const deletedCount1 = await service.cleanupOldEvents(7);
      const deletedCount2 = await service.cleanupOldEvents(90);

      expect(typeof deletedCount1).toBe("number");
      expect(typeof deletedCount2).toBe("number");
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", async () => {
      const event = {
        eventType: "error" as const,
        status: "failure" as const,
        component: "unknown_component",
        details: { error: "Test error" },
      };

      await expect(service.logRecoveryEvent(event)).resolves.toBeUndefined();
    });

    it("should continue on database unavailable", async () => {
      const snapshot = {
        component: "test_component",
        uptime: 0,
        restarts: 0,
        failovers: 0,
        totalErrors: 0,
        snapshot: {},
      };

      await expect(service.recordMetricsSnapshot(snapshot)).resolves.toBeUndefined();
    });
  });

  describe("Integration", () => {
    it("should handle complete recovery workflow", async () => {
      // Log health check
      await service.logRecoveryEvent({
        eventType: "health_check",
        status: "failure",
        component: "event_listener",
        details: { isRunning: false },
      });

      // Log recovery attempt
      await service.logRecoveryEvent({
        eventType: "recovery_attempt",
        status: "success",
        component: "event_listener",
        details: { rpcEndpoint: "https://bsc.example.com" },
      });

      // Record metrics
      await service.recordMetricsSnapshot({
        component: "event_listener",
        uptime: 3600000,
        restarts: 1,
        failovers: 0,
        totalErrors: 1,
        snapshot: { recovered: true },
      });

      // Get summary
      const summary = await service.getMetricsSummary("event_listener");
      expect(summary.component).toBe("event_listener");

      // Get health
      const health = await service.getHealthSummary();
      expect(health.overallHealth).toBeDefined();
    });
  });
});
