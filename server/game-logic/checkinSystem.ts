/**
 * Check-in System Backend Logic
 * Handles daily sign-ups, social media sharing verification, and reward distribution
 */

import { getDb } from '../db';
import {
  checkinRecords,
  checkinStats,
  checkinConfig,
  shareVerificationLogs,
  playerProfessions,
} from '../../drizzle/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import {
  CheckinRecord,
  CheckinStats,
  SocialMediaPlatform,
  CheckinStatus,
  isEligibleForCheckIn,
  canWithdraw,
  DEFAULT_CHECKIN_CONFIG,
} from '../../shared/types/checkin';

/**
 * Initialize check-in stats for a new player
 */
export async function initializeCheckinStats(userId: number): Promise<CheckinStats> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const existing = await db
    .select()
    .from(checkinStats)
    .where(eq(checkinStats.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    const stat = existing[0];
    return {
      userId: stat.userId,
      totalCheckIns: stat.totalCheckIns,
      consecutiveDays: stat.consecutiveDays,
      lastCheckInDate: stat.lastCheckInDate as any,
      totalRewards: stat.totalRewards,
      withdrawalEligible: stat.withdrawalEligible === 'yes',
      withdrawalActivated: stat.withdrawalActivated === 'yes',
      canCheckInToday: stat.checkInsToday < 3,
      checkInsToday: stat.checkInsToday,
      maxCheckInsPerDay: 3,
    } as any;
  }

  await db.insert(checkinStats).values({
    userId,
    totalCheckIns: 0,
    consecutiveDays: 0,
    totalRewards: 0,
    withdrawalEligible: 'no',
    withdrawalActivated: 'no',
    checkInsToday: 0,
  });

  return {
    userId,
    totalCheckIns: 0,
    consecutiveDays: 0,
    totalRewards: 0,
    withdrawalEligible: false,
    withdrawalActivated: false,
    canCheckInToday: true,
    checkInsToday: 0,
    maxCheckInsPerDay: 3,
  } as any;
}

/**
 * Get player check-in stats
 */
export async function getCheckinStats(userId: number): Promise<CheckinStats> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const stats = await db
    .select()
    .from(checkinStats)
    .where(eq(checkinStats.userId, userId))
    .limit(1);

  if (stats.length === 0) {
    return await initializeCheckinStats(userId);
  }

  const stat = stats[0];
  const today = new Date().toISOString().split('T')[0];
  const lastResetDate = stat.lastResetDate ? stat.lastResetDate.toString() : null;

  // Reset daily check-ins if it's a new day
  let checkInsToday = stat.checkInsToday;
  if (lastResetDate !== today) {
    checkInsToday = 0;
    await db
      .update(checkinStats)
      .set({
        checkInsToday: 0,
        lastResetDate: new Date(),
      })
      .where(eq(checkinStats.userId, userId));
  }

  return {
    userId: stat.userId,
    totalCheckIns: stat.totalCheckIns,
    consecutiveDays: stat.consecutiveDays,
    lastCheckInDate: stat.lastCheckInDate as any,
    totalRewards: stat.totalRewards,
    withdrawalEligible: stat.withdrawalEligible === 'yes',
    withdrawalActivated: stat.withdrawalActivated === 'yes',
    canCheckInToday: checkInsToday < 3,
    checkInsToday,
    maxCheckInsPerDay: 3,
  } as any;
}

/**
 * Check if player can perform check-in today
 */
export async function canPlayerCheckIn(userId: number): Promise<{
  canCheckIn: boolean;
  reason?: string;
  checkInsToday: number;
  maxCheckInsPerDay: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  // Get player level
  const profession = await db
    .select()
    .from(playerProfessions)
    .where(eq(playerProfessions.userId, userId))
    .limit(1);

  if (profession.length === 0) {
    return {
      canCheckIn: false,
      reason: '玩家信息不存在',
      checkInsToday: 0,
      maxCheckInsPerDay: 3,
    };
  }

  const playerLevel = profession[0].level;

  // Check level eligibility (1-10)
  if (playerLevel > 10) {
    return {
      canCheckIn: false,
      reason: '10 级以上玩家无法参与签到',
      checkInsToday: 0,
      maxCheckInsPerDay: 3,
    };
  }

  // Get check-in stats
  const stats = await getCheckinStats(userId);

  // Check daily limit
  if (stats.checkInsToday >= 3) {
    return {
      canCheckIn: false,
      reason: '今日签到次数已达上限 (3 次)',
      checkInsToday: stats.checkInsToday,
      maxCheckInsPerDay: 3,
    };
  }

  // Check total check-ins
  if (stats.totalCheckIns >= 100) {
    return {
      canCheckIn: false,
      reason: '签到次数已达上限 (100 次)',
      checkInsToday: stats.checkInsToday,
      maxCheckInsPerDay: 3,
    };
  }

  return {
    canCheckIn: true,
    checkInsToday: stats.checkInsToday,
    maxCheckInsPerDay: 3,
  };
}

/**
 * Create a check-in record
 */
export async function createCheckinRecord(
  userId: number,
  platform: SocialMediaPlatform,
  shareUrl: string
): Promise<CheckinRecord> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const today = new Date().toISOString().split('T')[0];

  const result = await db
    .insert(checkinRecords)
    .values({
      userId,
      checkinDate: new Date(today),
      platform,
      shareUrl,
      status: 'pending',
      rewardAmount: 10,
      consecutiveDays: 1,
      canWithdraw: 'no',
      withdrawalActivated: 'no',
    });

  // Get the inserted ID
  const records = await db
    .select()
    .from(checkinRecords)
    .where(and(eq(checkinRecords.userId, userId), eq(checkinRecords.platform, platform)))
    .orderBy(desc(checkinRecords.createdAt))
    .limit(1);

  const recordId = records[0]?.id || 1;

  // Increment daily check-ins
  const stats = await getCheckinStats(userId);
  await db
    .update(checkinStats)
    .set({
      checkInsToday: stats.checkInsToday + 1,
    })
    .where(eq(checkinStats.userId, userId));

  return {
    id: recordId,
    userId,
    date: new Date(today),
    platform,
    shareUrl,
    status: 'pending' as CheckinStatus,
    rewardAmount: 10,
    consecutiveDays: 1,
    canWithdraw: false,
    withdrawalActivated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
}

/**
 * Verify and claim check-in reward
 */
export async function verifyAndClaimCheckin(
  userId: number,
  checkinId: number,
  verificationData?: any
): Promise<{
  success: boolean;
  message: string;
  reward?: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  // Get check-in record
  const records = await db
    .select()
    .from(checkinRecords)
    .where(and(eq(checkinRecords.id, checkinId), eq(checkinRecords.userId, userId)))
    .limit(1);

  if (records.length === 0) {
    return {
      success: false,
      message: '签到记录不存在',
    };
  }

  const record = records[0];

  // Check if already claimed
  if (record.status === 'claimed') {
    return {
      success: false,
      message: '该签到已领取奖励',
    };
  }

  // Update record status
  await db
    .update(checkinRecords)
    .set({
      status: 'verified',
      verificationData: verificationData ? JSON.stringify(verificationData) : undefined,
    })
    .where(eq(checkinRecords.id, checkinId));

  // Update stats
  const stats = await getCheckinStats(userId);
  const today = new Date().toISOString().split('T')[0];
  const lastCheckInDate = stats.lastCheckInDate
    ? new Date(stats.lastCheckInDate).toISOString().split('T')[0]
    : null;

  // Calculate consecutive days
  let consecutiveDays = stats.consecutiveDays;
  if (lastCheckInDate === today) {
    // Same day, don't increment
  } else if (lastCheckInDate) {
    const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    if (lastCheckInDate === yesterday) {
      consecutiveDays++;
    } else {
      consecutiveDays = 1;
    }
  } else {
    consecutiveDays = 1;
  }

  // Check if withdrawal eligible
  const withdrawalEligible = consecutiveDays >= 7 ? 'yes' : 'no';

  await db
    .update(checkinStats)
    .set({
      totalCheckIns: stats.totalCheckIns + 1,
      consecutiveDays,
      lastCheckInDate: new Date(today),
      totalRewards: stats.totalRewards + 10,
      withdrawalEligible,
    })
    .where(eq(checkinStats.userId, userId));

  // Mark record as claimed
  await db
    .update(checkinRecords)
    .set({
      status: 'claimed',
      consecutiveDays,
      canWithdraw: withdrawalEligible,
    })
    .where(eq(checkinRecords.id, checkinId));

  return {
    success: true,
    message: `签到成功！获得 10 ISC，连续签到 ${consecutiveDays} 天`,
    reward: 10,
  };
}

/**
 * Activate withdrawal functionality
 */
export async function activateWithdrawal(userId: number, iscPurchaseAmount: number): Promise<{
  success: boolean;
  message: string;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const stats = await getCheckinStats(userId);

  // Check if eligible
  if (!stats.withdrawalEligible) {
    return {
      success: false,
      message: '需要连续签到 7 天后才能激活提现功能',
    };
  }

  // Check if purchase amount meets requirement
  if (iscPurchaseAmount < 5) {
    return {
      success: false,
      message: '需要购买价值至少 5 USDT 的 ISC 才能激活提现功能',
    };
  }

  // Activate withdrawal
  await db
    .update(checkinStats)
    .set({
      withdrawalActivated: 'yes',
    })
    .where(eq(checkinStats.userId, userId));

  return {
    success: true,
    message: '提现功能已激活',
  };
}

/**
 * Get check-in history
 */
export async function getCheckinHistory(userId: number, limit: number = 30): Promise<CheckinRecord[]> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const records = await db
    .select()
    .from(checkinRecords)
    .where(eq(checkinRecords.userId, userId))
    .orderBy(desc(checkinRecords.createdAt))
    .limit(limit);

  return records.map((r) => ({
    id: r.id,
    userId: r.userId,
    date: r.checkinDate as any,
    platform: r.platform as SocialMediaPlatform,
    shareUrl: r.shareUrl,
    status: r.status as CheckinStatus,
    verificationData: r.verificationData ? JSON.parse(r.verificationData) : undefined,
    rewardAmount: r.rewardAmount,
    consecutiveDays: r.consecutiveDays,
    canWithdraw: r.canWithdraw === 'yes',
    withdrawalActivated: r.withdrawalActivated === 'yes',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })) as any;
}

/**
 * Log share verification attempt
 */
export async function logShareVerification(
  userId: number,
  platform: SocialMediaPlatform,
  shareUrl: string,
  status: 'pending' | 'success' | 'failed',
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  await db.insert(shareVerificationLogs).values({
    userId,
    platform,
    shareUrl,
    verificationStatus: status,
    errorMessage,
    retryCount: 0,
  });
}

/**
 * Get system configuration
 */
export async function getCheckinSystemConfig(): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const configs = await db.select().from(checkinConfig);

  const result: any = {};
  for (const config of configs) {
    try {
      result[config.configKey] = JSON.parse(config.configValue);
    } catch {
      result[config.configKey] = config.configValue;
    }
  }

  return result;
}

/**
 * Check if check-in system should be auto-disabled based on ISC price
 */
export async function shouldAutoDisableCheckin(iscPriceUSDT: number): Promise<boolean> {
  const config = await getCheckinSystemConfig();
  const threshold = parseFloat(config.min_isc_price_for_auto_disable || '0.1');
  return iscPriceUSDT >= threshold;
}
