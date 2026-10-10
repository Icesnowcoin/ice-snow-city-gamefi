import * as BABYLON from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import { MinimapManager } from './MinimapManager';
import { PlayerWorldManager } from './PlayerWorldManager';

describe('PlayerWorldManager', () => {
  it('creates a visible gameplay-only fallback avatar and player minimap marker', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const minimap = new MinimapManager();
    const player = new PlayerWorldManager(scene, minimap, { startPosition: new BABYLON.Vector3(3, 4, 5) });

    expect(player.getRoot().name).toBe('player-avatar');
    expect(player.getPosition().asArray()).toEqual([3, 0, 5]);
    expect(player.getRoot().getChildMeshes().length).toBe(4);
    expect(minimap.getMarkersByType('player')).toHaveLength(1);
    expect(player.getRoot().metadata).toMatchObject({ playerId: 'player-1', gameplayOnly: true, nft: false });

    player.dispose();
    expect(minimap.getMarkersByType('player')).toHaveLength(0);
    scene.dispose();
    engine.dispose();
  });

  it('clamps the playable avatar to the map bounds and updates its marker', () => {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    const minimap = new MinimapManager();
    const player = new PlayerWorldManager(scene, minimap, { minX: -10, maxX: 10, minZ: -20, maxZ: 20 });

    player.setPosition(new BABYLON.Vector3(50, 30, -50));
    expect(player.getPosition().asArray()).toEqual([10, 0, -20]);
    expect(minimap.getMarkersByType('player')[0]).toMatchObject({ x: 10, z: -20 });

    player.dispose();
    scene.dispose();
    engine.dispose();
  });
});
