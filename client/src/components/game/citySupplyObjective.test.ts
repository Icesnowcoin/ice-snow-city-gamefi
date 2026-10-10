import { describe, expect, it } from 'vitest';
import { getCitySupplyProgress } from './citySupplyObjective';

describe('lightweight city supply objective', () => {
  it('needs both district visits, production and a successful utility resupply', () => {
    expect(getCitySupplyProgress([], 0, 0)).toEqual({ done: [false, false, false, false], count: 0, complete: false });
    expect(getCitySupplyProgress(['commercial/cafe', 'agriculture/greenhouse'], 5, 2).complete).toBe(false);
    expect(getCitySupplyProgress(['production/workshop', 'commercial/market'], 1, 0)).toMatchObject({ count: 3, complete: false });
    expect(getCitySupplyProgress(['production/workshop', 'commercial/market'], 1, 1)).toMatchObject({ count: 4, complete: true });
  });
});
