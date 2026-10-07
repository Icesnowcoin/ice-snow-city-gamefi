import { useEffect, useRef, useState } from 'react';
import { Clock, Landmark, Coins } from 'lucide-react';
import CoreResourceCyclePanel from './CoreResourceCyclePanel';
import CityDistrictScene2D from './CityDistrictScene2D';
import MicropolisCityScene from './MicropolisCityScene';
import { collectCoreIsc, isCoreBuildingActive, resupplyCoreUtilities, runCoreResourceCycle, toggleCoreBuilding, upgradeCoreBuilding, type CoreBuildingId, type CoreBuildingLevels, type CoreBuildingOperatingState, type CoreCycleEvent, type CoreResourceState } from './coreResourceCycle';
import GlobalResourceHud, { getActiveResourceCrisisKeys, getSevereResourceCrisisKeys, type ResourceKey, type ResourceTrendPoint } from './GlobalResourceHud';
import GlobalEventNoticePanel, { type GlobalEventNotice } from './GlobalEventNoticePanel';
import { freshCityLocalSave, readCityLocalSave, writeCityLocalSave, type CityLocalSave } from './cityLocalSave';
import type { DistrictId } from './cityDistrictScenes';
import { getCitySupplyProgress } from './citySupplyObjective';
import { applyCityStrategy, CITY_STRATEGIES, type CityStrategyId } from './cityStrategy';

type GameTab = 'scenes' | 'operations';

/** Only the playable, gameplay-only city simulation is exposed from /game. Archived modules remain in the repo for migration. */
export function GameHub() {
  const [initialSave] = useState(() => readCityLocalSave() ?? freshCityLocalSave());
  const [activeTab, setActiveTab] = useState<GameTab>('scenes');
  const [gameTime, setGameTime] = useState(initialSave.gameTime);
  const [districtId, setDistrictId] = useState<DistrictId>(initialSave.districtId);
  const [visitedSpots, setVisitedSpots] = useState<string[]>(initialSave.visits);
  const [resupplyCount, setResupplyCount] = useState(initialSave.resupplyCount);
  const [supplyObjectiveCompleted, setSupplyObjectiveCompleted] = useState(initialSave.supplyObjectiveCompleted);
  const [strategyUses, setStrategyUses] = useState(initialSave.strategyUses);
  const [lastStrategyCycle, setLastStrategyCycle] = useState(initialSave.lastStrategyCycle);
  const [iscBalance, setIscBalance] = useState(initialSave.virtualAssets);
  const [coreResources, setCoreResources] = useState<CoreResourceState>(initialSave.resources);
  const [coreCycleEvents, setCoreCycleEvents] = useState<CoreCycleEvent[]>([]);
  const [coreBuildingLevels, setCoreBuildingLevels] = useState<CoreBuildingLevels>(initialSave.levels);
  const [coreBuildingOperatingState, setCoreBuildingOperatingState] = useState<CoreBuildingOperatingState>(initialSave.operating);
  const [resourceTrendHistory, setResourceTrendHistory] = useState<ResourceTrendPoint[]>([]);
  const [globalEventNotices, setGlobalEventNotices] = useState<GlobalEventNotice[]>([]);
  const [globalEventHistory, setGlobalEventHistory] = useState<GlobalEventNotice[]>([]);
  const [crisisResolutionPulse, setCrisisResolutionPulse] = useState(false);
  const [systemicResourceCrisis, setSystemicResourceCrisis] = useState(false);
  const activeCrisisKeysRef = useRef<ResourceKey[]>([]);
  const systemicResourceCrisisRef = useRef(false);
  const noticeSequenceRef = useRef(0);
  const supplyRewardedRef = useRef(initialSave.supplyObjectiveCompleted);
  const latestSaveRef = useRef<CityLocalSave>(initialSave);
  latestSaveRef.current = { version: 1, gameTime, districtId, virtualAssets: iscBalance, resources: coreResources, levels: coreBuildingLevels, operating: coreBuildingOperatingState, visits: visitedSpots, resupplyCount, supplyObjectiveCompleted, strategyUses, lastStrategyCycle };

  useEffect(() => {
    const persist = () => writeCityLocalSave(latestSaveRef.current);
    const timer = window.setInterval(persist, 1500);
    window.addEventListener('pagehide', persist);
    return () => { window.clearInterval(timer); window.removeEventListener('pagehide', persist); persist(); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setGameTime((time) => time + 1), 100);
    return () => window.clearInterval(timer);
  }, []);

  const pushGlobalNotices = (messages: Array<{ message: string; kind: GlobalEventNotice['kind'] }>) => {
    const now = Date.now();
    const notices = messages.map((event) => ({ ...event, id: now + noticeSequenceRef.current++, createdAt: now }));
    if (!notices.length) return;
    setGlobalEventHistory((current) => [...notices, ...current].slice(0, 100));
    setGlobalEventNotices((current) => [...notices.slice().reverse(), ...current].slice(0, 8));
    notices.forEach((notice) => window.setTimeout(() => setGlobalEventNotices((current) => current.filter((item) => item.id !== notice.id)), 9000));
  };

  const resourceLabels: Record<ResourceKey, string> = { water: '水', energy: '能源', workforce: '劳动力', goods: '物资', pendingIsc: '待领取 ISC', wellbeing: '宜居度' };
  const announceResolvedCrises = (nextState: CoreResourceState, history: ResourceTrendPoint[]) => {
    const nextKeys = getActiveResourceCrisisKeys(nextState, history);
    const resolved = activeCrisisKeysRef.current.filter((key) => !nextKeys.includes(key));
    activeCrisisKeysRef.current = nextKeys;
    if (!resolved.length) return;
    setCrisisResolutionPulse(true);
    window.setTimeout(() => setCrisisResolutionPulse(false), 2400);
    pushGlobalNotices([{ message: `危机已解除：${resolved.map((key) => resourceLabels[key]).join('、')}已恢复安全。`, kind: 'success' }]);
  };

  const handleRunCoreCycle = () => {
    const result = runCoreResourceCycle(coreResources, coreBuildingLevels, coreBuildingOperatingState);
    const keys: (keyof CoreResourceState)[] = ['water', 'energy', 'workforce', 'goods', 'pendingIsc', 'wellbeing'];
    const values = Object.fromEntries(keys.map((key) => {
      const delta = result.state[key] - coreResources[key];
      return [key, { produced: Math.max(0, delta), consumed: Math.max(0, -delta) }];
    })) as ResourceTrendPoint['values'];
    const history = [...resourceTrendHistory, { cycle: result.state.cycle, values, sourceContributions: result.contributions }].slice(-120);
    const systemic = getSevereResourceCrisisKeys(result.state, history).length >= 3;
    setResourceTrendHistory(history);
    setCoreResources(result.state);
    setCoreCycleEvents(result.events);
    pushGlobalNotices(result.events);
    announceResolvedCrises(result.state, history);
    setSystemicResourceCrisis(systemic);
    if (systemic && !systemicResourceCrisisRef.current) pushGlobalNotices([{ message: '系统性资源危机：三个或以上核心资源处于严重赤字。', kind: 'warning' }]);
    systemicResourceCrisisRef.current = systemic;
  };

  const handleResupply = () => {
    const result = resupplyCoreUtilities(coreResources, iscBalance);
    if (result.success) {
      setCoreResources(result.state);
      setIscBalance(result.cityFunds);
      setResupplyCount((count) => count + 1);
    }
    pushGlobalNotices([{ message: result.message, kind: result.success ? 'success' : 'warning' }]);
  };

  const handleCityStrategy = (strategyId: CityStrategyId) => {
    if (lastStrategyCycle === coreResources.cycle) {
      pushGlobalNotices([{ message: '本轮已经执行过城市策略，请先运营下一轮再做新的决策。', kind: 'info' }]);
      return;
    }
    const result = applyCityStrategy(coreResources, iscBalance, strategyId);
    if (!result.success) {
      pushGlobalNotices([{ message: result.message, kind: 'warning' }]);
      return;
    }
    setCoreResources(result.state);
    setIscBalance(result.iscBalance);
    setStrategyUses((count) => count + 1);
    setLastStrategyCycle(coreResources.cycle);
    pushGlobalNotices([{ message: result.message, kind: 'success' }]);
  };

  useEffect(() => {
    if (supplyRewardedRef.current || !getCitySupplyProgress(visitedSpots, coreResources.cycle, resupplyCount).complete) return;
    supplyRewardedRef.current = true;
    setSupplyObjectiveCompleted(true);
    setCoreResources((current) => ({ ...current, wellbeing: Math.min(100, current.wellbeing + 5) }));
    pushGlobalNotices([{ message: '城市供应任务完成：走访生产与商业区域、运营并补给水电。市民宜居度 +5。', kind: 'success' }]);
  }, [visitedSpots, coreResources.cycle, resupplyCount]);

  const handleUpgrade = (id: CoreBuildingId) => {
    const result = upgradeCoreBuilding(coreResources, coreBuildingLevels, id);
    setCoreResources(result.state);
    setCoreBuildingLevels(result.levels);
    setCoreCycleEvents([result.event]);
    pushGlobalNotices([result.event]);
  };
  const handleToggle = (id: CoreBuildingId) => {
    const result = toggleCoreBuilding(coreBuildingOperatingState, id);
    setCoreBuildingOperatingState(result.operatingState);
    setCoreCycleEvents([result.event]);
    pushGlobalNotices([result.event]);
  };
  const handleCollect = () => {
    if (!coreResources.pendingIsc) return;
      setIscBalance((current) => current + coreResources.pendingIsc);
    setCoreResources(collectCoreIsc(coreResources));
      pushGlobalNotices([{ message: `已领取 ${coreResources.pendingIsc} ISC，已计入游戏内余额。`, kind: 'success' }]);
  };
  const handleCrisisAction = (key: ResourceKey) => {
    const id: CoreBuildingId = key === 'water' || key === 'energy' ? 'production' : 'commercial';
    if (isCoreBuildingActive(id, coreBuildingOperatingState)) handleToggle(id);
    else pushGlobalNotices([{ message: `${id === 'production' ? '生产区' : '商业中心'}已经停机。`, kind: 'info' }]);
  };

  const displayTime = `${String(Math.floor(gameTime / 100) % 24).padStart(2, '0')}:${String(Math.floor((gameTime % 100) * 0.6)).padStart(2, '0')}`;
  return (
    <div className="game-hub-mobile" data-view={activeTab}>
      <header className="isc-game-header">
        <strong>Ice Snow City</strong>
        <span className="isc-game-header__time" aria-label={`城市时间 ${displayTime}`}><Clock aria-hidden="true" />{displayTime}</span>
        <span className="isc-game-header__funds" data-testid="isc-balance" aria-label={`ISC 余额 ${iscBalance}`}><Coins aria-hidden="true" />ISC {iscBalance.toLocaleString()}</span>
      </header>
      <GlobalResourceHud state={coreResources} history={resourceTrendHistory} onCrisisAction={handleCrisisAction} initiallyCollapsed />
      {systemicResourceCrisis && <div data-testid="systemic-resource-crisis-pulse" className="systemic-resource-crisis-pulse" aria-label="系统性资源危机，三个或以上资源严重赤字" aria-live="assertive" />}
      {crisisResolutionPulse && <div data-testid="crisis-resolution-pulse" className="crisis-resolution-pulse" aria-label="危机已解除，资源状态恢复安全" aria-live="polite" />}
      {globalEventNotices.length > 0 && <GlobalEventNoticePanel initiallyCollapsed notices={globalEventNotices} history={globalEventHistory} onDismiss={(id) => setGlobalEventNotices((current) => current.filter((notice) => notice.id !== id))} onClear={() => setGlobalEventNotices([])} onHistoryDismiss={(id) => setGlobalEventHistory((current) => current.filter((notice) => notice.id !== id))} onHistoryClear={() => setGlobalEventHistory([])} />}
      <main className="isc-game-content">
        {activeTab === 'scenes' ? (
          <MicropolisCityScene />
        ) : (
          <div className="isc-game-operations"><button className="isc-operations-back" type="button" onClick={() => setActiveTab('scenes')} aria-label="返回城市街区">‹ 返回城市街区</button><CoreResourceCyclePanel state={coreResources} lastEvents={coreCycleEvents} onRunCycle={handleRunCoreCycle} onCollect={handleCollect} buildingLevels={coreBuildingLevels} onUpgradeBuilding={handleUpgrade} operatingState={coreBuildingOperatingState} onToggleBuilding={handleToggle} /><section className="isc-city-strategy" aria-labelledby="city-strategy-title"><div><p className="isc-city-strategy__eyebrow">轻量城市策略 · 已执行 {strategyUses} 次</p><h2 id="city-strategy-title">本轮做一个经营决策</h2><p>每个资源循环只能选择一次，消耗游戏内 ISC，不引入战斗或复杂建造。</p></div><div className="isc-city-strategy__actions">{CITY_STRATEGIES.map((strategy) => <button key={strategy.id} type="button" onClick={() => handleCityStrategy(strategy.id)} disabled={lastStrategyCycle === coreResources.cycle || iscBalance < strategy.cost} aria-label={`${strategy.label}，消耗 ${strategy.cost} ISC`}><strong>{strategy.label}</strong><span>{strategy.description}</span></button>)}</div></section></div>
        )}
      </main>
      <nav className="isc-game-nav" aria-label="游戏主导航">
        <button type="button" aria-current={activeTab === 'scenes' ? 'page' : undefined} onClick={() => setActiveTab('scenes')}><Landmark aria-hidden="true" />城市街区</button>
        <button type="button" aria-current={activeTab === 'operations' ? 'page' : undefined} onClick={() => setActiveTab('operations')}><Coins aria-hidden="true" />城市运营</button>
      </nav>
    </div>
  );
}

export default GameHub;
