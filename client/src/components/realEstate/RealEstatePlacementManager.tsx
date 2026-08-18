import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Check,
  Coins,
  Eraser,
  Grip,
  RotateCw,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  getOccupiedCells,
  normalizeRotation,
  snapToGrid,
  validatePlacement,
  type BuildingFootprint,
  type BuildingPlacementCandidate,
  type GridPoint,
  type PlacementBounds,
  type PlacementRotation,
} from '@/lib/buildingPlacementUtils';
import { AssetCache } from '@/lib/assetCacheUtils';

export interface PlacementLandPlot {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface PlacementBuildingTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  footprint: BuildingFootprint;
  /** Optional runtime GLB URL; when provided, it is fetched through the shared asset cache. */
  modelUrl?: string;
}

export interface RealEstatePlacementManagerProps {
  landPlots: PlacementLandPlot[];
  iscBalance?: number;
  isBalanceLoading?: boolean;
  lang?: 'zh' | 'en';
  onConfirmed?: (placement: BuildingPlacementCandidate) => void;
}

const DEFAULT_BUILDINGS: PlacementBuildingTemplate[] = [
  { id: 'townhouse', name: '冬日住宅', icon: '🏠', description: '适合个人居住与社区经营', cost: 1200, footprint: { width: 3, height: 2 } },
  { id: 'boutique', name: '街角店铺', icon: '🏪', description: '面向商业街的轻资产店铺', cost: 2400, footprint: { width: 3, height: 3 } },
  { id: 'office', name: '城市办公楼', icon: '🏢', description: '为城市企业提供办公空间', cost: 4800, footprint: { width: 4, height: 3 } },
  { id: 'clinic', name: '社区诊所', icon: '🏥', description: '完善住宅区公共服务设施', cost: 3600, footprint: { width: 4, height: 3 } },
];

const STORAGE_KEY = 'ice-snow-city:building-placements:v1';
const buildingModelBinaryCache = new AssetCache<ArrayBuffer>(10 * 60 * 1000);

function loadPersistedPlacements(): BuildingPlacementCandidate[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as BuildingPlacementCandidate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function placementKey(candidate: BuildingPlacementCandidate): string {
  return `${candidate.landId}:${candidate.position.x}:${candidate.position.y}:${candidate.rotation}`;
}

export default function RealEstatePlacementManager({
  landPlots,
  iscBalance,
  isBalanceLoading = false,
  lang = 'zh',
  onConfirmed,
}: RealEstatePlacementManagerProps) {
  const [selectedLandId, setSelectedLandId] = useState(landPlots[0]?.id ?? '');
  const [selectedBuildingId, setSelectedBuildingId] = useState(DEFAULT_BUILDINGS[0].id);
  const [position, setPosition] = useState<GridPoint>({ x: 1, y: 1 });
  const [rotation, setRotation] = useState<PlacementRotation>(0);
  const [placements, setPlacements] = useState<BuildingPlacementCandidate[]>(loadPersistedPlacements);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [assetStatus, setAssetStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [assetAttempt, setAssetAttempt] = useState(0);

  const selectedLand = landPlots.find((land) => land.id === selectedLandId) ?? landPlots[0];
  const selectedBuilding = DEFAULT_BUILDINGS.find((building) => building.id === selectedBuildingId) ?? DEFAULT_BUILDINGS[0];
  const bounds: PlacementBounds = {
    width: selectedLand?.width ?? 12,
    height: selectedLand?.height ?? 8,
  };

  const candidate = useMemo<BuildingPlacementCandidate>(() => ({
    id: `preview:${selectedLandId}:${selectedBuildingId}`,
    buildingId: selectedBuilding.id,
    landId: selectedLandId,
    position: snapToGrid(position),
    footprint: selectedBuilding.footprint,
    rotation,
    cost: selectedBuilding.cost,
  }), [position, rotation, selectedBuilding, selectedLandId]);

  const existingPlacements = placements.filter((placement) => placement.landId === selectedLandId);
  const validation = useMemo(
    () => validatePlacement(candidate, placements, bounds, iscBalance),
    [bounds.height, bounds.width, candidate, iscBalance, placements],
  );
  const isPlacementValid = Boolean(selectedLandId && selectedLand && validation.valid);
  const placementFeedbackText = isPlacementValid
    ? (lang === 'zh' ? '当前位置可放置' : 'Placement location is valid')
    : validation.message;
  const occupiedPreviewCells = useMemo(
    () => new Set(getOccupiedCells(candidate.position, candidate.footprint, candidate.rotation).map((cell) => `${cell.x}:${cell.y}`)),
    [candidate],
  );
  const occupiedCells = useMemo(
    () => new Set(existingPlacements.flatMap((placement) => getOccupiedCells(placement.position, placement.footprint, placement.rotation).map((cell) => `${cell.x}:${cell.y}`))),
    [existingPlacements],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(placements));
    }
  }, [placements]);

  useEffect(() => {
    const modelUrl = selectedBuilding.modelUrl;
    if (!modelUrl) {
      setAssetStatus('idle');
      return;
    }
    const controller = new AbortController();
    setAssetStatus('loading');
    void buildingModelBinaryCache.load(
      modelUrl,
      async (signal) => {
        const response = await fetch(modelUrl, { signal });
        if (!response.ok) throw new Error(`建筑模型加载失败：${response.status}`);
        return response.arrayBuffer();
      },
      { retries: 1, retryDelayMs: 120, signal: controller.signal },
    ).then(() => {
      if (!controller.signal.aborted) setAssetStatus('ready');
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !(error instanceof DOMException && error.name === 'AbortError')) {
        setAssetStatus('error');
      }
    });
    return () => controller.abort();
  }, [assetAttempt, selectedBuilding.modelUrl]);

  useEffect(() => {
    if (!landPlots.some((land) => land.id === selectedLandId)) {
      setSelectedLandId(landPlots[0]?.id ?? '');
    }
  }, [landPlots, selectedLandId]);

  const handleGridPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / bounds.width;
    const cellHeight = rect.height / bounds.height;
    setPosition(snapToGrid({
      x: Math.floor((event.clientX - rect.left) / cellWidth),
      y: Math.floor((event.clientY - rect.top) / cellHeight),
    }));
  };

  const handleConfirm = () => {
    if (iscBalance === undefined) {
      setNotice({ type: 'error', text: lang === 'zh' ? '请先连接钱包并刷新 ISC 余额，再确认建造。' : 'Connect a wallet and refresh ISC balance before confirming.' });
      return;
    }
    if (!validation.valid) {
      setNotice({ type: 'error', text: validation.message });
      return;
    }
    if (placements.some((placement) => placementKey(placement) === placementKey(candidate))) {
      setNotice({ type: 'error', text: lang === 'zh' ? '该位置已经存在同角度建筑。' : 'A building already exists at this position and rotation.' });
      return;
    }
    setPlacements((current) => [...current, candidate]);
    onConfirmed?.(candidate);
    setNotice({ type: 'success', text: lang === 'zh' ? '建筑位置已保存到本地预览。链上建造交易将在钱包流程接入后提交。' : 'Placement saved locally. On-chain construction will be submitted when wallet flow is connected.' });
  };

  const handleClearLand = () => {
    setPlacements((current) => current.filter((placement) => placement.landId !== selectedLandId));
    setNotice({ type: 'info', text: lang === 'zh' ? '已清空当前土地的本地建筑预览。' : 'Cleared local building previews for this land.' });
  };

  const isCellPreview = (x: number, y: number) => occupiedPreviewCells.has(`${x}:${y}`);
  const isCellOccupied = (x: number, y: number) => occupiedCells.has(`${x}:${y}`);

  return (
    <Card className="overflow-hidden border-cyan-200/20 bg-slate-950/80 text-slate-100 shadow-xl">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-cyan-950/70 to-slate-950/70">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-cyan-100">
              <Building2 className="h-5 w-5 text-cyan-300" />
              {lang === 'zh' ? '房地产建设预览' : 'Real Estate Placement'}
            </CardTitle>
            <p className="mt-1 text-xs text-slate-400">
              {lang === 'zh' ? '选择土地与建筑，在 2.5D 网格中拖拽预览位置。' : 'Choose land and building, then drag the preview across the 2.5D grid.'}
            </p>
          </div>
          <Badge variant="outline" className="border-cyan-400/40 text-cyan-200">
            {existingPlacements.length} {lang === 'zh' ? '处已放置' : 'placed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-1 text-xs text-slate-400">
            <span>{lang === 'zh' ? '选择土地' : 'Land plot'}</span>
            <select
              aria-label={lang === 'zh' ? '选择土地' : 'Select land'}
              value={selectedLandId}
              onChange={(event) => {
                setSelectedLandId(event.target.value);
                setPosition({ x: 1, y: 1 });
                setNotice(null);
              }}
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/50"
            >
              {landPlots.length === 0 && <option value="">{lang === 'zh' ? '暂无已拥有土地' : 'No owned land'}</option>}
              {landPlots.map((land) => (
                <option key={land.id} value={land.id}>{land.name} · {land.width}×{land.height}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            <span>{lang === 'zh' ? '选择建筑' : 'Building'}</span>
            <select
              aria-label={lang === 'zh' ? '选择建筑' : 'Select building'}
              value={selectedBuildingId}
              onChange={(event) => {
                setSelectedBuildingId(event.target.value);
                setPosition({ x: 1, y: 1 });
                setNotice(null);
              }}
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/50"
            >
              {DEFAULT_BUILDINGS.map((building) => (
                <option key={building.id} value={building.id}>{building.icon} {building.name} · {building.cost} ISC</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full border-white/15 text-slate-200 md:w-auto" onClick={handleClearLand} disabled={!selectedLandId || existingPlacements.length === 0}>
              <Eraser className="mr-2 h-4 w-4" />{lang === 'zh' ? '清空土地' : 'Clear land'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div
            className={`relative grid aspect-[3/2] touch-none select-none overflow-hidden rounded-xl border-2 bg-[linear-gradient(135deg,#0f3340,#10212e_45%,#0d1722)] p-2 shadow-inner transition-colors ${isPlacementValid ? 'border-emerald-400/90 ring-2 ring-emerald-400/20' : 'border-rose-400/90 ring-2 ring-rose-400/20'}`}
            style={{ gridTemplateColumns: `repeat(${bounds.width}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${bounds.height}, minmax(0, 1fr))` }}
            onPointerMove={handleGridPointerMove}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              handleGridPointerMove(event);
            }}
            aria-label={lang === 'zh' ? '房屋放置网格' : 'Building placement grid'}
            aria-describedby="placement-feedback"
            aria-invalid={!isPlacementValid}
          >
            {Array.from({ length: bounds.width * bounds.height }, (_, index) => {
              const x = index % bounds.width;
              const y = Math.floor(index / bounds.width);
              const preview = isCellPreview(x, y);
              const occupied = isCellOccupied(x, y);
              return (
                <div key={`${x}:${y}`} className={`relative border transition-colors ${preview ? (isPlacementValid ? 'border-emerald-300/90 bg-emerald-300/35 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.45)]' : 'border-rose-300/90 bg-rose-400/35 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.45)]') : occupied ? 'border-cyan-200/10 bg-amber-300/20' : 'border-cyan-200/10 bg-white/[0.02]'}`}>
                  {preview && x === candidate.position.x && y === candidate.position.y && (
                    <div className="absolute inset-0 flex items-center justify-center text-xl drop-shadow-lg" title={selectedBuilding.description}>
                      {selectedBuilding.icon}
                    </div>
                  )}
                  {occupied && !preview && <div className="absolute inset-1 rounded-sm border border-amber-300/40" />}
                </div>
              );
            })}
            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-slate-950/70 px-2 py-1 text-[10px] text-cyan-100">
              <Grip className="mr-1 inline h-3 w-3" />{lang === 'zh' ? '拖动鼠标定位建筑' : 'Drag to position'}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/80 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">{lang === 'zh' ? '预览状态' : 'Preview status'}</span>
              <Badge className={validation.valid ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}>
                {validation.valid ? (lang === 'zh' ? '可放置' : 'Valid') : (lang === 'zh' ? '不可放置' : 'Invalid')}
              </Badge>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between"><span>坐标</span><strong>({candidate.position.x}, {candidate.position.y})</strong></div>
              <div className="flex justify-between"><span>占地</span><strong>{candidate.footprint.width}×{candidate.footprint.height}</strong></div>
              <div className="flex justify-between"><span>旋转</span><strong>{candidate.rotation}°</strong></div>
              <div className="flex justify-between"><span>建造成本</span><strong className="text-cyan-200">{candidate.cost.toLocaleString()} ISC</strong></div>
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/70 p-2 text-xs text-slate-400">
              <Coins className="mr-1 inline h-3 w-3 text-cyan-300" />
              {isBalanceLoading ? '正在读取 ISC 余额…' : iscBalance === undefined ? '请连接钱包读取 ISC 余额' : `可用余额：${iscBalance.toLocaleString()} ISC`}
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/70 p-2 text-xs" role="status" aria-live="polite">
              {!selectedBuilding.modelUrl && <span className="text-slate-500">当前使用轻量 2.5D 网格预览；配置建筑 GLB URL 后将自动按需加载并缓存。</span>}
              {selectedBuilding.modelUrl && assetStatus === 'loading' && <span className="text-cyan-200"><RefreshCw className="mr-1 inline h-3 w-3 animate-spin" />正在加载建筑模型…</span>}
              {selectedBuilding.modelUrl && assetStatus === 'ready' && <span className="text-emerald-200">建筑模型资源已就绪，可复用缓存。</span>}
              {selectedBuilding.modelUrl && assetStatus === 'error' && (
                <span className="flex items-center justify-between gap-2 text-rose-200">
                  <span>建筑模型加载失败，暂时使用网格预览。</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-rose-100" onClick={() => setAssetAttempt((previous) => previous + 1)}>
                    <RefreshCw className="mr-1 h-3 w-3" />重试
                  </Button>
                </span>
              )}
            </div>
            <div id="placement-feedback" aria-live="polite" aria-atomic="true" className={`flex items-start gap-1 rounded-md border px-2 py-1.5 text-xs ${isPlacementValid ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/50 bg-rose-500/10 text-rose-200'}`}>
              {isPlacementValid ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              <span>{placementFeedbackText}</span>
            </div>
            {notice && <p role="status" className={`text-xs ${notice.type === 'error' ? 'text-rose-300' : notice.type === 'success' ? 'text-emerald-300' : 'text-cyan-200'}`}>{notice.text}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setRotation(normalizeRotation(rotation + 90))} className="border-white/15 text-slate-200">
                <RotateCw className="mr-1 h-4 w-4" />90°
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={!selectedLandId || isBalanceLoading || !isPlacementValid} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" aria-describedby="placement-feedback">
                <Check className="mr-1 h-4 w-4" />{lang === 'zh' ? '确认放置' : 'Confirm'}
              </Button>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500"><Sparkles className="mr-1 inline h-3 w-3" />{lang === 'zh' ? '当前保存为前端本地预览，确认后续接入链上建筑购买与放置交易。' : 'Currently saved as a local frontend preview; connect the on-chain purchase and placement transaction next.'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
