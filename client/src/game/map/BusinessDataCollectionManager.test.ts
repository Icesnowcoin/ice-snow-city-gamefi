import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { describe, expect, it, vi } from 'vitest';
import { MinimapManager } from './MinimapManager';
import { BusinessDataCollectionManager } from './BusinessDataCollectionManager';

describe('BusinessDataCollectionManager', () => {
  it('creates four finance-district data points and minimap markers', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const minimap = new MinimapManager();
    const manager = new BusinessDataCollectionManager(scene, minimap);

    manager.createPoints();

    expect(manager.getPoints()).toHaveLength(4);
    expect(manager.getCollectedCount()).toBe(0);
    expect(minimap.getMarkersByType('poi')).toHaveLength(4);
    expect(minimap.getMarkers().every((marker) => marker.label === '数')).toBe(true);

    manager.clear();
    scene.dispose();
    engine.dispose();
  });

  it('collects once, updates the marker, and notifies the selected point', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const minimap = new MinimapManager();
    const manager = new BusinessDataCollectionManager(scene, minimap);
    const onSelected = vi.fn();
    manager.setOnPointSelected(onSelected);
    manager.createPoints();

    const point = manager.collectPoint('business-data-bank');
    expect(point?.collected).toBe(true);
    expect(manager.getCollectedCount()).toBe(1);
    expect(manager.collectPoint('business-data-bank')).toBeNull();
    expect(minimap.getMarkers().find((marker) => marker.id === 'business-data-bank')?.label).toBe('已');
    expect(onSelected).toHaveBeenCalledWith(expect.objectContaining({ id: 'business-data-bank', collected: true }));

    const mesh = scene.getMeshByName('business-data-market-orb') as Mesh;
    expect(manager.handlePickedMesh(mesh)).toBe(true);
    expect(onSelected).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'business-data-market', collected: false }));

    manager.clear();
    expect(minimap.getMarkersByType('poi')).toHaveLength(0);
    expect(scene.getMeshByName('business-data-bank-orb')).toBeNull();
    scene.dispose();
    engine.dispose();
  });
});
