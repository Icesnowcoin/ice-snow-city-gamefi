import * as BABYLON from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import { RoamingCameraController } from './RoamingCameraController';

describe('RoamingCameraController', () => {
  it('configures mobile-friendly movement and restores the inspection view', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(42, 34, -58), scene);
    camera.setTarget(new BABYLON.Vector3(0, 12, 0));
    const controller = new RoamingCameraController(scene, camera, { speed: 0.5 });

    controller.enable();

    expect(camera.speed).toBe(0.5);
    expect(camera.keysUp).toContain(87);
    expect(camera.keysLeft).toContain(65);
    expect(controller.getInstructions()).toHaveLength(3);

    camera.position.set(999, 999, -999);
    scene.render();
    expect(camera.position.x).toBe(220);
    expect(camera.position.y).toBe(140);
    expect(camera.position.z).toBe(-220);

    controller.reset();
    expect(camera.position).toEqual(new BABYLON.Vector3(42, 34, -58));
    controller.dispose();
    scene.dispose();
    engine.dispose();
  });
});
