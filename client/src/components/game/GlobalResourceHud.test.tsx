import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GlobalResourceHud from './GlobalResourceHud';
import { buildTrendPath, formatDepletionTime, getActiveResourceCrisisKeys, getCrisisActionLabel, getResourceDepletionForecast, getResourceHistoryBySpan, getSevereResourceCrisisKeys, isResourceLow, sortResourceDefinitions } from './GlobalResourceHud';
import { INITIAL_CORE_RESOURCES } from './coreResourceCycle';

describe('GlobalResourceHud', () => {
  it('shows all global resource counters above the game scene', () => {
    render(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, cycle: 3, water: 56, goods: 2, pendingIsc: 1, wellbeing: 72 }} />);

    expect(screen.getByTestId('global-resource-hud')).toBeInTheDocument();
    expect(screen.getByLabelText('全局资源统计')).toBeInTheDocument();
    expect(screen.getByTestId('global-resource-water')).toHaveTextContent('56');
    expect(screen.getByTestId('global-resource-energy')).toHaveTextContent('80');
    expect(screen.getByTestId('global-resource-workforce')).toHaveTextContent('12');
    expect(screen.getByTestId('global-resource-goods')).toHaveTextContent('2');
    expect(screen.getByTestId('global-resource-pendingIsc')).toHaveTextContent('1');
    expect(screen.getByTestId('global-resource-wellbeing')).toHaveTextContent('72%');
  });

  it('switches between basic resources and advanced materials tabs', () => {
    render(<GlobalResourceHud state={INITIAL_CORE_RESOURCES} />);
    const basicTab = screen.getByRole('tab', { name: /基础资源/ });
    const advancedTab = screen.getByRole('tab', { name: /高级材料/ });

    expect(screen.getByRole('tab', { name: /全部资源/ })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(basicTab);
    expect(basicTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('global-resource-water')).toBeInTheDocument();
    expect(screen.queryByTestId('global-resource-goods')).not.toBeInTheDocument();

    fireEvent.click(advancedTab);
    expect(advancedTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('global-resource-goods')).toBeInTheDocument();
    expect(screen.getByTestId('global-resource-pendingIsc')).toBeInTheDocument();
    expect(screen.queryByTestId('global-resource-water')).not.toBeInTheDocument();

    fireEvent.click(basicTab);
    expect(basicTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows capacity badges and new-resource dots on category tabs', () => {
    const view = render(<GlobalResourceHud state={INITIAL_CORE_RESOURCES} />);
    expect(screen.getByLabelText('基础资源有1项资源达到存储上限')).toBeInTheDocument();
    expect(screen.getByLabelText('全部资源有1项资源达到存储上限')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '高级材料' }));
    view.rerender(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, goods: 5 }} />);
    expect(screen.getByLabelText('高级材料有新资源')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /高级材料/ }));
    expect(screen.queryByLabelText('高级材料有新资源')).not.toBeInTheDocument();
  });

  it('sorts visible resources by quantity or rarity', () => {
    const { container } = render(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, water: 8, energy: 80, workforce: 3, goods: 5, pendingIsc: 1 }} />);
    const getOrder = () => Array.from(container.querySelectorAll('[data-testid^="global-resource-"]:not([data-testid="global-resource-hud"])')).map((node) => node.getAttribute('data-testid'));
    expect(getOrder()).toEqual(['global-resource-energy', 'global-resource-wellbeing', 'global-resource-water', 'global-resource-goods', 'global-resource-workforce', 'global-resource-pendingIsc']);

    fireEvent.click(screen.getByRole('button', { name: '稀有度' }));
    expect(getOrder()).toEqual(['global-resource-pendingIsc', 'global-resource-goods', 'global-resource-energy', 'global-resource-wellbeing', 'global-resource-water', 'global-resource-workforce']);
    expect(sortResourceDefinitions).toBeTypeOf('function');
  });

  it('marks values for the rolling transition after resource output', () => {
    render(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, goods: 5 }} />);

    const goodsValue = screen.getByTestId('global-resource-goods').querySelector('[data-testid="rolling-resource-value"]');
    expect(goodsValue).toHaveClass('resource-number-roll');
    expect(goodsValue).toHaveTextContent('5');
  });

  it('marks low water and deficit energy with a red warning state', () => {
    render(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, water: 12, energy: -1 }} />);

    const water = screen.getByTestId('global-resource-water');
    const energy = screen.getByTestId('global-resource-energy');
    expect(water).toHaveAttribute('data-resource-status', 'low');
    expect(water).toHaveClass('resource-low-warning');
    expect(energy).toHaveAttribute('data-resource-status', 'low');
    expect(energy).toHaveTextContent('资源不足');
  });

  it('keeps normal resources out of the warning state and applies configured thresholds', () => {
    render(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, water: 13, energy: 17, goods: 2, wellbeing: 31 }} />);

    expect(screen.getByTestId('global-resource-water')).toHaveAttribute('data-resource-status', 'normal');
    expect(screen.getByTestId('global-resource-energy')).toHaveAttribute('data-resource-status', 'normal');
    expect(screen.getByTestId('global-resource-goods')).toHaveAttribute('data-resource-status', 'normal');
    expect(screen.getByTestId('global-resource-wellbeing')).toHaveAttribute('data-resource-status', 'normal');
    expect(isResourceLow(0)).toBe(false);
    expect(isResourceLow(-1)).toBe(true);
    expect(isResourceLow(12, 12)).toBe(true);
  });

  it('opens a resource trend popover on hover and renders production and consumption lines', () => {
    render(<GlobalResourceHud
      state={INITIAL_CORE_RESOURCES}
      history={[
        { cycle: 1, values: { water: { produced: 0, consumed: 4 }, goods: { produced: 5, consumed: 3 } } },
        { cycle: 2, values: { water: { produced: 0, consumed: 4 }, goods: { produced: 5, consumed: 3 } } },
      ]}
    />);

    const goods = screen.getByTestId('global-resource-goods');
    fireEvent.mouseEnter(goods);
    expect(screen.getByRole('dialog', { name: '物资近期趋势' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '物资产出与消耗折线图' })).toBeInTheDocument();
    expect(screen.getByText(/产出 5/)).toBeInTheDocument();
    expect(screen.getByText(/消耗 3/)).toBeInTheDocument();
    fireEvent.mouseLeave(goods);
    expect(screen.queryByRole('dialog', { name: '物资近期趋势' })).not.toBeInTheDocument();
  });

  it('pins a trend popover by click and exposes a deterministic SVG path helper', () => {
    render(<GlobalResourceHud state={INITIAL_CORE_RESOURCES} history={[{ cycle: 1, values: { energy: { produced: 0, consumed: 8 } } }]} />);
    const energy = screen.getByTestId('global-resource-energy');
    fireEvent.click(energy);
    expect(screen.getByRole('dialog', { name: '能源近期趋势' })).toBeInTheDocument();
    fireEvent.mouseLeave(energy);
    expect(screen.getByRole('dialog', { name: '能源近期趋势' })).toBeInTheDocument();
    fireEvent.click(energy);
    expect(screen.queryByRole('dialog', { name: '能源近期趋势' })).not.toBeInTheDocument();
    expect(buildTrendPath([0, 4, 2])).toContain('M 8.0');
  });

  it('opens a historical trend chart and switches the selected resource', () => {
    render(<GlobalResourceHud state={INITIAL_CORE_RESOURCES} history={[
      { cycle: 4, values: { water: { produced: 3, consumed: 1 }, energy: { produced: 6, consumed: 2 } } },
      { cycle: 5, values: { water: { produced: 2, consumed: 4 }, energy: { produced: 4, consumed: 7 } } },
    ]} />);

    fireEvent.click(screen.getByTestId('resource-history-toggle'));
    expect(screen.getByTestId('resource-history-trend-panel')).toHaveTextContent('历史趋势 · 水');
    expect(screen.getByRole('img', { name: '水历史产出与消耗折线图' })).toBeInTheDocument();
    expect(screen.getByText('第 4–5 轮')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '能源' }));
    expect(screen.getByTestId('resource-history-trend-panel')).toHaveTextContent('历史趋势 · 能源');
    expect(screen.getByRole('img', { name: '能源历史产出与消耗折线图' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '最近 1 小时' }));
    expect(screen.getByRole('button', { name: '最近 1 小时' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '全部历史' }));
    expect(screen.getByRole('button', { name: '全部历史' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('filters historical contribution lines by production building or region', () => {
    render(<GlobalResourceHud state={INITIAL_CORE_RESOURCES} history={[{
      cycle: 6,
      values: { goods: { produced: 5, consumed: 3 } },
      sourceContributions: {
        production: { goods: { produced: 5, consumed: 0 } },
        commercial: { goods: { produced: 0, consumed: 2 } },
        'public-service': { goods: { produced: 0, consumed: 1 } },
      },
    }]} />);

    fireEvent.click(screen.getByTestId('resource-history-toggle'));
    fireEvent.click(screen.getByRole('button', { name: '物资' }));
    fireEvent.click(screen.getByRole('button', { name: '生产区' }));
    expect(screen.getByTestId('resource-history-trend-panel')).toHaveTextContent('生产区 · 最近 1 轮');
    expect(screen.getByText('● 产出 5')).toBeInTheDocument();
    expect(screen.getByText('● 消耗 0')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '商业中心' }));
    expect(screen.getByText(/商业中心 · 最近 1 轮/)).toBeInTheDocument();
    expect(screen.getByText('● 产出 0')).toBeInTheDocument();
    expect(screen.getByText('● 消耗 2')).toBeInTheDocument();
  });

  it('shows an empty state before any cycle history exists', () => {
    render(<GlobalResourceHud state={INITIAL_CORE_RESOURCES} />);
    fireEvent.click(screen.getByTestId('resource-history-toggle'));
    expect(screen.getByTestId('resource-history-trend-panel')).toHaveTextContent('运行资源循环后，这里会显示历史趋势。');
    expect(screen.queryByTestId('resource-history-line-chart')).not.toBeInTheDocument();
  });

  it('collapses and reopens the translucent resource sidebar', () => {
    render(<GlobalResourceHud state={INITIAL_CORE_RESOURCES} />);
    const toggle = screen.getByTestId('resource-hud-sidebar-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('global-resource-hud')).toHaveClass('resource-hud-sidebar--open');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('global-resource-hud')).toHaveClass('resource-hud-sidebar--collapsed');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens and closes the sidebar with horizontal swipe gestures', () => {
    render(<GlobalResourceHud state={INITIAL_CORE_RESOURCES} />);
    const hud = screen.getByTestId('global-resource-hud');
    const toggle = screen.getByTestId('resource-hud-sidebar-toggle');

    fireEvent.touchStart(hud, { touches: [{ clientX: 24, clientY: 320 }] });
    fireEvent.touchEnd(hud, { changedTouches: [{ clientX: 112, clientY: 326 }] });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.touchStart(hud, { touches: [{ clientX: 260, clientY: 320 }] });
    fireEvent.touchEnd(hud, { changedTouches: [{ clientX: 180, clientY: 326 }] });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters history by recent 10 minutes, one hour, or all retained cycles', () => {
    const history = [1, 40, 60, 90, 100].map((cycle) => ({ cycle, values: { water: { produced: cycle, consumed: 1 } } }));
    expect(getResourceHistoryBySpan(history, '10m').map((point) => point.cycle)).toEqual([90, 100]);
    expect(getResourceHistoryBySpan(history, '1h').map((point) => point.cycle)).toEqual([40, 60, 90, 100]);
    expect(getResourceHistoryBySpan(history, 'all').map((point) => point.cycle)).toEqual([1, 40, 60, 90, 100]);
  });

  it('calculates and displays the remaining depletion time for a net deficit', () => {
    const history = [
      { cycle: 1, values: { water: { produced: 1, consumed: 5 } } },
      { cycle: 2, values: { water: { produced: 1, consumed: 5 } } },
    ];
    const forecast = getResourceDepletionForecast(12, history, 'water');
    expect(forecast?.netDrainPerCycle).toBe(4);
    expect(forecast?.cyclesRemaining).toBe(3);
    expect(formatDepletionTime(forecast!)).toBe('约 3 轮');

    render(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, water: 12 }} history={history} />);
    expect(screen.getByTestId('resource-depletion-forecast-water')).toHaveTextContent('预计耗尽：约 3 轮');
    expect(screen.getByTestId('resource-depletion-forecast-water')).toHaveAttribute('aria-label', '水预计耗尽时间约 3 轮');
  });

  it('marks a depleted resource and hides forecasts when production keeps pace', () => {
    const deficitHistory = [{ cycle: 1, values: { energy: { produced: 0, consumed: 8 } } }];
    render(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, energy: 0 }} history={deficitHistory} />);
    expect(screen.getByTestId('resource-depletion-forecast-energy')).toHaveTextContent('已耗尽');
    expect(getResourceDepletionForecast(10, [{ cycle: 1, values: { goods: { produced: 4, consumed: 4 } } }], 'goods')).toBeNull();
    expect(screen.queryByTestId('resource-depletion-forecast-goods')).not.toBeInTheDocument();
  });

  it('offers a direct mitigation action for depleting operational resources', () => {
    const onCrisisAction = vi.fn();
    const history = [{ cycle: 1, values: { energy: { produced: 0, consumed: 8 } } }];
    render(<GlobalResourceHud state={{ ...INITIAL_CORE_RESOURCES, energy: 20 }} history={history} onCrisisAction={onCrisisAction} />);
    expect(getCrisisActionLabel('energy')).toBe('停机生产区以节能');
    fireEvent.click(screen.getByTestId('resource-crisis-action-energy'));
    expect(onCrisisAction).toHaveBeenCalledWith('energy');
  });

  it('detects a crisis clearing when the latest cycle no longer drains the resource', () => {
    const state = { ...INITIAL_CORE_RESOURCES, water: 20, goods: 1 };
    expect(getActiveResourceCrisisKeys(state, [{ cycle: 1, values: { water: { produced: 0, consumed: 4 } } }])).toEqual(['water']);
    expect(getActiveResourceCrisisKeys(state, [{ cycle: 2, values: { water: { produced: 0, consumed: 0 } } }])).toEqual([]);
  });

  it('detects systemic crisis only when three or more operational resources are severely negative', () => {
    const state = { ...INITIAL_CORE_RESOURCES };
    const systemicHistory = [{ cycle: 1, values: {
      water: { produced: 0, consumed: 4 },
      energy: { produced: 0, consumed: 6 },
      workforce: { produced: 0, consumed: 3 },
      goods: { produced: 2, consumed: 0 },
    } }];
    expect(getSevereResourceCrisisKeys(state, systemicHistory)).toEqual(['water', 'energy', 'workforce']);
    expect(getSevereResourceCrisisKeys(state, [{ cycle: 2, values: { water: { produced: 0, consumed: 4 }, energy: { produced: 0, consumed: 6 } } }])).toEqual(['water', 'energy']);
  });
});
