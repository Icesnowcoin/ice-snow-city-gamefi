import { useEffect, useRef, useCallback } from 'react';

/**
 * Performance metrics for monitoring data fetching and rendering
 */
export interface PerformanceMetrics {
  // Network metrics
  totalRequests: number;
  cachedRequests: number;
  batchedRequests: number;
  totalNetworkTime: number;
  avgNetworkTime: number;

  // Rendering metrics
  renderCount: number;
  totalRenderTime: number;
  avgRenderTime: number;

  // Cache metrics
  cacheHitRate: number;
  cacheMissRate: number;

  // Memory metrics
  estimatedMemoryUsage: number;

  // Timestamps
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Hook for monitoring performance metrics during component lifecycle
 */
export function usePerformanceMonitoring(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    totalRequests: 0,
    cachedRequests: 0,
    batchedRequests: 0,
    totalNetworkTime: 0,
    avgNetworkTime: 0,
    renderCount: 0,
    totalRenderTime: 0,
    avgRenderTime: 0,
    cacheHitRate: 0,
    cacheMissRate: 0,
    estimatedMemoryUsage: 0,
    startTime: Date.now(),
    endTime: 0,
    duration: 0,
  });

  const renderStartRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  // Track render performance
  useEffect(() => {
    renderStartRef.current = performance.now();
    renderCountRef.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      metricsRef.current.renderCount = renderCountRef.current;
      metricsRef.current.totalRenderTime += renderTime;
      metricsRef.current.avgRenderTime = metricsRef.current.totalRenderTime / metricsRef.current.renderCount;
    };
  });

  // Record network request
  const recordNetworkRequest = useCallback((duration: number, cached: boolean = false, batched: boolean = false) => {
    metricsRef.current.totalRequests += 1;
    metricsRef.current.totalNetworkTime += duration;
    metricsRef.current.avgNetworkTime = metricsRef.current.totalNetworkTime / metricsRef.current.totalRequests;

    if (cached) {
      metricsRef.current.cachedRequests += 1;
    }
    if (batched) {
      metricsRef.current.batchedRequests += 1;
    }
  }, []);

  // Calculate cache hit rate
  const updateCacheMetrics = useCallback(() => {
    const totalRequests = metricsRef.current.totalRequests;
    if (totalRequests > 0) {
      metricsRef.current.cacheHitRate = (metricsRef.current.cachedRequests / totalRequests) * 100;
      metricsRef.current.cacheMissRate = 100 - metricsRef.current.cacheHitRate;
    }
  }, []);

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const endTime = Date.now();
    return {
      ...metricsRef.current,
      endTime,
      duration: endTime - metricsRef.current.startTime,
    };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      totalRequests: 0,
      cachedRequests: 0,
      batchedRequests: 0,
      totalNetworkTime: 0,
      avgNetworkTime: 0,
      renderCount: 0,
      totalRenderTime: 0,
      avgRenderTime: 0,
      cacheHitRate: 0,
      cacheMissRate: 0,
      estimatedMemoryUsage: 0,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
    };
    renderCountRef.current = 0;
  }, []);

  // Log metrics to console
  const logMetrics = useCallback(() => {
    updateCacheMetrics();
    const metrics = getMetrics();
    console.log(`[${componentName}] Performance Metrics:`, {
      networkMetrics: {
        totalRequests: metrics.totalRequests,
        cachedRequests: metrics.cachedRequests,
        batchedRequests: metrics.batchedRequests,
        avgNetworkTime: `${metrics.avgNetworkTime.toFixed(2)}ms`,
      },
      renderMetrics: {
        renderCount: metrics.renderCount,
        avgRenderTime: `${metrics.avgRenderTime.toFixed(2)}ms`,
      },
      cacheMetrics: {
        cacheHitRate: `${metrics.cacheHitRate.toFixed(2)}%`,
        cacheMissRate: `${metrics.cacheMissRate.toFixed(2)}%`,
      },
      duration: `${metrics.duration}ms`,
    });
  }, [componentName, updateCacheMetrics, getMetrics]);

  return {
    recordNetworkRequest,
    updateCacheMetrics,
    getMetrics,
    resetMetrics,
    logMetrics,
  };
}

/**
 * Hook for measuring network request performance
 */
export function useNetworkPerformance() {
  const requestTimingsRef = useRef<Array<{ url: string; duration: number; timestamp: number }>>([]);

  const recordRequest = useCallback((url: string, duration: number) => {
    requestTimingsRef.current.push({
      url,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last 100 requests
    if (requestTimingsRef.current.length > 100) {
      requestTimingsRef.current = requestTimingsRef.current.slice(-100);
    }
  }, []);

  const getAverageDuration = useCallback((urlPattern?: string): number => {
    const requests = urlPattern
      ? requestTimingsRef.current.filter((r) => r.url.includes(urlPattern))
      : requestTimingsRef.current;

    if (requests.length === 0) return 0;
    return requests.reduce((sum, r) => sum + r.duration, 0) / requests.length;
  }, []);

  const getSlowRequests = useCallback((threshold: number = 1000) => {
    return requestTimingsRef.current.filter((r) => r.duration > threshold);
  }, []);

  const clearHistory = useCallback(() => {
    requestTimingsRef.current = [];
  }, []);

  return {
    recordRequest,
    getAverageDuration,
    getSlowRequests,
    clearHistory,
    getHistory: () => [...requestTimingsRef.current],
  };
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderTimingsRef = useRef<Array<{ duration: number; timestamp: number }>>([]);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();

    return () => {
      const duration = performance.now() - renderStartRef.current;
      renderTimingsRef.current.push({
        duration,
        timestamp: Date.now(),
      });

      // Keep only last 50 renders
      if (renderTimingsRef.current.length > 50) {
        renderTimingsRef.current = renderTimingsRef.current.slice(-50);
      }

      // Log slow renders
      if (duration > 16.67) {
        // 60fps threshold
        console.warn(`[${componentName}] Slow render detected: ${duration.toFixed(2)}ms`);
      }
    };
  });

  const getAverageRenderTime = useCallback((): number => {
    if (renderTimingsRef.current.length === 0) return 0;
    return renderTimingsRef.current.reduce((sum, r) => sum + r.duration, 0) / renderTimingsRef.current.length;
  }, []);

  const getSlowRenders = useCallback((threshold: number = 16.67) => {
    return renderTimingsRef.current.filter((r) => r.duration > threshold);
  }, []);

  return {
    getAverageRenderTime,
    getSlowRenders,
    getHistory: () => [...renderTimingsRef.current],
  };
}

/**
 * Hook for measuring memory usage
 */
export function useMemoryMonitoring() {
  const getMemoryUsage = useCallback((): number => {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
    }
    return 0;
  }, []);

  const getMemoryStats = useCallback(() => {
    if ((performance as any).memory) {
      return {
        usedMemory: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2),
        totalMemory: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2),
        memoryLimit: ((performance as any).memory.jsHeapSizeLimit / 1048576).toFixed(2),
      };
    }
    return null;
  }, []);

  return {
    getMemoryUsage,
    getMemoryStats,
  };
}

/**
 * Global performance monitoring service
 */
export class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private networkRequests: Array<{ url: string; duration: number; timestamp: number }> = [];

  recordComponentMetrics(componentName: string, metrics: PerformanceMetrics) {
    this.metrics.set(componentName, metrics);
  }

  recordNetworkRequest(url: string, duration: number) {
    this.networkRequests.push({
      url,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last 1000 requests
    if (this.networkRequests.length > 1000) {
      this.networkRequests = this.networkRequests.slice(-1000);
    }
  }

  getComponentMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  getAllMetrics() {
    return {
      components: Array.from(this.metrics.entries()).map(([name, metrics]) => ({
        name,
        ...metrics,
      })),
      networkRequests: this.networkRequests,
    };
  }

  getNetworkStats() {
    if (this.networkRequests.length === 0) return null;

    const avgDuration = this.networkRequests.reduce((sum, r) => sum + r.duration, 0) / this.networkRequests.length;
    const slowRequests = this.networkRequests.filter((r) => r.duration > 1000);

    return {
      totalRequests: this.networkRequests.length,
      avgDuration: avgDuration.toFixed(2),
      slowRequests: slowRequests.length,
      slowRequestPercentage: ((slowRequests.length / this.networkRequests.length) * 100).toFixed(2),
    };
  }

  clearMetrics() {
    this.metrics.clear();
    this.networkRequests = [];
  }

  exportMetrics() {
    return JSON.stringify(this.getAllMetrics(), null, 2);
  }
}

// Global instance
export const performanceMonitoringService = new PerformanceMonitoringService();
