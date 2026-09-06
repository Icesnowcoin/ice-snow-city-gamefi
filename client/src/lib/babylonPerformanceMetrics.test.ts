import { describe, expect, it, vi } from "vitest";
import {
  formatMemory,
  getPerformanceTone,
  readBabylonPerformanceMetrics,
} from "./babylonPerformanceMetrics";

describe("babylonPerformanceMetrics", () => {
  it("returns an honest unavailable state without an engine", () => {
    const metrics = readBabylonPerformanceMetrics(undefined, 123);
    expect(metrics.source).toBe("unavailable");
    expect(metrics.fps).toBe(0);
    expect(metrics.jsHeapUsedMb).toBeNull();
  });

  it("reads FPS, frame time and draw calls from an engine", () => {
    const engine = {
      getFps: vi.fn(() => 50),
      _drawCalls: { current: 17 },
    };
    const metrics = readBabylonPerformanceMetrics({ engine: engine as never }, 456);
    expect(metrics.source).toBe("babylon");
    expect(metrics.fps).toBe(50);
    expect(metrics.frameTimeMs).toBe(20);
    expect(metrics.drawCalls).toBe(17);
    expect(metrics.sampleTime).toBe(456);
  });

  it("formats browser memory only when the browser exposes it", () => {
    expect(formatMemory({
      fps: 60,
      frameTimeMs: 16.7,
      drawCalls: 1,
      jsHeapUsedMb: 128.4,
      jsHeapLimitMb: 2048,
      sampleTime: 0,
      source: "babylon",
    })).toContain("128.4 MB");
    expect(getPerformanceTone(60)).toBe("good");
    expect(getPerformanceTone(40)).toBe("warn");
    expect(getPerformanceTone(20)).toBe("bad");
  });
});
