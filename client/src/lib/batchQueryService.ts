/**
 * Batch Query Service
 * Efficiently batches multiple queries to reduce network overhead
 * and improve performance through request deduplication and coalescing
 */

type BatchCallback<T> = (items: string[]) => Promise<Record<string, T>>;

interface BatchQueueItem<T> {
  id: string;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

/**
 * Creates a batch query executor that coalesces multiple requests into a single batch
 * Useful for fetching multiple NPCs or items in a single network request
 */
export function createBatchQueryExecutor<T>(
  batchFn: BatchCallback<T>,
  options = { batchSize: 10, delayMs: 50 }
) {
  let queue: BatchQueueItem<T>[] = [];
  let timer: NodeJS.Timeout | null = null;

  const executeBatch = async () => {
    if (queue.length === 0) return;

    const batch = queue.splice(0, options.batchSize);
    const ids = batch.map((item) => item.id);

    try {
      const results = await batchFn(ids);

      batch.forEach((item) => {
        const result = results[item.id];
        if (result !== undefined) {
          item.resolve(result);
        } else {
          item.reject(new Error(`No result for id: ${item.id}`));
        }
      });
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      });
    }

    // Process remaining items if any
    if (queue.length > 0) {
      timer = setTimeout(executeBatch, options.delayMs);
    }
  };

  return (id: string): Promise<T> => {
    return new Promise((resolve, reject) => {
      queue.push({ id, resolve, reject });

      // If this is the first item, schedule batch execution
      if (queue.length === 1) {
        timer = setTimeout(executeBatch, options.delayMs);
      }

      // Execute immediately if batch is full
      if (queue.length >= options.batchSize) {
        if (timer) clearTimeout(timer);
        executeBatch();
      }
    });
  };
}

/**
 * Request deduplication cache
 * Caches in-flight requests to avoid duplicate network calls
 */
export class RequestDeduplicationCache<T> {
  private cache: Map<string, Promise<T>> = new Map();
  private resultCache: Map<string, T> = new Map();
  private ttl: number;

  constructor(ttlMs = 5000) {
    this.ttl = ttlMs;
  }

  /**
   * Get or create a request promise
   * If the same key is requested multiple times before the first completes,
   * all requests share the same promise
   */
  async get(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check result cache first
    if (this.resultCache.has(key)) {
      return this.resultCache.get(key)!;
    }

    // Check in-flight requests
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Create new request
    const promise = fetcher().then((result) => {
      // Cache result
      this.resultCache.set(key, result);

      // Clear result cache after TTL
      setTimeout(() => {
        this.resultCache.delete(key);
      }, this.ttl);

      return result;
    });

    this.cache.set(key, promise);

    // Remove from in-flight cache when done
    promise
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        this.cache.delete(key);
      });

    return promise;
  }

  clear() {
    this.cache.clear();
    this.resultCache.clear();
  }
}

/**
 * Query coalescer for combining multiple similar queries
 * Useful for combining multiple NPC queries into a single batch query
 */
type PendingQuery<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

export class QueryCoalescer<T> {
  private pendingQueries: Map<string, PendingQuery<T>> = new Map();
  private batchExecutor: (ids: string[]) => Promise<Record<string, T>>;
  private batchSize: number;
  private delayMs: number;

  constructor(
    batchExecutor: (ids: string[]) => Promise<Record<string, T>>,
    options = { batchSize: 10, delayMs: 50 }
  ) {
    this.batchExecutor = batchExecutor;
    this.batchSize = options.batchSize;
    this.delayMs = options.delayMs;
  }

  /**
   * Queue a query to be executed as part of a batch
   */
  query(id: string): Promise<T> {
    // Return existing pending query if available
    const existing = this.pendingQueries.get(id);
    if (existing) {
      return existing.promise;
    }

    let resolve!: PendingQuery<T>['resolve'];
    let reject!: PendingQuery<T>['reject'];
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
      resolve = promiseResolve;
      reject = promiseReject;
    });
    const pendingQuery: PendingQuery<T> = { promise, resolve, reject };
    this.pendingQueries.set(id, pendingQuery);

    // Schedule batch execution after the coalescing window.
    setTimeout(() => {
      this.executePendingBatch().catch(reject);
    }, this.delayMs);

    // Execute immediately once the batch reaches its size limit.
    if (this.pendingQueries.size >= this.batchSize) {
      this.executePendingBatch().catch(reject);
    }

    return promise;
  }

  private async executePendingBatch() {
    if (this.pendingQueries.size === 0) return;

    const ids = Array.from(this.pendingQueries.keys());
    const pendingQueries = Array.from(this.pendingQueries.values());

    try {
      const results = await this.batchExecutor(ids);

      ids.forEach((id, index) => {
        const result = results[id];
        if (result !== undefined) {
          // Resolve the promise
          pendingQueries[index].resolve(result);
        }
      });
    } catch (error) {
      // Reject all pending promises
      pendingQueries.forEach((pendingQuery) => {
        pendingQuery.reject(error);
      });
    } finally {
      // Clear pending queries
      this.pendingQueries.clear();
    }
  }
}

/**
 * Adaptive request throttler
 * Adjusts request frequency based on network conditions and server response times
 */
export class AdaptiveThrottler {
  private requestTimes: number[] = [];
  private windowSize: number;
  private baseDelay: number;
  private maxDelay: number;

  constructor(options = { windowSize: 10, baseDelay: 100, maxDelay: 5000 }) {
    this.windowSize = options.windowSize;
    this.baseDelay = options.baseDelay;
    this.maxDelay = options.maxDelay;
  }

  /**
   * Calculate adaptive delay based on recent request times
   */
  getAdaptiveDelay(): number {
    if (this.requestTimes.length < this.windowSize) {
      return this.baseDelay;
    }

    // Calculate average request time
    const recentTimes = this.requestTimes.slice(-this.windowSize);
    const avgTime = recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;

    // If average time is high, increase delay
    const delay = Math.min(this.baseDelay + avgTime * 2, this.maxDelay);
    return Math.max(this.baseDelay, delay);
  }

  /**
   * Record a request time
   */
  recordRequestTime(duration: number) {
    this.requestTimes.push(duration);

    // Keep only recent times
    if (this.requestTimes.length > this.windowSize * 2) {
      this.requestTimes = this.requestTimes.slice(-this.windowSize);
    }
  }

  reset() {
    this.requestTimes = [];
  }
}

/**
 * Prefetch strategy manager
 * Intelligently prefetches data based on user behavior patterns
 */
export class PrefetchStrategyManager {
  private prefetchQueue: Set<string> = new Set();
  private prefetchFn: (id: string) => Promise<void>;
  private maxPrefetchSize: number;
  private delayMs: number;

  constructor(
    prefetchFn: (id: string) => Promise<void>,
    options = { maxPrefetchSize: 5, delayMs: 100 }
  ) {
    this.prefetchFn = prefetchFn;
    this.maxPrefetchSize = options.maxPrefetchSize;
    this.delayMs = options.delayMs;
  }

  /**
   * Add items to prefetch queue
   */
  addToPrefetchQueue(ids: string[]) {
    ids.forEach((id) => {
      if (this.prefetchQueue.size < this.maxPrefetchSize) {
        this.prefetchQueue.add(id);
      }
    });

    this.executePrefetch();
  }

  private async executePrefetch() {
    if (this.prefetchQueue.size === 0) return;

    const ids = Array.from(this.prefetchQueue);
    this.prefetchQueue.clear();

    // Stagger prefetch requests
    for (let i = 0; i < ids.length; i++) {
      setTimeout(() => {
        this.prefetchFn(ids[i]).catch((error) => {
          console.warn(`Prefetch failed for ${ids[i]}:`, error);
        });
      }, i * this.delayMs);
    }
  }
}
