import { describe, expect, it } from 'vitest';
import { MinimapManager } from './MinimapManager';

describe('MinimapManager landmark navigation', () => {
  it('covers foundational landmark coordinates and stores labeled markers', () => {
    const manager = new MinimapManager({ width: 200, height: 200 });
    manager.setMapBounds(-140, 150, -140, 150);
    manager.addMarker({
      id: 'landmark-isc-bank',
      name: 'ISC 银行总部',
      label: 'ISC',
      x: 105,
      z: 0,
      type: 'building',
      color: { r: 0, g: 0, b: 0 },
      radius: 4,
      landmark: true,
    });

    expect(manager.isPointInBounds(122, 122)).toBe(true);
    expect(manager.getMarkersByType('building')[0]?.label).toBe('ISC');
    expect(manager.worldToMinimap(105, 0).x).toBeGreaterThan(160);
  });

  it('keeps camera position and heading available for the compass indicator', () => {
    const manager = new MinimapManager();
    manager.updateCameraPosition(12, -8, Math.PI / 2);
    expect(manager.getCameraPosition()).toEqual({ x: 12, z: -8, rotation: Math.PI / 2 });
  });
});
