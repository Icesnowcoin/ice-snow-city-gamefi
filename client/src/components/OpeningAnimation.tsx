import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface OpeningAnimationProps {
  onComplete: () => void;
}

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsComplete(true);
        setTimeout(() => onComplete(), 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      animate={isComplete ? { opacity: 0 } : { opacity: 1 }}
    >
      {/* 背景图像 - 现代城市和 NPC 角色 */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/opening_animation_modern_city-K5dg2MTLbRxNihz3TVMxtb.webp"
          alt="Ice Snow City - Modern City with NPC Characters"
          className="w-full h-full object-cover"
        />
        {/* 渐变覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      </motion.div>

      {/* 加载进度 */}
      {!isComplete && (
        <motion.div
          className="relative z-10 flex flex-col items-center gap-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.h1
              className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-400 drop-shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ICE SNOW CITY
            </motion.h1>
            <motion.p
              className="text-xl text-cyan-200 drop-shadow-lg font-bold tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              BUILD YOUR FROZEN EMPIRE
            </motion.p>
          </motion.div>

          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-cyan-300/70 font-semibold">Loading...</span>
              <span className="text-sm text-cyan-300/70 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 bg-blue-900/40 rounded-full overflow-hidden border border-cyan-400/30">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 rounded-full shadow-lg shadow-cyan-400/50"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 完成状态 - 显示菜单 */}
      {isComplete && (
        <motion.div
          className="relative z-10 flex flex-col items-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">Welcome to Ice Snow City</h1>
            <p className="text-xl text-cyan-300 drop-shadow-md">Build Your Frozen Empire</p>
          </div>

          <div className="flex flex-col gap-4 items-center">
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              onClick={onComplete}
            >
              Start Game
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
            >
              Tutorial
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-white text-sm">Meet the characters:</p>
            <div className="flex justify-center gap-8 text-xs text-cyan-300">
              <span>✨ Aurora - Ice Seer</span>
              <span>💼 Marcus - Merchant</span>
              <span>🏗️ Yuki - Architect</span>
              <span>💰 Leo - Entrepreneur</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 跳过按钮 */}
      {!isComplete && (
        <motion.button
          className="absolute top-6 right-6 z-20 px-4 py-2 text-white text-sm hover:bg-white/20 rounded transition-colors"
          onClick={() => {
            setProgress(100);
            setIsComplete(true);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Skip
        </motion.button>
      )}
    </motion.div>
  );
};

export default OpeningAnimation;

