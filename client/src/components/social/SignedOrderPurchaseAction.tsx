import { useState } from "react";
import { BrowserProvider, Contract, Signer, formatEther, isAddress } from "ethers";
import { CheckCircle2, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { getExplorerTxUrl } from "./SignedOrderCancelAction";

const MARKETPLACE_ABI = [
  "function executeOrder((address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,bytes32 salt) order, bytes signature) external",
];
const ISC_ABI = [
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function allowance(address owner,address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
];

export type PurchaseOrder = {
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
};

type Props = {
  order: PurchaseOrder;
  iscTokenAddress: string;
  provider?: BrowserProvider | null;
  signer?: Signer | null;
  buyerAddress?: string | null;
  onFulfilled?: (orderHash: string, txHash: string) => void;
};

function friendlyError(error: unknown) {
  const candidate = error as { code?: string | number; message?: string } | null;
  const code = String(candidate?.code ?? "").toUpperCase();
  const message = String(candidate?.message ?? "").toLowerCase();
  if (code === "4001" || code === "ACTION_REJECTED" || message.includes("user rejected") || message.includes("user denied")) return "你已取消钱包确认，订单仍保持有效。";
  if (code === "INSUFFICIENT_FUNDS" || message.includes("insufficient funds")) return "钱包原生币余额不足以支付 Gas。";
  if (message.includes("insufficient allowance")) return "ISC 授权额度不足，请重新授权后重试。";
  if (message.includes("insufficient balance")) return "ISC 余额不足，无法完成购买。";
  return "购买交易未完成，请检查钱包网络、ISC 余额和 NFT 状态后重试。";
}

function toContractOrder(order: PurchaseOrder) {
  return {
    offerer: order.offerer,
    nftContract: order.nftContract,
    tokenId: BigInt(order.tokenId),
    amount: BigInt(order.amount),
    price: BigInt(order.price),
    expiration: BigInt(order.expiration),
    nonce: BigInt(order.nonce),
    itemType: order.itemType,
    salt: order.salt,
  };
}

export function SignedOrderPurchaseAction({ order, iscTokenAddress, provider, signer, buyerAddress, onFulfilled }: Props) {
  const [state, setState] = useState<{ kind: "idle" | "loading" | "success" | "error"; message?: string }>({ kind: "idle" });
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const recordFulfilled = trpc.signedNftOrders.recordFulfilled.useMutation();

  if (order.status !== "active") return null;

  const openConfirmation = async () => {
    setConfirmationOpen(true);
    setEstimatedGas(null);
    if (!provider || !signer || !buyerAddress || !isAddress(order.marketplaceAddress)) return;
    setIsEstimatingGas(true);
    try {
      const marketplace = new Contract(order.marketplaceAddress, MARKETPLACE_ABI, provider);
      const execute = marketplace.getFunction("executeOrder");
      const gasLimit = await execute.estimateGas(toContractOrder(order), order.signature, { from: buyerAddress });
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice;
      if (gasPrice) setEstimatedGas(formatEther(gasLimit * gasPrice));
    } catch {
      setEstimatedGas(null);
    } finally {
      setIsEstimatingGas(false);
    }
  };

  const purchase = async () => {
    setConfirmationOpen(false);
    setState({ kind: "loading", message: "正在准备购买，请在钱包中确认授权和成交…" });
    let toastId: string | number | undefined;
    try {
      if (!signer || !provider || !buyerAddress) throw new Error("WALLET_NOT_CONNECTED");
      if (!isAddress(iscTokenAddress) || !isAddress(order.marketplaceAddress) || !isAddress(order.offerer) || !isAddress(order.nftContract)) throw new Error("INVALID_ADDRESS");
      if (buyerAddress.toLowerCase() === order.offerer.toLowerCase()) throw new Error("SELF_PURCHASE");
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(order.chainId)) throw new Error("NETWORK_MISMATCH");

      const token = new Contract(iscTokenAddress, ISC_ABI, signer);
      const balance = await token.balanceOf(buyerAddress);
      const price = BigInt(order.price);
      if (balance < price) throw new Error("INSUFFICIENT_BALANCE");
      const allowance = await token.allowance(buyerAddress, order.marketplaceAddress);
      if (allowance < price) {
        setState({ kind: "loading", message: "正在请求 ISC 授权，请在钱包中确认…" });
        const approvalTx = await token.approve(order.marketplaceAddress, price);
        await approvalTx.wait();
      }

      setState({ kind: "loading", message: "正在请求成交签名，请在钱包中确认…" });
      const marketplace = new Contract(order.marketplaceAddress, MARKETPLACE_ABI, signer);
      const tx = await marketplace.executeOrder(toContractOrder(order), order.signature);
      const explorerUrl = getExplorerTxUrl(order.chainId, tx.hash);
      toastId = toast.loading("购买交易已提交", {
        description: "正在等待区块链确认，资产尚未转移完成。",
        action: explorerUrl ? { label: "查看链上进度", onClick: () => window.open(explorerUrl, "_blank", "noopener,noreferrer") } : undefined,
      });
      setState({ kind: "loading", message: `交易已提交，等待确认…${formatEther(price)} ISC` });
      const receipt = await tx.wait();
      if (!receipt?.hash) throw new Error("TX_NOT_CONFIRMED");
      toast.success("链上成交已确认", { id: toastId, description: "正在同步订单簿状态。", action: explorerUrl ? { label: "查看交易", onClick: () => window.open(explorerUrl, "_blank", "noopener,noreferrer") } : undefined });
      const result = await recordFulfilled.mutateAsync({ orderHash: order.orderHash, buyerAddress, fulfillTxHash: receipt.hash, chainId: order.chainId, marketplaceAddress: order.marketplaceAddress });
      setState({ kind: result.updated ? "success" : "error", message: result.message });
      if (result.updated) onFulfilled?.(order.orderHash, receipt.hash);
    } catch (error) {
      if (toastId !== undefined) toast.error("购买交易未完成", { id: toastId, description: friendlyError(error) });
      const raw = error instanceof Error ? error.message : "";
      const message = raw === "WALLET_NOT_CONNECTED" ? "请先连接钱包，再购买此 NFT。" : raw === "NETWORK_MISMATCH" ? "当前钱包网络与订单网络不一致，请切换网络后重试。" : raw === "SELF_PURCHASE" ? "卖家不能购买自己的订单。" : raw === "INVALID_ADDRESS" ? "订单或市场合约地址无效，已阻止交易。" : friendlyError(error);
      setState({ kind: "error", message });
    }
  };

  return <div className="space-y-2">
    <Button type="button" className="w-full bg-cyan-600 text-white hover:bg-cyan-500" onClick={openConfirmation} disabled={state.kind === "loading"}>
      {state.kind === "loading" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{state.message}</> : <><ShoppingCart className="mr-2 h-4 w-4" />立即购买 · {formatEther(BigInt(order.price))} ISC</>}
    </Button>
    {state.kind === "success" && <Alert className="border-emerald-500/50 bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-400" /><AlertDescription className="text-emerald-200">{state.message}</AlertDescription></Alert>}
    {state.kind === "error" && <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert>}
    <Dialog open={confirmationOpen} onOpenChange={(open) => { if (state.kind !== "loading") setConfirmationOpen(open); }}>
      <DialogContent className="max-w-md border-cyan-400/30 bg-slate-950 text-slate-100">
        <DialogHeader>
          <DialogTitle>确认购买 NFT</DialogTitle>
          <DialogDescription className="text-slate-400">请核对订单详情。点击确认后才会唤起钱包，并可能产生 ISC 授权与成交 Gas。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
          <div className="flex justify-between gap-4"><span className="text-slate-400">NFT 合约</span><span className="max-w-[220px] truncate font-mono">{order.nftContract}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Token ID / 数量</span><span>#{order.tokenId} / {order.amount}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">卖家</span><span className="max-w-[220px] truncate font-mono">{order.offerer}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">订单价格</span><span>{formatEther(BigInt(order.price))} ISC</span></div>
          <div className="flex justify-between"><span className="text-slate-400">市场佣金（10%）</span><span>{formatEther((BigInt(order.price) * BigInt(1000)) / BigInt(10000))} ISC</span></div>
          <div className="flex justify-between border-t border-white/10 pt-2 font-semibold"><span>买家需支付</span><span className="text-cyan-300">{formatEther(BigInt(order.price))} ISC</span></div>
          <div className="flex justify-between text-xs"><span className="text-slate-400">预估 Gas</span><span>{isEstimatingGas ? "正在读取网络费率…" : estimatedGas ? `${estimatedGas} 原生币` : "暂时无法预估，以钱包最终提示为准"}</span></div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmationOpen(false)} disabled={state.kind === "loading"}>取消</Button>
          <Button type="button" className="bg-cyan-600 text-white hover:bg-cyan-500" onClick={purchase} disabled={state.kind === "loading"}>确认并继续</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
