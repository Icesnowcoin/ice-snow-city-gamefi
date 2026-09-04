import * as BABYLON from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import { LandmarkManager } from './LandmarkManager';
import { MeshObjectMapper } from '../utils/MeshObjectMapper';

describe('LandmarkManager', () => {
  it('creates the eight foundational landmarks with stable IDs and mapped meshes', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const mapper = new MeshObjectMapper();
    const manager = new LandmarkManager(scene, mapper);

    manager.createAllLandmarks();

    expect(manager.getRoots().size).toBe(8);
    expect(manager.getBuildings().size).toBe(8);
    expect(manager.getBuildings().get('landmark-isc-bank')?.buildingType).toBe('bank');
    expect(manager.getBuildings().get('landmark-central-market')?.buildingType).toBe('commercial_center');
    expect(mapper.getStats()).toEqual({ totalMeshes: 24, totalObjects: 8 });
    expect(scene.materials.some((material) => material.name === 'landmark-isc-bank-pbr')).toBe(true);

    manager.clear();
    expect(manager.getRoots().size).toBe(0);
    expect(manager.getBuildings().size).toBe(0);
    expect(mapper.getStats()).toEqual({ totalMeshes: 0, totalObjects: 0 });
    scene.dispose();
    engine.dispose();
  });
});
