export const CITY_SUPPLY_STEPS = [
  { id: 'production', label: '走访丰盈生产园的食品加工坊' },
  { id: 'commercial', label: '走访商业街的鸿运商都' },
  { id: 'operate', label: '运营一轮城市资源循环' },
  { id: 'resupply', label: '用 ISC 补给水电' },
] as const;

/** Only actions in the playable districts count; opening a location card alone is not a visit. */
export function getCitySupplyProgress(visits: readonly string[], cycle: number, resupplyCount: number) {
  const done = [
    visits.includes('production/workshop'),
    visits.includes('commercial/market'),
    cycle >= 1,
    resupplyCount >= 1,
  ];
  return { done, complete: done.every(Boolean), count: done.filter(Boolean).length };
}
