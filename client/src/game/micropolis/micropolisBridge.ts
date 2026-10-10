import initModule from './micropolisengine.js';

type EngineModule = any;
type EngineCity = any;

let modulePromise: Promise<EngineModule> | null = null;

export function loadMicropolisModule(): Promise<EngineModule> {
  if (!modulePromise) {
    modulePromise = (initModule as any)({
      locateFile: (file: string) => `/micropolis/${file}`,
      print: () => undefined,
      printErr: (message: string) => console.warn('[MicropolisCore]', message),
    });
  }
  return modulePromise!;
}

export type MicropolisTool = 'query' | 'bulldoze' | 'road' | 'rail' | 'residential' | 'commercial' | 'industrial' | 'park' | 'police' | 'fire' | 'coal';
export const ROAD_UPGRADE_COST = 1500;

export const MICROPOLIS_TOOLS: Array<{ id: MicropolisTool; label: string; cost: number }> = [
  { id: 'road', label: '道路', cost: 10 }, { id: 'residential', label: '住宅区', cost: 100 },
  { id: 'commercial', label: '商业区', cost: 100 }, { id: 'industrial', label: '工业区', cost: 100 },
  { id: 'park', label: '公园', cost: 10 }, { id: 'police', label: '警察局', cost: 500 },
  { id: 'fire', label: '消防局', cost: 500 }, { id: 'coal', label: '燃煤电厂', cost: 3000 },
  { id: 'bulldoze', label: '推土机', cost: 1 },
];

const TOOL_ENUM: Record<MicropolisTool, string> = {
  query: 'TOOL_QUERY', bulldoze: 'TOOL_BULLDOZER', road: 'TOOL_ROAD', rail: 'TOOL_RAILROAD',
  residential: 'TOOL_RESIDENTIAL', commercial: 'TOOL_COMMERCIAL', industrial: 'TOOL_INDUSTRIAL',
  park: 'TOOL_PARK', police: 'TOOL_POLICESTATION', fire: 'TOOL_FIRESTATION', coal: 'TOOL_COALPOWER',
};

export interface MicropolisSnapshot { funds: number; population: number; year: number; month: number; roads: number; residential: number; commercial: number; industrial: number; pollution: number; score: number; }
export interface MicropolisSession {
  engine: EngineModule; city: EngineCity; mapData: Uint16Array; mopData: Uint16Array; width: number; height: number;
  snapshot(): MicropolisSnapshot; injectFunds(amount: number): MicropolisSnapshot; spendFunds(amount: number): MicropolisSnapshot | false; applyTool(tool: MicropolisTool, x: number, y: number): { ok: boolean; message: string }; tick(): void; dispose(): void;
}

function mapViews(engine: EngineModule, city: EngineCity): { mapData: Uint16Array; mopData: Uint16Array } {
  let heap: Uint16Array | undefined;
  try { heap = engine.HEAPU16; } catch { /* Emscripten getter may not be ready */ }
  if (!heap && engine.wasmMemory?.buffer) heap = new Uint16Array(engine.wasmMemory.buffer);
  if (!heap) throw new Error('WASM heap is unavailable');
  const mapStart = city.getMapAddress() / 2;
  const mopStart = city.getMopAddress() / 2;
  return {
    mapData: heap.subarray(mapStart, mapStart + city.getMapSize() / 2),
    mopData: heap.subarray(mopStart, mopStart + city.getMopSize() / 2),
  };
}

export async function createMicropolisSession(): Promise<MicropolisSession> {
  const engine = await loadMicropolisModule();
  let stage = 'construct';
  try {
    const city = new engine.Micropolis();
    stage = 'callback-disabled';
    // The React scene polls snapshots and does not consume Micropolis callbacks.
    // Avoid constructing the Embind JSCallback bridge: on mobile WebKit builds of
    // this runtime, setCallback can enter a stale wasm heap and throw OOB during init.
    stage = 'views-before-init';
    mapViews(engine, city);
    stage = 'init';
    city.init();
    stage = 'load-city';
    city.loadCity('/cities/haight.cty');
    stage = 'refresh-views';
    let views = mapViews(engine, city);
    stage = 'set-funds';
    city.setFunds(100000);
    city.setPasses(1);
    city.simPaused = false;
    city.enableDisasters = false;

    const session: MicropolisSession = {
      engine, city, mapData: views.mapData, mopData: views.mopData,
      width: engine.WORLD_W ?? 120, height: engine.WORLD_H ?? 100,
      snapshot() {
        return {
          funds: Math.max(0, Math.round(city.totalFunds ?? 0)), population: Math.max(0, Math.round(city.cityPop ?? city.totalPop ?? 0)),
          year: Math.round(city.cityYear ?? 1900), month: Math.round(city.cityMonth ?? 0), roads: Math.max(0, Math.round(city.roadTotal ?? 0)),
          residential: Math.max(0, Math.round(city.resPop ?? 0)), commercial: Math.max(0, Math.round(city.comPop ?? 0)), industrial: Math.max(0, Math.round(city.indPop ?? 0)),
          pollution: Math.max(0, Math.round(city.pollutionAverage ?? 0)), score: Math.round(city.cityScore ?? 0),
        };
      },
      injectFunds(amount) {
        const safeAmount = Math.max(0, Math.floor(amount));
        if (safeAmount > 0) city.setFunds(Math.max(0, Math.round(city.totalFunds ?? 0)) + safeAmount);
        return this.snapshot();
      },
      spendFunds(amount) {
        const safeAmount = Math.max(0, Math.floor(amount));
        const currentFunds = Math.max(0, Math.round(city.totalFunds ?? 0));
        if (safeAmount <= 0 || currentFunds < safeAmount) return false;
        city.setFunds(currentFunds - safeAmount);
        return this.snapshot();
      },
      applyTool(tool, x, y) {
        const enumValue = engine.EditingTool?.[TOOL_ENUM[tool]];
        if (!enumValue) return { ok: false, message: '建造工具暂不可用' };
        const result = city.doTool(enumValue, Math.floor(x), Math.floor(y));
        const value = typeof result === 'number' ? result : result?.value;
        const noMoney = value === engine.ToolResult?.TOOLRESULT_NO_MONEY?.value;
        const failed = noMoney || value === engine.ToolResult?.TOOLRESULT_FAILED?.value || value === engine.ToolResult?.TOOLRESULT_NEED_BULLDOZE?.value;
        if (failed) return { ok: false, message: noMoney ? '资金不足' : '这里暂时无法建造' };
        return { ok: true, message: `${MICROPOLIS_TOOLS.find((item) => item.id === tool)?.label ?? '建筑'}已放置` };
      },
      tick() {
        city.simTick(); city.animateTiles(); views = mapViews(engine, city); session.mapData = views.mapData; session.mopData = views.mopData;
      },
      dispose() { try { city.delete?.(); } catch { /* embind cleanup */ } },
    };
    return session;
  } catch (error) {
    throw new Error(`MicropolisCore ${stage}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
