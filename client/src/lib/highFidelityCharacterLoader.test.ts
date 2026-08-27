import { describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import { validateHighFidelityGlb, loadHighFidelityCharacterWithFallback } from "./highFidelityCharacterLoader";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

describe("HighFidelityCharacterLoader", () => {
  it("rejects GLB assets that do not meet polygon or bone targets and falls back to prototype", async () => {
    // 构造一个不符合三角面数和骨骼数的假 GLTF 场景
    const scene = new THREE.Scene();
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.SkinnedMesh(geometry, material);
    scene.add(mesh);

    const mockGltf: GLTF = {
      anim: [],
      animations: [],
      scene,
      scenes: [scene],
      cameras: [],
      asset: { version: "2.0" },
      parser: {} as any,
      userData: {},
    };

    const validation = validateHighFidelityGlb(mockGltf);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);

    // 测试 load 失败时的自动降级
    const result = await loadHighFidelityCharacterWithFallback("/non-existent-path.glb");
    expect(result.success).toBe(false);
    expect(result.source).toBe("programmatic-prototype-fallback");
    expect(result.model).toBeNull();
  });
});
