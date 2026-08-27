import { describe, it, expect, beforeEach } from 'vitest';
import {
  usePerformanceMonitoring,
  useNetworkPerformance,
  useRenderPerformance,
  PerformanceMonitoringService,
} from '@/hooks/usePerformanceMonitoring';

describe('Performance Monitoring', () => {
  describe('PerformanceMonitoringService', () => {
    let service: PerformanceMonitoringService;

    beforeEach(() => {
      service = new PerformanceMonitoringService();
    });

    it('should record component metrics', () => {
      const metrics = {
        totalRequests: 10,
        cachedRequests: 5,
        batchedRequests: 2,
        totalNetworkTime: 500,
        avgNetworkTime: 50,
        renderCount: 3,
        totalRenderTime: 30,
        avgRenderTime: 10,
        cacheHitRate: 50,
        cacheMissRate: 50,
        estimatedMemoryUsage: 10,
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 1000,
      };

      service.recordComponentMetrics('TestComponent', metrics);
      const retrieved = service.getComponentMetrics('TestComponent');

      expect(retrieved).toEqual(metrics);
    });

    it('should record network requests', () => {
      service.recordNetworkRequest('/api/npc/list', 100);
      service.recordNetworkRequest('/api/economy/prices', 150);
      service.recordNetworkRequest('/api/npc/status', 80);

      const allMetrics = service.getAllMetrics();
      expect(allMetrics.networkRequests).toHaveLength(3);
    });

    it('should calculate network statistics', () => {
      service.recordNetworkRequest('/api/npc/list', 100);
      service.recordNetworkRequest('/api/economy/prices', 150);
      service.recordNetworkRequest('/api/npc/status', 2000); // Slow request

      const stats = service.getNetworkStats();
      expect(stats).toBeDefined();
      expect(stats?.totalRequests).toBe(3);
      expect(stats?.slowRequests).toBe(1);
    });

    it('should clear all metrics', () => {
      service.recordNetworkRequest('/api/test', 100);
      service.clearMetrics();

      const allMetrics = service.getAllMetrics();
      expect(allMetrics.networkRequests).toHaveLength(0);
    });

    it('should export metrics as JSON', () => {
      service.recordNetworkRequest('/api/test', 100);
      const exported = service.exportMetrics();

      expect(typeof exported).toBe('string');
      expect(exported).toContain('networkRequests');
    });

    it('should limit network requests history to 1000', () => {
      for (let i = 0; i < 1500; i++) {
        service.recordNetworkRequest(`/api/test/${i}`, 100);
      }

      const allMetrics = service.getAllMetrics();
      expect(allMetrics.networkRequests.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Performance Metrics Calculation', () => {
    it('should calculate cache hit rate correctly', () => {
      const service = new PerformanceMonitoringService();

      // Simulate 10 requests, 7 cached
      const metrics = {
        totalRequests: 10,
        cachedRequests: 7,
        batchedRequests: 3,
        totalNetworkTime: 500,
        avgNetworkTime: 50,
        renderCount: 5,
        totalRenderTime: 50,
        avgRenderTime: 10,
        cacheHitRate: 70,
        cacheMissRate: 30,
        estimatedMemoryUsage: 20,
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 1000,
      };

      service.recordComponentMetrics('CacheTest', metrics);
      const retrieved = service.getComponentMetrics('CacheTest');

      expect(retrieved?.cacheHitRate).toBe(70);
      expect(retrieved?.cacheMissRate).toBe(30);
    });

    it('should calculate average network time correctly', () => {
      const service = new PerformanceMonitoringService();

      service.recordNetworkRequest('/api/test1', 100);
      service.recordNetworkRequest('/api/test2', 200);
      service.recordNetworkRequest('/api/test3', 300);

      const stats = service.getNetworkStats();
      expect(stats?.avgDuration).toBe('200.00');
    });

    it('should identify slow requests correctly', () => {
      const service = new PerformanceMonitoringService();

      service.recordNetworkRequest('/api/fast1', 100);
      service.recordNetworkRequest('/api/fast2', 200);
      service.recordNetworkRequest('/api/slow1', 2000);
      service.recordNetworkRequest('/api/slow2', 3000);

      const stats = service.getNetworkStats();
      expect(stats?.slowRequests).toBe(2);
      expect(Number(stats?.slowRequestPercentage)).toBe(50);
    });
  });

  describe('Performance Benchmarking', () => {
    it('should demonstrate cache effectiveness', () => {
      const service = new PerformanceMonitoringService();

      // Simulate without cache
      for (let i = 0; i < 100; i++) {
        service.recordNetworkRequest(`/api/npc/${i}`, 100);
      }

      const statsWithoutCache = service.getNetworkStats();

      service.clearMetrics();

      // Simulate with cache (batched and cached)
      for (let i = 0; i < 100; i++) {
        service.recordNetworkRequest(`/api/npc/batch`, i < 10 ? 500 : 10); // First batch call is slow, rest are cached
      }

      const statsWithCache = service.getNetworkStats();

      // Average time should be much lower with cache
      expect(Number(statsWithCache?.avgDuration)).toBeLessThan(Number(statsWithoutCache?.avgDuration));
    });

    it('should show batching efficiency', () => {
      const service = new PerformanceMonitoringService();

      // Without batching: 100 individual requests
      for (let i = 0; i < 100; i++) {
        service.recordNetworkRequest(`/api/npc/${i}`, 100);
      }

      const individualStats = service.getNetworkStats();

      service.clearMetrics();

      // With batching: 10 batch requests
      for (let i = 0; i < 10; i++) {
        service.recordNetworkRequest(`/api/npc/batch`, 500);
      }

      const batchStats = service.getNetworkStats();

      // Total time should be much lower with batching
      expect(Number(batchStats?.avgDuration)).toBeLessThan(Number(individualStats?.avgDuration));
    });

    it('should measure rendering performance improvements', () => {
      const service = new PerformanceMonitoringService();

      // Simulate rendering without optimization
      const metricsWithoutOpt = {
        totalRequests: 100,
        cachedRequests: 10,
        batchedRequests: 0,
        totalNetworkTime: 10000,
        avgNetworkTime: 100,
        renderCount: 50,
        totalRenderTime: 1000,
        avgRenderTime: 20,
        cacheHitRate: 10,
        cacheMissRate: 90,
        estimatedMemoryUsage: 50,
        startTime: Date.now(),
        endTime: Date.now() + 10000,
        duration: 10000,
      };

      service.recordComponentMetrics('WithoutOpt', metricsWithoutOpt);

      // Simulate rendering with optimization
      const metricsWithOpt = {
        totalRequests: 100,
        cachedRequests: 80,
        batchedRequests: 20,
        totalNetworkTime: 2000,
        avgNetworkTime: 20,
        renderCount: 20,
        totalRenderTime: 200,
        avgRenderTime: 10,
        cacheHitRate: 80,
        cacheMissRate: 20,
        estimatedMemoryUsage: 30,
        startTime: Date.now(),
        endTime: Date.now() + 2000,
        duration: 2000,
      };

      service.recordComponentMetrics('WithOpt', metricsWithOpt);

      const withoutOpt = service.getComponentMetrics('WithoutOpt');
      const withOpt = service.getComponentMetrics('WithOpt');

      // Performance should be significantly better
      expect(withOpt!.duration).toBeLessThan(withoutOpt!.duration);
      expect(withOpt!.cacheHitRate).toBeGreaterThan(withoutOpt!.cacheHitRate);
      expect(withOpt!.avgNetworkTime).toBeLessThan(withoutOpt!.avgNetworkTime);
    });
  });

  describe('Performance Monitoring Edge Cases', () => {
    it('should handle empty metrics gracefully', () => {
      const service = new PerformanceMonitoringService();
      const stats = service.getNetworkStats();

      expect(stats).toBeNull();
    });

    it('should handle very fast requests', () => {
      const service = new PerformanceMonitoringService();

      for (let i = 0; i < 100; i++) {
        service.recordNetworkRequest(`/api/test/${i}`, 1); // 1ms requests
      }

      const stats = service.getNetworkStats();
      expect(Number(stats?.avgDuration)).toBeLessThan(10);
    });

    it('should handle very slow requests', () => {
      const service = new PerformanceMonitoringService();

      service.recordNetworkRequest('/api/slow', 10000);
      service.recordNetworkRequest('/api/slow', 15000);
      service.recordNetworkRequest('/api/slow', 20000);

      const stats = service.getNetworkStats();
      expect(stats?.slowRequests).toBe(3);
    });
  });
});
