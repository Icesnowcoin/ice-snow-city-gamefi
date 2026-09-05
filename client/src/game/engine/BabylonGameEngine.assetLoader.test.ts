import * as BABYLON from "@babylonjs/core";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { BabylonGameEngine } from "./BabylonGameEngine";

describe("BabylonGameEngine GLB loader contract", () => {
  let nullEngine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    nullEngine = new BABYLON.NullEngine({ renderWidth: 320, renderHeight: 180 });
    scene = new BABYLON.Scene(nullEngine);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    scene.dispose();
    nullEngine.dispose();
  });

  it("reports progress, selects the root mesh, and emits a final 100% sample", async () => {
    const root = new BABYLON.TransformNode("root", scene);
    const child = new BABYLON.Mesh("child", scene);
    child.parent = root;
    const importSpy = vi.spyOn(BABYLON.SceneLoader, "ImportMeshAsync").mockImplementationOnce(async (_meshes, _rootUrl, _sceneFilename, _scene, onProgress) => {
      onProgress?.({ loaded: 25, total: 100, lengthComputable: true });
      onProgress?.({ loaded: 100, total: 100, lengthComputable: true });
      return { meshes: [child, root], particleSystems: [], skeletons: [], animationGroups: [], transformNodes: [root], geometries: [], lights: [] };
    });

    const engine = new BabylonGameEngine() as BabylonGameEngine & { scene: BABYLON.Scene };
    engine.scene = scene;
    const progress: Array<number | null> = [];

    const loaded = await engine.loadModel("/assets/city.glb", "city-root", new BABYLON.Vector3(4, 2, -6), {
      onProgress: (sample) => progress.push(sample.percent),
    });

    expect(loaded).toBe(root);
    expect(loaded.name).toBe("city-root");
    expect(loaded.position.asArray()).toEqual([4, 2, -6]);
    expect(progress).toEqual([25, 100, 100]);
    expect(importSpy).toHaveBeenCalledOnce();
    engine.disposeLoadedModel(loaded);
    expect(root.isDisposed()).toBe(true);
  });

  it("rejects an already-aborted request without touching the loader", async () => {
    const controller = new AbortController();
    controller.abort();
    const importSpy = vi.spyOn(BABYLON.SceneLoader, "ImportMeshAsync");
    const engine = new BabylonGameEngine() as BabylonGameEngine & { scene: BABYLON.Scene };
    engine.scene = scene;

    await expect(engine.loadModel("/assets/city.glb", "city-root", BABYLON.Vector3.Zero(), { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(importSpy).not.toHaveBeenCalled();
  });
});
