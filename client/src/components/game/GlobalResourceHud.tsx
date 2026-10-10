import React, { useEffect, useRef, useState } from 'react';
import { Droplets, Zap, Users, Package, Coins, HeartPulse, LayoutGrid, Sprout, Gem } from 'lucide-react';
import type { CoreResourceState } from './coreResourceCycle';

export type ResourceKey = 'water' | 'energy' | 'workforce' | 'goods' | 'pendingIsc' | 'wellbeing';
export type ResourceCategory = 'all' | 'basic' | 'advanced';

type ResourceDefinition = {
  key: ResourceKey;
  label: string;
  icon: React.ElementType;
  color: string;
  suffix?: string;
  lowThreshold?: number;
  rarity: 1 | 2 | 3;
};

const RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  { key: 'water', label: '水', icon: Droplets, color: 'text-cyan-200', lowThreshold: 12, rarity: 1 },
  { key: 'energy', label: '能源', icon: Zap, color: 'text-yellow-200', lowThreshold: 16, rarity: 1 },
  { key: 'workforce', label: '劳动力', icon: Users, color: 'text-sky-200', lowThreshold: 2, rarity: 1 },
  { key: 'goods', label: '物资', icon: Package, color: 'text-emerald-200', lowThreshold: 1, rarity: 2 },
  { key: 'pendingIsc', label: '待领取收入', icon: Coins, color: 'text-amber-200', rarity: 3 },
  { key: 'wellbeing', label: '宜居度', icon: HeartPulse, color: 'text-violet-200', suffix: '%', lowThreshold: 30, rarity: 1 },
];

export type ResourceSort = 'quantity' | 'rarity';

export function sortResourceDefinitions(definitions: ResourceDefinition[], state: CoreResourceState, sort: ResourceSort) {
  return [...definitions].sort((a, b) => sort === 'quantity' ? state[b.key] - state[a.key] : b.rarity - a.rarity || state[b.key] - state[a.key]);
}

const RESOURCE_CAPACITIES: Partial<Record<ResourceKey, number>> = {
  water: 100,
  energy: 100,
  workforce: 12,
  goods: 100,
  pendingIsc: 100,
  wellbeing: 100,
};

const RESOURCE_CATEGORY_DEFINITIONS = [
  { key: 'all', label: '全部资源', icon: LayoutGrid, keys: ['water', 'energy', 'workforce', 'goods', 'pendingIsc', 'wellbeing'] as ResourceKey[] },
  { key: 'basic', label: '基础资源', icon: Sprout, keys: ['water', 'energy', 'workforce', 'wellbeing'] as ResourceKey[] },
  { key: 'advanced', label: '高级材料', icon: Gem, keys: ['goods', 'pendingIsc'] as ResourceKey[] },
] as const satisfies ReadonlyArray<{ key: ResourceCategory; label: string; icon: React.ElementType; keys: ResourceKey[] }>;

export function isResourceLow(value: number, lowThreshold?: number) {
  return value < 0 || (lowThreshold !== undefined && value <= lowThreshold);
}

export type ResourceDepletionForecast = {
  netDrainPerCycle: number;
  cyclesRemaining: number | null;
  status: 'depleting' | 'depleted';
};

export function getResourceDepletionForecast(current: number, history: ResourceTrendPoint[], key: ResourceKey): ResourceDepletionForecast | null {
  const points = history.slice(-8).map((point) => point.values[key]).filter((value): value is { produced: number; consumed: number } => Boolean(value));
  if (points.length === 0) return null;
  const netDrainPerCycle = points.reduce((total, point) => total + Math.max(0, point.consumed - point.produced), 0) / points.length;
  if (netDrainPerCycle <= 0) return null;
  return { netDrainPerCycle, cyclesRemaining: current > 0 ? current / netDrainPerCycle : null, status: current <= 0 ? 'depleted' : 'depleting' };
}

export function formatDepletionTime(forecast: ResourceDepletionForecast) {
  if (forecast.status === 'depleted') return '已耗尽';
  const cycles = forecast.cyclesRemaining ?? 0;
  if (cycles < 1) return '不足 1 轮';
  if (cycles < 60) return `约 ${Math.ceil(cycles)} 轮`;
  const hours = Math.floor(cycles / 60);
  const minutes = Math.ceil(cycles % 60);
  return `约 ${hours} 小时 ${minutes} 分钟`;
}

export function getCrisisActionLabel(key: ResourceKey) {
  if (key === 'water' || key === 'energy') return '停机生产区以节能';
  if (key === 'workforce' || key === 'goods') return '停机商业中心以节流';
  return null;
}

export function getActiveResourceCrisisKeys(state: CoreResourceState, history: ResourceTrendPoint[]): ResourceKey[] {
  const operationalKeys: ResourceKey[] = ['water', 'energy', 'workforce', 'goods'];
  const latest = history.at(-1);
  return operationalKeys.filter((key) => {
    const latestPoint = latest?.values[key];
    return state[key] <= 0 || Boolean(latestPoint && latestPoint.consumed > latestPoint.produced);
  });
}

export function getSevereResourceCrisisKeys(state: CoreResourceState, history: ResourceTrendPoint[]): ResourceKey[] {
  const operationalKeys: ResourceKey[] = ['water', 'energy', 'workforce', 'goods'];
  const latest = history.at(-1);
  return operationalKeys.filter((key) => {
    const latestPoint = latest?.values[key];
    if (!latestPoint) return false;
    return latestPoint.consumed > 0 && (latestPoint.produced === 0 || latestPoint.consumed >= latestPoint.produced * 2);
  });
}

export function useRollingNumber(target: number, duration = 520) {
  const [displayValue, setDisplayValue] = useState(target);
  const previousValue = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = previousValue.current;
    const delta = target - start;
    if (delta === 0) return;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + delta * eased));
      if (progress < 1) frameRef.current = window.requestAnimationFrame(tick);
      else {
        previousValue.current = target;
        frameRef.current = null;
      }
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [duration, target]);

  return displayValue;
}

const AnimatedResourceValue: React.FC<{ value: number; suffix?: string }> = ({ value, suffix }) => {
  const animatedValue = useRollingNumber(value);
  return <span data-testid="rolling-resource-value" className="resource-number-roll tabular-nums">{animatedValue.toLocaleString()}{suffix ?? ''}</span>;
};

export type GlobalResourceHudProps = {
  state: CoreResourceState;
  history?: ResourceTrendPoint[];
  onCrisisAction?: (key: ResourceKey) => void;
  initiallyCollapsed?: boolean;
};

export type ResourceTrendPoint = {
  cycle: number;
  values: Partial<Record<ResourceKey, { produced: number; consumed: number }>>;
  sourceContributions?: Partial<Record<string, Partial<Record<ResourceKey, { produced: number; consumed: number }>>>>;
};

const HISTORY_RETENTION_SIZE = 120;
export type ResourceHistorySpan = '10m' | '1h' | 'all';

export function getResourceHistoryBySpan(history: ResourceTrendPoint[], span: ResourceHistorySpan): ResourceTrendPoint[] {
  const retained = history.slice(-HISTORY_RETENTION_SIZE);
  if (span === 'all' || retained.length === 0) return retained;
  const latestCycle = retained[retained.length - 1].cycle;
  const cycleWindow = span === '10m' ? 10 : 60;
  return retained.filter((point) => point.cycle >= latestCycle - cycleWindow);
}
const SOURCE_DEFINITIONS = [
  { key: 'all', label: '全部来源' },
  { key: 'residence', label: '住宅区' },
  { key: 'production', label: '生产区' },
  { key: 'commercial', label: '商业中心' },
  { key: 'public-service', label: '公共服务' },
] as const;

export function buildTrendPath(values: number[], width = 220, height = 72, padding = 8) {
  if (values.length === 0) return '';
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  return values.map((value, index) => {
    const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

const TrendPopover: React.FC<{ definition: ResourceDefinition; history: ResourceTrendPoint[]; onClose: () => void }> = ({ definition, history, onClose }) => {
  const points = history.slice(-8);
  const produced = points.map((point) => point.values[definition.key]?.produced ?? 0);
  const consumed = points.map((point) => point.values[definition.key]?.consumed ?? 0);
  const latest = points.at(-1)?.values[definition.key] ?? { produced: 0, consumed: 0 };
  return (
    <div role="dialog" aria-label={`${definition.label}近期趋势`} className="resource-trend-popover absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-64 -translate-x-1/2 rounded-xl border border-cyan-200/35 bg-slate-950/98 p-3 text-left text-slate-100 shadow-2xl shadow-cyan-950/50 backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div><p className="text-xs font-semibold text-cyan-100">{definition.label} · 近期趋势</p><p className="mt-0.5 text-[10px] text-slate-400">最近 {points.length} 轮产出与消耗</p></div>
        <button type="button" aria-label="关闭趋势" onClick={onClose} className="text-slate-400 hover:text-white">×</button>
      </div>
      <svg viewBox="0 0 220 72" className="mt-2 h-[72px] w-full overflow-visible" role="img" aria-label={`${definition.label}产出与消耗折线图`}>
        <path d="M 8 64 L 212 64" stroke="rgb(148 163 184 / 0.22)" strokeWidth="1" />
        <path d={buildTrendPath(produced)} fill="none" stroke="rgb(52 211 153)" strokeWidth="2" strokeLinecap="round" />
        <path d={buildTrendPath(consumed)} fill="none" stroke="rgb(248 113 113)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px]"><span className="text-emerald-300">● 产出 {latest.produced}</span><span className="text-red-300">● 消耗 {latest.consumed}</span></div>
    </div>
  );
};

const HistoricalTrendPanel: React.FC<{ resourceKey: ResourceKey; sourceKey: string; history: ResourceTrendPoint[]; timeSpan: ResourceHistorySpan; onSelect: (key: ResourceKey) => void; onSourceSelect: (key: string) => void; onTimeSpanSelect: (span: ResourceHistorySpan) => void }> = ({ resourceKey, sourceKey, history, timeSpan, onSelect, onSourceSelect, onTimeSpanSelect }) => {
  const definition = RESOURCE_DEFINITIONS.find((item) => item.key === resourceKey) ?? RESOURCE_DEFINITIONS[0];
  const points = getResourceHistoryBySpan(history, timeSpan);
  const getMetric = (point: ResourceTrendPoint) => sourceKey === 'all'
    ? point.values[definition.key] ?? { produced: 0, consumed: 0 }
    : point.sourceContributions?.[sourceKey]?.[definition.key] ?? { produced: 0, consumed: 0 };
  const produced = points.map((point) => getMetric(point).produced);
  const consumed = points.map((point) => getMetric(point).consumed);
  const latest = getMetric(points.at(-1) ?? { cycle: 0, values: {} });
  const sourceLabel = SOURCE_DEFINITIONS.find((item) => item.key === sourceKey)?.label ?? '全部来源';
  return (
    <div data-testid="resource-history-trend-panel" role="region" aria-label="资源历史趋势" className="resource-history-trend-panel mt-2 rounded-xl border border-cyan-200/20 bg-slate-900/75 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-cyan-50">历史趋势 · {definition.label}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{sourceLabel} · 最近 {points.length} 轮产出与消耗</p>
        </div>
        <div className="flex max-w-[62%] flex-wrap justify-end gap-1" aria-label="选择趋势资源">
          {RESOURCE_DEFINITIONS.map((item) => (
            <button key={item.key} type="button" aria-pressed={item.key === resourceKey} onClick={() => onSelect(item.key)} className={`resource-history-selector ${item.key === resourceKey ? 'resource-history-selector--active' : ''}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto border-t border-white/10 pt-2" aria-label="筛选生产建筑或区域">
        <span className="shrink-0 text-[10px] text-slate-500">来源</span>
        {SOURCE_DEFINITIONS.map((source) => <button key={source.key} type="button" aria-pressed={source.key === sourceKey} onClick={() => onSourceSelect(source.key)} className={`resource-history-selector ${source.key === sourceKey ? 'resource-history-selector--active' : ''}`}>{source.label}</button>)}
      </div>
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto" aria-label="筛选时间跨度">
        <span className="shrink-0 text-[10px] text-slate-500">时间</span>
        {([{ key: '10m', label: '最近 10 分钟' }, { key: '1h', label: '最近 1 小时' }, { key: 'all', label: '全部历史' }] as const).map((span) => <button key={span.key} type="button" aria-pressed={span.key === timeSpan} onClick={() => onTimeSpanSelect(span.key)} className={`resource-history-selector ${span.key === timeSpan ? 'resource-history-selector--active' : ''}`}>{span.label}</button>)}
      </div>
      {points.length > 0 ? (
        <>
          <svg data-testid="resource-history-line-chart" viewBox="0 0 360 112" className="mt-2 h-28 w-full" role="img" aria-label={`${definition.label}历史产出与消耗折线图`}>
            <path d="M 12 100 H 348" stroke="rgb(148 163 184 / 0.22)" strokeWidth="1" />
            <path d="M 12 12 V 100" stroke="rgb(148 163 184 / 0.16)" strokeWidth="1" />
            <path d={buildTrendPath(produced, 360, 112, 12)} fill="none" stroke="rgb(52 211 153)" strokeWidth="2.5" strokeLinecap="round" />
            <path d={buildTrendPath(consumed, 360, 112, 12)} fill="none" stroke="rgb(248 113 113)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 4" />
            {points.map((point, index) => <text key={point.cycle} x={12 + (index / Math.max(1, points.length - 1)) * 336} y="110" textAnchor="middle" className="fill-slate-500 text-[8px]">{point.cycle}</text>)}
          </svg>
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-emerald-300">● 产出 {latest.produced}</span>
            <span className="text-red-300">● 消耗 {latest.consumed}</span>
            <span className="text-slate-400">第 {points[0].cycle}–{points.at(-1)?.cycle} 轮</span>
          </div>
        </>
      ) : <p className="py-5 text-center text-xs text-slate-500">运行资源循环后，这里会显示历史趋势。</p>}
    </div>
  );
};

export const GlobalResourceHud: React.FC<GlobalResourceHudProps> = ({ state, history = [], onCrisisAction, initiallyCollapsed = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(!initiallyCollapsed);
  const [resourceCategory, setResourceCategory] = useState<ResourceCategory>('all');
  const [resourceSort, setResourceSort] = useState<ResourceSort>('quantity');
  const previousStateRef = useRef<CoreResourceState | null>(null);
  const [newResourceCategories, setNewResourceCategories] = useState<Partial<Record<ResourceCategory, boolean>>>({});
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [hoveredKey, setHoveredKey] = useState<ResourceKey | null>(null);
  const [pinnedKey, setPinnedKey] = useState<ResourceKey | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyResourceKey, setHistoryResourceKey] = useState<ResourceKey>('water');
  const [historySourceKey, setHistorySourceKey] = useState('all');
  const [historyTimeSpan, setHistoryTimeSpan] = useState<ResourceHistorySpan>('10m');
  const openKey = pinnedKey ?? hoveredKey;
  useEffect(() => {
    const previous = previousStateRef.current;
    if (previous) {
      const gainedCategories = RESOURCE_CATEGORY_DEFINITIONS.filter((category) => category.keys.some((key) => state[key] > previous[key])).map((category) => category.key);
      if (gainedCategories.length > 0) {
        setNewResourceCategories((current) => ({ ...current, ...Object.fromEntries(gainedCategories.map((key) => [key, true])) }));
      }
    }
    previousStateRef.current = state;
  }, [state]);
  const getCapacityCount = (category: (typeof RESOURCE_CATEGORY_DEFINITIONS)[number]) => category.keys.filter((key) => RESOURCE_CAPACITIES[key] !== undefined && state[key] >= RESOURCE_CAPACITIES[key]!).length;
  const selectResourceCategory = (category: ResourceCategory) => {
    setResourceCategory(category);
    setNewResourceCategories((current) => ({ ...current, [category]: false }));
    if (category === 'all') setNewResourceCategories({});
  };
  const visibleResourceDefinitions = sortResourceDefinitions(RESOURCE_DEFINITIONS.filter((definition) => RESOURCE_CATEGORY_DEFINITIONS.find((category) => category.key === resourceCategory)?.keys.includes(definition.key)), state, resourceSort);
  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    setSidebarOpen(deltaX > 0);
  };
  return (
  <section data-testid="global-resource-hud" aria-label="全局资源统计" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className={`resource-hud-sidebar ${sidebarOpen ? 'resource-hud-sidebar--open' : 'resource-hud-sidebar--collapsed'}`}>
    <button type="button" data-testid="resource-hud-sidebar-toggle" aria-label={sidebarOpen ? '收起资源面板' : '展开资源面板'} aria-expanded={sidebarOpen} aria-controls="resource-hud-sidebar-content" onClick={() => setSidebarOpen((open) => !open)} className="resource-hud-sidebar__toggle">
      <span aria-hidden="true">{sidebarOpen ? '‹' : '›'}</span>
    </button>
    <div id="resource-hud-sidebar-content" className="resource-hud-sidebar__content">
      <div className="mb-1 flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">
        <span>城市资源中枢</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-200/80">实时同步 · 第 {state.cycle} 轮</span>
          <button type="button" data-testid="resource-history-toggle" aria-expanded={historyPanelOpen} onClick={() => setHistoryPanelOpen((open) => !open)} className="resource-history-toggle">
            {historyPanelOpen ? '收起历史' : '历史趋势'}
          </button>
        </div>
      </div>
      <div className="resource-category-tabs" role="tablist" aria-label="资源分类">
        {RESOURCE_CATEGORY_DEFINITIONS.map((category) => (
          <button key={category.key} type="button" role="tab" aria-selected={category.key === resourceCategory} onClick={() => selectResourceCategory(category.key)} className={`resource-category-tab ${category.key === resourceCategory ? 'resource-category-tab--active' : ''}`}>
            <category.icon className="resource-category-tab__icon" aria-hidden="true" />
            <span>{category.label}</span>
            {getCapacityCount(category) > 0 ? <span className="resource-category-tab__badge" aria-label={`${category.label}有${getCapacityCount(category)}项资源达到存储上限`}>{getCapacityCount(category)}</span> : newResourceCategories[category.key] ? <span className="resource-category-tab__dot" aria-label={`${category.label}有新资源`} /> : null}
          </button>
        ))}
      </div>
      <div className="resource-sort-controls" role="group" aria-label="资源排序">
        <span>排序</span>
        <button type="button" aria-pressed={resourceSort === 'quantity'} onClick={() => setResourceSort('quantity')} className={`resource-sort-control ${resourceSort === 'quantity' ? 'resource-sort-control--active' : ''}`}>数量 ↓</button>
        <button type="button" aria-pressed={resourceSort === 'rarity'} onClick={() => setResourceSort('rarity')} className={`resource-sort-control ${resourceSort === 'rarity' ? 'resource-sort-control--active' : ''}`}>稀有度</button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
      {visibleResourceDefinitions.map((definition) => {
        const { key, label, icon: Icon, color, suffix, lowThreshold } = definition;
        const isLow = isResourceLow(state[key], lowThreshold);
        const depletionForecast = getResourceDepletionForecast(state[key], history, key);
        const crisisActionLabel = depletionForecast?.status === 'depleting' ? getCrisisActionLabel(key) : null;
        return (
        <div key={key} data-testid={`global-resource-${key}`} data-resource-status={isLow ? 'low' : 'normal'} role="button" tabIndex={0} onMouseEnter={() => setHoveredKey(key)} onMouseLeave={() => { if (pinnedKey !== key) setHoveredKey(null); }} onClick={() => setPinnedKey(pinnedKey === key ? null : key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setPinnedKey(pinnedKey === key ? null : key); } }} className={`group relative min-w-0 cursor-pointer rounded-xl border bg-white/[0.04] px-2 py-1.5 transition-colors hover:border-cyan-200/40 hover:bg-cyan-300/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isLow ? 'resource-low-warning border-red-400/80 bg-red-950/35' : 'border-white/10'}`}>
          <div className={`flex items-center gap-1 text-[10px] ${isLow ? 'text-red-200' : color}`}><Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{label}</span>{isLow && <span className="ml-auto" aria-hidden="true">!</span>}</div>
          <p className={`mt-0.5 text-sm font-bold ${isLow ? 'text-red-100' : 'text-white'}`} aria-label={isLow ? `${label}资源不足，当前${state[key]}${suffix ?? ''}` : undefined}><AnimatedResourceValue value={state[key]} suffix={suffix} /></p>
          {isLow && <p className="mt-0.5 text-[9px] font-semibold text-red-200/90">资源不足</p>}
          {depletionForecast && <p data-testid={`resource-depletion-forecast-${key}`} className={`resource-depletion-forecast ${depletionForecast.status === 'depleted' ? 'resource-depletion-forecast--depleted' : ''}`} aria-label={`${label}${depletionForecast.status === 'depleted' ? '已耗尽' : `预计耗尽时间${formatDepletionTime(depletionForecast)}`}`}><span aria-hidden="true">⌛</span>{depletionForecast.status === 'depleted' ? '已耗尽' : `预计耗尽：${formatDepletionTime(depletionForecast)}`}</p>}
          {crisisActionLabel && onCrisisAction && <button type="button" data-testid={`resource-crisis-action-${key}`} className="resource-crisis-action" onClick={(event) => { event.stopPropagation(); onCrisisAction(key); }}>{crisisActionLabel}</button>}
          {openKey === key && history.length > 0 && <TrendPopover definition={definition} history={history} onClose={() => setPinnedKey(null)} />}
        </div>
        );
      })}
      </div>
      {historyPanelOpen && <HistoricalTrendPanel resourceKey={historyResourceKey} sourceKey={historySourceKey} history={history} timeSpan={historyTimeSpan} onSelect={setHistoryResourceKey} onSourceSelect={setHistorySourceKey} onTimeSpanSelect={setHistoryTimeSpan} />}
    </div>
  </section>
  );
};

export default GlobalResourceHud;
