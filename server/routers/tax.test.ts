import { describe, expect, it } from "vitest";

import { taxPreview } from "./tax";

describe("taxPreview", () => {
  it("calculates taxes and preserves the 60/40 allocation", () => {
    const result = taxPreview({
      propertyValue: 100_000,
      taxableIncome: 50_000,
      electricityUnits: 10,
      waterUnits: 5,
      electricityRate: 3,
      waterRate: 2,
    });

    expect(result.propertyTax).toBe(500);
    expect(result.incomeTax).toBe(5_000);
    expect(result.electricityFee).toBe(30);
    expect(result.waterFee).toBe(10);
    expect(result.total).toBe(5_540);
    expect(result.treasuryAmount).toBe(3_324);
    expect(result.marketingAmount).toBe(2_216);
    expect(result.requiresUserApproval).toBe(true);
  });

  it("does not claim approval is needed when the calculated tax is zero", () => {
    const result = taxPreview({
      propertyValue: 0,
      taxableIncome: 0,
      electricityUnits: 0,
      waterUnits: 0,
      electricityRate: 1,
      waterRate: 1,
    });

    expect(result.total).toBe(0);
    expect(result.requiresUserApproval).toBe(false);
  });
});
