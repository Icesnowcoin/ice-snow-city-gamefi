/**
 * 缓存管理模块
 * 提供多层缓存策略和性能优化
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  version?: number;
}

export interface CacheOptions {
  ttl?: number; // Default: 5 minutes
  maxSize?: number; // Default: 100 entries
  strategy?: "LRU" | "LFU" | "FIFO"; // Default: LRU
}

/**
 * 内存缓存管理器
 */
export class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessCount: Map<string, number> = new Map();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes
      maxSize: options.maxSize ?? 100,
      strategy: options.strategy ?? "LRU",
    };
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessCount.delete(key);
      return null;
    }

    // 更新访问计数
    this.accessCount.set(key, (this.accessCount.get(key) ?? 0) + 1);

    return entry.value;
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T, ttl?: number): void {
    // 检查缓存大小
    if (this.cache.size >= this.options.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.options.ttl,
      version: (this.cache.get(key)?.version ?? 0) + 1,
    });

    this.accessCount.set(key, 1);
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    this.accessCount.delete(key);
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.accessCount.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 驱逐缓存条目
   */
  private evict(): void {
    let keyToEvict: string | null = null;

    if (this.options.strategy === "LRU") {
      // 最近最少使用
      let minTimestamp = Infinity;
      this.cache.forEach((entry, key) => {
        if (entry.timestamp < minTimestamp) {
          minTimestamp = entry.timestamp;
          keyToEvict = key;
        }
      });
    } else if (this.options.strategy === "LFU") {
      // 最不经常使用
      let minCount = Infinity;
      this.accessCount.forEach((count, key) => {
        if (count < minCount) {
          minCount = count;
          keyToEvict = key;
        }
      });
    } else {
      // FIFO - 先进先出
      const firstKey = this.cache.keys().next().value;
      keyToEvict = firstKey ?? null;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number;
    maxSize: number;
    entries: Array<{ key: string; accessCount: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      accessCount: this.accessCount.get(key) ?? 0,
      ttl: entry.ttl ?? 0,
    }));

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      entries,
    };
  }
}

/**
 * 本地存储缓存
 */
export class LocalStorageCache {
  private prefix: string;

  constructor(prefix: string = "app_cache_") {
    this.prefix = prefix;
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);

      // 检查是否过期
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error("LocalStorage get error:", error);
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    try {
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.error("LocalStorage set error:", error);
    }
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error("LocalStorage delete error:", error);
    }
  }

  /**
   * 清空缓存
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("LocalStorage clear error:", error);
    }
  }
}

/**
 * 多层缓存管理器
 */
export class MultiLayerCache<T = any> {
  private memoryCache: MemoryCache<T>;
  private storageCache: LocalStorageCache;

  constructor(options: CacheOptions = {}) {
    this.memoryCache = new MemoryCache(options);
    this.storageCache = new LocalStorageCache();
  }

  /**
   * 获取缓存值（先查内存，再查本地存储）
   */
  get(key: string): T | null {
    // 先查内存缓存
    let value = this.memoryCache.get(key);
    if (value !== null) {
      return value;
    }

    // 再查本地存储
    value = this.storageCache.get<T>(key);
    if (value !== null) {
      // 恢复到内存缓存
      this.memoryCache.set(key, value);
      return value;
    }

    return null;
  }

  /**
   * 设置缓存值（同时设置到内存和本地存储）
   */
  set(key: string, value: T, ttl?: number): void {
    this.memoryCache.set(key, value, ttl);
    this.storageCache.set(key, value, ttl);
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    this.storageCache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.memoryCache.clear();
    this.storageCache.clear();
  }
}

/**
 * 全局缓存实例
 */
const globalMemoryCache = new MemoryCache({ maxSize: 200 });
const globalStorageCache = new LocalStorageCache();
const globalMultiLayerCache = new MultiLayerCache({ maxSize: 200 });

/**
 * 获取全局缓存实例
 */
export function getGlobalCache(): MemoryCache {
  return globalMemoryCache;
}

export function getGlobalStorageCache(): LocalStorageCache {
  return globalStorageCache;
}

export function getGlobalMultiLayerCache(): MultiLayerCache {
  return globalMultiLayerCache;
}

/**
 * 缓存装饰器
 */
export function Cacheable(options: { ttl?: number; key?: string } = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`;
      const cached = globalMemoryCache.get(cacheKey);

      if (cached !== null) {
        return cached;
      }

      const result = originalMethod.apply(this, args);
      globalMemoryCache.set(cacheKey, result, options.ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * 异步缓存装饰器
 */
export function AsyncCacheable(options: { ttl?: number; key?: string } = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = options.key || `${target.constructor.name}.${propertyKey}`;
      const cached = globalMemoryCache.get(cacheKey);

      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      globalMemoryCache.set(cacheKey, result, options.ttl);

      return result;
    };

    return descriptor;
  };
}
