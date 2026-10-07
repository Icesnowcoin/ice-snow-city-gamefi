import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { configureIceSnowPbrMaterial, SnowLayerQuality } from "./IceSnowSnowLayerMaterialPlugin";

export interface SnowLayerPerfSample {
  mode: "baseline" | "snow";
  quality: SnowLayerQuality;
  devicePixelRatio: number;
  engineFps: number;
  averageFrameMs: number;
  p95FrameMs: number;
  droppedFrameRatio: number;
  frames: number;
  durationMs: number;
  renderer: string;
  webglVersion: number;
}

export interface SnowLayerPerfOptions {
  durationMs?: number;
  quality?: SnowLayerQuality;
  meshCount?: number;
  onProgress?: (mode: SnowLayerPerfSample["mode"], elapsedMs: number, durationMs: number) => void;
}

export interface NormalizedSnowLayerPerfOptions {
  durationMs: number;
  quality: SnowLayerQuality;
  meshCount: number;
  onProgress?: SnowLayerPerfOptions["onProgress"];
}

export interface SnowLayerFrameStats {
  averageFrameMs: number;
  p95FrameMs: number;
  droppedFrameRatio: number;
}

export function normalizeSnowLayerPerfOptions(
  options: SnowLayerPerfOptions = {},
): NormalizedSnowLayerPerfOptions {
  return {
    durationMs: Math.max(3000, options.durationMs ?? 10000),
    quality: options.quality ?? "medium",
    meshCount: Math.max(1, Math.floor(options.meshCount ?? 24)),
    onProgress: options.onProgress,
  };
}

export function summarizeSnowLayerFrameTimes(frameTimes: readonly number[]): SnowLayerFrameStats {
  const sorted = [...frameTimes].sort((a, b) => a - b);
  const averageFrameMs = frameTimes.reduce((sum, value) => sum + value, 0) / Math.max(1, frameTimes.length);
  const p95FrameMs = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
  const droppedFrameRatio = frameTimes.filter((value) => value > 33.34).length / Math.max(1, frameTimes.length);
  return { averageFrameMs, p95FrameMs, droppedFrameRatio };
}

/**
 * Runs a controlled baseline-vs-snow benchmark in the current browser tab.
 * Call it from a real iOS/Android WebGL page, not from NullEngine tests.
 */
export async function runSnowLayerPerfBenchmark(
  canvas: HTMLCanvasElement,
  options: SnowLayerPerfOptions = {},
): Promise<SnowLayerPerfSample[]> {
  const { durationMs, quality, meshCount, onProgress } = normalizeSnowLayerPerfOptions(options);
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  const scene = new Scene(engine);
  const camera = new ArcRotateCamera("perf-camera", -Math.PI / 2, 1.05, 26, Vector3.Zero(), scene);
  camera.attachControl(canvas, false);
  camera.lowerRadiusLimit = camera.upperRadiusLimit = 26;
  new HemisphericLight("perf-light", new Vector3(0.2, 1, 0.3), scene).intensity = 1.2;

  const materials = createMaterials(scene, quality);
  const meshes = Array.from({ length: meshCount }, (_, index) => {
    const mesh = MeshBuilder.CreateBox(`perf-building-${index}`, { size: 2 }, scene);
    mesh.position.set((index % 6) * 3.2 - 8, Math.floor(index / 6) * 2.2, 0);
    mesh.material = materials.snow;
    return mesh;
  });

  const samples: SnowLayerPerfSample[] = [];
  for (const mode of ["baseline", "snow"] as const) {
    for (const mesh of meshes) mesh.material = mode === "snow" ? materials.snow : materials.baseline;
    await waitForStableFrames(engine, scene, 30);
    samples.push(await collectSnowLayerSample(engine, scene, mode, quality, durationMs, onProgress));
  }

  scene.dispose();
  engine.dispose();
  return samples;
}

function createMaterials(scene: Scene, quality: SnowLayerQuality) {
  const baseline = new PBRMaterial("perf-baseline", scene);
  baseline.albedoColor = new Color3(0.62, 0.75, 0.82);
  baseline.roughness = 0.72;
  baseline.metallic = 0;

  const snow = baseline.clone("perf-snow") as PBRMaterial;
  const plugin = configureIceSnowPbrMaterial(snow, quality);
  plugin.setSnowAmount(0.48);
  plugin.setWorldHeight(0.8);
  plugin.setSnowColor(new Color3(0.88, 0.94, 0.97));
  return { baseline, snow };
}

export async function waitForStableFrames(engine: Engine, scene: Scene, frames: number): Promise<void> {
  await new Promise<void>((resolve) => {
    let completed = 0;
    const observer = scene.onAfterRenderObservable.add(() => {
      completed += 1;
      if (completed >= frames) {
        scene.onAfterRenderObservable.remove(observer);
        resolve();
      }
    });
    engine.runRenderLoop(() => scene.render());
  });
  engine.stopRenderLoop();
}

export async function collectSnowLayerSample(
  engine: Engine,
  scene: Scene,
  mode: SnowLayerPerfSample["mode"],
  quality: SnowLayerQuality,
  durationMs: number,
  onProgress?: SnowLayerPerfOptions["onProgress"],
): Promise<SnowLayerPerfSample> {
  const frameTimes: number[] = [];
  let last = performance.now();
  const startedAt = last;
  let frames = 0;

  await new Promise<void>((resolve) => {
    const observer = scene.onAfterRenderObservable.add(() => {
      const now = performance.now();
      const frameMs = now - last;
      last = now;
      if (frameMs > 0) frameTimes.push(frameMs);
      frames += 1;
      onProgress?.(mode, now - startedAt, durationMs);
      if (now - startedAt >= durationMs) {
        scene.onAfterRenderObservable.remove(observer);
        resolve();
      }
    });
    engine.runRenderLoop(() => scene.render());
  });

  engine.stopRenderLoop();
  const { averageFrameMs, p95FrameMs, droppedFrameRatio } = summarizeSnowLayerFrameTimes(frameTimes);
  const renderer = engine.webGLVersion >= 2 ? "WebGL2" : "WebGL1";

  return {
    mode,
    quality,
    devicePixelRatio: window.devicePixelRatio || 1,
    engineFps: averageFrameMs > 0 ? 1000 / averageFrameMs : 0,
    averageFrameMs,
    p95FrameMs,
    droppedFrameRatio,
    frames,
    durationMs: performance.now() - startedAt,
    renderer,
    webglVersion: engine.webGLVersion,
  };
}
