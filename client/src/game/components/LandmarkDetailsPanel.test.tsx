import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LandmarkDetailsPanel } from './LandmarkDetailsPanel';
import { createDefaultBuilding } from '../types/GameObjectTypes';

const bank = createDefaultBuilding('landmark-isc-bank', 'ISC 银行总部', 'bank', { x: 105, y: 0, z: 0 });

describe('LandmarkDetailsPanel', () => {
  it('shows themed landmark details and invokes type-specific actions', () => {
    const onAction = vi.fn();
    render(<LandmarkDetailsPanel building={bank} onClose={vi.fn()} onAction={onAction} />);

    const panel = screen.getByTestId('landmark-details-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('landmark-details-panel');
    expect(panel).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('heading', { name: /ISC 银行总部/ })).toBeInTheDocument();
    expect(screen.getByText('打开银行服务')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '打开银行服务' }));
    expect(onAction).toHaveBeenCalledWith('打开银行服务', bank);
  });

  it('closes with a transition on Escape and stays hidden for non-landmark objects', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { rerender } = render(<LandmarkDetailsPanel building={bank} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('landmark-details-panel')).toHaveAttribute('data-state', 'closing');
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(220);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<LandmarkDetailsPanel building={null} onClose={onClose} />);
    expect(screen.queryByTestId('landmark-details-panel')).toBeNull();
    vi.useRealTimers();
  });
});
