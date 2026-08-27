import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  INITIAL_DISTRICTS,
  INITIAL_MAIN_QUESTS,
  CityDistrict,
  MainStoryQuest,
  unlockDistrict,
} from "@/lib/districtStoryUtils";
import { Sparkles, MapPin, Award, CheckCircle2, Lock, ArrowRight, Building2, Globe2, Compass } from "lucide-react";

interface DistrictStoryPanelProps {
  balance: number;
  population: number;
  onRewardClaim?: (rewardISC: number) => void;
}

export function DistrictStoryPanel({ balance, population, onRewardClaim }: DistrictStoryPanelProps) {
  const [districts, setDistricts] = useState<CityDistrict[]>(INITIAL_DISTRICTS);
  const [quests, setQuests] = useState<MainStoryQuest[]>(INITIAL_MAIN_QUESTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMapOverviewOpen, setIsMapOverviewOpen] = useState(false);
  const [selectedMapDistrict, setSelectedMapDistrict] = useState<CityDistrict | null>(INITIAL_DISTRICTS[0] || null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUnlockDistrict = (district: CityDistrict) => {
    const res = unlockDistrict(districts, district.id, balance, population);
    if (res.success) {
      setDistricts(res.updatedDistricts);
      showToast(`🎉 ${res.message}`);
    } else {
      showToast(`⚠️ ${res.message}`);
    }
  };

  const handleClaimQuest = (questId: string) => {
    setQuests((current) =>
      current.map((q) => {
        if (q.id === questId && q.status === "in_progress") {
          if (onRewardClaim) onRewardClaim(q.rewardISC);
          showToast(`🏆 成功领取剧情任务奖励：+${q.rewardISC} ISC！`);
          return { ...q, status: "completed", progress: 100 };
        }
        return q;
      })
    );
  };

  const [activeTab, setActiveTab] = React.useState<string>("districts");

  return (
    <div className="relative space-y-6 rounded-2xl border border-white/10 bg-slate-950/80 p-6 text-slate-100 backdrop-blur-xl">
      {/* 顶部浮动反馈 Toast */}
      {toastMessage && (
        <div className="shop-top-banner-toast fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-900/95 px-4 py-3 text-sm text-cyan-200 shadow-2xl backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 标题栏 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Building2 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">Ice Snow City / Campaign & Expansion</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">城市主线剧情与地图区块扩展</h2>
        </div>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <Button
            onClick={() => setIsMapOverviewOpen(true)}
            variant="outline"
            className="border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 font-semibold gap-2"
          >
            <Globe2 className="h-4 w-4 text-cyan-400" />
            🗺️ 城市全局地图概览
          </Button>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-cyan-200">
            可用 ISC: <span className="font-bold text-white">{balance.toLocaleString()}</span>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-emerald-200">
            城市人口: <span className="font-bold text-white">{population.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl border border-white/10 bg-black/40 p-1">
          <TabsTrigger value="districts" className="rounded-lg data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-200">
            🗺️ 核心地图区块
          </TabsTrigger>
          <TabsTrigger value="story" className="rounded-lg data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-200">
            📜 主线剧情任务
          </TabsTrigger>
        </TabsList>

        {/* 区域区块 Tab */}
        <TabsContent value="districts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {districts.map((district) => (
              <Card
                key={district.id}
                className={`relative overflow-hidden border transition-all duration-300 ${
                  district.isUnlocked
                    ? "border-cyan-500/30 bg-gradient-to-br from-slate-900/90 to-slate-900/60 shadow-lg shadow-cyan-950/20"
                    : "border-white/10 bg-slate-900/40 opacity-80"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <MapPin className={`h-4 w-4 ${district.isUnlocked ? "text-cyan-400" : "text-slate-500"}`} />
                      {district.name}
                    </CardTitle>
                    <p className="text-xs text-slate-400">{district.nameEn}</p>
                  </div>
                  <Badge variant={district.isUnlocked ? "default" : "secondary"} className={district.isUnlocked ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-white/10 text-slate-400"}>
                    {district.isUnlocked ? "已解锁营业" : "待投资解锁"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed">{district.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>区块繁荣度</span>
                      <span className="font-mono text-cyan-200">{district.prosperity}%</span>
                    </div>
                    <Progress value={district.prosperity} className="h-2 bg-slate-800" />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">核心设施:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {district.facilities.map((fac: string, idx: number) => (
                        <span key={idx} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-200">
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!district.isUnlocked && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <div className="text-xs space-y-0.5">
                        <p className="text-amber-400 font-mono">解锁费用: {district.unlockCostISC.toLocaleString()} ISC</p>
                        <p className="text-slate-400">所需人口: {district.requiredPopulation} 人</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUnlockDistrict(district)}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-md"
                      >
                        解锁区块
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 主线剧情 Tab */}
        <TabsContent value="story" className="space-y-4">
          <div className="space-y-4">
            {quests.map((quest) => (
              <Card
                key={quest.id}
                className="border border-white/10 bg-slate-900/60 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all hover:border-cyan-500/30"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 bg-cyan-500/10">
                      第 {quest.chapter} 章
                    </Badge>
                    <h3 className="text-lg font-bold text-white">{quest.title}</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{quest.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Award className="h-3.5 w-3.5" /> 奖励: {quest.rewardISC.toLocaleString()} ISC
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 min-w-[200px] justify-end">
                  {quest.status === "completed" ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                      <CheckCircle2 className="h-5 w-5" /> 任务已完成
                    </div>
                  ) : quest.status === "in_progress" ? (
                    <Button
                      onClick={() => handleClaimQuest(quest.id)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg"
                    >
                      领取奖励
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Lock className="h-4 w-4" /> 尚未开启
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 城市全局地图概览弹窗 (Global Map Overview Dialog) */}
      <Dialog open={isMapOverviewOpen} onOpenChange={setIsMapOverviewOpen}>
        <DialogContent className="max-w-4xl border border-cyan-500/30 bg-slate-950/95 text-slate-100 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <Compass className="h-6 w-6 text-cyan-400" />
              Ice Snow City 城市全局地图与区块全景概览
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              实时查看 Ice Snow City 四大功能区块的繁荣度、升级里程碑与主线任务链。
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {/* 左侧：可视化地图热点网格 */}
            <div className="md:col-span-2 rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 flex flex-col justify-between relative overflow-hidden min-h-[320px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)] pointer-events-none" />
              
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">Metropolitan Grid / 卫星全景</span>
                <span className="text-xs font-mono text-slate-400">实时繁荣联动</span>
              </div>

              {/* 4 个区块在地图上的可点击热点卡片 */}
              <div className="grid grid-cols-2 gap-4 z-10 my-auto py-4">
                {districts.map((d) => {
                  const quest = quests.find((q) => q.targetDistrictId === d.id);
                  const hasActiveQuest = quest && (quest.status === "available" || quest.status === "in_progress");
                  return (
    <button
      key={d.id}
      data-testid={`hotspot-district-${d.id}`}
      onClick={() => setSelectedMapDistrict(d)}
                      className={`text-left rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between gap-2 group relative ${
                        hasActiveQuest ? "map-hotspot-pulse border-amber-500/60 bg-amber-500/10" : ""
                      } ${
                        d.isUnlocked
                          ? "border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/25 hover:border-cyan-400 shadow-lg shadow-cyan-950/40"
                          : "border-white/10 bg-slate-900/60 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm group-hover:text-cyan-200 transition-colors flex items-center gap-1.5">
                          {d.name}
                          {hasActiveQuest && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold animate-bounce" title="有待完成的主线任务">
                              !
                            </span>
                          )}
                        </span>
                        <Badge className={d.isUnlocked ? "bg-cyan-500/20 text-cyan-300 text-[10px]" : "bg-white/10 text-slate-400 text-[10px]"}>
                          {d.isUnlocked ? `${d.prosperity}% 繁荣` : "未解锁"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{d.description}</p>
                      {quest && (
                        <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                          {hasActiveQuest && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />}
                          主线: {quest.title} ({quest.status === "completed" ? "已完成" : "进行中"})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400 z-10 flex items-center justify-between pt-2 border-t border-white/10">
                <span>提示：点击任意地图区块热点可查看详细地理、设施与主线任务链。</span>
                <span className="font-mono text-cyan-300">ISC Ecosystem v1.0</span>
              </div>
            </div>

            {/* 右侧：选中区块的详细速览卡片 */}
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-5 flex flex-col justify-between space-y-4">
              {selectedMapDistrict ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">区块详情</span>
                    <h3 className="text-lg font-bold text-white">{selectedMapDistrict.name}</h3>
                    <p className="text-xs text-slate-400">{selectedMapDistrict.nameEn}</p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{selectedMapDistrict.description}</p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>繁荣度</span>
                      <span className="font-mono text-cyan-200">{selectedMapDistrict.prosperity}%</span>
                    </div>
                    <Progress value={selectedMapDistrict.prosperity} className="h-1.5 bg-slate-800" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400">核心设施:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedMapDistrict.facilities.map((f: string, i: number) => (
                        <span key={i} className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-slate-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!selectedMapDistrict.isUnlocked && (
                    <div className="pt-2 text-xs space-y-1">
                      <p className="text-amber-400 font-mono">解锁 ISC 费用: {selectedMapDistrict.unlockCostISC.toLocaleString()}</p>
                      <p className="text-slate-400">所需人口: {selectedMapDistrict.requiredPopulation} 人</p>
                    </div>
                  )}

                  {/* 繁荣度升级进度条与阶段状态指示器（带里程碑 Tooltip 提示） */}
                  <div 
                    tabIndex={0}
                    role="region"
                    aria-label="繁荣度升级进度与里程碑奖励说明"
                    className="group relative rounded-xl border border-white/10 bg-slate-950/60 p-3 space-y-2 mt-2 cursor-help focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    {/* 悬停/聚焦弹出的 Tooltip 提示框 */}
                    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/95 p-2.5 text-xs text-slate-200 shadow-xl mt-2">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-semibold mb-1">
                        <span>下一个里程碑解锁目标</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        {selectedMapDistrict.prosperity >= 80
                          ? "已达成全城地标级！解锁最高商业税收加成与传奇外观特权。"
                          : selectedMapDistrict.prosperity >= 50
                          ? "下一个目标 (80%): 达成地标级。解锁专属商业建筑上限 +5 与高级税收分成。"
                          : "下一个目标 (50%): 进入繁荣扩张期。解锁区域自动化供应链与客流量 +50%。"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                        区块繁荣度升级阶段
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {selectedMapDistrict.prosperity >= 80 ? "✨ 全城地标级" : selectedMapDistrict.prosperity >= 50 ? "📈 繁荣扩张期" : "🏗️ 基础建设中"}
                      </span>
                    </div>
                    <Progress value={selectedMapDistrict.prosperity} className="h-2 bg-slate-800" />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0% 初始</span>
                      <span>当前: {selectedMapDistrict.prosperity}%</span>
                      <span>100% 满级</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setActiveTab(selectedMapDistrict.id);
                      setIsMapOverviewOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 mt-4"
                  >
                    <span>立即前往该区块</span>
                    <span className="text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded">→</span>
                  </Button>
                </div>
              ) : (
                <div className="my-auto text-center space-y-3 py-12 text-slate-400">
                  <Globe2 className="h-10 w-10 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-sm">请在左侧卫星地图中点击任意区块热点以查看详细全景数据。</p>
                </div>
              )}

              <Button
                onClick={() => setIsMapOverviewOpen(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm"
              >
                关闭地图全景
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
