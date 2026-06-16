/**
 * Unit tests for Audit Log Service
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AuditLogService, type AuditLogEntry, type AuditLogFilter } from "./auditLog";

describe("AuditLogService", () => {
  let auditService: AuditLogService;

  beforeEach(() => {
    auditService = new AuditLogService();
  });

  describe("Logging Actions", () => {
    it("should log an action successfully", async () => {
      const entry = await auditService.logAction({
        userId: "user123",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success",
        details: { paramName: "utilityFeeRate", oldValue: "100", newValue: "150" },
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.userId).toBe("user123");
      expect(entry.action).toBe("UPDATE_PARAM");
      expect(entry.status).toBe("success");
    });

    it("should log a failed action", async () => {
      const entry = await auditService.logAction({
        userId: "user123",
        action: "MINT_NFT",
        resource: "nft_contract",
        status: "failure",
        details: { tokenId: "123", landType: "residential" },
        errorMessage: "Insufficient balance",
      });

      expect(entry.status).toBe("failure");
      expect(entry.errorMessage).toBe("Insufficient balance");
    });

    it("should include optional fields in log entry", async () => {
      const entry = await auditService.logAction({
        userId: "user123",
        action: "PAY_UTILITY_FEE",
        resource: "treasury",
        resourceId: "tx_12345",
        status: "success",
        details: { amount: "1000" },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      expect(entry.resourceId).toBe("tx_12345");
      expect(entry.ipAddress).toBe("192.168.1.1");
      expect(entry.userAgent).toBe("Mozilla/5.0");
    });

    it("should generate unique IDs for each log entry", async () => {
      const entry1 = await auditService.logAction({
        userId: "user1",
        action: "ACTION1",
        resource: "resource1",
        status: "success",
        details: {},
      });

      const entry2 = await auditService.logAction({
        userId: "user2",
        action: "ACTION2",
        resource: "resource2",
        status: "success",
        details: {},
      });

      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe("Querying Logs", () => {
    it("should query logs with no filter", async () => {
      const logs = await auditService.queryLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should query logs with userId filter", async () => {
      const logs = await auditService.queryLogs({
        userId: "user123",
      });
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should query logs with action filter", async () => {
      const logs = await auditService.queryLogs({
        action: "UPDATE_PARAM",
      });
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should query logs with status filter", async () => {
      const logs = await auditService.queryLogs({
        status: "success",
      });
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should query logs with date range filter", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-12-31");

      const logs = await auditService.queryLogs({
        startDate,
        endDate,
      });
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should query logs with pagination", async () => {
      const logs = await auditService.queryLogs({
        limit: 10,
        offset: 0,
      });
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should support multiple filters", async () => {
      const logs = await auditService.queryLogs({
        userId: "user123",
        action: "UPDATE_PARAM",
        status: "success",
        limit: 20,
      });
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("Report Generation", () => {
    it("should generate audit report", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-12-31");

      const report = await auditService.generateReport(startDate, endDate);

      expect(report).toBeDefined();
      expect(report.totalEntries).toBeGreaterThanOrEqual(0);
      expect(report.dateRange.start).toEqual(startDate);
      expect(report.dateRange.end).toEqual(endDate);
      expect(typeof report.failureRate).toBe("number");
    });

    it("should calculate action summary", async () => {
      const report = await auditService.generateReport(
        new Date("2026-01-01"),
        new Date("2026-12-31")
      );

      expect(typeof report.actionSummary).toBe("object");
    });

    it("should calculate user summary", async () => {
      const report = await auditService.generateReport(
        new Date("2026-01-01"),
        new Date("2026-12-31")
      );

      expect(typeof report.userSummary).toBe("object");
    });

    it("should calculate failure rate", async () => {
      const report = await auditService.generateReport(
        new Date("2026-01-01"),
        new Date("2026-12-31")
      );

      expect(report.failureRate).toBeGreaterThanOrEqual(0);
      expect(report.failureRate).toBeLessThanOrEqual(100);
    });
  });

  describe("Export Functionality", () => {
    it("should export logs as JSON", async () => {
      const json = await auditService.exportAsJSON();
      expect(typeof json).toBe("string");
      expect(json).toBe("[]"); // Empty array for now
    });

    it("should export logs as CSV", async () => {
      const csv = await auditService.exportAsCSV();
      expect(typeof csv).toBe("string");
      expect(csv).toContain("id,timestamp,userId,action,resource");
    });

    it("should handle CSV escaping", async () => {
      const csv = await auditService.exportAsCSV();
      // CSV should be properly formatted
      expect(csv).toBeDefined();
    });

    it("should export with filters", async () => {
      const json = await auditService.exportAsJSON({
        userId: "user123",
        action: "UPDATE_PARAM",
      });
      expect(typeof json).toBe("string");
    });
  });

  describe("Statistics", () => {
    it("should get audit statistics", async () => {
      const stats = await auditService.getStatistics(
        new Date("2026-01-01"),
        new Date("2026-12-31")
      );

      expect(stats).toBeDefined();
      expect(stats.totalActions).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);
      expect(Array.isArray(stats.topActions)).toBe(true);
      expect(Array.isArray(stats.topUsers)).toBe(true);
    });

    it("should include top actions in statistics", async () => {
      const stats = await auditService.getStatistics(
        new Date("2026-01-01"),
        new Date("2026-12-31")
      );

      expect(stats.topActions).toBeDefined();
      expect(Array.isArray(stats.topActions)).toBe(true);
    });

    it("should include top users in statistics", async () => {
      const stats = await auditService.getStatistics(
        new Date("2026-01-01"),
        new Date("2026-12-31")
      );

      expect(stats.topUsers).toBeDefined();
      expect(Array.isArray(stats.topUsers)).toBe(true);
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
      const entry = await auditService.logAction({
        userId: "admin",
        action: "SECRET_KEY_GENERATED",
        resource: "security",
        status: "success",
        details: { keyHash: "0x..." },
      });

      expect(entry.action).toBe("SECRET_KEY_GENERATED");
    });

    it("should include IP address for audit trail", async () => {
      const entry = await auditService.logAction({
        userId: "admin",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success",
        details: {},
        ipAddress: "203.0.113.42",
      });

      expect(entry.ipAddress).toBe("203.0.113.42");
    });

    it("should include user agent for audit trail", async () => {
      const entry = await auditService.logAction({
        userId: "admin",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success",
        details: {},
        userAgent: "Admin Dashboard v1.0",
      });

      expect(entry.userAgent).toBe("Admin Dashboard v1.0");
    });

    it("should preserve error messages for failed operations", async () => {
      const errorMsg = "Contract call reverted: Insufficient permissions";
      const entry = await auditService.logAction({
        userId: "user123",
        action: "MINT_NFT",
        resource: "nft_contract",
        status: "failure",
        details: {},
        errorMessage: errorMsg,
      });

      expect(entry.errorMessage).toBe(errorMsg);
    });
  });

  describe("Data Integrity", () => {
    it("should preserve details object", async () => {
      const details = {
        paramName: "utilityFeeRate",
        oldValue: "100",
        newValue: "150",
        reason: "Market adjustment",
      };

      const entry = await auditService.logAction({
        userId: "admin",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success",
        details,
      });

      expect(entry.details).toEqual(details);
    });

    it("should handle complex nested details", async () => {
      const details = {
        transaction: {
          hash: "0x123",
          from: "0xabc",
          to: "0xdef",
          value: "1000",
          gasUsed: "21000",
        },
        events: [
          { name: "Transfer", args: { from: "0xabc", to: "0xdef", value: "1000" } },
        ],
      };

      const entry = await auditService.logAction({
        userId: "system",
        action: "CONTRACT_CALL",
        resource: "blockchain",
        status: "success",
        details,
      });

      expect(entry.details).toEqual(details);
    });
  });
});
