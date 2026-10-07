'use client';

import { useState } from 'react';
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Download, TrendingUp, Wallet, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * 游戏经济系统 - 移动优先设计
 * 钱包、银行、交易、投资
 */
export const GameEconomy: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 获取玩家经济数据
  const { data: economy, isLoading: economyLoading, refetch: refetchEconomy } = 
    trpc.game.economy.getEconomyData.useQuery(undefined, { staleTime: 10000 });

  // 获取交易历史
  const { data: transactions, isLoading: transactionsLoading } = 
    trpc.game.economy.getEconomyData.useQuery(undefined, { staleTime: 30000 });

  // 充值 mutation
  const depositMutation = trpc.game.economy.deposit.useMutation({
    onSuccess: () => {
      setAmount("");
      refetchEconomy();
      console.log("充值成功");
    },
    onError: (error: any) => {
      console.error("充值失败:", error.message);
    },
  });

  // 提现 mutation
  const withdrawMutation = trpc.game.economy.withdraw.useMutation({
    onSuccess: () => {
      setAmount("");
      refetchEconomy();
      console.log("提现成功");
    },
    onError: (error: any) => {
      console.error("提现失败:", error.message);
    },
  });

  // 领取利息 mutation
  const claimInterestMutation = trpc.game.economy.claimInterest.useMutation({
    onSuccess: () => {
      setAmount("");
      refetchEconomy();
      console.log("投资成功");
    },
    onError: (error: any) => {
      console.error("投资失败:", error.message);
    },
  });

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setIsProcessing(true);
    try {
      await depositMutation.mutateAsync({ amount: Number(amount) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setIsProcessing(true);
    try {
      await withdrawMutation.mutateAsync({ amount: Number(amount) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInvest = async () => {
    setIsProcessing(true);
    try {
      await claimInterestMutation.mutateAsync();
    } finally {
      setIsProcessing(false);
    }
  };

  if (economyLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!economy) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>经济数据未找到</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 p-4 pb-20">
      {/* 资产总览 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="bg-green-700 bg-opacity-30 border-green-500 p-4">
          <div className="text-green-200 text-xs mb-1">钱包余额</div>
          <div className="text-2xl font-bold text-white">{(economy as any).balance || economy.totalMoney}</div>
          <div className="text-green-300 text-xs mt-1">ISC</div>
        </Card>

        <Card className="bg-green-700 bg-opacity-30 border-green-500 p-4">
          <div className="text-green-200 text-xs mb-1">银行存款</div>
          <div className="text-2xl font-bold text-white">{economy.bankBalance || 0}</div>
          <div className="text-green-300 text-xs mt-1">ISC</div>
        </Card>

        <Card className="bg-green-700 bg-opacity-30 border-green-500 p-4">
          <div className="text-green-200 text-xs mb-1">总资产</div>
          <div className="text-2xl font-bold text-white">{(economy as any).totalAssets || economy.totalMoney + economy.bankBalance}</div>
          <div className="text-green-300 text-xs mt-1">ISC</div>
        </Card>

        <Card className="bg-green-700 bg-opacity-30 border-green-500 p-4">
          <div className="text-green-200 text-xs mb-1">年化收益率</div>
          <div className="text-2xl font-bold text-white">{(economy as any).apy || 5}%</div>
          <div className="text-green-300 text-xs mt-1">APY</div>
        </Card>
      </div>

      {/* 操作标签 */}
      <Tabs defaultValue="wallet" className="mb-6">
        <TabsList className="grid w-full grid-cols-3 bg-green-700 bg-opacity-30">
          <TabsTrigger value="wallet" className="text-xs">钱包</TabsTrigger>
          <TabsTrigger value="bank" className="text-xs">银行</TabsTrigger>
          <TabsTrigger value="invest" className="text-xs">投资</TabsTrigger>
        </TabsList>

        {/* 钱包标签 */}
        <TabsContent value="wallet" className="space-y-4">
          <Card className="bg-green-700 bg-opacity-20 border-green-500 p-4">
            <div className="space-y-3">
              <div>
                <label className="text-green-200 text-sm">充值金额</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="输入金额"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-green-900 border-green-600 text-white"
                  />
                  <Button
                    onClick={handleDeposit}
                    disabled={isProcessing || !amount}
                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-green-600">
                <p className="text-green-200 text-sm mb-2">快速充值</p>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((val) => (
                    <Button
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      variant="outline"
                      className="text-xs border-green-600 text-green-200 hover:bg-green-700"
                    >
                      {val}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 银行标签 */}
        <TabsContent value="bank" className="space-y-4">
          <Card className="bg-green-700 bg-opacity-20 border-green-500 p-4">
            <div className="space-y-3">
              <div>
                <label className="text-green-200 text-sm">存款金额</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="输入金额"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-green-900 border-green-600 text-white"
                  />
                  <Button
                    onClick={handleDeposit}
                    disabled={isProcessing || !amount}
                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "存入"}
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-green-600">
                <label className="text-green-200 text-sm">提现金额</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="输入金额"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-green-900 border-green-600 text-white"
                  />
                  <Button
                    onClick={handleWithdraw}
                    disabled={isProcessing || !amount}
                    className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* 利息信息 */}
              <div className="pt-3 border-t border-green-600 bg-green-900 bg-opacity-30 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-200 text-sm font-semibold">利息收益</span>
                </div>
                <p className="text-white font-bold text-lg">{(economy as any).monthlyInterest || 0} ISC</p>
                <p className="text-green-300 text-xs mt-1">年化收益率: {(economy as any).apy || 5}%</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 投资标签 */}
        <TabsContent value="invest" className="space-y-4">
          <Card className="bg-green-700 bg-opacity-20 border-green-500 p-4">
            <div className="space-y-3">
              <div>
                <label className="text-green-200 text-sm">投资金额</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="输入金额"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-green-900 border-green-600 text-white"
                  />
                  <Button
                    onClick={handleInvest}
                    disabled={isProcessing || !amount}
                    className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "投资"}
                  </Button>
                </div>
              </div>

              {/* 投资收益 */}
              <div className="pt-3 border-t border-green-600 bg-green-900 bg-opacity-30 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-200 text-sm font-semibold">投资收益</span>
                </div>
                <p className="text-white font-bold text-lg">{Math.round((economy?.bankBalance || 0) * 0.05 / 12)} ISC</p>
                <p className="text-green-300 text-xs mt-1">总资产: {(economy?.totalMoney || 0) + (economy?.totalISC || 0) + (economy?.bankBalance || 0)} ISC</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 交易历史 */}
      <div>
        <h3 className="text-white font-bold mb-3">交易历史</h3>
        {transactionsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-green-400" />
          </div>
        ) : transactions && (transactions as any)?.length || 0 > 0 ? (
          <div className="space-y-2">
            {(transactions as any)?.map((tx: any) => (
              <Card
                key={tx.id}
                className="bg-green-700 bg-opacity-20 border-green-500 p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-semibold text-sm">{tx.type}</p>
                  <p className="text-green-300 text-xs">{new Date(tx.timestamp || 0).toLocaleString()}</p>
                </div>
                <div className={`font-bold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount} ISC
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-green-300 text-center py-8">暂无交易记录</p>
        )}
      </div>
    </div>
  );
};

export default GameEconomy;
