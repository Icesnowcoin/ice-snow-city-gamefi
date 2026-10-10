import { describe, expect, it } from 'vitest';
import { MICROPOLIS_TOOLS } from './micropolisBridge';

describe('MicropolisCore construction tools', () => {
  it('exposes the mobile construction set with stable costs', () => {
    expect(MICROPOLIS_TOOLS).toEqual([
      { id: 'road', label: '道路', cost: 10 },
      { id: 'residential', label: '住宅区', cost: 100 },
      { id: 'commercial', label: '商业区', cost: 100 },
      { id: 'industrial', label: '工业区', cost: 100 },
      { id: 'park', label: '公园', cost: 10 },
      { id: 'police', label: '警察局', cost: 500 },
      { id: 'fire', label: '消防局', cost: 500 },
      { id: 'coal', label: '燃煤电厂', cost: 3000 },
      { id: 'bulldoze', label: '推土机', cost: 1 },
    ]);
  });

  it('keeps every tool selectable and priced as a non-negative integer', () => {
    expect(new Set(MICROPOLIS_TOOLS.map((tool) => tool.id)).size).toBe(MICROPOLIS_TOOLS.length);
    expect(MICROPOLIS_TOOLS.every((tool) => Number.isInteger(tool.cost) && tool.cost >= 0)).toBe(true);
  });
});
