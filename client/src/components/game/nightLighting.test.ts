import { describe, expect, it } from 'vitest';
import { isBuildingTile, isRoadTile, shouldLightWindow } from './nightLighting';

describe('nightLighting', () => {
  it('classifies official Micropolis road and building tile ranges', () => {
    expect(isRoadTile(64)).toBe(true);
    expect(isRoadTile(206)).toBe(true);
    expect(isRoadTile(207)).toBe(false);
    expect(isBuildingTile(240)).toBe(true);
    expect(isBuildingTile(826)).toBe(true);
    expect(isBuildingTile(239)).toBe(false);
  });

  it('keeps window placement deterministic for a stable city view', () => {
    expect(shouldLightWindow(12, 7)).toBe(shouldLightWindow(12, 7));
    expect(typeof shouldLightWindow(12, 7)).toBe('boolean');
  });
});
