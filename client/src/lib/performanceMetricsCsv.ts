import type { BabylonPerformanceMetrics } from "./babylonPerformanceMetrics";

export const PERFORMANCE_CSV_HEADERS = [
  "timestamp_iso",
  "fps",
  "frame_time_ms",
  "draw_calls",
  "js_heap_used_mb",
  "js_heap_limit_mb",
  "source",
] as const;

export const MAX_PERFORMANCE_SAMPLES = 1200;

function escapeCsv(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function performanceMetricsToCsv(samples: BabylonPerformanceMetrics[]): string {
  const rows = samples.slice(-MAX_PERFORMANCE_SAMPLES).map((sample) => [
    new Date(sample.sampleTime).toISOString(),
    sample.fps.toFixed(1),
    sample.frameTimeMs.toFixed(1),
    sample.drawCalls,
    sample.jsHeapUsedMb === null ? null : sample.jsHeapUsedMb.toFixed(1),
    sample.jsHeapLimitMb === null ? null : sample.jsHeapLimitMb.toFixed(1),
    sample.source,
  ].map(escapeCsv).join(","));
  return [PERFORMANCE_CSV_HEADERS.join(","), ...rows].join("\n") + "\n";
}

export function downloadPerformanceCsv(samples: BabylonPerformanceMetrics[], filename = "isc-performance-metrics.csv"): boolean {
  if (samples.length === 0 || typeof document === "undefined") return false;
  const blob = new Blob(["\uFEFF", performanceMetricsToCsv(samples)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}
