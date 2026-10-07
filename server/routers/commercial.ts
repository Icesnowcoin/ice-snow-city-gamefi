/**
 * Commercial Facilities Router
 * Handles all commercial facility operations
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { CommercialSystem, FacilityType } from "../game-logic/commercialSystem";

export const commercialRouter = router({
  // Get all facility types
  getFacilityTypes: protectedProcedure.query(() => {
    return CommercialSystem.getAllFacilityTypes().map((type) => ({
      type,
      config: CommercialSystem.getFacilityConfig(type),
    }));
  }),

  // Get facilities by category
  getFacilitiesByCategory: protectedProcedure
    .input(z.enum(["production", "service", "rental"]))
    .query(({ input }) => {
      const facilities = CommercialSystem.getFacilitiesByCategory(input);
      return facilities.map((type) => ({
        type,
        config: CommercialSystem.getFacilityConfig(type),
      }));
    }),

  // Calculate revenue
  calculateRevenue: protectedProcedure
    .input(
      z.object({
        type: z.string() as z.ZodType<FacilityType>,
        level: z.number().min(1).max(20),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
        occupancyRate: z.number().min(0).max(1.0).optional().default(1.0),
      })
    )
    .query(({ input }) => {
      const revenue = CommercialSystem.calculateRevenue(
        input.type,
        input.level,
        input.efficiency,
        input.occupancyRate
      );
      const expense = CommercialSystem.calculateExpense(input.type, input.level);
      const profit = revenue - expense;

      return { revenue, expense, profit };
    }),

  // Start operation
  startOperation: protectedProcedure
    .input(
      z.object({
        facilityId: z.string(),
        type: z.string() as z.ZodType<FacilityType>,
        level: z.number().min(1).max(20),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
        occupancyRate: z.number().min(0).max(1.0).optional().default(1.0),
      })
    )
    .mutation(({ input }) => {
      const operation = CommercialSystem.startOperation(
        input.facilityId,
        input.type,
        input.level,
        input.efficiency,
        input.occupancyRate
      );

      return {
        success: true,
        operation,
        duration: (operation.endTime - operation.startTime) / 1000,
      };
    }),

  // Upgrade facility
  upgradeFacility: protectedProcedure
    .input(
      z.object({
        currentLevel: z.number().min(1).max(19),
        currentBalance: z.number().min(0),
      })
    )
    .mutation(({ input }) => {
      const result = CommercialSystem.upgradeFacility(
        input.currentLevel,
        input.currentBalance
      );
      return result;
    }),

  // Perform maintenance
  performMaintenance: protectedProcedure
    .input(
      z.object({
        type: z.string() as z.ZodType<FacilityType>,
        level: z.number().min(1).max(20),
        currentBalance: z.number().min(0),
      })
    )
    .mutation(({ input }) => {
      const result = CommercialSystem.performMaintenance(
        input.type,
        input.level,
        input.currentBalance
      );
      return result;
    }),

  // Get facility value
  getFacilityValue: protectedProcedure
    .input(
      z.object({
        type: z.string() as z.ZodType<FacilityType>,
        level: z.number().min(1).max(20),
      })
    )
    .query(({ input }) => {
      const value = CommercialSystem.calculateFacilityValue(input.type, input.level);
      return { value };
    }),
});
