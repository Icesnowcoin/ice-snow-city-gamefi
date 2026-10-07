import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { AdvancedFacilitiesSystem } from "../game-logic/advancedFacilitiesSystem";
import { EntertainmentGamesSystem } from "../game-logic/entertainmentGamesSystem";

export const advancedFacilitiesRouter = router({
  // Advanced Facilities
  createFacility: protectedProcedure
    .input(z.object({ type: z.string() }))
    .mutation(({ input }) => {
      return AdvancedFacilitiesSystem.createFacility(input.type);
    }),

  collectRevenue: protectedProcedure
    .input(z.object({ facilityId: z.string(), facilityData: z.any() }))
    .mutation(({ input }) => {
      const revenue = AdvancedFacilitiesSystem.collectRevenue(input.facilityData);
      return { revenue, facility: input.facilityData };
    }),

  upgradeFacility: protectedProcedure
    .input(z.object({ facilityId: z.string(), facilityData: z.any(), playerISC: z.number() }))
    .mutation(({ input }) => {
      const success = AdvancedFacilitiesSystem.upgradeFacility(input.facilityData, input.playerISC);
      return { success, facility: input.facilityData };
    }),

  hireWorker: protectedProcedure
    .input(z.object({ facilityId: z.string(), facilityData: z.any(), cost: z.number() }))
    .mutation(({ input }) => {
      const success = AdvancedFacilitiesSystem.hireWorker(input.facilityData, input.cost);
      return { success, facility: input.facilityData };
    }),

  getFacilityStats: protectedProcedure
    .input(z.object({ facilityData: z.any() }))
    .query(({ input }) => {
      return AdvancedFacilitiesSystem.getStats(input.facilityData);
    }),

  // Entertainment Games
  playSlotMachine: protectedProcedure
    .input(z.object({ bet: z.number() }))
    .mutation(({ input }) => {
      return EntertainmentGamesSystem.playSlotMachine(input.bet);
    }),

  playDiceMachine: protectedProcedure
    .input(z.object({ bet: z.number() }))
    .mutation(({ input }) => {
      return EntertainmentGamesSystem.playDiceMachine(input.bet);
    }),

  playDouDizhu: protectedProcedure
    .input(z.object({ bet: z.number(), playerCards: z.array(z.number()), opponentCards: z.array(z.number()) }))
    .mutation(({ input }) => {
      return EntertainmentGamesSystem.playDouDizhu(input.bet, input.playerCards, input.opponentCards);
    }),

  playMahjong: protectedProcedure
    .input(z.object({ bet: z.number() }))
    .mutation(({ input }) => {
      return EntertainmentGamesSystem.playMahjong(input.bet);
    }),

  playMatch3: protectedProcedure
    .input(z.object({ bet: z.number(), moves: z.number() }))
    .mutation(({ input }) => {
      return EntertainmentGamesSystem.playMatch3(input.bet, input.moves);
    }),

  playConnect: protectedProcedure
    .input(z.object({ bet: z.number() }))
    .mutation(({ input }) => {
      return EntertainmentGamesSystem.playConnect(input.bet);
    }),

  playBilliards: protectedProcedure
    .input(z.object({ bet: z.number(), difficulty: z.enum(['easy', 'medium', 'hard']) }))
    .mutation(({ input }) => {
      return EntertainmentGamesSystem.playBilliards(input.bet, input.difficulty);
    }),

  getGameLeaderboard: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => {
      // Placeholder - would need to fetch from database in real implementation
      return [];
    }),
});
