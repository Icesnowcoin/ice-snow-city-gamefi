import * as BABYLON from '@babylonjs/core';
import { describe, expect, it, vi } from 'vitest';
import { MinimapManager } from './MinimapManager';
import { RouteLightingManager } from './RouteLightingManager';

describe('RouteLightingManager', () => {
  it('creates four interactive route nodes with minimap markers', () => {
    const scene = new BABYLON.Scene(new BABYLON.NullEngine());
    const minimap = new MinimapManager();
    const manager = new RouteLightingManager(scene, minimap);
    manager.createRoute();

    expect(manager.getNodes()).toHaveLength(4);
    expect(manager.getNodes().every((node) => !node.lit)).toBe(true);
    expect(minimap.getMarkersByType('poi')).toHaveLength(4);
    expect(scene.getMeshByName('route-lamp-01-lantern')?.isPickable).toBe(true);
  });

  it('lights a node once, invokes selection, and disposes owned objects', () => {
    const scene = new BABYLON.Scene(new BABYLON.NullEngine());
    const minimap = new MinimapManager();
    const manager = new RouteLightingManager(scene, minimap);
    const onSelected = vi.fn();
    manager.setOnNodeSelected(onSelected);
    manager.createRoute();

    expect(manager.selectNode('route-lamp-01')).toBe(true);
    expect(onSelected).toHaveBeenCalledWith(expect.objectContaining({ id: 'route-lamp-01', lit: false }));
    expect(manager.lightNode('route-lamp-01')).toEqual(expect.objectContaining({ lit: true }));
    expect(manager.lightNode('route-lamp-01')).toEqual(expect.objectContaining({ lit: true }));

    manager.dispose();
    expect(manager.getNodes()).toHaveLength(0);
    expect(minimap.getMarkersByType('poi')).toHaveLength(0);
    expect(scene.getMeshByName('route-lamp-01-lantern')).toBeNull();
  });
});
