import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './EnhancedOpeningAnimation.css';

interface EnhancedOpeningAnimationProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

export const EnhancedOpeningAnimation: React.FC<EnhancedOpeningAnimationProps> = ({
  onComplete,
  autoPlay = true,
}) => {
  const [stage, setStage] = useState<'loading' | 'fade-in' | 'title' | 'complete'>('loading');
  const [progress, setProgress] = useState(0);

  // Loading progress animation
  useEffect(() => {
    if (stage !== 'loading') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStage('fade-in'), 500);
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
      'fade-in': 2000,
      'title': 3000,
    };

    const timer = setTimeout(() => {
      if (stage === 'fade-in') setStage('title');
      else if (stage === 'title') {
        setStage('complete');
        onComplete?.();
      }
    }, timings[stage as keyof typeof timings] || 0);

    return () => clearTimeout(timer);
  }, [stage, autoPlay, onComplete]);

  return (
    <div className="enhanced-opening-container">
      <AnimatePresence mode="wait">
        {/* Loading Stage */}
        {stage === 'loading' && (
          <motion.div
            key="loading"
            className="opening-stage loading-stage"
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

        {/* Main Background with Characters */}
        {(stage === 'fade-in' || stage === 'title') && (
          <motion.div
            key="main"
            className="opening-stage main-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Background Image */}
            <motion.div
              className="background-image"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                backgroundImage: 'url(/manus-storage/IMG_8141_2a76b034.PNG)',
              }}
            />

            {/* Overlay for text readability */}
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1 }}
            />

            {/* Title Animation */}
            {stage === 'title' && (
              <motion.div
                className="title-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  className="title-content"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  <motion.h1
                    className="welcome-title"
                    initial={{ letterSpacing: '20px', opacity: 0 }}
                    animate={{ letterSpacing: '2px', opacity: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  >
                    Welcome to
                  </motion.h1>
                  <motion.h2
                    className="game-title"
                    initial={{ letterSpacing: '20px', opacity: 0 }}
                    animate={{ letterSpacing: '2px', opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                  >
                    ICE SNOW CITY
                  </motion.h2>
                  <motion.p
                    className="tagline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Build Your Frozen Empire
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
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

export default EnhancedOpeningAnimation;
