import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import GameHub from './GameHub';
import { freshCityLocalSave, writeCityLocalSave } from './cityLocalSave';

vi.mock('./MicropolisCityScene', () => ({
  default: ({ cityFunds, iscBalance, onInjectIsc, onFundsSnapshot }: { cityFunds: number; iscBalance: number; onInjectIsc: (amount: number) => number | false; onFundsSnapshot: (funds: number) => void }) => (
    <section data-testid="micropolis-scene">
      <h1>冰雪城市建设局</h1>
      <span data-testid="micropolis-city-funds">${cityFunds}</span>
      <span data-testid="micropolis-scene-isc">{iscBalance} ISC</span>
      <button type="button" onClick={() => { const funds = onInjectIsc(1); if (funds !== false) onFundsSnapshot(cityFunds + funds); }}>注入 1 ISC</button>
      <button type="button" onClick={() => onFundsSnapshot(cityFunds)}>同步城市资金</button>
      <button type="button" onClick={() => onFundsSnapshot(cityFunds + 1500)}>模拟城市盈余 $1,500</button>
    </section>
  ),
}));

beforeEach(() => window.localStorage.clear());

it('exposes only the playable city and operations tabs', () => {
  render(<GameHub />);
  const nav = screen.getByRole('navigation', { name: '游戏主导航' });
  expect(within(nav).getAllByRole('button')).toHaveLength(2);
  expect(within(nav).getByRole('button', { name: '城市街区' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByTestId('micropolis-scene')).toBeInTheDocument();
  expect(screen.getByTestId('isc-balance')).toHaveTextContent('ISC 0');
});

it('keeps resource operations available on the operations tab', () => {
  render(<GameHub />);
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  expect(screen.getByTestId('core-resource-cycle')).toBeInTheDocument();
  expect(screen.getByTestId('core-building-card-production')).toBeInTheDocument();
  fireEvent.click(screen.getByTestId('toggle-core-building-production'));
  expect(screen.getByTestId('core-building-card-production')).toHaveClass('core-building-shutdown');
});

it('moves ISC from the resource cycle into Micropolis city funds', () => {
  render(<GameHub />);
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  fireEvent.click(screen.getByTestId('run-core-cycle'));
  fireEvent.click(screen.getByTestId('collect-core-isc'));
  fireEvent.click(screen.getByRole('button', { name: '城市街区' }));
  expect(screen.getByTestId('isc-balance')).toHaveTextContent('ISC 1');
  fireEvent.click(screen.getByRole('button', { name: '注入 1 ISC' }));
  expect(screen.getByTestId('isc-balance')).toHaveTextContent('ISC 0');
  expect(screen.getByTestId('micropolis-city-funds')).toHaveTextContent('$101000');
});

it('settles Micropolis positive funds into pending ISC and allows claiming it', async () => {
  render(<GameHub />);
  fireEvent.click(screen.getByRole('button', { name: '同步城市资金' }));
  fireEvent.click(screen.getByRole('button', { name: '模拟城市盈余 $1,500' }));
  fireEvent.click(screen.getByRole('button', { name: '模拟城市盈余 $1,500' }));
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  await waitFor(() => expect(screen.getByTestId('global-resource-pendingIsc')).toHaveTextContent('1'));
  fireEvent.click(screen.getByTestId('collect-core-isc'));
  expect(screen.getByTestId('isc-balance')).not.toHaveTextContent('ISC 0');
});

it('shows the daily finance report and a dynamic animation when claiming pending ISC', () => {
  const save = freshCityLocalSave();
  save.resources.pendingIsc = 2;
  writeCityLocalSave(save);
  render(<GameHub />);
  fireEvent.click(screen.getByRole('button', { name: '城市运营' }));
  expect(screen.getByTestId('daily-finance-report')).toHaveTextContent('城市经营财务报告');
  fireEvent.click(screen.getByTestId('collect-core-isc'));
  expect(screen.getByTestId('isc-claim-animation')).toHaveTextContent('＋2 ISC');
});
