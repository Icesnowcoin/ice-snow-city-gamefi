import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MacroEconomyDashboard from './MacroEconomyDashboard';

describe('MacroEconomyDashboard', () => {
  it('renders the locked ISC distribution rules and trend metrics', () => {
    render(<MacroEconomyDashboard />);

    expect(screen.getByRole('heading', { name: 'ISC 宏观经济循环' })).toBeInTheDocument();
    expect(screen.getByText('铸造金额的 1%')).toBeInTheDocument();
    expect(screen.getByText('铸造金额的 69%')).toBeInTheDocument();
    expect(screen.getByText('交易额的 10%')).toBeInTheDocument();
    expect(screen.getByText('累计通胀率')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'ISC 铸造趋势条形图' })).toBeInTheDocument();
  });

  it('prefers supplied live burn and treasury totals over computed fallback totals', () => {
    render(<MacroEconomyDashboard liveBurnedTotal={777} liveTreasuryBalance={8888} />);

    expect(screen.getByText('777 ISC')).toBeInTheDocument();
    expect(screen.getByText('8,888 ISC')).toBeInTheDocument();
  });
});
