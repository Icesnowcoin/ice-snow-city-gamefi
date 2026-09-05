import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Coins,
  Handshake,
  Home,
  ListChecks,
  Map,
  ShoppingCart,
  Sprout,
  Timer,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GameGuideTab =
  | "scenes"
  | "scene"
  | "npc"
  | "economy"
  | "tasks"
  | "property"
  | "farm"
  | "shop"
  | "social";

type GuideItem = {
  id: string;
  tab: GameGuideTab;
  title: string;
  description: string;
  actionLabel: string;
  icon: typeof Map;
  accent: string;
};

type ConstructionFeedback = {
  key: string;
  kind: "accelerate" | "investment" | "completion" | "revenue";
  title: string;
  detail: string;
  particleCount: number;
};

const INITIAL_CONSTRUCTION_SIMULATION = {
  district: "中央商业区",
  project: "冰晶商务中心",
  stage: "主体结构施工",
  completion: 32,
  prosperity: 68,
  estimatedCost: 1_280_000,
  remainingHours: 18 + 40 / 60,
  capacity: 1_200,
  projectedReturn: 6.8,
  pendingEarnings: 6_800,
  earningsClaimed: false,
  materials: [
    { name: "高强度钢材", amount: "240 单位", state: "充足" },
    { name: "智能玻璃", amount: "96 单位", state: "需采购" },
    { name: "能源模块", amount: "48 单位", state: "充足" },
  ],
};

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: "city-overview",
    tab: "scenes",
    title: "查看城市总览",
    description: "查看四大都市区块、繁荣度和当前主线任务。",
    actionLabel: "查看地图",
    icon: Map,
    accent: "text-cyan-300",
  },
  {
    id: "build-city",
    tab: "scene",
    title: "进入建设视角",
    description: "在城市场景中探索、建造并规划你的商业帝国。",
    actionLabel: "查看建设详情",
    icon: Building2,
    accent: "text-blue-300",
  },
  {
    id: "claim-task",
    tab: "tasks",
    title: "领取城市任务",
    description: "完成任务获得 ISC、经验和新的城市功能。",
    actionLabel: "查看任务",
    icon: ListChecks,
    accent: "text-amber-300",
  },
  {
    id: "trade-isc",
    tab: "economy",
    title: "管理 ISC 经济",
    description: "查看资金流、交易机会和城市经营数据。",
    actionLabel: "查看经济",
    icon: Zap,
    accent: "text-emerald-300",
  },
  {
    id: "own-property",
    tab: "property",
    title: "购买土地与建筑",
    description: "查看房地产资产，扩展你的城市经营版图。",
    actionLabel: "查看房产",
    icon: Home,
    accent: "text-violet-300",
  },
  {
    id: "run-farm",
    tab: "farm",
    title: "经营农业基地",
    description: "建设大棚和养殖基地，形成城市供应链。",
    actionLabel: "进入农业",
    icon: Sprout,
    accent: "text-lime-300",
  },
  {
    id: "visit-shop",
    tab: "shop",
    title: "浏览道具商城",
    description: "购买服装、材料和城市经营所需的游戏道具。",
    actionLabel: "打开商城",
    icon: ShoppingCart,
    accent: "text-pink-300",
  },
  {
    id: "meet-players",
    tab: "social",
    title: "与玩家和 NPC 互动",
    description: "参与社交、组队、交易和城市协作。",
    actionLabel: "开始社交",
    icon: Handshake,
    accent: "text-orange-300",
  },
];

export type GameGuidePanelProps = {
  activeTab: GameGuideTab;
  onSelectTab: (tab: GameGuideTab) => void;
  onRevenueClaim?: (amount: number) => void;
};

export function GameGuidePanel({ activeTab, onSelectTab, onRevenueClaim }: GameGuidePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isConstructionOpen, setIsConstructionOpen] = useState(false);
  const [constructionData, setConstructionData] = useState(INITIAL_CONSTRUCTION_SIMULATION);
  const [constructionNotice, setConstructionNotice] = useState("");
  const [constructionFeedback, setConstructionFeedback] = useState<ConstructionFeedback | null>(null);

  useEffect(() => {
    if (!constructionFeedback) return;
    const timeout = window.setTimeout(() => setConstructionFeedback(null), 1_200);
    return () => window.clearTimeout(timeout);
  }, [constructionFeedback]);

  const activeGuide = useMemo(
    () => GUIDE_ITEMS.find((item) => item.tab === activeTab) ?? GUIDE_ITEMS[0],
    [activeTab],
  );
  const isConstructionComplete = constructionData.completion >= 100;

  const handleGuideAction = (item: GuideItem) => {
    if (item.id === "build-city") {
      setIsConstructionOpen(true);
      return;
    }
    onSelectTab(item.tab);
  };

  const handleClaimRevenue = () => {
    if (!isConstructionComplete || constructionData.earningsClaimed) return;

    const reward = constructionData.pendingEarnings;
    setConstructionData((current) => ({
      ...current,
      pendingEarnings: 0,
      earningsClaimed: true,
    }));
    onRevenueClaim?.(reward);
    setConstructionNotice(`收益已收取：+${reward.toLocaleString()} 虚拟 ISC 已加入本次模拟账户。`);
    setConstructionFeedback({
      key: `revenue-${Date.now()}`,
      kind: "revenue",
      title: "收益收取成功",
      detail: `+${reward.toLocaleString()} 虚拟 ISC`,
      particleCount: 18,
    });
  };

  const handleAccelerateConstruction = () => {
    const nextCompletion = Math.min(constructionData.completion + 8, 100);
    const willComplete = constructionData.completion < 100 && nextCompletion >= 100;
    setConstructionData((current) => {
      const completion = Math.min(current.completion + 8, 100);
      return {
        ...current,
        completion,
        prosperity: Math.min(current.prosperity + 2, 100),
        remainingHours: Math.max(current.remainingHours - 3, 0),
        stage: completion >= 100 ? "已完成验收" : completion >= 80 ? "收尾验收" : "主体结构施工",
        materials: current.materials.map((material) =>
          material.state === "需采购" ? { ...material, state: "已订购" } : material,
        ),
      };
    });
    setConstructionNotice(
      willComplete
        ? "建筑已完成验收：模拟城市建筑等级升级，新的商业容量已解锁。"
        : "模拟加速已生效：进度提升 8%，预计工期减少 3 小时。",
    );
    setConstructionFeedback(
      willComplete
        ? {
            key: `completion-accelerate-${Date.now()}`,
            kind: "completion",
            title: "建筑完工升级",
            detail: "100% 完工 · 城市能量已同步",
            particleCount: 16,
          }
        : {
            key: `accelerate-${Date.now()}`,
            kind: "accelerate",
            title: "加速施工成功",
            detail: "+8% 进度 · -3 小时",
            particleCount: 8,
          },
    );
  };

  const handleAdditionalInvestment = () => {
    const nextCompletion = Math.min(constructionData.completion + 4, 100);
    const willComplete = constructionData.completion < 100 && nextCompletion >= 100;
    setConstructionData((current) => {
      const completion = Math.min(current.completion + 4, 100);
      return {
        ...current,
        completion,
        prosperity: Math.min(current.prosperity + 3, 100),
        estimatedCost: current.estimatedCost + 100_000,
        capacity: current.capacity + 200,
        projectedReturn: Number((current.projectedReturn + 0.5).toFixed(1)),
        remainingHours: Math.max(current.remainingHours - 1.5, 0),
        stage: completion >= 100 ? "已完成验收" : completion >= 80 ? "收尾验收" : "主体结构施工",
        materials: current.materials.map((material) =>
          material.name === "智能玻璃" ? { ...material, state: "已采购" } : material,
        ),
      };
    });
    setConstructionNotice(
      willComplete
        ? "建筑已完成验收：模拟城市建筑等级升级，新的商业容量已解锁。"
        : "模拟追加投资已生效：追加 100,000 ISC，城市容量与预期收益已更新。",
    );
    setConstructionFeedback(
      willComplete
        ? {
            key: `completion-investment-${Date.now()}`,
            kind: "completion",
            title: "建筑完工升级",
            detail: "100% 完工 · 城市能量已同步",
            particleCount: 16,
          }
        : {
            key: `investment-${Date.now()}`,
            kind: "investment",
            title: "追加投资成功",
            detail: "+100,000 ISC · +200 容量",
            particleCount: 12,
          },
    );
  };

  const formatRemainingTime = (hours: number) => {
    if (hours <= 0) return "已完成";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} 小时 ${minutes} 分钟`;
  };

  if (isDismissed) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label="重新打开任务引导"
        className="fixed bottom-28 right-3 z-40 border-cyan-400/60 bg-slate-950/90 text-cyan-200 shadow-lg shadow-cyan-950/40 backdrop-blur-md hover:bg-slate-900"
        onClick={() => setIsDismissed(false)}
      >
        <CircleHelp className="mr-1.5 h-4 w-4" />
        任务引导
      </Button>
    );
  }

  return (
    <>
      <Card
      className="fixed bottom-28 right-3 z-40 w-[min(21rem,calc(100vw-1.5rem))] border-cyan-400/50 bg-slate-950/92 text-slate-100 shadow-2xl shadow-cyan-950/40 backdrop-blur-md"
      role="region"
      aria-label="城市任务引导面板"
    >
      <div className="flex items-start justify-between gap-3 border-b border-cyan-400/20 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-cyan-200">
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
            <h2 className="truncate text-sm font-semibold">城市行动指南</h2>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            当前场景：{activeGuide.title.replace("查看", "").replace("进入", "")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={isExpanded ? "收起任务引导" : "展开任务引导"}
            className="h-7 w-7 text-cyan-200 hover:bg-cyan-400/10 hover:text-white"
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="关闭任务引导"
            className="h-7 w-7 text-slate-400 hover:bg-red-400/10 hover:text-red-200"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-h-[min(55vh,26rem)] space-y-1.5 overflow-y-auto p-2.5" role="list" aria-label="当前场景可执行操作">
          {GUIDE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.tab === activeTab;
            return (
              <div
                key={item.id}
                role="listitem"
                className={`rounded-lg border px-2.5 py-2 transition-colors ${
                  isActive
                    ? "border-cyan-300/60 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.accent}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-100">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{item.description}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    aria-label={`${item.actionLabel}：${item.title}`}
                    className="h-7 shrink-0 px-2 text-[11px]"
                    onClick={() => handleGuideAction(item)}
                  >
                    {isActive ? "当前" : item.actionLabel}
                    {!isActive && <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </Card>

      <Dialog open={isConstructionOpen} onOpenChange={setIsConstructionOpen}>
        <DialogContent className="relative max-h-[min(88vh,44rem)] overflow-y-auto border-cyan-300/40 bg-slate-950 text-slate-100 sm:max-w-xl">
          <DialogHeader>
            <div className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-200">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              模拟建设数据
            </div>
            <DialogTitle className="text-cyan-100">{constructionData.project}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {constructionData.district} · 当前阶段：{constructionData.stage}。以下数据用于演示建设玩法，尚未连接实时链上资产。
            </DialogDescription>
          </DialogHeader>

          <div
            data-testid="construction-status-card"
            className={`isc-construction-status-card ${isConstructionComplete ? "isc-construction-status-card--complete" : ""}`}
          >
            <div className="isc-construction-status-card__icon" aria-hidden="true">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/80">建筑状态</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-100">
                {isConstructionComplete ? "已完成验收 · 建筑等级已升级" : "施工中 · 等待城市能量注入"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {isConstructionComplete ? "冰晶商务中心已开放新的商业容量与经营收益。" : "继续加速施工或追加投资，可推进模拟建设进度。"}
              </p>
            </div>
            <span className={`isc-construction-status-card__badge ${isConstructionComplete ? "isc-construction-status-card__badge--complete" : ""}`}>
              {isConstructionComplete ? "LEVEL 2" : "LEVEL 1"}
            </span>
          </div>

          {isConstructionComplete && (
            <div
              data-testid="construction-revenue-card"
              className={`isc-construction-revenue-card ${constructionData.earningsClaimed ? "isc-construction-revenue-card--claimed" : ""}`}
            >
              <div className="isc-construction-revenue-card__copy">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-300" aria-hidden="true" />
                  <p className="text-xs font-semibold text-amber-100">建筑经营收益</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {constructionData.earningsClaimed
                    ? "本轮模拟收益已收取，下一轮收益将在后续版本开放。"
                    : "完工建筑已生成一笔可领取的模拟虚拟货币收益。"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <strong className="text-sm text-amber-100">
                  {constructionData.earningsClaimed
                    ? "已收取"
                    : `+${constructionData.pendingEarnings.toLocaleString()} 虚拟 ISC`}
                </strong>
                <Button
                  type="button"
                  size="sm"
                  disabled={constructionData.earningsClaimed}
                  onClick={handleClaimRevenue}
                  aria-label={constructionData.earningsClaimed ? "收益已收取" : "收取收益"}
                  className={constructionData.earningsClaimed ? "bg-slate-700 text-slate-400" : "bg-amber-300 text-slate-950 hover:bg-amber-200"}
                >
                  <Coins className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  {constructionData.earningsClaimed ? "收益已收取" : "收取收益"}
                </Button>
              </div>
            </div>
          )}

          {constructionFeedback && (
            <div
              key={constructionFeedback.key}
              data-testid="construction-feedback"
              data-feedback-kind={constructionFeedback.kind}
              className={`isc-construction-feedback isc-construction-feedback--${constructionFeedback.kind}`}
              aria-hidden="true"
            >
              <div className="isc-construction-feedback__label">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{constructionFeedback.title}</span>
                <strong>{constructionFeedback.detail}</strong>
              </div>
              <div className="isc-construction-feedback__particles">
                {Array.from({ length: constructionFeedback.particleCount }, (_, index) => (
                  <span
                    key={`${constructionFeedback.key}-particle-${index}`}
                    data-testid={constructionFeedback.kind === "revenue" ? "revenue-coin" : undefined}
                    className={`isc-construction-feedback__particle ${constructionFeedback.kind === "revenue" ? "isc-construction-feedback__particle--coin" : ""}`}
                    style={{ animationDelay: `${index * 35}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>建设进度</span>
                <span className="font-semibold text-cyan-200">{constructionData.completion}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800" aria-label="建设进度">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" style={{ width: `${constructionData.completion}%` }} />
              </div>
            </div>
            <div className="rounded-lg border border-violet-300/20 bg-violet-300/5 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Map className="h-4 w-4 text-violet-300" aria-hidden="true" />
                区块繁荣度
              </div>
              <p className="mt-1 text-xl font-semibold text-violet-100">{constructionData.prosperity}%</p>
              <p className="text-[11px] text-slate-500">达到 75% 后解锁商业街扩建</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <Coins className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <p className="mt-2 text-[11px] text-slate-400">预计建设成本</p>
              <p className="mt-1 text-sm font-semibold text-amber-100">{constructionData.estimatedCost.toLocaleString()} ISC</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <Timer className="h-4 w-4 text-blue-300" aria-hidden="true" />
              <p className="mt-2 text-[11px] text-slate-400">预计施工时间</p>
              <p className="mt-1 text-sm font-semibold text-blue-100">{formatRemainingTime(constructionData.remainingHours)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <Building2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <p className="mt-2 text-[11px] text-slate-400">城市容量</p>
              <p className="mt-1 text-sm font-semibold text-emerald-100">{`+${constructionData.capacity.toLocaleString()} 城市人口`}</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-slate-100">材料需求</h3>
              <span className="text-xs text-emerald-300">预期收益 {`+${constructionData.projectedReturn.toFixed(1)}% 周期收益`}</span>
            </div>
            <div className="mt-2 space-y-2">
              {constructionData.materials.map((material) => (
                <div key={material.name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-300">{material.name}</span>
                  <span className="text-slate-400">{material.amount}</span>
                  <span className={material.state === "充足" || material.state === "已采购" ? "text-emerald-300" : "text-amber-300"}>{material.state}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-100"
          >
            {constructionNotice || "模拟操作仅更新当前弹窗数据，不会扣除真实 ISC 或发起链上交易。"}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={constructionData.completion >= 100}
                onClick={handleAccelerateConstruction}
                aria-label="模拟加速施工"
                className="border-cyan-300/40 text-cyan-100 hover:bg-cyan-300/10"
              >
                加速施工
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={constructionData.completion >= 100}
                onClick={handleAdditionalInvestment}
                aria-label="模拟追加投资"
                className="border-amber-300/40 text-amber-100 hover:bg-amber-300/10"
              >
                追加投资 +100,000 ISC
              </Button>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setIsConstructionOpen(false)}>
                稍后查看
              </Button>
            <Button
              type="button"
              onClick={() => {
                setIsConstructionOpen(false);
                onSelectTab("scene");
              }}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-300"
            >
              进入建设场景
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GameGuidePanel;
