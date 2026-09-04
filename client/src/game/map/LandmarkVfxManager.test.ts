import * as BABYLON from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import { LandmarkManager } from './LandmarkManager';
import { LandmarkVfxManager } from './LandmarkVfxManager';
import { MeshObjectMapper } from '../utils/MeshObjectMapper';

describe('LandmarkVfxManager', () => {
  it('creates key landmark effects and disposes every owned mesh', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const landmarks = new LandmarkManager(scene, new MeshObjectMapper());
    landmarks.createAllLandmarks();
    const vfx = new LandmarkVfxManager(scene, landmarks.getRoots(), { lowQuality: true });

    expect(scene.getMeshByName('landmark-city-core-halo')).toBeTruthy();
    expect(scene.getMeshByName('landmark-market-particle-emitter')).toBeTruthy();
    expect(scene.getMeshByName('landmark-isc-bank-beacon')).toBeTruthy();
    expect(scene.particleSystems.some((system) => system.name === 'landmark-market-particles')).toBe(true);

    vfx.dispose();
    expect(scene.getMeshByName('landmark-city-core-halo')).toBeNull();
    expect(scene.getMeshByName('landmark-market-particle-emitter')).toBeNull();
    expect(scene.particleSystems.some((system) => system.name === 'landmark-market-particles')).toBe(false);

    landmarks.clear();
    scene.dispose();
    engine.dispose();
  });
});
