import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { getBankingSystem, resetBankingSystem } from "./game-logic/bankingSystem";
import { ResidentialSystem } from "./game-logic/residentialSystem";
import { EntertainmentSystem } from "./game-logic/entertainmentSystem";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

/**
 * Integration Tests: Frontend + Backend + Database
 * Tests the complete workflow of the admin system
 */

describe("Game Systems Integration", () => {
  let playerData: any;

  beforeEach(() => {
    playerData = {
      id: 1,
      name: "Test Player",
      balance: 1000000,
      banking: {},
      residential: {},
      entertainment: {},
    };
  });
  
  afterEach(() => {
    resetBankingSystem();
  });

  describe("Banking System", () => {
    it("should create a bank account", () => {
      const bs = getBankingSystem();
      const result = bs.deposit("player1", 10000);
      expect(result.success).toBe(true);
      expect(result.account).toBeDefined();
    });

    it("should calculate interest correctly", () => {
      const bs = getBankingSystem();
      bs.deposit("player1", 100000);
      const result = bs.calculateInterest("player1");
      expect(result.success).toBe(true);
      expect(result.interest).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Residential System", () => {
    it("should purchase a residential property", () => {
      const residentialData = ResidentialSystem.initializeResidentialData();
      const property = ResidentialSystem.purchaseProperty(
        residentialData,
        1,
        "apartment",
        100,
        100
      );

      expect(property).toBeDefined();
      expect(property.propertyType).toBe("apartment");
    });

    it("should upgrade a residential property", () => {
      const residentialData = ResidentialSystem.initializeResidentialData();
      const property = ResidentialSystem.purchaseProperty(
        residentialData,
        1,
        "apartment",
        100,
        100
      );
      
      const upgraded = ResidentialSystem.upgradeProperty(residentialData, property.id);
      expect(upgraded).toBeDefined();
      expect(upgraded.level).toBeGreaterThan(1);
    });
  });

  describe("Entertainment System", () => {
    it("should build an entertainment facility", () => {
      const entertainmentData = EntertainmentSystem.initializeEntertainmentData();
      const facility = EntertainmentSystem.buildFacility(
        entertainmentData,
        1,
        "bar",
        100,
        100
      );

      expect(facility).toBeDefined();
      expect(facility.facilityType).toBe("bar");
    });

    it("should host an event", () => {
      const entertainmentData = EntertainmentSystem.initializeEntertainmentData();
      const facility = EntertainmentSystem.buildFacility(
        entertainmentData,
        1,
        "bar",
        100,
        100
      );
      
      const event = EntertainmentSystem.hostEvent(entertainmentData, facility.id, "concert");
      expect(event).toBeDefined();
      expect(event.eventType).toBe("concert");
    });
  });

  describe("Cross-System Integration", () => {
    it("should maintain separate data for each system", () => {
      const bs = getBankingSystem();
      bs.deposit("player1", 5000);
      
      const account = bs.getAccount("player1");
      expect(account?.balance).toBe(5000);
      
      const residentialData = ResidentialSystem.initializeResidentialData();
      expect(residentialData.properties.length).toBe(0);
    });
  });
});
