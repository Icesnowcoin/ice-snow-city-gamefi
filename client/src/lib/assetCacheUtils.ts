export interface AssetLoadOptions {
  ttlMs?: number;
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface AssetLoadStats {
  cacheHits: number;
  cacheMisses: number;
  loadAttempts: number;
  loadFailures: number;
}

export class AssetCache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly pending = new Map<string, Promise<T>>();
  private readonly stats: AssetLoadStats = { cacheHits: 0, cacheMisses: 0, loadAttempts: 0, loadFailures: 0 };

  constructor(private readonly defaultTtlMs = 5 * 60 * 1000) {}

  getStats(): AssetLoadStats {
    return { ...this.stats };
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      return;
    }
    this.cache.clear();
  }

  async load(key: string, loader: (signal?: AbortSignal) => Promise<T>, options: AssetLoadOptions = {}): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      this.stats.cacheHits += 1;
      return cached.value;
    }
    if (cached) this.cache.delete(key);
    this.stats.cacheMisses += 1;

    const existing = this.pending.get(key);
    if (existing) return existing;

    const retries = Math.max(0, options.retries ?? 2);
    const ttlMs = Math.max(0, options.ttlMs ?? this.defaultTtlMs);
    const promise = this.loadWithRetry(key, loader, options.signal, retries, options.retryDelayMs ?? 100);
    this.pending.set(key, promise);

    try {
      const value = await promise;
      this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    } finally {
      this.pending.delete(key);
    }
  }

  private async loadWithRetry(
    key: string,
    loader: (signal?: AbortSignal) => Promise<T>,
    signal: AbortSignal | undefined,
    retries: number,
    retryDelayMs: number,
  ): Promise<T> {
    let attempt = 0;
    while (true) {
      if (signal?.aborted) throw new DOMException(`Asset load aborted: ${key}`, 'AbortError');
      this.stats.loadAttempts += 1;
      try {
        return await loader(signal);
      } catch (error) {
        if (signal?.aborted) throw error;
        if (attempt >= retries) {
          this.stats.loadFailures += 1;
          throw error;
        }
        attempt += 1;
        if (retryDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
}

export function createAssetCache<T>(defaultTtlMs?: number): AssetCache<T> {
  return new AssetCache<T>(defaultTtlMs);
}
