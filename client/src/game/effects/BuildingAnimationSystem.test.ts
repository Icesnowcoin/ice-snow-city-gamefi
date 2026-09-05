import { NullEngine, Scene, MeshBuilder } from "@babylonjs/core";
import { afterEach, describe, expect, it } from "vitest";

import { BuildingAnimationSystem } from "./BuildingAnimationSystem";

let engine: NullEngine | undefined;
let scene: Scene | undefined;

afterEach(() => {
  scene?.dispose();
  engine?.dispose();
  scene = undefined;
  engine = undefined;
});

describe("BuildingAnimationSystem state animations", () => {
  it("creates and stops a repeatable production animation", () => {
    engine = new NullEngine();
    scene = new Scene(engine);
    const mesh = MeshBuilder.CreateBox("factory", {}, scene);
    const system = new BuildingAnimationSystem(scene);

    system.playProductionAnimation(mesh, { duration: 800, loop: false });
    expect(mesh.animations.some((animation) => animation.name.includes("production_factory"))).toBe(true);
    system.stopProductionAnimation(mesh);
    expect(mesh.animations.some((animation) => animation.name.includes("production_factory"))).toBe(false);
  });

  it("creates and cleans smoke and light effects without requiring texture assets", () => {
    engine = new NullEngine();
    scene = new Scene(engine);
    const mesh = MeshBuilder.CreateBox("plant", {}, scene);
    const system = new BuildingAnimationSystem(scene);

    system.playSmokeEffect(mesh, { duration: 900, loop: true });
    expect(mesh.animations.some((animation) => animation.name.includes("smoke_plant"))).toBe(true);
    system.stopSmokeEffect(mesh);
    expect(mesh.animations.some((animation) => animation.name.includes("smoke_plant"))).toBe(false);

    system.playLightEffect(mesh, { duration: 700, loop: true });
    expect(mesh.animations.some((animation) => animation.name.includes("light_plant"))).toBe(true);
    system.stopLightEffect(mesh);
    expect(mesh.animations.some((animation) => animation.name.includes("light_plant"))).toBe(false);
  });

  it("exposes door and harvest animations without changing the final transform contract", async () => {
    engine = new NullEngine();
    scene = new Scene(engine);
    const mesh = MeshBuilder.CreateBox("shop", {}, scene);
    const originalRotation = mesh.rotation.clone();
    const originalPosition = mesh.position.clone();
    const originalScale = mesh.scaling.clone();
    const system = new BuildingAnimationSystem(scene);

    const doorPromise = system.playDoorOpenAnimation(mesh);
    expect(mesh.animations.some((animation) => animation.name.includes("door_open_shop"))).toBe(true);
    scene.stopAnimation(mesh);
    mesh.rotation = originalRotation;
    await doorPromise.catch(() => undefined);

    const harvestPromise = system.playHarvestAnimation(mesh);
    expect(mesh.animations.some((animation) => animation.name.includes("harvest_shop"))).toBe(true);
    scene.stopAnimation(mesh);
    mesh.position = originalPosition;
    mesh.scaling = originalScale;
    expect(mesh.position.equals(originalPosition)).toBe(true);
    expect(mesh.scaling.equals(originalScale)).toBe(true);
    await harvestPromise.catch(() => undefined);
  });
});
