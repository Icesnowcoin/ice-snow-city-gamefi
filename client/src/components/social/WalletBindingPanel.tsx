import { useState } from "react";
import { BrowserProvider } from "ethers";
import { CheckCircle2, Loader2, WalletCards } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

type Props = { provider?: BrowserProvider | null; address?: string | null; chainId?: number | null; onVerified?: (walletAddress: string, chainId: number) => void };

export function WalletBindingPanel({ provider, address, chainId, onVerified }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createChallenge = trpc.walletBindings.createChallenge.useMutation();
  const verify = trpc.walletBindings.verify.useMutation();

  async function handleBind() {
    setError(null);
    setStatus(null);
    if (!provider || !address || !chainId) {
      setError("请先连接钱包并确认网络有效。");
      return;
    }
    try {
      setStatus("正在创建一次性绑定挑战…");
      const challenge = await createChallenge.mutateAsync({ walletAddress: address, chainId, domain: window.location.host });
      setStatus("请在钱包中签名验证地址所有权…");
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(challenge.message);
      setStatus("正在验证签名并绑定钱包…");
      const result = await verify.mutateAsync({ walletAddress: challenge.walletAddress, chainId, domain: window.location.host, nonce: challenge.nonce, issuedAt: challenge.issuedAt.toISOString(), expirationTime: challenge.expiresAt.toISOString(), signature });
      setStatus("钱包绑定成功，可用于验证 NFT 持仓归属。");
      onVerified?.(result.walletAddress, result.chainId);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "钱包绑定失败。";
      setStatus(null);
      setError(message.includes("拒绝") || message.includes("rejected") || message.includes("ACTION_REJECTED") ? "你已取消钱包签名，未绑定任何钱包。" : message);
    }
  }

  const pending = createChallenge.isPending || verify.isPending;
  return <Card className="border-cyan-300/20 bg-slate-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><WalletCards className="h-4 w-4 text-cyan-300" />验证 NFT 钱包归属</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground">签名仅验证你控制该地址，不会授权 NFT 或 ISC 转移。</p>{status && <Alert><AlertDescription>{status.includes("成功") ? <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-400" /> : pending ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}{status}</AlertDescription></Alert>}{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<Button type="button" className="w-full" onClick={() => void handleBind()} disabled={pending || !provider || !address || !chainId}>{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在验证</> : "签名并绑定钱包"}</Button></CardContent></Card>;
}
