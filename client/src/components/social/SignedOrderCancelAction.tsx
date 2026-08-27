import { useState } from "react";
import { BrowserProvider, Contract, isAddress } from "ethers";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { SeaportStyleOrder } from "@/lib/seaportOrderSigning";

const MARKETPLACE_ABI = [
  "function cancelOrder((address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,bytes32 salt) order)",
];

type CancelStatus =
  | { kind: "idle" }
  | { kind: "cancelling" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export type SignedOrderCancelActionProps = {
  order: SeaportStyleOrder & { orderHash: string; status: "active" | "cancelled" | "fulfilled" | "expired" };
  marketplaceAddress: string;
  expectedChainId: bigint | number;
  provider?: BrowserProvider;
  onCancelled?: (orderHash: string, cancelTxHash: string) => void;
};

export function getExplorerTxUrl(chainId: bigint | number, txHash: string): string | null {
  const explorers: Record<string, string> = {
    "1": "https://etherscan.io/tx/",
    "56": "https://bscscan.com/tx/",
    "97": "https://testnet.bscscan.com/tx/",
    "137": "https://polygonscan.com/tx/",
    "80002": "https://amoy.polygonscan.com/tx/",
    "11155111": "https://sepolia.etherscan.io/tx/",
  };
  const baseUrl = explorers[BigInt(chainId).toString()];
  return baseUrl ? `${baseUrl}${txHash}` : null;
}

function friendlyCancelError(error: unknown): string {
  const candidate = error as { code?: string | number; message?: string } | null;
  const code = String(candidate?.code ?? "").toUpperCase();
  const message = String(candidate?.message ?? "").toLowerCase();
  if (code === "4001" || code === "ACTION_REJECTED" || message.includes("user rejected") || message.includes("user denied")) {
    return "你已取消钱包操作，订单仍保持 active 状态。";
  }
  if (message.includes("chain") || message.includes("network")) {
    return "当前钱包网络不匹配，请切换到订单所属网络后重试。";
  }
  if (message.includes("user rejected") || message.includes("denied")) return "钱包拒绝了取消操作，订单未发生变化。";
  return "订单取消失败，链上交易未确认，订单仍保持 active 状态。";
}

export function SignedOrderCancelAction({
  order,
  marketplaceAddress,
  expectedChainId,
  provider,
  onCancelled,
}: SignedOrderCancelActionProps) {
  const [status, setStatus] = useState<CancelStatus>({ kind: "idle" });
  const cancelOrderMutation = trpc.signedNftOrders.cancel.useMutation();

  if (order.status !== "active") return null;

  const cancelOrder = async () => {
    try {
      if (!isAddress(marketplaceAddress)) throw new Error("市场合约地址无效");
      if (typeof window === "undefined" || !window.ethereum) throw new Error("未检测到浏览器钱包");
      setStatus({ kind: "cancelling" });

      const activeProvider = provider ?? new BrowserProvider(window.ethereum);
      const network = await activeProvider.getNetwork();
      if (BigInt(network.chainId) !== BigInt(expectedChainId)) throw new Error("NETWORK_MISMATCH");
      const signer = await activeProvider.getSigner();
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== order.offerer.toLowerCase()) throw new Error("OWNER_MISMATCH");

      const marketplace = new Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
      const tx = await marketplace.cancelOrder(order);
      const explorerUrl = getExplorerTxUrl(expectedChainId, tx.hash);
      const toastId = toast.loading("取消交易已提交", {
        description: "正在等待区块链确认，订单暂时仍显示为 active。",
        action: explorerUrl ? { label: "查看链上进度", onClick: () => window.open(explorerUrl, "_blank", "noopener,noreferrer") } : undefined,
      });
      const receipt = await tx.wait();
      if (!receipt?.hash) {
        toast.error("取消交易未确认", { id: toastId, description: "请在区块浏览器中检查交易状态，订单仍保持 active。" });
        throw new Error("CANCEL_NOT_CONFIRMED");
      }
      toast.success("链上取消已确认", { id: toastId, description: "正在同步订单簿状态。", action: explorerUrl ? { label: "查看交易", onClick: () => window.open(explorerUrl, "_blank", "noopener,noreferrer") } : undefined });

      const result = await cancelOrderMutation.mutateAsync({
        orderHash: order.orderHash,
        offerer: order.offerer,
        cancelTxHash: receipt.hash,
      });
      onCancelled?.(order.orderHash, receipt.hash);
      setStatus({ kind: "success", message: result.message });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      const message = rawMessage === "NETWORK_MISMATCH"
        ? "当前钱包网络不匹配，请切换到订单所属网络后重试。"
        : rawMessage === "OWNER_MISMATCH"
          ? "当前钱包不是该挂单的卖家账户，无法撤销此订单。"
          : friendlyCancelError(error);
      setStatus({ kind: "error", message });
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full border-rose-400/40 bg-rose-950/20 text-rose-200 hover:bg-rose-900/40" onClick={cancelOrder} disabled={status.kind === "cancelling"}>
        {status.kind === "cancelling" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />等待链上取消确认…</> : <><XCircle className="mr-2 h-4 w-4" />撤销挂单</>}
      </Button>
      {status.kind === "error" && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>撤销失败</AlertTitle><AlertDescription>{status.message}</AlertDescription></Alert>}
      {status.kind === "success" && <Alert className="border-emerald-400/30 bg-emerald-950/30 text-emerald-100"><CheckCircle2 className="h-4 w-4" /><AlertTitle>已撤销</AlertTitle><AlertDescription>{status.message}</AlertDescription></Alert>}
    </div>
  );
}
