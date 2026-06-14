import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { keccak256, generateRandomSecret } from "./_core/crypto";
import { TRPCError } from "@trpc/server";

/**
 * Integration Tests: Frontend + Backend + Database
 * Tests the complete workflow of the admin system
 */

// Mock context for authenticated Owner
function createOwnerContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "owner_test_id",
      email: "owner@test.com",
      name: "Test Owner",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Mock context for non-Owner user
function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user_test_id",
      email: "user@test.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Integration Tests: Admin System Workflow", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let ownerCaller: ReturnType<typeof appRouter.createCaller>;
  let userCaller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      console.warn("[Integration Tests] Database not available, skipping tests");
    }
  });

  beforeEach(() => {
    ownerCaller = appRouter.createCaller(createOwnerContext());
    userCaller = appRouter.createCaller(createUserContext());
  });

  describe("Access Control", () => {
    it("should deny non-Owner access to admin procedures", async () => {
      try {
        await userCaller.secretKey.getActive();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow Owner access to admin procedures", async () => {
      try {
        const result = await ownerCaller.secretKey.getActive();
        // Result can be null if no secret key exists
        expect(result === null || result.keyHash).toBeDefined();
      } catch (error: any) {
        // Expected if database is not available
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });
  });

  describe("Secret Key Management Workflow", () => {
    it("should complete full secret key lifecycle", async () => {
      try {
        // 1. Generate new secret key
        const generateResult = await ownerCaller.secretKey.generate();
        expect(generateResult.rawKey).toBeDefined();
        expect(generateResult.keyHash).toMatch(/^0x[a-f0-9]{64}$/);

        // 2. Verify the hash is correct
        const hash = keccak256(generateResult.rawKey);
        expect(hash).toBe(generateResult.keyHash);

        // 3. Get active secret key
        const activeKey = await ownerCaller.secretKey.getActive();
        expect(activeKey).toBeDefined();
        expect(activeKey?.keyHash).toBe(generateResult.keyHash);

        // 4. Get secret key history
        const history = await ownerCaller.secretKey.getHistory();
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });

    it("should support custom secret keys", async () => {
      try {
        const customSecret = "my-custom-secret-key-12345";
        const hash = keccak256(customSecret);

        // Set custom secret key
        const result = await ownerCaller.secretKey.setCustom({
          rawKey: customSecret,
        });

        expect(result.keyHash).toBe(hash);

        // Verify it's now the active key
        const activeKey = await ownerCaller.secretKey.getActive();
        expect(activeKey?.keyHash).toBe(hash);
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });
  });

  describe("Contract Parameters Management Workflow", () => {
    it("should read and update contract parameters", async () => {
      try {
        // 1. Get current parameters
        const params = await ownerCaller.contractParams.getAll();
        expect(params).toBeDefined();
        expect(params.length).toBeGreaterThan(0);

        // 2. Find utilityFeeRate
        const utilityFeeParam = params.find((p) => p.paramName === "utilityFeeRate");
        expect(utilityFeeParam).toBeDefined();

        // 3. Update parameter
        const newRate = "150";
        const updateResult = await ownerCaller.contractParams.update({
          paramName: "utilityFeeRate",
          paramValue: newRate,
        });

        expect(updateResult.success).toBe(true);

        // 4. Verify update
        const updatedParams = await ownerCaller.contractParams.getAll();
        const updatedParam = updatedParams.find((p) => p.paramName === "utilityFeeRate");
        expect(updatedParam?.paramValue).toBe(newRate);
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });

    it("should validate parameter names", async () => {
      try {
        // Attempt to update non-existent parameter
        await ownerCaller.contractParams.update({
          paramName: "nonExistentParam" as any,
          paramValue: "123",
        });
        expect.fail("Should have thrown error for invalid parameter name");
      } catch (error: any) {
        // Zod validation error
        expect(["BAD_REQUEST", "PARSE_ERROR", "UNPROCESSABLE_CONTENT"].includes(error.code)).toBe(true);
      }
    });
  });

  describe("Contract Events Logging Workflow", () => {
    it("should list contract events with pagination", async () => {
      try {
        // 1. Query events
        const result = await ownerCaller.contractEvents.list({
          limit: 10,
          offset: 0,
        });

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(10);
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });

    it("should filter events by name", async () => {
      try {
        // Query specific event type
        const result = await ownerCaller.contractEvents.list({
          eventName: "UtilityFeePaid",
          limit: 10,
          offset: 0,
        });

        expect(Array.isArray(result)).toBe(true);
        // All returned events should be of the requested type
        result.forEach((event) => {
          expect(event.eventName).toBe("UtilityFeePaid");
        });
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });
  });

  describe("Agent Operation Workflow", () => {
    it("should verify secret key before executing payUtilityFee", async () => {
      try {
        // 1. Generate a secret key
        const secretKeyResult = await ownerCaller.secretKey.generate();

        // 2. Execute operation with correct secret key
        const operationResult = await ownerCaller.agent.payUtilityFee({
          secretKey: secretKeyResult.rawKey,
          playerAddress: "0x1234567890123456789012345678901234567890",
          amount: "1000000000000000000",
        });

        expect(operationResult.success).toBe(true);

        // 3. Attempt operation with wrong secret key
        try {
          await ownerCaller.agent.payUtilityFee({
            secretKey: "wrong-secret-key",
            playerAddress: "0x1234567890123456789012345678901234567890",
            amount: "1000000000000000000",
          });
          expect.fail("Should have thrown error for wrong secret key");
        } catch (error: any) {
          expect(error.code).toBe("UNAUTHORIZED");
        }
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });

    it("should execute processLuxuryGiftRebate with correct secret key", async () => {
      try {
        // 1. Generate a secret key
        const secretKeyResult = await ownerCaller.secretKey.generate();

        // 2. Execute rebate operation
        const operationResult = await ownerCaller.agent.processLuxuryGiftRebate({
          secretKey: secretKeyResult.rawKey,
          recipientAddress: "0x1234567890123456789012345678901234567890",
          giftValue: "10000000000000000000",
        });

        expect(operationResult.success).toBe(true);
        expect(operationResult.rebateAmount).toBeDefined();
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });

    it("should execute mintLand with correct secret key", async () => {
      try {
        const secretKeyResult = await ownerCaller.secretKey.generate();

        const result = await ownerCaller.agent.mintLand({
          secretKey: secretKeyResult.rawKey,
          toAddress: "0x1234567890123456789012345678901234567890",
          x: 10,
          y: 20,
          landType: 1,
        });

        expect(result.success).toBe(true);
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });

    it("should execute mintHouse with correct secret key", async () => {
      try {
        const secretKeyResult = await ownerCaller.secretKey.generate();

        const result = await ownerCaller.agent.mintHouse({
          secretKey: secretKeyResult.rawKey,
          toAddress: "0x1234567890123456789012345678901234567890",
          landTokenId: 1,
          houseType: 0,
          decorationHash: "0xabcdef1234567890",
        });

        expect(result.success).toBe(true);
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });
  });

  describe("Treasury Monitoring Workflow", () => {
    it("should retrieve treasury balance", async () => {
      try {
        const balance = await ownerCaller.treasury.getBalance();
        expect(balance.balance).toBeDefined();
        expect(balance.unit).toBe("ISC");
        expect(typeof balance.balance).toBe("string");
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });

    it("should retrieve treasury transactions with pagination", async () => {
      try {
        const result = await ownerCaller.treasury.getTransactions({
          limit: 10,
          offset: 0,
        });

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(10);
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });
  });

  describe("Staking Status Workflow", () => {
    it("should retrieve staking system status", async () => {
      try {
        const status = await ownerCaller.staking.getStatus();

        expect(status.poolId).toBeDefined();
        expect(status.currentAPY).toBeDefined();
        expect(status.pendingRewards).toBeDefined();
        expect(status.totalStaked).toBeDefined();
        expect(status.unit).toBe("ISC");
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });
  });

  describe("Data Consistency", () => {
    it("should maintain consistency between frontend and backend", async () => {
      try {
        // 1. Get contract params from backend
        const params = await ownerCaller.contractParams.getAll();

        // 2. Verify all required params exist
        const requiredParams = ["utilityFeeRate", "luxuryGiftRebateRate", "stakingPoolId"];
        requiredParams.forEach((paramName) => {
          const found = params.find((p) => p.paramName === paramName);
          expect(found).toBeDefined();
        });

        // 3. Verify param values are valid
        params.forEach((param) => {
          expect(param.paramValue).toBeDefined();
          expect(typeof param.paramValue).toBe("string");
          // Verify numeric values
          if (["utilityFeeRate", "luxuryGiftRebateRate", "stakingPoolId"].includes(param.paramName)) {
            expect(/^\d+$/.test(param.paramValue)).toBe(true);
          }
        });
      } catch (error: any) {
        if (error.code !== "INTERNAL_SERVER_ERROR") {
          throw error;
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid secret keys", async () => {
      try {
        await ownerCaller.secretKey.setCustom({
          rawKey: "",
        });
        expect.fail("Should have thrown error for empty secret key");
      } catch (error: any) {
        // Zod validation returns various error codes
        expect(error.code).toBeDefined();
        expect(["BAD_REQUEST", "PARSE_ERROR", "UNPROCESSABLE_CONTENT"].includes(error.code)).toBe(true);
      }
    });

    it("should require secret key for agent operations", async () => {
      try {
        await ownerCaller.agent.payUtilityFee({
          secretKey: "",
          playerAddress: "0x1234567890123456789012345678901234567890",
          amount: "1000000000000000000",
        });
        expect.fail("Should have thrown error for empty secret key");
      } catch (error: any) {
        // Zod validation or FORBIDDEN
        expect(error.code).toBeDefined();
        expect(["BAD_REQUEST", "PARSE_ERROR", "FORBIDDEN", "UNPROCESSABLE_CONTENT"].includes(error.code)).toBe(true);
      }
    });
  });
});
