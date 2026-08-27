import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, CircleDollarSign, Database, ExternalLink, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  calculateSimulatedFeeAllocation,
  formatSimulatedIsc,
  shortenHash,
  SIMULATED_TRADE_HISTORY,
  type SimulatedTradeRecord,
} from "@/lib/simulatedTradeHistory";

type Status = SimulatedTradeRecord["status"];

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

export function SimulatedTradeHistoryPanel({ trades = SIMULATED_TRADE_HISTORY }: { trades?: readonly SimulatedTradeRecord[] }) {
  const { lang } = useLanguage();
  const zh = lang === "zh";
  const [expandedId, setExpandedId] = useState<string | null>(trades[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");

  const filteredTrades = useMemo(
    () => trades.filter((trade) => statusFilter === "ALL" || trade.status === statusFilter),
    [statusFilter, trades],
  );
  const completedTrades = trades.filter((trade) => trade.status === "COMPLETED");
  const totalFees = completedTrades.reduce((sum, trade) => sum + Number(trade.feeIsc), 0).toFixed(6);
  const totalTreasury = calculateSimulatedFeeAllocation(totalFees).treasuryIsc;
  const totalMarketing = calculateSimulatedFeeAllocation(totalFees).marketingIsc;

  return (
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
        <div className="flex flex-wrap gap-2" role="group" aria-label={zh ? "交易状态筛选" : "Trade status filter"}>
          {(["ALL", "COMPLETED", "PENDING", "CANCELLED", "FAILED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
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
                {filteredTrades.map((trade) => {
                  const isExpanded = expandedId === trade.id;
                  return (
                    <React.Fragment key={trade.id}>
                      <TableRow className="border-slate-800 hover:bg-slate-800/60">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SimulatedTradeHistoryPanel;
