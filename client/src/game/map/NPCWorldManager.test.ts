import * as BABYLON from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import { MinimapManager } from './MinimapManager';
import { NPCWorldManager } from './NPCWorldManager';

describe('NPCWorldManager', () => {
  it('creates functional-zone NPC placeholders and minimap markers', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const minimap = new MinimapManager();
    const manager = new NPCWorldManager(scene, minimap);

    manager.createAllNPCs();

    expect(manager.getStates().size).toBe(6);
    expect(manager.getStates().get('npc-bank-advisor')?.role).toBe('银行顾问');
    expect(minimap.getMarkersByType('npc')).toHaveLength(6);
    expect(scene.meshes.filter((mesh) => mesh.name.endsWith('-body')).length).toBe(6);

    manager.dispose();
    expect(manager.getStates().size).toBe(0);
    expect(minimap.getMarkersByType('npc')).toHaveLength(0);
    scene.dispose();
    engine.dispose();
  });

  it('supports reduced-motion and explicit pause without moving NPCs', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.FreeCamera('test-camera', BABYLON.Vector3.Zero(), scene);
    scene.activeCamera = camera;
    const minimap = new MinimapManager();
    const manager = new NPCWorldManager(scene, minimap, { reducedMotion: true });

    manager.createAllNPCs();
    const before = minimap.getMarkersByType('npc').map((marker) => ({ id: marker.id, x: marker.x, z: marker.z }));
    scene.render();
    const after = minimap.getMarkersByType('npc').map((marker) => ({ id: marker.id, x: marker.x, z: marker.z }));

    expect(after).toEqual(before);
    manager.setPaused(true);
    expect(Array.from(manager.getStates().values()).every((state) => state.paused)).toBe(true);
    manager.dispose();
    scene.dispose();
    engine.dispose();
  });
});
