import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { skipToken } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

const ABI = ["function acceptBuyOffer((address offerer,address nftContract,uint256 tokenId,uint256 amount,uint256 price,uint256 expiration,uint256 nonce,uint8 itemType,uint8 orderType,bytes32 salt) order, bytes signature) external"];

export function ReceivedOffersPanel({ walletAddress, chainId, provider }: { walletAddress?: string | null; chainId?: number; provider?: BrowserProvider | null }) {
  const utils = trpc.useUtils();
  const query = trpc.signedNftOrders.receivedOffers.useQuery(walletAddress && chainId ? { walletAddress, chainId } : skipToken);
  const fulfill = trpc.signedNftOrders.fulfillBuyOffer.useMutation();
  const [activeHash, setActiveHash] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept(order: NonNullable<typeof query.data>[number]) {
    setError(null); setMessage(null); setActiveHash(order.orderHash);
    try {
      if (!provider || !walletAddress) throw new Error("请先连接 NFT 持有者钱包。");
      if (!window.confirm(`确认接受 ${order.price} ISC 的报价？交易将转移 NFT 并扣除市场佣金与 Gas。`)) { setActiveHash(null); return; }
      const signer = await provider.getSigner();
      const contract = new Contract(order.marketplaceAddress, ABI, signer);
      const tx = await contract.acceptBuyOffer({ offerer: order.offerer, nftContract: order.nftContract, tokenId: order.tokenId, amount: order.amount, price: order.price, expiration: order.expiration, nonce: order.nonce, itemType: order.itemType, orderType: 1, salt: order.salt }, order.signature);
      setMessage(`交易已提交：${tx.hash}，正在等待链上确认…`);
      await tx.wait();
      await fulfill.mutateAsync({ orderHash: order.orderHash, fulfillTxHash: tx.hash });
      setMessage("报价已接受，链上交易已确认，订单状态已更新。");
      await utils.signedNftOrders.receivedOffers.invalidate();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "接受报价失败，订单状态未改变。 "); }
    finally { setActiveHash(null); }
  }

  if (!walletAddress || !chainId) return <Card><CardContent className="py-6 text-sm text-muted-foreground">连接 NFT 持有者钱包后，系统才会查询针对你当前持仓的报价。</CardContent></Card>;
  return <Card><CardHeader><CardTitle>收到的出价</CardTitle></CardHeader><CardContent className="space-y-3">{query.isLoading && <p>正在加载真实报价…</p>}{query.data?.length === 0 && !query.isLoading && <p className="text-sm text-muted-foreground">当前没有针对你已索引 NFT 的有效报价。</p>}{query.data?.map((order) => <div key={order.orderHash} className="rounded-lg border p-3"><div className="flex items-center justify-between"><div><p className="font-medium">Token #{order.tokenId}</p><p className="text-sm text-muted-foreground">买方 {order.offerer.slice(0, 6)}…{order.offerer.slice(-4)}</p></div><p className="font-semibold">{order.price} ISC</p></div><Button className="mt-3 w-full" onClick={() => void accept(order)} disabled={activeHash === order.orderHash}>{activeHash === order.orderHash ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在接受报价</> : <><CheckCircle2 className="mr-2 h-4 w-4" />接受报价</>}</Button></div>)}{message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}</CardContent></Card>;
}
