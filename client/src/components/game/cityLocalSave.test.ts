import { beforeEach, describe, expect, it } from 'vitest';
import { CITY_LOCAL_SAVE_KEY, freshCityLocalSave, readCityLocalSave, writeCityLocalSave } from './cityLocalSave';

beforeEach(() => window.localStorage.clear());

describe('gameplay local save', () => {
  it('restores one playable district, game time and the real resource cycle after a refresh', () => {
    const state = freshCityLocalSave();
    state.districtId = 'agriculture';
    state.gameTime = 1500;
    state.resources.cycle = 3;
    state.resources.goods = 8;
    state.levels.production = 2;
    state.operating.commercial = false;
    state.visits = ['production/workshop', 'commercial/market'];
    state.resupplyCount = 1;
    state.supplyObjectiveCompleted = true;
    expect(writeCityLocalSave(state)).toBe(true);
    expect(readCityLocalSave()).toEqual(state);
  });

  it('opens existing v1 saves without the newly introduced lightweight objective fields', () => {
    const { visits, resupplyCount, supplyObjectiveCompleted, ...oldState } = freshCityLocalSave();
    window.localStorage.setItem(CITY_LOCAL_SAVE_KEY, JSON.stringify(oldState));
    expect(readCityLocalSave()).toMatchObject({ visits: [], resupplyCount: 0, supplyObjectiveCompleted: false });
    window.localStorage.setItem(CITY_LOCAL_SAVE_KEY, JSON.stringify({ ...oldState, visits: ['made-up-place'] }));
    expect(readCityLocalSave()).toBeNull();
  });

  it('rejects old or damaged saves without losing the ability to start a new game', () => {
    window.localStorage.setItem(CITY_LOCAL_SAVE_KEY, '{invalid');
    expect(readCityLocalSave()).toBeNull();
    window.localStorage.setItem(CITY_LOCAL_SAVE_KEY, JSON.stringify({ ...freshCityLocalSave(), version: 0 }));
    expect(readCityLocalSave()).toBeNull();
    window.localStorage.setItem(CITY_LOCAL_SAVE_KEY, JSON.stringify({ ...freshCityLocalSave(), districtId: 'unsafe-zone' }));
    expect(readCityLocalSave()).toBeNull();
    window.localStorage.setItem(CITY_LOCAL_SAVE_KEY, JSON.stringify({ ...freshCityLocalSave(), resources: { ...freshCityLocalSave().resources, water: -7 } }));
    expect(readCityLocalSave()).toBeNull();
    window.localStorage.setItem(CITY_LOCAL_SAVE_KEY, JSON.stringify({ ...freshCityLocalSave(), levels: { production: 9 } }));
    expect(readCityLocalSave()).toBeNull();
    expect(freshCityLocalSave()).toMatchObject({ version: 1, districtId: 'commercial', resources: { cycle: 0 } });
  });

  it('fails safely in browsers that block localStorage', () => {
    const unavailable = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } } as unknown as Storage;
    expect(readCityLocalSave(unavailable)).toBeNull();
    expect(writeCityLocalSave(freshCityLocalSave(), unavailable)).toBe(false);
  });
});
