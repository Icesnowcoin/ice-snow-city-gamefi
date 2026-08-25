import { toast } from 'sonner';

/**
 * Toast 通知类型
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast 通知选项
 */
export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast 通知服务
 */
export const toastService = {
  /**
   * 成功提示
   */
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
      action: options?.action,
    });
  },

  /**
   * 错误提示
   */
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  /**
   * 信息提示
   */
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      duration: options?.duration || 3000,
      action: options?.action,
    });
  },

  /**
   * 警告提示
   */
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      duration: options?.duration || 3000,
      action: options?.action,
    });
  },

  /**
   * 加载提示（返回 Promise，需要手动关闭）
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * 关闭 Toast
   */
  dismiss: (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  /**
   * 更新 Toast
   */
  update: (toastId: string | number, message: string, type: ToastType = 'info') => {
    toast[type](message, {
      id: toastId,
      duration: 3000,
    });
  },

  /**
   * 异步操作提示（自动处理加载、成功、错误状态）
   */
  async: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const toastId = toast.loading(messages.loading);
      
      promise
        .then((result) => {
          toast.success(messages.success, { id: toastId });
          resolve(result);
        })
        .catch((error) => {
          toast.error(messages.error, { id: toastId });
          reject(error);
        });
    });
  }
};

export default toastService;
