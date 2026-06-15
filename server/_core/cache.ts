/**
 * Caching Strategy Implementation
 * 
 * Provides in-memory caching with TTL for frequently accessed data
 * to improve performance and reduce database queries.
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
  createdAt: number;
}

export interface CacheStats {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  averageHits: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private hitCount = 0;
  private missCount = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize cache service
   */
  initialize(cleanupIntervalMs: number = 300000): void {
    // Run cleanup every 5 minutes by default
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);

    console.log("[Cache] Service initialized with cleanup interval:", cleanupIntervalMs);
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, value: T, ttlMs: number = 300000): void {
    // 5 minutes default TTL
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      hits: 0,
      createdAt: Date.now(),
    });
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }

    // Record hit
    entry.hits++;
    this.hitCount++;

    return entry.value as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = this.hitCount + this.missCount;

    return {
      totalEntries: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      averageHits: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Destroy cache service
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  /**
   * Get cache size in approximate bytes
   */
  getSize(): number {
    let size = 0;
    this.cache.forEach((entry) => {
      size += JSON.stringify(entry.value).length;
    });
    return size;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
}

export function resetCacheService(): void {
  if (cacheService) {
    cacheService.destroy();
  }
  cacheService = null;
}

export default CacheService;
