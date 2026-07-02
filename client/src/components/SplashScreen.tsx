import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);
  const { user } = useAuth();

  const stages = [
    { label: 'Initializing', threshold: 20 },
    { label: 'Loading Assets', threshold: 50 },
    { label: 'Connecting Network', threshold: 75 },
    { label: 'Ready', threshold: 100 },
  ];

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        const newProgress = prev + Math.random() * 30;
        
        // Update current stage based on progress
        const newStage = stages.findIndex(s => newProgress < s.threshold);
        setCurrentStage(newStage === -1 ? stages.length - 1 : newStage);
        
        return newProgress;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Complete loading when user data is ready
    if (user) {
      setProgress(100);
      setCurrentStage(stages.length - 1);
      setTimeout(() => {
        setIsLoading(false);
        onComplete?.();
      }, 800);
    }
  }, [user, onComplete]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-screen opacity-10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Floating particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animation: `float ${4 + Math.random() * 6}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main content - Optimized for landscape */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center px-8 md:px-16">
        {/* Left side - Logo and title (30% on landscape) */}
        <div className="flex-1 flex flex-col items-center md:items-start justify-center space-y-6 mb-8 md:mb-0">
          {/* Animated logo */}
          <div className="text-center md:text-left animate-fade-in">
            <h1 className="text-7xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 mb-3 drop-shadow-lg">
              ISC
            </h1>
            <p className="text-2xl md:text-xl text-cyan-300 font-light tracking-widest">
              ICE SNOW CITY
            </p>
            <p className="text-sm md:text-xs text-gray-400 mt-3 tracking-wider">
              BUILD YOUR EMPIRE
            </p>
          </div>

          {/* Tagline */}
          <p className="text-gray-300 text-base md:text-sm text-center md:text-left max-w-sm font-light leading-relaxed">
            THE ULTIMATE REAL ESTATE TYCOON EXPERIENCE
          </p>
        </div>

        {/* Right side - Loading progress (70% on landscape) */}
        <div className="flex-1 w-full md:w-auto flex flex-col items-center md:items-start justify-center space-y-8">
          {/* Progress bar with glow */}
          <div className="w-full md:w-96 space-y-4">
            {/* Main progress bar */}
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-500 border-opacity-30 shadow-lg shadow-cyan-500/20">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500 ease-out shadow-lg shadow-cyan-400/50"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Progress percentage */}
            <div className="flex justify-between items-center px-2">
              <span className="text-xs text-gray-400 font-light">Loading Game Engine</span>
              <span className="text-sm font-mono text-cyan-400 font-semibold">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Loading stages */}
          <div className="w-full md:w-96 space-y-2">
            {stages.map((stage, idx) => (
              <div
                key={idx}
                className={`flex items-center space-x-3 text-sm transition-all duration-300 ${
                  progress >= stage.threshold
                    ? 'text-cyan-400 opacity-100'
                    : 'text-gray-600 opacity-60'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {progress >= stage.threshold ? (
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 border border-gray-600 rounded-full" />
                  )}
                </div>
                <span className="font-light">{stage.label}</span>
              </div>
            ))}
          </div>

          {/* Loading animation indicator */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-cyan-400 rounded-full"
                  style={{
                    animation: `pulse 1.4s infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <span>Loading...</span>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-120px) translateX(60px);
            opacity: 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        /* Landscape orientation optimizations */
        @media (orientation: landscape) and (max-height: 500px) {
          .text-7xl {
            font-size: 3.5rem;
          }
          .space-y-6 > * + * {
            margin-top: 1rem;
          }
          .space-y-8 > * + * {
            margin-top: 1.5rem;
          }
        }

        /* Mobile portrait */
        @media (orientation: portrait) {
          .md\\:flex-row {
            flex-direction: column;
          }
          .md\\:items-start {
            align-items: center;
          }
          .md\\:text-left {
            text-align: center;
          }
          .md\\:w-96 {
            width: 100%;
          }
          .md\\:px-16 {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }
      `}</style>
    </div>
  );
};
