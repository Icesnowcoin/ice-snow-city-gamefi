import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ISCLogo } from "./ISCLogo";
import NetworkStatusIndicator from "./NetworkStatusIndicator";

interface SplashScreenProps {
  onComplete?: () => void;
}

type SnowflakeKind = "normal" | "golden";

interface SnowflakePosition {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  kind: SnowflakeKind;
}

interface SnowflakeBurst {
  id: number;
  left: number;
  top: number;
  kind: SnowflakeKind;
  points: number;
}

const HERO_IMAGE_URL = "/manus-storage/isc_opening_hero_recomposed_v2_48a42ac8.webp";
const AUTH_TIMEOUT_MS = 10_000;
const ENTER_TRANSITION_MS = 420;
const STATUS_MESSAGES = [
  "正在载入商业帝国主视觉…",
  "正在连接冰雪都市…",
  "正在校验安全会话…",
  "正在同步城市核心…",
];

const SNOWFLAKES: SnowflakePosition[] = [
  { id: 1, left: 13, top: 20, size: 1.15, delay: 0, kind: "normal" },
  { id: 2, left: 27, top: 68, size: 0.92, delay: 480, kind: "normal" },
  { id: 3, left: 74, top: 19, size: 1.05, delay: 920, kind: "golden" },
  { id: 4, left: 87, top: 66, size: 0.86, delay: 220, kind: "normal" },
  { id: 5, left: 18, top: 43, size: 0.72, delay: 720, kind: "normal" },
  { id: 6, left: 82, top: 39, size: 0.78, delay: 1180, kind: "normal" },
  { id: 7, left: 43, top: 17, size: 0.68, delay: 340, kind: "golden" },
  { id: 8, left: 60, top: 78, size: 0.78, delay: 800, kind: "normal" },
];

const PARTICLES = [
  { x: -30, y: -22, rotate: -55 },
  { x: 0, y: -38, rotate: 0 },
  { x: 30, y: -22, rotate: 55 },
  { x: 38, y: 8, rotate: 95 },
  { x: 22, y: 32, rotate: 135 },
  { x: -22, y: 32, rotate: -135 },
  { x: -38, y: 8, rotate: -95 },
  { x: -10, y: 4, rotate: 25 },
];

const GOLD_PARTICLES = [
  ...PARTICLES,
  { x: 0, y: 44, rotate: 180 },
  { x: -44, y: -8, rotate: -90 },
  { x: 44, y: -8, rotate: 90 },
  { x: 0, y: 0, rotate: 45 },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [progress, setProgress] = useState(8);
  const [statusIndex, setStatusIndex] = useState(0);
  const [bursts, setBursts] = useState<SnowflakeBurst[]>([]);
  const [snowflakeCount, setSnowflakeCount] = useState(0);
  const [snowflakeScore, setSnowflakeScore] = useState(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  const { user, loading: authLoading, error: authError, refresh } = useAuth();
  const burstSequence = useRef(0);
  const snowflakeCountRef = useRef(0);
  const snowflakeScoreRef = useRef(0);
  const burstTimers = useRef<number[]>([]);
  const milestoneTimer = useRef<number | null>(null);
  const enterTimer = useRef<number | null>(null);

  const authSettled = authLoading === false || typeof authLoading === "undefined";
  const isReadyToEnter = authSettled && !isTimedOut && !authError;
  const statusMessage = isTimedOut
    ? "连接超时，请检查网络后重新连接"
    : authError
      ? "安全会话暂时不可用，请重新连接"
      : isRetrying
        ? "正在重新连接冰雪都市…"
        : STATUS_MESSAGES[statusIndex];

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (isTimedOut) return current;
        if (isReadyToEnter) return 100;
        return Math.min(current + 2, 92);
      });
    }, 140);

    return () => window.clearInterval(progressTimer);
  }, [isReadyToEnter, isTimedOut]);

  useEffect(() => {
    if (isTimedOut || isRetrying) return;
    const messageTimer = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % STATUS_MESSAGES.length);
    }, 1_800);
    return () => window.clearInterval(messageTimer);
  }, [isRetrying, isTimedOut]);

  useEffect(() => {
    if (!authLoading) return;
    const timeoutTimer = window.setTimeout(() => {
      setIsTimedOut(true);
    }, AUTH_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutTimer);
  }, [authLoading, isRetrying]);

  useEffect(() => {
    return () => {
      burstTimers.current.forEach((timer) => window.clearTimeout(timer));
      burstTimers.current = [];
      if (milestoneTimer.current !== null) window.clearTimeout(milestoneTimer.current);
      if (enterTimer.current !== null) window.clearTimeout(enterTimer.current);
    };
  }, []);

  const handleReconnect = async () => {
    setIsRetrying(true);
    setIsTimedOut(false);
    setProgress(8);
    try {
      await refresh?.();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleEnterGame = () => {
    if (!isReadyToEnter || isEntering) return;
    setIsEntering(true);
    enterTimer.current = window.setTimeout(() => {
      setIsLoading(false);
      onComplete?.();
    }, ENTER_TRANSITION_MS);
  };

  const handleSnowflakeClick = (snowflake: SnowflakePosition) => {
    const burstId = ++burstSequence.current;
    const points = snowflake.kind === "golden" ? 5 : 1;
    const nextCount = snowflakeCountRef.current + 1;
    const nextScore = snowflakeScoreRef.current + points;
    snowflakeCountRef.current = nextCount;
    snowflakeScoreRef.current = nextScore;
    setSnowflakeCount(nextCount);
    setSnowflakeScore(nextScore);

    if (nextCount % 5 === 0) {
      setMilestone(nextCount);
      if (milestoneTimer.current !== null) window.clearTimeout(milestoneTimer.current);
      milestoneTimer.current = window.setTimeout(() => {
        setMilestone(null);
        milestoneTimer.current = null;
      }, 1_200);
    }

    setBursts((current) => [
      ...current.slice(-2),
      { id: burstId, left: snowflake.left, top: snowflake.top, kind: snowflake.kind, points },
    ]);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(snowflake.kind === "golden" ? [12, 24, 18] : 12);
    }

    const timer = window.setTimeout(() => {
      setBursts((current) => current.filter((burst) => burst.id !== burstId));
      burstTimers.current = burstTimers.current.filter((active) => active !== timer);
    }, snowflake.kind === "golden" ? 900 : 720);
    burstTimers.current.push(timer);
  };

  if (!isLoading) return null;

  return (
    <div className={`isc-opening-splash ${isEntering ? "isc-opening-splash--entering" : ""}`}>
      <div className="isc-opening-landscape-guard" role="status">
        <ISCLogo size="xl" label="ISC" />
        <strong>请将设备旋转至横屏</strong>
        <span>Ice Snow City 开场体验为 16:9 横屏布局</span>
      </div>

      <main className="isc-opening-hero-frame" aria-label="Ice Snow City 开场动画">
        <img
          className="isc-opening-hero-image"
          data-testid="opening-hero-image"
          src={HERO_IMAGE_URL}
          alt="ISC Ice Snow City 商业帝国雪夜都市与现代城市建设者"
          loading="eager"
          decoding="async"
        />
        <div className="isc-opening-hero-shade" aria-hidden="true" />

        <div className="isc-snowfall-layer" aria-label="Interactive snowflake field">
          {SNOWFLAKES.map((snowflake) => (
            <button
              key={snowflake.id}
              type="button"
              className={`isc-snowflake-button isc-snowflake-button--${snowflake.kind}`}
              data-testid={`${snowflake.kind}-snowflake-${snowflake.id}`}
              style={{
                left: `${snowflake.left}%`,
                top: `${snowflake.top}%`,
                animationDelay: `${snowflake.delay}ms`,
              }}
              aria-label={
                snowflake.kind === "golden"
                  ? `点击第 ${snowflake.id} 枚金色幸运雪花，获得 5 分并触发华丽粒子效果`
                  : `点击第 ${snowflake.id} 枚普通雪花，获得 1 分并触发冰晶碎裂效果`
              }
              onClick={() => handleSnowflakeClick(snowflake)}
            >
              <span className="isc-snowflake-button__glyph" style={{ fontSize: `${snowflake.size}rem` }} aria-hidden="true">
                {snowflake.kind === "golden" ? "✦" : "❄"}
              </span>
            </button>
          ))}

          {bursts.map((burst) => (
            <span
              key={burst.id}
              className={`isc-snowflake-burst isc-snowflake-burst--${burst.kind}`}
              style={{ left: `${burst.left}%`, top: `${burst.top}%` }}
              aria-hidden="true"
            >
              <span className="isc-snowflake-burst__core" />
              <span className="isc-snowflake-burst__reward">+{burst.points}</span>
              {(burst.kind === "golden" ? GOLD_PARTICLES : PARTICLES).map((particle, index) => (
                <span
                  key={`${burst.id}-${index}`}
                  className="isc-snowflake-fragment"
                  style={
                    {
                      "--fragment-x": `${particle.x}px`,
                      "--fragment-y": `${particle.y}px`,
                      "--fragment-rotate": `${particle.rotate}deg`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
          ))}
        </div>

        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {bursts.length > 0
            ? `冰晶碎裂，当前已击碎 ${snowflakeCount} 枚雪花，获得 ${bursts[bursts.length - 1]?.points ?? 1} 分`
            : ""}
        </span>

        <div className="isc-opening-network-status">
          <NetworkStatusIndicator />
        </div>

        <section className="isc-opening-controls" aria-live="polite">
          <div className="isc-snowflake-score" role="status" aria-label={`已击碎 ${snowflakeCount} 枚雪花`} data-testid="snowflake-score">
            <span className="isc-snowflake-score__icon" aria-hidden="true">❄</span>
            <span className="isc-snowflake-score__copy"><small>ICE CRYSTALS / 冰晶</small><strong>{snowflakeCount}</strong></span>
            <span className="isc-snowflake-score__copy"><small>SCORE / 得分</small><strong data-testid="snowflake-points">{snowflakeScore}</strong></span>
            <span className="isc-snowflake-score__label">已击碎</span>
          </div>

          {milestone !== null && <div className="isc-snowflake-milestone" role="status">冰晶连击 ×{milestone} · 城市能量已同步</div>}

          <div className="isc-opening-progress-panel">
            <div className="isc-opening-progress-meta">
              <span><ISCLogo size="xs" label="ISC" /> CITY CORE / 城市核心</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <div className="isc-opening-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="开场资源加载进度">
              <span className="isc-opening-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className={`isc-opening-status ${isTimedOut || authError ? "isc-opening-status--error" : ""}`}>
              {statusMessage}
            </div>
          </div>

          {isTimedOut || authError ? (
            <button type="button" className="isc-opening-reconnect" onClick={handleReconnect} disabled={isRetrying}>
              {isRetrying ? "重新连接中…" : "重新连接"}
            </button>
          ) : (
            <button type="button" className="isc-opening-enter" onClick={handleEnterGame} disabled={!isReadyToEnter || isEntering}>
              {isEntering ? "正在进入冰雪都市…" : "进入游戏"}
            </button>
          )}

          <p className="isc-opening-mini-hint">点击雪花，触发冰晶碎裂 · 金色雪花 +5 分</p>
        </section>
      </main>
    </div>
  );
};

export default SplashScreen;
