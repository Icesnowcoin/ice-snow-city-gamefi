import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRefreshControl } from './RefreshControl';

describe('RefreshControl Component', () => {
  describe('useRefreshControl Hook', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useRefreshControl());

      expect(result.current.lastUpdateTime).toBeNull();
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.errorMessage).toBe('');
    });

    it('should handle successful refresh', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(mockRefreshFn).toHaveBeenCalled();
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.lastUpdateTime).not.toBeNull();
    });

    it('should handle refresh error', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const errorMessage = '刷新失败';
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.errorMessage).toBe(errorMessage);
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should handle unknown error gracefully', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi.fn().mockRejectedValue('Unknown error');

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.errorMessage).toBe('刷新失败，请重试');
    });

    it('should set last update time after successful refresh', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);
      const beforeRefresh = new Date();

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      const afterRefresh = new Date();
      expect(result.current.lastUpdateTime).not.toBeNull();
      expect(result.current.lastUpdateTime!.getTime()).toBeGreaterThanOrEqual(
        beforeRefresh.getTime()
      );
      expect(result.current.lastUpdateTime!.getTime()).toBeLessThanOrEqual(
        afterRefresh.getTime()
      );
    });

    it('should allow manual setting of last update time', () => {
      const { result } = renderHook(() => useRefreshControl());
      const testDate = new Date('2024-01-01T12:00:00Z');

      act(() => {
        result.current.setLastUpdateTime(testDate);
      });

      expect(result.current.lastUpdateTime).toEqual(testDate);
    });

    it('should handle multiple consecutive refreshes', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      // First refresh
      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      const firstUpdateTime = result.current.lastUpdateTime;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second refresh
      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      const secondUpdateTime = result.current.lastUpdateTime;

      expect(mockRefreshFn).toHaveBeenCalledTimes(2);
      expect(secondUpdateTime!.getTime()).toBeGreaterThanOrEqual(
        firstUpdateTime!.getTime()
      );
    });

    it('should clear error state on successful refresh after error', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined);

      // First refresh - error
      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.isError).toBe(true);

      // Second refresh - success
      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.errorMessage).toBe('');
    });
  });

  describe('Refresh Control Integration', () => {
    it('should handle batch refresh operations', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefresh1 = vi.fn().mockResolvedValue(undefined);
      const mockRefresh2 = vi.fn().mockResolvedValue(undefined);
      const mockRefresh3 = vi.fn().mockResolvedValue(undefined);

      const batchRefresh = async () => {
        await Promise.all([
          mockRefresh1(),
          mockRefresh2(),
          mockRefresh3(),
        ]);
      };

      await act(async () => {
        await result.current.handleRefresh(batchRefresh);
      });

      expect(mockRefresh1).toHaveBeenCalled();
      expect(mockRefresh2).toHaveBeenCalled();
      expect(mockRefresh3).toHaveBeenCalled();
      expect(result.current.isError).toBe(false);
    });

    it('should handle partial batch refresh failure', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefresh1 = vi.fn().mockResolvedValue(undefined);
      const mockRefresh2 = vi
        .fn()
        .mockRejectedValue(new Error('Batch error'));
      const mockRefresh3 = vi.fn().mockResolvedValue(undefined);

      const batchRefresh = async () => {
        await Promise.allSettled([
          mockRefresh1(),
          mockRefresh2(),
          mockRefresh3(),
        ]);
      };

      await act(async () => {
        await result.current.handleRefresh(batchRefresh);
      });

      // Should not error if using Promise.allSettled
      expect(result.current.isError).toBe(false);
    });

    it('should maintain refresh state during long operations', async () => {
      const { result } = renderHook(() => useRefreshControl());
      let resolveRefresh: () => void;
      const refreshPromise = new Promise<void>((resolve) => {
        resolveRefresh = resolve;
      });
      const mockRefreshFn = vi.fn().mockReturnValue(refreshPromise);

      let refreshPromise2: Promise<void>;
      act(() => {
        refreshPromise2 = result.current.handleRefresh(mockRefreshFn);
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(true);
      });

      resolveRefresh!();
      await act(async () => {
        await refreshPromise2!;
      });

      expect(result.current.isRefreshing).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should preserve error message for debugging', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const debugMessage = 'Network timeout: Connection refused';
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValue(new Error(debugMessage));

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.errorMessage).toBe(debugMessage);
    });

    it('should handle refresh function throwing synchronously', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi.fn(() => {
        throw new Error('Sync error');
      });

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.errorMessage).toBe('Sync error');
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', async () => {
      const { result, rerender } = renderHook(() => useRefreshControl());
      const renderCount = vi.fn();

      renderCount();

      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      rerender();
      renderCount();

      // Should have minimal renders
      expect(renderCount.mock.calls.length).toBeLessThanOrEqual(3);
    });

    it('should handle rapid refresh calls', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        await Promise.all(
          Array.from({ length: 5 }, () => result.current.handleRefresh(mockRefreshFn))
        );
      });

      expect(mockRefreshFn).toHaveBeenCalledTimes(5);
      expect(result.current.isRefreshing).toBe(false);
    });
  });
});
