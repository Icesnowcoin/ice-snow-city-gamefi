import React, { useEffect } from 'react';

interface RouteCompletionCelebrationProps {
  open: boolean;
  regionName: string;
  onClose: () => void;
  onExplore: () => void;
  isExploring?: boolean;
  onSkipRoam?: () => void;
}

const PARTICLES = Array.from({ length: 18 }, (_, index) => index);

export const RouteCompletionCelebration: React.FC<RouteCompletionCelebrationProps> = ({
  open,
  regionName,
  onClose,
  onExplore,
  isExploring = false,
  onSkipRoam,
}) => {
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(onClose, 5200);
    return () => window.clearTimeout(timeout);
  }, [open]);

  if (!open) return null;

  return (
    <div className="route-celebration fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <div className="route-celebration__aurora" aria-hidden="true" />
      <div className="route-celebration__particles" aria-hidden="true">
        {PARTICLES.map((particle) => (
          <span key={particle} style={{ '--particle-index': particle } as React.CSSProperties}>✦</span>
        ))}
      </div>
      <section
        className="route-celebration__card relative w-full max-w-md rounded-3xl px-6 py-8 text-center text-white sm:px-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="route-celebration-title"
        aria-describedby="route-celebration-description"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-100/70 bg-cyan-200/20 text-3xl text-cyan-100 shadow-[0_0_36px_rgba(103,232,249,0.65)]" aria-hidden="true">✦</div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-100/80">路线已点亮 · 城市权限更新</p>
        <h2 id="route-celebration-title" className="mt-3 text-2xl font-bold tracking-tight">晨曦路线完成</h2>
        <p id="route-celebration-description" className="mt-3 text-sm leading-7 text-slate-200">你点亮了城市第一条路线。新的探索区域已解锁：<strong className="text-cyan-100">{regionName}</strong>。</p>
        {isExploring && <p className="mt-3 text-xs font-medium text-cyan-100" role="status" aria-live="polite">镜头正在前往金融区……</p>}
        <div className="mt-6 rounded-2xl border border-cyan-100/20 bg-cyan-100/[0.07] px-4 py-3 text-left text-xs text-cyan-50/80">
          <span className="mr-2 text-cyan-200">✓</span> 已获得本地演示任务奖励 · 可前往新区域继续建设
        </div>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {isExploring ? (
            onSkipRoam ? <button type="button" onClick={onSkipRoam} className="min-h-11 rounded-xl border border-cyan-100/30 px-4 py-2 text-sm text-cyan-50 transition hover:bg-cyan-100/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">跳过漫游</button> : null
          ) : (
            <>
              <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">稍后探索</button>
              <button type="button" onClick={onExplore} className="min-h-11 rounded-xl bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100">进入{regionName}</button>
            </>
          )}
        </div>
        <p className="mt-4 text-[11px] text-slate-400">庆祝提示会自动关闭；区域解锁仅记录在当前本地演示会话中。</p>
      </section>
    </div>
  );
};
