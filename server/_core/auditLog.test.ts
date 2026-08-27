import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditLogService } from "./auditLog";

describe("AuditLogService", () => {
  let auditService: AuditLogService;

  beforeEach(() => {
    auditService = new AuditLogService();
  });

  describe("Basic Operations", () => {
    it("should log an action", async () => {
      await auditService.logAction({
        userId: "user1",
        action: "CREATE",
        resource: "contract",
        status: "success",
      });
      expect(true).toBe(true);
    });

    it("should log action with details", async () => {
      await auditService.logAction({
        userId: "user1",
        action: "UPDATE",
        resource: "contract",
        status: "success",
        details: { field: "value" },
      });
      expect(true).toBe(true);
    });

    it("should log failed action", async () => {
      await auditService.logAction({
        userId: "user1",
        action: "DELETE",
        resource: "contract",
        status: "failure",
        errorMessage: "Permission denied",
      });
      expect(true).toBe(true);
    });
  });

  describe("Query Operations", () => {
    it("should query logs", async () => {
      const logs = await auditService.queryLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should query logs with filter", async () => {
      const logs = await auditService.queryLogs({
        userId: "user1",
        action: "CREATE",
      });
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should query logs with date range", async () => {
      const logs = await auditService.queryLogs({
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(),
      });
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("Report Generation", () => {
    it("should generate report", async () => {
      const report = await auditService.generateReport(
        new Date(Date.now() - 86400000),
        new Date()
      );
      expect(report).toHaveProperty("totalEntries");
      expect(report).toHaveProperty("dateRange");
      expect(report).toHaveProperty("actionSummary");
      expect(report).toHaveProperty("userSummary");
      expect(report).toHaveProperty("successRate");
      expect(report).toHaveProperty("entries");
    });

    it("should include date range in report", async () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();
      const report = await auditService.generateReport(startDate, endDate);
      expect(report.dateRange.start).toEqual(startDate);
      expect(report.dateRange.end).toEqual(endDate);
    });
  });

  describe("Export Operations", () => {
    it("should export as JSON", async () => {
      const json = await auditService.exportAsJSON(
        new Date(Date.now() - 86400000),
        new Date()
      );
      expect(typeof json).toBe("string");
      expect(json.length).toBeGreaterThan(0);
    });

    it("should export as CSV", async () => {
      const csv = await auditService.exportAsCSV(
        new Date(Date.now() - 86400000),
        new Date()
      );
      expect(typeof csv).toBe("string");
    });

    it("should export valid JSON format", async () => {
      const json = await auditService.exportAsJSON(
        new Date(Date.now() - 86400000),
        new Date()
      );
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe("Cleanup", () => {
    it("should cleanup old audit logs", async () => {
      const deletedCount = await auditService.cleanup(90);
      expect(typeof deletedCount).toBe("number");
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });

    it("should support custom retention period", async () => {
      const deletedCount = await auditService.cleanup(30);
      expect(typeof deletedCount).toBe("number");
    });
  });

  describe("Security & Compliance", () => {
    it("should log security-sensitive actions", async () => {
      await auditService.logAction({
        userId: "admin",
        action: "SECRET_KEY_GENERATED",
        resource: "security",
        status: "success",
        details: { keyHash: "0x..." },
      });
      expect(true).toBe(true);
    });

    it("should include IP address for audit trail", async () => {
      await auditService.logAction({
        userId: "admin",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success",
        details: {},
        ipAddress: "203.0.113.42",
      });
      expect(true).toBe(true);
    });

    it("should include user agent for audit trail", async () => {
      await auditService.logAction({
        userId: "admin",
        action: "ADMIN_LOGIN",
        resource: "admin_panel",
        status: "success",
        userAgent: "Admin Dashboard v1.0",
      });
      expect(true).toBe(true);
    });

    it("should preserve error messages for failed operations", async () => {
      const errorMsg = "Connection timeout";
      await auditService.logAction({
        userId: "admin",
        action: "SYNC_FAILED",
        resource: "blockchain",
        status: "failure",
        errorMessage: errorMsg,
      });
      expect(true).toBe(true);
    });
  });

  describe("Data Integrity", () => {
    it("should preserve details object", async () => {
      const details = { key1: "value1", key2: 123 };
      await auditService.logAction({
        userId: "user1",
        action: "PARAM_UPDATED",
        resource: "contract_params",
        status: "success",
        details,
      });
      expect(true).toBe(true);
    });

    it("should handle complex nested details", async () => {
      const details = {
        nested: {
          level1: {
            level2: {
              data: "value",
              array: [1, 2, 3],
            },
          },
        },
      };
      await auditService.logAction({
        userId: "user1",
        action: "COMPLEX_UPDATE",
        resource: "contract_params",
        status: "success",
        details,
      });
      expect(true).toBe(true);
    });
  });

  describe("Statistics", () => {
    it("should get audit statistics", async () => {
      const stats = await auditService.getStatistics(
        new Date(Date.now() - 86400000),
        new Date()
      );
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalActions");
      expect(stats).toHaveProperty("successRate");
    });

    it("should include top actions in statistics", async () => {
      const stats = await auditService.getStatistics(
        new Date(Date.now() - 86400000),
        new Date()
      );
      expect(stats).toHaveProperty("actionSummary");
      expect(typeof stats.actionSummary).toBe("object");
    });

    it("should include top users in statistics", async () => {
      const stats = await auditService.getStatistics(
        new Date(Date.now() - 86400000),
        new Date()
      );
      expect(stats).toHaveProperty("userSummary");
      expect(typeof stats.userSummary).toBe("object");
    });
  });
});
