/**
 * Profession System Types
 * Defines all profession-related data structures and enums
 */

export enum ProfessionType {
  COMMONER = 'commoner',           // 平民 - 初始职业
  MERCHANT = 'merchant',           // 商人 - 需要 10,000 ISC 资产
  ARCHITECT = 'architect',         // 建筑师 - 需要 100,000 ISC 资产
  INDUSTRIALIST = 'industrialist', // 工业家 - 需要 500,000 ISC 资产
  ENTREPRENEUR = 'entrepreneur',   // 企业家 - 需要 1,000,000 ISC 资产 (最高级)
}

export interface ProfessionStats {
  profitBonus: number;        // 利润加成 (%)
  productionBonus: number;    // 生产加成 (%)
  harvestBonus: number;       // 收获加成 (%)
  tradeBonus: number;         // 贸易加成 (%)
  buildingCapacity: number;   // 建筑容量加成
  workerCapacity: number;     // 工人容量加成
  bankInterestBonus: number;  // 银行利息加成 (%)
  experienceMultiplier: number; // 经验倍数
}

export interface ProfessionInfo {
  type: ProfessionType;
  name: string;
  description: string;
  icon: string;
  requiredAssets: number;     // 所需资产 (ISC)
  stats: ProfessionStats;
  unlockLevel: number;        // 解锁所需等级
  color: string;              // UI 颜色
  emoji: string;              // 表情符号
}

export interface PlayerProfession {
  id: string;
  userId: string;
  currentProfession: ProfessionType;
  level: number;              // 当前等级 (1-100)
  experience: number;         // 当前经验值
  nextLevelExperience: number; // 升级所需经验值
  totalAssets: number;        // 总资产 (ISC)
  professionHistory: ProfessionHistory[];
  lastProfessionChangeAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfessionHistory {
  profession: ProfessionType;
  level: number;
  changedAt: Date;
  assets: number;
}

export interface ProfessionUpgradeResult {
  success: boolean;
  message: string;
  newProfession?: ProfessionType;
  newStats?: ProfessionStats;
  error?: string;
}

export interface LevelUpResult {
  success: boolean;
  level: number;
  experience: number;
  nextLevelExperience: number;
  rewards?: {
    bonusAssets?: number;
    bonusExperience?: number;
    unlockedFeatures?: string[];
  };
}

// Profession configuration
export const PROFESSION_CONFIG: Record<ProfessionType, ProfessionInfo> = {
  [ProfessionType.COMMONER]: {
    type: ProfessionType.COMMONER,
    name: '平民',
    description: '初始职业，基础属性。开始你的冰雪城市之旅。',
    icon: '👤',
    emoji: '👤',
    requiredAssets: 0,
    unlockLevel: 1,
    color: '#6B7280',
    stats: {
      profitBonus: 0,
      productionBonus: 0,
      harvestBonus: 0,
      tradeBonus: 0,
      buildingCapacity: 5,
      workerCapacity: 5,
      bankInterestBonus: 0,
      experienceMultiplier: 1,
    },
  },
  [ProfessionType.MERCHANT]: {
    type: ProfessionType.MERCHANT,
    name: '商人',
    description: '专注于贸易和商业。解锁贸易加成和更多建筑容量。',
    icon: '🏪',
    emoji: '🏪',
    requiredAssets: 300000,
    unlockLevel: 10,
    color: '#3B82F6',
    stats: {
      profitBonus: 15,
      productionBonus: 5,
      harvestBonus: 5,
      tradeBonus: 25,
      buildingCapacity: 10,
      workerCapacity: 10,
      bankInterestBonus: 5,
      experienceMultiplier: 1.1,
    },
  },
  [ProfessionType.ARCHITECT]: {
    type: ProfessionType.ARCHITECT,
    name: '建筑师',
    description: '专注于建筑和城市规划。解锁高级建筑和生产加成。',
    icon: '🏗️',
    emoji: '🏗️',
    requiredAssets: 2000000,
    unlockLevel: 30,
    color: '#8B5CF6',
    stats: {
      profitBonus: 25,
      productionBonus: 30,
      harvestBonus: 15,
      tradeBonus: 15,
      buildingCapacity: 20,
      workerCapacity: 20,
      bankInterestBonus: 10,
      experienceMultiplier: 1.2,
    },
  },
  [ProfessionType.INDUSTRIALIST]: {
    type: ProfessionType.INDUSTRIALIST,
    name: '工业家',
    description: '专注于工业生产。解锁工业设施和大幅生产加成。',
    icon: '🏭',
    emoji: '🏭',
    requiredAssets: 5000000,
    unlockLevel: 60,
    color: '#EC4899',
    stats: {
      profitBonus: 40,
      productionBonus: 50,
      harvestBonus: 30,
      tradeBonus: 20,
      buildingCapacity: 35,
      workerCapacity: 35,
      bankInterestBonus: 15,
      experienceMultiplier: 1.3,
    },
  },
  [ProfessionType.ENTREPRENEUR]: {
    type: ProfessionType.ENTREPRENEUR,
    name: '企业家',
    description: '最高职业等级。全面加成，统治冰雪城市的商业帝国。',
    icon: '👑',
    emoji: '👑',
    requiredAssets: 10000000,
    unlockLevel: 90,
    color: '#F59E0B',
    stats: {
      profitBonus: 60,
      productionBonus: 70,
      harvestBonus: 50,
      tradeBonus: 40,
      buildingCapacity: 50,
      workerCapacity: 50,
      bankInterestBonus: 25,
      experienceMultiplier: 1.5,
    },
  },
};

// Experience requirements for each level (1-100)
export const LEVEL_EXPERIENCE_TABLE = generateExperienceTable();

function generateExperienceTable(): number[] {
  const table: number[] = [0];
  let baseExp = 100;
  
  for (let level = 2; level <= 100; level++) {
    // Exponential growth: each level requires 1.1x more than previous
    const exp = Math.floor(baseExp * Math.pow(1.1, level - 2));
    table.push(exp);
    baseExp = exp;
  }
  
  return table;
}

// Helper function to get total experience needed for a level
export function getTotalExperienceForLevel(level: number): number {
  if (level < 1 || level > 100) return 0;
  return LEVEL_EXPERIENCE_TABLE.slice(0, level).reduce((a, b) => a + b, 0);
}

// Helper function to get experience needed for next level
export function getExperienceForNextLevel(level: number): number {
  if (level >= 100) return 0;
  return LEVEL_EXPERIENCE_TABLE[level] || 0;
}

// Helper function to check if player can upgrade profession
export function canUpgradeProfession(
  currentProfession: ProfessionType,
  totalAssets: number,
  level: number
): { canUpgrade: boolean; nextProfession?: ProfessionType; reason?: string } {
  const professions = Object.values(ProfessionType);
  const currentIndex = professions.indexOf(currentProfession);
  
  if (currentIndex === -1 || currentIndex === professions.length - 1) {
    return { canUpgrade: false, reason: 'Already at maximum profession level' };
  }
  
  const nextProfession = professions[currentIndex + 1] as ProfessionType;
  const nextProfessionInfo = PROFESSION_CONFIG[nextProfession];
  
  if (totalAssets < nextProfessionInfo.requiredAssets) {
    return {
      canUpgrade: false,
      reason: `需要 ${nextProfessionInfo.requiredAssets} ISC 资产，当前: ${totalAssets}`,
    };
  }
  
  if (level < nextProfessionInfo.unlockLevel) {
    return {
      canUpgrade: false,
      reason: `需要达到 ${nextProfessionInfo.unlockLevel} 级，当前: ${level}`,
    };
  }
  
  return { canUpgrade: true, nextProfession };
}

// Helper function to get profession info
export function getProfessionInfo(profession: ProfessionType): ProfessionInfo {
  return PROFESSION_CONFIG[profession];
}

// Helper function to get all professions in order
export function getAllProfessions(): ProfessionInfo[] {
  return Object.values(ProfessionType).map(type => PROFESSION_CONFIG[type as ProfessionType]);
}
