import type { BabylonPerformanceMetrics } from "./babylonPerformanceMetrics";

export const DEFAULT_FPS_WARNING_THRESHOLD = 30;
export const DEFAULT_PEAK_MEMORY_WARNING_MB = 512;

export interface PerformanceMetricsSummary {
  averageFps: number | null;
  peakJsHeapUsedMb: number | null;
  sampleCount: number;
}

export function isAverageFpsWarning(averageFps: number | null, threshold = DEFAULT_FPS_WARNING_THRESHOLD): boolean {
  return averageFps !== null && averageFps < threshold;
}

export function isPeakMemoryWarning(peakJsHeapUsedMb: number | null, threshold = DEFAULT_PEAK_MEMORY_WARNING_MB): boolean {
  return peakJsHeapUsedMb !== null && peakJsHeapUsedMb > threshold;
}

export function summarizePerformanceMetrics(samples: BabylonPerformanceMetrics[]): PerformanceMetricsSummary {
  if (samples.length === 0) return { averageFps: null, peakJsHeapUsedMb: null, sampleCount: 0 };
  const heapValues = samples.flatMap((sample) => sample.jsHeapUsedMb === null ? [] : [sample.jsHeapUsedMb]);
  return {
    averageFps: samples.reduce((total, sample) => total + sample.fps, 0) / samples.length,
    peakJsHeapUsedMb: heapValues.length === 0 ? null : Math.max(...heapValues),
    sampleCount: samples.length,
  };
}
