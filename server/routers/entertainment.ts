import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { entertainmentSystem } from "../game-logic/entertainmentSystem";

export const entertainmentRouter = router({
  /**
   * 获取玩家的所有设施
   */
  getFacilities: protectedProcedure.query(async ({ ctx }) => {
    const playerData = (ctx.user as any) || {};
    const entertainmentData = entertainmentSystem.getEntertainmentData(
      playerData
    );
    const facilities = entertainmentSystem.getPlayerFacilities(
      entertainmentData,
      ctx.user?.id || 0
    );

    return {
      facilities,
      totalValue: entertainmentSystem.calculateTotalValue(
        entertainmentData,
        ctx.user?.id || 0
      ),
      totalDailyRevenue: entertainmentSystem.calculateTotalDailyRevenue(
        entertainmentData,
        ctx.user?.id || 0
      ),
    };
  }),

  /**
   * 获取可用设施列表
   */
  getAvailableFacilities: protectedProcedure
    .input(
      z.object({
        facilityType: z
          .enum(["park", "entertainment_center", "nightclub", "bar"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      return entertainmentSystem.getAvailableFacilities(
        entertainmentData,
        input.facilityType
      );
    }),

  /**
   * 建造设施
   */
  buildFacility: protectedProcedure
    .input(
      z.object({
        facilityType: z.enum(["park", "entertainment_center", "nightclub", "bar"]),
        locationX: z.number(),
        locationY: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      const facility = entertainmentSystem.buildFacility(
        entertainmentData,
        ctx.user?.id || 0,
        input.facilityType,
        input.locationX,
        input.locationY
      );

      // 保存数据
      (ctx.user as any).entertainment = entertainmentData;

      return facility;
    }),

  /**
   * 获取设施详情
   */
  getFacility: protectedProcedure
    .input(z.object({ facilityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      const facility = entertainmentSystem.getFacility(
        entertainmentData,
        input.facilityId
      );

      if (!facility) {
        throw new Error("Facility not found");
      }

      return {
        facility,
        dailyRevenue: entertainmentSystem.calculateDailyRevenue(facility),
        visitors: entertainmentSystem.getFacilityVisitors(
          entertainmentData,
          input.facilityId
        ),
        events: entertainmentSystem.getFacilityEvents(
          entertainmentData,
          input.facilityId
        ),
      };
    }),

  /**
   * 升级设施
   */
  upgradeFacility: protectedProcedure
    .input(z.object({ facilityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      const facility = entertainmentSystem.upgradeFacility(
        entertainmentData,
        input.facilityId
      );

      if (!facility) {
        throw new Error("Facility not found");
      }

      // 保存数据
      (ctx.user as any).entertainment = entertainmentData;

      return facility;
    }),

  /**
   * 举办活动
   */
  hostEvent: protectedProcedure
    .input(
      z.object({
        facilityId: z.string(),
        eventType: z.enum(["concert", "party", "exhibition", "sports"]),
        eventName: z.string(),
        durationHours: z.number().min(1).max(24),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      const event = entertainmentSystem.hostEvent(
        entertainmentData,
        input.facilityId,
        input.eventType,
        input.eventName,
        input.durationHours
      );

      if (!event) {
        throw new Error("Facility not found");
      }

      // 保存数据
      (ctx.user as any).entertainment = entertainmentData;

      return event;
    }),

  /**
   * 完成活动
   */
  completeEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      const event = entertainmentSystem.completeEvent(
        entertainmentData,
        input.eventId
      );

      if (!event) {
        throw new Error("Event not found");
      }

      // 保存数据
      (ctx.user as any).entertainment = entertainmentData;

      return event;
    }),

  /**
   * 记录访客
   */
  recordVisitor: protectedProcedure
    .input(
      z.object({
        facilityId: z.string(),
        visitorId: z.number(),
        spentAmount: z.number(),
        satisfaction: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      const visitor = entertainmentSystem.recordVisitor(
        entertainmentData,
        input.facilityId,
        input.visitorId,
        input.spentAmount,
        input.satisfaction
      );

      if (!visitor) {
        throw new Error("Facility not found");
      }

      // 保存数据
      (ctx.user as any).entertainment = entertainmentData;

      return visitor;
    }),

  /**
   * 获取设施的活动列表
   */
  getFacilityEvents: protectedProcedure
    .input(z.object({ facilityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      return entertainmentSystem.getFacilityEvents(
        entertainmentData,
        input.facilityId
      );
    }),

  /**
   * 获取设施的访客列表
   */
  getFacilityVisitors: protectedProcedure
    .input(z.object({ facilityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const playerData = (ctx.user as any) || {};
      const entertainmentData = entertainmentSystem.getEntertainmentData(
        playerData
      );

      return entertainmentSystem.getFacilityVisitors(
        entertainmentData,
        input.facilityId
      );
    }),
});
