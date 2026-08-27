export type BuildingYieldParameters = {
  baseYield: number;
  cycleMinutes: number;
  storageCapacity: number;
  levelMultiplier: number;
};

/**
 * 本地模拟经济参数：用于 GameHub 的可视化和玩法原型，不代表真实链上收益。
 * baseYield 为 L1 单周期产出，cycleMinutes 使用 GameHub 的模拟分钟，
 * storageCapacity 为单周期最大可领取数量，levelMultiplier 与建筑等级联动。
 */
export type BuildingYieldStatus = {
  id: string;
  name: string;
  level: number;
  yieldAmount: number;
  cycleMinutes: number;
  readyAtMinute: number;
};

export const BUILDING_YIELD_PARAMETERS: Record<string, BuildingYieldParameters> = {
  "central-commerce-center": { baseYield: 6800, cycleMinutes: 240, storageCapacity: 6800, levelMultiplier: 0.25 },
  "aurora-plaza": { baseYield: 4200, cycleMinutes: 180, storageCapacity: 4200, levelMultiplier: 0.25 },
  "crystal-logistics-hub": { baseYield: 5100, cycleMinutes: 210, storageCapacity: 5100, levelMultiplier: 0.25 },
  "crystal-plaza": { baseYield: 420, cycleMinutes: 60, storageCapacity: 420, levelMultiplier: 0.25 },
  "city-skyline": { baseYield: 680, cycleMinutes: 90, storageCapacity: 680, levelMultiplier: 0.25 },
};

export const DEFAULT_BUILDING_YIELD_PARAMETERS: BuildingYieldParameters = {
  baseYield: 300,
  cycleMinutes: 60,
  storageCapacity: 300,
  levelMultiplier: 0.25,
};

export const getBuildingYieldParameters = (buildingId: string): BuildingYieldParameters =>
  BUILDING_YIELD_PARAMETERS[buildingId] ?? DEFAULT_BUILDING_YIELD_PARAMETERS;

export const getBuildingYieldAmount = (buildingId: string, level = 1): number => {
  const parameters = getBuildingYieldParameters(buildingId);
  const multiplier = 1 + Math.max(0, level - 1) * parameters.levelMultiplier;
  return Math.min(parameters.storageCapacity * Math.max(1, multiplier), parameters.storageCapacity * 2);
};

export const getYieldProgress = (currentMinute: number, readyAtMinute: number, cycleMinutes: number): number => {
  if (readyAtMinute <= currentMinute) return 100;
  const remaining = readyAtMinute - currentMinute;
  return Math.max(0, Math.min(99, Math.round((1 - remaining / cycleMinutes) * 100)));
};

export const formatSimulatedDuration = (minutes: number): string => {
  if (minutes <= 0) return "已就绪";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}小时${rest}分` : `${rest}分钟`;
};
