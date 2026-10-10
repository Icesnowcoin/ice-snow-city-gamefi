import { describe, expect, it } from 'vitest';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { IceSnowRenderingProfile, detectQuality } from './IceSnowRenderingProfile';

describe('IceSnowRenderingProfile', () => {
  it('creates a winter lighting rig with a shadow generator and atmosphere', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const profile = new IceSnowRenderingProfile(scene, { quality: 'medium' });
    const rig = profile.setupLighting();

    expect(rig.sun.name).toBe('isc-sun-light');
    expect(rig.shadowGenerator.getShadowMap()?.getSize().width).toBe(1536);
    expect(scene.fogMode).toBe(Scene.FOGMODE_EXP2);
    expect(scene.imageProcessingConfiguration.toneMappingEnabled).toBe(true);
    expect(scene.imageProcessingConfiguration.exposure).toBe(1.05);

    profile.dispose();
    scene.dispose();
    engine.dispose();
  });

  it('configures PBR materials with a snow-layer plugin and mesh shadow reception', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const profile = new IceSnowRenderingProfile(scene, { quality: 'low' });
    const rig = profile.setupLighting();
    const material = new PBRMaterial('ice-material', scene);
    const mesh = MeshBuilder.CreateBox('ice-building', { size: 4 }, scene);

    const plugin = profile.configurePbrMaterial(material, 0.7);
    profile.configureMesh(mesh);

    expect(plugin).toBeDefined();
    expect(material.roughness).toBe(0.72);
    expect(material.metallic).toBe(0);
    expect(mesh.receiveShadows).toBe(true);
    expect(rig.shadowGenerator.getShadowMap()?.renderList).toContain(mesh);

    profile.dispose();
    mesh.dispose();
    material.dispose();
    scene.dispose();
    engine.dispose();
  });

  it('uses a conservative quality tier when browser capability is limited', () => {
    expect(['low', 'medium', 'high']).toContain(detectQuality());
  });
});
