import type { Engine, Scene } from "@babylonjs/core";

export interface BabylonPerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  jsHeapUsedMb: number | null;
  jsHeapLimitMb: number | null;
  sampleTime: number;
  source: "babylon" | "unavailable";
}

export interface BabylonPerformanceSource {
  engine: Engine;
  scene?: Scene;
}

type MemoryPerformance = Performance & {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

const toMb = (bytes: number) => Math.round((bytes / 1048576) * 10) / 10;

export function readBabylonPerformanceMetrics(
  source?: BabylonPerformanceSource,
  now = Date.now(),
): BabylonPerformanceMetrics {
  if (!source) {
    return {
      fps: 0,
      frameTimeMs: 0,
      drawCalls: 0,
      jsHeapUsedMb: null,
      jsHeapLimitMb: null,
      sampleTime: now,
      source: "unavailable",
    };
  }

  const engine = source.engine;
  const memory = (globalThis.performance as MemoryPerformance | undefined)?.memory;
  return {
    fps: Math.round(engine.getFps() * 10) / 10,
    frameTimeMs: Math.round((engine.getFps() > 0 ? 1000 / engine.getFps() : 0) * 10) / 10,
    drawCalls: ((engine as unknown as { _drawCalls?: { current: number } })._drawCalls?.current ?? 0),
    jsHeapUsedMb: memory ? toMb(memory.usedJSHeapSize) : null,
    jsHeapLimitMb: memory ? toMb(memory.jsHeapSizeLimit) : null,
    sampleTime: now,
    source: "babylon",
  };
}

export function formatMemory(metrics: BabylonPerformanceMetrics): string {
  if (metrics.jsHeapUsedMb === null) return "不可用 / N/A";
  return `${metrics.jsHeapUsedMb.toFixed(1)} MB${metrics.jsHeapLimitMb ? ` / ${metrics.jsHeapLimitMb.toFixed(0)} MB` : ""}`;
}

export function getPerformanceTone(fps: number): "good" | "warn" | "bad" {
  if (fps >= 50) return "good";
  if (fps >= 30) return "warn";
  return "bad";
}

export function getDrawCalls(source?: BabylonPerformanceSource): number {
  if (!source) return 0;
  return ((source.engine as unknown as { _drawCalls?: { current: number } })._drawCalls?.current ?? 0);
}

export function getBrowserMemoryEstimate(): { usedMb: number; limitMb: number } | null {
  const memory = (globalThis.performance as MemoryPerformance | undefined)?.memory;
  return memory
    ? { usedMb: toMb(memory.usedJSHeapSize), limitMb: toMb(memory.jsHeapSizeLimit) }
    : null;
}
