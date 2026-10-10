import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";

const BPS_DENOMINATOR = 10_000;
const PROPERTY_TAX_BPS = 50;
const INCOME_TAX_BPS = 1_000;
const TREASURY_BPS = 6_000;

function taxPreview(input: {
  propertyValue: number;
  taxableIncome: number;
  electricityUnits: number;
  waterUnits: number;
  electricityRate: number;
  waterRate: number;
}) {
  const propertyTax = Math.floor((input.propertyValue * PROPERTY_TAX_BPS) / BPS_DENOMINATOR);
  const incomeTax = Math.floor((input.taxableIncome * INCOME_TAX_BPS) / BPS_DENOMINATOR);
  const electricityFee = input.electricityUnits * input.electricityRate;
  const waterFee = input.waterUnits * input.waterRate;
  const total = propertyTax + incomeTax + electricityFee + waterFee;
  const treasuryAmount = Math.floor((total * TREASURY_BPS) / BPS_DENOMINATOR);

  return {
    propertyTax,
    incomeTax,
    electricityFee,
    waterFee,
    total,
    treasuryAmount,
    marketingAmount: total - treasuryAmount,
    treasuryPercentage: 60,
    marketingPercentage: 40,
    requiresUserApproval: total > 0,
  };
}

const nonNegativeInteger = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

export const taxRouter = router({
  preview: protectedProcedure
    .input(
      z.object({
        propertyValue: nonNegativeInteger,
        taxableIncome: nonNegativeInteger,
        electricityUnits: nonNegativeInteger,
        waterUnits: nonNegativeInteger,
        electricityRate: z.number().int().positive(),
        waterRate: z.number().int().positive(),
      }),
    )
    .query(({ input }) => taxPreview(input)),
});

export { taxPreview };
