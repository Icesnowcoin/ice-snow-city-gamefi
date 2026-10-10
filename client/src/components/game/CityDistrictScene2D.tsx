import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CITY_DISTRICTS, DISTRICT_BY_ID, type DistrictId } from './cityDistrictScenes';
import { getCoreBuildingLevel, isCoreBuildingActive, type CoreBuildingId, type CoreBuildingLevels, type CoreBuildingOperatingState, type CoreResourceState } from './coreResourceCycle';
import { CITY_SUPPLY_STEPS, getCitySupplyProgress } from './citySupplyObjective';
import { GAME_TIME_UNITS_PER_DAY } from './dailyFinance';

export const COMMERCIAL_STREET_ART = { day: DISTRICT_BY_ID.commercial.baseImage } as const;
export const COMMERCIAL_STREET_SHOPS = DISTRICT_BY_ID.commercial.hotspots;
export type StreetPosition = { x: number; y: number };

/** Perspective narrows the walkable pavement towards the far end of the street. */
export function clampStreetPosition(position: StreetPosition): StreetPosition {
  const y = Math.max(58, Math.min(88, position.y));
  const halfWidth = 9 + (y - 58) * 0.43;
  const x = Math.max(50 - halfWidth, Math.min(50 + halfWidth, position.x));
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export function streetPositionFromPointer(bounds: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, clientX: number, clientY: number): StreetPosition | null {
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  return clampStreetPosition({ x: (clientX - bounds.left) / bounds.width * 100, y: (clientY - bounds.top) / bounds.height * 100 });
}

export type StreetViewOffset = { x: number; y: number };
export function clampStreetViewOffset(offset: StreetViewOffset): StreetViewOffset {
  return { x: Math.max(-7, Math.min(7, Math.round(offset.x * 10) / 10)), y: Math.max(-4, Math.min(4, Math.round(offset.y * 10) / 10)) };
}

const SNOW_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: (index * 37 + 9) % 100,
  delay: (index * 0.43) % 4,
  duration: 4.8 + (index % 5) * 0.55,
  size: 2 + (index % 3),
}));

const CITY_BUILDINGS: readonly { id: CoreBuildingId; name: string; output: string; input: string }[] = [
  { id: 'residence', name: '瑞景住宅区', output: '劳动力 +3', input: '维护：低' },
  { id: 'production', name: '丰盈生产园', output: '物资 +5', input: '水 -4 · 电 -6' },
  { id: 'commercial', name: '鸿运商都', output: 'ISC +1', input: '物资 -2 · 劳动力 -1' },
  { id: 'public-service', name: '公共服务站', output: '宜居度 +2', input: '电 -2 · 物资 -1' },
];

/** GameHub stores one simulated hour as 100 ticks. Between phases we blend a single base image. */
export function getStreetLighting(gameTime: number): { night: number; label: string } {
  const minutes = (((gameTime % GAME_TIME_UNITS_PER_DAY) + GAME_TIME_UNITS_PER_DAY) % GAME_TIME_UNITS_PER_DAY) * 1440 / GAME_TIME_UNITS_PER_DAY;
  const dawn = (minutes - 300) / 150;
  const dusk = (minutes - 990) / 150;
  const night = minutes < 300 ? 1 : minutes < 450 ? 1 - dawn : minutes < 990 ? 0 : minutes < 1140 ? dusk : 1;
  return { night, label: minutes < 300 || minutes >= 1140 ? '夜间' : minutes < 450 ? '清晨' : minutes < 990 ? '白昼' : '黄昏' };
}

type Gesture = { pointerId: number; x: number; y: number; moved: boolean; startPan: StreetViewOffset };

export default function CityDistrictScene2D({ gameTime = 900, initialDistrict = 'commercial', resources, buildingLevels, operatingState, onRunCycle, onDistrictChange, onResupply, onToggleBuilding, onUpgradeBuilding, lastCycleEvents = [], visits, onVisit, resupplyCount = 0, supplyObjectiveCompleted = false }: {
  gameTime?: number; initialDistrict?: DistrictId; resources?: CoreResourceState; buildingLevels?: CoreBuildingLevels; operatingState?: CoreBuildingOperatingState; onRunCycle?: () => void; onDistrictChange?: (id: DistrictId) => void; onResupply?: () => void; onToggleBuilding?: (id: CoreBuildingId) => void; onUpgradeBuilding?: (id: CoreBuildingId) => void;
  lastCycleEvents?: readonly { kind: 'success' | 'warning'; message: string }[];
  visits?: readonly string[]; onVisit?: (id: string) => void; resupplyCount?: number; supplyObjectiveCompleted?: boolean;
}) {
  const lighting = getStreetLighting(gameTime);
  const [districtId, setDistrictId] = useState<DistrictId>(initialDistrict);
  const district = DISTRICT_BY_ID[districtId];
  const [player, setPlayer] = useState<StreetPosition>({ x: 50, y: 79 });
  const [viewOffset, setViewOffset] = useState<StreetViewOffset>({ x: 0, y: 0 });
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [localVisits, setLocalVisits] = useState<string[]>([]);
  const [objectiveOpen, setObjectiveOpen] = useState(false);
  const gestureRef = useRef<Gesture | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const currentVisits = visits ?? localVisits;
  const selectedShop = district.hotspots.find((shop) => shop.id === selectedShopId);
  const objective = getCitySupplyProgress(currentVisits, resources?.cycle ?? 0, resupplyCount);

  const move = (dx: number, dy: number) => setPlayer((position) => clampStreetPosition({ x: position.x + dx, y: position.y + dy }));
  const stopHolding = () => {
    if (holdTimeoutRef.current !== null) window.clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current !== null) window.clearInterval(holdIntervalRef.current);
    holdTimeoutRef.current = null;
    holdIntervalRef.current = null;
  };
  const startHolding = (event: ReactPointerEvent<HTMLButtonElement>, dx: number, dy: number) => {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    stopHolding();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    move(dx, dy);
    holdTimeoutRef.current = window.setTimeout(() => {
      holdTimeoutRef.current = null;
      holdIntervalRef.current = window.setInterval(() => move(dx, dy), 95);
    }, 230);
  };
  const keyPressMove = (event: React.MouseEvent<HTMLButtonElement>, dx: number, dy: number) => {
    // Pointer input already moved on pointerdown. Keyboard-generated click has detail=0.
    if (event.detail === 0) move(dx, dy);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName ?? '')) return;
      const movements: Record<string, [number, number]> = { ArrowUp: [0, -2.6], w: [0, -2.6], W: [0, -2.6], ArrowDown: [0, 2.6], s: [0, 2.6], S: [0, 2.6], ArrowLeft: [-2.6, 0], a: [-2.6, 0], A: [-2.6, 0], ArrowRight: [2.6, 0], d: [2.6, 0], D: [2.6, 0] };
      const delta = movements[event.key];
      if (!delta) return;
      event.preventDefault();
      move(...delta);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', stopHolding);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('blur', stopHolding); stopHolding(); gestureRef.current = null; };
  }, []);

  const onStreetPointerDown = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    gestureRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false, startPan: viewOffset };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onStreetPointerMove = (event: ReactPointerEvent<HTMLImageElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (!gesture.moved && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 7) return;
    gesture.moved = true;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width > 0 && bounds.height > 0) setViewOffset(clampStreetViewOffset({ x: gesture.startPan.x + (event.clientX - gesture.x) / bounds.width * 100, y: gesture.startPan.y + (event.clientY - gesture.y) / bounds.height * 100 }));
  };
  const onStreetPointerUp = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (gestureRef.current?.pointerId !== event.pointerId) return;
    if (!gestureRef.current.moved) {
      const target = streetPositionFromPointer(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
      if (target) setPlayer(target);
    }
    gestureRef.current = null;
  };

  return (
    <section className="isc-commercial-street" data-testid="city-district-scene" aria-label={`可游玩的${district.title} 2.5D 场景`}>
      <div className="isc-commercial-street__world" data-testid="street-view-world" style={{ ['--view-pan-x' as string]: `${viewOffset.x}%`, ['--view-pan-y' as string]: `${viewOffset.y}%` }}>
        <div className="isc-commercial-street__depth" data-testid="street-depth-layers" aria-hidden="true">
          <div className="isc-commercial-street__depth-sky" />
          <div className="isc-commercial-street__depth-distant"><i /><i /><i /><i /><i /></div>
          <div className="isc-commercial-street__depth-lamps"><i /><i /><i /></div>
          <div className="isc-commercial-street__depth-snowbank" />
          <div className="isc-commercial-street__depth-foreground"><i /><i /><i /></div>
          <div className="isc-commercial-street__snowfall">{SNOW_PARTICLES.map((particle) => <i key={particle.id} style={{ left: `${particle.left}%`, animationDelay: `${particle.delay}s`, animationDuration: `${particle.duration}s`, width: `${particle.size}px`, height: `${particle.size}px` }} />)}</div>
        </div>
        <div className="isc-commercial-street__visual" aria-hidden="true">
          <img className="isc-commercial-street__plate" src={district.baseImage} alt="" draggable={false} onPointerDown={onStreetPointerDown} onPointerMove={onStreetPointerMove} onPointerUp={onStreetPointerUp} onPointerCancel={() => { gestureRef.current = null; }} onLostPointerCapture={() => { gestureRef.current = null; }} style={{ filter: `brightness(${1 - lighting.night * 0.43}) saturate(${1 - lighting.night * 0.16})` }} />
          <div className="isc-commercial-street__night-shade" style={{ opacity: lighting.night * 0.62 }} />
          <div className="isc-commercial-street__lamps" style={{ opacity: lighting.night }} />
          <div className="isc-commercial-street__near-shade" />
        </div>
        <div className="isc-commercial-street__hotspots" aria-label="当前区域可走访的地点">
          {district.hotspots.map((shop) => <button key={shop.id} type="button" className={`isc-commercial-street__shop ${selectedShopId === shop.id ? 'isc-commercial-street__shop--selected' : ''}`} style={{ left: `${shop.x}%`, top: `${shop.y}%`, ['--shop-depth' as string]: shop.scale }} data-testid={`district-spot-${district.id}-${shop.id}`} aria-label={`走访${shop.name}`} onClick={() => setSelectedShopId(shop.id)}><span className="isc-commercial-street__shop-marker" aria-hidden="true" /><span>{shop.name}</span></button>)}
        </div>
        <div className="isc-commercial-street__walker" data-testid="street-player" style={{ left: `${player.x}%`, top: `${player.y}%`, ['--walker-scale' as string]: 0.6 + (player.y - 58) * 0.012 }} aria-label={`玩家在${district.title}步道上`}><span className="isc-commercial-street__walker-shadow" /><span className="isc-commercial-street__walker-head" /><span className="isc-commercial-street__walker-scarf" /><span className="isc-commercial-street__walker-coat" /><span className="isc-commercial-street__walker-legs" /></div>
      </div>
      <header className="isc-commercial-street__header">
        <div><p className="isc-commercial-street__eyebrow">ICE SNOW CITY · 城市街区</p><h2>{district.title}</h2><span>{district.subtitle} · 2.5D</span></div>
        <span className="isc-commercial-street__time" data-testid="street-lighting-phase">{lighting.label} · 随游戏时间变化</span>
      </header>
      {resources && <section className="isc-city-building-strip" data-testid="city-building-strip" aria-label="城市建筑运营状态">
        {CITY_BUILDINGS.map((building) => {
          const active = isCoreBuildingActive(building.id, operatingState);
          return <article key={building.id} className={`isc-city-building-card ${active ? '' : 'isc-city-building-card--paused'}`} data-testid={`city-building-${building.id}`}>
            <span className="isc-city-building-card__status" aria-hidden="true" />
            <div><strong>{building.name}</strong><small>Lv.{getCoreBuildingLevel(building.id, buildingLevels)}</small></div>
            <span>{active ? building.output : '已停机'}</span><em>{active ? building.input : '本轮不参与循环'}</em>
            <div className="isc-city-building-card__actions"><button type="button" onClick={() => onToggleBuilding?.(building.id)} aria-label={`${active ? '停机' : '启用'}${building.name}`}>{active ? '停机' : '启用'}</button><button type="button" onClick={() => onUpgradeBuilding?.(building.id)} aria-label={`升级${building.name}`}>升级</button></div>
          </article>;
        })}
      </section>}
      {resources && <div className="isc-commercial-street__objective" data-expanded={objectiveOpen} data-testid="city-supply-objective" aria-label="城市供应任务">
        <button type="button" onClick={() => setObjectiveOpen((open) => !open)} aria-expanded={objectiveOpen} aria-label={objectiveOpen ? '收起城市供应目标' : '展开城市供应目标'}>{supplyObjectiveCompleted ? '城市供应已恢复 · 宜居度 +5' : `城市供应任务 · ${objective.count}/4`}</button>
        {objectiveOpen && !supplyObjectiveCompleted && <ul>{CITY_SUPPLY_STEPS.map((step, index) => <li key={step.id} aria-label={`${objective.done[index] ? '已完成' : '未完成'}：${step.label}`}>{objective.done[index] ? '✓' : '○'} {step.label}</li>)}</ul>}
      </div>}
      <label className="isc-commercial-street__district-nav">城市区域
        <select aria-label="选择城市区域" value={districtId} onChange={(event) => {
          const nextDistrict = event.target.value as DistrictId;
          setDistrictId(nextDistrict); onDistrictChange?.(nextDistrict);
          setPlayer({ x: 50, y: 79 }); setSelectedShopId(null); gestureRef.current = null; stopHolding();
        }}>{CITY_DISTRICTS.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select>
      </label>
      {selectedShop && <aside className="isc-commercial-street__shop-card" data-testid="street-shop-card" aria-label={`${selectedShop.name}地点详情`}><div className="isc-commercial-street__shop-card-title"><span className="isc-commercial-street__eyebrow">{selectedShop.type} · 可走访地点</span><button type="button" aria-label="关闭店铺详情" onClick={() => setSelectedShopId(null)}>×</button></div><h3>{selectedShop.name}</h3><p>{selectedShop.activity}</p><button type="button" className="isc-commercial-street__visit" onClick={() => {
        const key = `${district.id}/${selectedShop.id}`;
        if (!currentVisits.includes(key)) { setLocalVisits((current) => current.includes(key) ? current : [...current, key]); onVisit?.(key); }
      }}>{currentVisits.includes(`${district.id}/${selectedShop.id}`) ? '已到访 · 继续探索' : '走访地点'}</button></aside>}
      <div className="isc-commercial-street__bottom-hint">轻点或拖拽道路移动 · 长按方向键连续行走</div>
      {onRunCycle && resources && <div className="isc-commercial-street__economy" data-testid="district-city-loop"><div className="isc-commercial-street__economy-summary"><strong>第 {resources.cycle} 轮</strong><span>物资 {resources.goods} · 水 {resources.water} · 电 {resources.energy}</span></div>{lastCycleEvents.length > 0 && <p className={`isc-commercial-street__cycle-result isc-commercial-street__cycle-result--${lastCycleEvents[0].kind}`} data-testid="district-cycle-result">{lastCycleEvents[0].message}</p>}{onResupply && <button type="button" onClick={onResupply} aria-label="花费 1 ISC 补给水电">补给水电</button>}<button type="button" onClick={onRunCycle} aria-label="推进一次城市资源循环">运营一轮</button></div>}
      <div className="isc-commercial-street__dpad" role="group" aria-label="玩家移动控制">
        <button type="button" aria-label="向前走" onPointerDown={(event) => startHolding(event, 0, -2.6)} onPointerUp={stopHolding} onPointerCancel={stopHolding} onLostPointerCapture={stopHolding} onClick={(event) => keyPressMove(event, 0, -2.6)}>↑</button>
        <div>
          <button type="button" aria-label="向左走" onPointerDown={(event) => startHolding(event, -2.6, 0)} onPointerUp={stopHolding} onPointerCancel={stopHolding} onLostPointerCapture={stopHolding} onClick={(event) => keyPressMove(event, -2.6, 0)}>←</button>
          <button type="button" aria-label="向后走" onPointerDown={(event) => startHolding(event, 0, 2.6)} onPointerUp={stopHolding} onPointerCancel={stopHolding} onLostPointerCapture={stopHolding} onClick={(event) => keyPressMove(event, 0, 2.6)}>↓</button>
          <button type="button" aria-label="向右走" onPointerDown={(event) => startHolding(event, 2.6, 0)} onPointerUp={stopHolding} onPointerCancel={stopHolding} onLostPointerCapture={stopHolding} onClick={(event) => keyPressMove(event, 2.6, 0)}>→</button>
        </div>
      </div>
    </section>
  );
}
