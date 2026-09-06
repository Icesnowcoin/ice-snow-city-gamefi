import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building, BUILDING_CONFIGS } from '../types/GameObjectTypes';

interface LandmarkDetailsPanelProps {
  building: Building | null;
  onClose: () => void;
  onAction?: (action: string, building: Building) => void;
}

const ACTIONS_BY_TYPE: Partial<Record<Building['buildingType'], string[]>> = {
  city_core: ['开始主线任务', '查看城市总览'],
  bank: ['打开银行服务', '查看 ISC 账户'],
  commercial_center: ['进入鸿运商都', '查看交易市场'],
  residential_service: ['管理房产', '查看住宅服务'],
  production_hub: ['查看生产队列', '管理建设项目'],
  quest_hall: ['领取任务', '查看城市事件'],
  guild_hall: ['进入同心会馆', '查看组队服务'],
  logistics_terminal: ['查看物流状态', '管理仓储运输'],
};

export const LandmarkDetailsPanel: React.FC<LandmarkDetailsPanelProps> = ({ building, onClose, onAction }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = () => {
    if (isClosing) return;
    const reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsClosing(true);
    if (reducedMotion) {
      onClose();
      return;
    }
    closeTimerRef.current = window.setTimeout(onClose, 220);
  };

  useEffect(() => {
    if (!building) return;
    setIsClosing(false);
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [building?.id]);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);

  const actions = useMemo(() => building ? ACTIONS_BY_TYPE[building.buildingType] ?? ['查看地标信息'] : [], [building]);
  if (!building || !building.id.startsWith('landmark-')) return null;

  const config = BUILDING_CONFIGS[building.buildingType];
  const coords = `${Math.round(building.position.x)}, ${Math.round(building.position.z)}`;

  return (
    <section
      data-testid="landmark-details-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="landmark-details-title"
      data-state={isClosing ? 'closing' : 'open'}
      className="landmark-details-panel absolute bottom-4 right-4 z-30 w-[min(23rem,calc(100%-2rem))] rounded-2xl p-4 text-white backdrop-blur-xl"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">城市地标 / 可用设施</p>
          <h2 id="landmark-details-title" className="mt-1 text-lg font-bold text-white">{config.icon} {building.name}</h2>
          <p className="mt-1 text-xs text-slate-400">{config.description}</p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="关闭地标详情"
          onClick={requestClose}
          className="rounded-lg px-2 py-1 text-lg leading-none text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          ×
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-y border-white/10 py-3 text-xs">
        <div><dt className="text-slate-500">功能类型</dt><dd className="mt-0.5 text-cyan-100">{building.buildingType}</dd></div>
        <div><dt className="text-slate-500">地图坐标</dt><dd className="mt-0.5 text-cyan-100">{coords}</dd></div>
        <div><dt className="text-slate-500">当前健康度</dt><dd className="mt-0.5 text-cyan-100">{building.state.health}%</dd></div>
        <div><dt className="text-slate-500">服务容量</dt><dd className="mt-0.5 text-cyan-100">{building.state.capacity.toLocaleString()}</dd></div>
        <div><dt className="text-slate-500">繁荣/生产</dt><dd className="mt-0.5 text-cyan-100">{building.state.productivity}%</dd></div>
        <div><dt className="text-slate-500">维护成本</dt><dd className="mt-0.5 text-cyan-100">{building.maintenanceCost.toLocaleString()} ISC</dd></div>
      </dl>

      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold text-slate-300">可用操作</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onAction?.(action, building)}
              className="min-h-10 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-left text-xs font-semibold text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-300/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-[11px] leading-5 text-slate-400" role="note">
        当前为测试阶段地标面板。操作仅打开模拟功能提示，不会签名、支付 Gas 或提交真实链上交易。
      </p>
    </section>
  );
};

export default LandmarkDetailsPanel;
