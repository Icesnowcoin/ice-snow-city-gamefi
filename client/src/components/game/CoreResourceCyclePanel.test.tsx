import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CoreResourceCyclePanel from './CoreResourceCyclePanel';
import { formatPerSecondRate, getCoreBuildingTooltipData, getCoreBuildingVisualClass, getProductionBuildingStatus, getProductionRatePerSecond, getProductionReadiness, isSevereRateDeficit } from './CoreResourceCyclePanel';
import { INITIAL_CORE_RESOURCES } from './coreResourceCycle';

describe('CoreResourceCyclePanel', () => {
  it('exposes the four-building loop and runs a cycle', () => {
    const onRunCycle = vi.fn();
    render(<CoreResourceCyclePanel state={INITIAL_CORE_RESOURCES} lastEvents={[]} onRunCycle={onRunCycle} onCollect={vi.fn()} />);

    expect(screen.getByTestId('core-resource-cycle')).toBeInTheDocument();
    expect(screen.getByText('瑞景住宅区')).toBeInTheDocument();
    expect(screen.getByText('丰盈生产园')).toBeInTheDocument();
    expect(screen.getByText('鸿运商业中心')).toBeInTheDocument();
    expect(screen.getByText('城市公共服务站')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('run-core-cycle'));
    expect(onRunCycle).toHaveBeenCalledOnce();
  });

  it('disables collection until the cycle produces pending ISC', () => {
    const onCollect = vi.fn();
    const state = { ...INITIAL_CORE_RESOURCES, pendingIsc: 2 };
    render(<CoreResourceCyclePanel state={state} lastEvents={[]} onRunCycle={vi.fn()} onCollect={onCollect} />);

    const button = screen.getByTestId('collect-core-isc');
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onCollect).toHaveBeenCalledOnce();
  });

  it('calculates production efficiency and a resource shortage status for tooltips', () => {
    const tooltip = getCoreBuildingTooltipData('production', { ...INITIAL_CORE_RESOURCES, water: 2, energy: 80, workforce: 12 });

    expect(tooltip.efficiency).toBe(50);
    expect(tooltip.consumption).toContain('水 4');
    expect(tooltip.status).toBe('等待生产资源');
  });

  it('adds a visible hover and focus highlight affordance to building cards', () => {
    render(<CoreResourceCyclePanel state={INITIAL_CORE_RESOURCES} lastEvents={[]} onRunCycle={vi.fn()} onCollect={vi.fn()} />);

    const card = screen.getByTestId('core-building-card-production');
    expect(card.className).toContain('hover:border-cyan-200/90');
    expect(card.className).toContain('hover:shadow-[0_0_0_1px_rgba(103,232,249,0.35),0_0_24px_rgba(34,211,238,0.2)]');
    expect(card.className).toContain('focus-visible:border-cyan-200/90');
  });

  it('shows floating output text and particle elements after production', () => {
    render(<CoreResourceCyclePanel
      state={{ ...INITIAL_CORE_RESOURCES, cycle: 1, goods: 2, pendingIsc: 1 }}
      lastEvents={[
        { kind: 'success', message: '生产区完成一轮制造，获得 5 单位城市物资。' },
        { kind: 'success', message: '商业中心完成订单，新增 1 ISC 待领取。' },
      ]}
      onRunCycle={vi.fn()}
      onCollect={vi.fn()}
    />);

    expect(screen.getByTestId('core-production-feedback')).toBeInTheDocument();
    expect(screen.getByTestId('core-production-feedback')).toHaveTextContent('＋5 物资');
    expect(screen.getByText('＋1 ISC')).toBeInTheDocument();
    expect(screen.getByTestId('core-production-feedback').querySelectorAll('i')).toHaveLength(6);
  });

  it('exposes an upgrade button in the building tooltip and reports the selected building', () => {
    const onUpgradeBuilding = vi.fn();
    render(<CoreResourceCyclePanel
      state={{ ...INITIAL_CORE_RESOURCES, goods: 5 }}
      lastEvents={[]}
      onRunCycle={vi.fn()}
      onCollect={vi.fn()}
      onUpgradeBuilding={onUpgradeBuilding}
    />);

    expect(screen.getAllByText('Lv.1')).toHaveLength(8);
    const upgradeButton = screen.getByTestId('upgrade-core-building-production');
    expect(upgradeButton).toHaveTextContent('建筑升级');
    fireEvent.click(upgradeButton);
    expect(onUpgradeBuilding).toHaveBeenCalledWith('production');
  });

  it('shows the upgrade success animation after a successful upgrade event', () => {
    render(<CoreResourceCyclePanel
      state={INITIAL_CORE_RESOURCES}
      lastEvents={[{ kind: 'success', message: 'production 升级成功，达到 Lv.2，产出效率提升 15%。' }]}
      onRunCycle={vi.fn()}
      onCollect={vi.fn()}
    />);

    const successText = screen.getByText(/建筑升级成功/);
    expect(successText).toBeInTheDocument();
    expect(successText.parentElement).toHaveClass('core-upgrade-success');
  });

  it('visually distinguishes level one, two and three core buildings', () => {
    render(<CoreResourceCyclePanel
      state={INITIAL_CORE_RESOURCES}
      buildingLevels={{ production: 2, commercial: 3 }}
      lastEvents={[]}
      onRunCycle={vi.fn()}
      onCollect={vi.fn()}
    />);

    expect(screen.getByTestId('core-building-card-residence')).toHaveAttribute('data-building-level', '1');
    expect(screen.getByTestId('core-building-card-residence')).toHaveClass(getCoreBuildingVisualClass(1));
    expect(screen.getByTestId('core-building-card-production')).toHaveAttribute('data-building-level', '2');
    expect(screen.getByTestId('core-building-card-production')).toHaveClass('core-building-level-2');
    expect(screen.getByTestId('core-building-card-commercial')).toHaveAttribute('data-building-level', '3');
    expect(screen.getByTestId('core-building-card-commercial')).toHaveClass('core-building-level-3');
    expect(screen.getAllByText('Lv.3')).toHaveLength(2);
  });

  it('shows a powered-down visual state and calls the toggle handler from the tooltip', () => {
    const onToggleBuilding = vi.fn();
    render(<CoreResourceCyclePanel
      state={INITIAL_CORE_RESOURCES}
      operatingState={{ production: false }}
      lastEvents={[]}
      onRunCycle={vi.fn()}
      onCollect={vi.fn()}
      onToggleBuilding={onToggleBuilding}
    />);

    const card = screen.getByTestId('core-building-card-production');
    expect(card).toHaveAttribute('data-building-active', 'false');
    expect(card).toHaveClass('core-building-shutdown');
    expect(screen.getByText('停机')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('toggle-core-building-production'));
    expect(onToggleBuilding).toHaveBeenCalledWith('production');
  });

  it('classifies the production line as running, ready, blocked, or shutdown', () => {
    expect(getProductionBuildingStatus(INITIAL_CORE_RESOURCES, true, [{ kind: 'success', message: '生产区完成一轮制造，获得 5 单位城市物资。' }])).toBe('running');
    expect(getProductionBuildingStatus(INITIAL_CORE_RESOURCES, true, [])).toBe('ready');
    expect(getProductionBuildingStatus({ ...INITIAL_CORE_RESOURCES, energy: 2 }, true, [])).toBe('blocked');
    expect(getProductionBuildingStatus(INITIAL_CORE_RESOURCES, false, [])).toBe('shutdown');
  });

  it('renders the production resource flow and preparation progress', () => {
    render(<CoreResourceCyclePanel state={{ ...INITIAL_CORE_RESOURCES, energy: 2 }} lastEvents={[]} onRunCycle={vi.fn()} onCollect={vi.fn()} />);

    const status = screen.getByTestId('production-building-status');
    expect(status).toHaveAttribute('data-production-status', 'blocked');
    expect(status).toHaveTextContent('生产线 · 等待资源');
    expect(status).toHaveTextContent('水');
    expect(status).toHaveTextContent('能源');
    expect(status).toHaveTextContent('＋5 物资/轮');
    expect(screen.getByRole('progressbar', { name: '生产准备度' })).toHaveAttribute('aria-valuenow', '33');
    expect(getProductionReadiness({ ...INITIAL_CORE_RESOURCES, energy: 2 }, true)).toBe(33);
  });

  it('shows actual per-second input and output rates while production is running', () => {
    render(<CoreResourceCyclePanel
      state={INITIAL_CORE_RESOURCES}
      lastEvents={[{ kind: 'success', message: '生产区完成一轮制造，获得 5 单位城市物资。' }]}
      onRunCycle={vi.fn()}
      onCollect={vi.fn()}
    />);

    expect(screen.getByRole('tooltip', { name: '水资源速率详情' })).toHaveTextContent('实际消耗：0.07/秒');
    expect(screen.getByRole('tooltip', { name: '水资源速率详情' })).toHaveClass('production-rate-tooltip--deficit');
    expect(screen.getByRole('tooltip', { name: '水资源速率详情' })).toHaveClass('production-rate-tooltip--severe');
    expect(screen.getByRole('tooltip', { name: '水资源速率详情' })).toHaveTextContent('严重赤字');
    expect(screen.getByRole('tooltip', { name: '物资资源速率详情' })).toHaveTextContent('实际产出：0.08/秒');
    expect(screen.getByRole('tooltip', { name: '物资资源速率详情' })).toHaveClass('production-rate-tooltip--balanced');
    expect(screen.getByRole('tooltip', { name: '物资资源速率详情' })).not.toHaveClass('production-rate-tooltip--severe');
    expect(getProductionRatePerSecond(4, true)).toBeCloseTo(0.0667, 3);
    expect(formatPerSecondRate(getProductionRatePerSecond(0, false))).toBe('0.00/秒');
  });

  it('classifies a two-times deficit as severe while keeping a smaller deficit static', () => {
    expect(isSevereRateDeficit(4, 2)).toBe(true);
    expect(isSevereRateDeficit(3, 2)).toBe(false);
    expect(isSevereRateDeficit(1, 0)).toBe(true);
    expect(isSevereRateDeficit(0, 0)).toBe(false);
  });
});
