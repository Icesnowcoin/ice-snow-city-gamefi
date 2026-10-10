/**
 * 工作系统 - Phase 1 MVP
 * 玩家可以选择职业并获得游戏币和经验
 */

export interface WorkType {
  id: string;
  name: string;
  description: string;
  baseSalary: number; // 基础工资（GC）
  xpPerDay: number; // 每天获得的经验
  requiredLevel: number; // 解锁所需等级
  icon: string;
}

export interface PlayerWork {
  currentProfession: string | null;
  professionLevel: number;
  totalEarnings: number;
  lastWorkTime: number;
  workStreak: number; // 连续工作天数
}

// 职业定义
export const WORK_TYPES: Record<string, WorkType> = {
  merchant: {
    id: 'merchant',
    name: '商人',
    description: '经营生意，赚取利润',
    baseSalary: 100,
    xpPerDay: 50,
    requiredLevel: 1,
    icon: '🏪',
  },
  farmer: {
    id: 'farmer',
    name: '农民',
    description: '种植农作物，收获果实',
    baseSalary: 80,
    xpPerDay: 60,
    requiredLevel: 1,
    icon: '🚜',
  },
  worker: {
    id: 'worker',
    name: '工人',
    description: '从事体力劳动',
    baseSalary: 60,
    xpPerDay: 40,
    requiredLevel: 1,
    icon: '👷',
  },
  doctor: {
    id: 'doctor',
    name: '医生',
    description: '治疗患者，拯救生命',
    baseSalary: 150,
    xpPerDay: 80,
    requiredLevel: 5,
    icon: '⚕️',
  },
  engineer: {
    id: 'engineer',
    name: '工程师',
    description: '设计和建造',
    baseSalary: 130,
    xpPerDay: 70,
    requiredLevel: 8,
    icon: '🔧',
  },
  artist: {
    id: 'artist',
    name: '艺术家',
    description: '创意工作，创造美',
    baseSalary: 90,
    xpPerDay: 65,
    requiredLevel: 3,
    icon: '🎨',
  },
};

/**
 * 计算工作收入
 * 基础工资 × (1 + 职业等级 × 0.1) × 工作效率
 */
export function calculateWorkSalary(
  profession: string,
  professionLevel: number,
  workEfficiency: number = 1.0
): number {
  const workType = WORK_TYPES[profession];
  if (!workType) return 0;

  const levelBonus = 1 + professionLevel * 0.1;
  return Math.floor(workType.baseSalary * levelBonus * workEfficiency);
}

/**
 * 计算工作经验
 * 基础经验 × (1 + 职业等级 × 0.05)
 */
export function calculateWorkExperience(
  profession: string,
  professionLevel: number
): number {
  const workType = WORK_TYPES[profession];
  if (!workType) return 0;

  const levelBonus = 1 + professionLevel * 0.05;
  return Math.floor(workType.xpPerDay * levelBonus);
}

/**
 * 检查是否可以从事该职业
 */
export function canWorkProfession(profession: string, playerLevel: number): boolean {
  const workType = WORK_TYPES[profession];
  if (!workType) return false;
  return playerLevel >= workType.requiredLevel;
}

/**
 * 获取可用职业列表
 */
export function getAvailableProfessions(playerLevel: number): WorkType[] {
  return Object.values(WORK_TYPES).filter(
    (work) => playerLevel >= work.requiredLevel
  );
}

/**
 * 获取职业升级所需经验
 * 每个职业等级需要 500 × 等级 经验
 */
export function getProfessionLevelUpExp(currentLevel: number): number {
  return 500 * (currentLevel + 1);
}

/**
 * 计算职业升级
 */
export function calculateProfessionLevelUp(
  profession: string,
  currentLevel: number,
  currentExp: number
): { newLevel: number; remainingExp: number } {
  let level = currentLevel;
  let exp = currentExp;

  while (exp >= getProfessionLevelUpExp(level)) {
    exp -= getProfessionLevelUpExp(level);
    level++;
  }

  return { newLevel: level, remainingExp: exp };
}
