import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface EnhancedToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    iconColor: 'text-green-400',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    iconColor: 'text-red-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    iconColor: 'text-yellow-400',
  },
};

export const EnhancedToast: React.FC<EnhancedToastProps> = ({
  id,
  type,
  title,
  description,
  duration = 4000,
  onClose,
  action,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        config.bgColor,
        config.borderColor,
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0',
        'animate-in slide-in-from-right-full'
      )}
      role="alert"
    >
      {/* Progress bar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-1 transition-all duration-100',
          type === 'success' ? 'bg-green-500' : 
          type === 'error' ? 'bg-red-500' :
          type === 'warning' ? 'bg-yellow-500' :
          'bg-blue-500'
        )}
        style={{ width: `${progress}%` }}
      />

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', config.textColor)}>{title}</p>
          {description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{description}</p>
          )}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className={cn(
                'mt-2 text-xs font-medium px-2 py-1 rounded',
                'hover:bg-white/10 transition-colors',
                config.textColor
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shimmer effect on success */}
      {type === 'success' && !isExiting && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            animation: 'shimmer 2s infinite',
          }}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

/**
 * Toast container component for managing multiple toasts
 */
export const ToastContainer: React.FC<{
  toasts: EnhancedToastProps[];
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <EnhancedToast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
