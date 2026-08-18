import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // 当用户数据准备好时完成加载
    if (user) {
      // 最少显示 1 秒的加载屏幕
      setTimeout(() => {
        setIsLoading(false);
        onComplete?.();
        console.log('[SplashScreen] Splash screen hidden, user authenticated');
      }, 1000);
    }
  }, [user, onComplete]);

  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      {/* 简单的加载指示器 */}
      <div className="flex flex-col items-center space-y-6">
        {/* 加载动画 */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
        </div>
        
        {/* 加载文本 */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-cyan-300">Ice Snow City</h2>
          <p className="text-sm text-cyan-200/70">Initializing...</p>
        </div>
      </div>

      {/* 可选：背景图片预加载（不阻塞 UI） */}
      <img
        src="/manus-storage/IMG_8183_0ee665da.PNG"
        alt=""
        style={{ display: 'none' }}
        onLoad={() => console.log('[SplashScreen] Background image preloaded')}
        onError={() => console.warn('[SplashScreen] Background image failed to load')}
      />
    </div>
  );
};

export default SplashScreen;
