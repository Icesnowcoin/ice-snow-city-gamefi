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
import { convertIscToCityFunds, settleCityRevenueToIsc } from './micropolisEconomy';
import { createDailyFinanceLedger, createDailyFinanceReport, getGameDay, trimDailyFinanceReports, GAME_TIME_UNITS_PER_DAY, type DailyFinanceReport } from './dailyFinance';

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
  const [micropolisFunds, setMicropolisFunds] = useState(initialSave.micropolisFunds);
  const [micropolisRevenueCarry, setMicropolisRevenueCarry] = useState(initialSave.micropolisRevenueCarry);
  const [financeDay, setFinanceDay] = useState(initialSave.financeDay);
  const [financeLedger, setFinanceLedger] = useState(initialSave.financeLedger);
  const [financeReports, setFinanceReports] = useState<DailyFinanceReport[]>(initialSave.financeReports);
  const [claimAnimation, setClaimAnimation] = useState<{ id: number; amount: number } | null>(null);
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
  const lastMicropolisFundsRef = useRef<number | null>(null);
  const externalFundsInjectionRef = useRef(0);
  latestSaveRef.current = { version: 1, gameTime, districtId, virtualAssets: iscBalance, micropolisFunds, micropolisRevenueCarry, financeDay, financeLedger, financeReports, resources: coreResources, levels: coreBuildingLevels, operating: coreBuildingOperatingState, visits: visitedSpots, resupplyCount, supplyObjectiveCompleted, strategyUses, lastStrategyCycle };

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

  const currentGameDay = getGameDay(gameTime);
  useEffect(() => {
    if (currentGameDay <= financeDay) return;
    const report = createDailyFinanceReport(financeLedger, micropolisFunds, iscBalance);
    setFinanceReports((current) => trimDailyFinanceReports([report, ...current]));
    setFinanceDay(currentGameDay);
    setFinanceLedger(createDailyFinanceLedger(currentGameDay, micropolisFunds, iscBalance));
    pushGlobalNotices([{ message: `第 ${report.day} 日财务报告已生成：城市净变化 $${report.netCityFunds.toLocaleString('zh-CN')}，ISC 净变化 ${report.netIsc}。`, kind: 'success' }]);
  }, [currentGameDay, financeDay, financeLedger, micropolisFunds, iscBalance]);

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
    setFinanceLedger((ledger) => ({ ...ledger, operatingCycles: ledger.operatingCycles + 1 }));
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
      setFinanceLedger((ledger) => ({ ...ledger, iscSpent: ledger.iscSpent + (iscBalance - result.cityFunds) + (coreResources.pendingIsc - result.state.pendingIsc) }));
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
    setFinanceLedger((ledger) => ({ ...ledger, iscSpent: ledger.iscSpent + (CITY_STRATEGIES.find((strategy) => strategy.id === strategyId)?.cost ?? 0) }));
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
    const amount = coreResources.pendingIsc;
    setIscBalance((current) => current + amount);
    setCoreResources(collectCoreIsc(coreResources));
    setFinanceLedger((ledger) => ({ ...ledger, iscClaimed: ledger.iscClaimed + amount }));
    setClaimAnimation({ id: Date.now(), amount });
    window.setTimeout(() => setClaimAnimation(null), 1450);
    pushGlobalNotices([{ message: `已领取 ${amount} ISC，已计入游戏内余额。`, kind: 'success' }]);
  };
  const handleCrisisAction = (key: ResourceKey) => {
    const id: CoreBuildingId = key === 'water' || key === 'energy' ? 'production' : 'commercial';
    if (isCoreBuildingActive(id, coreBuildingOperatingState)) handleToggle(id);
    else pushGlobalNotices([{ message: `${id === 'production' ? '生产区' : '商业中心'}已经停机。`, kind: 'info' }]);
  };

  const handleMicropolisFundsSnapshot = (nextFunds: number) => {
    const previousFunds = lastMicropolisFundsRef.current;
    const injected = externalFundsInjectionRef.current;
    const observedDelta = previousFunds === null ? 0 : nextFunds - previousFunds;
    const operationalDelta = Math.max(0, observedDelta - injected);
    externalFundsInjectionRef.current = 0;
    lastMicropolisFundsRef.current = nextFunds;
    setMicropolisFunds(nextFunds);
    const observedExpense = previousFunds === null ? 0 : Math.max(0, -observedDelta);
    if (observedExpense) setFinanceLedger((ledger) => ({ ...ledger, cityExpenses: ledger.cityExpenses + observedExpense }));
    if (operationalDelta <= 0) return;
    const settled = settleCityRevenueToIsc(operationalDelta, micropolisRevenueCarry);
    setMicropolisRevenueCarry(settled.carry);
    setFinanceLedger((ledger) => ({ ...ledger, cityRevenue: ledger.cityRevenue + operationalDelta }));
    if (!settled.earned) return;
    setCoreResources((current) => ({ ...current, pendingIsc: current.pendingIsc + settled.earned }));
    pushGlobalNotices([{ message: `城市财政结算：Micropolis 盈余 $${operationalDelta.toLocaleString('zh-CN')}，新增 ${settled.earned} ISC 待领取。`, kind: 'success' }]);
  };

  const handleInjectIsc = (amount: number) => {
    const result = convertIscToCityFunds(iscBalance, amount);
    if (!result.success) {
      pushGlobalNotices([{ message: result.message, kind: 'warning' }]);
      return false;
    }
    externalFundsInjectionRef.current += result.cityFunds;
    setIscBalance(result.iscBalance);
    setFinanceLedger((ledger) => ({ ...ledger, iscSpent: ledger.iscSpent + amount }));
    pushGlobalNotices([{ message: result.message, kind: 'success' }]);
    return result.cityFunds;
  };

  const dayMinutes = Math.floor(((gameTime % GAME_TIME_UNITS_PER_DAY) + GAME_TIME_UNITS_PER_DAY) % GAME_TIME_UNITS_PER_DAY * 1440 / GAME_TIME_UNITS_PER_DAY);
  const displayTime = `${String(Math.floor(dayMinutes / 60)).padStart(2, '0')}:${String(dayMinutes % 60).padStart(2, '0')}`;
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
      {claimAnimation && <div key={claimAnimation.id} data-testid="isc-claim-animation" className="isc-claim-animation" role="status" aria-live="polite"><span className="isc-claim-animation__coin">ISC</span><strong>＋{claimAnimation.amount} ISC</strong><span className="isc-claim-animation__spark isc-claim-animation__spark--one" /><span className="isc-claim-animation__spark isc-claim-animation__spark--two" /><span className="isc-claim-animation__spark isc-claim-animation__spark--three" /></div>}
      <main className="isc-game-content">
        {activeTab === 'scenes' ? (
          <MicropolisCityScene gameTime={gameTime} cityFunds={micropolisFunds} iscBalance={iscBalance} onInjectIsc={handleInjectIsc} onFundsSnapshot={handleMicropolisFundsSnapshot} />
        ) : (
          <div className="isc-game-operations"><button className="isc-operations-back" type="button" onClick={() => setActiveTab('scenes')} aria-label="返回城市街区">‹ 返回城市街区</button><CoreResourceCyclePanel state={coreResources} lastEvents={coreCycleEvents} onRunCycle={handleRunCoreCycle} onCollect={handleCollect} buildingLevels={coreBuildingLevels} onUpgradeBuilding={handleUpgrade} operatingState={coreBuildingOperatingState} onToggleBuilding={handleToggle} /><section className="isc-daily-finance" data-testid="daily-finance-report" aria-labelledby="daily-finance-title"><div className="isc-daily-finance__header"><div><p className="isc-city-strategy__eyebrow">每日自动结算 · 第 {financeDay} 日</p><h2 id="daily-finance-title">城市经营财务报告</h2><p>当前日账本实时累计，跨过游戏内 24 小时后自动生成正式报告。</p></div><span className="isc-daily-finance__status">已保存 {financeReports.length} 天</span></div><div className="isc-daily-finance__metrics"><span>城市收入 <b>${financeLedger.cityRevenue.toLocaleString('zh-CN')}</b></span><span>城市支出 <b>${financeLedger.cityExpenses.toLocaleString('zh-CN')}</b></span><span>ISC 领取 <b>{financeLedger.iscClaimed}</b></span><span>ISC 消耗 <b>{financeLedger.iscSpent}</b></span><span>运营轮次 <b>{financeLedger.operatingCycles}</b></span></div>{financeReports.length > 0 ? <div className="isc-daily-finance__history"><strong>最近日报</strong>{financeReports.slice(0, 5).map((report) => <div key={`${report.day}-${report.generatedAt}`}><span>第 {report.day} 日</span><span>城市净变化 ${report.netCityFunds.toLocaleString('zh-CN')}</span><span>ISC 净变化 {report.netIsc}</span></div>)}</div> : <p className="isc-daily-finance__empty">尚未完成第一天，日报将在游戏内第 24 小时自动生成。</p>}</section><section className="isc-city-strategy" aria-labelledby="city-strategy-title"><div><p className="isc-city-strategy__eyebrow">轻量城市策略 · 已执行 {strategyUses} 次</p><h2 id="city-strategy-title">本轮做一个经营决策</h2><p>每个资源循环只能选择一次，消耗游戏内 ISC，不引入战斗或复杂建造。</p></div><div className="isc-city-strategy__actions">{CITY_STRATEGIES.map((strategy) => <button key={strategy.id} type="button" onClick={() => handleCityStrategy(strategy.id)} disabled={lastStrategyCycle === coreResources.cycle || iscBalance < strategy.cost} aria-label={`${strategy.label}，消耗 ${strategy.cost} ISC`}><strong>{strategy.label}</strong><span>{strategy.description}</span></button>)}</div></section></div>
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
