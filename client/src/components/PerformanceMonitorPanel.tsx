import { useEffect, useMemo, useState } from "react";
import type { Engine, Scene } from "@babylonjs/core";
import {
  formatMemory,
  getPerformanceTone,
  readBabylonPerformanceMetrics,
  type BabylonPerformanceMetrics,
  type BabylonPerformanceSource,
} from "@/lib/babylonPerformanceMetrics";
import { downloadPerformanceCsv } from "@/lib/performanceMetricsCsv";
import { isAverageFpsWarning, isPeakMemoryWarning, summarizePerformanceMetrics, DEFAULT_PEAK_MEMORY_WARNING_MB } from "@/lib/performanceMetricsStats";

interface PerformanceMonitorPanelProps {
  engine?: Engine;
  scene?: Scene;
  enabled?: boolean;
  sampleIntervalMs?: number;
  onClose?: () => void;
  peakMemoryWarningMb?: number;
}

const emptyMetrics: BabylonPerformanceMetrics = {
  fps: 0, frameTimeMs: 0, drawCalls: 0, jsHeapUsedMb: null, jsHeapLimitMb: null, sampleTime: 0, source: "unavailable",
};

export function PerformanceMonitorPanel({ engine, scene, enabled = true, sampleIntervalMs = 500, onClose, peakMemoryWarningMb = DEFAULT_PEAK_MEMORY_WARNING_MB }: PerformanceMonitorPanelProps) {
  const [metrics, setMetrics] = useState<BabylonPerformanceMetrics>(emptyMetrics);
  const [samples, setSamples] = useState<BabylonPerformanceMetrics[]>([]);
  const [exportState, setExportState] = useState<"idle" | "exporting" | "success" | "empty">("idle");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearNotice, setClearNotice] = useState("");
  const source = useMemo<BabylonPerformanceSource | undefined>(() => (engine ? { engine, scene } : undefined), [engine, scene]);

  useEffect(() => {
    if (!enabled) return;
    const update = () => {
      const next = readBabylonPerformanceMetrics(source);
      setMetrics(next);
      if (next.source === "babylon") setSamples((previous) => [...previous, next].slice(-1200));
    };
    update();
    const timer = window.setInterval(update, Math.max(250, sampleIntervalMs));
    return () => window.clearInterval(timer);
  }, [enabled, sampleIntervalMs, source]);

  if (!enabled) return null;
  const tone = getPerformanceTone(metrics.fps);
  const unavailable = metrics.source === "unavailable";
  const summary = summarizePerformanceMetrics(samples);
  const averageFpsWarning = isAverageFpsWarning(summary.averageFps);
  const peakMemoryWarning = isPeakMemoryWarning(summary.peakJsHeapUsedMb, peakMemoryWarningMb);
  const handleExport = () => {
    if (samples.length === 0) { setExportState("empty"); return; }
    setExportState("exporting");
    const didDownload = downloadPerformanceCsv(samples, `isc-performance-${new Date().toISOString().replaceAll(":", "-")}.csv`);
    setExportState(didDownload ? "success" : "empty");
    window.setTimeout(() => setExportState("idle"), 1800);
  };

  const handleClear = () => {
    setSamples([]);
    setConfirmClear(false);
    setClearNotice("性能记录已清除");
    window.setTimeout(() => setClearNotice(""), 1800);
  };

  return (
    <section className="fixed right-3 top-3 z-[70] w-[min(19rem,calc(100vw-1.5rem))] rounded-xl border border-cyan-300/30 bg-slate-950/90 p-3 text-xs text-slate-100 shadow-2xl backdrop-blur-md" data-testid="performance-monitor-panel" aria-label="3D 性能监控面板" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div><p className="font-semibold tracking-wide text-cyan-200">3D 性能监控</p><p className="text-[10px] text-slate-400">测试模式 · 低频采样 · {samples.length} 条记录</p></div>
        {onClose && <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="关闭性能监控面板">×</button>}
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2" data-testid="performance-summary"><Metric label="平均 FPS" value={summary.averageFps === null ? "暂无数据" : summary.averageFps.toFixed(1)} tone={averageFpsWarning ? "bad" : undefined} warning={averageFpsWarning ? "低于 30 FPS" : undefined} /><Metric label="峰值内存" value={summary.peakJsHeapUsedMb === null ? "不可用" : `${summary.peakJsHeapUsedMb.toFixed(1)} MB`} tone={peakMemoryWarning ? "bad" : undefined} warning={peakMemoryWarning ? `超过 ${peakMemoryWarningMb} MB` : undefined} /></div>
      {unavailable ? <p className="rounded-lg bg-slate-900/80 p-2 text-slate-300" data-testid="performance-monitor-unavailable">等待 Babylon.js 场景注册。当前不伪造性能数据。</p> : <div className="grid grid-cols-2 gap-2"><Metric label="FPS" value={metrics.fps.toFixed(1)} tone={tone} /><Metric label="帧时间" value={`${metrics.frameTimeMs.toFixed(1)} ms`} /><Metric label="Draw Calls" value={String(metrics.drawCalls)} /><Metric label="JS 内存估算" value={formatMemory(metrics)} /></div>}
      <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={handleExport} disabled={exportState === "exporting"} aria-busy={exportState === "exporting"} data-testid="performance-export-csv" className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 font-medium text-cyan-100 transition-colors hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-wait disabled:opacity-60"><span aria-hidden="true">⇩</span>{exportState === "exporting" ? "正在导出…" : "导出 CSV"}</button><button type="button" onClick={() => setConfirmClear(true)} disabled={samples.length === 0} data-testid="performance-clear-data" className="min-h-10 rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 font-medium text-rose-100 transition-colors hover:bg-rose-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-40">清除数据</button></div>
      <p className="mt-1 min-h-4 text-center text-[10px] text-cyan-200" role="status" data-testid="performance-export-status">{exportState === "success" ? "CSV 已下载" : exportState === "empty" ? "暂无可导出的性能记录" : clearNotice}</p>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">内存为浏览器 JS Heap 估算值，不等于完整 GPU 显存；Draw Calls 为 Babylon 引擎当前统计值。数据仅保存在本地。</p>
      {confirmClear && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4" role="presentation"><div className="w-full max-w-sm rounded-xl border border-rose-300/30 bg-slate-900 p-4 text-slate-100 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="clear-performance-title" aria-describedby="clear-performance-description" data-testid="performance-clear-confirm"><h2 id="clear-performance-title" className="font-semibold text-rose-100">清除性能记录？</h2><p id="clear-performance-description" className="mt-2 text-sm leading-5 text-slate-300">这将清除当前页面已收集的 {samples.length} 条性能采样。不会影响游戏进度、交易数据或服务器数据。</p><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setConfirmClear(false)} data-testid="performance-clear-cancel" className="min-h-10 rounded-lg border border-white/15 px-3 py-2 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">取消</button><button type="button" onClick={handleClear} data-testid="performance-clear-confirm-button" className="min-h-10 rounded-lg bg-rose-500/90 px-3 py-2 font-medium text-white transition-colors hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">确认清除</button></div></div></div>}
    </section>
  );
}

function Metric({ label, value, tone, warning }: { label: string; value: string; tone?: "good" | "warn" | "bad"; warning?: string }) {
  const toneClass = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : tone === "bad" ? "text-rose-300" : "text-white";
  return <div className={`rounded-lg border p-2 ${tone === "bad" ? "border-rose-400/70 bg-rose-500/15" : "border-white/10 bg-white/[0.06]"}`}><p className="text-[10px] text-slate-400">{label}</p><p className={`mt-0.5 font-mono font-semibold ${toneClass}`}>{value}</p>{warning && <p className="mt-1 text-[10px] font-medium text-rose-300" role="alert">{warning}</p>}</div>;
}
