import { describe, expect, it } from 'vitest';
import { DAY_NIGHT_CYCLE_UNITS, getDayPhaseLabel, getNightOpacity } from './dayNight';

describe('dayNight', () => {
  it('keeps one full day at 4320 game units', () => {
    expect(DAY_NIGHT_CYCLE_UNITS).toBe(4320);
    expect(getNightOpacity(0)).toBe(getNightOpacity(DAY_NIGHT_CYCLE_UNITS));
  });

  it('is brightest around midday and darkest around midnight', () => {
    expect(getNightOpacity(2160)).toBeLessThan(0.02);
    expect(getNightOpacity(0)).toBeGreaterThan(0.65);
  });

  it('labels dawn, daylight, dusk and night without jumping outside the cycle', () => {
    expect(getDayPhaseLabel(0)).toBe('夜间');
    expect(getDayPhaseLabel(1080)).toBe('清晨');
    expect(getDayPhaseLabel(2160)).toBe('白昼');
    expect(getDayPhaseLabel(3240)).toBe('黄昏');
    expect(getDayPhaseLabel(4320)).toBe('夜间');
  });
});
