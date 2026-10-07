import { describe, expect, it } from "vitest";
import { MAX_PERFORMANCE_SAMPLES, performanceMetricsToCsv } from "./performanceMetricsCsv";
import type { BabylonPerformanceMetrics } from "./babylonPerformanceMetrics";

const sample = (sampleTime: number, source: BabylonPerformanceMetrics["source"] = "babylon"): BabylonPerformanceMetrics => ({
  fps: 59.94,
  frameTimeMs: 16.683,
  drawCalls: 42,
  jsHeapUsedMb: 12.345,
  jsHeapLimitMb: null,
  sampleTime,
  source,
});

describe("performanceMetricsToCsv", () => {
  it("writes headers and normalized metric rows", () => {
    const csv = performanceMetricsToCsv([sample(Date.UTC(2026, 8, 2, 1, 2, 3))]);
    expect(csv).toContain("timestamp_iso,fps,frame_time_ms,draw_calls,js_heap_used_mb,js_heap_limit_mb,source");
    expect(csv).toContain("2026-09-02T01:02:03.000Z,59.9,16.7,42,12.3,,babylon");
  });

  it("keeps unavailable heap values blank and escapes source text if needed", () => {
    const csv = performanceMetricsToCsv([sample(0, "unavailable")]);
    expect(csv).toContain("42,12.3,,unavailable");
  });

  it("exports only the most recent bounded sample window", () => {
    const samples = Array.from({ length: MAX_PERFORMANCE_SAMPLES + 2 }, (_, index) => sample(index));
    const csv = performanceMetricsToCsv(samples);
    expect(csv.trim().split("\n")).toHaveLength(MAX_PERFORMANCE_SAMPLES + 1);
    expect(csv).not.toContain("1970-01-01T00:00:00.000Z");
    expect(csv).toContain(`1970-01-01T00:00:01.201Z`);
  });
});
