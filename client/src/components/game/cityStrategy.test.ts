import { describe, expect, it } from 'vitest';
import { applyCityStrategy } from './cityStrategy';
import { INITIAL_CORE_RESOURCES } from './coreResourceCycle';

describe('cityStrategy', () => {
  it('rejects a decision when the player has no ISC', () => {
    const result = applyCityStrategy(INITIAL_CORE_RESOURCES, 0, 'winterShelter');
    expect(result.success).toBe(false);
    expect(result.iscBalance).toBe(0);
    expect(result.state).toEqual(INITIAL_CORE_RESOURCES);
  });

  it('improves winter wellbeing while charging one ISC', () => {
    const result = applyCityStrategy({ ...INITIAL_CORE_RESOURCES, water: 80, wellbeing: 70 }, 3, 'winterShelter');
    expect(result.success).toBe(true);
    expect(result.iscBalance).toBe(2);
    expect(result.state.water).toBe(88);
    expect(result.state.energy).toBe(INITIAL_CORE_RESOURCES.energy - 2);
    expect(result.state.wellbeing).toBe(73);
  });

  it('turns a market promotion into goods and pending ISC without exceeding caps', () => {
    const result = applyCityStrategy({ ...INITIAL_CORE_RESOURCES, goods: 99, pendingIsc: 999999999 }, 2, 'marketPromotion');
    expect(result.success).toBe(true);
    expect(result.iscBalance).toBe(1);
    expect(result.state.goods).toBe(100);
    expect(result.state.pendingIsc).toBe(1000000000);
    expect(result.state.water).toBe(INITIAL_CORE_RESOURCES.water - 2);
    expect(result.state.energy).toBe(INITIAL_CORE_RESOURCES.energy - 2);
  });
});
