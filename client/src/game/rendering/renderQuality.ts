import type { IceSnowRenderQuality } from './IceSnowRenderingProfile';

export const RENDER_QUALITY_STORAGE_KEY = 'ice-snow-city-render-quality';
export const RENDER_QUALITY_CHANGE_EVENT = 'ice-snow-city:render-quality-change';
export const RENDER_FPS_UPDATE_EVENT = 'ice-snow-city:render-fps-update';

export type RenderQualityPreset = 'baseline' | 'high-fidelity';

export const RENDER_QUALITY_PRESETS: Record<RenderQualityPreset, {
  profile: IceSnowRenderQuality;
  label: string;
  detail: string;
}> = {
  baseline: { profile: 'medium', label: '基础画质', detail: '移动端稳定帧率与平衡光照' },
  'high-fidelity': { profile: 'high', label: '高保真画质', detail: '更高阴影、雪层与环境光质量' },
};

export function getPreferredRenderQuality(): IceSnowRenderQuality {
  if (typeof window === 'undefined') return 'medium';
  const value = window.localStorage.getItem(RENDER_QUALITY_STORAGE_KEY);
  return value === 'high' ? 'high' : value === 'low' ? 'low' : 'medium';
}

export function presetForProfile(profile: IceSnowRenderQuality): RenderQualityPreset {
  return profile === 'high' ? 'high-fidelity' : 'baseline';
}

export function setPreferredRenderQuality(profile: IceSnowRenderQuality): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RENDER_QUALITY_STORAGE_KEY, profile);
  window.dispatchEvent(new CustomEvent(RENDER_QUALITY_CHANGE_EVENT, { detail: { profile } }));
}
