import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import GameHub from './GameHub';

beforeEach(() => window.localStorage.clear());

it('exposes only the playable city and operations, without legacy storefront and other dead-end tabs', () => {
  render(<GameHub />);
  const nav = screen.getByRole('navigation', { name: '游戏主导航' });
  expect(within(nav).getAllByRole('button')).toHaveLength(2);
  expect(within(nav).getByRole('button', { name: '城市街区' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByTestId('city-district-scene')).toBeInTheDocument();
  for (const oldEntry of ['商城', 'NPC', '房产', '农业', '社交', '画质设置']) expect(within(nav).queryByText(oldEntry)).toBeNull();
  expect(screen.queryByTestId('claim-all-revenue')).toBeNull();
  expect(screen.queryByLabelText('打开虚拟资产商店')).toBeNull();
  expect(screen.getByTestId('isc-balance')).toHaveTextContent('ISC 0');
});

it('keeps building controls available on a single city operations page, not underneath the playfield', () => {
  render(<GameHub />);
  expect(screen.queryByTestId('core-resource-cycle')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  expect(screen.getByTestId('core-resource-cycle')).toBeInTheDocument();
  expect(screen.getByTestId('core-building-card-production')).toBeInTheDocument();
  fireEvent.click(screen.getByTestId('toggle-core-building-production'));
  expect(screen.getByTestId('core-building-card-production')).toHaveClass('core-building-shutdown');
  fireEvent.click(screen.getByRole('button', { name: '城市街区' }));
  expect(screen.getByTestId('city-district-scene')).toBeInTheDocument();
});

it('runs the city loop, collects ISC and spends ISC to resupply utilities', () => {
  render(<GameHub />);
  fireEvent.click(screen.getByRole('button', { name: '推进一次城市资源循环' }));
  expect(screen.getByTestId('district-city-loop')).toHaveTextContent('第 1 轮');
  expect(screen.getByTestId('district-city-loop')).toHaveTextContent('水 56');
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  fireEvent.click(screen.getByTestId('collect-core-isc'));
  expect(screen.getByTestId('isc-balance')).toHaveTextContent('ISC 1');
  fireEvent.click(screen.getByRole('button', { name: '城市街区' }));
  fireEvent.click(screen.getByRole('button', { name: '花费 1 ISC 补给水电' }));
  expect(screen.getByTestId('district-city-loop')).toHaveTextContent('水 60');
  expect(screen.getByTestId('district-city-loop')).toHaveTextContent('电 80');
  expect(screen.getByTestId('isc-balance')).toHaveTextContent('ISC 0');
});

it('offers one regional strategy decision per cycle and charges ISC', () => {
  render(<GameHub />);
  fireEvent.click(screen.getByRole('button', { name: '推进一次城市资源循环' }));
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  fireEvent.click(screen.getByTestId('collect-core-isc'));
  expect(screen.getByRole('button', { name: /启动冬季保供，消耗 1 ISC/ })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: /启动冬季保供，消耗 1 ISC/ }));
  expect(screen.getByTestId('isc-balance')).toHaveTextContent('ISC 0');
  expect(screen.getByRole('button', { name: /开展街区促销，消耗 1 ISC/ })).toBeDisabled();
});

it('persists visited districts and grants the city supply reward once', () => {
  const view = render(<GameHub />);
  fireEvent.change(screen.getByRole('combobox', { name: '选择城市区域' }), { target: { value: 'production' } });
  fireEvent.click(screen.getByRole('button', { name: '走访食品加工坊' }));
  fireEvent.click(screen.getByRole('button', { name: '走访地点' }));
  fireEvent.change(screen.getByRole('combobox', { name: '选择城市区域' }), { target: { value: 'commercial' } });
  fireEvent.click(screen.getByRole('button', { name: '走访鸿运商都' }));
  fireEvent.click(screen.getByRole('button', { name: '走访地点' }));
  expect(screen.getByTestId('city-supply-objective')).toHaveTextContent('2/4');
  fireEvent.click(screen.getByRole('button', { name: '推进一次城市资源循环' }));
  fireEvent.click(screen.getByRole('button', { name: '花费 1 ISC 补给水电' }));
  expect(screen.getByTestId('city-supply-objective')).toHaveTextContent('城市供应已恢复');
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  expect(screen.getByTestId('core-resource-cycle')).toHaveTextContent('77%');
  view.unmount();
  render(<GameHub />);
  expect(screen.getByTestId('city-supply-objective')).toHaveTextContent('城市供应已恢复');
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  expect(screen.getByTestId('core-resource-cycle')).toHaveTextContent('77%');
});

it('keeps city crisis notices accessible from the resource operations page', () => {
  render(<GameHub />);
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  fireEvent.click(screen.getByTestId('toggle-core-building-residence'));
  fireEvent.click(screen.getByTestId('run-core-cycle'));
  expect(screen.getByTestId('systemic-resource-crisis-pulse')).toHaveAttribute('aria-live', 'assertive');
  fireEvent.click(screen.getByRole('button', { name: /实时事件/ }));
  expect(screen.getByTestId('global-event-notice-panel')).toHaveTextContent('系统性资源危机');
});
