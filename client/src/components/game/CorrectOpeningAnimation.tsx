import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CorrectOpeningAnimation.css';

interface CorrectOpeningAnimationProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

export const CorrectOpeningAnimation: React.FC<CorrectOpeningAnimationProps> = ({
  onComplete,
  autoPlay = true,
}) => {
  const [stage, setStage] = useState<'loading' | 'display' | 'complete'>('loading');
  const [progress, setProgress] = useState(0);

  // Loading progress animation
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

  // Stage transitions
  useEffect(() => {
    if (!autoPlay) return;

    const timings = {
      'display': 4000,
    };

    const timer = setTimeout(() => {
      if (stage === 'display') {
        setStage('complete');
        onComplete?.();
      }
    }, timings[stage as keyof typeof timings] || 0);

    return () => clearTimeout(timer);
  }, [stage, autoPlay, onComplete]);

  return (
    <div className="correct-opening-container">
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

        {/* Main Display */}
        {(stage === 'display' || stage === 'complete') && (
          <motion.div
            key="display"
            className="opening-stage display-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Background Image - Full Screen */}
            <motion.div
              className="background-image"
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                backgroundImage: 'url(https://d2sxsxph8kpxj0f.cloudfront.net/manus-storage/IMG_8014_1a271a73.WEBP)',
              }}
            />

            {/* Animated Overlay Effects */}
            <motion.div
              className="glow-effect top-left"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="glow-effect bottom-right"
              animate={{
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />

            {/* Content Overlay */}
            <motion.div
              className="content-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {/* Title Animation */}
              <motion.div
                className="title-section"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
              >
                <h1 className="welcome-text">Welcome to</h1>
                <h2 className="game-title">ICE SNOW CITY</h2>
                <p className="tagline">BUILD YOUR FROZEN EMPIRE</p>
              </motion.div>

              {/* Character Names Animation */}
              <motion.div
                className="character-names"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <div className="name-left">AURORA - ICE SEER</div>
                <div className="name-center">ISC</div>
                <div className="name-right">LEO - ENTREPRENEUR</div>
              </motion.div>
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

export default CorrectOpeningAnimation;
