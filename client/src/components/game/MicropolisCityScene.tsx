import { useCallback, useEffect, useRef, useState } from 'react';
import { MICROPOLIS_TOOLS, createMicropolisSession, type MicropolisSession, type MicropolisSnapshot, type MicropolisTool } from '@/game/micropolis/micropolisBridge';

const TILE_SIZE = 16;
const TILE_MASK = 0x03ff;
const DEFAULT_ZOOM = 2.5;

type Viewport = { x: number; y: number; zoom: number };
type Point = { x: number; y: number };

function drawCity(canvas: HTMLCanvasElement, session: MicropolisSession, viewport: Viewport, atlas: HTMLImageElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
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
  for (let dx = 0; dx < cols; dx += 1) {
    for (let dy = 0; dy < rows; dy += 1) {
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
}

function formatNumber(value: number) { return new Intl.NumberFormat('zh-CN').format(value); }

export default function MicropolisCityScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<MicropolisSession | null>(null);
  const atlasRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ id: number; start: Point; last: Point; moved: boolean } | null>(null);
  const [session, setSession] = useState<MicropolisSession | null>(null);
  const [snapshot, setSnapshot] = useState<MicropolisSnapshot | null>(null);
  const [tool, setTool] = useState<MicropolisTool>('road');
  const [viewport, setViewport] = useState<Viewport>({ x: 60, y: 50, zoom: DEFAULT_ZOOM });
  const [feedback, setFeedback] = useState('正在加载真实城市模拟核心…');
  const [paused, setPaused] = useState(false);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const active = sessionRef.current;
    const atlas = atlasRef.current;
    if (canvas && active && atlas?.complete) drawCity(canvas, active, viewport, atlas);
  }, [viewport]);

  useEffect(() => {
    let disposed = false;
    const atlas = new Image();
    atlas.src = '/micropolis/snow.png';
    atlasRef.current = atlas;
    createMicropolisSession().then((created) => {
      if (disposed) { created.dispose(); return; }
      sessionRef.current = created;
      setSession(created);
      setSnapshot(created.snapshot());
      setFeedback('城市已启动：选择左侧工具，在网格上点击建设。');
      atlas.onload = repaint;
      repaint();
    }).catch((error) => setFeedback(`模拟核心加载失败：${error instanceof Error ? error.message : '未知错误'}`));
    return () => { disposed = true; if (frameRef.current) cancelAnimationFrame(frameRef.current); sessionRef.current?.dispose(); sessionRef.current = null; };
  }, [repaint]);

  useEffect(() => {
    const tick = () => {
      const active = sessionRef.current;
      if (active && !paused) {
        active.tick();
        setSnapshot(active.snapshot());
      }
      repaint();
      frameRef.current = window.setTimeout(() => requestAnimationFrame(tick), 900);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) { window.clearTimeout(frameRef.current); cancelAnimationFrame(frameRef.current); } };
  }, [paused, repaint]);

  useEffect(() => {
    const onResize = () => repaint();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [repaint]);

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
    if (gesture.moved) {
      setViewport((current) => ({ ...current, x: Math.max(8, Math.min(112, current.x - dx / (TILE_SIZE * current.zoom))), y: Math.max(8, Math.min(92, current.y - dy / (TILE_SIZE * current.zoom))) }));
      gesture.last = { x: event.clientX, y: event.clientY };
    }
  };
  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const gesture = pointerRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    if (!gesture.moved) {
      const tile = tileAt(event.clientX, event.clientY);
      const active = sessionRef.current;
      if (tile && active) {
        const result = active.applyTool(tool, tile.x, tile.y);
        setFeedback(result.message);
        setSnapshot(active.snapshot());
        repaint();
      }
    }
    pointerRef.current = null;
  };

  return <section className="isc-micropolis-city" aria-label="MicropolisCore 网格城市模拟">
    <div className="isc-micropolis-city__topbar">
      <div><span className="isc-micropolis-city__eyebrow">真实网格模拟 · MicropolisCore</span><h1>冰雪城市建设局</h1></div>
      <button type="button" className="isc-micropolis-city__pause" onClick={() => setPaused((value) => !value)}>{paused ? '继续模拟' : '暂停模拟'}</button>
    </div>
    <div className="isc-micropolis-city__stats" aria-live="polite">
      <span>资金 <b>${formatNumber(snapshot?.funds ?? 0)}</b></span><span>人口 <b>{formatNumber(snapshot?.population ?? 0)}</b></span><span>道路 <b>{formatNumber(snapshot?.roads ?? 0)}</b></span><span>年份 <b>{snapshot?.year ?? '—'}</b></span><span>污染 <b>{snapshot?.pollution ?? 0}</b></span>
    </div>
    <div className="isc-micropolis-city__map-wrap"><canvas ref={canvasRef} className="isc-micropolis-city__canvas" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { pointerRef.current = null; }} aria-label="可拖拽的城市网格地图" /><div className="isc-micropolis-city__hint">单指拖拽移动地图 · 点按网格建设</div></div>
    <div className="isc-micropolis-city__toolbar" role="toolbar" aria-label="城市建设工具">
      {MICROPOLIS_TOOLS.map((item) => <button key={item.id} type="button" className={tool === item.id ? 'is-active' : ''} onClick={() => setTool(item.id)} aria-pressed={tool === item.id}><strong>{item.label}</strong><small>${item.cost}</small></button>)}
    </div>
    <div className="isc-micropolis-city__feedback" role="status">{feedback}</div>
  </section>;
}
