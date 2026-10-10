import { describe, expect, it, vi } from 'vitest';
import { AssetCache } from './assetCacheUtils';

describe('AssetCache', () => {
  it('deduplicates concurrent loads and serves subsequent requests from cache', async () => {
    const cache = new AssetCache<string>(10_000);
    const loader = vi.fn(async () => 'character-glb');

    const [first, second] = await Promise.all([
      cache.load('character', loader),
      cache.load('character', loader),
    ]);
    const third = await cache.load('character', loader);

    expect(first).toBe('character-glb');
    expect(second).toBe('character-glb');
    expect(third).toBe('character-glb');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.getStats()).toMatchObject({ cacheHits: 1, cacheMisses: 2, loadAttempts: 1 });
  });

  it('retries transient failures and caches the successful result', async () => {
    const cache = new AssetCache<string>();
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce('sticker-texture');

    await expect(cache.load('sticker', loader, { retries: 1, retryDelayMs: 0 })).resolves.toBe('sticker-texture');
    expect(loader).toHaveBeenCalledTimes(2);
    expect(cache.getStats().loadFailures).toBe(0);
  });

  it('expires entries and propagates an abort without retrying', async () => {
    vi.useFakeTimers();
    try {
      const cache = new AssetCache<string>(100);
      const loader = vi.fn(async () => 'environment');
      await cache.load('environment', loader);
      vi.advanceTimersByTime(101);
      expect(cache.has('environment')).toBe(false);

      const controller = new AbortController();
      controller.abort();
      await expect(cache.load('aborted', loader, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
      expect(loader).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
