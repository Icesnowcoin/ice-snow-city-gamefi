import { useMemo, useState } from "react";
import { BrowserProvider, isAddress } from "ethers";
import { AlertCircle, CheckCircle2, FileSignature, Loader2, WalletCards } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  buildSeaportStyleOrder,
  signSeaportStyleOrder,
  type SeaportStyleOrder,
} from "@/lib/seaportOrderSigning";
import { trpc } from "@/lib/trpc";

const BPS_DENOMINATOR = BigInt(10_000);
const MARKET_COMMISSION_BPS = BigInt(1_000);
const SECONDS_PER_DAY = 24 * 60 * 60;
const ISC_DECIMAL_SCALE = BigInt("1000000000000000000");

export type SeaportOrderSignerPanelProps = {
  nftContract: string;
  marketplaceAddress: string;
  chainId: bigint | number;
  provider?: BrowserProvider;
  defaultTokenId?: string;
  defaultAmount?: string;
  defaultNonce?: string;
  onSigned?: (result: { order: SeaportStyleOrder; signature: string; signer: string }) => void;
};

type SignStatus =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function toBigInt(value: string, field: string): bigint {
  if (!/^\d+$/.test(value.trim())) throw new Error(`${field}必须是非负整数`);
  return BigInt(value);
}

function formatIscUnits(value: bigint): string {
  const whole = value / ISC_DECIMAL_SCALE;
  const fraction = (value % ISC_DECIMAL_SCALE).toString().padStart(18, "0").slice(0, 4);
  return `${whole.toString()}.${fraction} ISC`;
}

function getFriendlySigningError(error: unknown): string {
  const candidate = error as { code?: string | number; message?: string } | null;
  const code = String(candidate?.code ?? "").toUpperCase();
  const message = String(candidate?.message ?? "").toLowerCase();

  if (code === "4001" || code === "ACTION_REJECTED" || code === "USER_REJECTED_REQUEST" || message.includes("user rejected") || message.includes("user denied")) {
    return "你已取消钱包签名，订单尚未创建。确认价格和资产信息后，可以再次尝试。";
  }
  if (code === "-32002" || message.includes("already pending") || message.includes("request already pending")) {
    return "钱包中已有待处理的签名请求，请先在钱包中完成或关闭它。";
  }
  if (code === "4902" || message.includes("chain") && message.includes("switch")) {
    return "当前钱包网络与市场配置不一致，请切换到指定网络后重试。";
  }
  if (message.includes("disconnected") || message.includes("no provider") || message.includes("metamask")) {
    return "钱包连接已断开，请重新连接钱包后重试。";
  }
  if (message.includes("does not match order.offerer")) {
    return "当前钱包地址与订单卖家地址不一致，请切换到正确的钱包账户。";
  }
  if (message.includes("invalid") || message.includes("must be") || message.includes("expiration")) {
    return candidate?.message ?? "订单参数无效，请检查价格、数量、有效期和 Nonce。";
  }
  return "钱包签名未完成，请检查钱包状态和网络后重试。订单资产没有发生转移。";
}

export function SeaportOrderSignerPanel({
  nftContract,
  marketplaceAddress,
  chainId,
  provider,
  defaultTokenId = "1",
  defaultAmount = "1",
  defaultNonce = "0",
  onSigned,
}: SeaportOrderSignerPanelProps) {
  const [tokenId, setTokenId] = useState(defaultTokenId);
  const [amount, setAmount] = useState(defaultAmount);
  const [price, setPrice] = useState("");
  const [expirationDays, setExpirationDays] = useState("7");
  const [nonce, setNonce] = useState(defaultNonce);
  const [itemType, setItemType] = useState<"0" | "1">("0");
  const [status, setStatus] = useState<SignStatus>({ kind: "idle" });
  const submitOrder = trpc.signedNftOrders.submit.useMutation();

  const numericPrice = useMemo(() => {
    if (!/^\d+$/.test(price.trim()) || price.trim() === "0") return null;
    return BigInt(price.trim());
  }, [price]);

  const commission = numericPrice === null
    ? null
    : (numericPrice * MARKET_COMMISSION_BPS) / BPS_DENOMINATOR;
  const sellerAmount = numericPrice === null ? null : numericPrice - (commission ?? BigInt(0));

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "idle" });

    try {
      if (!isAddress(nftContract)) throw new Error("NFT 合约地址无效");
      if (!isAddress(marketplaceAddress)) throw new Error("市场合约地址无效");
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("未检测到浏览器钱包，请先安装或打开兼容 EIP-1193 的钱包");
      }

      const activeProvider = provider ?? new BrowserProvider(window.ethereum);
      setStatus({ kind: "signing" });
      const network = await activeProvider.getNetwork();
      if (BigInt(network.chainId) !== BigInt(chainId)) {
        throw new Error(`NETWORK_MISMATCH:${network.chainId.toString()}`);
      }
      const signer = await activeProvider.getSigner();
      const offerer = await signer.getAddress();
      const now = Math.floor(Date.now() / 1000);
      const days = toBigInt(expirationDays, "有效期");
      if (days <= BigInt(0) || days > BigInt(30)) throw new Error("有效期必须为 1–30 天");

      const order = buildSeaportStyleOrder({
        offerer,
        nftContract,
        tokenId: toBigInt(tokenId, "Token ID"),
        amount: toBigInt(amount, "数量"),
        price: toBigInt(price, "价格"),
        expiration: BigInt(now) + days * BigInt(SECONDS_PER_DAY),
        nonce: toBigInt(nonce, "Nonce"),
        itemType: itemType === "0" ? 0 : 1,
        salt: `0x${crypto.randomUUID().replaceAll("-", "").padEnd(64, "0")}`,
      });

      const result = await signSeaportStyleOrder(activeProvider, order, chainId, marketplaceAddress);
      setStatus({ kind: "submitting" });
      let submission: Awaited<ReturnType<typeof submitOrder.mutateAsync>>;
      try {
        submission = await submitOrder.mutateAsync({
          order: {
          offerer: result.order.offerer,
          nftContract: result.order.nftContract,
          tokenId: result.order.tokenId.toString(),
          amount: result.order.amount.toString(),
          price: result.order.price.toString(),
          expiration: result.order.expiration.toString(),
          nonce: result.order.nonce.toString(),
          itemType: result.order.itemType,
          salt: result.order.salt,
        },
        signature: result.signature,
        chainId: Number(chainId),
          marketplaceAddress,
        });
      } catch (submissionError) {
        const detail = submissionError instanceof Error ? submissionError.message : "后端暂时不可用";
        throw new Error(`ORDER_SUBMIT_FAILED:${detail}`);
      }
      onSigned?.(result);
      setStatus({ kind: "success", message: submission.message });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      const message = rawMessage.startsWith("NETWORK_MISMATCH:")
        ? "当前钱包网络与市场配置不一致，请切换到指定网络后重试。"
        : rawMessage.startsWith("ORDER_SUBMIT_FAILED:")
          ? "签名已完成，但订单提交失败，请稍后重试；链上资产尚未发生转移。"
          : rawMessage.startsWith("未检测到钱包") || rawMessage.endsWith("地址无效") || rawMessage.includes("必须")
            ? rawMessage
            : getFriendlySigningError(error);
      setStatus({ kind: "error", message });
    }
  };

  return (
    <Card className="w-full max-w-xl overflow-hidden border-cyan-400/30 bg-slate-950/90 text-slate-100 shadow-2xl shadow-cyan-950/30">
      <CardHeader className="border-b border-white/10 bg-gradient-to-r from-cyan-950/60 to-slate-950/40 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg"><FileSignature className="h-5 w-5 text-cyan-300" />创建 NFT 订单</CardTitle>
            <CardDescription className="mt-1 text-slate-300">使用钱包签署 EIP-712 订单，不会自动发送成交交易。</CardDescription>
          </div>
          <Badge variant="outline" className="border-cyan-300/40 text-cyan-200">ISC 市场</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="seaport-token-id">Token ID</Label>
              <Input id="seaport-token-id" inputMode="numeric" value={tokenId} onChange={(event) => setTokenId(event.target.value)} placeholder="例如 42" className="bg-slate-900/80" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seaport-amount">数量</Label>
              <Input id="seaport-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={itemType === "0"} className="bg-slate-900/80" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="seaport-item-type">资产标准</Label>
              <Select value={itemType} onValueChange={(value: "0" | "1") => { setItemType(value); if (value === "0") setAmount("1"); }}>
                <SelectTrigger id="seaport-item-type" className="bg-slate-900/80"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="0">ERC-721 土地/建筑</SelectItem><SelectItem value="1">ERC-1155 物品</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seaport-price">价格（ISC 最小单位）</Label>
              <Input id="seaport-price" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="例如 1000000000000000000000" className="bg-slate-900/80" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="seaport-expiration">有效期（天）</Label>
              <Input id="seaport-expiration" inputMode="numeric" min="1" max="30" value={expirationDays} onChange={(event) => setExpirationDays(event.target.value)} className="bg-slate-900/80" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seaport-nonce">Nonce</Label>
              <Input id="seaport-nonce" inputMode="numeric" value={nonce} onChange={(event) => setNonce(event.target.value)} className="bg-slate-900/80" />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
            <div className="mb-2 flex items-center gap-2 text-slate-300"><WalletCards className="h-4 w-4 text-cyan-300" />签名前费用预览</div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-400">成交总价</span><strong className="text-right">{numericPrice === null ? "—" : formatIscUnits(numericPrice)}</strong>
              <span className="text-slate-400">市场佣金（10%）</span><strong className="text-right text-amber-300">{commission === null ? "—" : formatIscUnits(commission)}</strong>
              <span className="text-slate-400">卖家预计所得</span><strong className="text-right text-emerald-300">{sellerAmount === null ? "—" : formatIscUnits(sellerAmount)}</strong>
            </div>
          </div>

          {status.kind === "error" && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>无法签名</AlertTitle><AlertDescription>{status.message}</AlertDescription></Alert>}
          {status.kind === "success" && <Alert className="border-emerald-400/30 bg-emerald-950/30 text-emerald-100"><CheckCircle2 className="h-4 w-4" /><AlertTitle>已完成</AlertTitle><AlertDescription>{status.message}</AlertDescription></Alert>}

          <Button type="submit" className="h-12 w-full bg-cyan-500 text-slate-950 hover:bg-cyan-300" disabled={status.kind === "signing" || status.kind === "submitting"}>
            {status.kind === "signing" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />等待钱包确认…</> : status.kind === "submitting" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在提交订单…</> : <><FileSignature className="mr-2 h-4 w-4" />一键签署 EIP-712 订单</>}
          </Button>
          <p className="text-center text-xs leading-5 text-slate-400">签名前请确认 NFT 已由你的钱包批准市场合约；签名本身不转移资产，Gas 由发起链上交易的用户承担。</p>
        </form>
      </CardContent>
    </Card>
  );
}
