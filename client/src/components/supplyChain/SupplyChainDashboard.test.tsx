import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SupplyChainDashboard from './SupplyChainDashboard';

describe('SupplyChainDashboard', () => {
  it('renders supply chain summaries and selected node details', () => {
    render(<SupplyChainDashboard careerExperience={900} />);

    expect(screen.getByRole('heading', { name: '城市供应链与岗位中枢' })).toBeInTheDocument();
    expect(screen.getByText('北区蔬菜大棚')).toBeInTheDocument();
    expect(screen.getByText('熟练工')).toBeInTheDocument();
    expect(screen.getByText('当前输出 92 / 120 · 蔬菜')).toBeInTheDocument();
  });

  it('switches selected nodes and starts a work preview with the chosen hours', () => {
    const onStartWork = vi.fn();
    render(<SupplyChainDashboard onStartWork={onStartWork} />);

    fireEvent.click(screen.getByRole('button', { name: /冬日集市摊贩/ }));
    expect(screen.getByText('当前输出 71 / 100 · 生鲜零售')).toBeInTheDocument();

    const slider = screen.getByLabelText('工作时长：8 小时');
    fireEvent.change(slider, { target: { value: '12' } });
    expect(screen.getByLabelText('工作时长：12 小时')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /选择该工时并开始工作/ }));
    expect(onStartWork).toHaveBeenCalledWith(12);
    expect(screen.getByRole('button', { name: /岗位已提交/ })).toBeDisabled();
  });
});
