import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import SimpleOpeningAnimation from '@/components/game/SimpleOpeningAnimation';

export const OpeningPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [showAnimation, setShowAnimation] = useState(true);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    // Navigate to home after animation completes
    setTimeout(() => {
      setLocation('/');
    }, 500);
  };

  if (showAnimation) {
    return <SimpleOpeningAnimation onComplete={handleAnimationComplete} autoPlay={true} duration={3000} />;
  }

  return null;
};

export default OpeningPage;
