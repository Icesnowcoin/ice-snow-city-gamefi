import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, AlertCircle, CheckCircle } from "lucide-react";
import { ethers } from "ethers";
import { ISCLogo, ISCAmount } from "@/components/ISCLogo";
import { useWeb3Wallet } from "@/hooks/useWeb3Wallet";
import { useISCMarketplace } from "@/hooks/useISCMarketplace";

const ISC_TOKEN_ADDRESS = "0x11229a3f976566FA8a3ba462C432122f3B8876f6";
const TREASURY_ADDRESS = "0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019";
type MarketStats = { iscPrice: string; priceChange?: string; volume24h: string; treasuryBalance?: string };
type Order = { price: string; amount: string; total?: string };
type SellListing = { nftContract: string; tokenId: number; amount: number; listingType: number };
export interface TradingCenterProps {
  marketplaceAddress?: string;
  marketStats?: MarketStats;
  orderBook?: { asks: Order[]; bids: Order[] };
  selectedBuyListingId?: number;
  sellListing?: SellListing;
}

export default function TradingCenter({ marketplaceAddress, marketStats, orderBook, selectedBuyListingId, sellListing }: TradingCenterProps) {
  const [activeTab, setActiveTab] = useState("market");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [iscBalance, setISCBalance] = useState("0");
  const [isApproved, setIsApproved] = useState(false);

  const wallet = useWeb3Wallet();
  const validMarketplaceAddress = marketplaceAddress && ethers.isAddress(marketplaceAddress) ? marketplaceAddress : ethers.ZeroAddress;
  const canTrade = Boolean(wallet.isConnected && wallet.signer && validMarketplaceAddress !== ethers.ZeroAddress);
  const marketplace = useISCMarketplace(validMarketplaceAddress, ISC_TOKEN_ADDRESS, wallet.signer);

  // 获取 ISC 余额
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      marketplace.getISCBalance(wallet.address).then(balance => {
        setISCBalance(balance);
      });
    }
  }, [wallet.isConnected, wallet.address, marketplace.getISCBalance]);

  const asks = orderBook?.asks ?? [];
  const bids = orderBook?.bids ?? [];

  const handleApprove = async () => {
    const result = await marketplace.approveISC(amount || "1000");
    if (result) {
      setIsApproved(true);
    }
  };

  const handleBuy = async () => {
    if (!isApproved) {
      await handleApprove();
      return;
    }
    if (!canTrade || selectedBuyListingId === undefined) return;
    await marketplace.buyItem(selectedBuyListingId);
  };

  const handleSell = async () => {
    if (!canTrade || !sellListing || !ethers.isAddress(sellListing.nftContract)) return;
    await marketplace.sellItem(sellListing.nftContract, sellListing.tokenId, sellListing.amount, price, sellListing.listingType);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ISCLogo size="lg" className="drop-shadow-[0_0_10px_rgba(103,232,249,0.85)]" /> ISC 中央交易中心
          </h1>
          <p className="text-muted-foreground mt-1">
            现代化都市资产与商品自由交易市场（每笔交易自动扣除 10% 佣金存入国库）
          </p>
        </div>
        <div className="flex items-center gap-3">
          {wallet.isConnected ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="flex items-center gap-1 text-sm py-1.5 px-3">
                <Wallet className="w-4 h-4" /> {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-sm py-1.5 px-3">
                <ISCAmount amount={`${iscBalance.slice(0, 10)} ISC`} size="sm" />
              </Badge>
              <Button variant="outline" size="sm" onClick={wallet.disconnectWallet}>
                断开连接
              </Button>
            </div>
          ) : (
            <Button 
              onClick={wallet.connectWallet} 
              disabled={wallet.isLoading}
              className="flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {wallet.isLoading ? "连接中..." : "连接钱包"}
            </Button>
          )}
        </div>
      </div>

      {/* 错误和成功提示 */}
      {wallet.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{wallet.error}</AlertDescription>
        </Alert>
      )}

      {marketplace.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{marketplace.error}</AlertDescription>
        </Alert>
      )}

      {!marketplaceAddress && (
        <Alert className="mb-4 border-amber-500 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription>市场合约尚未配置。当前仅展示真实数据入口，交易操作将在合约地址和挂单数据验证后启用。</AlertDescription>
        </Alert>
      )}

      {marketplace.success && (
        <Alert className="mb-4 border-green-500 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{marketplace.success}</AlertDescription>
        </Alert>
      )}

      {/* 市场概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">ISC 当前价格</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-2">
              {marketStats?.iscPrice ?? "暂无真实行情"}
              {marketStats?.priceChange && <span className="text-green-500 text-sm">{marketStats.priceChange}</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">24h 交易量</div>
            <div className="text-2xl font-bold mt-1">{marketStats?.volume24h ?? "暂无数据"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">国库累计收益 (10% 税收)</div>
            <div className="text-2xl font-bold mt-1 text-blue-500">{marketStats?.treasuryBalance ?? "不可用"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">国库地址</div>
            <div className="text-xs font-mono mt-1 text-green-500 break-all">
              {TREASURY_ADDRESS}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易主区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：交易表单 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>限价/市价交易</CardTitle>
          </CardHeader>
          <CardContent>
            {!wallet.isConnected ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">请先连接钱包以进行交易</p>
                <Button onClick={wallet.connectWallet} className="w-full">
                  连接钱包
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="buy" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="buy" className="text-green-600 font-bold">买入 ISC</TabsTrigger>
                  <TabsTrigger value="sell" className="text-red-600 font-bold">卖出 ISC</TabsTrigger>
                </TabsList>
                
                <TabsContent value="buy" className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">挂单价格 (USDT)</label>
                    <Input 
                      placeholder="0.00" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">数量 (ISC)</label>
                    <Input 
                      placeholder="0" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                    />
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>预估交易额:</span>
                      <span>{amount && price ? (Number(amount) * Number(price)).toFixed(2) : "0.00"} USDT</span>
                    </div>
                    <div className="flex justify-between text-blue-500 font-semibold">
                      <span>国库佣金 (10%):</span>
                      <span>{amount ? (Number(amount) * 0.1).toFixed(2) : "0.00"} ISC</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    disabled={marketplace.isLoading || !canTrade || selectedBuyListingId === undefined || !amount || !price}
                    onClick={handleBuy}
                  >
                    {marketplace.isLoading ? "处理中..." : isApproved ? "立即买入 ISC" : "授权并买入"}
                  </Button>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">挂单价格 (USDT)</label>
                    <Input 
                      placeholder="0.00" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">数量 (ISC)</label>
                    <Input 
                      placeholder="0" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                    />
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>预估到账:</span>
                      <span>{amount && price ? (Number(amount) * Number(price) * 0.9).toFixed(2) : "0.00"} USDT</span>
                    </div>
                    <div className="flex justify-between text-blue-500 font-semibold">
                      <span>国库佣金 (10%):</span>
                      <span>{amount ? (Number(amount) * 0.1).toFixed(2) : "0.00"} ISC</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 text-white" 
                    disabled={marketplace.isLoading || !canTrade || !sellListing || !amount || !price}
                    onClick={handleSell}
                  >
                    {marketplace.isLoading ? "处理中..." : "立即卖出 ISC"}
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* 右侧：订单簿与行情 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>实时订单簿 (Order Book)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* 卖盘 */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 flex justify-between">
                  <span>价格 (USDT)</span>
                  <span>数量 (ISC)</span>
                </div>
                <div className="space-y-1">
                  {asks.length === 0 ? <p className="text-sm text-muted-foreground py-4">暂无已验证的卖盘数据</p> : asks.map((ask, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 px-2 bg-red-500/10 rounded text-red-500 cursor-pointer hover:bg-red-500/20">
                      <span>{ask.price}</span>
                      <span>{ask.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 买盘 */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 flex justify-between">
                  <span>价格 (USDT)</span>
                  <span>数量 (ISC)</span>
                </div>
                <div className="space-y-1">
                  {bids.length === 0 ? <p className="text-sm text-muted-foreground py-4">暂无已验证的买盘数据</p> : bids.map((bid, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 px-2 bg-green-500/10 rounded text-green-500 cursor-pointer hover:bg-green-500/20">
                      <span>{bid.price}</span>
                      <span>{bid.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
