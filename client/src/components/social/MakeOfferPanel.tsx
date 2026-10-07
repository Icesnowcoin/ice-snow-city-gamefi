import { useMemo, useState } from "react";
import { BrowserProvider, keccak256, randomBytes } from "ethers";
import { Loader2, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { MainnetReadOnlyTooltip } from "@/components/MainnetReadOnlyTooltip";
import { useNetworkMode } from "@/contexts/NetworkModeContext";

const TYPES = { Order: [
  { name: "offerer", type: "address" }, { name: "nftContract", type: "address" },
  { name: "tokenId", type: "uint256" }, { name: "amount", type: "uint256" },
  { name: "price", type: "uint256" }, { name: "expiration", type: "uint256" },
  { name: "nonce", type: "uint256" }, { name: "itemType", type: "uint8" },
  { name: "orderType", type: "uint8" }, { name: "salt", type: "bytes32" },
] };

export function MakeOfferPanel({ marketplaceAddress, chainId, provider, buyerAddress, nftContract, tokenId, itemType, onSubmitted }: { marketplaceAddress: string; chainId: number; provider?: BrowserProvider | null; buyerAddress?: string | null; nftContract: string; tokenId: string; itemType: 0 | 1; onSubmitted?: (orderHash: string) => void }) {
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState(itemType === 0 ? "1" : "1");
  const [expirationDays, setExpirationDays] = useState("7");
  const [nonce, setNonce] = useState("0");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = trpc.signedNftOrders.submitOffer.useMutation();
  const { isMainnetReadOnly } = useNetworkMode();
  const commission = useMemo(() => { try { return BigInt(price || "0") / BigInt(10); } catch { return BigInt(0); } }, [price]);

  async function handleSubmit() {
    setError(null); setStatus(null);
    if (!provider || !buyerAddress) { setError("请先连接买方钱包。"); return; }
    try {
      const numericPrice = BigInt(price);
      const numericAmount = BigInt(amount);
      if (numericPrice <= BigInt(0) || numericAmount <= BigInt(0)) throw new Error("报价价格和数量必须大于 0。");
      if (itemType === 0 && numericAmount !== BigInt(1)) throw new Error("ERC-721 报价数量必须为 1。");
      const expiration = BigInt(Math.floor(Date.now() / 1000) + Number(expirationDays) * 86400);
      const order = { offerer: buyerAddress, nftContract, tokenId: BigInt(tokenId), amount: numericAmount, price: numericPrice, expiration, nonce: BigInt(nonce), itemType, orderType: 1 as const, salt: keccak256(randomBytes(32)) };
      setStatus("正在唤起钱包签署报价…");
      const signer = await provider.getSigner();
      const signature = await signer.signTypedData({ name: "Ice Snow City Seaport Style Marketplace", version: "2", chainId, verifyingContract: marketplaceAddress }, TYPES, order);
      setStatus("正在提交报价到订单簿…");
      const result = await submit.mutateAsync({ order: { ...order, tokenId: order.tokenId.toString(), amount: order.amount.toString(), price: order.price.toString(), expiration: order.expiration.toString(), nonce: order.nonce.toString() }, signature, chainId, marketplaceAddress });
      setStatus(result.created ? "报价已提交，等待 NFT 持有人接受。" : "该报价已存在，无需重复提交。");
      onSubmitted?.(result.orderHash);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "报价签名或提交失败。";
      setError(message.includes("拒绝") || message.includes("rejected") || message.includes("ACTION_REJECTED") ? "你已取消钱包签名，报价未提交。" : message);
      setStatus(null);
    }
  }

  return <Card className="border-amber-300/20 bg-slate-950/50"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><HandCoins className="h-4 w-4 text-amber-300" />出价（Make Offer）</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><Label htmlFor={`offer-price-${tokenId}`}>报价（ISC）</Label><Input id={`offer-price-${tokenId}`} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} placeholder="输入自定义价格" /></div><div><Label htmlFor={`offer-amount-${tokenId}`}>数量</Label><Input id={`offer-amount-${tokenId}`} inputMode="numeric" value={amount} disabled={itemType === 0} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} /></div></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor={`offer-expiration-${tokenId}`}>有效期（天）</Label><Input id={`offer-expiration-${tokenId}`} inputMode="numeric" value={expirationDays} onChange={(e) => setExpirationDays(e.target.value.replace(/[^0-9]/g, ""))} /></div><div><Label htmlFor={`offer-nonce-${tokenId}`}>Nonce</Label><Input id={`offer-nonce-${tokenId}`} inputMode="numeric" value={nonce} onChange={(e) => setNonce(e.target.value.replace(/[^0-9]/g, ""))} /></div></div><p className="text-xs text-muted-foreground">预览：报价 {price || "0"} ISC · 市场佣金 {commission.toString()} ISC；报价被接受时由买方承担 ISC 授权与 Gas。</p>{status && <Alert><AlertDescription>{submit.isPending && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}{status}</AlertDescription></Alert>}{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<MainnetReadOnlyTooltip><Button type="button" className="w-full" onClick={() => void handleSubmit()} disabled={isMainnetReadOnly || submit.isPending || Boolean(status?.includes("已提交"))}>{submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在提交</> : "签名并提交出价"}</Button></MainnetReadOnlyTooltip></CardContent></Card>;
}
