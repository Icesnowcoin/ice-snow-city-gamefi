import React, { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import RealEstatePlacementManager from './RealEstatePlacementManager';

const landPlots = [{ id: 'land-1', name: '商业街土地', width: 12, height: 8 }];

describe('RealEstatePlacementManager', () => {
  it('requires a known ISC balance before confirming placement', () => {
    render(createElement(RealEstatePlacementManager, { landPlots, lang: 'zh' }));

    fireEvent.click(screen.getByRole('button', { name: '确认放置' }));

    expect(screen.getByText('请先连接钱包并刷新 ISC 余额，再确认建造。')).toBeTruthy();
  });

  it('rotates and confirms a valid local placement when balance is sufficient', () => {
    const onConfirmed = vi.fn();
    render(createElement(RealEstatePlacementManager, {
      landPlots,
      iscBalance: 5000,
      lang: 'zh',
      onConfirmed,
    }));

    fireEvent.click(screen.getByRole('button', { name: '90°' }));
    fireEvent.click(screen.getByRole('button', { name: '确认放置' }));

    expect(onConfirmed).toHaveBeenCalledWith(expect.objectContaining({
      landId: 'land-1',
      rotation: 90,
      cost: 1200,
    }));
    expect(screen.getByText(/建筑位置已保存到本地预览/)).toBeTruthy();
  });
});
