import * as BABYLON from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import { ConceptBackdropLayer } from './ConceptBackdropLayer';

describe('ConceptBackdropLayer', () => {
  it('creates a non-pickable parallax backdrop and switches references', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.UniversalCamera('test-camera', new BABYLON.Vector3(0, 20, -30), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    const layer = new ConceptBackdropLayer(scene, camera, { reducedMotion: true, lowQuality: true });

    expect(scene.getMeshByName('concept-backdrop-image')?.isPickable).toBe(false);
    expect(scene.getMeshByName('concept-backdrop-haze')?.checkCollisions).toBe(false);
    expect(layer.getMode()).toBe('night');

    layer.setMode('day');
    expect(layer.getMode()).toBe('day');
    layer.setMode('core');
    expect(layer.getMode()).toBe('core');

    layer.dispose();
    expect(scene.getMeshByName('concept-backdrop-image')).toBeNull();
    expect(scene.getMeshByName('concept-backdrop-haze')).toBeNull();
    scene.dispose();
    engine.dispose();
  });
});
