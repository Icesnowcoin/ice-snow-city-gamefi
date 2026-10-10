import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapLoadingOverlay } from './AgriculturalMapViewer';

describe('MapLoadingOverlay', () => {
  it('shows the current loading phase and determinate progress', () => {
    render(
      <MapLoadingOverlay
        state={{
          progress: 72,
          label: '正在连接城市系统',
          detail: '正在准备任务、经济和奖励模块…',
        }}
      />,
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', '正在连接城市系统，72%');
    expect(screen.getByText('正在连接城市系统')).toBeInTheDocument();
    expect(screen.getByText('正在准备任务、经济和奖励模块…')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(status.querySelector('[style="width: 72%;"]')).not.toBeNull();
  });

  it('supports a completed state without an indeterminate spinner', () => {
    render(
      <MapLoadingOverlay
        state={{ progress: 100, label: '农业区已准备完成', detail: '欢迎进入 Ice Snow City。' }}
      />,
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '农业区已准备完成，100%');
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
