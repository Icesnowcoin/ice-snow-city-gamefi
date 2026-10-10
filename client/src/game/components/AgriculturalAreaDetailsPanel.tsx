import React from 'react';
import type { AgriculturalArea } from '../map/AgriculturalArea';

export type AgriculturalAreaDetailsPanelProps = {
  area: AgriculturalArea | null;
  onClose: () => void;
};

const statusLabels = {
  growing: '生长中',
  ready: '可收获',
  resting: '轮作休整',
} as const;

export const AgriculturalAreaDetailsPanel: React.FC<AgriculturalAreaDetailsPanelProps> = ({ area, onClose }) => {
  if (!area) return null;

  return (
    <aside
      data-testid="agricultural-area-details"
      role="dialog"
      aria-label={`${area.name}农业区域详情`}
      className="absolute bottom-4 left-1/2 z-40 w-[min(23rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-emerald-200/35 bg-slate-950/95 p-4 text-white shadow-2xl shadow-emerald-950/40 backdrop-blur-md sm:left-4 sm:translate-x-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">农业区域 · 详细数据</p>
          <h2 className="mt-1 text-lg font-bold text-white">{area.name}</h2>
          <p className="mt-1 text-xs text-slate-400">{area.description}</p>
        </div>
        <button
          type="button"
          aria-label="关闭农业区域详情"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          ×
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">当前作物</p>
          <p className="mt-1 font-semibold text-emerald-100">{area.crop}</p>
        </div>
        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
          {statusLabels[area.status]}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">生长进度</span>
          <span className="font-semibold text-emerald-100">{area.progress}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10" aria-label={`生长进度 ${area.progress}%`}>
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-[width] duration-500" style={{ width: `${area.progress}%` }} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/[0.04] p-2"><dt className="text-slate-500">预计产量</dt><dd className="mt-1 font-semibold text-slate-100">{area.yieldAmount} {area.yieldUnit}</dd></div>
        <div className="rounded-lg bg-white/[0.04] p-2"><dt className="text-slate-500">耗水量</dt><dd className="mt-1 font-semibold text-slate-100">{area.waterUsage} m³ / 周期</dd></div>
        <div className="rounded-lg bg-white/[0.04] p-2"><dt className="text-slate-500">温度</dt><dd className="mt-1 font-semibold text-slate-100">{area.temperature}</dd></div>
        <div className="rounded-lg bg-white/[0.04] p-2"><dt className="text-slate-500">管理小组</dt><dd className="mt-1 font-semibold text-slate-100">{area.caretaker}</dd></div>
      </dl>
    </aside>
  );
};

export default AgriculturalAreaDetailsPanel;
