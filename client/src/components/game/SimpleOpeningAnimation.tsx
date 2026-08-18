import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SimpleOpeningAnimationProps {
  onComplete?: () => void;
  autoPlay?: boolean;
  duration?: number;
}

// 使用 S3 存储 URL - 确保稳定可靠
const BG_IMAGE_URL = '/manus-storage/IMG_8183_0ee665da.PNG';

export const SimpleOpeningAnimation: React.FC<SimpleOpeningAnimationProps> = ({
  onComplete,
  autoPlay = true,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [autoPlay, duration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url('${BG_IMAGE_URL}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Skip button */}
      <motion.button
        onClick={() => onComplete?.()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          padding: '10px 20px',
          background: 'transparent',
          border: '2px solid rgba(100, 200, 255, 0.5)',
          color: '#64c8ff',
          fontSize: '14px',
          cursor: 'pointer',
          borderRadius: '4px',
          letterSpacing: '1px',
          zIndex: 100,
          transition: 'all 0.3s ease',
        }}
      >
        Skip
      </motion.button>
    </motion.div>
  );
};

export default SimpleOpeningAnimation;
