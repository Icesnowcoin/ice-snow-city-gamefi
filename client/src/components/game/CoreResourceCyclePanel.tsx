import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Factory, Home, Landmark, ShieldCheck, Droplets, Zap, Users, Package, Coins, Play, ArrowDownToLine, ArrowUpCircle, Power, ArrowRight, CircleAlert, CheckCircle2, PauseCircle } from 'lucide-react';
import { getCoreBuildingLevel, getCoreBuildingUpgradeCost, isCoreBuildingActive, type CoreBuildingId, type CoreBuildingLevels, type CoreBuildingOperatingState, type CoreCycleEvent, type CoreResourceState, type CoreUpgradeCost } from './coreResourceCycle';

export type CoreResourceCyclePanelProps = {
  state: CoreResourceState;
  lastEvents: CoreCycleEvent[];
  onRunCycle: () => void;
  onCollect: () => void;
  buildingLevels?: CoreBuildingLevels;
  onUpgradeBuilding?: (id: CoreBuildingId) => void;
  operatingState?: CoreBuildingOperatingState;
  onToggleBuilding?: (id: CoreBuildingId) => void;
};

const buildings = [
  { id: 'residence', name: '瑞景住宅区', role: '提供劳动力', icon: Home, tone: 'border-sky-300/30 text-sky-100' },
  { id: 'production', name: '丰盈生产园', role: '水电 → 城市物资', icon: Factory, tone: 'border-emerald-300/30 text-emerald-100' },
  { id: 'commercial', name: '鸿运商业中心', role: '物资 → ISC', icon: Landmark, tone: 'border-amber-300/30 text-amber-100' },
  { id: 'public-service', name: '城市公共服务站', role: '维护宜居度', icon: ShieldCheck, tone: 'border-violet-300/30 text-violet-100' },
];

export type CoreBuildingTooltipData = {
  efficiency: number;
  consumption: string;
  status: string;
};

export function formatUpgradeCost(cost: CoreUpgradeCost) {
  return Object.entries(cost).map(([key, value]) => `${key === 'water' ? '水' : key === 'energy' ? '能源' : key === 'workforce' ? '劳动力' : '物资'} ${value}`).join(' · ');
}

export function getCoreBuildingVisualClass(level: number) {
  return `core-building-level-${Math.max(1, Math.min(3, level))}`;
}

export type ProductionBuildingStatus = 'running' | 'ready' | 'blocked' | 'shutdown';

export const PRODUCTION_CYCLE_SECONDS = 60;

export function getProductionRatePerSecond(amountPerCycle: number, isRunning: boolean) {
  return isRunning ? amountPerCycle / PRODUCTION_CYCLE_SECONDS : 0;
}

export function formatPerSecondRate(value: number) {
  return `${value.toFixed(2)}/秒`;
}

export function isSevereRateDeficit(consumedPerCycle: number, producedPerCycle: number) {
  return consumedPerCycle > 0 && (producedPerCycle === 0 || consumedPerCycle >= producedPerCycle * 2);
}

export function getProductionBuildingStatus(state: CoreResourceState, active: boolean, lastEvents: CoreCycleEvent[]): ProductionBuildingStatus {
  if (!active) return 'shutdown';
  if (lastEvents.some((event) => event.message.includes('生产区完成一轮制造'))) return 'running';
  return state.water >= 4 && state.energy >= 6 && state.workforce >= 2 ? 'ready' : 'blocked';
}

export function getProductionReadiness(state: CoreResourceState, active: boolean) {
  if (!active) return 0;
  return Math.round(Math.min(1, state.water / 4, state.energy / 6, state.workforce / 2) * 100);
}

export function getCoreBuildingTooltipData(id: string, state: CoreResourceState, level = 1): CoreBuildingTooltipData {
  if (id === 'residence') return { efficiency: Math.round((state.workforce / 12) * 100 * (1 + (level - 1) * 0.15)), consumption: '无直接消耗', status: state.workforce >= 12 ? '劳动力储备充足' : '正在恢复劳动力' };
  if (id === 'production') {
    const efficiency = Math.round(Math.min(1, state.water / 4, state.energy / 6, state.workforce / 2) * 100) * (1 + (level - 1) * 0.15);
    return { efficiency, consumption: '水 4 · 能源 6 · 劳动力 2 /轮', status: efficiency >= 100 ? '生产线可运行' : '等待生产资源' };
  }
  if (id === 'commercial') {
    const efficiency = Math.round(Math.min(1, state.goods / 2, state.workforce) * 100) * (1 + (level - 1) * 0.15);
    return { efficiency, consumption: '物资 2 · 劳动力 1 /轮', status: efficiency >= 100 ? '订单可成交' : '等待物资或劳动力' };
  }
  const efficiency = Math.round(Math.min(1, state.energy / 2, state.goods) * 100) * (1 + (level - 1) * 0.15);
  return { efficiency, consumption: '能源 2 · 物资 1 /轮', status: efficiency >= 100 ? '公共服务正常' : '维护资源不足' };
}

const productionStatusCopy: Record<ProductionBuildingStatus, { label: string; detail: string; className: string }> = {
  running: { label: '生产中', detail: '本轮制造已完成，物资已进入城市库存。', className: 'production-status--running' },
  ready: { label: '待命 · 可运行', detail: '输入资源充足，点击“运行一轮生产”开始制造。', className: 'production-status--ready' },
  blocked: { label: '等待资源', detail: '至少一种输入资源不足，生产线暂不消耗资源。', className: 'production-status--blocked' },
  shutdown: { label: '已停机', detail: '生产线已暂停，重新启用后才会参与资源循环。', className: 'production-status--shutdown' },
};

const ProductionBuildingStatusView: React.FC<{ state: CoreResourceState; active: boolean; lastEvents: CoreCycleEvent[]; level: number }> = ({ state, active, lastEvents, level }) => {
  const status = getProductionBuildingStatus(state, active, lastEvents);
  const readiness = getProductionReadiness(state, active);
  const copy = productionStatusCopy[status];
  const output = 5 + (level - 1) * 2;
  const isRunning = status === 'running';
  return (
    <section data-testid="production-building-status" data-production-status={status} className={`production-status-panel ${copy.className}`} aria-label={`生产建筑状态：${copy.label}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2"><span className="production-status-icon" aria-hidden="true">{status === 'running' ? <CheckCircle2 /> : status === 'shutdown' ? <PauseCircle /> : status === 'blocked' ? <CircleAlert /> : <Factory />}</span><div><p className="text-xs font-semibold text-emerald-50">生产线 · {copy.label}</p><p className="mt-0.5 text-[10px] text-slate-400">{copy.detail}</p></div></div><span className="rounded-full border border-white/15 px-2 py-1 text-[10px] font-bold">Lv.{level} · 产出 {output} 物资/轮</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5" aria-label="生产资源流：水、能源、劳动力转化为物资"><ResourceInput icon={<Droplets />} label="水" value={state.water} required={4} actualPerCycle={isRunning ? 4 : 0} /><ResourceInput icon={<Zap />} label="能源" value={state.energy} required={6} actualPerCycle={isRunning ? 6 : 0} /><ResourceInput icon={<Users />} label="劳动力" value={state.workforce} required={2} actualPerCycle={isRunning ? 2 : 0} /><ArrowRight className="production-flow-arrow" aria-hidden="true" /><div className="production-output-node production-rate-anchor" tabIndex={0}><Package aria-hidden="true" /><span>＋{output} 物资/轮</span><RateTooltip label="物资" direction="产出" consumedPerCycle={0} producedPerCycle={isRunning ? output : 0} requiredPerCycle={output} /></div></div>
      <div className="mt-3"><div className="flex items-center justify-between text-[10px] text-slate-400"><span>本轮生产准备度</span><span className="font-bold text-emerald-200">{readiness}%</span></div><div className="production-readiness-track mt-1" role="progressbar" aria-label="生产准备度" aria-valuenow={readiness} aria-valuemin={0} aria-valuemax={100}><div className="production-readiness-bar" style={{ width: `${readiness}%` }} /></div></div>
    </section>
  );
};

const ResourceInput: React.FC<{ icon: React.ReactNode; label: string; value: number; required: number; actualPerCycle: number }> = ({ icon, label, value, required, actualPerCycle }) => <div className={`production-input-node production-rate-anchor ${value < required ? 'is-insufficient' : ''}`} tabIndex={0}><span className="production-input-icon">{icon}</span><span>{label}</span><strong>{value}/{required}</strong><RateTooltip label={label} direction="消耗" consumedPerCycle={actualPerCycle} producedPerCycle={0} requiredPerCycle={required} /></div>;

const RateTooltip: React.FC<{ label: string; direction: '消耗' | '产出'; consumedPerCycle: number; producedPerCycle: number; requiredPerCycle: number }> = ({ label, direction, consumedPerCycle, producedPerCycle, requiredPerCycle }) => {
  const isDeficit = consumedPerCycle > producedPerCycle;
  const isSevereDeficit = isSevereRateDeficit(consumedPerCycle, producedPerCycle);
  const isActive = consumedPerCycle > 0 || producedPerCycle > 0;
  return <span role="tooltip" aria-label={`${label}资源速率详情`} className={`production-rate-tooltip ${isDeficit ? 'production-rate-tooltip--deficit' : 'production-rate-tooltip--balanced'} ${isSevereDeficit ? 'production-rate-tooltip--severe' : ''}`}><span className="font-semibold text-cyan-100">{label} · {direction}速率</span><span className={isDeficit ? 'production-rate-deficit-text' : ''}>实际消耗：{formatPerSecondRate(getProductionRatePerSecond(consumedPerCycle, isActive))}</span><span className={isDeficit ? 'production-rate-deficit-text' : 'production-rate-output-text'}>实际产出：{formatPerSecondRate(getProductionRatePerSecond(producedPerCycle, isActive))}</span><span>每轮：消耗 {consumedPerCycle} · 产出 {producedPerCycle} · 需求 {formatPerSecondRate(requiredPerCycle / PRODUCTION_CYCLE_SECONDS)}</span>{isDeficit && <strong className="production-rate-deficit-text">{isSevereDeficit ? '严重赤字 · 消耗至少为产出的两倍' : '消耗高于产出 · 资源赤字'}</strong>}<span className="text-slate-400">按 60 秒生产周期折算</span></span>;
};

function ProductionFeedback({ state, lastEvents }: Pick<CoreResourceCyclePanelProps, 'state' | 'lastEvents'>) {
  const producedGoods = lastEvents.some((event) => event.message.includes('获得 5 单位城市物资'));
  const tradedIncome = lastEvents.find((event) => event.message.includes('ISC 待领取'))?.message.match(/新增 (\d+) ISC 待领取/)?.[1];
  const maintainedCity = lastEvents.some((event) => event.message.includes('宜居度提升'));
  const upgraded = lastEvents.some((event) => event.message.includes('升级成功'));
  if (!producedGoods && !tradedIncome && !maintainedCity && !upgraded) return null;

  return (
    <div key={`cycle-feedback-${state.cycle}`} data-testid="core-production-feedback" className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center" aria-live="polite">
      <div className={`${upgraded ? 'core-upgrade-success' : 'core-production-feedback'} relative mt-1 rounded-full border ${upgraded ? 'border-violet-200/80 bg-violet-950/90 text-violet-100 shadow-[0_0_24px_rgba(167,139,250,0.65)]' : 'border-emerald-200/60 bg-emerald-950/85 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.45)]'} px-3 py-1.5 text-xs font-bold`}>
        {upgraded && <span>✦ 建筑升级成功 · 产出效率 ＋15%</span>}
        {producedGoods && <span>＋5 物资</span>}
        {tradedIncome && <span className="ml-2 text-amber-200">＋{tradedIncome} ISC</span>}
        {maintainedCity && <span className="ml-2 text-violet-200">宜居度 ＋2</span>}
        <span className="core-production-particles" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
      </div>
    </div>
  );
}

export const CoreResourceCyclePanel: React.FC<CoreResourceCyclePanelProps> = ({ state, lastEvents, onRunCycle, onCollect, buildingLevels = {}, onUpgradeBuilding, operatingState = {}, onToggleBuilding }) => {
  const productionLevel = getCoreBuildingLevel('production', buildingLevels);
  const productionActive = isCoreBuildingActive('production', operatingState);
  return (
  <Card data-testid="core-resource-cycle" className="relative border-cyan-300/25 bg-slate-950/90 p-4 text-slate-100 shadow-2xl shadow-cyan-950/25 backdrop-blur-md">
    <ProductionFeedback state={state} lastEvents={lastEvents} />
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">城市运营</p><h2 className="mt-1 text-base font-bold text-cyan-50">核心建筑资源循环</h2><p className="mt-1 max-w-xl text-xs text-slate-400">住宅 → 生产 → 商业 → 公共服务，运行一轮即可看到完整资源转换。</p></div><span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-[11px] text-cyan-100">第 {state.cycle} 轮</span></div>
    <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
      {buildings.map(({ id, name, role, icon: Icon, tone }) => {
        const buildingId = id as CoreBuildingId;
        const level = getCoreBuildingLevel(buildingId, buildingLevels);
        const upgradeCost = getCoreBuildingUpgradeCost(buildingId, level);
        const tooltip = getCoreBuildingTooltipData(id, state, level);
        const visualClass = getCoreBuildingVisualClass(level);
        const active = isCoreBuildingActive(buildingId, operatingState);
        return <div key={name} data-testid={`core-building-card-${id}`} data-building-level={level} data-building-active={active} tabIndex={0} aria-describedby={`core-building-tooltip-${id}`} className={`group relative rounded-xl border bg-white/[0.03] p-3 outline-none transition-[background-color,border-color,box-shadow,filter,transform] duration-200 hover:-translate-y-0.5 hover:border-cyan-200/90 hover:bg-cyan-300/[0.09] hover:shadow-[0_0_0_1px_rgba(103,232,249,0.35),0_0_24px_rgba(34,211,238,0.2)] focus-visible:-translate-y-0.5 focus-visible:border-cyan-200/90 focus-visible:bg-cyan-300/[0.09] focus-visible:shadow-[0_0_0_1px_rgba(103,232,249,0.35),0_0_24px_rgba(34,211,238,0.2)] focus-visible:ring-2 focus-visible:ring-cyan-300 ${visualClass} ${tone} ${active ? '' : 'core-building-shutdown'}`}>
          <span className="core-building-level-aura" aria-hidden="true" /><span className="core-building-level-badge">Lv.{level}</span><span className={`core-building-power-status ${active ? 'is-active' : 'is-shutdown'}`}><Power className="h-2.5 w-2.5" />{active ? '启用' : '停机'}</span><Icon className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(103,232,249,0.9)] group-focus:scale-110 group-focus:drop-shadow-[0_0_6px_rgba(103,232,249,0.9)]" aria-hidden="true" /><p className="mt-2 text-xs font-semibold">{name}</p><p className="mt-1 text-[11px] text-slate-400">{role}</p>
          <div id={`core-building-tooltip-${id}`} role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 w-60 -translate-x-1/2 translate-y-1 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus:pointer-events-auto group-focus:translate-y-0 group-focus:opacity-100"><div className="rounded-xl border border-cyan-200/30 bg-slate-950/95 p-3 text-left text-xs text-slate-100 shadow-2xl shadow-cyan-950/40 backdrop-blur-md"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-cyan-100">{name} · 运行详情</p><span className="rounded-full border border-cyan-300/30 px-1.5 py-0.5 text-[10px] text-cyan-100">Lv.{level}</span></div><div className="mt-2 flex items-center justify-between"><span className="text-slate-400">生产效率</span><span className="font-bold text-emerald-200">{tooltip.efficiency}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${tooltip.efficiency}%` }} /></div><p className="mt-2 text-slate-400">消耗速率：<span className="text-slate-200">{tooltip.consumption}</span></p><p className="mt-1 text-slate-400">状态：<span className={active ? 'text-cyan-100' : 'text-slate-300'}>{active ? tooltip.status : '已停机，资源循环已暂停'}</span></p><Button type="button" data-testid={`toggle-core-building-${id}`} disabled={!onToggleBuilding} onClick={(event) => { event.stopPropagation(); onToggleBuilding?.(buildingId); }} variant="outline" className={`mt-3 h-8 w-full px-2 text-[11px] ${active ? 'border-slate-400/50 text-slate-200 hover:bg-slate-300/10' : 'border-emerald-300/50 text-emerald-100 hover:bg-emerald-300/10'}`}><Power className="mr-1.5 h-3.5 w-3.5" />{active ? '停机以节省能耗' : '重新启用建筑'}</Button><Button type="button" data-testid={`upgrade-core-building-${id}`} disabled={!upgradeCost || !onUpgradeBuilding} onClick={(event) => { event.stopPropagation(); onUpgradeBuilding?.(buildingId); }} className="mt-3 h-8 w-full bg-violet-500/90 px-2 text-[11px] text-white hover:bg-violet-400 disabled:opacity-50"><ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />{upgradeCost ? `建筑升级 · ${formatUpgradeCost(upgradeCost)}` : '已达最高等级'}</Button></div></div>
        </div>;
      })}
    </div>
    <ProductionBuildingStatusView state={state} active={productionActive} lastEvents={lastEvents} level={productionLevel} />
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6"><Metric icon={<Droplets className="h-3.5 w-3.5 text-cyan-300" />} label="水" value={state.water} /><Metric icon={<Zap className="h-3.5 w-3.5 text-yellow-300" />} label="能源" value={state.energy} /><Metric icon={<Users className="h-3.5 w-3.5 text-sky-300" />} label="劳动力" value={state.workforce} /><Metric icon={<Package className="h-3.5 w-3.5 text-emerald-300" />} label="物资" value={state.goods} /><Metric icon={<Coins className="h-3.5 w-3.5 text-amber-300" />} label="待领取 ISC" value={state.pendingIsc} /><Metric icon={<Coins className="h-3.5 w-3.5 text-yellow-200" />} label="已领取 ISC" value={state.collectedIsc} /></div>
    <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">城市宜居度</span><span className="font-semibold text-violet-200">{state.wellbeing}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-[width] duration-500" style={{ width: `${state.wellbeing}%` }} /></div>
    <div className="mt-4 flex flex-wrap gap-2"><Button type="button" data-testid="run-core-cycle" onClick={onRunCycle} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Play className="mr-1.5 h-3.5 w-3.5" />运行一轮生产</Button><Button type="button" data-testid="collect-core-isc" onClick={onCollect} disabled={state.pendingIsc <= 0} variant="outline" className="border-amber-300/40 text-amber-100 hover:bg-amber-300/10 disabled:opacity-40"><ArrowDownToLine className="mr-1.5 h-3.5 w-3.5" />领取 {state.pendingIsc} ISC</Button></div>
    {lastEvents.length > 0 && <div className="mt-3 space-y-1" aria-live="polite">{lastEvents.map((event, index) => <p key={`${event.message}-${index}`} className={`text-[11px] ${event.kind === 'success' ? 'text-emerald-200' : 'text-amber-200'}`}>{event.kind === 'success' ? '✓' : '!' } {event.message}</p>)}</div>}
  </Card>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2"><div className="flex items-center gap-1.5 text-[11px] text-slate-400">{icon}{label}</div><p className="mt-1 text-lg font-bold text-slate-100">{value}</p></div>;

export default CoreResourceCyclePanel;
