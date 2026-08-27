import { getDb } from '../db';
import { playerProfessions, professionAchievements, professionStats, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  ProfessionType,
  PlayerProfession,
  ProfessionUpgradeResult,
  LevelUpResult,
  PROFESSION_CONFIG,
  LEVEL_EXPERIENCE_TABLE,
  getTotalExperienceForLevel,
  getExperienceForNextLevel,
  canUpgradeProfession,
  getProfessionInfo,
} from '../../shared/types/profession';

/**
 * Initialize player profession (called when player first joins)
 */
export async function initializePlayerProfession(userId: number): Promise<PlayerProfession> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult.length > 0 ? userResult[0] : null;

  if (!user) {
    throw new Error('User not found');
  }

  const professionHistory = JSON.stringify([
    {
      profession: ProfessionType.COMMONER,
      level: 1,
      changedAt: new Date(),
      assets: 0,
    },
  ]);

  await db.insert(playerProfessions).values({
    userId,
    currentProfession: ProfessionType.COMMONER,
    level: 1,
    experience: 0,
    nextLevelExperience: getExperienceForNextLevel(1),
    totalAssets: '0',
    professionHistory,
  });

  // Initialize profession stats
  await db.insert(professionStats).values({
    userId,
    profession: ProfessionType.COMMONER,
    totalProfit: '0',
    totalProduction: 0,
    totalHarvest: 0,
    totalTrades: 0,
    buildingsConstructed: 0,
    workersEmployed: 0,
    timeSpentHours: 0,
  });

  return await getPlayerProfession(userId);
}

/**
 * Get player profession data
 */
export async function getPlayerProfession(userId: number): Promise<PlayerProfession> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const result = await db.select().from(playerProfessions).where(eq(playerProfessions.userId, userId)).limit(1);
  const profession = result.length > 0 ? result[0] : null;

  if (!profession) {
    throw new Error('Player profession not found');
  }

  return {
    id: profession.id.toString(),
    userId: profession.userId.toString(),
    currentProfession: profession.currentProfession as ProfessionType,
    level: profession.level,
    experience: Number(profession.experience),
    nextLevelExperience: Number(profession.nextLevelExperience),
    totalAssets: parseInt(profession.totalAssets) || 0,
    professionHistory: JSON.parse(profession.professionHistory),
    lastProfessionChangeAt: profession.lastProfessionChangeAt || undefined,
    createdAt: profession.createdAt,
    updatedAt: profession.updatedAt,
  };
}

/**
 * Add experience to player
 */
export async function addExperience(userId: number, amount: number): Promise<LevelUpResult> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const profession = await getPlayerProfession(userId);
  let newExperience = profession.experience + amount;
  let newLevel = profession.level;
  let leveledUp = false;

  // Check for level ups
  while (newLevel < 100 && newExperience >= profession.nextLevelExperience) {
    newExperience -= profession.nextLevelExperience;
    newLevel++;
    leveledUp = true;
  }

  const nextLevelExp = getExperienceForNextLevel(newLevel);

  await db
    .update(playerProfessions)
    .set({
      level: newLevel,
      experience: newExperience,
      nextLevelExperience: nextLevelExp,
    })
    .where(eq(playerProfessions.userId, userId));

  return {
    success: true,
    level: newLevel,
    experience: newExperience,
    nextLevelExperience: nextLevelExp,
    rewards: leveledUp
      ? {
          bonusAssets: newLevel * 100,
          bonusExperience: 50,
        }
      : undefined,
  };
}

/**
 * Try to upgrade profession
 */
export async function upgradeProfession(
  userId: number,
  totalAssets: number
): Promise<ProfessionUpgradeResult> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const profession = await getPlayerProfession(userId);

  const canUpgrade = canUpgradeProfession(
    profession.currentProfession,
    totalAssets,
    profession.level
  );

  if (!canUpgrade.canUpgrade || !canUpgrade.nextProfession) {
    return {
      success: false,
      message: canUpgrade.reason || 'Cannot upgrade profession',
      error: canUpgrade.reason,
    };
  }

  const nextProfession = canUpgrade.nextProfession;
  const nextProfessionInfo = getProfessionInfo(nextProfession);

  // Update profession
  const history = profession.professionHistory || [];
  history.push({
    profession: nextProfession,
    level: profession.level,
    changedAt: new Date(),
    assets: totalAssets,
  });

  await db
    .update(playerProfessions)
    .set({
      currentProfession: nextProfession,
      totalAssets: totalAssets.toString(),
      professionHistory: JSON.stringify(history),
      lastProfessionChangeAt: new Date(),
    })
    .where(eq(playerProfessions.userId, userId));

  // Create profession stats for new profession
  const existingStatsResult = await db.select().from(professionStats).where(eq(professionStats.userId, userId)).limit(1);
  const existingStats = existingStatsResult.length > 0 ? existingStatsResult[0] : null;

  if (!existingStats) {
    await db.insert(professionStats).values({
      userId,
      profession: nextProfession,
      totalProfit: '0',
      totalProduction: 0,
      totalHarvest: 0,
      totalTrades: 0,
      buildingsConstructed: 0,
      workersEmployed: 0,
      timeSpentHours: 0,
    });
  }

  // Record achievement
  await db.insert(professionAchievements).values({
    userId,
    profession: nextProfession,
    achievementType: 'profession_upgrade',
    achievementData: JSON.stringify({
      fromProfession: profession.currentProfession,
      toProfession: nextProfession,
      level: profession.level,
      assets: totalAssets,
    }),
  });

  return {
    success: true,
    message: `升级到${nextProfessionInfo.name}！`,
    newProfession: nextProfession,
    newStats: nextProfessionInfo.stats,
  };
}

/**
 * Get profession stats
 */
export async function getProfessionStats(userId: number, profession: ProfessionType) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const result = await db.select().from(professionStats).where(eq(professionStats.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Update profession stats
 */
export async function updateProfessionStats(
  userId: number,
  profession: ProfessionType,
  updates: Partial<{
    totalProfit: string;
    totalProduction: number;
    totalHarvest: number;
    totalTrades: number;
    buildingsConstructed: number;
    workersEmployed: number;
    timeSpentHours: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const stats = await getProfessionStats(userId, profession);

  if (!stats) {
    await db.insert(professionStats).values({
      userId,
      profession,
      ...updates,
    });
  } else {
    await db
      .update(professionStats)
      .set(updates)
      .where(eq(professionStats.userId, userId));
  }
}

/**
 * Get profession achievements
 */
export async function getProfessionAchievements(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  return await db.select().from(professionAchievements).where(eq(professionAchievements.userId, userId));
}

/**
 * Record profession achievement
 */
export async function recordAchievement(
  userId: number,
  profession: ProfessionType,
  achievementType: string,
  data?: any
) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  return await db.insert(professionAchievements).values({
    userId,
    profession,
    achievementType,
    achievementData: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Get profession progression data for UI
 */
export async function getProfessionProgressionData(userId: number) {
  const profession = await getPlayerProfession(userId);
  const professionInfo = getProfessionInfo(profession.currentProfession);
  const stats = await getProfessionStats(userId, profession.currentProfession);

  // Calculate next profession info
  const professions = Object.values(ProfessionType);
  const currentIndex = professions.indexOf(profession.currentProfession);
  let nextProfessionInfo = null;

  if (currentIndex < professions.length - 1) {
    const nextProfession = professions[currentIndex + 1] as ProfessionType;
    nextProfessionInfo = getProfessionInfo(nextProfession);
  }

  return {
    currentProfession: professionInfo,
    nextProfession: nextProfessionInfo,
    level: profession.level,
    experience: profession.experience,
    nextLevelExperience: profession.nextLevelExperience,
    experienceProgress: (profession.experience / profession.nextLevelExperience) * 100,
    totalAssets: profession.totalAssets,
    stats,
    canUpgrade: nextProfessionInfo
      ? {
          required: {
            assets: nextProfessionInfo.requiredAssets,
            level: nextProfessionInfo.unlockLevel,
          },
          current: {
            assets: profession.totalAssets,
            level: profession.level,
          },
          canUpgrade:
            profession.totalAssets >= nextProfessionInfo.requiredAssets &&
            profession.level >= nextProfessionInfo.unlockLevel,
        }
      : null,
  };
}


/**
 * Login reward system for commoner profession
 * Grants 1 ISC per day, capped at 100 ISC total
 */
export async function claimDailyLoginReward(userId: number): Promise<{
  success: boolean;
  message: string;
  rewardAmount: number;
  totalRewards: number;
  maxRewards: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const profession = await getPlayerProfession(userId);

  // Only commoner can claim daily login rewards
  if (profession.currentProfession !== ProfessionType.COMMONER) {
    return {
      success: false,
      message: '只有平民职业可以领取每日登录奖励',
      rewardAmount: 0,
      totalRewards: 0,
      maxRewards: 100,
    };
  }

  const maxRewards = 100; // Max 100 ISC
  const dailyReward = 1; // 1 ISC per day
  const currentRewards = typeof profession.totalAssets === 'string' ? parseInt(profession.totalAssets) : profession.totalAssets || 0;

  // Check if already at max
  if (currentRewards >= maxRewards) {
    return {
      success: false,
      message: '每日登录奖励已达到上限 (100 ISC)',
      rewardAmount: 0,
      totalRewards: currentRewards,
      maxRewards,
    };
  }

  // Calculate reward (don't exceed max)
  const actualReward = Math.min(dailyReward, maxRewards - currentRewards);
  const newTotal = currentRewards + actualReward;

  // Update profession stats
  await db
    .update(playerProfessions)
    .set({
      totalAssets: newTotal.toString() as any,
      updatedAt: new Date(),
    })
    .where(eq(playerProfessions.userId, userId));

  // Record achievement
  await recordAchievement(userId, ProfessionType.COMMONER, 'daily_login_reward', {
    rewardAmount: actualReward,
    totalRewards: newTotal,
    date: new Date(),
  });

  return {
    success: true,
    message: `领取每日登录奖励 +${actualReward} ISC`,
    rewardAmount: actualReward,
    totalRewards: newTotal,
    maxRewards,
  };
}

/**
 * Check if user can claim login reward today
 */
export async function canClaimLoginReward(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const profession = await getPlayerProfession(userId);

  // Only commoner can claim
  if (profession.currentProfession !== ProfessionType.COMMONER) {
    return false;
  }

  // Check if at max
  const currentRewards = typeof profession.totalAssets === 'string' ? parseInt(profession.totalAssets) : profession.totalAssets || 0;
  return currentRewards < 100;
}

/**
 * Get login reward status
 */
export async function getLoginRewardStatus(userId: number): Promise<{
  canClaim: boolean;
  currentRewards: number;
  maxRewards: number;
  dailyReward: number;
  profession: ProfessionType;
}> {
  const profession = await getPlayerProfession(userId);
  const currentRewards = typeof profession.totalAssets === 'string' ? parseInt(profession.totalAssets) : profession.totalAssets || 0;
  const maxRewards = 100;
  const canClaim = profession.currentProfession === ProfessionType.COMMONER && currentRewards < maxRewards;

  return {
    canClaim,
    currentRewards,
    maxRewards,
    dailyReward: 1,
    profession: profession.currentProfession,
  };
}
