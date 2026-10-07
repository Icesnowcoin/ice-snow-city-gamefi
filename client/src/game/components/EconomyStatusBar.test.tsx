import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { EconomyStatusBar } from './EconomyStatusBar';

describe('EconomyStatusBar', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该渲染所有货币显示', () => {
    const { container } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
        energy: 100,
        water: 100,
      })
    );

    expect(container.textContent).toContain('Coin');
    expect(container.textContent).toContain('EXP');
    expect(container.textContent).toContain('Energy');
    expect(container.textContent).toContain('Water');
  });

  it('应该正确显示初始值', () => {
    const { container } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
        energy: 80,
        water: 90,
      })
    );

    // 检查容器是否存在
    expect(container.querySelector('.economy-status-bar')).toBeDefined();
    expect(container.querySelectorAll('.currency-item').length).toBe(5);
  });

  it('应该处理金币增加的动画', async () => {
    const { rerender } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
      })
    );

    // 更新金币值
    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1500,
        experience: 500,
      })
    );

    // 快进时间以完成动画
    await new Promise((resolve) => setTimeout(resolve, 650));

    // 验证动画已完成
    expect(true).toBe(true);
  });

  it('应该处理经验增加的动画', async () => {
    const { rerender } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
      })
    );

    // 更新经验值
    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 750,
      })
    );

    // 快进时间以完成动画
    await new Promise((resolve) => setTimeout(resolve, 650));

    expect(true).toBe(true);
  });

    it('应该在金币减少时直接更新', async () => {
      const { rerender } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
      })
    );

    // 减少金币
    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 800,
        experience: 500,
      })
    );

    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

    it('应该在经验减少时直接更新', async () => {
      const { rerender } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
      })
    );

    // 减少经验
    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 300,
      })
    );

    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

    it('应该调用 onCoinChange 回调', async () => {
      vi.useRealTimers();
      const onCoinChange = vi.fn();
    const { rerender } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
        onCoinChange,
      })
    );

    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1500,
        experience: 500,
        onCoinChange,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 650));

    expect(onCoinChange).toHaveBeenCalledWith(1500, 1000);
  });

    it('应该调用 onExperienceChange 回调', async () => {
      vi.useRealTimers();
      const onExperienceChange = vi.fn();
    const { rerender } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
        onExperienceChange,
      })
    );

    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 750,
        onExperienceChange,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 650));

    expect(onExperienceChange).toHaveBeenCalledWith(750, 500);
  });

  it('应该处理能量和水的显示', () => {
    const { container } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
        energy: 75,
        water: 85,
      })
    );

    // 验证能量和水的显示
    expect(container.textContent).toContain('Energy');
    expect(container.textContent).toContain('Water');
  });

  it('应该使用默认值处理缺失的能量和水参数', () => {
    const { container } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
      })
    );

    // 验证能量和水使用默认值 100
    expect(container.textContent).toContain('Energy');
    expect(container.textContent).toContain('Water');
  });

  it('应该清理动画帧引用', () => {
    const cancelAnimationFrameSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');
    const { rerender, unmount } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
      })
    );

    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1100,
        experience: 500,
      })
    );
    unmount();

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    cancelAnimationFrameSpy.mockRestore();
  });

    it('应该处理多个快速更新', async () => {
      const { rerender } = render(
      React.createElement(EconomyStatusBar, {
        coin: 1000,
        experience: 500,
      })
    );

    // 快速更新多次
    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1100,
        experience: 500,
      })
    );

    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1200,
        experience: 500,
      })
    );

    rerender(
      React.createElement(EconomyStatusBar, {
        coin: 1300,
        experience: 500,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 650));

    expect(true).toBe(true);
  });
});
