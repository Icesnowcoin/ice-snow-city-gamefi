import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronUp, CircleDollarSign, Clock3, Copy, Database, ExternalLink, LoaderCircle, RefreshCw, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptionalSimulatedTradeNotifications } from "@/contexts/SimulatedTradeNotificationContext";
import {
  calculateSimulatedFeeAllocation,
  formatSimulatedIsc,
  shortenHash,
  SIMULATED_TRADE_HISTORY,
  type SimulatedTradeRecord,
} from "@/lib/simulatedTradeHistory";
import { createSimulatedStatusEvent, useSimulatedTradeSocket, type SimulatedTradeSocket } from "@/lib/simulatedTradeSocket";

type Status = SimulatedTradeRecord["status"];

function TradeHistorySkeleton({ zh }: { zh: boolean }) {
  return (
    <div className="mb-3 rounded-xl border border-cyan-400/15 bg-slate-950/40 p-3" role="status" aria-live="polite" aria-busy="true" data-testid="trade-history-skeleton">
      <div className="mb-3 flex items-center gap-2 text-xs text-cyan-200">
        <span className="h-2 w-2 rounded-full bg-cyan-300 motion-safe:animate-pulse" />
        {zh ? "正在同步模拟订单状态…" : "Syncing simulated order status…"}
      </div>
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 gap-3 rounded-lg border border-slate-800/80 p-2">
            <Skeleton className="h-3 w-20 bg-cyan-100/10" />
            <Skeleton className="h-3 w-28 bg-cyan-100/10" />
            <Skeleton className="h-3 w-16 bg-cyan-100/10" />
            <Skeleton className="h-3 w-20 bg-cyan-100/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

const statusClass: Record<Status, string> = {
  PENDING: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  COMPLETED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  CANCELLED: "border-slate-400/40 bg-slate-400/10 text-slate-300",
  FAILED: "border-rose-400/40 bg-rose-400/10 text-rose-200",
};

const statusLabel: Record<Status, { zh: string; en: string }> = {
  PENDING: { zh: "待处理", en: "Pending" },
  COMPLETED: { zh: "已完成", en: "Completed" },
  CANCELLED: { zh: "已取消", en: "Cancelled" },
  FAILED: { zh: "失败", en: "Failed" },
};

function TradeFeeDetails({ trade, zh }: { trade: SimulatedTradeRecord; zh: boolean }) {
  const allocation = calculateSimulatedFeeAllocation(trade.feeIsc);
  return (
    <div className="grid gap-3 rounded-xl border border-cyan-400/15 bg-slate-950/60 p-3 text-xs sm:grid-cols-3">
      <div>
        <p className="text-slate-500">{zh ? "手续费总额" : "Total fee"}</p>
        <p className="mt-1 font-semibold text-cyan-200">{formatSimulatedIsc(allocation.totalFeeIsc)} ISC</p>
      </div>
      <div>
        <p className="text-slate-500">{zh ? "国库（60%）" : "Treasury (60%)"}</p>
        <p className="mt-1 font-semibold text-emerald-300">{formatSimulatedIsc(allocation.treasuryIsc)} ISC</p>
      </div>
      <div>
        <p className="text-slate-500">{zh ? "营销钱包（40%）" : "Marketing (40%)"}</p>
        <p className="mt-1 font-semibold text-violet-300">{formatSimulatedIsc(allocation.marketingIsc)} ISC</p>
      </div>
    </div>
  );
}

export function SimulatedTradeHistoryPanel({
  trades: initialTrades = SIMULATED_TRADE_HISTORY,
  socket,
}: {
  trades?: readonly SimulatedTradeRecord[];
  socket?: SimulatedTradeSocket;
}) {
  const { lang } = useLanguage();
  const zh = lang === "zh";
  const stream = useSimulatedTradeSocket(socket, initialTrades, { maxReconnectAttempts: 3, reconnectBaseDelayMs: 250 });
  const simulatedNotificationCenter = useOptionalSimulatedTradeNotifications();
  const retrySequenceRef = useRef(stream.lastSequence);
  retrySequenceRef.current = Math.max(retrySequenceRef.current, stream.lastSequence);
  const trades = stream.trades;
  const connectionCopy = {
    OPEN: { zh: "实时连接", en: "Live connected", className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
    CONNECTING: { zh: "连接中", en: "Connecting", className: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200" },
    RECONNECTING: { zh: `重连中（第 ${stream.reconnectAttempt} 次）`, en: `Reconnecting (attempt ${stream.reconnectAttempt})`, className: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
    CLOSED: { zh: "实时连接已关闭", en: "Live disconnected", className: "border-slate-600 bg-slate-800/40 text-slate-400" },
  }[stream.connectionState];
  const [expandedId, setExpandedId] = useState<string | null>(trades[0]?.id ?? null);
  const [highlightedTradeId, setHighlightedTradeId] = useState<string | null>(null);
  const [tradeToast, setTradeToast] = useState<SimulatedTradeRecord | null>(null);
  const [toastDetailsOpen, setToastDetailsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [retryingTradeId, setRetryingTradeId] = useState<string | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const copyFeedbackTimerRef = useRef<number | undefined>(undefined);
  const lastToastEventRef = useRef<string | null>(null);

  useEffect(() => {
    if (!stream.lastEventTradeId) return;
    setHighlightedTradeId(stream.lastEventTradeId);
    const timeout = window.setTimeout(() => setHighlightedTradeId(null), 800);
    return () => window.clearTimeout(timeout);
  }, [stream.lastEventTradeId]);

  useEffect(() => {
    if (!socket || !simulatedNotificationCenter) return;
    const unregister = simulatedNotificationCenter.registerRetryHandler(async (failedTrades, onProgress) => {
      let success = 0;
      let failed = 0;
      let skipped = 0;
      for (let index = 0; index < failedTrades.length; index += 1) {
        const trade = failedTrades[index];
        try {
          if (trade.status !== "FAILED") {
            skipped += 1;
          } else {
            retrySequenceRef.current += 1;
            const retryHash = `0xsimulatedretry${trade.tokenId.replace(/\D/g, "")}${retrySequenceRef.current}`;
            socket.publish(createSimulatedStatusEvent(trade.id, retrySequenceRef.current, "PENDING", retryHash));
            success += 1;
          }
        } catch {
          failed += 1;
        }
        onProgress?.(index + 1, failedTrades.length);
        await new Promise((resolve) => window.setTimeout(resolve, 20));
      }
      return { total: failedTrades.length, success, failed, skipped };
    });
    return unregister;
  }, [simulatedNotificationCenter, socket]);

  useEffect(() => {
    const trade = stream.lastEventTradeId ? stream.trades.find((item) => item.id === stream.lastEventTradeId) : undefined;
    const eventKey = stream.lastEventTradeId ? `${stream.lastEventTradeId}:${stream.lastSequence}` : null;
    if (!trade || !["PENDING", "COMPLETED", "FAILED"].includes(trade.status) || lastToastEventRef.current === eventKey) return;
    lastToastEventRef.current = eventKey;
    simulatedNotificationCenter?.recordNotification(trade, stream.lastSequence);
    setTradeToast(trade);
    if (trade.status === "PENDING" && retryingTradeId === trade.id) setRetryingTradeId(null);
    setToastDetailsOpen(false);
    setCopyFeedback("idle");
    if (copyFeedbackTimerRef.current !== undefined) {
      window.clearTimeout(copyFeedbackTimerRef.current);
      copyFeedbackTimerRef.current = undefined;
    }
    if (toastTimerRef.current !== undefined) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = undefined;
    }
    if (trade.status === "PENDING") return;
    toastTimerRef.current = window.setTimeout(() => setTradeToast(null), 3200);
    return () => {
      if (toastTimerRef.current !== undefined) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = undefined;
      }
    };
  }, [retryingTradeId, simulatedNotificationCenter, stream.lastEventTradeId, stream.lastSequence, stream.trades]);

  useEffect(() => () => {
    if (toastTimerRef.current !== undefined) window.clearTimeout(toastTimerRef.current);
    if (copyFeedbackTimerRef.current !== undefined) window.clearTimeout(copyFeedbackTimerRef.current);
  }, []);

  const handleRetryTrade = () => {
    if (!tradeToast || tradeToast.status !== "FAILED" || !socket || retryingTradeId === tradeToast.id) return;
    setRetryingTradeId(tradeToast.id);
    const nextSequence = stream.lastSequence + 1;
    const retryHash = `0xsimulatedretry${tradeToast.tokenId.replace(/\D/g, "")}`;
    socket.publish(createSimulatedStatusEvent(tradeToast.id, nextSequence, "PENDING", retryHash));
  };

  const handleCopyTradeLog = async () => {
    if (!tradeToast) return;
    const allocation = calculateSimulatedFeeAllocation(tradeToast.feeIsc);
    const log = [
      `Ice Snow City simulated trade log`,
      `Trade ID: ${tradeToast.id}`,
      `Status: ${tradeToast.status}`,
      `Order type: ${tradeToast.kind}`,
      `NFT: ${tradeToast.nftName}`,
      `Token ID: ${tradeToast.tokenId}`,
      `Price: ${tradeToast.priceIsc} ISC`,
      `Fee: ${tradeToast.feeIsc} ISC (Treasury 60%: ${allocation.treasuryIsc} ISC; Marketing 40%: ${allocation.marketingIsc} ISC)`,
      `Network: ${tradeToast.network}`,
      `Created at: ${tradeToast.createdAt}`,
      `Transaction hash: ${tradeToast.txHash}`,
      ...(tradeToast.status === "FAILED" ? ["Error: Simulated trade reported FAILED; no provider error payload was supplied."] : []),
    ].join("\n");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(log);
      setCopyFeedback("success");
    } catch {
      setCopyFeedback("error");
    }
    if (copyFeedbackTimerRef.current !== undefined) window.clearTimeout(copyFeedbackTimerRef.current);
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopyFeedback("idle");
      copyFeedbackTimerRef.current = undefined;
    }, 2400);
  };

  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [displayLimit, setDisplayLimit] = useState(50);

  const filteredTrades = useMemo(
    () => trades.filter((trade) => statusFilter === "ALL" || trade.status === statusFilter),
    [statusFilter, trades],
  );
  const completedTrades = trades.filter((trade) => trade.status === "COMPLETED");
  const totalFees = completedTrades.reduce((sum, trade) => sum + Number(trade.feeIsc), 0).toFixed(6);
  const totalTreasury = calculateSimulatedFeeAllocation(totalFees).treasuryIsc;
  const totalMarketing = calculateSimulatedFeeAllocation(totalFees).marketingIsc;
  const toastVisual = tradeToast && tradeToast.status !== "CANCELLED" && {
    PENDING: { border: "border-amber-300/40", text: "text-amber-100", accent: "text-amber-300", shadow: "shadow-amber-950/30", label: zh ? "模拟交易待处理" : "Simulated trade pending", icon: <Clock3 className="h-4 w-4" aria-hidden="true" data-testid="simulated-trade-pending-icon" /> },
    COMPLETED: { border: "border-emerald-300/40", text: "text-emerald-100", accent: "text-emerald-300", shadow: "shadow-emerald-950/30", label: zh ? "模拟交易已完成" : "Simulated trade completed", icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" data-testid="simulated-trade-completed-icon" /> },
    FAILED: { border: "border-rose-300/40", text: "text-rose-100", accent: "text-rose-300", shadow: "shadow-rose-950/30", label: zh ? "模拟交易失败" : "Simulated trade failed", icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" data-testid="simulated-trade-failed-icon" /> },
  }[tradeToast.status];

  return (
    <>
      {tradeToast && toastVisual && (
        <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(22rem,calc(100vw-2rem))]" role="status" aria-live="polite" data-testid={`simulated-trade-${tradeToast.status.toLowerCase()}-toast`}>
          <div className={`pointer-events-auto rounded-xl border bg-slate-950/95 px-4 py-3 shadow-2xl motion-safe:animate-pulse ${toastVisual.border} ${toastVisual.text} ${toastVisual.shadow}`}>
            <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${toastVisual.accent}`}>
              {toastVisual.icon}
              <span>{toastVisual.label}</span>
            </div>
            <p className="mt-1 text-sm font-medium">{tradeToast.nftName}</p>
            {tradeToast.status === "PENDING" && (
              <div className="mt-2" role="progressbar" aria-label={zh ? "交易处理中" : "Transaction processing"} aria-valuetext={zh ? "正在处理中" : "Processing"} data-testid="simulated-trade-pending-progress">
                <div className="h-1.5 overflow-hidden rounded-full bg-amber-950/70">
                  <div className="h-full w-[42%] rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)] motion-safe:animate-[pending-toast-progress_1.4s_ease-in-out_infinite]" />
                </div>
                <p className="mt-1 text-[11px] text-amber-200/80">{zh ? "正在等待模拟网络确认…" : "Waiting for simulated network confirmation…"}</p>
              </div>
            )}
            <p className="mt-1 truncate text-xs text-slate-400">{shortenHash(tradeToast.txHash)}</p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 transition-colors hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              aria-expanded={toastDetailsOpen}
              aria-controls="simulated-trade-toast-details"
              onClick={() => setToastDetailsOpen((open) => !open)}
              data-testid="simulated-trade-details-toggle"
            >
              {toastDetailsOpen ? (zh ? "收起详情" : "Hide details") : (zh ? "查看详情" : "View details")}
            </button>
            {toastDetailsOpen && (
              <div id="simulated-trade-toast-details" className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-300" data-testid="simulated-trade-toast-details">
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div><dt className="text-slate-500">{zh ? "订单类型" : "Order type"}</dt><dd className="mt-0.5 font-medium text-slate-200">{tradeToast.kind}</dd></div>
                  <div><dt className="text-slate-500">Token ID</dt><dd className="mt-0.5 font-medium text-slate-200">{tradeToast.tokenId}</dd></div>
                  <div><dt className="text-slate-500">{zh ? "价格" : "Price"}</dt><dd className="mt-0.5 font-medium text-cyan-200">{formatSimulatedIsc(tradeToast.priceIsc)} ISC</dd></div>
                  <div><dt className="text-slate-500">{zh ? "状态" : "Status"}</dt><dd className="mt-0.5 font-medium">{statusLabel[tradeToast.status][zh ? "zh" : "en"]}</dd></div>
                  <div><dt className="text-slate-500">{zh ? "网络" : "Network"}</dt><dd className="mt-0.5 font-medium text-slate-200">local-hardhat</dd></div>
                  <div><dt className="text-slate-500">{zh ? "手续费" : "Fee"}</dt><dd className="mt-0.5 font-medium text-cyan-200">{formatSimulatedIsc(tradeToast.feeIsc)} ISC</dd></div>
                  <div className="col-span-2"><dt className="text-slate-500">{zh ? "时间" : "Time"}</dt><dd className="mt-0.5 font-medium text-slate-200">{new Date(tradeToast.createdAt).toLocaleString(zh ? "zh-CN" : "en-US")}</dd></div>
                  <div className="col-span-2"><dt className="text-slate-500">{zh ? "交易哈希" : "Transaction hash"}</dt><dd className="mt-0.5 break-all font-mono text-[11px] text-slate-200">{tradeToast.txHash}</dd></div>
                </dl>
                {tradeToast.status === "FAILED" && (
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-rose-300/35 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-200/70 hover:bg-rose-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleRetryTrade}
                    disabled={!socket || retryingTradeId === tradeToast.id}
                    aria-busy={retryingTradeId === tradeToast.id}
                    data-testid="simulated-trade-retry"
                  >
                    {retryingTradeId === tradeToast.id ? <LoaderCircle className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
                    {retryingTradeId === tradeToast.id ? (zh ? "重试中…" : "Retrying…") : (zh ? "重试" : "Retry")}
                  </button>
                )}
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-cyan-300/30 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:border-cyan-200/60 hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                  onClick={() => void handleCopyTradeLog()}
                  data-testid="simulated-trade-copy-log"
                >
                  {copyFeedback === "success" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                  {copyFeedback === "success" ? (zh ? "日志已复制" : "Log copied") : (zh ? "复制日志" : "Copy log")}
                </button>
                {copyFeedback === "error" && <p className="mt-1 text-[11px] text-rose-300" role="alert">{zh ? "复制失败，请检查浏览器权限" : "Copy failed; check browser permissions"}</p>}
              </div>
            )}
          </div>
        </div>
      )}
      <Card className="border-cyan-400/20 bg-slate-900/95 text-white shadow-2xl shadow-cyan-950/20">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-cyan-200">
              <ShoppingBag className="h-5 w-5" />
              {zh ? "模拟市场交易历史" : "Simulated Market History"}
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              {zh ? "本地 Hardhat 环境 · 不代表真实链上记录" : "Local Hardhat environment · not live-chain data"}
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit border-amber-300/40 bg-amber-300/10 text-amber-200">
            <Database className="mr-1 h-3 w-3" />
            {zh ? "仅模拟" : "Simulation only"}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
            <p className="text-xs text-slate-500">{zh ? "已完成订单" : "Completed trades"}</p>
            <p className="mt-1 text-lg font-semibold text-white">{completedTrades.length}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
            <p className="text-xs text-slate-500">{zh ? "累计手续费" : "Total fees"}</p>
            <p className="mt-1 text-lg font-semibold text-cyan-200">{formatSimulatedIsc(totalFees)} ISC</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
            <p className="text-xs text-slate-500">{zh ? "国库 / 营销" : "Treasury / Marketing"}</p>
            <p className="mt-1 text-sm font-semibold"><span className="text-emerald-300">{formatSimulatedIsc(totalTreasury)}</span><span className="text-slate-500"> / </span><span className="text-violet-300">{formatSimulatedIsc(totalMarketing)} ISC</span></p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <Badge variant="outline" className={connectionCopy.className}>
            {zh ? connectionCopy.zh : connectionCopy.en}
          </Badge>
          {stream.lastError && (
            <span role="status" className="text-xs text-rose-300">
              {zh ? `模拟网络提示：${stream.lastError.message}` : `Simulation network: ${stream.lastError.message}`}
            </span>
          )}
          {stream.lastSequence > 0 && <span className="text-xs text-slate-500">{zh ? `已同步事件 ${stream.lastSequence}` : `Event ${stream.lastSequence} synced`}</span>}
        </div>
        {(stream.connectionState === "CONNECTING" || stream.connectionState === "RECONNECTING") && <TradeHistorySkeleton zh={zh} />}
        <div className="flex flex-wrap gap-2" role="group" aria-label={zh ? "交易状态筛选" : "Trade status filter"}>
          {(["ALL", "COMPLETED", "PENDING", "CANCELLED", "FAILED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statusFilter === status}
              onClick={() => {
                setStatusFilter(status);
                setDisplayLimit(50);
                setExpandedId(null);
              }}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${statusFilter === status ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-slate-700 text-slate-400 hover:border-cyan-400/50"}`}
            >
              {status === "ALL" ? (zh ? "全部" : "All") : statusLabel[status][zh ? "zh" : "en"]}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredTrades.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">{zh ? "没有符合条件的模拟交易" : "No simulated trades match this filter"}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">{zh ? "订单" : "Order"}</TableHead>
                  <TableHead className="text-slate-400">{zh ? "NFT" : "NFT"}</TableHead>
                  <TableHead className="text-right text-slate-400">{zh ? "价格" : "Price"}</TableHead>
                  <TableHead className="text-slate-400">{zh ? "状态" : "Status"}</TableHead>
                  <TableHead className="text-slate-400">{zh ? "时间" : "Time"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.slice(0, displayLimit).map((trade) => {
                  const isExpanded = expandedId === trade.id;
                  return (
                    <React.Fragment key={trade.id}>
                      <TableRow className={`border-slate-800 transition-colors duration-300 hover:bg-slate-800/60 ${highlightedTradeId === trade.id ? "bg-cyan-400/10" : ""}`}>
                        <TableCell>
                          <button type="button" className="flex items-center gap-2 text-left text-xs font-semibold text-cyan-200" onClick={() => setExpandedId(isExpanded ? null : trade.id)} aria-expanded={isExpanded}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span>{trade.kind}</span>
                          </button>
                          <p className="mt-1 pl-6 text-[11px] text-slate-500">{trade.id}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-100">{trade.nftName}</p>
                          <p className="text-xs text-slate-500">{trade.tokenId}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-cyan-100">{formatSimulatedIsc(trade.priceIsc)} ISC</TableCell>
                        <TableCell><Badge variant="outline" className={statusClass[trade.status]}>{statusLabel[trade.status][zh ? "zh" : "en"]}</Badge></TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-slate-400">{new Date(trade.createdAt).toLocaleString(zh ? "zh-CN" : "en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="border-slate-800 bg-slate-950/30 hover:bg-slate-950/30">
                          <TableCell colSpan={5}>
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                                <span>{zh ? "卖方" : "Seller"}: {trade.seller}</span>
                                {trade.buyer && <span>{zh ? "买方" : "Buyer"}: {trade.buyer}</span>}
                                <span className="inline-flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5 text-cyan-300" />{zh ? "网络" : "Network"}: local-hardhat</span>
                                <span className="inline-flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5 text-cyan-300" />{shortenHash(trade.txHash)}</span>
                              </div>
                              <TradeFeeDetails trade={trade} zh={zh} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
            {filteredTrades.length > displayLimit && (
              <div className="flex justify-center border-t border-slate-800 p-3">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((limit) => limit + 50)}
                  className="rounded-full border border-cyan-400/30 px-4 py-2 text-xs text-cyan-200 transition-colors hover:bg-cyan-400/10"
                >
                  {zh ? `加载更多（已显示 ${Math.min(displayLimit, filteredTrades.length)} / ${filteredTrades.length}）` : `Load more (${Math.min(displayLimit, filteredTrades.length)} / ${filteredTrades.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      </Card>
    </>
  );
}

export default SimulatedTradeHistoryPanel;
