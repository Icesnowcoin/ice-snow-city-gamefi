import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GlobalEventNoticePanel, { type GlobalEventNotice } from './GlobalEventNoticePanel';

const notices: GlobalEventNotice[] = [
  { id: 2, message: '生产区已停机', kind: 'warning', createdAt: 2 },
  { id: 1, message: '建筑成功升级至 Lv.2', kind: 'success', createdAt: 1 },
];

describe('GlobalEventNoticePanel', () => {
  it('renders newest events in a live log and supports dismissing and clearing', () => {
    const onDismiss = vi.fn();
    const onClear = vi.fn();
    render(<GlobalEventNoticePanel notices={notices} history={notices} onDismiss={onDismiss} onClear={onClear} onHistoryDismiss={vi.fn()} onHistoryClear={vi.fn()} />);

    expect(screen.getByTestId('global-event-notice-panel')).toBeInTheDocument();
    expect(screen.getByRole('log')).toHaveTextContent('生产区已停机');
    expect(screen.getByRole('log')).toHaveTextContent('建筑成功升级至 Lv.2');
    fireEvent.click(screen.getByRole('button', { name: '关闭通知：生产区已停机' }));
    expect(onDismiss).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: '清空' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('collapses and expands from the panel title', () => {
    render(<GlobalEventNoticePanel notices={notices} history={notices} onDismiss={vi.fn()} onClear={vi.fn()} onHistoryDismiss={vi.fn()} onHistoryClear={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: /实时事件/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('log')).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('opens the complete history window and manages historical events independently', () => {
    const onHistoryDismiss = vi.fn();
    const onHistoryClear = vi.fn();
    render(<GlobalEventNoticePanel notices={[]} history={notices} onDismiss={vi.fn()} onClear={vi.fn()} onHistoryDismiss={onHistoryDismiss} onHistoryClear={onHistoryClear} />);

    fireEvent.click(screen.getByRole('button', { name: /历史记录，共 2 条/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('生产区已停机');
    fireEvent.click(screen.getByRole('button', { name: '删除历史记录：生产区已停机' }));
    expect(onHistoryDismiss).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: '清空历史' }));
    expect(onHistoryClear).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: '关闭历史记录' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('highlights crisis recovery announcements in the live stream and history', () => {
    const recovery: GlobalEventNotice = { id: 8, message: '危机已解除：能源已恢复安全。', kind: 'success', createdAt: 8 };
    render(<GlobalEventNoticePanel notices={[recovery]} history={[recovery]} onDismiss={vi.fn()} onClear={vi.fn()} onHistoryDismiss={vi.fn()} onHistoryClear={vi.fn()} />);
    expect(screen.getByTestId('global-event-notice-8')).toHaveClass('global-event-notice--recovered');
    fireEvent.click(screen.getByRole('button', { name: /历史记录，共 1 条/ }));
    expect(screen.getByTestId('global-event-history-8')).toHaveClass('global-event-notice--recovered');
  });
});
