/**
 * Unit tests for Audit Log Database Helpers
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  insertAuditLog,
  queryAuditLogs,
  getAuditLogCount,
  deleteOldAuditLogs,
} from "./db.audit";
import { getDb } from "./db";

// Mock the database
vi.mock("./db");

describe("Audit Log Database Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("insertAuditLog", () => {
    it("should insert an audit log entry", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const entry = {
        userId: "user123",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success" as const,
        details: { paramName: "utilityFeeRate" },
      };

      await insertAuditLog(entry);

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should handle database unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const entry = {
        userId: "user123",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success" as const,
        details: {},
      };

      await expect(insertAuditLog(entry)).resolves.not.toThrow();
    });

    it("should handle insert errors", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockRejectedValue(new Error("Insert failed")),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const entry = {
        userId: "user123",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success" as const,
        details: {},
      };

      await expect(insertAuditLog(entry)).rejects.toThrow("Insert failed");
    });
  });

  describe("queryAuditLogs", () => {
    it("should query all audit logs", async () => {
      const mockLogs = [
        {
          id: 1,
          timestamp: new Date(),
          userId: "user1",
          action: "UPDATE_PARAM",
          resource: "contract_params",
          resourceId: null,
          status: "success" as const,
          details: null,
          ipAddress: null,
          userAgent: null,
          errorMessage: null,
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockLogs),
                }),
              }),
            }),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const logs = await queryAuditLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should query with userId filter", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await queryAuditLogs({ userId: "user123" });
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should query with status filter", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await queryAuditLogs({ status: "failure" });
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should handle database unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const logs = await queryAuditLogs();
      expect(logs).toEqual([]);
    });
  });

  describe("getAuditLogCount", () => {
    it("should get audit log count", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { id: 1 },
              { id: 2 },
              { id: 3 },
            ] as any),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const count = await getAuditLogCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should handle database unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const count = await getAuditLogCount();
      expect(count).toBe(0);
    });
  });

  describe("deleteOldAuditLogs", () => {
    it("should delete old audit logs", async () => {
      const mockDb = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await deleteOldAuditLogs(90);
      expect(result).toBe(1);
    });

    it("should handle custom retention period", async () => {
      const mockDb = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await deleteOldAuditLogs(30);
      expect(result).toBe(1);
    });

    it("should handle database unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const result = await deleteOldAuditLogs();
      expect(result).toBe(0);
    });
  });

  describe("Integration", () => {
    it("should support insert operation", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const entry = {
        userId: "admin",
        action: "UPDATE_PARAM",
        resource: "contract_params",
        status: "success" as const,
        details: { paramName: "utilityFeeRate" },
      };

      await insertAuditLog(entry);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
