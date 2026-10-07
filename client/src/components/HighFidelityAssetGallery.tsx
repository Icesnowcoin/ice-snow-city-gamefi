import { Image as ImageIcon, Maximize2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type HighFidelityAssetReference = {
  id: string;
  title: string;
  category: "概念设计" | "用户参考";
  purpose: string;
  conclusion: string;
  src: string;
};

export const CITY_CORE_ASSET_REFERENCES: HighFidelityAssetReference[] = [
  {
    id: "city-core-hero",
    title: "城市核心 · 英雄角度",
    category: "概念设计",
    purpose: "主轮廓与远景视觉锚点",
    conclusion: "三层能源环、中央冰晶塔、金色灯带和高台广场。",
    src: "/manus-storage/city-core-hero_0b6cd13b.png",
  },
  {
    id: "city-core-daylight",
    title: "城市核心 · 日景比例",
    category: "概念设计",
    purpose: "入口、台阶与模块化基座",
    conclusion: "确认建筑正向比例、入口动线和外围雪地关系。",
    src: "/manus-storage/city-core-daylight_3026202a.png",
  },
  {
    id: "city-core-levels",
    title: "城市核心 · Lv.1–Lv.3",
    category: "概念设计",
    purpose: "等级升级的外观差异",
    conclusion: "通过能源环数量、晶体冠冕和灯光节点表达等级。",
    src: "/manus-storage/city-core-levels_80a2d05d.png",
  },
  {
    id: "reference-city-overview",
    title: "冰雪城市总体构图",
    category: "用户参考",
    purpose: "城市空间与地标密度",
    conclusion: "蓝白主调、地标建筑、农业区与交通线路共存。",
    src: "/manus-storage/reference-city-overview_1b0c675a.png",
  },
  {
    id: "reference-immersive-ui",
    title: "移动横屏交互参考",
    category: "用户参考",
    purpose: "HUD 安全区与操作布局",
    conclusion: "任务、地图、背包和消息入口集中在屏幕边缘。",
    src: "/manus-storage/reference-immersive-ui_c7fb16e7.png",
  },
  {
    id: "reference-daylight",
    title: "日景材质与环境光",
    category: "用户参考",
    purpose: "PBR 色彩与可读性",
    conclusion: "深蓝结构、雪白屋顶和低饱和环境，不依赖 bloom 才能识别。",
    src: "/manus-storage/reference-daylight_841dc8eb.png",
  },
  {
    id: "reference-night",
    title: "夜景灯光参考",
    category: "用户参考",
    purpose: "功能灯与夜景氛围",
    conclusion: "蓝紫环境光搭配分层暖色功能灯，控制移动端发光预算。",
    src: "/manus-storage/reference-night_0510cd30.png",
  },
];

const FILTERS: Array<"全部" | HighFidelityAssetReference["category"]> = ["全部", "概念设计", "用户参考"];

export default function HighFidelityAssetGallery() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("全部");
  const [selectedId, setSelectedId] = useState(CITY_CORE_ASSET_REFERENCES[0].id);
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleReferences = filter === "全部"
    ? CITY_CORE_ASSET_REFERENCES
    : CITY_CORE_ASSET_REFERENCES.filter((reference) => reference.category === filter);
  const selected = CITY_CORE_ASSET_REFERENCES.find((reference) => reference.id === selectedId) ?? visibleReferences[0];

  const selectReference = (id: string) => {
    setSelectedId(id);
    setIsExpanded(false);
  };

  return (
    <Card className="high-fidelity-gallery border-cyan-200/15 bg-slate-950/80 text-white" data-testid="high-fidelity-gallery">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300/75">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Visual direction · v001
            </div>
            <CardTitle className="text-base sm:text-lg">城市核心高保真资产展示</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              直接预览本轮生成的城市核心概念图与用户提供的视觉参考，用于建模、材质和移动端构图评审。
            </p>
          </div>
          <Badge variant="outline" className="border-amber-300/40 text-amber-200">reference-only</Badge>
        </div>
        <div className="high-fidelity-gallery__filters" role="tablist" aria-label="资产参考分类">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className={`high-fidelity-gallery__filter ${filter === item ? "high-fidelity-gallery__filter--active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item}
              <span>{item === "全部" ? CITY_CORE_ASSET_REFERENCES.length : CITY_CORE_ASSET_REFERENCES.filter((reference) => reference.category === item).length}</span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="high-fidelity-gallery__layout">
          <div className="high-fidelity-gallery__preview">
            <div className="high-fidelity-gallery__image-frame">
              <img src={selected.src} alt={selected.title} className="high-fidelity-gallery__image" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="high-fidelity-gallery__expand border-white/20 bg-slate-950/70 text-white hover:bg-slate-900"
                aria-label={`放大预览：${selected.title}`}
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{selected.title}</p>
                <p className="mt-1 text-xs text-cyan-100/65">{selected.purpose}</p>
              </div>
              <Badge variant="outline" className="border-cyan-300/30 text-cyan-200">{selected.category}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{selected.conclusion}</p>
          </div>

          <div className="high-fidelity-gallery__thumbs" aria-label="概念图缩略图列表">
            {visibleReferences.map((reference) => (
              <button
                key={reference.id}
                type="button"
                className={`high-fidelity-gallery__thumb ${selected.id === reference.id ? "high-fidelity-gallery__thumb--active" : ""}`}
                aria-label={`预览${reference.title}`}
                aria-pressed={selected.id === reference.id}
                onClick={() => selectReference(reference.id)}
              >
                <img src={reference.src} alt="" loading="lazy" />
                <span>{reference.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3 text-xs leading-5 text-amber-100/75">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          <span>展示图仅用于视觉方向、比例讨论和建模验收，不能替代真实 city-core.glb、PBR、LOD、碰撞体、许可证或真机性能证据。</span>
        </div>
      </CardContent>

      {isExpanded ? (
        <div className="high-fidelity-gallery__lightbox" role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setIsExpanded(false)}>
          <div className="high-fidelity-gallery__lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <img src={selected.src} alt={selected.title} />
            <Button type="button" variant="outline" className="mt-3 border-white/20 bg-slate-950/80 text-white hover:bg-slate-900" onClick={() => setIsExpanded(false)}>关闭预览</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
