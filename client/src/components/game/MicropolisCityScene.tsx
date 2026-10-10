import { useCallback, useEffect, useRef, useState } from 'react';
import { MICROPOLIS_TOOLS, ROAD_UPGRADE_COST, createMicropolisSession, type MicropolisSession, type MicropolisSnapshot, type MicropolisTool } from '@/game/micropolis/micropolisBridge';
import { getDayPhaseLabel, getNightOpacity } from './dayNight';
import { isBuildingTile, isRoadTile, shouldLightWindow } from './nightLighting';
import { getCongestionPulse, getTrafficDirection, getTrafficProgress, isCongestedRoad, shouldRenderTraffic } from './trafficLighting';

const TILE_SIZE = 16;
const TILE_MASK = 0x03ff;
const DEFAULT_ZOOM = 2.5;

type Viewport = { x: number; y: number; zoom: number };
type Point = { x: number; y: number };
type MicropolisCitySceneProps = {
  gameTime: number;
  cityFunds: number;
  iscBalance: number;
  onInjectIsc: (amount: number) => number | false;
  onFundsSnapshot: (funds: number) => void;
};

function drawCity(canvas: HTMLCanvasElement, session: MicropolisSession, viewport: Viewport, atlas: HTMLImageElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#b9d8df';
  ctx.fillRect(0, 0, width, height);
  const zoom = viewport.zoom * dpr;
  const cols = Math.ceil(width / (TILE_SIZE * zoom)) + 2;
  const rows = Math.ceil(height / (TILE_SIZE * zoom)) + 2;
  const startX = Math.floor(viewport.x - cols / 2);
  const startY = Math.floor(viewport.y - rows / 2);
  const atlasCols = Math.floor(atlas.width / TILE_SIZE);
  const maxTile = atlasCols * Math.floor(atlas.height / TILE_SIZE);
  for (let dx = 0; dx < cols; dx += 1) for (let dy = 0; dy < rows; dy += 1) {
    const tileX = startX + dx;
    const tileY = startY + dy;
    if (tileX < 0 || tileY < 0 || tileX >= session.width || tileY >= session.height) continue;
    const value = session.mapData[tileX * session.height + tileY] ?? 0;
    const tile = (value & TILE_MASK) % Math.max(1, maxTile);
    const sx = (tile % atlasCols) * TILE_SIZE;
    const sy = Math.floor(tile / atlasCols) * TILE_SIZE;
    const px = width / 2 + (tileX - viewport.x) * TILE_SIZE * zoom;
    const py = height / 2 + (tileY - viewport.y) * TILE_SIZE * zoom;
    ctx.drawImage(atlas, sx, sy, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE * zoom + 1, TILE_SIZE * zoom + 1);
  }
}

function drawNightLighting(canvas: HTMLCanvasElement, session: MicropolisSession, viewport: Viewport, intensity: number) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (intensity < 0.02) return;
  const zoom = viewport.zoom * dpr;
  const tilePixels = TILE_SIZE * zoom;
  const cols = Math.ceil(width / tilePixels) + 2;
  const rows = Math.ceil(height / tilePixels) + 2;
  const startX = Math.floor(viewport.x - cols / 2);
  const startY = Math.floor(viewport.y - rows / 2);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let dx = 0; dx < cols; dx += 1) for (let dy = 0; dy < rows; dy += 1) {
    const tileX = startX + dx;
    const tileY = startY + dy;
    if (tileX < 0 || tileY < 0 || tileX >= session.width || tileY >= session.height) continue;
    const tile = (session.mapData[tileX * session.height + tileY] ?? 0) & TILE_MASK;
    const px = width / 2 + (tileX - viewport.x) * tilePixels;
    const py = height / 2 + (tileY - viewport.y) * tilePixels;
    if (isRoadTile(tile)) {
      const glow = Math.max(2, tilePixels * .3);
      const gradient = ctx.createRadialGradient(px + tilePixels / 2, py + tilePixels / 2, 0, px + tilePixels / 2, py + tilePixels / 2, glow);
      gradient.addColorStop(0, `rgba(255, 224, 142, ${0.5 * intensity})`);
      gradient.addColorStop(1, 'rgba(255, 203, 110, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(px + tilePixels * .2, py + tilePixels * .2, tilePixels * .6, tilePixels * .6);
      ctx.fillStyle = `rgba(255, 239, 177, ${0.8 * intensity})`;
      ctx.fillRect(px + tilePixels * .43, py + tilePixels * .43, Math.max(1, tilePixels * .12), Math.max(1, tilePixels * .12));
    } else if (isBuildingTile(tile) && shouldLightWindow(tileX, tileY)) {
      ctx.fillStyle = `rgba(255, 218, 132, ${0.68 * intensity})`;
      const windowSize = Math.max(1, tilePixels * .12);
      ctx.fillRect(px + tilePixels * .28, py + tilePixels * .28, windowSize, windowSize);
      ctx.fillRect(px + tilePixels * .62, py + tilePixels * .55, windowSize, windowSize);
    }
  }
  ctx.restore();
}

function drawTrafficTrails(canvas: HTMLCanvasElement, session: MicropolisSession, viewport: Viewport, intensity: number, timeMs: number, upgradedRoads: ReadonlySet<string>) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (intensity < 0.05) return;
  const zoom = viewport.zoom * dpr;
  const tilePixels = TILE_SIZE * zoom;
  const cols = Math.ceil(width / tilePixels) + 2;
  const rows = Math.ceil(height / tilePixels) + 2;
  const startX = Math.floor(viewport.x - cols / 2);
  const startY = Math.floor(viewport.y - rows / 2);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let dx = 0; dx < cols; dx += 1) for (let dy = 0; dy < rows; dy += 1) {
    const tileX = startX + dx;
    const tileY = startY + dy;
    if (tileX < 0 || tileY < 0 || tileX >= session.width || tileY >= session.height) continue;
    const tile = (session.mapData[tileX * session.height + tileY] ?? 0) & TILE_MASK;
    if (!isRoadTile(tile) || !shouldRenderTraffic(tileX, tileY)) continue;
    const px = width / 2 + (tileX - viewport.x) * tilePixels;
    const py = height / 2 + (tileY - viewport.y) * tilePixels;
    const progress = getTrafficProgress(timeMs, tileX, tileY);
    const horizontal = getTrafficDirection(tileX, tileY) === 'horizontal';
    const congested = isCongestedRoad(session.mapData, session.height, tileX, tileY, upgradedRoads);
    const congestionPulse = congested ? getCongestionPulse(timeMs) : 1;
    const along = progress * tilePixels;
    const centerX = px + (horizontal ? along : tilePixels / 2);
    const centerY = py + (horizontal ? tilePixels / 2 : along);
    const trailLength = tilePixels * .62;
    const gradient = horizontal
      ? ctx.createLinearGradient(centerX - trailLength, centerY, centerX + tilePixels * .1, centerY)
      : ctx.createLinearGradient(centerX, centerY - trailLength, centerX, centerY + tilePixels * .1);
    const color = congested ? '255, 45, 45' : ((tileX + tileY) % 4 === 0 ? '255, 93, 76' : '255, 239, 182');
    gradient.addColorStop(0, `rgba(${color}, 0)`);
    gradient.addColorStop(.72, `rgba(${color}, ${.35 * intensity * congestionPulse})`);
    gradient.addColorStop(1, `rgba(${color}, ${.9 * intensity * congestionPulse})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(1.2, tilePixels * (congested ? .14 : .1));
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (horizontal) { ctx.moveTo(centerX - trailLength, centerY); ctx.lineTo(centerX + tilePixels * .08, centerY); }
    else { ctx.moveTo(centerX, centerY - trailLength); ctx.lineTo(centerX, centerY + tilePixels * .08); }
    ctx.stroke();
  }
  ctx.restore();
}

function formatNumber(value: number) { return new Intl.NumberFormat('zh-CN').format(value); }

export default function MicropolisCityScene({ gameTime, cityFunds, iscBalance, onInjectIsc, onFundsSnapshot }: MicropolisCitySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<MicropolisSession | null>(null);
  const atlasRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const trafficFrameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ id: number; start: Point; last: Point; moved: boolean } | null>(null);
  const fundsSnapshotRef = useRef(onFundsSnapshot);
  fundsSnapshotRef.current = onFundsSnapshot;
  const [session, setSession] = useState<MicropolisSession | null>(null);
  const [snapshot, setSnapshot] = useState<MicropolisSnapshot | null>(null);
  const [tool, setTool] = useState<MicropolisTool | 'roadUpgrade'>('road');
  const [upgradedRoads, setUpgradedRoads] = useState<Set<string>>(() => new Set());
  const [viewport, setViewport] = useState<Viewport>({ x: 60, y: 50, zoom: DEFAULT_ZOOM });
  const [feedback, setFeedback] = useState('正在加载真实城市模拟核心…');
  const [paused, setPaused] = useState(false);
  const [injectAmount, setInjectAmount] = useState(1);
  const isLoading = !session && feedback.startsWith('正在加载');
  const nightOpacity = getNightOpacity(gameTime);
  const dayPhase = getDayPhaseLabel(gameTime);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const lightingCanvas = lightingCanvasRef.current;
    const active = sessionRef.current;
    const atlas = atlasRef.current;
    if (canvas && active && atlas?.complete) drawCity(canvas, active, viewport, atlas);
    if (lightingCanvas && active) {
      drawNightLighting(lightingCanvas, active, viewport, nightOpacity);
      drawTrafficTrails(lightingCanvas, active, viewport, nightOpacity, performance.now(), upgradedRoads);
    }
  }, [nightOpacity, upgradedRoads, viewport]);

  useEffect(() => {
    let disposed = false;
    const atlas = new Image();
    atlas.src = '/micropolis/snow.png';
    atlasRef.current = atlas;
    createMicropolisSession().then((created) => {
      if (disposed) { created.dispose(); return; }
      sessionRef.current = created;
      setSession(created);
      const initialSnapshot = created.snapshot();
      setSnapshot(initialSnapshot);
      fundsSnapshotRef.current(initialSnapshot.funds);
      setFeedback('城市已启动：选择工具，在网格上点击建设。');
      atlas.onload = repaint;
      repaint();
    }).catch((error) => setFeedback(`模拟核心加载失败：${error instanceof Error ? error.message : '未知错误'}`));
    return () => { disposed = true; if (frameRef.current) cancelAnimationFrame(frameRef.current); if (trafficFrameRef.current) window.clearTimeout(trafficFrameRef.current); sessionRef.current?.dispose(); sessionRef.current = null; };
  }, [repaint]);

  useEffect(() => {
    const tick = () => {
      const active = sessionRef.current;
      if (active && !paused) {
        active.tick();
        const nextSnapshot = active.snapshot();
        setSnapshot(nextSnapshot);
        fundsSnapshotRef.current(nextSnapshot.funds);
      }
      repaint();
      frameRef.current = window.setTimeout(() => requestAnimationFrame(tick), 900);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) { window.clearTimeout(frameRef.current); cancelAnimationFrame(frameRef.current); } };
  }, [paused, repaint]);

  useEffect(() => {
    let disposed = false;
    const animateTraffic = () => {
      if (disposed) return;
      repaint();
      trafficFrameRef.current = window.setTimeout(animateTraffic, 50);
    };
    trafficFrameRef.current = window.setTimeout(animateTraffic, 50);
    return () => { disposed = true; if (trafficFrameRef.current) window.clearTimeout(trafficFrameRef.current); };
  }, [repaint]);

  useEffect(() => { const onResize = () => repaint(); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, [repaint]);

  const tileAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(viewport.x + (clientX - rect.left - rect.width / 2) / (TILE_SIZE * viewport.zoom));
    const y = Math.floor(viewport.y + (clientY - rect.top - rect.height / 2) / (TILE_SIZE * viewport.zoom));
    if (x < 0 || y < 0 || !sessionRef.current || x >= sessionRef.current.width || y >= sessionRef.current.height) return null;
    return { x, y };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, last: { x: event.clientX, y: event.clientY }, moved: false };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const gesture = pointerRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.last.x;
    const dy = event.clientY - gesture.last.y;
    if (Math.hypot(event.clientX - gesture.start.x, event.clientY - gesture.start.y) > 8) gesture.moved = true;
    if (gesture.moved) { setViewport((current) => ({ ...current, x: Math.max(8, Math.min(112, current.x - dx / (TILE_SIZE * current.zoom))), y: Math.max(8, Math.min(92, current.y - dy / (TILE_SIZE * current.zoom))) })); gesture.last = { x: event.clientX, y: event.clientY }; }
  };
  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const gesture = pointerRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    if (!gesture.moved) {
      const tile = tileAt(event.clientX, event.clientY);
      const active = sessionRef.current;
      if (tile && active) {
        if (tool === 'roadUpgrade') {
          const key = `${tile.x}:${tile.y}`;
          const tileValue = (active.mapData[tile.x * active.height + tile.y] ?? 0) & TILE_MASK;
          if (!isRoadTile(tileValue)) setFeedback('道路升级只能用于道路路段。');
          else if (upgradedRoads.has(key)) setFeedback('该路段已经升级完成。');
          else if (!isCongestedRoad(active.mapData, active.height, tile.x, tile.y, upgradedRoads)) setFeedback('该路段当前没有拥堵，无需升级。');
          else {
            const nextSnapshot = active.spendFunds(ROAD_UPGRADE_COST);
            if (nextSnapshot === false) setFeedback(`升级需要 $${formatNumber(ROAD_UPGRADE_COST)} 城市资金。`);
            else {
              setUpgradedRoads((current) => new Set(current).add(key));
              setSnapshot(nextSnapshot);
              fundsSnapshotRef.current(nextSnapshot.funds);
              setFeedback('道路已拓宽：交通拥堵正在缓解。');
            }
          }
          repaint();
          pointerRef.current = null;
          return;
        }
        const result = active.applyTool(tool, tile.x, tile.y);
        setFeedback(result.message);
        const nextSnapshot = active.snapshot();
        setSnapshot(nextSnapshot);
        fundsSnapshotRef.current(nextSnapshot.funds);
        repaint();
      }
    }
    pointerRef.current = null;
  };

  const injectCityFunds = () => {
    const funds = onInjectIsc(injectAmount);
    const active = sessionRef.current;
    if (funds !== false && active) {
      const nextSnapshot = active.injectFunds(funds);
      setSnapshot(nextSnapshot);
      fundsSnapshotRef.current(nextSnapshot.funds);
      repaint();
      setFeedback(`已将 ${injectAmount} ISC 注入城市财政。`);
    }
  };

  return <section className="isc-micropolis-city" aria-label="MicropolisCore 网格城市模拟">
    <div className="isc-micropolis-city__topbar"><div><span className="isc-micropolis-city__eyebrow">真实网格模拟 · MicropolisCore</span><h1>冰雪城市建设局</h1></div><button type="button" className="isc-micropolis-city__pause" onClick={() => setPaused((value) => !value)}>{paused ? '继续模拟' : '暂停模拟'}</button></div>
    <div className="isc-micropolis-city__stats" aria-live="polite"><span>城市资金 <b>${formatNumber(snapshot?.funds ?? cityFunds)}</b></span><span>人口 <b>{formatNumber(snapshot?.population ?? 0)}</b></span><span>道路 <b>{formatNumber(snapshot?.roads ?? 0)}</b></span><span>年份 <b>{snapshot?.year ?? '—'}</b></span><span>污染 <b>{snapshot?.pollution ?? 0}</b></span></div>
    <div className="isc-micropolis-city__economy" aria-label="ISC 与城市资金兑换"><div><strong>ISC 经济桥</strong><span>可用 {formatNumber(iscBalance)} ISC · 1 ISC = $1,000 城市资金</span></div><div className="isc-micropolis-city__economy-actions">{[1, 10, 100].map((amount) => <button key={amount} type="button" className={injectAmount === amount ? 'is-active' : ''} onClick={() => setInjectAmount(amount)} disabled={iscBalance < amount}>{amount} ISC</button>)}<button type="button" className="is-inject" onClick={injectCityFunds} disabled={!session || iscBalance < injectAmount}>注入城市</button></div></div>
    <div className="isc-micropolis-city__map-wrap"><canvas ref={canvasRef} className="isc-micropolis-city__canvas" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { pointerRef.current = null; }} aria-label="可拖拽的城市网格地图" /><canvas ref={lightingCanvasRef} className="isc-micropolis-city__lighting-canvas" style={{ opacity: nightOpacity }} aria-hidden="true" /><div className="isc-micropolis-city__day-night" style={{ opacity: nightOpacity }} aria-hidden="true" /><span className="isc-micropolis-city__phase" aria-label={`当前时段：${dayPhase}`}>{dayPhase}</span>{isLoading && <div className="isc-micropolis-city__loading" role="status" aria-live="polite"><span className="isc-micropolis-city__loading-mark" aria-hidden="true">✦</span><strong>正在铺开城市街区</strong><span>加载道路、住宅与公共设施…</span><i aria-hidden="true" /></div>}<div className="isc-micropolis-city__hint">单指拖拽移动地图 · 点按网格建设</div></div>
    <div className="isc-micropolis-city__toolbar" role="toolbar" aria-label="城市建设工具">{MICROPOLIS_TOOLS.map((item) => <button key={item.id} type="button" className={tool === item.id ? 'is-active' : ''} onClick={() => setTool(item.id)} aria-pressed={tool === item.id}><strong>{item.label}</strong><small>${item.cost}</small></button>)}<button type="button" className={tool === 'roadUpgrade' ? 'is-active isc-micropolis-city__road-upgrade' : 'isc-micropolis-city__road-upgrade'} onClick={() => setTool('roadUpgrade')} aria-pressed={tool === 'roadUpgrade'}><strong>道路升级</strong><small>${ROAD_UPGRADE_COST}</small></button></div>
    <div className="isc-micropolis-city__feedback" role="status">{feedback}</div>
  </section>;
}
