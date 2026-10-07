import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getShareLeaderboardLocateMessage, getShareLeaderboardTarget } from "@/lib/shareLeaderboardUtils";
import { Award, Crown, LocateFixed, Medal, Users, Trophy } from "lucide-react";

const MEDAL_STYLES = [
  { icon: Crown, className: "text-amber-300", badge: "bg-amber-400/15" },
  { icon: Medal, className: "text-slate-300", badge: "bg-slate-300/15" },
  { icon: Award, className: "text-orange-300", badge: "bg-orange-300/15" },
] as const;

export default function ShareLeaderboard() {
  const { data, isLoading, isError } = trpc.referrals.leaderboard.useQuery({ limit: 10 }, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const currentEntryRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const [highlightedTarget, setHighlightedTarget] = useState<"entry" | "summary" | null>(null);
  const [locateMessage, setLocateMessage] = useState("");

  const handleLocateCurrentUser = () => {
    if (!data) return;

    const targetType = getShareLeaderboardTarget(
      data.currentUserEntry?.userId,
      data.entries.map((entry) => entry.userId),
    );
    const target = targetType === "entry" ? currentEntryRef.current : summaryRef.current;

    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedTarget(targetType);
    setLocateMessage(getShareLeaderboardLocateMessage(data.currentUserRank));

    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedTarget(null);
      setLocateMessage("");
      highlightTimerRef.current = null;
    }, 2200);
  };

  return (
    <Card className="overflow-hidden border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40">
      <CardHeader className="border-b border-white/10 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-cyan-100">
              <Trophy className="h-5 w-5 text-amber-300" />
              分享排行榜
            </CardTitle>
            <p className="mt-1 text-xs text-slate-400">通过专属主页链接邀请新玩家，解锁社交影响力</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 border-cyan-300/25 bg-cyan-400/10 text-xs text-cyan-100 hover:bg-cyan-400/20 hover:text-white"
            onClick={handleLocateCurrentUser}
            disabled={isLoading || isError || !data}
            aria-label="查看我的排名并定位到排行榜中的个人位置"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">查看我的排名</span>
            <span className="sm:hidden">我的排名</span>
          </Button>
        </div>
        {locateMessage ? (
          <p className="mt-2 text-xs text-cyan-200" role="status" aria-live="polite">
            {locateMessage}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="space-y-2" aria-label="正在加载分享排行榜">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl bg-white/10" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-5 text-center text-sm text-red-200">
            分享排行榜暂时无法加载，请稍后重试。
          </div>
        ) : data?.entries.length ? (
          <div className="space-y-2">
            {data.entries.map((entry, index) => {
              const rank = index + 1;
              const medal = MEDAL_STYLES[index];
              const MedalIcon = medal?.icon;
              const isCurrentUser = data.currentUserEntry?.userId === entry.userId;
              const isHighlighted = isCurrentUser && highlightedTarget === "entry";
              return (
                <div
                  key={entry.userId}
                  ref={isCurrentUser ? currentEntryRef : undefined}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                    isHighlighted
                      ? "scale-[1.01] border-cyan-200 bg-cyan-300/20 shadow-[0_0_24px_rgba(34,211,238,0.28)]"
                      : isCurrentUser
                        ? "border-cyan-300/50 bg-cyan-400/10"
                        : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${medal?.badge ?? "bg-white/5"}`}>
                    {MedalIcon ? <MedalIcon className={`h-4 w-4 ${medal.className}`} /> : <span className="text-xs font-bold text-slate-400">#{rank}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">{entry.displayName}</span>
                      {isCurrentUser ? <span className="rounded-full bg-cyan-400/15 px-1.5 py-0.5 text-[10px] text-cyan-200">我</span> : null}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Users className="h-3.5 w-3.5" />
                      成功邀请 {entry.invitationCount} 位新玩家
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-200">#{rank}</span>
                </div>
              );
            })}
            <div
              ref={summaryRef}
              className={`rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                highlightedTarget === "summary"
                  ? "border-cyan-200 bg-cyan-300/20 shadow-[0_0_24px_rgba(34,211,238,0.28)]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>我的排名</span>
                <span className="font-semibold text-cyan-200">{data.currentUserRank ? `#${data.currentUserRank}` : "暂未上榜"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>我的邀请人数</span>
                <span className="font-semibold text-cyan-200">{data.currentUserInvitations} 人</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={summaryRef}
            className={`rounded-xl border border-dashed px-4 py-6 text-center transition-all duration-300 ${
              highlightedTarget === "summary"
                ? "border-cyan-200 bg-cyan-300/20 shadow-[0_0_24px_rgba(34,211,238,0.28)]"
                : "border-cyan-300/20 bg-cyan-400/[0.03]"
            }`}
          >
            <Users className="mx-auto mb-2 h-7 w-7 text-cyan-300/60" />
            <p className="text-sm font-medium text-slate-200">排行榜正在等待第一位邀请达人</p>
            <p className="mt-1 text-xs text-slate-400">分享你的专属主页链接，邀请新玩家加入冰雪城市。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
