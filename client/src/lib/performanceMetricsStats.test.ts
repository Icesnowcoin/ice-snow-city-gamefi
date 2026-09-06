import { describe, expect, it } from "vitest";
import { isAverageFpsWarning, isPeakMemoryWarning, summarizePerformanceMetrics } from "./performanceMetricsStats";
import type { BabylonPerformanceMetrics } from "./babylonPerformanceMetrics";

const metric = (fps: number, heap: number | null): BabylonPerformanceMetrics => ({
  fps, frameTimeMs: 16, drawCalls: 10, jsHeapUsedMb: heap, jsHeapLimitMb: null, sampleTime: Date.now(), source: "babylon",
});

describe("summarizePerformanceMetrics", () => {
  it("returns empty summary without samples", () => {
    expect(summarizePerformanceMetrics([])).toEqual({ averageFps: null, peakJsHeapUsedMb: null, sampleCount: 0 });
  });

  it("calculates average FPS and peak available heap", () => {
    expect(summarizePerformanceMetrics([metric(30, 8), metric(50, 12.5), metric(40, null)])).toEqual({ averageFps: 40, peakJsHeapUsedMb: 12.5, sampleCount: 3 });
  });

  it("reports memory as unavailable when every heap sample is unavailable", () => {
    expect(summarizePerformanceMetrics([metric(55, null)])).toMatchObject({ averageFps: 55, peakJsHeapUsedMb: null, sampleCount: 1 });
  });
});

describe("performance thresholds", () => {
  it("warns only when average FPS is below 30", () => {
    expect(isAverageFpsWarning(29.9)).toBe(true);
    expect(isAverageFpsWarning(30)).toBe(false);
    expect(isAverageFpsWarning(null)).toBe(false);
  });

  it("warns only when peak heap is above the configured threshold", () => {
    expect(isPeakMemoryWarning(512, 512)).toBe(false);
    expect(isPeakMemoryWarning(512.1, 512)).toBe(true);
    expect(isPeakMemoryWarning(null, 512)).toBe(false);
  });
});
