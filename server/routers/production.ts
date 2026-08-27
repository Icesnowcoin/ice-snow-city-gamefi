/**
 * Production Systems Router
 * Handles mining, logging, smelting, and logistics operations
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { MiningSystem } from "../game-logic/miningSystem";
import { LoggingSystem } from "../game-logic/loggingSystem";
import { SmeltingSystem } from "../game-logic/smeltingSystem";
import { LogisticsSystem } from "../game-logic/logisticsSystem";

// ─── Mining Router ───────────────────────────────────────────────────────────

export const miningRouter = router({
  startMining: protectedProcedure
    .input(
      z.object({
        resourceType: z.enum(["sand", "stone", "ore"]),
        facilityLevel: z.number().min(1).max(10),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
      })
    )
    .mutation(({ input, ctx }) => {
      const operation = MiningSystem.startMining(
        ctx.user.id,
        input.resourceType,
        input.facilityLevel,
        input.efficiency
      );
      return {
        success: true,
        operation,
        duration: (operation.endTime - operation.startTime) / 1000,
      };
    }),

  calculateYield: protectedProcedure
    .input(
      z.object({
        resourceType: z.enum(["sand", "stone", "ore"]),
        facilityLevel: z.number().min(1).max(10),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
      })
    )
    .query(({ input }) => {
      const yield_ = MiningSystem.calculateYield(
        input.resourceType,
        input.facilityLevel,
        input.efficiency
      );
      return { yield: yield_ };
    }),

  upgradeFacility: protectedProcedure
    .input(
      z.object({
        currentLevel: z.number().min(1).max(9),
        sand: z.number().min(0),
        stone: z.number().min(0),
        ore: z.number().min(0),
      })
    )
    .mutation(({ input }) => {
      const result = MiningSystem.upgradeFacility(input.currentLevel, {
        sand: input.sand,
        stone: input.stone,
        ore: input.ore,
      });
      return result;
    }),
});

// ─── Logging Router ──────────────────────────────────────────────────────────

export const loggingRouter = router({
  startLogging: protectedProcedure
    .input(
      z.object({
        resourceType: z.enum(["wood", "timber", "logs"]),
        facilityLevel: z.number().min(1).max(10),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
      })
    )
    .mutation(({ input, ctx }) => {
      const operation = LoggingSystem.startLogging(
        ctx.user.id,
        input.resourceType,
        input.facilityLevel,
        input.efficiency
      );
      return {
        success: true,
        operation,
        duration: (operation.endTime - operation.startTime) / 1000,
      };
    }),

  calculateYield: protectedProcedure
    .input(
      z.object({
        resourceType: z.enum(["wood", "timber", "logs"]),
        facilityLevel: z.number().min(1).max(10),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
      })
    )
    .query(({ input }) => {
      const yield_ = LoggingSystem.calculateYield(
        input.resourceType,
        input.facilityLevel,
        input.efficiency
      );
      return { yield: yield_ };
    }),

  upgradeFacility: protectedProcedure
    .input(
      z.object({
        currentLevel: z.number().min(1).max(9),
        wood: z.number().min(0),
        timber: z.number().min(0),
        logs: z.number().min(0),
      })
    )
    .mutation(({ input }) => {
      const result = LoggingSystem.upgradeFacility(input.currentLevel, {
        wood: input.wood,
        timber: input.timber,
        logs: input.logs,
      });
      return result;
    }),
});

// ─── Smelting Router ─────────────────────────────────────────────────────────

export const smeltingRouter = router({
  startSmelting: protectedProcedure
    .input(
      z.object({
        inputType: z.enum(["ore", "iron", "copper"]),
        outputType: z.enum(["iron", "copper", "gold", "steel", "bronze"]),
        inputQuantity: z.number().min(1),
        furnaceLevel: z.number().min(1).max(10),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
      })
    )
    .mutation(({ input, ctx }) => {
      const operation = SmeltingSystem.startSmelting(
        ctx.user.id,
        input.inputType,
        input.outputType,
        input.inputQuantity,
        input.furnaceLevel,
        input.efficiency
      );
      return {
        success: true,
        operation,
        duration: (operation.endTime - operation.startTime) / 1000,
      };
    }),

  calculateOutput: protectedProcedure
    .input(
      z.object({
        inputType: z.enum(["ore", "iron", "copper"]),
        outputType: z.enum(["iron", "copper", "gold", "steel", "bronze"]),
        inputQuantity: z.number().min(1),
        furnaceLevel: z.number().min(1).max(10),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
      })
    )
    .query(({ input }) => {
      const output = SmeltingSystem.calculateOutput(
        input.inputType,
        input.outputType,
        input.inputQuantity,
        input.furnaceLevel,
        input.efficiency
      );
      return { output };
    }),

  upgradeFurnace: protectedProcedure
    .input(
      z.object({
        currentLevel: z.number().min(1).max(9),
        iron: z.number().min(0),
        copper: z.number().min(0),
        gold: z.number().min(0),
        steel: z.number().min(0),
        bronze: z.number().min(0),
      })
    )
    .mutation(({ input }) => {
      const result = SmeltingSystem.upgradeFurnace(input.currentLevel, {
        iron: input.iron,
        copper: input.copper,
        gold: input.gold,
        steel: input.steel,
        bronze: input.bronze,
      });
      return result;
    }),
});

// ─── Logistics Router ────────────────────────────────────────────────────────

export const logisticsRouter = router({
  getRoutes: protectedProcedure.query(() => {
    return LogisticsSystem.getRoutes();
  }),

  createShipment: protectedProcedure
    .input(
      z.object({
        routeId: z.string(),
        cargo: z.record(z.string(), z.number()),
        hubLevel: z.number().min(1).max(10),
        efficiency: z.number().min(0.5).max(1.0).optional().default(1.0),
      })
    )
    .mutation(({ input, ctx }) => {
      const shipment = LogisticsSystem.createShipment(
        ctx.user.id,
        input.routeId,
        input.cargo,
        input.hubLevel,
        input.efficiency
      );

      if (!shipment) {
        return {
          success: false,
          error: "Failed to create shipment (capacity exceeded or invalid route)",
        };
      }

      return {
        success: true,
        shipment,
        duration: (shipment.endTime - shipment.startTime) / 1000,
      };
    }),

  calculateTransportCost: protectedProcedure
    .input(
      z.object({
        distance: z.number().min(1),
        cargoWeight: z.number().min(1),
        hubLevel: z.number().min(1).max(10),
      })
    )
    .query(({ input }) => {
      const cost = LogisticsSystem.calculateTransportCost(
        input.distance,
        input.cargoWeight,
        input.hubLevel
      );
      return { cost };
    }),

  upgradeHub: protectedProcedure
    .input(
      z.object({
        currentLevel: z.number().min(1).max(9),
        currentBalance: z.number().min(0),
      })
    )
    .mutation(({ input }) => {
      const result = LogisticsSystem.upgradeHub(
        input.currentLevel,
        input.currentBalance
      );
      return result;
    }),
});

// ─── Combined Production Router ──────────────────────────────────────────────

export const productionRouter = router({
  mining: miningRouter,
  logging: loggingRouter,
  smelting: smeltingRouter,
  logistics: logisticsRouter,
});
