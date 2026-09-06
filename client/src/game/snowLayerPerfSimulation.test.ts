import { describe, expect, it } from "vitest";
import type { SnowLayerPerfSample } from "./snowLayerPerfHarness";
import {
  createSimulatedDevicePerfReport,
  SIMULATED_DEVICE_PROFILES,
} from "./snowLayerPerfSimulation";

const samples: SnowLayerPerfSample[] = [
  {
    mode: "baseline",
    quality: "medium",
    devicePixelRatio: 1,
    engineFps: 60,
    averageFrameMs: 16.7,
    p95FrameMs: 18,
    droppedFrameRatio: 0.01,
    frames: 120,
    durationMs: 2000,
    renderer: "software-profile",
    webglVersion: 2,
  },
  {
    mode: "snow",
    quality: "medium",
    devicePixelRatio: 1,
    engineFps: 57,
    averageFrameMs: 17.5,
    p95FrameMs: 21,
    droppedFrameRatio: 0.03,
    frames: 114,
    durationMs: 2000,
    renderer: "software-profile",
    webglVersion: 2,
  },
];

describe("snowLayerPerfSimulation", () => {
  it("exposes explicit low/medium/high software profiles", () => {
    expect(Object.keys(SIMULATED_DEVICE_PROFILES)).toEqual(["low", "medium", "high"]);
    expect(SIMULATED_DEVICE_PROFILES.low.platform).toBe("simulated-mobile");
    expect(SIMULATED_DEVICE_PROFILES.high.platform).toBe("simulated-desktop");
  });

  it("never promotes simulated samples to real-device validation", () => {
    const report = createSimulatedDevicePerfReport(samples, "low");

    expect(report.source).toBe("ci-software");
    expect(report.device.model).toBe("simulated-low");
    expect(report.validation).toEqual({
      status: "software-baseline",
      realDeviceEvidenceRequired: true,
    });
    expect(report.comparison.snowFps).toBe(57);
  });
});
