import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BusinessDataArchivePanel } from './BusinessDataArchivePanel';
import { BusinessDataPoint } from '../map/BusinessDataCollectionManager';

const points: BusinessDataPoint[] = [
  { id: 'business-data-bank', name: '银行客流终端', description: '记录金融区公共服务的本地演示数据。', category: '公共服务', archiveContent: '银行大厅运行稳定。', x: 82, z: -18, collected: true, collectedAt: 1710000000000 },
  { id: 'business-data-market', name: '商圈交易终端', description: '记录鸿运商都的商品流转趋势。', category: '商业流转', archiveContent: '商圈交易保持活跃。', x: 34, z: -78, collected: false },
];

describe('BusinessDataArchivePanel', () => {
  it('shows collected archive content and locks uncollected entries', () => {
    render(<BusinessDataArchivePanel open points={points} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: '数据档案' })).toBeTruthy();
    expect(screen.getByText('已收集 1/2 个商业数据终端')).toBeTruthy();
    expect(screen.getByTestId('decrypt-business-data-business-data-bank')).toBeTruthy();
    expect(screen.getByText('未解锁商业数据')).toBeTruthy();
    expect(screen.getByText('前往金融区找到该数据终端并完成收集后解锁内容。')).toBeTruthy();
  });

  it('decrypts a collected entry after a short animation and supports cancellation', async () => {
    vi.useFakeTimers();
    render(<BusinessDataArchivePanel open points={points} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTestId('decrypt-business-data-business-data-bank'));
    expect(screen.getByText('正在解密商业数据')).toBeTruthy();
    expect(screen.getByTestId('business-data-cipher')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '取消解密' }));
    expect(screen.getByTestId('decrypt-business-data-business-data-bank')).toBeTruthy();

    fireEvent.click(screen.getByTestId('decrypt-business-data-business-data-bank'));
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByText('银行大厅运行稳定。')).toBeTruthy();
    expect(screen.getByTestId('business-data-entry-business-data-bank')).toHaveClass('business-data-entry--decrypted');
    expect(screen.getByRole('heading', { name: '银行客流终端' })).toHaveClass('business-data-entry__title');
    expect(screen.getByText('解密完成')).toBeTruthy();
    vi.useRealTimers();
  });

  it('filters entries by decrypted state and shows counts and empty state', () => {
    render(<BusinessDataArchivePanel open points={points} onClose={vi.fn()} />);

    expect(screen.getByTestId('business-data-filter-all')).toHaveTextContent('全部 2');
    expect(screen.getByTestId('business-data-filter-decrypted')).toHaveTextContent('已解密 0');
    expect(screen.getByTestId('business-data-filter-locked')).toHaveTextContent('未解密 2');

    fireEvent.click(screen.getByTestId('business-data-filter-decrypted'));
    expect(screen.getByTestId('business-data-empty-filter')).toBeTruthy();
    expect(screen.queryByTestId('business-data-entry-business-data-bank')).toBeNull();

    fireEvent.click(screen.getByTestId('business-data-filter-locked'));
    expect(screen.getByTestId('business-data-entry-business-data-bank')).toBeTruthy();
    expect(screen.getByTestId('business-data-entry-business-data-market')).toBeTruthy();
  });

  it('searches decrypted content, supports clearing, and does not expose locked archive text', async () => {
    vi.useFakeTimers();
    render(<BusinessDataArchivePanel open points={points} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTestId('decrypt-business-data-business-data-bank'));
    await act(async () => {
      vi.advanceTimersByTime(900);
    });

    fireEvent.change(screen.getByTestId('business-data-archive-search'), { target: { value: '运行稳定' } });
    expect(screen.getByTestId('business-data-entry-business-data-bank')).toBeTruthy();
    expect(screen.queryByTestId('business-data-entry-business-data-market')).toBeNull();
    expect(screen.getByTestId('business-data-archive-search-clear')).toBeTruthy();

    fireEvent.click(screen.getByTestId('business-data-archive-search-clear'));
    expect(screen.getByTestId('business-data-entry-business-data-bank')).toBeTruthy();
    expect(screen.getByTestId('business-data-entry-business-data-market')).toBeTruthy();
    vi.useRealTimers();
  });

  it('closes from the close button and Escape key', () => {
    const onClose = vi.fn();
    render(<BusinessDataArchivePanel open points={points} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '关闭数据档案' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
