import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { jobSystem } from "../game-logic/jobSystem";

export const jobRouter = router({
  /**
   * 获取可用的工作列表
   */
  getAvailableJobs: protectedProcedure
    .input(z.object({ playerLevel: z.number().optional() }))
    .query(async ({ input }) => {
      const playerLevel = input.playerLevel || 1;
      const jobs = jobSystem.getAvailableJobs(
        jobSystem.initializeJobData(),
        playerLevel
      );
      return jobs;
    }),

  /**
   * 开始工作
   */
  startJob: protectedProcedure
    .input(
      z.object({
        jobType: z.enum(["waiter", "security", "cleaner", "chef", "bartender", "manager"]),
        workHours: z.number().min(1).max(24),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        job: {
          id: `job_${input.jobType}_${Date.now()}`,
          jobType: input.jobType,
          facilityType: "commercial",
          salary: 100,
          experienceGain: 20,
          requiredLevel: 1,
          workHours: input.workHours,
          status: "working",
          startTime: Date.now(),
          endTime: Date.now() + input.workHours * 60 * 60 * 1000,
          totalEarnings: 0,
        },
        message: `Started working as ${input.jobType}`,
      };
    }),

  /**
   * 完成工作
   */
  completeJob: protectedProcedure.mutation(async () => {
    return {
      success: true,
      earnings: 800,
      experience: 160,
      message: "Job completed! Earned 800 ISC",
    };
  }),

  /**
   * 获取工作历史
   */
  getJobHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx }) => {
      return [
        {
          id: "history_1",
          playerId: ctx.user.id,
          jobType: "waiter",
          facilityType: "fast_food",
          salary: 50,
          experienceGain: 10,
          workDuration: 480,
          totalEarnings: 400,
          completedAt: Date.now(),
        },
      ];
    }),

  /**
   * 获取工作统计
   */
  getJobStats: protectedProcedure.query(async () => {
    return {
      totalJobs: 5,
      totalEarnings: 2000,
      totalExperience: 500,
      jobLevel: 3,
      averageEarnings: 400,
      averageExperience: 100,
      jobTypeStats: {
        waiter: { count: 3, earnings: 1200 },
        security: { count: 2, earnings: 800 },
      },
    };
  }),

  /**
   * 获取当前工作进度
   */
  getCurrentJobProgress: protectedProcedure.query(async () => {
    return {
      hasActiveJob: false,
      progress: 0,
    };
  }),

  /**
   * 获取工作推荐
   */
  getJobRecommendations: protectedProcedure.query(async () => {
    return [
      {
        id: "job_manager_1",
        jobType: "manager",
        facilityType: "commercial",
        salary: 200,
        experienceGain: 50,
        requiredLevel: 20,
        workHours: 8,
        status: "available",
        totalEarnings: 0,
      },
    ];
  }),

  /**
   * 获取升级进度
   */
  getLevelUpProgress: protectedProcedure.query(async () => {
    return {
      currentLevel: 3,
      totalExperience: 2500,
      progress: 50,
      nextLevelExp: 3000,
    };
  }),
});
