import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PosterLoadingAnimationProps {
  isLoading: boolean;
  progress?: number;
}

export const PosterLoadingAnimation: React.FC<PosterLoadingAnimationProps> = ({
  isLoading,
  progress = 0,
}) => {
  const { lang } = useLanguage();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full mx-4 space-y-6">
        {/* Animated Poster Icon */}
        <div className="flex justify-center">
          <div className="relative w-24 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/50 overflow-hidden">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            
            {/* Rotating Border */}
            <div className="absolute inset-0 border-2 border-transparent border-t-cyan-400 border-r-blue-400 rounded-lg animate-spin" />
            
            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 animate-pulse">
                  📄
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {lang === 'zh' ? '生成海报中...' : 'Generating Poster...'}
          </h3>
          <p className="text-sm text-slate-400">
            {lang === 'zh'
              ? '请稍候，正在处理您的交易凭证'
              : 'Please wait, processing your receipt'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-right">
            {progress}%
          </p>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Tips */}
        <div className="bg-slate-700/50 border border-slate-600 rounded p-3 text-xs text-slate-300 text-center">
          {lang === 'zh'
            ? '💡 生成高质量海报需要 2-5 秒'
            : '💡 Generating high-quality poster takes 2-5 seconds'}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};
