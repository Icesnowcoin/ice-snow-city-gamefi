import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouteCompletionCelebration } from './RouteCompletionCelebration';

describe('RouteCompletionCelebration', () => {
  it('shows the unlocked region and supports entering it', () => {
    const onExplore = vi.fn();
    render(<RouteCompletionCelebration open regionName="金融区" onClose={vi.fn()} onExplore={onExplore} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('金融区', { exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '进入金融区' }));
    expect(onExplore).toHaveBeenCalledTimes(1);
  });

  it('shows a skip control while the camera is roaming', () => {
    const onSkipRoam = vi.fn();
    render(<RouteCompletionCelebration open isExploring regionName="金融区" onClose={vi.fn()} onExplore={vi.fn()} onSkipRoam={onSkipRoam} />);

    expect(screen.getByRole('status')).toHaveTextContent('镜头正在前往金融区');
    fireEvent.click(screen.getByRole('button', { name: '跳过漫游' }));
    expect(onSkipRoam).toHaveBeenCalledTimes(1);
  });

  it('allows the player to dismiss the celebration', () => {
    const onClose = vi.fn();
    render(<RouteCompletionCelebration open regionName="金融区" onClose={onClose} onExplore={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '稍后探索' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
