import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

interface RefreshControlProps {
  onRefresh: () => Promise<void>;
  lastUpdateTime?: Date | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  showLastUpdate?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showToast?: boolean;
  toastTitle?: string;
  toastSuccessDesc?: string;
  toastErrorDesc?: string;
}

/**
 * RefreshControl 组件：提供手动刷新按钮和最后更新时间显示
 * 
 * 特性：
 * - 手动刷新按钮，支持加载状态
 * - 显示最后更新时间（相对时间）
 * - 错误状态提示
 * - 自动更新相对时间显示
 * - 支持自定义样式和大小
 * - Toast 提示通知（成功/失败）
 */
export const RefreshControl: React.FC<RefreshControlProps> = ({
  onRefresh,
  lastUpdateTime,
  isLoading = false,
  isError = false,
  errorMessage,
  showLastUpdate = true,
  className = '',
  size = 'md',
  variant = 'outline',
  showToast = true,
  toastTitle = '数据已更新',
  toastSuccessDesc = '数据同步成功',
  toastErrorDesc = '数据同步失败，请重试',
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('');

  // Update relative time display
  useEffect(() => {
    if (!lastUpdateTime) {
      setDisplayTime('未更新');
      return;
    }

    const updateDisplayTime = () => {
      setDisplayTime(
        formatDistanceToNow(new Date(lastUpdateTime), {
          addSuffix: true,
          locale: zhCN,
        })
      );
    };

    updateDisplayTime();

    // Update every minute
    const interval = setInterval(updateDisplayTime, 60000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      if (showToast) {
        toast.success(toastTitle, {
          description: toastSuccessDesc,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      if (showToast) {
        const errorMsg = error instanceof Error ? error.message : toastErrorDesc;
        toast.error('数据更新失败', {
          description: errorMsg,
          duration: 4000,
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, showToast, toastTitle, toastSuccessDesc, toastErrorDesc]);

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base',
  };

  const isDisabled = isLoading || refreshing;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Refresh Button */}
      <Button
        onClick={handleRefresh}
        disabled={isDisabled}
        variant={variant}
        size="sm"
        className={`${sizeClasses[size]} flex items-center gap-2 transition-all ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'
        } ${isError ? 'border-red-500 text-red-500' : ''}`}
        title={errorMessage || '刷新数据'}
      >
        <RefreshCw
          className={`w-4 h-4 ${refreshing || isLoading ? 'animate-spin' : ''}`}
        />
        <span className="hidden sm:inline">
          {refreshing || isLoading ? '刷新中...' : '刷新'}
        </span>
      </Button>

      {/* Last Update Time */}
      {showLastUpdate && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          <span className="hidden sm:inline">{displayTime}</span>
        </div>
      )}

      {/* Error Indicator */}
      {isError && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" />
          <span className="hidden sm:inline">更新失败</span>
        </div>
      )}
    </div>
  );
};

/**
 * useRefreshControl Hook：管理刷新状态和最后更新时间，支持 Toast 提示
 */
export const useRefreshControl = (options?: { showToast?: boolean }) => {
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const showToast = options?.showToast ?? true;

  const handleRefresh = useCallback(
    async (
      refreshFn: () => Promise<void>,
      toastConfig?: {
        title?: string;
        successDesc?: string;
        errorDesc?: string;
      }
    ) => {
      setIsRefreshing(true);
      setIsError(false);
      setErrorMessage('');

      try {
        await refreshFn();
        setLastUpdateTime(new Date());
        if (showToast) {
          toast.success(toastConfig?.title ?? '数据已更新', {
            description: toastConfig?.successDesc ?? '数据同步成功',
            duration: 3000,
          });
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : '刷新失败，请重试';
        setIsError(true);
        setErrorMessage(errorMsg);
        if (showToast) {
          toast.error('数据更新失败', {
            description: toastConfig?.errorDesc ?? errorMsg,
            duration: 4000,
          });
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  return {
    lastUpdateTime,
    isRefreshing,
    isError,
    errorMessage,
    handleRefresh,
    setLastUpdateTime,
  };
};

/**
 * RefreshControlWithPresets 组件：预设常用刷新场景
 */
interface RefreshControlWithPresetsProps
  extends Omit<RefreshControlProps, 'onRefresh'> {
  onRefresh: () => Promise<void>;
  preset?: 'npc' | 'economy' | 'game-state' | 'custom';
}

export const RefreshControlWithPresets: React.FC<
  RefreshControlWithPresetsProps
> = ({ preset = 'custom', ...props }) => {
  const presetConfigs = {
    npc: {
      showLastUpdate: true,
      variant: 'outline' as const,
      size: 'md' as const,
      showToast: true,
      toastTitle: 'NPC 数据已更新',
      toastSuccessDesc: 'NPC 信息同步成功',
    },
    economy: {
      showLastUpdate: true,
      variant: 'outline' as const,
      size: 'md' as const,
      showToast: true,
      toastTitle: '经济数据已更新',
      toastSuccessDesc: '经济数据同步成功',
    },
    'game-state': {
      showLastUpdate: true,
      variant: 'ghost' as const,
      size: 'sm' as const,
      showToast: true,
      toastTitle: '游戏状态已更新',
      toastSuccessDesc: '游戏状态同步成功',
    },
    custom: {},
  };

  return <RefreshControl {...presetConfigs[preset]} {...props} />;
};

/**
 * RefreshControlGroup 组件：多个刷新控制的组合
 */
interface RefreshControlGroupProps {
  controls: Array<{
    id: string;
    label: string;
    onRefresh: () => Promise<void>;
    lastUpdateTime?: Date | null;
    isLoading?: boolean;
    isError?: boolean;
    toastTitle?: string;
  }>;
  className?: string;
}

export const RefreshControlGroup: React.FC<RefreshControlGroupProps> = ({
  controls,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {controls.map((control) => (
        <div key={control.id} className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{control.label}</span>
          <RefreshControl
            onRefresh={control.onRefresh}
            lastUpdateTime={control.lastUpdateTime}
            isLoading={control.isLoading}
            isError={control.isError}
            showLastUpdate={true}
            size="sm"
            showToast={true}
            toastTitle={control.toastTitle || `${control.label}已更新`}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * AutoRefreshControl 组件：支持自动刷新的刷新控制
 */
interface AutoRefreshControlProps extends RefreshControlProps {
  autoRefreshInterval?: number; // milliseconds, 0 to disable
  onAutoRefreshToggle?: (enabled: boolean) => void;
}

export const AutoRefreshControl: React.FC<AutoRefreshControlProps> = ({
  autoRefreshInterval = 0,
  onAutoRefreshToggle,
  ...props
}) => {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(
    autoRefreshInterval > 0
  );

  useEffect(() => {
    if (!autoRefreshEnabled || autoRefreshInterval <= 0) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await props.onRefresh();
      } catch (error) {
        console.error('Auto refresh failed:', error);
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, autoRefreshInterval, props]);

  const handleToggleAutoRefresh = () => {
    const newState = !autoRefreshEnabled;
    setAutoRefreshEnabled(newState);
    onAutoRefreshToggle?.(newState);
  };

  return (
    <div className="flex items-center gap-2">
      <RefreshControl {...props} />
      <Button
        onClick={handleToggleAutoRefresh}
        variant="ghost"
        size="sm"
        className={`text-xs ${
          autoRefreshEnabled ? 'text-green-500' : 'text-slate-400'
        }`}
        title={autoRefreshEnabled ? '禁用自动刷新' : '启用自动刷新'}
      >
        {autoRefreshEnabled ? '自动刷新中' : '手动刷新'}
      </Button>
    </div>
  );
};

export default RefreshControl;
