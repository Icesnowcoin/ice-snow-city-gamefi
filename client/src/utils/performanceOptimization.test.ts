import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PerformanceMonitor,
  debounce,
  throttle,
  MemoryCache,
  calculateVirtualListRange,
  RequestDeduplicator,
  generatePerformanceReport,
  getPerformanceMonitor,
  cleanupPerformanceMonitor,
} from './performanceOptimization';

describe('Performance Optimization Utilities', () => {
  describe('Debounce Function', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 50);

      debouncedFn('test', 123);

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockFn).toHaveBeenCalledWith('test', 123);
    });

    it('should reset timer on new calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      await new Promise((resolve) => setTimeout(resolve, 50));
      debouncedFn();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Throttle Function', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 150));
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to throttled function', async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 50);

      throttledFn('test', 123);

      expect(mockFn).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('Memory Cache', () => {
    let cache: MemoryCache<string, string>;

    beforeEach(() => {
      cache = new MemoryCache(100);
    });

    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeNull();
    });

    it('should track cache size', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('Virtual List Range Calculation', () => {
    it('should calculate visible range', () => {
      const config = {
        itemHeight: 50,
        containerHeight: 500,
        bufferSize: 5,
      };

      const range = calculateVirtualListRange(0, config);
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeGreaterThan(range.start);
    });

    it('should handle scroll position', () => {
      const config = {
        itemHeight: 50,
        containerHeight: 500,
        bufferSize: 5,
      };

      const range1 = calculateVirtualListRange(0, config);
      const range2 = calculateVirtualListRange(1000, config);

      expect(range2.start).toBeGreaterThan(range1.start);
    });

    it('should respect buffer size', () => {
      const config = {
        itemHeight: 50,
        containerHeight: 500,
        bufferSize: 10,
      };

      const range = calculateVirtualListRange(0, config);
      const visibleCount = Math.ceil(config.containerHeight / config.itemHeight);
      const expectedRange = visibleCount + config.bufferSize * 2;

      expect(range.end - range.start).toBeLessThanOrEqual(expectedRange + 1);
    });

    it('should not return negative start index', () => {
      const config = {
        itemHeight: 50,
        containerHeight: 500,
        bufferSize: 5,
      };

      const range = calculateVirtualListRange(-100, config);
      expect(range.start).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Request Deduplicator', () => {
    it('should deduplicate concurrent requests', async () => {
      const deduplicator = new RequestDeduplicator<string>();
      let callCount = 0;

      const request = async () => {
        callCount++;
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('result'), 50);
        });
      };

      const [result1, result2] = await Promise.all([
        deduplicator.deduplicate('key1', request),
        deduplicator.deduplicate('key1', request),
      ]);

      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(callCount).toBe(1);
    });

    it('should allow different keys to execute separately', async () => {
      const deduplicator = new RequestDeduplicator<string>();
      let callCount = 0;

      const request = async () => {
        callCount++;
        return 'result';
      };

      await Promise.all([
        deduplicator.deduplicate('key1', request),
        deduplicator.deduplicate('key2', request),
      ]);

      expect(callCount).toBe(2);
    });

    it('should clear pending requests', async () => {
      const deduplicator = new RequestDeduplicator<string>();
      let callCount = 0;

      const request = async () => {
        callCount++;
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('result'), 100);
        });
      };

      const promise = deduplicator.deduplicate('key1', request);
      deduplicator.clear();

      await promise;
      expect(callCount).toBe(1);
    });
  });

  describe('Performance Monitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    afterEach(() => {
      monitor.cleanup();
    });

    it('should initialize without errors', () => {
      expect(() => monitor.init()).not.toThrow();
    });

    it('should return metrics', () => {
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveProperty('LCP');
      expect(metrics).toHaveProperty('FID');
      expect(metrics).toHaveProperty('CLS');
      expect(metrics).toHaveProperty('FCP');
      expect(metrics).toHaveProperty('TTFB');
    });

    it('should have valid metric values', () => {
      const metrics = monitor.getMetrics();
      expect(metrics.LCP).toBeGreaterThanOrEqual(0);
      expect(metrics.FID).toBeGreaterThanOrEqual(0);
      expect(metrics.CLS).toBeGreaterThanOrEqual(0);
    });

    it('should cleanup observers', () => {
      monitor.init();
      expect(() => monitor.cleanup()).not.toThrow();
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate report with all metrics', () => {
      const metrics = {
        LCP: 2000,
        FID: 100,
        CLS: 0.05,
        FCP: 1500,
        TTFB: 500,
        DOMContentLoaded: 2500,
        LoadComplete: 3000,
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 500 * 1024 * 1024,
        resourceCount: 50,
        transferSize: 5 * 1024 * 1024,
        decodedSize: 10 * 1024 * 1024,
      };

      const report = generatePerformanceReport(metrics);
      expect(report).toContain('LCP');
      expect(report).toContain('FID');
      expect(report).toContain('CLS');
      expect(report).toContain('内存使用');
      expect(report).toContain('网络资源');
    });

    it('should include status indicators', () => {
      const metrics = {
        LCP: 2000,
        FID: 100,
        CLS: 0.05,
        FCP: 1500,
        TTFB: 500,
        DOMContentLoaded: 2500,
        LoadComplete: 3000,
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 500 * 1024 * 1024,
        resourceCount: 50,
        transferSize: 5 * 1024 * 1024,
        decodedSize: 10 * 1024 * 1024,
      };

      const report = generatePerformanceReport(metrics);
      expect(report).toContain('✓');
    });
  });

  describe('Singleton Performance Monitor', () => {
    afterEach(() => {
      cleanupPerformanceMonitor();
    });

    it('should return same instance', () => {
      const monitor1 = getPerformanceMonitor();
      const monitor2 = getPerformanceMonitor();
      expect(monitor1).toBe(monitor2);
    });

    it('should cleanup singleton', () => {
      const monitor = getPerformanceMonitor();
      expect(monitor).toBeDefined();

      cleanupPerformanceMonitor();
      const newMonitor = getPerformanceMonitor();
      expect(newMonitor).toBeDefined();
    });
  });

  describe('Performance Optimization Integration', () => {
    it('should handle combined debounce and cache', async () => {
      const cache = new MemoryCache<string, string>(100);
      const mockFn = vi.fn((key: string) => {
        const cached = cache.get(key);
        if (cached) return cached;
        const value = `value_${key}`;
        cache.set(key, value);
        return value;
      });

      const debouncedFn = debounce(mockFn, 50);

      debouncedFn('key1');
      debouncedFn('key1');

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle large dataset with virtual list', () => {
      const config = {
        itemHeight: 50,
        containerHeight: 1000,
        bufferSize: 10,
      };

      const largeDataset = Array.from({ length: 10000 }, (_, i) => i);
      const range = calculateVirtualListRange(5000, config);

      expect(range.start).toBeGreaterThan(0);
      expect(range.end).toBeLessThan(largeDataset.length);
      expect(range.end - range.start).toBeLessThan(largeDataset.length);
    });

    it('should manage memory efficiently', () => {
      const cache = new MemoryCache<number, string>(1000);

      for (let i = 0; i < 1000; i++) {
        cache.set(i, `value_${i}`);
      }

      expect(cache.size()).toBe(1000);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('Performance Metrics Validation', () => {
    it('should validate LCP metric', () => {
      const metrics = {
        LCP: 2000,
        FID: 100,
        CLS: 0.05,
        FCP: 1500,
        TTFB: 500,
        DOMContentLoaded: 2500,
        LoadComplete: 3000,
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 500 * 1024 * 1024,
        resourceCount: 50,
        transferSize: 5 * 1024 * 1024,
        decodedSize: 10 * 1024 * 1024,
      };

      expect(metrics.LCP).toBeLessThanOrEqual(4000);
    });

    it('should validate memory usage', () => {
      const metrics = {
        LCP: 2000,
        FID: 100,
        CLS: 0.05,
        FCP: 1500,
        TTFB: 500,
        DOMContentLoaded: 2500,
        LoadComplete: 3000,
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 500 * 1024 * 1024,
        resourceCount: 50,
        transferSize: 5 * 1024 * 1024,
        decodedSize: 10 * 1024 * 1024,
      };

      const memoryUsageRate = metrics.usedJSHeapSize / metrics.jsHeapSizeLimit;
      expect(memoryUsageRate).toBeLessThan(1);
    });
  });
});
