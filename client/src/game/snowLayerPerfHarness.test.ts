import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectSnowLayerSample,
  normalizeSnowLayerPerfOptions,
  summarizeSnowLayerFrameTimes,
  waitForStableFrames,
} from "./snowLayerPerfHarness";

function createRenderHarness() {
  let renderCallback: (() => void) | undefined;
  let observerCallback: (() => void) | undefined;
  const observerToken = { id: "observer" };
  const remove = vi.fn();
  const engine = {
    webGLVersion: 2,
    runRenderLoop: (callback: () => void) => {
      renderCallback = callback;
    },
    stopRenderLoop: vi.fn(),
  };
  const scene = {
    render: vi.fn(() => observerCallback?.()),
    onAfterRenderObservable: {
      add: (callback: () => void) => {
        observerCallback = callback;
        return observerToken;
      },
      remove,
    },
  };

  return {
    engine,
    scene,
    observerToken,
    remove,
    triggerRender: () => renderCallback?.(),
    triggerAfterRender: () => observerCallback?.(),
  };
}

describe("snowLayerPerfHarness pure helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes minimum duration and mesh count without changing selected quality", () => {
    const onProgress = vi.fn();

    expect(normalizeSnowLayerPerfOptions({ durationMs: 100, meshCount: 0, quality: "high", onProgress })).toEqual({
      durationMs: 3000,
      quality: "high",
      meshCount: 1,
      onProgress,
    });
  });

  it("calculates average, p95 and dropped-frame ratio from frame samples", () => {
    expect(summarizeSnowLayerFrameTimes([16, 40, 50, 20])).toEqual({
      averageFrameMs: 31.5,
      p95FrameMs: 50,
      droppedFrameRatio: 0.5,
    });
    expect(summarizeSnowLayerFrameTimes([])).toEqual({
      averageFrameMs: 0,
      p95FrameMs: 0,
      droppedFrameRatio: 0,
    });
  });
});

describe("snowLayerPerfHarness lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("waits for the requested stable frames and stops the render loop", async () => {
    const harness = createRenderHarness();
    const pending = waitForStableFrames(harness.engine as never, harness.scene as never, 3);

    harness.triggerAfterRender();
    harness.triggerAfterRender();
    harness.triggerAfterRender();
    await pending;

    expect(harness.remove).toHaveBeenCalledWith(harness.observerToken);
    expect(harness.engine.stopRenderLoop).toHaveBeenCalledOnce();
  });

  it("collects progress, statistics, renderer metadata and cleans the render loop", async () => {
    const harness = createRenderHarness();
    const progress = vi.fn();
    vi.spyOn(performance, "now")
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(116)
      .mockReturnValueOnce(160)
      .mockReturnValueOnce(200)
      .mockReturnValueOnce(220);

    const pending = collectSnowLayerSample(
      harness.engine as never,
      harness.scene as never,
      "snow",
      "medium",
      50,
      progress,
    );

    harness.triggerRender();
    harness.triggerRender();
    harness.triggerRender();
    const sample = await pending;

    expect(progress).toHaveBeenCalledTimes(3);
    expect(progress).toHaveBeenLastCalledWith("snow", 100, 50);
    expect(sample).toMatchObject({
      mode: "snow",
      quality: "medium",
      engineFps: expect.closeTo(30, 5),
      averageFrameMs: expect.closeTo(33.333, 0.01),
      p95FrameMs: 44,
      droppedFrameRatio: 2 / 3,
      frames: 3,
      renderer: "WebGL2",
      webglVersion: 2,
    });
    expect(sample.durationMs).toBe(120);
    expect(harness.engine.stopRenderLoop).toHaveBeenCalledOnce();
    expect(harness.remove).toHaveBeenCalledWith(harness.observerToken);
  });
});
