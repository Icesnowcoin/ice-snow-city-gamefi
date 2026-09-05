import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface SimpleOpeningAnimationProps {
  onComplete?: () => void;
  autoPlay?: boolean;
  duration?: number;
}

// 用户定稿图 URL
const BG_IMAGE_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663391784042/GrwmpvziGctFlKEe.WEBP';
// 冰雪都市氛围背景音乐
const BGM_URL = '/audio/opening_ambient.wav';

export const SimpleOpeningAnimation: React.FC<SimpleOpeningAnimationProps> = ({
  onComplete,
  autoPlay = true,
  duration = 3000,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [autoPlay, duration, onComplete]);

  // 尝试自动播放背景音乐
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.4;
    audio.loop = true;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.warn('[OpeningBGM] Autoplay prevented by browser policy:', error);
          setIsPlaying(false);
        });
    }

    return () => {
      audio.pause();
    };
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      if (!isPlaying) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

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
      <audio ref={audioRef} src={BGM_URL} preload="auto" />

      {/* 音频静音控制按钮（右下角偏左） */}
      <motion.button
        onClick={toggleMute}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isMuted ? "Unmute background music" : "Mute background music"}
        aria-label={isMuted ? "Unmute background music" : "Mute background music"}
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '120px',
          width: '44px',
          height: '44px',
          background: 'rgba(10, 25, 50, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(100, 200, 255, 0.4)',
          color: '#64c8ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '8px',
          zIndex: 100,
          transition: 'all 0.3s ease',
        }}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </motion.button>

      {/* Skip button */}
      <motion.button
        onClick={() => onComplete?.()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ delay: 0.5 }}
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          padding: '10px 20px',
          background: 'rgba(10, 25, 50, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(100, 200, 255, 0.5)',
          color: '#64c8ff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          borderRadius: '8px',
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
