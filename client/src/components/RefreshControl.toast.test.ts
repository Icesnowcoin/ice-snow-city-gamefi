import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRefreshControl } from './RefreshControl';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('RefreshControl Toast Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useRefreshControl with Toast', () => {
    it('should show success toast on successful refresh', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(toast.success).toHaveBeenCalledWith('数据已更新', {
        description: '数据同步成功',
        duration: 3000,
      });
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should show error toast on failed refresh', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const errorMessage = '网络连接失败';
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(toast.error).toHaveBeenCalledWith('数据更新失败', {
        description: errorMessage,
        duration: 4000,
      });
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should use custom toast config when provided', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);
      const customConfig = {
        title: 'NPC 数据已更新',
        successDesc: 'NPC 信息同步成功',
        errorDesc: 'NPC 同步失败',
      };

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn, customConfig);
      });

      expect(toast.success).toHaveBeenCalledWith('NPC 数据已更新', {
        description: 'NPC 信息同步成功',
        duration: 3000,
      });
    });

    it('should use custom error description from config', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValue(new Error('原始错误信息'));
      const customConfig = {
        title: '经济数据已更新',
        successDesc: '经济数据同步成功',
        errorDesc: '经济数据同步失败，请稍后重试',
      };

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn, customConfig);
      });

      expect(toast.error).toHaveBeenCalledWith('数据更新失败', {
        description: '经济数据同步失败，请稍后重试',
        duration: 4000,
      });
    });

    it('should not show toast when showToast is false', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: false }));
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should not show error toast when refresh fails but showToast is false', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: false }));
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValue(new Error('某个错误'));

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(toast.error).not.toHaveBeenCalled();
      expect(result.current.isError).toBe(true);
    });

    it('should handle multiple refreshes with different toast messages', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      // First refresh with default config
      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(toast.success).toHaveBeenCalledWith('数据已更新', {
        description: '数据同步成功',
        duration: 3000,
      });

      vi.clearAllMocks();

      // Second refresh with custom config
      const customConfig = {
        title: '游戏状态已更新',
        successDesc: '游戏状态同步成功',
      };

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn, customConfig);
      });

      expect(toast.success).toHaveBeenCalledWith('游戏状态已更新', {
        description: '游戏状态同步成功',
        duration: 3000,
      });
    });

    it('should update last update time before showing success toast', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);
      const beforeRefresh = new Date();

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.lastUpdateTime).not.toBeNull();
      expect(result.current.lastUpdateTime!.getTime()).toBeGreaterThanOrEqual(
        beforeRefresh.getTime()
      );
      expect(toast.success).toHaveBeenCalled();
    });

    it('should set error state before showing error toast', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const errorMsg = '服务器错误';
      const mockRefreshFn = vi.fn().mockRejectedValue(new Error(errorMsg));

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.errorMessage).toBe(errorMsg);
      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle unknown error type in toast', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi.fn().mockRejectedValue('Unknown error type');

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(toast.error).toHaveBeenCalledWith('数据更新失败', {
        description: '刷新失败，请重试',
        duration: 4000,
      });
    });

    it('should clear error state on successful refresh after error', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined);

      // First refresh - error
      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.isError).toBe(true);
      expect(toast.error).toHaveBeenCalled();

      vi.clearAllMocks();

      // Second refresh - success
      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.errorMessage).toBe('');
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Toast Duration and Behavior', () => {
    it('should use 3000ms duration for success toast', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      const successCall = (toast.success as any).mock.calls[0];
      expect(successCall[1].duration).toBe(3000);
    });

    it('should use 4000ms duration for error toast', async () => {
      const { result } = renderHook(() => useRefreshControl({ showToast: true }));
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValue(new Error('Error'));

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      const errorCall = (toast.error as any).mock.calls[0];
      expect(errorCall[1].duration).toBe(4000);
    });
  });

  describe('Default Toast Configuration', () => {
    it('should use default config when showToast option is not provided', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(toast.success).toHaveBeenCalledWith('数据已更新', {
        description: '数据同步成功',
        duration: 3000,
      });
    });

    it('should use default error config when not provided', async () => {
      const { result } = renderHook(() => useRefreshControl());
      const mockRefreshFn = vi
        .fn()
        .mockRejectedValue(new Error('Default error'));

      await act(async () => {
        await result.current.handleRefresh(mockRefreshFn);
      });

      expect(toast.error).toHaveBeenCalledWith('数据更新失败', {
        description: 'Default error',
        duration: 4000,
      });
    });
  });
});
