import type { SnowLayerPerfSample } from "./snowLayerPerfHarness";

export type SnowLayerResultSource = "ci-software" | "ci-gpu" | "ios-real" | "android-real";

export interface SnowLayerPerfReport {
  schemaVersion: 1;
  generatedAt: string;
  source: SnowLayerResultSource;
  device: {
    platform: string;
    browser: string;
    renderer: string;
    devicePixelRatio: number | null;
    model: string | null;
  };
  samples: SnowLayerPerfSample[];
  comparison: {
    averageFrameDeltaMs: number | null;
    p95FrameDeltaMs: number | null;
    droppedFrameRatioDelta: number | null;
    snowFps: number | null;
  };
  validation: {
    status: "software-baseline" | "real-device-pending" | "validated";
    realDeviceEvidenceRequired: boolean;
  };
}

export interface SnowLayerPerfReportOptions {
  source?: SnowLayerResultSource;
  platform?: string;
  browser?: string;
  renderer?: string;
  model?: string | null;
  generatedAt?: string;
}

export function createSnowLayerPerfReport(
  samples: SnowLayerPerfSample[],
  options: SnowLayerPerfReportOptions = {},
): SnowLayerPerfReport {
  const baseline = samples.find((sample) => sample.mode === "baseline");
  const snow = samples.find((sample) => sample.mode === "snow");
  const source = options.source ?? "ci-software";
  const isRealDevice = source === "ios-real" || source === "android-real";

  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    source,
    device: {
      platform: options.platform ?? (isRealDevice ? source.replace("-real", "") : "linux"),
      browser: options.browser ?? "unknown",
      renderer: options.renderer ?? snow?.renderer ?? baseline?.renderer ?? "unknown",
      devicePixelRatio: snow?.devicePixelRatio ?? baseline?.devicePixelRatio ?? null,
      model: options.model ?? null,
    },
    samples,
    comparison: {
      averageFrameDeltaMs: baseline && snow ? snow.averageFrameMs - baseline.averageFrameMs : null,
      p95FrameDeltaMs: baseline && snow ? snow.p95FrameMs - baseline.p95FrameMs : null,
      droppedFrameRatioDelta: baseline && snow ? snow.droppedFrameRatio - baseline.droppedFrameRatio : null,
      snowFps: snow?.engineFps ?? null,
    },
    validation: {
      status: isRealDevice ? "validated" : "software-baseline",
      realDeviceEvidenceRequired: !isRealDevice,
    },
  };
}

export function createPendingRealDeviceReport(): SnowLayerPerfReport {
  return createSnowLayerPerfReport([], {
    source: "ci-software",
    platform: "pending-ios-android-device",
    browser: "pending-real-device-run",
    renderer: "pending",
    model: null,
  });
}
