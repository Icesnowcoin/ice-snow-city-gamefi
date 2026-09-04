import { describe, expect, it } from 'vitest';
import {
  getOccupiedCells,
  normalizeRotation,
  placementsOverlap,
  rotateFootprint,
  snapToGrid,
  validatePlacement,
  type BuildingPlacementCandidate,
} from './buildingPlacementUtils';

const baseCandidate: BuildingPlacementCandidate = {
  id: 'placement-1',
  buildingId: 'building-1',
  landId: 'land-1',
  position: { x: 2, y: 2 },
  footprint: { width: 3, height: 2 },
  rotation: 0,
  cost: 1000,
};

describe('buildingPlacementUtils', () => {
  it('normalizes rotations and swaps the footprint for quarter turns', () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(rotateFootprint({ width: 3, height: 2 }, 90)).toEqual({ width: 2, height: 3 });
  });

  it('snaps positions to a non-negative grid', () => {
    expect(snapToGrid({ x: 3.4, y: -1 }, 2)).toEqual({ x: 4, y: 0 });
  });

  it('generates occupied cells with rotation applied', () => {
    expect(getOccupiedCells({ x: 1, y: 1 }, { width: 2, height: 1 }, 90)).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
  });

  it('rejects out-of-bounds, overlapping, and insufficient-balance placements', () => {
    expect(validatePlacement(baseCandidate, [], { width: 10, height: 10 }, 1500).valid).toBe(true);
    expect(validatePlacement({ ...baseCandidate, position: { x: 8, y: 8 } }, [], { width: 10, height: 10 }, 1500).reason).toBe('out-of-bounds');
    expect(validatePlacement({ ...baseCandidate, id: 'placement-2', position: { x: 3, y: 3 } }, [baseCandidate], { width: 10, height: 10 }, 1500).reason).toBe('collision');
    expect(validatePlacement(baseCandidate, [], { width: 10, height: 10 }, 500).reason).toBe('insufficient-balance');
  });

  it('does not collide across different lands', () => {
    expect(placementsOverlap(baseCandidate, { ...baseCandidate, id: 'placement-2', landId: 'land-2' })).toBe(false);
  });
});
