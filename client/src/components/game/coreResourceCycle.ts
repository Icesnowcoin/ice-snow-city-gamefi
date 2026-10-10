export type CoreResourceState = {
  cycle: number;
  water: number;
  energy: number;
  workforce: number;
  goods: number;
  pendingIsc: number;
  collectedIsc: number;
  wellbeing: number;
};

export type CoreBuildingId = 'residence' | 'production' | 'commercial' | 'public-service';
export type CoreBuildingLevels = Partial<Record<CoreBuildingId, number>>;
export type CoreBuildingOperatingState = Partial<Record<CoreBuildingId, boolean>>;

export type CoreCycleEvent = {
  kind: 'success' | 'warning';
  message: string;
};

export type CoreResourceMetric = { produced: number; consumed: number };
export type CoreResourceContribution = Partial<Record<'water' | 'energy' | 'workforce' | 'goods' | 'pendingIsc' | 'wellbeing', CoreResourceMetric>>;
export type CoreResourceContributions = Partial<Record<CoreBuildingId, CoreResourceContribution>>;

export type CoreUpgradeCost = Partial<Pick<CoreResourceState, 'water' | 'energy' | 'workforce' | 'goods'>>;

export const INITIAL_CORE_RESOURCES: CoreResourceState = {
  cycle: 0,
  water: 60,
  energy: 80,
  workforce: 12,
  goods: 0,
  pendingIsc: 0,
  collectedIsc: 0,
  wellbeing: 70,
};

export const MAX_CORE_BUILDING_LEVEL = 3;

/** Spend one in-game ISC to replenish utilities. NFT assets and NFT flows are intentionally unrelated to this economy. */
export function resupplyCoreUtilities(state: CoreResourceState, cityFunds: number) {
  if (state.water >= 60 && state.energy >= 80) return { state, cityFunds, success: false, message: '水电储备已满，无需补给。' };
  if (state.pendingIsc + cityFunds < 1) return { state, cityFunds, success: false, message: 'ISC 余额不足，请先运营商业中心或领取 ISC。' };
  const fromPending = state.pendingIsc >= 1;
  return {
    state: { ...state, pendingIsc: state.pendingIsc - Number(fromPending), water: Math.min(60, state.water + 12), energy: Math.min(80, state.energy + 24) },
    cityFunds: cityFunds - Number(!fromPending),
    success: true,
    message: 'ISC 已用于补充水与能源。',
  };
}

export function getCoreBuildingLevel(id: CoreBuildingId, levels: CoreBuildingLevels = {}) {
  return Math.max(1, Math.min(MAX_CORE_BUILDING_LEVEL, levels[id] ?? 1));
}

export function getCoreBuildingUpgradeCost(id: CoreBuildingId, level: number): CoreUpgradeCost | null {
  if (level >= MAX_CORE_BUILDING_LEVEL) return null;
  const multiplier = level;
  if (id === 'residence') return { water: 8 * multiplier, energy: 4 * multiplier, goods: 3 * multiplier };
  if (id === 'production') return { water: 10 * multiplier, energy: 12 * multiplier, goods: 4 * multiplier };
  if (id === 'commercial') return { goods: 6 * multiplier, workforce: 2 * multiplier };
  return { energy: 8 * multiplier, goods: 4 * multiplier };
}

function hasUpgradeResources(state: CoreResourceState, cost: CoreUpgradeCost) {
  return Object.entries(cost).every(([key, amount]) => state[key as keyof CoreUpgradeCost] >= (amount ?? 0));
}

function applyCost(state: CoreResourceState, cost: CoreUpgradeCost) {
  const next = { ...state };
  Object.entries(cost).forEach(([key, amount]) => {
    const resource = key as keyof CoreUpgradeCost;
    next[resource] -= amount ?? 0;
  });
  return next;
}

export function upgradeCoreBuilding(state: CoreResourceState, levels: CoreBuildingLevels, id: CoreBuildingId) {
  const currentLevel = getCoreBuildingLevel(id, levels);
  const cost = getCoreBuildingUpgradeCost(id, currentLevel);
  if (!cost) return { state, levels, event: { kind: 'warning' as const, message: '该建筑已达到最高等级。' }, success: false };
  if (!hasUpgradeResources(state, cost)) return { state, levels, event: { kind: 'warning' as const, message: '升级资源不足：请先积累水、能源、物资或劳动力。' }, success: false };
  const nextLevel = currentLevel + 1;
  return {
    state: applyCost(state, cost),
    levels: { ...levels, [id]: nextLevel },
    event: { kind: 'success' as const, message: `${id} 升级成功，达到 Lv.${nextLevel}，产出效率提升 15%。` },
    success: true,
  };
}

export function isCoreBuildingActive(id: CoreBuildingId, operatingState: CoreBuildingOperatingState = {}) {
  return operatingState[id] !== false;
}

export function toggleCoreBuilding(operatingState: CoreBuildingOperatingState, id: CoreBuildingId) {
  const nextActive = !isCoreBuildingActive(id, operatingState);
  return {
    operatingState: { ...operatingState, [id]: nextActive },
    event: { kind: 'success' as const, message: `${id} 已${nextActive ? '启用' : '停机'}，${nextActive ? '恢复' : '暂停'}资源循环。` },
  };
}

/**
 * 单区域 vertical slice 的第一条可玩资源链：
 * 住宅提供劳动力，生产区消耗水/电制造物资，商业中心出售物资，
 * 公共服务消耗少量能源维持城市宜居度。ISC 仅作为游戏内余额使用。
 */
export function runCoreResourceCycle(state: CoreResourceState, levels: CoreBuildingLevels = {}, operatingState: CoreBuildingOperatingState = {}): { state: CoreResourceState; events: CoreCycleEvent[]; contributions: CoreResourceContributions } {
  const events: CoreCycleEvent[] = [];
  const contributions: CoreResourceContributions = {};
  const record = (building: CoreBuildingId, resource: keyof CoreResourceContribution, produced = 0, consumed = 0) => {
    if (produced === 0 && consumed === 0) return;
    const buildingContribution = contributions[building] ?? (contributions[building] = {});
    buildingContribution[resource] = { produced, consumed };
  };
  const next = { ...state, cycle: state.cycle + 1 };
  const productionLevel = getCoreBuildingLevel('production', levels);
  const commercialLevel = getCoreBuildingLevel('commercial', levels);
  const publicLevel = getCoreBuildingLevel('public-service', levels);
  const residenceLevel = getCoreBuildingLevel('residence', levels);
  const goodsOutput = 5 + (productionLevel - 1) * 2;
  const tradeRevenue = 1 + (commercialLevel - 1);
  const wellbeingOutput = 2 + (publicLevel - 1);
  const workforceRecovery = 3 + (residenceLevel - 1);
  const productionActive = isCoreBuildingActive('production', operatingState);
  const commercialActive = isCoreBuildingActive('commercial', operatingState);
  const publicActive = isCoreBuildingActive('public-service', operatingState);
  const residenceActive = isCoreBuildingActive('residence', operatingState);

  const canProduce = next.water >= 4 && next.energy >= 6 && next.workforce >= 2;
  if (!productionActive) {
    events.push({ kind: 'warning', message: '生产区当前已停机，本轮未消耗资源或产出物资。' });
  } else if (canProduce) {
    next.water -= 4;
    next.energy -= 6;
    next.workforce -= 2;
    next.goods += goodsOutput;
    record('production', 'water', 0, 4);
    record('production', 'energy', 0, 6);
    record('production', 'workforce', 0, 2);
    record('production', 'goods', goodsOutput, 0);
    events.push({ kind: 'success', message: `生产区完成一轮制造，获得 ${goodsOutput} 单位城市物资。` });
  } else {
    events.push({ kind: 'warning', message: '生产区资源不足：需要 4 水、6 电和 2 劳动力。' });
  }

  const canTrade = next.goods >= 2 && next.workforce >= 1;
  if (!commercialActive) {
    events.push({ kind: 'warning', message: '商业中心当前已停机，本轮未消耗物资或产生 ISC。' });
  } else if (canTrade) {
    next.goods -= 2;
    next.workforce -= 1;
    next.pendingIsc += tradeRevenue;
    record('commercial', 'goods', 0, 2);
    record('commercial', 'workforce', 0, 1);
    record('commercial', 'pendingIsc', tradeRevenue, 0);
    events.push({ kind: 'success', message: `商业中心完成订单，新增 ${tradeRevenue} ISC 待领取。` });
  } else {
    events.push({ kind: 'warning', message: '商业中心等待物资或劳动力，暂时无法成交订单。' });
  }

  if (!publicActive) {
    events.push({ kind: 'warning', message: '公共服务站当前已停机，本轮不消耗维护资源。' });
  } else if (next.energy >= 2 && next.goods >= 1) {
    next.energy -= 2;
    next.goods -= 1;
    next.wellbeing = Math.min(100, next.wellbeing + wellbeingOutput);
    record('public-service', 'energy', 0, 2);
    record('public-service', 'goods', 0, 1);
    record('public-service', 'wellbeing', wellbeingOutput, 0);
    events.push({ kind: 'success', message: `公共服务完成维护，城市宜居度提升 ${wellbeingOutput}。` });
  } else {
    next.wellbeing = Math.max(0, next.wellbeing - 1);
    events.push({ kind: 'warning', message: '公共服务缺少物资或能源，城市宜居度下降 1。' });
  }

  if (residenceActive) {
    const workforceBeforeRecovery = next.workforce;
    next.workforce = Math.min(12 + (residenceLevel - 1) * 2, next.workforce + workforceRecovery);
    record('residence', 'workforce', next.workforce - workforceBeforeRecovery, 0);
  } else {
    events.push({ kind: 'warning', message: '住宅区当前已停机，本轮不恢复劳动力。' });
  }
  return { state: next, events, contributions };
}

export function collectCoreIsc(state: CoreResourceState): CoreResourceState {
  return { ...state, collectedIsc: state.collectedIsc + state.pendingIsc, pendingIsc: 0 };
}
