import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BabylonGameEngine } from '../engine/BabylonGameEngine';
import { AgriculturalMapManager } from '../map/AgriculturalMapManager';
import { Building, Vegetation } from '../types/GameObjectTypes';
import { CameraJumpController } from '../map/CameraJumpController';
import { Quest, QuestLogManager } from '../quest/QuestLogManager';
import { PlayerEconomySystem } from '../economy/PlayerEconomySystem';
import { RewardSystem } from '../economy/RewardSystem';
import { NPCDialoguePhase } from './NPCDialoguePanel';
import { BusinessDataPoint } from '../map/BusinessDataCollectionManager';
import type { AgriculturalArea } from '../map/AgriculturalArea';
import { RENDER_FPS_UPDATE_EVENT, RENDER_QUALITY_CHANGE_EVENT } from '../rendering/renderQuality';
import { readBabylonPerformanceMetrics } from '@/lib/babylonPerformanceMetrics';

const ObjectInfoPanel = lazy(() => import('./ObjectInfoPanel'));
const Minimap = lazy(() => import('./Minimap'));
const QuestLogPanel = lazy(() => import('./QuestLogPanel').then((module) => ({ default: module.QuestLogPanel })));
const TaskTrackerPanel = lazy(() => import('./TaskTrackerPanel'));
const EconomyStatusBar = lazy(() => import('./EconomyStatusBar'));
const LandmarkDetailsPanel = lazy(() => import('./LandmarkDetailsPanel'));
const NPCDialoguePanel = lazy(() => import('./NPCDialoguePanel').then((module) => ({ default: module.NPCDialoguePanel })));
const RouteCompletionCelebration = lazy(() => import('./RouteCompletionCelebration').then((module) => ({ default: module.RouteCompletionCelebration })));
const BusinessDataArchivePanel = lazy(() => import('./BusinessDataArchivePanel'));
const AgriculturalAreaDetailsPanel = lazy(() => import('./AgriculturalAreaDetailsPanel'));

/**
 * 农业区 3D 地图查看器组件
 */
export type AgriculturalMapViewerProps = { embedded?: boolean };

export type MapLoadingState = {
  progress: number;
  label: string;
  detail: string;
};

export const MapLoadingOverlay: React.FC<{ state: MapLoadingState }> = ({ state }) => (
  <div
    className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
    role="status"
    aria-live="polite"
    aria-label={`${state.label}，${state.progress}%`}
  >
    <div className="w-full max-w-sm rounded-2xl border border-cyan-200/25 bg-slate-950/90 p-5 text-white shadow-2xl shadow-cyan-950/30">
      <div className="mb-4 flex items-start gap-3">
        <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-200/30 bg-cyan-300/10 text-xl text-cyan-100">
          <span className="absolute inset-0 animate-ping rounded-xl bg-cyan-300/10" />
          <span className="relative">❄</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-cyan-50">{state.label}</p>
            <span className="text-sm font-bold tabular-nums text-cyan-200">{state.progress}%</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{state.detail}</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 shadow-[0_0_16px_rgba(56,189,248,0.65)] transition-[width] duration-500 ease-out"
          style={{ width: `${state.progress}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-500">
        <span>ISC CITY SYSTEMS</span>
        <span className="animate-pulse text-cyan-300/75">SYNCING</span>
      </div>
    </div>
  </div>
);

export const AgriculturalMapViewer: React.FC<AgriculturalMapViewerProps> = ({ embedded = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BabylonGameEngine | null>(null);
  const mapManagerRef = useRef<AgriculturalMapManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingState, setLoadingState] = useState<MapLoadingState>({
    progress: 4,
    label: '正在准备农业区',
    detail: '正在等待 3D 画布启动…',
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<Building | Vegetation | null>(null);
  const [hoveredObject, setHoveredObject] = useState<Building | Vegetation | null>(null);
  const cameraJumpRef = useRef<CameraJumpController | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const questLogManagerRef = useRef<QuestLogManager | null>(null);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const economySystemRef = useRef<PlayerEconomySystem | null>(null);
  const rewardSystemRef = useRef<RewardSystem | null>(null);
  const [playerCoin, setPlayerCoin] = useState(1000);
  const [playerExperience, setPlayerExperience] = useState(0);
  const [playerISC, setPlayerISC] = useState(0);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [playerWater, setPlayerWater] = useState(100);
  const [landmarkActionMessage, setLandmarkActionMessage] = useState<string | null>(null);
  const [isNPCDialogueOpen, setIsNPCDialogueOpen] = useState(false);
  const [npcDialoguePhase, setNPCDialoguePhase] = useState<NPCDialoguePhase>('before_accept');
  const [npcDialogueQuest, setNPCDialogueQuest] = useState<Quest | undefined>(undefined);
  const [isRouteCelebrationOpen, setIsRouteCelebrationOpen] = useState(false);
  const [unlockedRegionName, setUnlockedRegionName] = useState<string | null>(null);
  const [isFinanceRoaming, setIsFinanceRoaming] = useState(false);
  const [selectedBusinessDataPoint, setSelectedBusinessDataPoint] = useState<BusinessDataPoint | null>(null);
  const [businessDataPoints, setBusinessDataPoints] = useState<BusinessDataPoint[]>([]);
  const [selectedAgriculturalArea, setSelectedAgriculturalArea] = useState<AgriculturalArea | null>(null);
  const [isBusinessDataArchiveOpen, setIsBusinessDataArchiveOpen] = useState(false);
  const [nearbyNPC, setNearbyNPC] = useState<{ npcId: string; name: string; role: string; zone: string; distance: number } | null>(null);
  const landmarkActionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleRenderQualityChange = (event: Event) => {
      const profile = (event as CustomEvent<{ profile?: 'low' | 'medium' | 'high' }>).detail?.profile;
      if (profile) engineRef.current?.setRenderQuality(profile);
    };
    window.addEventListener(RENDER_QUALITY_CHANGE_EVENT, handleRenderQualityChange);
    return () => window.removeEventListener(RENDER_QUALITY_CHANGE_EVENT, handleRenderQualityChange);
  }, []);

  const openQuestOfficerDialogue = () => {
    const questManager = questLogManagerRef.current;
    const existing = questManager?.getQuestsByNPC('npc-quest-officer')[0];
    setNPCDialogueQuest(existing);
    if (!existing) setNPCDialoguePhase('before_accept');
    else if (existing.status === 'completed') setNPCDialoguePhase('completed');
    else if (existing.progress > 0) setNPCDialoguePhase('progress');
    else setNPCDialoguePhase('accepted');
    setIsNPCDialogueOpen(true);
  };

  const closeRouteCelebration = () => setIsRouteCelebrationOpen(false);
  const exploreUnlockedRegion = () => {
    const mapManager = mapManagerRef.current;
    if (!mapManager) {
      setIsRouteCelebrationOpen(false);
      setLandmarkActionMessage('金融区探索权限已解锁，当前场景正在准备中。');
      return;
    }
    const started = mapManager.roamToFinanceDistrict(() => {
      setIsFinanceRoaming(false);
      setIsRouteCelebrationOpen(false);
      setLandmarkActionMessage('已抵达金融区，ISC 银行总部就在前方。');
    });
    if (!started) {
      setIsRouteCelebrationOpen(false);
      setLandmarkActionMessage('金融区探索权限已解锁，当前场景暂不支持镜头漫游。');
      return;
    }
    setIsFinanceRoaming(true);
    setLandmarkActionMessage('镜头正在平滑前往金融区……');
  };

  const skipFinanceRoam = () => {
    mapManagerRef.current?.cancelCameraRoam();
    setIsFinanceRoaming(false);
    setIsRouteCelebrationOpen(false);
    setLandmarkActionMessage('已跳过镜头漫游，金融区探索权限已解锁。');
  };

  const acceptBusinessDataQuest = () => {
    const questManager = questLogManagerRef.current;
    if (!questManager) return;
    const quest: Quest = {
      id: 'quest-collect-business-data',
      npcId: 'npc-bank-advisor',
      npcName: '金融区数据顾问',
      title: '收集商业数据',
      description: '走访金融区的数据终端，收集城市商业运行所需的本地演示样本。',
      status: 'accepted',
      objectives: [{ id: 'collect-business-data', description: '收集金融区商业数据终端', targetCount: 4, currentCount: 0, completed: false }],
      rewards: [{ type: 'experience', amount: 20 }, { type: 'coin', amount: 15 }],
      acceptedTime: Date.now(),
      progress: 0,
      difficulty: 'easy',
    };
    questManager.acceptQuest(quest);
    setLandmarkActionMessage('新任务已接取：请在金融区收集 4 个商业数据终端。');
  };

  const acceptRouteQuest = () => {
    const questManager = questLogManagerRef.current;
    if (!questManager) return;
    const quest: Quest = {
      id: 'quest-city-first-route',
      npcId: 'npc-quest-officer',
      npcName: '荣光使者',
      title: '点亮城市第一条路线',
      description: '与任务大厅建立联系，完成一次城市导航，为后续主线建设做好准备。',
      status: 'accepted',
      objectives: [{ id: 'light-route-node', description: '点亮晨曦路线上的路灯节点', targetCount: 4, currentCount: 0, completed: false }],
      rewards: [{ type: 'experience', amount: 25 }, { type: 'coin', amount: 10 }],
      acceptedTime: Date.now(),
      progress: 0,
      difficulty: 'easy',
    };
    questManager.acceptQuest(quest);
    setNPCDialogueQuest(quest);
    setNPCDialoguePhase('accepted');
    setLandmarkActionMessage('任务已接取：请点亮晨曦路线上的 4 个路灯节点。');
  };

  useEffect(() => {
    const publishFps = () => {
      const engine = engineRef.current;
      if (!engine) return;
      const metrics = readBabylonPerformanceMetrics({ engine: engine.getEngine(), scene: engine.getScene() });
      window.dispatchEvent(new CustomEvent(RENDER_FPS_UPDATE_EVENT, { detail: { fps: metrics.fps } }));
    };
    const fpsInterval = window.setInterval(publishFps, 500);
    publishFps();
    return () => window.clearInterval(fpsInterval);
  }, []);

  useEffect(() => {
    let minimapUpdateInterval: number | undefined;
    const initializeMap = async () => {
      try {
        const reportLoading = (progress: number, label: string, detail: string) => {
          setLoadingState({ progress, label, detail });
        };

        if (!canvasRef.current) {
          throw new Error('Canvas element not found');
        }

        // 创建游戏引擎
        reportLoading(12, '正在启动 3D 引擎', '正在配置 Babylon.js 渲染管线…');
        const engine = new BabylonGameEngine();
        await engine.initialize(canvasRef.current);
        engineRef.current = engine;

        // 创建地图管理器
        reportLoading(36, '正在生成冰雪城市', '正在加载地标、道路和农业区地块…');
        const mapManager = new AgriculturalMapManager(engine);
        await mapManager.initialize();
        mapManagerRef.current = mapManager;
        setBusinessDataPoints(mapManager.getBusinessDataPoints());

        // 初始化相机跳转控制器
        cameraJumpRef.current = new CameraJumpController(1000);

        // 初始化任务日志管理器
        reportLoading(72, '正在连接城市系统', '正在准备任务、经济和奖励模块…');
        questLogManagerRef.current = new QuestLogManager();

        // 初始化玩家经济系统
        economySystemRef.current = new PlayerEconomySystem('player-1');
        rewardSystemRef.current = new RewardSystem(economySystemRef.current);
        
        // 订阅余额变化
        economySystemRef.current.onBalanceChange((currency, newBalance) => {
          if (currency === 'coin') {
            setPlayerCoin(newBalance);
          } else if (currency === 'experience') {
            setPlayerExperience(newBalance);
          } else if (currency === 'energy') {
            setPlayerEnergy(newBalance);
          } else if (currency === 'water') {
            setPlayerWater(newBalance);
          }
        });

        // 设置任务日志管理器的奖励系统
        if (questLogManagerRef.current && rewardSystemRef.current && economySystemRef.current) {
          questLogManagerRef.current.setRewardSystem(rewardSystemRef.current);
          questLogManagerRef.current.setEconomySystem(economySystemRef.current);
        }

        // 订阅 ISC 余额变化
        if (economySystemRef.current) {
          economySystemRef.current.onBalanceChange((currency, newBalance) => {
            if (currency === 'isc') {
              setPlayerISC(newBalance);
            }
          });
        }

        // 设置对象选择回调
        mapManager.setOnObjectSelected((object) => {
          setSelectedObject(object);
          setHoveredObject(null);
          if (object) setSelectedAgriculturalArea(null);
        });
        mapManager.setOnObjectHovered((object) => setHoveredObject(object));
        mapManager.setOnAgriculturalAreaSelected((area) => {
          setSelectedAgriculturalArea(area);
          setSelectedObject(null);
        });
        mapManager.setOnNPCSelected((npcId) => {
          if (npcId !== 'npc-quest-officer') return;
          setIsQuestLogOpen(false);
          openQuestOfficerDialogue();
        });
        mapManager.setOnBusinessDataPointSelected((point) => {
          setSelectedBusinessDataPoint(point);
          setBusinessDataPoints(mapManager.getBusinessDataPoints());
          const questManager = questLogManagerRef.current;
          if (!questManager) return;
          let quest = questManager.getAllQuests().find((item) => item.id === 'quest-collect-business-data');
          if (!quest) {
            acceptBusinessDataQuest();
            quest = questManager.getAllQuests().find((item) => item.id === 'quest-collect-business-data');
          }
          if (!quest) return;
          if (point.collected) {
            setLandmarkActionMessage(`${point.name} 已收集，当前任务进度 ${quest.objectives[0]?.currentCount ?? 0}/4。`);
            return;
          }
          if (quest.status === 'completed') {
            setLandmarkActionMessage('商业数据任务已经完成。');
            return;
          }
          const collected = mapManager.collectBusinessDataPoint(point.id);
          if (!collected) return;
          const questId = quest.id;
          questManager.updateQuestProgress(questId, 'collect-business-data', 1);
          quest = questManager.getAllQuests().find((item) => item.id === questId);
          setBusinessDataPoints(mapManager.getBusinessDataPoints());
          if (quest?.status === 'completed') {
            questManager.completeQuest(quest.id);
            setLandmarkActionMessage('商业数据收集完成！金融区商业网络已建立。');
          } else {
            setLandmarkActionMessage(`${point.name} 已收集，还需完成 ${4 - (quest?.objectives[0]?.currentCount ?? 0)} 个终端。`);
          }
        });
        mapManager.setOnRouteNodeSelected((node) => {
          const questManager = questLogManagerRef.current;
          const quest = questManager?.getAllQuests().find((item) => item.id === 'quest-city-first-route');
          if (!quest) {
            setLandmarkActionMessage('请先与荣耀任务大厅的荣光使者互动，接取路线任务。');
            return;
          }
          if (quest.status === 'completed') {
            setLandmarkActionMessage('晨曦路线已经全部点亮。');
            return;
          }
          if (node.lit) {
            setLandmarkActionMessage(`${node.name} 已经点亮，无需重复操作。`);
            return;
          }
          const litNode = mapManager.lightRouteNode(node.id);
          if (!litNode || !questManager) return;
          questManager.updateQuestProgress(quest.id, 'light-route-node', 1);
          const updatedQuest = questManager.getAllQuests().find((item) => item.id === quest.id);
          if (updatedQuest?.status === 'completed') {
            questManager.completeQuest(quest.id);
            setNPCDialogueQuest(questManager.getAllQuests().find((item) => item.id === quest.id));
            setNPCDialoguePhase('completed');
            setUnlockedRegionName('金融区');
            setIsRouteCelebrationOpen(true);
            setLandmarkActionMessage('晨曦路线已全部点亮！金融区探索权限已解锁。');
          } else {
            setNPCDialogueQuest(updatedQuest);
            setNPCDialoguePhase('progress');
            setLandmarkActionMessage(`${node.name} 已点亮，还需完成 ${4 - (updatedQuest?.objectives[0]?.currentCount ?? 0)} 个节点。`);
          }
        });

        // 启动小地图更新循环
        reportLoading(91, '正在完成交互配置', '正在同步小地图和可交互对象…');
        minimapUpdateInterval = window.setInterval(() => {
          if (mapManagerRef.current) {
            mapManagerRef.current.updateMinimapCamera();
            setNearbyNPC(mapManagerRef.current.getNearbyNPC());
            setUpdateCounter((prev) => prev + 1);
          }
        }, 100);

        reportLoading(100, '农业区已准备完成', '欢迎进入 Ice Snow City。');
        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize map';
        setIsLoading(false);
        setLoadingState({ progress: 0, label: '农业区加载失败', detail: '请检查网络后重新加载。' });
        setError(errorMessage);
        console.error('Map initialization error:', err);
      }
    };

    initializeMap();

    return () => {
      if (minimapUpdateInterval !== undefined) window.clearInterval(minimapUpdateInterval);
      if (landmarkActionTimeoutRef.current !== null) window.clearTimeout(landmarkActionTimeoutRef.current);
      // 清理资源
      if (mapManagerRef.current) {
        mapManagerRef.current.dispose();
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
      if (cameraJumpRef.current) {
        cameraJumpRef.current.stop();
      }
      if (economySystemRef.current) {
        // 清理经济系统
      }
      if (questLogManagerRef.current) {
        questLogManagerRef.current.dispose();
      }
    };
  }, []);

  return (
      <div data-testid="agricultural-map-viewer" data-renderer="babylon-3d" className={embedded ? "relative flex h-[min(70vh,42rem)] min-h-[28rem] w-full flex-col overflow-hidden rounded-xl bg-gray-900" : "w-full h-screen flex flex-col bg-gray-900"}>
      {/* 标题栏 */}
      <div className={embedded ? "hidden" : "bg-gradient-to-r from-green-600 to-blue-600 p-4 text-white shadow-lg"}>
        <h1 className="text-2xl font-bold">🌾 农业区 3D 地图</h1>
        <p className="text-sm opacity-90">使用鼠标拖拽移动、滚轮缩放、点击选择建筑</p>
      </div>

      {/* 3D 画布 */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          data-testid="babylon-map-canvas"
          className="h-full w-full touch-none"
          style={{ display: 'block' }}
        />

        {/* 加载指示器 */}
        {isLoading && <MapLoadingOverlay state={loadingState} />}

        {/* Lazy HUD panels may suspend; keep the Babylon canvas mounted while they load. */}
        <Suspense fallback={null}>

        {/* 错误提示 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-red-600 text-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-2">加载失败</h2>
              <p className="mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-gray-100"
              >
                重新加载
              </button>
            </div>
          </div>
        )}

        {/* 信息面板 */}
        {!isLoading && !error && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg max-w-xs">
            <h3 className="font-bold mb-2">📍 地图信息</h3>
            <ul className="text-sm space-y-1">
              <li>🏠 建筑数量: 7</li>
              <li>🌳 植被数量: 15+</li>
              <li>📐 地图大小: 500×500m</li>
              <li>🎯 选中对象: {selectedObject ? selectedObject.name : '无'}</li>
            </ul>
          </div>
        )}

        {/* 核心建筑悬停提示；点击后由地标详情面板固定展示。 */}
        {!isLoading && !error && hoveredObject?.type === 'building' && hoveredObject.id.startsWith('landmark-') && hoveredObject.id !== selectedObject?.id && (
          <div
            data-testid="landmark-hover-tooltip"
            role="status"
            aria-live="polite"
            className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-xl border border-cyan-200/45 bg-slate-950/85 px-4 py-2 text-center text-white shadow-lg shadow-cyan-950/30 backdrop-blur-md"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">核心建筑</p>
            <p className="mt-0.5 text-sm font-bold">{hoveredObject.name} <span className="ml-1 text-xs text-cyan-200">Lv.1</span></p>
            <p className="mt-0.5 text-[10px] text-slate-400">点击查看建筑详情</p>
          </div>
        )}

        {!isLoading && !error && nearbyNPC && !isNPCDialogueOpen && (
          <button type="button" data-testid="nearby-npc-prompt" onClick={() => nearbyNPC.npcId === 'npc-quest-officer' ? openQuestOfficerDialogue() : setLandmarkActionMessage(`已靠近${nearbyNPC.name}，可点击地图中的 NPC 进行互动。`)} className="absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-2xl border border-cyan-200/45 bg-slate-950/88 px-4 py-2 text-center text-white shadow-xl shadow-cyan-950/30 backdrop-blur-md transition hover:bg-slate-900" aria-label={`与${nearbyNPC.name}交谈`}>
            <p className="text-xs font-bold text-cyan-100">{nearbyNPC.name}</p>
            <p className="mt-0.5 text-[10px] text-slate-300">{nearbyNPC.role} · 点击与其交谈</p>
          </button>
        )}

        {/* 测试地块简要信息提示 */}
        {!isLoading && !error && selectedObject?.type === 'building' && selectedObject.id.startsWith('test-') && (
          <div
            data-testid="test-object-info"
            role="status"
            aria-live="polite"
            className="absolute bottom-4 right-4 z-20 w-[min(18rem,calc(100%-2rem))] rounded-xl border border-cyan-300/40 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-md"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">测试地块 / 可交互对象</p>
                <h3 className="mt-1 text-base font-bold">{selectedObject.name}</h3>
              </div>
              <button
                type="button"
                aria-label="关闭对象提示"
                onClick={() => setSelectedObject(null)}
                className="rounded-md px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                ×
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
              <div><dt className="text-slate-500">对象类型</dt><dd>{selectedObject.buildingType}</dd></div>
              <div><dt className="text-slate-500">繁荣度</dt><dd>{selectedObject.state.productivity}%</dd></div>
              <div><dt className="text-slate-500">健康度</dt><dd>{selectedObject.state.health}%</dd></div>
              <div><dt className="text-slate-500">维护成本</dt><dd>{selectedObject.maintenanceCost.toLocaleString()} ISC</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-cyan-100/80">点击地块或建筑模型即可再次查看此提示。</p>
          </div>
        )}

        {/* 城市地标详情面板：仅替换地标对象的通用农业编辑面板 */}
        <LandmarkDetailsPanel
          building={selectedObject?.type === 'building' && selectedObject.id.startsWith('landmark-') ? selectedObject : null}
          onClose={() => setSelectedObject(null)}
          onAction={(action, building) => {
            if (landmarkActionTimeoutRef.current !== null) window.clearTimeout(landmarkActionTimeoutRef.current);
            setLandmarkActionMessage(`${building.name}：${action}已准备（测试模式）`);
            landmarkActionTimeoutRef.current = window.setTimeout(() => setLandmarkActionMessage(null), 3200);
          }}
        />

        {/* 对象信息面板 */}
        <ObjectInfoPanel
          object={selectedObject?.id.startsWith('landmark-') ? null : selectedObject}
          onClose={() => setSelectedObject(null)}
          onUpdate={(updatedObject) => {
            // 更新选中对象
            setSelectedObject(updatedObject);
            console.log('Object updated:', updatedObject);
            // 播放编辑反馈
            if (mapManagerRef.current) {
              mapManagerRef.current.playEditFeedback(updatedObject);
            }
            // TODO: 同步到后端数据库
          }}
          onDelete={(deletedObject) => {
            // 清除选中对象
            setSelectedObject(null);
            console.log('Object deleted:', deletedObject);
            // 播放删除反馈
            if (mapManagerRef.current) {
              mapManagerRef.current.playDeleteFeedback(deletedObject);
            }
            // TODO: 从 3D 场景中移除网格
            // TODO: 从后端数据库中删除
          }}
        />

        <AgriculturalAreaDetailsPanel
          area={selectedAgriculturalArea}
          onClose={() => setSelectedAgriculturalArea(null)}
        />

        {!isLoading && !error && (
          <button data-testid="open-business-data-archive" type="button" onClick={() => setIsBusinessDataArchiveOpen(true)} className="absolute bottom-4 left-4 z-30 rounded-xl border border-amber-200/35 bg-slate-950/88 px-3 py-2 text-left text-xs text-amber-100 shadow-xl backdrop-blur-md transition hover:border-amber-100/60 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/75">金融区档案</span>
            <span className="mt-0.5 block font-semibold">数据档案 · {businessDataPoints.filter((point) => point.collected).length}/{businessDataPoints.length}</span>
          </button>
        )}

        <BusinessDataArchivePanel
          open={isBusinessDataArchiveOpen}
          points={businessDataPoints}
          onClose={() => setIsBusinessDataArchiveOpen(false)}
        />

        {selectedBusinessDataPoint && !isLoading && !error && (
          <div data-testid="business-data-point-card" role="status" aria-live="polite" className="absolute bottom-20 left-4 z-30 w-[min(20rem,calc(100%-2rem))] rounded-2xl border border-amber-200/40 bg-slate-950/92 p-4 text-white shadow-2xl backdrop-blur-md sm:bottom-4 sm:left-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">金融区 · 商业数据</p>
                <h3 className="mt-1 text-base font-bold">{selectedBusinessDataPoint.name}</h3>
              </div>
              <button type="button" aria-label="关闭商业数据点提示" onClick={() => setSelectedBusinessDataPoint(null)} className="rounded-md px-2 py-1 text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">×</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">{selectedBusinessDataPoint.description}</p>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className={selectedBusinessDataPoint.collected ? 'text-slate-400' : 'text-amber-100'}>{selectedBusinessDataPoint.collected ? '已收集' : '待收集'}</span>
              <span className="text-slate-500">坐标 {Math.round(selectedBusinessDataPoint.x)}, {Math.round(selectedBusinessDataPoint.z)}</span>
            </div>
          </div>
        )}

        {landmarkActionMessage && (
          <div
            data-testid="landmark-action-message"
            role="status"
            aria-live="polite"
            className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-cyan-200/40 bg-slate-950/95 px-4 py-2 text-xs font-semibold text-cyan-100 shadow-xl backdrop-blur-md"
          >
            {landmarkActionMessage}
          </div>
        )}

        {unlockedRegionName && !isRouteCelebrationOpen && (
          <div data-testid="region-unlock-badge" role="status" aria-live="polite" className="absolute right-4 top-4 z-40 rounded-xl border border-cyan-200/30 bg-slate-950/85 px-3 py-2 text-xs font-semibold text-cyan-100 shadow-lg backdrop-blur-md">
            区域权限 · {unlockedRegionName} 已解锁
          </div>
        )}

        <RouteCompletionCelebration
          open={isRouteCelebrationOpen}
          regionName={unlockedRegionName ?? '金融区'}
          onClose={closeRouteCelebration}
          onExplore={exploreUnlockedRegion}
          isExploring={isFinanceRoaming}
          onSkipRoam={skipFinanceRoam}
        />

        <NPCDialoguePanel
          open={isNPCDialogueOpen}
          phase={npcDialoguePhase}
          quest={npcDialogueQuest}
          onAccept={acceptRouteQuest}
          onClose={() => setIsNPCDialogueOpen(false)}
        />

        {/* 任务追踪 HUD */}
        {!isLoading && !error && questLogManagerRef.current && (
          <TaskTrackerPanel
            questLogManager={questLogManagerRef.current}
            onOpenQuestLog={() => setIsQuestLogOpen(true)}
          />
        )}

        {/* 地图信息 */}
        {!isLoading && !error && mapManagerRef.current?.getMinimapManager() && (
          <Minimap
            key={updateCounter}
            minimapManager={mapManagerRef.current.getMinimapManager()!}
            onMarkerClick={(marker) => {
              const currentMapManager = mapManagerRef.current;
              if (marker.id.startsWith('business-data-') && currentMapManager) {
                currentMapManager.selectBusinessDataPoint(marker.id);
                return;
              }
              if (marker.id.startsWith('route-lamp-') && currentMapManager) {
                currentMapManager.interactWithRouteNode(marker.id);
                return;
              }
              const object = currentMapManager?.getGameObject(marker.id);
              if (object) setSelectedObject(object);
            }}
            onLocationClick={(worldX, worldZ) => {
              // 空白区域点击仍处理小地图镜头跳转
              if (engineRef.current && cameraJumpRef.current) {
                const camera = engineRef.current.getScene().activeCamera;
                if (camera) {
                  const fromPos = camera.position;
                  cameraJumpRef.current.startJump(
                    fromPos.x,
                    fromPos.y,
                    fromPos.z,
                    worldX,
                    fromPos.y,
                    worldZ,
                    1000
                  );
                }
              }
            }}
            showLegend={true}
            showGrid={true}
          />
        )}

        {/* 任务日志面板 */}
        {!isLoading && !error && questLogManagerRef.current && (
          <QuestLogPanel
            questLogManager={questLogManagerRef.current}
            isOpen={isQuestLogOpen}
            onClose={() => setIsQuestLogOpen(false)}
          />
        )}

        {/* 经济状态栏 */}
        {!isLoading && !error && (
          <EconomyStatusBar
            coin={playerCoin}
            experience={playerExperience}
            energy={playerEnergy}
            water={playerWater}
            isc={playerISC}
            onCoinChange={(newValue, oldValue) => {
              console.log(`Coin changed: ${oldValue} -> ${newValue}`);
            }}
            onExperienceChange={(newValue, oldValue) => {
              console.log(`Experience changed: ${oldValue} -> ${newValue}`);
            }}
            onISCRefresh={(balance) => {
              console.log(`ISC balance refreshed from blockchain: ${balance}`);
              setPlayerISC(balance);
            }}
          />
        )}

        {/* 任务日志按钮 */}
        {!isLoading && !error && (
          <button
            onClick={() => setIsQuestLogOpen(!isQuestLogOpen)}
            className="absolute top-4 left-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all"
          >
            📚 任务日志
          </button>
        )}

        {/* 漫游相机控制提示 */}
        {!isLoading && !error && (
          <div className="absolute bottom-4 left-4 z-40 rounded-lg bg-black/75 p-4 text-white shadow-xl backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between gap-4">
              <h3 className="font-bold">🎥 漫游相机</h3>
              <button
                type="button"
                className="rounded border border-cyan-200/40 px-2 py-1 text-[11px] text-cyan-100 transition hover:bg-cyan-200/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                onClick={() => engineRef.current?.resetRoamingCamera()}
              >
                重置视角
              </button>
            </div>
            <ul className="text-sm space-y-1">
              <li>🖱️ / 👆 拖拽：旋转视角</li>
              <li>⌨️ WASD / 方向键：自由移动</li>
              <li>📱 触控滑动：移动端观察</li>
              <li>👆 点击：选择建筑</li>
            </ul>
          </div>
        )}
        </Suspense>
      </div>

      {/* 底部状态栏 */}
      <div className={embedded ? "hidden" : "flex items-center justify-between bg-gray-800 p-2 text-sm text-white"}>
        <span>
          {isLoading ? '加载中...' : error ? '加载失败' : '✅ 地图已加载'}
        </span>
        <span>Babylon.js 3D 引擎 | 农业区完整场景 | 任务日志系统 | 经济系统</span>
      </div>
    </div>
  );
};

export default AgriculturalMapViewer;
