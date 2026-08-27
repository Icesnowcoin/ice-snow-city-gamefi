/**
 * Job System - 打工系统
 * 玩家可以在各种设施中工作赚取收入
 */

export interface Job {
  id: string;
  jobType: "waiter" | "security" | "cleaner" | "chef" | "bartender" | "manager";
  facilityType: string;
  facilityId?: string;
  salary: number; // 每小时工资
  experienceGain: number; // 每小时经验值
  requiredLevel: number; // 所需等级
  workHours: number; // 工作时长（小时）
  status: "available" | "working" | "completed";
  startTime?: number; // 开始时间戳
  endTime?: number; // 结束时间戳
  totalEarnings: number; // 总收入
}

export interface JobHistory {
  id: string;
  playerId: number;
  jobType: string;
  facilityType: string;
  salary: number;
  experienceGain: number;
  workDuration: number; // 工作时长（分钟）
  totalEarnings: number;
  completedAt: number;
}

export interface JobData {
  currentJob?: Job;
  jobHistory: JobHistory[];
  totalEarnings: number;
  totalExperience: number;
  jobLevel: number; // 工作等级
}

// 工作类型定义
const JOB_DEFINITIONS: Record<string, { salary: number; experienceGain: number; requiredLevel: number }> = {
  waiter: { salary: 50, experienceGain: 10, requiredLevel: 1 },
  security: { salary: 100, experienceGain: 20, requiredLevel: 5 },
  cleaner: { salary: 30, experienceGain: 5, requiredLevel: 1 },
  chef: { salary: 150, experienceGain: 30, requiredLevel: 10 },
  bartender: { salary: 80, experienceGain: 15, requiredLevel: 3 },
  manager: { salary: 200, experienceGain: 50, requiredLevel: 20 },
};

export const jobSystem = {
  /**
   * 初始化打工数据
   */
  initializeJobData(): JobData {
    return {
      jobHistory: [],
      totalEarnings: 0,
      totalExperience: 0,
      jobLevel: 1,
    };
  },

  /**
   * 获取玩家打工数据
   */
  getJobData(playerData: any): JobData {
    if (!playerData.jobs) {
      playerData.jobs = this.initializeJobData();
    }
    return playerData.jobs;
  },

  /**
   * 获取可用的工作列表
   */
  getAvailableJobs(jobData: JobData, playerLevel: number): Job[] {
    const availableJobs: Job[] = [];

    // 根据玩家等级和工作类型生成可用工作
    const jobTypes: Array<"waiter" | "security" | "cleaner" | "chef" | "bartender" | "manager"> = [
      "waiter",
      "security",
      "cleaner",
      "chef",
      "bartender",
      "manager",
    ];

    for (const jobType of jobTypes) {
      const jobDef = JOB_DEFINITIONS[jobType];
      if (jobDef && jobDef.requiredLevel <= playerLevel) {
        availableJobs.push({
          id: `job_${jobType}_${Date.now()}`,
          jobType,
          facilityType: this.getFacilityTypeForJob(jobType),
          salary: jobDef.salary,
          experienceGain: jobDef.experienceGain,
          requiredLevel: jobDef.requiredLevel,
          workHours: 8, // 默认 8 小时
          status: "available",
          totalEarnings: 0,
        });
      }
    }

    return availableJobs;
  },

  /**
   * 根据工作类型获取对应的设施类型
   */
  getFacilityTypeForJob(jobType: string): string {
    const facilityMap: Record<string, string> = {
      waiter: "fast_food",
      security: "commercial",
      cleaner: "commercial",
      chef: "fast_food",
      bartender: "bar",
      manager: "commercial",
    };
    return facilityMap[jobType] || "commercial";
  },

  /**
   * 开始工作
   */
  startJob(jobData: JobData, job: Job, workHours: number = 8): Job {
    const workingJob: Job = {
      ...job,
      workHours,
      status: "working",
      startTime: Date.now(),
      endTime: Date.now() + workHours * 60 * 60 * 1000, // 转换为毫秒
      totalEarnings: 0,
    };

    jobData.currentJob = workingJob;
    return workingJob;
  },

  /**
   * 完成工作
   */
  completeJob(jobData: JobData, job: Job): JobHistory {
    const earnings = job.salary * job.workHours;
    const experience = job.experienceGain * job.workHours;

    const jobHistory: JobHistory = {
      id: `history_${Date.now()}`,
      playerId: 0, // 需要从外部传入
      jobType: job.jobType,
      facilityType: job.facilityType,
      salary: job.salary,
      experienceGain: job.experienceGain,
      workDuration: job.workHours * 60, // 转换为分钟
      totalEarnings: earnings,
      completedAt: Date.now(),
    };

    // 更新统计数据
    jobData.jobHistory.push(jobHistory);
    jobData.totalEarnings += earnings;
    jobData.totalExperience += experience;

    // 计算工作等级
    jobData.jobLevel = Math.floor(jobData.totalExperience / 1000) + 1;

    // 清除当前工作
    jobData.currentJob = undefined;

    return jobHistory;
  },

  /**
   * 获取工作历史
   */
  getJobHistory(jobData: JobData, limit: number = 10): JobHistory[] {
    return jobData.jobHistory.slice(-limit).reverse();
  },

  /**
   * 获取工作统计
   */
  getJobStats(jobData: JobData) {
    const totalJobs = jobData.jobHistory.length;
    const averageEarnings = totalJobs > 0 ? jobData.totalEarnings / totalJobs : 0;
    const averageExperience = totalJobs > 0 ? jobData.totalExperience / totalJobs : 0;

    // 按工作类型统计
    const jobTypeStats: Record<string, { count: number; earnings: number }> = {};
    for (const job of jobData.jobHistory) {
      if (!jobTypeStats[job.jobType]) {
        jobTypeStats[job.jobType] = { count: 0, earnings: 0 };
      }
      jobTypeStats[job.jobType].count++;
      jobTypeStats[job.jobType].earnings += job.totalEarnings;
    }

    return {
      totalJobs,
      totalEarnings: jobData.totalEarnings,
      totalExperience: jobData.totalExperience,
      jobLevel: jobData.jobLevel,
      averageEarnings,
      averageExperience,
      jobTypeStats,
      currentJob: jobData.currentJob,
    };
  },

  /**
   * 计算工作完成进度
   */
  calculateJobProgress(job: Job): number {
    if (!job.startTime || !job.endTime || job.status !== "working") {
      return 0;
    }

    const now = Date.now();
    const totalDuration = job.endTime - job.startTime;
    const elapsed = now - job.startTime;

    return Math.min(100, Math.round((elapsed / totalDuration) * 100));
  },

  /**
   * 获取工作推荐
   */
  getJobRecommendations(jobData: JobData, playerLevel: number): Job[] {
    const recommendations: Job[] = [];

    // 推荐高薪工作
    const availableJobs = this.getAvailableJobs(jobData, playerLevel);
    const sortedByPay = availableJobs.sort((a, b) => b.salary - a.salary);

    // 返回前 3 个高薪工作
    return sortedByPay.slice(0, 3);
  },

  /**
   * 计算升级所需经验
   */
  calculateExperienceForNextLevel(currentLevel: number): number {
    return currentLevel * 1000; // 每级需要 1000 * 当前等级的经验
  },

  /**
   * 获取升级进度
   */
  getLevelUpProgress(jobData: JobData): number {
    const currentLevelExp = (jobData.jobLevel - 1) * 1000;
    const nextLevelExp = jobData.jobLevel * 1000;
    const currentExp = jobData.totalExperience - currentLevelExp;
    const requiredExp = nextLevelExp - currentLevelExp;

    return Math.round((currentExp / requiredExp) * 100);
  },
};
