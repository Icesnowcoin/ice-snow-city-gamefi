import { useEffect, useState } from 'react';
import { CheckCircle2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareSuccessFeedbackProps {
  platform: 'twitter' | 'telegram' | 'clipboard' | 'download';
  isVisible: boolean;
  onComplete?: () => void;
}

const platformConfig = {
  twitter: {
    label: 'Twitter',
    color: 'from-blue-500 to-blue-600',
    icon: '𝕏',
  },
  telegram: {
    label: 'Telegram',
    color: 'from-cyan-500 to-cyan-600',
    icon: '✈',
  },
  clipboard: {
    label: '剪贴板',
    color: 'from-green-500 to-green-600',
    icon: '📋',
  },
  download: {
    label: '下载',
    color: 'from-purple-500 to-purple-600',
    icon: '⬇',
  },
};

export const ShareSuccessFeedback: React.FC<ShareSuccessFeedbackProps> = ({
  platform,
  isVisible,
  onComplete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = platformConfig[platform];

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none flex items-center justify-center',
        'transition-opacity duration-300',
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Background blur */}
      <div
        className={cn(
          'absolute inset-0 bg-black/20 backdrop-blur-sm',
          'transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Success animation container */}
      <div className="relative z-10">
        {/* Outer ring animation */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent',
            `bg-gradient-to-r ${config.color}`,
            'animate-pulse'
          )}
          style={{
            width: '120px',
            height: '120px',
            left: '-60px',
            top: '-60px',
            animation: 'ringExpand 1.5s ease-out forwards',
          }}
        />

        {/* Middle ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            width: '100px',
            height: '100px',
            left: '-50px',
            top: '-50px',
            background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))`,
            animation: 'ringExpand 1.5s ease-out 0.2s forwards',
          }}
        />

        {/* Center circle with checkmark */}
        <div
          className={cn(
            'relative w-20 h-20 rounded-full flex items-center justify-center',
            `bg-gradient-to-br ${config.color}`,
            'shadow-lg shadow-slate-900/50',
            'animate-in scale-in-50 duration-500'
          )}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

          {/* Checkmark */}
          <CheckCircle2 className="w-10 h-10 text-white relative z-10" />
        </div>

        {/* Platform label */}
        <div
          className={cn(
            'absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap',
            'text-white font-semibold text-sm',
            'transition-all duration-500',
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
        >
          {config.label} 分享成功！
        </div>
      </div>

      {/* Floating particles */}
      {isAnimating && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/40"
              style={{
                left: '50%',
                top: '50%',
                animation: `float 2s ease-out forwards`,
                animationDelay: `${i * 0.1}s`,
                '--angle': `${(i / 6) * 360}deg`,
              } as React.CSSProperties & { '--angle': string }}
            />
          ))}
        </>
      )}

      <style>{`
        @keyframes ringExpand {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(80px * cos(var(--angle))),
              calc(80px * sin(var(--angle)))
            ) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Compact success indicator for share menu
 */
export const CompactShareSuccess: React.FC<{
  platform: 'twitter' | 'telegram' | 'clipboard' | 'download';
  isVisible: boolean;
}> = ({ platform, isVisible }) => {
  const config = platformConfig[platform];

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        'bg-gradient-to-r from-transparent via-white/10 to-transparent',
        'rounded-md pointer-events-none',
        'animate-in fade-in duration-200'
      )}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-400 animate-bounce" />
        <span className="text-xs font-medium text-green-400">已分享</span>
      </div>
    </div>
  );
};
