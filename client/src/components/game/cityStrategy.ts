import type { CoreResourceState } from './coreResourceCycle';

export type CityStrategyId = 'winterShelter' | 'marketPromotion';

export type CityStrategy = {
  id: CityStrategyId;
  label: string;
  description: string;
  cost: number;
};

export const CITY_STRATEGIES: readonly CityStrategy[] = [
  { id: 'winterShelter', label: '启动冬季保供', description: '消耗 1 ISC 和少量能源，提高宜居度并补足生活用水。', cost: 1 },
  { id: 'marketPromotion', label: '开展街区促销', description: '消耗 1 ISC 和少量水电，增加物资与待领取 ISC。', cost: 1 },
];

export type CityStrategyResult = {
  success: boolean;
  state: CoreResourceState;
  iscBalance: number;
  message: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** One decision per resource-cycle keeps the loop readable on mobile and prevents button mashing. */
export function applyCityStrategy(
  state: CoreResourceState,
  iscBalance: number,
  strategyId: CityStrategyId,
): CityStrategyResult {
  if (iscBalance < 1) return { success: false, state, iscBalance, message: 'ISC 不足，暂时无法执行城市策略。' };

  if (strategyId === 'winterShelter') {
    return {
      success: true,
      iscBalance: iscBalance - 1,
      state: {
        ...state,
        water: clamp(state.water + 8, 0, 100),
        energy: clamp(state.energy - 2, 0, 100),
        wellbeing: clamp(state.wellbeing + 3, 0, 100),
      },
      message: '冬季保供已启动：生活用水与宜居度得到改善。',
    };
  }

  return {
    success: true,
    iscBalance: iscBalance - 1,
    state: {
      ...state,
      water: clamp(state.water - 2, 0, 100),
      energy: clamp(state.energy - 2, 0, 100),
      goods: clamp(state.goods + 2, 0, 100),
      pendingIsc: clamp(state.pendingIsc + 1, 0, 1000000000),
    },
    message: '街区促销已完成：物资增加，并产生 1 ISC 待领取收益。',
  };
}
