import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { residentialSystem } from "../game-logic/residentialSystem";

export const residentialRouter = router({
  /**
   * 获取玩家的所有物业
   */
  getProperties: protectedProcedure.query(async ({ ctx }) => {
    const playerData = ctx.user || {};
    const residentialData = residentialSystem.getResidentialData(playerData);
    const properties = residentialSystem.getPlayerProperties(
      residentialData,
      ctx.user?.id || 0
    );

    return {
      properties,
      totalValue: residentialSystem.calculateTotalValue(
        residentialData,
        ctx.user?.id || 0
      ),
      totalMonthlyIncome: residentialSystem.calculateTotalMonthlyIncome(
        residentialData,
        ctx.user?.id || 0
      ),
    };
  }),

  /**
   * 获取可用物业列表
   */
  getAvailableProperties: protectedProcedure
    .input(
      z.object({
        propertyType: z
          .enum(["apartment", "villa", "hotel"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const playerData = ctx.user || {};
      const residentialData = residentialSystem.getResidentialData(playerData);

      return residentialSystem.getAvailableProperties(
        residentialData,
        input.propertyType
      );
    }),

  /**
   * 购买物业
   */
  purchaseProperty: protectedProcedure
    .input(
      z.object({
        propertyType: z.enum(["apartment", "villa", "hotel"]),
        locationX: z.number(),
        locationY: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const residentialData = residentialSystem.getResidentialData(playerData);

      const property = residentialSystem.purchaseProperty(
        residentialData,
        ctx.user?.id || 0,
        input.propertyType,
        input.locationX,
        input.locationY
      );

      // 保存数据
      (ctx.user as any).residential = residentialData;

      return property;
    }),

  /**
   * 获取物业详情
   */
  getProperty: protectedProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const playerData = ctx.user || {};
      const residentialData = residentialSystem.getResidentialData(playerData);

      const property = residentialSystem.getProperty(
        residentialData,
        input.propertyId
      );

      if (!property) {
        throw new Error("Property not found");
      }

      return {
        property,
        monthlyRevenue: residentialSystem.calculateMonthlyRevenue(property),
        rentals: residentialSystem.getPropertyRentals(
          residentialData,
          input.propertyId
        ),
        maintenance: residentialSystem.getMaintenanceRecords(
          residentialData,
          input.propertyId
        ),
      };
    }),

  /**
   * 升级物业
   */
  upgradeProperty: protectedProcedure
    .input(z.object({ propertyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const residentialData = residentialSystem.getResidentialData(playerData);

      const property = residentialSystem.upgradeProperty(
        residentialData,
        input.propertyId
      );

      if (!property) {
        throw new Error("Property not found");
      }

      // 保存数据
      (ctx.user as any).residential = residentialData;

      return property;
    }),

  /**
   * 执行维护
   */
  performMaintenance: protectedProcedure
    .input(z.object({ propertyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const residentialData = residentialSystem.getResidentialData(playerData);

      const maintenance = residentialSystem.performMaintenance(
        residentialData,
        input.propertyId
      );

      if (!maintenance) {
        throw new Error("Property not found");
      }

      // 保存数据
      (ctx.user as any).residential = residentialData;

      return maintenance;
    }),

  /**
   * 出租物业
   */
  rentProperty: protectedProcedure
    .input(
      z.object({
        propertyId: z.string(),
        tenantId: z.number(),
        monthsDuration: z.number().min(1).max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const residentialData = residentialSystem.getResidentialData(playerData);

      const rental = residentialSystem.rentProperty(
        residentialData,
        input.propertyId,
        input.tenantId,
        input.monthsDuration
      );

      if (!rental) {
        throw new Error("Property not found");
      }

      // 保存数据
      (ctx.user as any).residential = residentialData;

      return rental;
    }),

  /**
   * 终止租赁
   */
  terminateRental: protectedProcedure
    .input(z.object({ rentalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const residentialData = residentialSystem.getResidentialData(playerData);

      const success = residentialSystem.terminateRental(
        residentialData,
        input.rentalId
      );

      if (!success) {
        throw new Error("Rental not found");
      }

      // 保存数据
      (ctx.user as any).residential = residentialData;

      return { success: true };
    }),

  /**
   * 获取维护记录
   */
  getMaintenanceRecords: protectedProcedure
    .input(z.object({ propertyId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const playerData = ctx.user || {};
      const residentialData = residentialSystem.getResidentialData(playerData);

      return residentialSystem.getMaintenanceRecords(
        residentialData,
        input.propertyId
      );
    }),
});
