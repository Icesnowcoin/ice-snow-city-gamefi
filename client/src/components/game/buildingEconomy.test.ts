import { describe, expect, it } from "vitest";
import {
  formatSimulatedDuration,
  getBuildingYieldAmount,
  getBuildingYieldParameters,
  getYieldProgress,
} from "./buildingEconomy";

describe("buildingEconomy", () => {
  it("provides explicit parameters for every completed building", () => {
    expect(getBuildingYieldParameters("central-commerce-center")).toMatchObject({
      baseYield: 6800,
      cycleMinutes: 240,
      storageCapacity: 6800,
      levelMultiplier: 0.25,
    });
    expect(getBuildingYieldParameters("aurora-plaza").cycleMinutes).toBe(180);
    expect(getBuildingYieldParameters("crystal-logistics-hub").baseYield).toBe(5100);
  });

  it("scales yield by building level and caps the simulated storage", () => {
    expect(getBuildingYieldAmount("central-commerce-center", 1)).toBe(6800);
    expect(getBuildingYieldAmount("central-commerce-center", 2)).toBe(8500);
    expect(getBuildingYieldAmount("central-commerce-center", 3)).toBe(10200);
  });

  it("maps remaining cycle time to a bounded progress percentage", () => {
    expect(getYieldProgress(0, 0, 240)).toBe(100);
    expect(getYieldProgress(120, 240, 240)).toBe(50);
    expect(getYieldProgress(239, 240, 240)).toBe(99);
    expect(getYieldProgress(240, 240, 240)).toBe(100);
  });

  it("formats simulated remaining time for the building cards", () => {
    expect(formatSimulatedDuration(0)).toBe("已就绪");
    expect(formatSimulatedDuration(45)).toBe("45分钟");
    expect(formatSimulatedDuration(125)).toBe("2小时5分");
  });
});
