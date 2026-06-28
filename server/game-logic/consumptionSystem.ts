/**
 * 消费系统 - Phase 1 MVP
 * 玩家消费游戏币购买物品、支付税费等
 */

export interface ConsumableItem {
  id: string;
  name: string;
  description: string;
  price: number; // GC 价格
  effect: 'hunger' | 'thirst' | 'stamina' | 'happiness' | 'health';
  effectAmount: number;
  category: 'food' | 'drink' | 'entertainment' | 'medicine';
  icon: string;
}

export interface PlayerConsumption {
  hunger: number; // 0-100，100 表示饱满
  thirst: number; // 0-100，100 表示充足
  stamina: number; // 0-100，100 表示充满
  happiness: number; // 0-100
  health: number; // 0-100
  lastMealTime: number;
  lastDrinkTime: number;
}

// 消费品定义
export const CONSUMABLE_ITEMS: Record<string, ConsumableItem> = {
  // 食物
  bread: {
    id: 'bread',
    name: '面包',
    description: '简单的面包，能缓解饥饿',
    price: 10,
    effect: 'hunger',
    effectAmount: 30,
    category: 'food',
    icon: '🍞',
  },
  rice: {
    id: 'rice',
    name: '米饭',
    description: '营养丰富的米饭',
    price: 15,
    effect: 'hunger',
    effectAmount: 50,
    category: 'food',
    icon: '🍚',
  },
  meat: {
    id: 'meat',
    name: '肉类',
    description: '高蛋白的肉类食物',
    price: 30,
    effect: 'hunger',
    effectAmount: 70,
    category: 'food',
    icon: '🍖',
  },

  // 饮料
  water: {
    id: 'water',
    name: '水',
    description: '清凉的饮用水',
    price: 5,
    effect: 'thirst',
    effectAmount: 40,
    category: 'drink',
    icon: '💧',
  },
  juice: {
    id: 'juice',
    name: '果汁',
    description: '新鲜的果汁',
    price: 15,
    effect: 'thirst',
    effectAmount: 60,
    category: 'drink',
    icon: '🧃',
  },
  coffee: {
    id: 'coffee',
    name: '咖啡',
    description: '提神的咖啡',
    price: 20,
    effect: 'stamina',
    effectAmount: 50,
    category: 'drink',
    icon: '☕',
  },

  // 娱乐
  movie: {
    id: 'movie',
    name: '看电影',
    description: '放松身心的电影',
    price: 25,
    effect: 'happiness',
    effectAmount: 40,
    category: 'entertainment',
    icon: '🎬',
  },
  game: {
    id: 'game',
    name: '玩游戏',
    description: '有趣的游戏',
    price: 20,
    effect: 'happiness',
    effectAmount: 35,
    category: 'entertainment',
    icon: '🎮',
  },
  concert: {
    id: 'concert',
    name: '音乐会',
    description: '精彩的音乐表演',
    price: 50,
    effect: 'happiness',
    effectAmount: 60,
    category: 'entertainment',
    icon: '🎵',
  },

  // 医疗
  medicine: {
    id: 'medicine',
    name: '药物',
    description: '恢复健康的药物',
    price: 40,
    effect: 'health',
    effectAmount: 50,
    category: 'medicine',
    icon: '💊',
  },
  vitamin: {
    id: 'vitamin',
    name: '维生素',
    description: '增强体质的维生素',
    price: 30,
    effect: 'health',
    effectAmount: 40,
    category: 'medicine',
    icon: '🥗',
  },
};

// 税费定义
export const TAXES = {
  dailyTax: 0.1, // 每日收入的 10% 税费
  propertyTax: 0.05, // 房产税（每月房产价值的 5%）
  businessTax: 0.08, // 商业税（每月营业额的 8%）
};

/**
 * 计算消费物品的效果
 */
export function applyConsumption(
  consumption: PlayerConsumption,
  itemId: string
): PlayerConsumption {
  const item = CONSUMABLE_ITEMS[itemId];
  if (!item) return consumption;

  const updated = { ...consumption };

  switch (item.effect) {
    case 'hunger':
      updated.hunger = Math.min(100, updated.hunger + item.effectAmount);
      break;
    case 'thirst':
      updated.thirst = Math.min(100, updated.thirst + item.effectAmount);
      break;
    case 'stamina':
      updated.stamina = Math.min(100, updated.stamina + item.effectAmount);
      break;
    case 'happiness':
      updated.happiness = Math.min(100, updated.happiness + item.effectAmount);
      break;
    case 'health':
      updated.health = Math.min(100, updated.health + item.effectAmount);
      break;
  }

  return updated;
}

/**
 * 计算每日消耗
 * 每天自动消耗：饥饿 +5，口渴 +5，体力 +3，幸福度 -2，健康 -1
 */
export function calculateDailyConsumption(
  consumption: PlayerConsumption
): PlayerConsumption {
  return {
    ...consumption,
    hunger: Math.max(0, consumption.hunger - 5),
    thirst: Math.max(0, consumption.thirst - 5),
    stamina: Math.max(0, consumption.stamina - 3),
    happiness: Math.max(0, consumption.happiness - 2),
    health: Math.max(0, consumption.health - 1),
  };
}

/**
 * 计算每日税费
 */
export function calculateDailyTax(income: number): number {
  return Math.floor(income * TAXES.dailyTax);
}

/**
 * 计算月度税费
 */
export function calculateMonthlyTax(
  propertyValue: number,
  businessIncome: number
): number {
  const propertyTax = Math.floor(propertyValue * TAXES.propertyTax);
  const businessTax = Math.floor(businessIncome * TAXES.businessTax);
  return propertyTax + businessTax;
}

/**
 * 检查消费品是否可购买
 */
export function canAffordItem(itemId: string, playerMoney: number): boolean {
  const item = CONSUMABLE_ITEMS[itemId];
  if (!item) return false;
  return playerMoney >= item.price;
}

/**
 * 获取消费品列表（按类别）
 */
export function getItemsByCategory(
  category: ConsumableItem['category']
): ConsumableItem[] {
  return Object.values(CONSUMABLE_ITEMS).filter((item) => item.category === category);
}

/**
 * 计算消费品的性价比（效果/价格）
 */
export function calculateItemValue(itemId: string): number {
  const item = CONSUMABLE_ITEMS[itemId];
  if (!item) return 0;
  return item.effectAmount / item.price;
}

/**
 * 获取最划算的消费品（按性价比）
 */
export function getBestValueItems(count: number = 5): ConsumableItem[] {
  return Object.values(CONSUMABLE_ITEMS)
    .sort((a, b) => calculateItemValue(b.id) - calculateItemValue(a.id))
    .slice(0, count);
}
