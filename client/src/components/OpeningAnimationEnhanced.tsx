import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface OpeningAnimationEnhancedProps {
  onComplete: () => void;
}

export const OpeningAnimationEnhanced: React.FC<OpeningAnimationEnhancedProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'city' | 'logo' | 'complete'>('intro');

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      // 动画分阶段
      if (newProgress < 30) {
        setPhase('intro');
      } else if (newProgress < 60) {
        setPhase('city');
      } else if (newProgress < 90) {
        setPhase('logo');
      } else {
        setPhase('complete');
      }

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
      {/* 背景层 - 城市 */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/opening_modern_ice_city_anime-YU2NoVButHUiD43p29VEUo.webp)',
        }}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{
          scale: phase === 'city' || phase === 'logo' ? 1 : 1.2,
          opacity: phase === 'intro' ? 0 : phase === 'city' || phase === 'logo' ? 1 : 0.8,
        }}
        transition={{ duration: 1 }}
      />

      {/* 粒子效果层 */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/opening_ice_city_particles-HM74YmdHB2NKZ6gCfdJtRy.webp)',
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: phase === 'city' || phase === 'logo' ? 0.6 : 0,
        }}
        transition={{ duration: 1 }}
      />

      {/* 渐变遮罩 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/50"
        animate={{
          opacity: phase === 'complete' ? 1 : 0.3,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* 中央内容 */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: phase === 'logo' || phase === 'complete' ? 1 : 0.8,
          opacity: phase === 'logo' || phase === 'complete' ? 1 : 0,
        }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo 框架 */}
        <motion.div
          className="relative w-48 h-48"
          animate={{
            rotate: phase === 'logo' || phase === 'complete' ? 0 : -45,
            scale: phase === 'logo' || phase === 'complete' ? 1 : 0.5,
          }}
          transition={{ duration: 1 }}
        >
          <motion.img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/opening_ice_city_logo_frame-6MtDtCXGisKPQtmELKxTzU.webp"
            alt="Logo Frame"
            className="absolute inset-0 w-full h-full"
            animate={{
              opacity: phase === 'logo' || phase === 'complete' ? 1 : 0,
            }}
            transition={{ duration: 0.5 }}
          />

          {/* ISC Token Logo */}
          <motion.img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/isc_token_logo.png"
            alt="ISC Token"
            className="absolute inset-0 w-full h-full p-8"
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity },
            }}
          />
        </motion.div>

        {/* 游戏标题 */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: phase === 'logo' || phase === 'complete' ? 1 : 0,
            y: phase === 'logo' || phase === 'complete' ? 0 : 20,
          }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.h1
            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-400 drop-shadow-2xl"
            animate={{
              scale: [1, 1.05, 1],
              textShadow: [
                '0 0 20px rgba(34, 211, 238, 0.5)',
                '0 0 40px rgba(34, 211, 238, 0.8)',
                '0 0 20px rgba(34, 211, 238, 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ICE SNOW CITY
          </motion.h1>
          <motion.p
            className="text-2xl text-cyan-200 drop-shadow-lg font-bold tracking-widest"
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase === 'logo' || phase === 'complete' ? 1 : 0,
            }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            BUILD YOUR EMPIRE
          </motion.p>
        </motion.div>
      </motion.div>

      {/* 进度条 */}
      <motion.div
        className="absolute bottom-16 left-0 right-0 px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-cyan-300/70 font-semibold">
              {phase === 'intro' && '初始化中...'}
              {phase === 'city' && '加载城市...'}
              {phase === 'logo' && '准备就绪...'}
              {phase === 'complete' && '进入游戏...'}
            </span>
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
        </div>
      </motion.div>

      {/* 系统状态提示 */}
      <motion.div
        className="absolute top-8 left-8 text-cyan-300/50 text-xs font-mono space-y-1"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div>SYSTEM READY</div>
        <div>NETWORK CONNECTED</div>
        <div>INITIALIZING...</div>
      </motion.div>

      {/* 跳过按钮 */}
      <motion.button
        onClick={() => {
          setIsComplete(true);
          setTimeout(() => onComplete(), 200);
        }}
        className="absolute top-8 right-8 px-4 py-2 text-xs font-mono text-cyan-300 border border-cyan-300/50 rounded hover:border-cyan-300 hover:bg-cyan-300/10 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        SKIP
      </motion.button>
    </motion.div>
  );
};

export default OpeningAnimationEnhanced;
