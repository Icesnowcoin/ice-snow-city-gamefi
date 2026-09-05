import {
  createSnowLayerPerfReport,
  type SnowLayerPerfReport,
  type SnowLayerPerfReportOptions,
} from "./snowLayerPerfReport";
import type { SnowLayerPerfSample } from "./snowLayerPerfHarness";

export type SimulatedDeviceProfile = {
  id: "low" | "medium" | "high";
  platform: "simulated-mobile" | "simulated-desktop";
  browser: string;
  renderer: string;
  devicePixelRatio: number;
};

export const SIMULATED_DEVICE_PROFILES: Record<SimulatedDeviceProfile["id"], SimulatedDeviceProfile> = {
  low: {
    id: "low",
    platform: "simulated-mobile",
    browser: "software-profile",
    renderer: "software-profile",
    devicePixelRatio: 1,
  },
  medium: {
    id: "medium",
    platform: "simulated-mobile",
    browser: "software-profile",
    renderer: "software-profile",
    devicePixelRatio: 1.5,
  },
  high: {
    id: "high",
    platform: "simulated-desktop",
    browser: "software-profile",
    renderer: "software-profile",
    devicePixelRatio: 2,
  },
};

export function createSimulatedDevicePerfReport(
  samples: SnowLayerPerfSample[],
  profileId: SimulatedDeviceProfile["id"],
  generatedAt = "2026-09-05T00:00:00.000Z",
): SnowLayerPerfReport {
  const profile = SIMULATED_DEVICE_PROFILES[profileId];
  const options: SnowLayerPerfReportOptions = {
    source: "ci-software",
    platform: profile.platform,
    browser: profile.browser,
    renderer: profile.renderer,
    model: `simulated-${profile.id}`,
    generatedAt,
  };
  const report = createSnowLayerPerfReport(samples, options);
  return {
    ...report,
    device: {
      ...report.device,
      devicePixelRatio: profile.devicePixelRatio,
    },
    validation: {
      status: "software-baseline",
      realDeviceEvidenceRequired: true,
    },
  };
}
