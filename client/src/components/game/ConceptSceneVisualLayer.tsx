import { Image, Moon, Sun, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type ConceptSceneMode = "day" | "night" | "core";

const SCENE_REFERENCES = {
  day: {
    label: "日景",
    title: "冰雪城市 · 晨曦构图",
    description: "以蓝白结构、雪白屋顶和低饱和环境建立城市核心的可读轮廓。",
    src: "/manus-storage/reference-daylight_841dc8eb.png",
    alt: "冰雪城市日景概念参考",
  },
  night: {
    label: "夜景",
    title: "冰雪城市 · 极光夜景",
    description: "以蓝紫环境光和分层暖色功能灯强化城市核心的导航与生活感。",
    src: "/manus-storage/reference-night_0510cd30.png",
    alt: "冰雪城市夜景概念参考",
  },
  core: {
    label: "城市核心",
    title: "城市核心 · 冰晶能源塔",
    description: "将中央冰晶塔、三层能源环、金色灯带与高台广场作为本区域的视觉锚点。",
    src: "/manus-storage/city-core-hero_0b6cd13b.png",
    alt: "城市核心冰晶能源塔概念图",
  },
} as const;

export default function ConceptSceneVisualLayer() {
  const [mode, setMode] = useState<ConceptSceneMode>("night");
  const [isOpen, setIsOpen] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const reference = useMemo(() => SCENE_REFERENCES[mode], [mode]);

  useEffect(() => () => {
    if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
  }, []);

  const handleModeChange = (nextMode: ConceptSceneMode) => {
    if (nextMode === mode) return;
    if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
    setMode(nextMode);
    window.dispatchEvent(new CustomEvent<ConceptSceneMode>("isc-concept-backdrop-mode", { detail: nextMode }));
    setIsTransitioning(true);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      transitionTimeoutRef.current = null;
    }, 380);
  };

  return (
    <aside className={`concept-scene-visual-layer ${isOpen ? "concept-scene-visual-layer--open" : "concept-scene-visual-layer--collapsed"}`} data-testid="concept-scene-visual-layer">
      {isOpen ? (
        <div className="concept-scene-visual-layer__body">
          <div className="concept-scene-visual-layer__heading">
            <div className="flex min-w-0 items-center gap-2">
              <Image className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-cyan-100/65">城市视觉层 · v001</p>
                <p className="truncate text-xs font-semibold text-white">{reference.title}</p>
              </div>
            </div>
            <button type="button" aria-label="关闭城市视觉层" className="concept-scene-visual-layer__close" onClick={() => setIsOpen(false)}><X className="h-3.5 w-3.5" aria-hidden="true" /></button>
          </div>
          <div className="concept-scene-visual-layer__modes" role="tablist" aria-label="城市场景时间氛围">
            {(Object.keys(SCENE_REFERENCES) as ConceptSceneMode[]).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={mode === item} className={`concept-scene-visual-layer__mode ${mode === item ? "concept-scene-visual-layer__mode--active" : ""}`} onClick={() => handleModeChange(item)}>
                {item === "day" ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : item === "night" ? <Moon className="h-3.5 w-3.5" aria-hidden="true" /> : <Image className="h-3.5 w-3.5" aria-hidden="true" />}
                {SCENE_REFERENCES[item].label}
              </button>
            ))}
          </div>
          <div className="concept-scene-visual-layer__image-frame" aria-live="polite">
            <img className={`concept-scene-visual-layer__image ${isTransitioning ? "concept-scene-visual-layer__image--transitioning" : ""}`} src={reference.src} alt={reference.alt} />
            {isTransitioning ? <span className="concept-scene-visual-layer__transition-status">场景切换中</span> : null}
          </div>
          <p className="concept-scene-visual-layer__description">{reference.description}</p>
          <p className="concept-scene-visual-layer__boundary">概念图已落实为游戏内视觉导览层；真实 3D 建筑仍由 GLB/PBR/LOD 资产门禁控制。</p>
        </div>
      ) : null}
      {!isOpen ? (
        <Button type="button" size="sm" variant="outline" className="concept-scene-visual-layer__reopen border-cyan-200/30 bg-slate-950/85 text-cyan-100" aria-label="展开城市视觉层" onClick={() => setIsOpen(true)}><Image className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />视觉层</Button>
      ) : null}
    </aside>
  );
}
