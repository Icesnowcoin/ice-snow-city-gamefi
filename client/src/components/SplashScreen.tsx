import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Complete loading when user data is ready
    if (user) {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        onComplete?.();
      }, 500);
    }
  }, [user, onComplete]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black landscape:flex-row landscape:items-stretch">
      {/* Background image - Full coverage */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663391784042/Qmt32Hr7NUwpPACTV447zQ/splash_opening_isometric-4R4mrWQPF9t8gigphDFvgH.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Content overlay - Optimized for landscape */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 landscape:absolute landscape:left-8 landscape:top-1/2 landscape:transform landscape:-translate-y-1/2 landscape:space-y-6">
        {/* Logo and title */}
        <div className="text-center landscape:text-left">
          <h1 className="text-6xl landscape:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            ISC
          </h1>
          <p className="text-xl landscape:text-lg text-cyan-300 font-light tracking-widest">
            ICE SNOW CITY
          </p>
          <p className="text-sm text-gray-400 mt-2">BUILD YOUR EMPIRE</p>
        </div>

        {/* Loading progress */}
        <div className="w-64 landscape:w-56 space-y-3">
          {/* Progress bar */}
          <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Progress text */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Loading Game Engine</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>

          {/* Loading stages */}
          <div className="space-y-1 mt-4">
            {[
              { label: 'Initializing', threshold: 20 },
              { label: 'Loading Assets', threshold: 50 },
              { label: 'Connecting Network', threshold: 75 },
              { label: 'Ready', threshold: 100 },
            ].map((stage, idx) => (
              <div
                key={idx}
                className={`text-xs transition-colors ${
                  progress >= stage.threshold
                    ? 'text-cyan-400'
                    : 'text-gray-600'
                }`}
              >
                {progress >= stage.threshold ? '✓' : '○'} {stage.label}
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <p className="text-gray-400 text-sm mt-8 text-center landscape:text-left max-w-xs landscape:max-w-none">
          THE ULTIMATE REAL ESTATE TYCOON EXPERIENCE
        </p>
      </div>

      {/* Animated background elements - Only show on landscape */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden landscape:block">
        {/* Floating particles */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0;
          }
        }
        
        @media (orientation: landscape) {
          .landscape\\:flex-row {
            flex-direction: row;
          }
          .landscape\\:items-stretch {
            align-items: stretch;
          }
          .landscape\\:absolute {
            position: absolute;
          }
          .landscape\\:left-8 {
            left: 2rem;
          }
          .landscape\\:top-1/2 {
            top: 50%;
          }
          .landscape\\:transform {
            transform: translateY(-50%);
          }
          .landscape\\:-translate-y-1/2 {
            transform: translateY(-50%);
          }
          .landscape\\:space-y-6 > * + * {
            margin-top: 1.5rem;
          }
          .landscape\\:text-left {
            text-align: left;
          }
          .landscape\\:text-5xl {
            font-size: 3rem;
          }
          .landscape\\:text-lg {
            font-size: 1.125rem;
          }
          .landscape\\:w-56 {
            width: 14rem;
          }
          .landscape\\:block {
            display: block;
          }
          .landscape\\:text-left {
            text-align: left;
          }
          .landscape\\:max-w-none {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};
