import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FinalOpeningAnimationProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

const BG_IMAGE_URL = 'https://d2sxsxph8kpxj0f.cloudfront.net/manus-storage/IMG_8014_1a271a73.WEBP';

export const FinalOpeningAnimation: React.FC<FinalOpeningAnimationProps> = ({
  onComplete,
  autoPlay = true,
}) => {
  const [stage, setStage] = useState<'loading' | 'display' | 'complete'>('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stage !== 'loading') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStage('display'), 500);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setTimeout(() => {
      if (stage === 'display') {
        setStage('complete');
        onComplete?.();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [stage, autoPlay, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        {stage === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #0a1a3a 0%, #1a3a5a 50%, #0a2a4a 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '30px',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '80px',
                  height: '80px',
                  border: '4px solid transparent',
                  borderTop: '4px solid #64c8ff',
                  borderRight: '4px solid #64c8ff',
                  borderRadius: '50%',
                }}
              />
              <div style={{ color: '#64c8ff', fontSize: '18px', letterSpacing: '2px' }}>
                Loading Game Engine...
              </div>
              <div style={{ width: '300px', height: '4px', background: 'rgba(100, 200, 255, 0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #64c8ff, #96c8ff)',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <div style={{ color: '#96c8ff', fontSize: '14px' }}>{Math.round(progress)}%</div>
            </div>
          </motion.div>
        )}

        {(stage === 'display' || stage === 'complete') && (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url('${BG_IMAGE_URL}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            {/* Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(10, 26, 58, 0.2)',
                zIndex: 1,
              }}
            />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{
                position: 'relative',
                zIndex: 2,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '40px',
                alignItems: 'center',
              }}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 300,
                    color: '#c0c0c0',
                    margin: 0,
                    letterSpacing: '2px',
                    textShadow: '0 0 20px rgba(100, 200, 255, 0.3)',
                  }}
                >
                  Welcome to
                </h1>
                <h2
                  style={{
                    fontSize: '72px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #64c8ff, #96c8ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0,
                    letterSpacing: '4px',
                    textShadow: '0 0 40px rgba(100, 200, 255, 0.4)',
                  }}
                >
                  ICE SNOW CITY
                </h2>
                <p
                  style={{
                    fontSize: '28px',
                    color: '#ffd700',
                    letterSpacing: '3px',
                    margin: '10px 0 0 0',
                    fontWeight: 300,
                    textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                  }}
                >
                  BUILD YOUR FROZEN EMPIRE
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                style={{
                  display: 'flex',
                  gap: '60px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '16px',
                  color: '#96c8ff',
                  letterSpacing: '2px',
                  fontWeight: 300,
                }}
              >
                <span style={{ opacity: 0.8 }}>AURORA - ICE SEER</span>
                <span style={{ fontSize: '24px', color: '#64c8ff', fontWeight: 'bold' }}>ISC</span>
                <span style={{ opacity: 0.8 }}>LEO - ENTREPRENEUR</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      {stage !== 'complete' && (
        <motion.button
          onClick={() => {
            setStage('complete');
            onComplete?.();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
          transition={{ delay: 1 }}
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
      )}
    </div>
  );
};

export default FinalOpeningAnimation;
