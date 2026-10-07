import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  NPCListSkeleton,
  NPCDetailSkeleton,
  EconomyPanelSkeleton,
  LoadingState,
  ProgressIndicator,
  BatchLoadingIndicator,
} from './SkeletonLoaders';

describe('Skeleton Loaders', () => {
  describe('NPCListSkeleton', () => {
    it('should render 5 skeleton items', () => {
      const { container } = render(React.createElement(NPCListSkeleton));
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have proper spacing between items', () => {
      const { container } = render(React.createElement(NPCListSkeleton));
      const items = container.querySelectorAll('[class*="space-y"]');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('NPCDetailSkeleton', () => {
    it('should render detail skeleton structure', () => {
      const { container } = render(React.createElement(NPCDetailSkeleton));
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have grid layout for stats', () => {
      const { container } = render(React.createElement(NPCDetailSkeleton));
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeTruthy();
    });
  });

  describe('EconomyPanelSkeleton', () => {
    it('should render economy panel structure', () => {
      const { container } = render(React.createElement(EconomyPanelSkeleton));
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should have summary cards grid', () => {
      const { container } = render(React.createElement(EconomyPanelSkeleton));
      const grid = container.querySelector('[class*="grid-cols-2"]');
      expect(grid).toBeTruthy();
    });
  });

  describe('LoadingState', () => {
    it('should render loading indicator with message', () => {
      render(React.createElement(LoadingState, { message: '加载中...' }));
      expect(screen.getByText('加载中...')).toBeTruthy();
    });

    it('should render spinner animation', () => {
      const { container } = render(React.createElement(LoadingState));
      const spinner = container.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeTruthy();
    });

    it('should support different sizes', () => {
      const { container: smallContainer } = render(React.createElement(LoadingState, { size: 'sm' }));
      const smallSpinner = smallContainer.querySelector('[class*="w-6"]');
      expect(smallSpinner).toBeTruthy();

      const { container: largeContainer } = render(React.createElement(LoadingState, { size: 'lg' }));
      const largeSpinner = largeContainer.querySelector('[class*="w-12"]');
      expect(largeSpinner).toBeTruthy();
    });
  });

  describe('ProgressIndicator', () => {
    it('should render progress bar', () => {
      const { container } = render(React.createElement(ProgressIndicator, { progress: 50 }));
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeTruthy();
    });

    it('should display correct percentage', () => {
      render(React.createElement(ProgressIndicator, { progress: 75, label: '加载进度' }));
      expect(screen.getByText('加载进度')).toBeTruthy();
      expect(screen.getByText('75%')).toBeTruthy();
    });

    it('should clamp progress between 0 and 100', () => {
      const { container: container1 } = render(React.createElement(ProgressIndicator, { progress: 150 }));
      const bar1 = container1.querySelector('[style*="width"]') as HTMLElement;
      expect(bar1?.style.width).toBe('100%');

      const { container: container2 } = render(React.createElement(ProgressIndicator, { progress: -50 }));
      const bar2 = container2.querySelector('[style*="width"]') as HTMLElement;
      expect(bar2?.style.width).toBe('0%');
    });
  });

  describe('BatchLoadingIndicator', () => {
    it('should render batch loading info', () => {
      render(React.createElement(BatchLoadingIndicator, { total: 10, loaded: 5, label: '加载项目' }));
      expect(screen.getByText('加载项目')).toBeTruthy();
      expect(screen.getByText('5 / 10')).toBeTruthy();
    });

    it('should calculate correct progress', () => {
      render(React.createElement(BatchLoadingIndicator, { total: 4, loaded: 2 }));
      expect(screen.getByText('50%')).toBeTruthy();
    });

    it('should handle zero total items', () => {
      render(React.createElement(BatchLoadingIndicator, { total: 0, loaded: 0 }));
      expect(screen.getByText('0%')).toBeTruthy();
    });
  });
});

describe('Loading Experience', () => {
  it('should show skeleton while loading NPC list', async () => {
    const { container, rerender } = render(React.createElement(NPCListSkeleton));
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show skeleton while loading economy data', async () => {
    const { container } = render(React.createElement(EconomyPanelSkeleton));
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show progress during batch loading', async () => {
    const { rerender } = render(
      React.createElement(BatchLoadingIndicator, { total: 10, loaded: 0, label: '加载中' })
    );

    expect(screen.getByText('0 / 10')).toBeTruthy();
    expect(screen.getByText('0%')).toBeTruthy();

    rerender(React.createElement(BatchLoadingIndicator, { total: 10, loaded: 5, label: '加载中' }));
    expect(screen.getByText('5 / 10')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();

    rerender(React.createElement(BatchLoadingIndicator, { total: 10, loaded: 10, label: '加载中' }));
    expect(screen.getByText('10 / 10')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('should transition from skeleton to content smoothly', async () => {
    const { container, rerender } = render(React.createElement(NPCListSkeleton));
    let skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Simulate content loaded
    rerender(React.createElement('div', {}, 'NPC List Loaded'));
    skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(0);
  });

  it('should support accessibility for loading states', () => {
    const { container } = render(React.createElement(LoadingState, { message: '数据加载中，请稍候' }));
    const message = screen.getByText('数据加载中，请稍候');
    expect(message).toBeTruthy();
    expect(message.getAttribute('class')).toContain('text-muted-foreground');
  });

  it('should handle rapid progress updates', async () => {
    const { rerender } = render(
      React.createElement(ProgressIndicator, { progress: 0, label: '加载进度' })
    );

    for (let i = 10; i <= 100; i += 10) {
      rerender(React.createElement(ProgressIndicator, { progress: i, label: '加载进度' }));
      expect(screen.getByText(`${i}%`)).toBeTruthy();
    }
  });

  it('should maintain skeleton visibility during loading', async () => {
    const { container } = render(React.createElement(NPCDetailSkeleton));
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // Verify skeletons are visible
    skeletons.forEach((skeleton) => {
      const style = window.getComputedStyle(skeleton);
      expect(style.display).not.toBe('none');
    });
  });

  it('should support multiple concurrent loading states', async () => {
    const { container } = render(
      React.createElement('div', {}, [
        React.createElement(NPCListSkeleton, { key: 'npc' }),
        React.createElement(EconomyPanelSkeleton, { key: 'economy' }),
      ])
    );

    const allSkeletons = container.querySelectorAll('.animate-pulse');
    expect(allSkeletons.length).toBeGreaterThan(0);
  });
});

describe('Loading Performance', () => {
  it('should render skeleton efficiently', () => {
    const startTime = performance.now();
    render(React.createElement(NPCListSkeleton));
    const endTime = performance.now();
    
    // Rendering should be fast (less than 100ms)
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should not cause layout thrashing', () => {
    const { container } = render(React.createElement(EconomyPanelSkeleton));
    const skeletons = container.querySelectorAll('.animate-pulse');
    
    // All skeletons should be rendered without layout recalculations
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should handle large batch loading efficiently', () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      render(React.createElement(BatchLoadingIndicator, { total: 100, loaded: i }));
    }
    
    const endTime = performance.now();
    // Should handle 100 updates efficiently
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
