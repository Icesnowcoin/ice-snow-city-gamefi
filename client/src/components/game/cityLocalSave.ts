import { CITY_DISTRICTS, type DistrictId } from './cityDistrictScenes';
import { INITIAL_CORE_RESOURCES, type CoreBuildingId, type CoreBuildingLevels, type CoreBuildingOperatingState, type CoreResourceState } from './coreResourceCycle';

export const CITY_LOCAL_SAVE_KEY = 'ice-snow-city-gameplay-v1';
export type CityLocalSave = {
  version: 1;
  districtId: DistrictId;
  gameTime: number;
  virtualAssets: number;
  micropolisFunds: number;
  micropolisRevenueCarry: number;
  resources: CoreResourceState;
  levels: CoreBuildingLevels;
  operating: CoreBuildingOperatingState;
  visits: string[];
  resupplyCount: number;
  supplyObjectiveCompleted: boolean;
  strategyUses: number;
  lastStrategyCycle: number;
};

const buildingIds: CoreBuildingId[] = ['residence', 'production', 'commercial', 'public-service'];
const resourceKeys: Array<keyof CoreResourceState> = ['cycle', 'water', 'energy', 'workforce', 'goods', 'pendingIsc', 'collectedIsc', 'wellbeing'];
const validCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000;
const validStrategyCycle = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= -1 && value <= 1_000_000_000;
const allowedVisits = new Set(CITY_DISTRICTS.flatMap((district) => district.hotspots.map((spot) => `${district.id}/${spot.id}`)));

export function readCityLocalSave(storage?: Storage): CityLocalSave | null {
  try {
    const raw = (storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined))?.getItem(CITY_LOCAL_SAVE_KEY);
    if (!raw || raw.length > 10_000) return null;
    const item: unknown = JSON.parse(raw);
    if (!item || typeof item !== 'object') return null;
    const data = item as Partial<CityLocalSave>;
    if (data.version !== 1 || !CITY_DISTRICTS.some((district) => district.id === data.districtId)) return null;
    if (!validCount(data.gameTime) || !validCount(data.virtualAssets)) return null;
    if (data.micropolisFunds !== undefined && !validCount(data.micropolisFunds)) return null;
    if (data.micropolisRevenueCarry !== undefined && !validCount(data.micropolisRevenueCarry)) return null;
    if (!data.resources || resourceKeys.some((key) => !validCount(data.resources?.[key]))) return null;
    if (!data.levels || typeof data.levels !== 'object' || !data.operating || typeof data.operating !== 'object') return null;
    if (buildingIds.some((id) => data.levels?.[id] !== undefined && (![1, 2, 3].includes(data.levels[id]!)))) return null;
    if (buildingIds.some((id) => data.operating?.[id] !== undefined && typeof data.operating[id] !== 'boolean')) return null;
    const visits = data.visits ?? [];
    if (!Array.isArray(visits) || visits.length > allowedVisits.size || visits.some((id) => typeof id !== 'string' || !allowedVisits.has(id))) return null;
    if (data.resupplyCount !== undefined && !validCount(data.resupplyCount)) return null;
    if (data.supplyObjectiveCompleted !== undefined && typeof data.supplyObjectiveCompleted !== 'boolean') return null;
    if (data.strategyUses !== undefined && !validCount(data.strategyUses)) return null;
    if (data.lastStrategyCycle !== undefined && !validStrategyCycle(data.lastStrategyCycle)) return null;
    return {
      version: 1,
      districtId: data.districtId as DistrictId,
      gameTime: data.gameTime,
      virtualAssets: data.virtualAssets,
      micropolisFunds: data.micropolisFunds ?? 100000,
      micropolisRevenueCarry: data.micropolisRevenueCarry ?? 0,
      resources: Object.fromEntries(resourceKeys.map((key) => [key, data.resources![key]])) as CoreResourceState,
      levels: Object.fromEntries(buildingIds.filter((id) => data.levels?.[id] !== undefined).map((id) => [id, data.levels![id]])) as CoreBuildingLevels,
      operating: Object.fromEntries(buildingIds.filter((id) => data.operating?.[id] !== undefined).map((id) => [id, data.operating![id]])) as CoreBuildingOperatingState,
      visits: Array.from(new Set(visits)),
      resupplyCount: data.resupplyCount ?? 0,
      supplyObjectiveCompleted: data.supplyObjectiveCompleted ?? false,
      strategyUses: data.strategyUses ?? 0,
      lastStrategyCycle: data.lastStrategyCycle ?? -1,
    };
  } catch { return null; }
}

export function writeCityLocalSave(save: CityLocalSave, storage?: Storage): boolean {
  try {
    const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!target) return false;
    target.setItem(CITY_LOCAL_SAVE_KEY, JSON.stringify(save));
    return true;
  } catch { return false; }
}

export function freshCityLocalSave(): CityLocalSave {
  return { version: 1, districtId: 'commercial', gameTime: 850, virtualAssets: 0, micropolisFunds: 100000, micropolisRevenueCarry: 0, resources: { ...INITIAL_CORE_RESOURCES }, levels: {}, operating: {}, visits: [], resupplyCount: 0, supplyObjectiveCompleted: false, strategyUses: 0, lastStrategyCycle: -1 };
}
