import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

/**
 * Splash Screen / Opening Animation Component
 * Displays the Ice Snow City opening animation with the provided image
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: duration / 1000 - 0.5 }}
    >
      {/* Background Image */}
      <motion.img
        src="/manus-storage/IMG_8014_60dcb6ae.WEBP"
        alt="Ice Snow City"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

      {/* Loading Indicator */}
      <motion.div
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Animated Loading Dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 1,
                  delay: i * 0.15,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>

          {/* Loading Text */}
          <motion.p
            className="text-white text-sm font-medium tracking-widest"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ENTERING ICE SNOW CITY...
          </motion.p>
        </div>
      </motion.div>

      {/* Skip Button (appears after 1 second) */}
      <motion.button
        className="absolute top-6 right-6 px-4 py-2 text-white text-sm border border-white/30 rounded hover:border-white/60 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        onClick={() => {
          setIsVisible(false);
          onComplete();
        }}
      >
        SKIP
      </motion.button>
    </motion.div>
  );
};

export default SplashScreen;
