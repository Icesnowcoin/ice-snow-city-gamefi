import { useMemo, useState } from "react";
import type { BrowserProvider, Signer } from "ethers";
import { ArrowDownUp, FilterX, Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignedOrderCancelAction } from "@/components/social/SignedOrderCancelAction";
import { SignedOrderPurchaseAction, type PurchaseOrder } from "@/components/social/SignedOrderPurchaseAction";
import { MakeOfferPanel } from "@/components/social/MakeOfferPanel";
import { trpc } from "@/lib/trpc";

const STATUS_LABELS = {
  all: "全部状态",
  active: "进行中",
  cancelled: "已取消",
  fulfilled: "已成交",
  expired: "已过期",
} as const;

type StatusFilter = keyof typeof STATUS_LABELS;
type SortMode = "newest" | "oldest" | "priceAsc" | "priceDesc";

type OrderRow = {
  orderHash: string;
  offerer: string;
  nftContract: string;
  tokenId: string;
  amount: string;
  price: string;
  expiration: string;
  nonce: string;
  itemType: number;
  salt: string;
  signature: string;
  chainId: number;
  marketplaceAddress: string;
  status: "active" | "cancelled" | "fulfilled" | "expired";
  orderType?: 0 | 1;
  createdAt: Date | string;
};

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "创建时间未知" : date.toLocaleString();
}

function shorten(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function SignedNftOrderList({ marketplaceAddress, chainId, provider, signer, buyerAddress, iscTokenAddress }: { marketplaceAddress?: string; chainId?: number; provider?: BrowserProvider | null; signer?: Signer | null; buyerAddress?: string | null; iscTokenAddress?: string }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.signedNftOrders.active.useQuery({ limit: 100, offset: 0 });

  const orders = useMemo(() => {
    const rows = ((data ?? []) as OrderRow[]).filter((order) => statusFilter === "all" || order.status === statusFilter);
    return [...rows].sort((left, right) => {
      if (sortMode === "priceAsc") return BigInt(left.price) < BigInt(right.price) ? -1 : BigInt(left.price) > BigInt(right.price) ? 1 : 0;
      if (sortMode === "priceDesc") return BigInt(left.price) > BigInt(right.price) ? -1 : BigInt(left.price) < BigInt(right.price) ? 1 : 0;
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return sortMode === "newest" ? rightTime - leftTime : leftTime - rightTime;
    });
  }, [data, sortMode, statusFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setSortMode("newest");
  };

  return (
    <Card className="mt-6">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-cyan-300" />签名订单列表</CardTitle>
          <Badge variant="outline">{orders.length} 条结果</Badge>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger aria-label="按订单状态筛选"><SelectValue placeholder="订单状态" /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
            <SelectTrigger aria-label="订单排序方式"><SelectValue placeholder="排序" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">创建时间：最新</SelectItem>
              <SelectItem value="oldest">创建时间：最早</SelectItem>
              <SelectItem value="priceAsc">价格：从低到高</SelectItem>
              <SelectItem value="priceDesc">价格：从高到低</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={clearFilters} disabled={statusFilter === "all" && sortMode === "newest"}><FilterX className="mr-2 h-4 w-4" />清除</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />正在加载真实订单…</div>}
        {error && <p className="py-8 text-center text-sm text-rose-300">订单列表加载失败，请稍后重试。</p>}
        {!isLoading && !error && orders.length === 0 && <div className="rounded-lg border border-dashed border-cyan-400/30 py-10 text-center text-sm text-muted-foreground">没有符合当前筛选条件的真实订单。<br /><Button type="button" variant="link" onClick={clearFilters} className="mt-2">清除筛选条件</Button></div>}
        <div className="space-y-3">
          {orders.map((order) => {
            const canRenderCancel = order.status === "active" && (!marketplaceAddress || marketplaceAddress.toLowerCase() === order.marketplaceAddress.toLowerCase()) && (chainId === undefined || chainId === order.chainId);
            const purchaseOrder = order as unknown as PurchaseOrder;
            return <div key={order.orderHash} className="rounded-xl border border-white/10 bg-slate-950/40 p-4 transition-colors hover:border-cyan-300/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><Badge>{order.itemType === 0 ? "ERC-721" : "ERC-1155"}</Badge><span className="font-mono text-sm text-cyan-100">Token #{order.tokenId}</span></div>
                  <p className="mt-2 text-xs text-muted-foreground">卖家 {shorten(order.offerer)} · 订单 {shorten(order.orderHash)}</p>
                </div>
                <div className="text-right"><p className="text-lg font-semibold text-cyan-100">{order.price} ISC</p><p className="text-xs text-muted-foreground">{STATUS_LABELS[order.status]}</p></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>数量：{order.amount}</span><span>创建：{formatDate(order.createdAt)}</span></div>
              <div className="mt-3 space-y-2">
                {iscTokenAddress && buyerAddress?.toLowerCase() !== order.offerer.toLowerCase() && <SignedOrderPurchaseAction order={purchaseOrder} iscTokenAddress={iscTokenAddress} provider={provider} signer={signer} buyerAddress={buyerAddress} onFulfilled={() => void utils.signedNftOrders.active.invalidate()} />}
                {order.status === "active" && order.orderType !== 1 && marketplaceAddress && buyerAddress?.toLowerCase() !== order.offerer.toLowerCase() && <MakeOfferPanel marketplaceAddress={marketplaceAddress} chainId={order.chainId} provider={provider} buyerAddress={buyerAddress} nftContract={order.nftContract} tokenId={order.tokenId} itemType={order.itemType as 0 | 1} onSubmitted={() => void utils.signedNftOrders.active.invalidate()} />}
                {canRenderCancel && <SignedOrderCancelAction order={order as never} marketplaceAddress={order.marketplaceAddress} expectedChainId={order.chainId} />}
              </div>
            </div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
