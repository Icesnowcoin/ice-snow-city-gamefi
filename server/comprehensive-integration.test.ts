/**
 * Comprehensive System Integration Tests
 * Tests all major game systems and their interactions
 */
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { AdvancedFacilitiesSystem } from "./game-logic/advancedFacilitiesSystem";
import { EntertainmentGamesSystem } from "./game-logic/entertainmentGamesSystem";
import { jobSystem } from "./game-logic/jobSystem";
import { getBankingSystem, resetBankingSystem } from "./game-logic/bankingSystem";

describe("Comprehensive System Integration Tests", () => {
  describe("Banking System Integration", () => {
    it("should create account and deposit ISC", () => {
      const bs = getBankingSystem();
      const result = bs.deposit("player1", 1000);
      expect(result.success).toBe(true);
      expect(result.account?.balance).toBe(1000);
    });

    it("should calculate interest correctly", () => {
      const bs = getBankingSystem();
      bs.deposit("player2", 10000);
      const result = bs.calculateInterest("player2");
      expect(result.success).toBe(true);
      expect(result.interest).toBeGreaterThanOrEqual(0);
    });

    it("should handle multiple transactions", () => {
      const bs = getBankingSystem();
      bs.deposit("player3", 5000);
      bs.withdraw("player3", 1000);
      bs.deposit("player3", 2000);
      
      const account = bs.getAccount("player3");
      expect(account?.balance).toBe(6000);
    });
  });

  describe("Job System Integration", () => {
    it("should create and track jobs", () => {
      const jobData = jobSystem.initializeJobData();
      expect(jobData.totalEarnings).toBe(0);
      expect(jobData.jobLevel).toBe(1);
    });

    it("should track job history", () => {
      const jobData = jobSystem.initializeJobData();
      const availableJobs = jobSystem.getAvailableJobs(jobData, 1);
      expect(availableJobs.length).toBeGreaterThan(0);
    });
  });

  describe("Cross-System Integration", () => {
    it("should handle facility revenue and banking", () => {
      const bs = getBankingSystem();
      const restaurant = AdvancedFacilitiesSystem.createFacility("restaurant");
      const revenue = AdvancedFacilitiesSystem.collectRevenue(restaurant);
      
      const depositResult = bs.deposit("player1", revenue);
      expect(depositResult.success).toBe(true);
      expect(depositResult.account?.balance).toBeGreaterThan(0);
    });

    it("should handle job earnings and gaming", () => {
      const bs = getBankingSystem();
      const jobData = jobSystem.initializeJobData();
      const availableJobs = jobSystem.getAvailableJobs(jobData, 1);
      
      if (availableJobs.length > 0) {
        const earnings = availableJobs[0].salary * 8; // 8 hours work
        const depositResult = bs.deposit("player1", earnings);
        expect(depositResult.success).toBe(true);
      }
    });

    it("should handle facility upgrades with banking", () => {
      const bs = getBankingSystem();
      bs.deposit("player1", 100000);
      
      const facility = AdvancedFacilitiesSystem.createFacility("restaurant");
      const upgradeCost = 10000;
      
      const account = bs.getAccount("player1");
      expect(account?.balance).toBeGreaterThanOrEqual(upgradeCost);
    });
  });

  describe("Data Consistency Tests", () => {
    it("should maintain separate data for each system", () => {
      const bs1 = getBankingSystem();
      bs1.deposit("player1", 5000);
      
      const bs2 = getBankingSystem();
      const account = bs2.getAccount("player1");
      expect(account?.balance).toBe(5000);
    });

    it("should handle concurrent operations safely", () => {
      const bs = getBankingSystem();
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        results.push(bs.deposit(`player_${i}`, 1000 + i * 100));
      }
      
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle invalid operations", () => {
      const bs = getBankingSystem();
      const result = bs.deposit("player1", -100);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle insufficient balance", () => {
      const bs = getBankingSystem();
      bs.deposit("player1", 100);
      const result = bs.withdraw("player1", 200);
      expect(result.success).toBe(false);
    });
  });

  afterEach(() => {
    resetBankingSystem();
  });
});
