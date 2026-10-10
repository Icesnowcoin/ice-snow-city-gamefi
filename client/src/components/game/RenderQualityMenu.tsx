import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Gauge, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  RENDER_QUALITY_CHANGE_EVENT,
  RENDER_QUALITY_PRESETS,
  RENDER_FPS_UPDATE_EVENT,
  getPreferredRenderQuality,
  presetForProfile,
  setPreferredRenderQuality,
  type RenderQualityPreset,
} from '@/game/rendering/renderQuality';
import { getPerformanceTone } from '@/lib/babylonPerformanceMetrics';

type QualityChangeEvent = CustomEvent<{ profile?: 'low' | 'medium' | 'high' }>;
type FpsUpdateEvent = CustomEvent<{ fps?: number }>;

export const RenderQualityMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<RenderQualityPreset>(() => presetForProfile(getPreferredRenderQuality()));
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    const handleQualityChange = (event: Event) => {
      const profile = (event as QualityChangeEvent).detail?.profile;
      if (profile) setPreset(presetForProfile(profile));
    };
    window.addEventListener(RENDER_QUALITY_CHANGE_EVENT, handleQualityChange);
    const handleFpsUpdate = (event: Event) => {
      const nextFps = (event as FpsUpdateEvent).detail?.fps;
      setFps(typeof nextFps === 'number' && Number.isFinite(nextFps) ? nextFps : null);
    };
    window.addEventListener(RENDER_FPS_UPDATE_EVENT, handleFpsUpdate);
    return () => {
      window.removeEventListener(RENDER_QUALITY_CHANGE_EVENT, handleQualityChange);
      window.removeEventListener(RENDER_FPS_UPDATE_EVENT, handleFpsUpdate);
    };
  }, []);

  const active = RENDER_QUALITY_PRESETS[preset];
  const fpsTone = fps === null ? undefined : getPerformanceTone(fps);
  const fpsToneClass = fpsTone === 'good' ? 'text-emerald-300 border-emerald-300/30 bg-emerald-300/10' : fpsTone === 'warn' ? 'text-amber-300 border-amber-300/30 bg-amber-300/10' : fpsTone === 'bad' ? 'text-rose-300 border-rose-300/30 bg-rose-300/10' : 'text-slate-400 border-white/10 bg-white/5';
  const selectPreset = (nextPreset: RenderQualityPreset) => {
    setPreset(nextPreset);
    setPreferredRenderQuality(RENDER_QUALITY_PRESETS[nextPreset].profile);
    setOpen(false);
  };

  return (
    <div className="relative" data-testid="render-quality-menu">
      <div className="flex items-center gap-1.5">
        <div
          data-testid="realtime-fps-indicator"
          aria-label={`实时帧率：${fps === null ? '等待采样' : `${fps.toFixed(1)} FPS`}`}
          title="实时 Babylon.js 渲染帧率"
          className={`flex h-8 items-center gap-1 rounded-lg border px-2 text-[10px] font-semibold tabular-nums ${fpsToneClass}`}
        >
          <span className="hidden sm:inline text-[9px] font-normal uppercase tracking-wider opacity-75">FPS</span>
          <span>{fps === null ? '—' : fps.toFixed(1)}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`画质设置：${active.label}`}
          className="gap-1.5 text-cyan-100 hover:bg-cyan-300/10 hover:text-white"
        >
          <Gauge className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{active.label}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </Button>
      </div>
      {open && (
        <div
          role="menu"
          aria-label="画质设置选项"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-cyan-200/25 bg-slate-950/95 p-2 text-slate-100 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl"
        >
          <div className="mb-1 flex items-center gap-2 px-2.5 py-2">
            <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-cyan-50">场景画质</p>
              <p className="text-[10px] text-slate-400">切换后立即应用到 Babylon 渲染管线</p>
            </div>
          </div>
          <div className={`mb-2 rounded-xl border px-2.5 py-2 ${fpsToneClass}`} data-testid="menu-fps-summary">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.14em] opacity-75">实时帧率</span>
              <span className="font-mono text-sm font-bold">{fps === null ? '等待采样' : `${fps.toFixed(1)} FPS`}</span>
            </div>
            <p className="mt-1 text-[10px] opacity-75">建议保持 30 FPS 以上；低于阈值可切换基础画质。</p>
          </div>
          {(Object.keys(RENDER_QUALITY_PRESETS) as RenderQualityPreset[]).map((key) => {
            const option = RENDER_QUALITY_PRESETS[key];
            const selected = key === preset;
            return (
              <button
                key={key}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => selectPreset(key)}
                className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${selected ? 'bg-cyan-300/15 text-cyan-50' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
              >
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-cyan-300 bg-cyan-300/20' : 'border-slate-600'}`}>
                  {selected && <Check className="h-3.5 w-3.5 text-cyan-200" aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">{option.detail}</span>
                </span>
              </button>
            );
          })}
          <p className="mt-1 border-t border-white/10 px-2.5 pt-2 text-[10px] leading-4 text-amber-200/75">
            高保真资产仍受资产验收门禁约束；此选项只切换渲染质量，不伪造资产状态。
          </p>
        </div>
      )}
    </div>
  );
};

export default RenderQualityMenu;
