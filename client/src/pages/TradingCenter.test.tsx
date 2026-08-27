import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TradingCenter from './TradingCenter';

vi.mock('@/hooks/useWeb3Wallet', () => ({
  useWeb3Wallet: () => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    signer: {},
    isLoading: false,
    error: null,
    connectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
  }),
}));

vi.mock('@/components/social/SignedNftOrderList', () => ({
  SignedNftOrderList: () => null,
}));

vi.mock('@/hooks/useISCMarketplace', () => ({
  useISCMarketplace: () => ({
    isLoading: false,
    error: null,
    success: null,
    txHash: null,
    getISCBalance: vi.fn().mockResolvedValue('0'),
    approveISC: vi.fn(),
    buyItem: vi.fn(),
    sellItem: vi.fn(),
  }),
}));

describe('TradingCenter safe data boundaries', () => {
  it('does not render fictional market data or enable trades without verified contract/listing data', () => {
    render(<TradingCenter />);

    expect(screen.getByText('市场合约尚未配置。当前仅展示真实数据入口，交易操作将在合约地址和挂单数据验证后启用。')).toBeTruthy();
    expect(screen.getByText('暂无真实行情')).toBeTruthy();
    expect(screen.getByText('暂无已验证的卖盘数据')).toBeTruthy();
    expect(screen.getByText('暂无已验证的买盘数据')).toBeTruthy();
    expect(screen.getByRole('button', { name: '授权并买入' })).toBeDisabled();
    expect(screen.queryByText('0.085 USDT')).toBeNull();
  });

  it('renders only caller-provided market data', () => {
    render(
      <TradingCenter
        marketplaceAddress="0x1111111111111111111111111111111111111111"
        marketStats={{ iscPrice: '0.12 USDT', volume24h: '100 ISC' }}
        orderBook={{ asks: [{ price: '0.13', amount: '2' }], bids: [] }}
      />,
    );

    expect(screen.getByText('0.12 USDT')).toBeTruthy();
    expect(screen.getByText('100 ISC')).toBeTruthy();
    expect(screen.getByText('0.13')).toBeTruthy();
    expect(screen.getByText('暂无已验证的买盘数据')).toBeTruthy();
  });
});
