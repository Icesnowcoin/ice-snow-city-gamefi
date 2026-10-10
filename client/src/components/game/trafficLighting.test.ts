import { describe, expect, it } from 'vitest';
import { getCongestionPulse, getTrafficDirection, getTrafficProgress, isCongestedRoad, shouldRenderTraffic } from './trafficLighting';

describe('trafficLighting', () => {
  it('alternates stable traffic directions across road tiles', () => {
    expect(getTrafficDirection(2, 2)).toBe('horizontal');
    expect(getTrafficDirection(2, 3)).toBe('vertical');
  });

  it('keeps vehicle progress inside one repeating loop', () => {
    expect(getTrafficProgress(0, 4, 8)).toBeGreaterThanOrEqual(0);
    expect(getTrafficProgress(60000, 4, 8)).toBeLessThan(1);
    expect(getTrafficProgress(0, 4, 8)).not.toBe(getTrafficProgress(1000, 4, 8));
  });

  it('uses deterministic sparse sampling for mobile rendering', () => {
    expect(shouldRenderTraffic(4, 8)).toBe(shouldRenderTraffic(4, 8));
    expect(typeof shouldRenderTraffic(4, 8)).toBe('boolean');
  });

  it('marks high-traffic and highly connected road segments as congested', () => {
    const height = 3;
    const map = new Uint16Array(height * height);
    map[1 * height + 1] = 144;
    expect(isCongestedRoad(map, height, 1, 1)).toBe(true);
    map.fill(64);
    expect(isCongestedRoad(map, height, 1, 1)).toBe(true);
    map.fill(0);
    map[1 * height + 1] = 64;
    expect(isCongestedRoad(map, height, 1, 1)).toBe(false);
  });

  it('produces a bounded flashing pulse for congestion', () => {
    expect(getCongestionPulse(0)).toBeGreaterThanOrEqual(.48);
    expect(getCongestionPulse(115)).toBeLessThanOrEqual(1);
  });

  it('clears congestion immediately for an upgraded road segment', () => {
    const map = new Uint16Array(9).fill(64);
    expect(isCongestedRoad(map, 3, 1, 1)).toBe(true);
    expect(isCongestedRoad(map, 3, 1, 1, new Set(['1:1']))).toBe(false);
  });
});
