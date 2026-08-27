/**
 * Check-in System Types
 * Handles daily sign-up rewards and social media sharing verification
 */

export enum SocialMediaPlatform {
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  X = 'x',
  ZALO = 'zalo',
  REDDIT = 'reddit',
  DISCORD = 'discord',
}

export enum CheckinStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
}

export interface CheckinRecord {
  id: number;
  userId: number;
  date: Date;
  platform: SocialMediaPlatform;
  shareUrl: string;
  status: CheckinStatus;
  verificationData?: {
    groupId?: string;
    postId?: string;
    timestamp?: Date;
    metadata?: Record<string, any>;
  };
  rewardAmount: number;
  consecutiveDays: number;
  canWithdraw: boolean;
  withdrawalActivated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckinStats {
  userId: number;
  totalCheckIns: number;
  consecutiveDays: number;
  lastCheckInDate?: Date;
  totalRewards: number;
  withdrawalEligible: boolean;
  withdrawalActivated: boolean;
  canCheckInToday: boolean;
  checkInsToday: number;
  maxCheckInsPerDay: number;
  nextCheckInTime?: Date;
}

export interface CheckinConfig {
  maxCheckInsPerDay: number;
  rewardPerCheckIn: number;
  minLevelForCheckIn: number;
  maxLevelForCheckIn: number;
  maxTotalCheckIns: number;
  minConsecutiveDaysForWithdrawal: number;
  minISCPriceForAutoDisable: number; // 0.1 USDT
  minISCPurchaseForWithdrawalActivation: number; // 5 USDT
  enabled: boolean;
}

export interface ShareVerificationRequest {
  userId: number;
  platform: SocialMediaPlatform;
  shareUrl: string;
  groupId?: string;
  postId?: string;
}

export interface ShareVerificationResult {
  verified: boolean;
  message: string;
  platform: SocialMediaPlatform;
  verificationData?: Record<string, any>;
}

export interface CheckinReward {
  amount: number;
  currency: 'ISC';
  source: 'daily_checkin';
  date: Date;
}

// Default configuration
export const DEFAULT_CHECKIN_CONFIG: CheckinConfig = {
  maxCheckInsPerDay: 3,
  rewardPerCheckIn: 10,
  minLevelForCheckIn: 1,
  maxLevelForCheckIn: 10,
  maxTotalCheckIns: 100,
  minConsecutiveDaysForWithdrawal: 7,
  minISCPriceForAutoDisable: 0.1, // USDT
  minISCPurchaseForWithdrawalActivation: 5, // USDT
  enabled: true,
};

/**
 * Check if player is eligible for check-in
 */
export function isEligibleForCheckIn(
  playerLevel: number,
  totalCheckIns: number,
  config: CheckinConfig = DEFAULT_CHECKIN_CONFIG
): boolean {
  // Check level eligibility
  if (playerLevel < config.minLevelForCheckIn || playerLevel > config.maxLevelForCheckIn) {
    return false;
  }

  // Check max total check-ins
  if (totalCheckIns >= config.maxTotalCheckIns) {
    return false;
  }

  // Check if system is enabled
  return config.enabled;
}

/**
 * Calculate consecutive days for withdrawal eligibility
 */
export function canWithdraw(
  consecutiveDays: number,
  config: CheckinConfig = DEFAULT_CHECKIN_CONFIG
): boolean {
  return consecutiveDays >= config.minConsecutiveDaysForWithdrawal;
}

/**
 * Get social media platform name
 */
export function getPlatformName(platform: SocialMediaPlatform): string {
  const names: Record<SocialMediaPlatform, string> = {
    [SocialMediaPlatform.TELEGRAM]: 'Telegram',
    [SocialMediaPlatform.WHATSAPP]: 'WhatsApp',
    [SocialMediaPlatform.FACEBOOK]: 'Facebook',
    [SocialMediaPlatform.INSTAGRAM]: 'Instagram',
    [SocialMediaPlatform.X]: 'X (Twitter)',
    [SocialMediaPlatform.ZALO]: 'Zalo',
    [SocialMediaPlatform.REDDIT]: 'Reddit',
    [SocialMediaPlatform.DISCORD]: 'Discord',
  };
  return names[platform];
}
