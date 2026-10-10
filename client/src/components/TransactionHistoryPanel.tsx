import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, AlertCircle, Clock, ArrowUpRight, ArrowDownLeft, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface GameTransaction {
  id: string;
  type: "transfer" | "purchase" | "sale" | "reward" | "penalty";
  amount: number;
  description: string;
  relatedUserId?: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

interface BlockchainTransaction {
  id: string;
  type: "deposit" | "withdraw";
  amount: string;
  txHash: string;
  gasUsed: string;
  gasPrice: string;
  toAddress: string;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  createdAt: Date;
  confirmedAt?: Date;
}

export const TransactionHistoryPanel: React.FC = () => {
  const [gameTransactions, setGameTransactions] = useState<GameTransaction[]>([]);
  const [blockchainTransactions, setBlockchainTransactions] = useState<BlockchainTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");
  
  // Filter states
  const [gameTypeFilter, setGameTypeFilter] = useState<string>("all");
  const [blockchainTypeFilter, setBlockchainTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  // Initialize with mock data - will be connected to tRPC route later
  useEffect(() => {
    setGameTransactions([
      {
        id: "1",
        type: "transfer",
        amount: 500,
        description: "转账给 Player123",
        status: "completed",
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: "2",
        type: "purchase",
        amount: 1000,
        description: "购买农场",
        status: "completed",
        createdAt: new Date(Date.now() - 7200000),
      },
    ]);
    setBlockchainTransactions([
      {
        id: "b1",
        type: "deposit",
        amount: "100",
        txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        gasUsed: "50000",
        gasPrice: "5",
        toAddress: "0x...",
        status: "confirmed",
        confirmations: 12,
        createdAt: new Date(Date.now() - 86400000),
      },
    ]);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "transfer":
        return "bg-blue-100 text-blue-800";
      case "purchase":
        return "bg-red-100 text-red-800";
      case "sale":
        return "bg-green-100 text-green-800";
      case "reward":
        return "bg-yellow-100 text-yellow-800";
      case "penalty":
        return "bg-orange-100 text-orange-800";
      case "deposit":
        return "bg-green-100 text-green-800";
      case "withdraw":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "transfer":
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4" />;
      case "purchase":
      case "withdraw":
        return <ArrowUpRight className="w-4 h-4" />;
      case "sale":
      case "reward":
        return <ArrowDownLeft className="w-4 h-4" />;
      case "penalty":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            完成
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            待处理
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            失败
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter functions
  const isWithinDateRange = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    switch (dateFilter) {
      case "today":
        return diffDays < 1;
      case "week":
        return diffDays < 7;
      case "month":
        return diffDays < 30;
      default:
        return true;
    }
  };

  const filteredGameTransactions = gameTransactions.filter((tx) => {
    const typeMatch = gameTypeFilter === "all" || tx.type === gameTypeFilter;
    const dateMatch = isWithinDateRange(tx.createdAt);
    return typeMatch && dateMatch;
  });

  const filteredBlockchainTransactions = blockchainTransactions.filter((tx) => {
    const typeMatch = blockchainTypeFilter === "all" || tx.type === blockchainTypeFilter;
    const dateMatch = isWithinDateRange(tx.createdAt);
    return typeMatch && dateMatch;
  });

  const GameTransactionRow: React.FC<{ tx: GameTransaction }> = ({ tx }) => (
    <div className="flex items-center justify-between py-3 px-4 border-b last:border-b-0 hover:bg-gray-50 transition">
      <div className="flex items-center gap-3 flex-1">
        <div className={`p-2 rounded-full ${getTypeColor(tx.type)}`}>
          {getTypeIcon(tx.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{tx.description}</p>
          <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={`font-semibold text-sm ${tx.type === "penalty" ? "text-red-600" : "text-green-600"}`}>
            {tx.type === "penalty" ? "-" : "+"}{tx.amount}
          </p>
        </div>
        {getStatusBadge(tx.status)}
      </div>
    </div>
  );

  const BlockchainTransactionRow: React.FC<{ tx: BlockchainTransaction }> = ({ tx }) => (
    <div className="flex items-center justify-between py-3 px-4 border-b last:border-b-0 hover:bg-gray-50 transition">
      <div className="flex items-center gap-3 flex-1">
        <div className={`p-2 rounded-full ${getTypeColor(tx.type)}`}>
          {getTypeIcon(tx.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {tx.type === "deposit" ? "充值" : "提现"} {tx.amount} ISC
          </p>
          <p className="text-xs text-gray-500 truncate">
            Tx: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
          </p>
          <p className="text-xs text-gray-400">Gas: {tx.gasUsed} ({tx.confirmations} 确认)</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-semibold text-sm text-blue-600">
            {tx.type === "deposit" ? "+" : "-"}{tx.amount}
          </p>
        </div>
        {getStatusBadge(tx.status)}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              交易记录
            </CardTitle>
            <CardDescription>查看游戏内和区块链交易历史</CardDescription>
          </div>
          {syncStatus === "syncing" && (
            <div className="flex items-center gap-2">
              <Spinner className="w-4 h-4" />
              <span className="text-sm text-gray-600">同步中...</span>
            </div>
          )}
          {syncStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">同步成功</span>
            </div>
          )}
          {syncStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{syncMessage}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-6 h-6" />
          </div>
        ) : (
          <Tabs defaultValue="game" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="game">
                游戏内交易 ({gameTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="blockchain">
                区块链交易 ({blockchainTransactions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="game" className="mt-4">
              <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">交易类型</label>
                    <select
                      value={gameTypeFilter}
                      onChange={(e) => setGameTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全部类型</option>
                      <option value="transfer">转账</option>
                      <option value="purchase">购买</option>
                      <option value="sale">销售</option>
                      <option value="reward">奖励</option>
                      <option value="penalty">惩罚</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">时间范围</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全部时间</option>
                      <option value="today">今天</option>
                      <option value="week">最近 7 天</option>
                      <option value="month">最近 30 天</option>
                    </select>
                  </div>
                </div>
              </div>
              {filteredGameTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{gameTransactions.length === 0 ? "暂无游戏内交易" : "没有匹配的交易"}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredGameTransactions.map((tx) => (
                    <GameTransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="blockchain" className="mt-4">
              <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">交易类型</label>
                    <select
                      value={blockchainTypeFilter}
                      onChange={(e) => setBlockchainTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全部类型</option>
                      <option value="deposit">充值</option>
                      <option value="withdraw">提现</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">时间范围</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全部时间</option>
                      <option value="today">今天</option>
                      <option value="week">最近 7 天</option>
                      <option value="month">最近 30 天</option>
                    </select>
                  </div>
                </div>
              </div>
              {filteredBlockchainTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{blockchainTransactions.length === 0 ? "暂无区块链交易" : "没有匹配的交易"}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredBlockchainTransactions.map((tx) => (
                    <BlockchainTransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistoryPanel;
