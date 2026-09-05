import { describe, expect, it } from "vitest";
import { createPendingRealDeviceReport, createSnowLayerPerfReport } from "./snowLayerPerfReport";
import type { SnowLayerPerfSample } from "./snowLayerPerfHarness";

const samples: SnowLayerPerfSample[] = [
  {
    mode: "baseline",
    quality: "medium",
    devicePixelRatio: 1,
    engineFps: 60,
    averageFrameMs: 16.7,
    p95FrameMs: 20,
    droppedFrameRatio: 0.02,
    frames: 600,
    durationMs: 10000,
    renderer: "WebGL2",
    webglVersion: 2,
  },
  {
    mode: "snow",
    quality: "medium",
    devicePixelRatio: 1,
    engineFps: 52,
    averageFrameMs: 19.2,
    p95FrameMs: 28,
    droppedFrameRatio: 0.08,
    frames: 520,
    durationMs: 10000,
    renderer: "WebGL2",
    webglVersion: 2,
  },
];

describe("snow layer performance report", () => {
  it("computes the snow overhead and labels browser output as a software baseline", () => {
    const report = createSnowLayerPerfReport(samples, {
      generatedAt: "2026-09-05T00:00:00.000Z",
      browser: "Chromium",
      platform: "linux",
    });

    expect(report.source).toBe("ci-software");
    expect(report.validation.status).toBe("software-baseline");
    expect(report.validation.realDeviceEvidenceRequired).toBe(true);
    expect(report.comparison.averageFrameDeltaMs).toBeCloseTo(2.5);
    expect(report.comparison.p95FrameDeltaMs).toBeCloseTo(8);
    expect(report.comparison.droppedFrameRatioDelta).toBeCloseTo(0.06);
    expect(report.comparison.snowFps).toBe(52);
  });

  it("only labels an explicitly tagged iOS/Android run as validated", () => {
    const report = createSnowLayerPerfReport(samples, { source: "android-real", model: "Pixel test device" });
    expect(report.validation.status).toBe("validated");
    expect(report.validation.realDeviceEvidenceRequired).toBe(false);
    expect(report.device.platform).toBe("android");
    expect(report.device.model).toBe("Pixel test device");
  });

  it("creates an explicit pending report without inventing measurements", () => {
    const report = createPendingRealDeviceReport();
    expect(report.samples).toEqual([]);
    expect(report.comparison.snowFps).toBeNull();
    expect(report.validation.status).toBe("software-baseline");
    expect(report.validation.realDeviceEvidenceRequired).toBe(true);
  });
});
