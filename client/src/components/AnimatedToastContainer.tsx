import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Toast 动画配置
 */
export interface ToastAnimationConfig {
  enterDuration: number; // 进入动画时长（毫秒）
  exitDuration: number; // 退出动画时长（毫秒）
  stackSpacing: number; // 堆栈间距（像素）
  maxToasts: number; // 最大同时显示数量
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Toast 项目接口
 */
export interface ToastItem {
  id: string;
  content: React.ReactNode;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // 0 表示不自动关闭
  onClose?: () => void;
}

/**
 * Toast 状态
 */
interface ToastState extends ToastItem {
  isExiting: boolean;
  createdAt: number;
}

/**
 * 默认动画配置
 */
const DEFAULT_ANIMATION_CONFIG: ToastAnimationConfig = {
  enterDuration: 300,
  exitDuration: 200,
  stackSpacing: 12,
  maxToasts: 5,
  position: 'top-right',
};

/**
 * AnimatedToastContainer 组件：支持动画和堆栈的 Toast 容器
 */
export const AnimatedToastContainer: React.FC<{
  config?: Partial<ToastAnimationConfig>;
  initialToasts?: ToastItem[];
}> = ({ config = {}, initialToasts = [] }) => {
  const finalConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };
  const [toasts, setToasts] = useState<ToastState[]>(() =>
    initialToasts.slice(0, finalConfig.maxToasts).map((item) => ({
      ...item,
      id: item.id || `toast-${Date.now()}-${Math.random()}`,
      isExiting: false,
      createdAt: Date.now(),
    }))
  );
  const toastRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const autoCloseTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * 添加 Toast
   */
  const addToast = useCallback(
    (item: ToastItem) => {
      const id = item.id || `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastState = {
        ...item,
        id,
        isExiting: false,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // 如果超过最大数量，移除最旧的
        if (updated.length > finalConfig.maxToasts) {
          const toRemove = updated[0];
          removeToast(toRemove.id);
          return updated.slice(1);
        }
        return updated;
      });

      // 设置自动关闭
      if (item.duration !== 0 && item.duration !== undefined && item.duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, item.duration);
        autoCloseTimers.current.set(id, timer);
      }

      return id;
    },
    [finalConfig.maxToasts]
  );

  /**
   * 移除 Toast
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, isExiting: true } : toast
      )
    );

    // 等待退出动画完成后再删除
    const timer = setTimeout(() => {
      setToasts((prev) => {
        const toastToRemove = prev.find((t) => t.id === id);
        toastToRemove?.onClose?.();
        return prev.filter((toast) => toast.id !== id);
      });
      toastRefs.current.delete(id);
      autoCloseTimers.current.delete(id);
    }, finalConfig.exitDuration);

    return () => clearTimeout(timer);
  }, [finalConfig.exitDuration]);

  /**
   * 清除所有 Toast
   */
  const clearAll = useCallback(() => {
    toasts.forEach((toast) => {
      if (!toast.isExiting) {
        removeToast(toast.id);
      }
    });
  }, [toasts, removeToast]);

  /**
   * 清除自动关闭定时器
   */
  useEffect(() => {
    return () => {
      autoCloseTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  /**
   * 获取位置类名
   */
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 pointer-events-none';
    const positionMap = {
      'top-left': 'top-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
      'bottom-right': 'bottom-4 right-4',
    };
    return `${baseClasses} ${positionMap[finalConfig.position]}`;
  };

  /**
   * 获取 Toast 类型样式
   */
  const getToastTypeClasses = (type: ToastItem['type']) => {
    const typeMap = {
      success: 'bg-green-600 text-white border-green-700',
      error: 'bg-red-600 text-white border-red-700',
      info: 'bg-blue-600 text-white border-blue-700',
      warning: 'bg-yellow-600 text-white border-yellow-700',
    };
    return typeMap[type];
  };

  /**
   * 获取动画类名
   */
  const getAnimationClasses = (toast: ToastState, index: number) => {
    const isBottomPosition = finalConfig.position.startsWith('bottom');
    const offset = index * (60 + finalConfig.stackSpacing); // 60px 是预估的 Toast 高度

    const baseTransform = isBottomPosition
      ? `translateY(${offset}px)`
      : `translateY(-${offset}px)`;

    if (toast.isExiting) {
      return {
        opacity: 0,
        transform: isBottomPosition
          ? `translateY(${offset + 20}px)`
          : `translateY(-${offset + 20}px)`,
        transition: `all ${finalConfig.exitDuration}ms ease-out`,
      };
    }

    return {
      opacity: 1,
      transform: baseTransform,
      transition: `all ${finalConfig.enterDuration}ms cubic-bezier(0.23, 1, 0.32, 1)`,
    };
  };

  // 使用 Portal 渲染到 body
  return createPortal(
    <div className={getPositionClasses()}>
      <div className="flex flex-col gap-0 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            ref={(el) => {
              if (el) toastRefs.current.set(toast.id, el);
            }}
            style={getAnimationClasses(toast, index) as React.CSSProperties}
            className={`
              pointer-events-auto
              rounded-lg
              border
              px-4 py-3
              shadow-lg
              flex items-center justify-between
              gap-3
              ${getToastTypeClasses(toast.type)}
            `}
          >
            <div className="flex-1 text-sm font-medium">{toast.content}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-lg leading-none opacity-70 hover:opacity-100 transition-opacity"
              aria-label="关闭提示"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default AnimatedToastContainer;
