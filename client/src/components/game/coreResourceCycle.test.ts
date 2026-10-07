import { describe, expect, it } from 'vitest';
import { collectCoreIsc, INITIAL_CORE_RESOURCES, resupplyCoreUtilities, runCoreResourceCycle, toggleCoreBuilding, upgradeCoreBuilding } from './coreResourceCycle';

describe('coreResourceCycle', () => {
  it('recycles in-game commercial income into water and energy for another production turn', () => {
    const first = runCoreResourceCycle(INITIAL_CORE_RESOURCES).state;
    const stocked = resupplyCoreUtilities(first, 0);
    expect(stocked).toMatchObject({ success: true, cityFunds: 0, state: { pendingIsc: 0, water: 60, energy: 80 } });
    expect(runCoreResourceCycle(stocked.state).state.cycle).toBe(2);
    expect(resupplyCoreUtilities(INITIAL_CORE_RESOURCES, 1)).toMatchObject({ success: false, cityFunds: 1 });
    expect(resupplyCoreUtilities({ ...first, pendingIsc: 0 }, 0)).toMatchObject({ success: false, state: { water: 56, energy: 72 } });
    expect(resupplyCoreUtilities({ ...first, pendingIsc: 0 }, 1)).toMatchObject({ success: true, cityFunds: 0, state: { water: 60, energy: 80 } });
  });
  it('runs the residential, production, commercial and public-service loop', () => {
    const result = runCoreResourceCycle(INITIAL_CORE_RESOURCES);

    expect(result.state.cycle).toBe(1);
    expect(result.state.water).toBe(56);
    expect(result.state.energy).toBe(72);
    expect(result.state.workforce).toBe(12);
    expect(result.state.goods).toBe(2);
    expect(result.state.pendingIsc).toBe(1);
    expect(result.state.wellbeing).toBe(72);
    expect(result.events.filter((event) => event.kind === 'success')).toHaveLength(3);
    expect(result.contributions.production).toEqual({
      water: { produced: 0, consumed: 4 },
      energy: { produced: 0, consumed: 6 },
      workforce: { produced: 0, consumed: 2 },
      goods: { produced: 5, consumed: 0 },
    });
    expect(result.contributions.commercial?.pendingIsc).toEqual({ produced: 1, consumed: 0 });
    expect(result.contributions['public-service']?.wellbeing).toEqual({ produced: 2, consumed: 0 });
  });

  it('fails safely when production inputs are depleted', () => {
    const result = runCoreResourceCycle({ ...INITIAL_CORE_RESOURCES, water: 0, energy: 0, workforce: 0 });

    expect(result.state.goods).toBe(0);
    expect(result.state.pendingIsc).toBe(0);
    expect(result.state.wellbeing).toBe(69);
    expect(result.events.filter((event) => event.kind === 'warning')).toHaveLength(3);
  });

  it('moves pending ISC into collected assets exactly once', () => {
    const state = { ...INITIAL_CORE_RESOURCES, pendingIsc: 3 };
    const collected = collectCoreIsc(state);

    expect(collected.pendingIsc).toBe(0);
    expect(collected.collectedIsc).toBe(3);
    expect(collectCoreIsc(collected)).toEqual(collected);
  });

  it('spends one ISC from the collected in-game balance when pending ISC is empty', () => {
    const result = resupplyCoreUtilities({ ...INITIAL_CORE_RESOURCES, water: 40, energy: 40 }, 2);
    expect(result.success).toBe(true);
    expect(result.cityFunds).toBe(1);
    expect(result.state.pendingIsc).toBe(0);
    expect(result.message).toContain('ISC');
  });

  it('deducts upgrade resources, raises the building level and improves the next cycle', () => {
    const state = { ...INITIAL_CORE_RESOURCES, goods: 5 };
    const upgraded = upgradeCoreBuilding(state, {}, 'production');

    expect(upgraded.success).toBe(true);
    expect(upgraded.levels.production).toBe(2);
    expect(upgraded.state.water).toBe(50);
    expect(upgraded.state.energy).toBe(68);
    expect(upgraded.state.goods).toBe(1);
    expect(upgraded.event.message).toContain('升级成功');
    expect(runCoreResourceCycle(upgraded.state, upgraded.levels).state.goods).toBe(5);
  });

  it('does not upgrade when the required resources are unavailable', () => {
    const result = upgradeCoreBuilding(INITIAL_CORE_RESOURCES, {}, 'production');

    expect(result.success).toBe(false);
    expect(result.levels).toEqual({});
    expect(result.state).toEqual(INITIAL_CORE_RESOURCES);
    expect(result.event.kind).toBe('warning');
  });

  it('pauses a building without consuming resources and can enable it again', () => {
    const stopped = toggleCoreBuilding({}, 'production');
    const pausedCycle = runCoreResourceCycle(INITIAL_CORE_RESOURCES, {}, stopped.operatingState);

    expect(stopped.operatingState.production).toBe(false);
    expect(pausedCycle.state.water).toBe(INITIAL_CORE_RESOURCES.water);
    expect(pausedCycle.state.energy).toBe(INITIAL_CORE_RESOURCES.energy);
    expect(pausedCycle.state.goods).toBe(INITIAL_CORE_RESOURCES.goods);
    expect(pausedCycle.events.some((event) => event.message.includes('生产区当前已停机'))).toBe(true);

    const enabled = toggleCoreBuilding(stopped.operatingState, 'production');
    expect(enabled.operatingState.production).toBe(true);
    expect(runCoreResourceCycle(INITIAL_CORE_RESOURCES, {}, enabled.operatingState).state.water).toBe(56);
  });
});
