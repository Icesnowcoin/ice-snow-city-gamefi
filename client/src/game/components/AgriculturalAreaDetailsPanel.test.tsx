import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgriculturalAreaDetailsPanel } from './AgriculturalAreaDetailsPanel';
import { getAgriculturalArea } from '../map/AgriculturalArea';

describe('AgriculturalAreaDetailsPanel', () => {
  it('shows crop, status, progress and production metrics for a selected area', () => {
    const area = getAgriculturalArea('agri-crystal-market-field');
    render(<AgriculturalAreaDetailsPanel area={area ?? null} onClose={vi.fn()} />);

    expect(screen.getByTestId('agricultural-area-details')).toBeInTheDocument();
    expect(screen.getByText('鸿运温室园')).toBeInTheDocument();
    expect(screen.getByText('极光蔬菜')).toBeInTheDocument();
    expect(screen.getByText('可收获')).toBeInTheDocument();
    expect(screen.getByText('180 箱 / 周期')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByLabelText('生长进度 100%')).toBeInTheDocument();
  });

  it('closes when the close button is clicked', () => {
    const onClose = vi.fn();
    const area = getAgriculturalArea('agri-aurora-field');
    render(<AgriculturalAreaDetailsPanel area={area ?? null} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: '关闭农业区域详情' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
