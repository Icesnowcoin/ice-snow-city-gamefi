/**
 * Performance Benchmark Suite
 * Comprehensive performance testing and analysis for Ice Snow City game
 */

import {
  createPerformanceSnapshot,
  calculateImprovement,
  generatePerformanceReport,
  PerformanceSnapshot,
  PerformanceReport,
} from './performanceReportGenerator';

export interface BenchmarkResult {
  name: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  operationsPerSecond: number;
  success: boolean;
  error?: string;
}

export interface BenchmarkSuite {
  name: string;
  timestamp: string;
  results: BenchmarkResult[];
  summary: {
    totalDuration: number;
    averageOperationsPerSecond: number;
    successRate: number;
    failureCount: number;
  };
}

/**
 * Simulate NPC data fetching without optimization
 */
export async function benchmarkNPCFetchingWithoutOptimization(npcCount: number = 50): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

  try {
    // Simulate individual NPC fetches (no batching, no caching)
    const promises = [];
    for (let i = 0; i < npcCount; i++) {
      promises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            // Simulate network request (100ms per request)
            resolve({ id: `npc_${i}`, data: Math.random() });
          }, 100);
        })
      );
    }

    await Promise.all(promises);

    const duration = performance.now() - startTime;
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      name: 'NPC Fetching (Without Optimization)',
      duration,
      memoryBefore,
      memoryAfter,
      operationsPerSecond: (npcCount / duration) * 1000,
      success: true,
    };
  } catch (error) {
    return {
      name: 'NPC Fetching (Without Optimization)',
      duration: performance.now() - startTime,
      memoryBefore,
      memoryAfter: 0,
      operationsPerSecond: 0,
      success: false,
      error: String(error),
    };
  }
}

/**
 * Simulate NPC data fetching with optimization (batching)
 */
export async function benchmarkNPCFetchingWithOptimization(npcCount: number = 50, batchSize: number = 10): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

  try {
    // Simulate batched NPC fetches
    const batchCount = Math.ceil(npcCount / batchSize);
    const promises = [];

    for (let batch = 0; batch < batchCount; batch++) {
      promises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            // Simulate batch network request (500ms per batch)
            const batchData = [];
            for (let i = 0; i < batchSize && batch * batchSize + i < npcCount; i++) {
              batchData.push({ id: `npc_${batch * batchSize + i}`, data: Math.random() });
            }
            resolve(batchData);
          }, 500);
        })
      );
    }

    await Promise.all(promises);

    const duration = performance.now() - startTime;
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      name: 'NPC Fetching (With Optimization)',
      duration,
      memoryBefore,
      memoryAfter,
      operationsPerSecond: (npcCount / duration) * 1000,
      success: true,
    };
  } catch (error) {
    return {
      name: 'NPC Fetching (With Optimization)',
      duration: performance.now() - startTime,
      memoryBefore,
      memoryAfter: 0,
      operationsPerSecond: 0,
      success: false,
      error: String(error),
    };
  }
}

/**
 * Simulate economy data fetching without caching
 */
export async function benchmarkEconomyDataWithoutCaching(itemCount: number = 100): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

  try {
    // Simulate individual item price fetches (no caching)
    const promises = [];
    for (let i = 0; i < itemCount; i++) {
      promises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            // Simulate network request (50ms per request)
            resolve({ id: `item_${i}`, price: Math.random() * 1000 });
          }, 50);
        })
      );
    }

    await Promise.all(promises);

    const duration = performance.now() - startTime;
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      name: 'Economy Data (Without Caching)',
      duration,
      memoryBefore,
      memoryAfter,
      operationsPerSecond: (itemCount / duration) * 1000,
      success: true,
    };
  } catch (error) {
    return {
      name: 'Economy Data (Without Caching)',
      duration: performance.now() - startTime,
      memoryBefore,
      memoryAfter: 0,
      operationsPerSecond: 0,
      success: false,
      error: String(error),
    };
  }
}

/**
 * Simulate economy data fetching with caching
 */
export async function benchmarkEconomyDataWithCaching(itemCount: number = 100): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
  const cache = new Map();

  try {
    // Simulate item price fetches with caching
    const promises = [];
    for (let i = 0; i < itemCount; i++) {
      const itemId = `item_${i % 20}`; // Only 20 unique items

      if (cache.has(itemId)) {
        // Cache hit - instant return
        promises.push(Promise.resolve(cache.get(itemId)));
      } else {
        // Cache miss - fetch from network
        promises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              const data = { id: itemId, price: Math.random() * 1000 };
              cache.set(itemId, data);
              resolve(data);
            }, 50);
          })
        );
      }
    }

    await Promise.all(promises);

    const duration = performance.now() - startTime;
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      name: 'Economy Data (With Caching)',
      duration,
      memoryBefore,
      memoryAfter,
      operationsPerSecond: (itemCount / duration) * 1000,
      success: true,
    };
  } catch (error) {
    return {
      name: 'Economy Data (With Caching)',
      duration: performance.now() - startTime,
      memoryBefore,
      memoryAfter: 0,
      operationsPerSecond: 0,
      success: false,
      error: String(error),
    };
  }
}

/**
 * Simulate concurrent requests without deduplication
 */
export async function benchmarkConcurrentRequestsWithoutDeduplication(requestCount: number = 100): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

  try {
    // Simulate concurrent requests for same resource (no deduplication)
    const promises = [];
    for (let i = 0; i < requestCount; i++) {
      promises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: Math.random() });
          }, 100);
        })
      );
    }

    await Promise.all(promises);

    const duration = performance.now() - startTime;
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      name: 'Concurrent Requests (Without Deduplication)',
      duration,
      memoryBefore,
      memoryAfter,
      operationsPerSecond: (requestCount / duration) * 1000,
      success: true,
    };
  } catch (error) {
    return {
      name: 'Concurrent Requests (Without Deduplication)',
      duration: performance.now() - startTime,
      memoryBefore,
      memoryAfter: 0,
      operationsPerSecond: 0,
      success: false,
      error: String(error),
    };
  }
}

/**
 * Simulate concurrent requests with deduplication
 */
export async function benchmarkConcurrentRequestsWithDeduplication(requestCount: number = 100): Promise<BenchmarkResult> {
  const startTime = performance.now();
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
  const inFlightRequests = new Map();

  try {
    // Simulate concurrent requests with deduplication
    const promises = [];
    for (let i = 0; i < requestCount; i++) {
      const key = 'shared-resource'; // All requests for same resource

      if (inFlightRequests.has(key)) {
        // Reuse in-flight request
        promises.push(inFlightRequests.get(key));
      } else {
        // Create new request
        const promise = new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: Math.random() });
          }, 100);
        });
        inFlightRequests.set(key, promise);
        promises.push(promise);
      }
    }

    await Promise.all(promises);

    const duration = performance.now() - startTime;
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

    return {
      name: 'Concurrent Requests (With Deduplication)',
      duration,
      memoryBefore,
      memoryAfter,
      operationsPerSecond: (requestCount / duration) * 1000,
      success: true,
    };
  } catch (error) {
    return {
      name: 'Concurrent Requests (With Deduplication)',
      duration: performance.now() - startTime,
      memoryBefore,
      memoryAfter: 0,
      operationsPerSecond: 0,
      success: false,
      error: String(error),
    };
  }
}

/**
 * Run complete benchmark suite
 */
export async function runCompleteBenchmarkSuite(): Promise<BenchmarkSuite> {
  const results: BenchmarkResult[] = [];

  // NPC Fetching Benchmarks
  results.push(await benchmarkNPCFetchingWithoutOptimization(50));
  results.push(await benchmarkNPCFetchingWithOptimization(50, 10));

  // Economy Data Benchmarks
  results.push(await benchmarkEconomyDataWithoutCaching(100));
  results.push(await benchmarkEconomyDataWithCaching(100));

  // Concurrent Request Benchmarks
  results.push(await benchmarkConcurrentRequestsWithoutDeduplication(100));
  results.push(await benchmarkConcurrentRequestsWithDeduplication(100));

  // Calculate summary
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  const averageOperationsPerSecond =
    results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / results.length;

  return {
    name: 'Ice Snow City Performance Benchmark Suite',
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalDuration,
      averageOperationsPerSecond,
      successRate: (successCount / results.length) * 100,
      failureCount,
    },
  };
}

/**
 * Analyze benchmark results and identify bottlenecks
 */
export function analyzeBenchmarkResults(suite: BenchmarkSuite): {
  bottlenecks: string[];
  improvements: string[];
  recommendations: string[];
} {
  const bottlenecks: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  // Find slowest benchmarks
  const sortedByDuration = [...suite.results].sort((a, b) => b.duration - a.duration);

  if (sortedByDuration[0].duration > 5000) {
    bottlenecks.push(`⚠️ Slowest operation: ${sortedByDuration[0].name} (${sortedByDuration[0].duration.toFixed(2)}ms)`);
  }

  // Analyze optimization impact
  const npcWithoutOpt = suite.results.find((r) => r.name.includes('NPC') && r.name.includes('Without'));
  const npcWithOpt = suite.results.find((r) => r.name.includes('NPC') && r.name.includes('With'));

  if (npcWithoutOpt && npcWithOpt) {
    const improvement = ((npcWithoutOpt.duration - npcWithOpt.duration) / npcWithoutOpt.duration) * 100;
    if (improvement > 50) {
      improvements.push(`✅ NPC Fetching: ${improvement.toFixed(2)}% faster with optimization`);
    } else {
      recommendations.push(`⚠️ NPC Fetching optimization only ${improvement.toFixed(2)}% faster - consider further optimization`);
    }
  }

  const economyWithoutCache = suite.results.find((r) => r.name.includes('Economy') && r.name.includes('Without'));
  const economyWithCache = suite.results.find((r) => r.name.includes('Economy') && r.name.includes('With'));

  if (economyWithoutCache && economyWithCache) {
    const improvement = ((economyWithoutCache.duration - economyWithCache.duration) / economyWithoutCache.duration) * 100;
    if (improvement > 30) {
      improvements.push(`✅ Economy Data: ${improvement.toFixed(2)}% faster with caching`);
    } else {
      recommendations.push(`⚠️ Economy Data caching only ${improvement.toFixed(2)}% faster - review caching strategy`);
    }
  }

  const concurrentWithout = suite.results.find((r) => r.name.includes('Concurrent') && r.name.includes('Without'));
  const concurrentWith = suite.results.find((r) => r.name.includes('Concurrent') && r.name.includes('With'));

  if (concurrentWithout && concurrentWith) {
    const improvement = ((concurrentWithout.duration - concurrentWith.duration) / concurrentWithout.duration) * 100;
    if (improvement > 90) {
      improvements.push(`✅ Concurrent Requests: ${improvement.toFixed(2)}% faster with deduplication`);
    } else {
      recommendations.push(`⚠️ Concurrent request deduplication only ${improvement.toFixed(2)}% faster`);
    }
  }

  // Memory analysis
  const memoryIncreases = suite.results.filter((r) => r.memoryAfter > r.memoryBefore);
  if (memoryIncreases.length > 0) {
    bottlenecks.push(`⚠️ ${memoryIncreases.length} operations increased memory usage`);
  }

  // Success rate analysis
  if (suite.summary.failureCount > 0) {
    bottlenecks.push(`⚠️ ${suite.summary.failureCount} benchmark(s) failed`);
  }

  // General recommendations
  if (bottlenecks.length === 0) {
    recommendations.push('✅ No major bottlenecks detected');
  }

  if (suite.summary.averageOperationsPerSecond < 100) {
    recommendations.push('⚠️ Low operations per second - consider implementing request batching');
  }

  return { bottlenecks, improvements, recommendations };
}
