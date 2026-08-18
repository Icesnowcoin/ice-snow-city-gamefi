import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './OpeningAnimation.css';

interface OpeningAnimationProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({
  onComplete,
  autoPlay = true,
}) => {
  const [stage, setStage] = useState<'loading' | 'logo' | 'title' | 'characters' | 'complete'>('loading');
  const [progress, setProgress] = useState(0);

  // Loading progress animation
  useEffect(() => {
    if (stage !== 'loading') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStage('logo'), 500);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [stage]);

  // Stage transitions
  useEffect(() => {
    if (!autoPlay) return;

    const timings = {
      logo: 2000,
      title: 2500,
      characters: 3000,
    };

    const timer = setTimeout(() => {
      if (stage === 'logo') setStage('title');
      else if (stage === 'title') setStage('characters');
      else if (stage === 'characters') {
        setStage('complete');
        onComplete?.();
      }
    }, timings[stage as keyof typeof timings] || 0);

    return () => clearTimeout(timer);
  }, [stage, autoPlay, onComplete]);

  return (
    <div className="opening-animation-container">
      <AnimatePresence mode="wait">
        {/* Loading Stage */}
        {stage === 'loading' && (
          <motion.div
            key="loading"
            className="stage loading-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="loading-content">
              <div className="loading-spinner">
                <motion.div
                  className="spinner-ring"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <div className="loading-text">Loading Game Engine...</div>
              <div className="progress-bar-container">
                <motion.div
                  className="progress-bar"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="progress-text">{Math.round(progress)}%</div>
            </div>
          </motion.div>
        )}

        {/* Logo Stage */}
        {stage === 'logo' && (
          <motion.div
            key="logo"
            className="stage logo-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="logo-container"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <motion.div
                className="logo-glow"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(100, 200, 255, 0.5)',
                    '0 0 40px rgba(100, 200, 255, 0.8)',
                    '0 0 20px rgba(100, 200, 255, 0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="logo-text">ISC</div>
              </motion.div>
              <motion.div
                className="logo-subtitle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                ICE SNOW CITY
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Title Stage */}
        {stage === 'title' && (
          <motion.div
            key="title"
            className="stage title-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="title-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.h1
                className="main-title"
                initial={{ letterSpacing: '20px', opacity: 0 }}
                animate={{ letterSpacing: '2px', opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                BUILD YOUR
              </motion.h1>
              <motion.h2
                className="subtitle-title"
                initial={{ letterSpacing: '20px', opacity: 0 }}
                animate={{ letterSpacing: '2px', opacity: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
              >
                FROZEN EMPIRE
              </motion.h2>
              <motion.p
                className="tagline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                THE ULTIMATE REAL ESTATE TYCOON EXPERIENCE
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* Characters Stage */}
        {stage === 'characters' && (
          <motion.div
            key="characters"
            className="stage characters-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="characters-container">
              {/* Aurora Character */}
              <motion.div
                className="character aurora"
                initial={{ x: -100, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <motion.div
                  className="character-glow"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(150, 200, 255, 0.4)',
                      '0 0 40px rgba(150, 200, 255, 0.8)',
                      '0 0 20px rgba(150, 200, 255, 0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="character-placeholder">❄️</div>
                </motion.div>
                <div className="character-name">Aurora</div>
                <div className="character-role">The Seer of Ice</div>
              </motion.div>

              {/* Marcus Character */}
              <motion.div
                className="character marcus"
                initial={{ y: 100, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              >
                <motion.div
                  className="character-glow"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(100, 150, 255, 0.4)',
                      '0 0 40px rgba(100, 150, 255, 0.8)',
                      '0 0 20px rgba(100, 150, 255, 0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                >
                  <div className="character-placeholder">💼</div>
                </motion.div>
                <div className="character-name">Marcus</div>
                <div className="character-role">Merchant</div>
              </motion.div>

              {/* ISC Logo Center */}
              <motion.div
                className="center-logo"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
              >
                <div className="logo-center">ISC</div>
              </motion.div>

              {/* Yuki Character */}
              <motion.div
                className="character yuki"
                initial={{ x: 100, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              >
                <motion.div
                  className="character-glow"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(100, 200, 255, 0.4)',
                      '0 0 40px rgba(100, 200, 255, 0.8)',
                      '0 0 20px rgba(100, 200, 255, 0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                >
                  <div className="character-placeholder">🎨</div>
                </motion.div>
                <div className="character-name">Yuki</div>
                <div className="character-role">Designer</div>
              </motion.div>

              {/* Leo Character */}
              <motion.div
                className="character leo"
                initial={{ y: 100, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              >
                <motion.div
                  className="character-glow"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(150, 200, 255, 0.4)',
                      '0 0 40px rgba(150, 200, 255, 0.8)',
                      '0 0 20px rgba(150, 200, 255, 0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                >
                  <div className="character-placeholder">💡</div>
                </motion.div>
                <div className="character-name">Leo</div>
                <div className="character-role">Entrepreneur</div>
              </motion.div>
            </div>

            {/* Bottom tagline */}
            <motion.div
              className="bottom-tagline"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p>Welcome to the Frozen Empire</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      {stage !== 'complete' && (
        <motion.button
          className="skip-button"
          onClick={() => {
            setStage('complete');
            onComplete?.();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Skip
        </motion.button>
      )}
    </div>
  );
};

export default OpeningAnimation;
