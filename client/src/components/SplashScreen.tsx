import { useEffect, useRef, useState } from 'react';

export const OPENING_HERO_IMAGE = '/manus-storage/ice-snow-city-opening-hero_9b970867.jpg';

interface SplashScreenProps { onComplete?: () => void }

/** A small visual doorway to the playable districts; no pre-game currency, login or wallet gate. */
export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [entering, setEntering] = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);
  useEffect(() => () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); }, []);

  const enter = () => {
    if (entering) return;
    setEntering(true);
    timerRef.current = window.setTimeout(() => { setVisible(false); onComplete?.(); }, 520);
  };

  if (!visible) return null;

  return (
    <div className={`isc-opening-splash${entering ? ' isc-opening-splash--entering' : ''}`} data-transitioning={entering || undefined}>
      <div className="isc-opening-landscape-guard" role="status">
        <strong>请将设备旋转至横屏</strong>
        <span>冰雪城市适合 16:9 横屏游玩</span>
      </div>
      <main className="isc-opening-hero-frame" aria-label="冰雪城市游戏入口">
        <img className="isc-opening-hero-image" data-testid="opening-hero-image" src={OPENING_HERO_IMAGE} alt="Ice Snow City 冰雪城市夜景与城市团队宣传画面" loading="eager" decoding="async" />
        <div className="isc-opening-hero-shade" aria-hidden="true" />
        <section className="isc-opening-controls">
          <span className="isc-opening-kicker">ICE SNOW CITY · 城市经营</span>
          <h1 className="isc-opening-title">建设冰雪城市</h1>
          <p className="isc-opening-description">从城市街区开始，走访生活场所，经营水电、生产与商业。</p>
          <button type="button" className="isc-opening-enter" onClick={enter} disabled={entering} aria-label={entering ? '正在进入…' : '进入游戏'}>
            {entering ? '正在进入…' : '进入游戏'}
          </button>
          <small className="isc-opening-footnote">支持手机横屏 · 游玩进度保存在当前浏览器</small>
        </section>
      </main>
    </div>
  );
}

export default SplashScreen;
