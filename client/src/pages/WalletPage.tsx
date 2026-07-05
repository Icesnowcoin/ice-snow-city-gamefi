import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import TokenDisplay from "@/components/TokenDisplay";
import {
  Wallet,
  Send,
  Download,
  Upload,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function WalletPage() {
  const { lang } = useLanguage();
  
  // Get wallet balance from game state
  const { data: gameState, isLoading: walletLoading } = trpc.game.core.getState.useQuery();
  const wallet = gameState ? {
    balance: gameState.wallet.money,
    iscBalance: gameState.wallet.isc,
    bankBalance: gameState.bankAccount?.balance || 0,
    totalAssets: gameState.wallet.money + gameState.wallet.isc + (gameState.bankAccount?.balance || 0),
  } : null;
  
  // Bank operations
  const depositMutation = trpc.game.core.bankDeposit.useMutation({
    onSuccess: () => {
      toast.success(lang === "zh" ? "存款成功" : "Deposit successful");
      setDepositAmount("");
    },
    onError: () => {
      toast.error(lang === "zh" ? "存款失败" : "Deposit failed");
    },
  });
  
  const withdrawMutation = trpc.game.core.bankWithdraw.useMutation({
    onSuccess: () => {
      toast.success(lang === "zh" ? "取款成功" : "Withdrawal successful");
      setWithdrawAmount("");
    },
    onError: () => {
      toast.error(lang === "zh" ? "取款失败" : "Withdrawal failed");
    },
  });
  
  const claimInterestMutation = trpc.game.core.claimInterest.useMutation({
    onSuccess: () => {
      toast.success(lang === "zh" ? "领取利息成功" : "Interest claimed successfully");
    },
    onError: () => {
      toast.error(lang === "zh" ? "领取利息失败" : "Interest claim failed");
    },
  });
  
  const transactionsLoading = walletLoading;

  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Real transactions from game state
  const transactions = gameState?.transactions?.slice(0, 20)?.map((tx: any, idx: number) => ({
    id: idx + 1,
    type: tx.type || "deposit",
    amount: tx.amount?.toString() || "0",
    status: tx.status || "completed",
    date: tx.timestamp ? new Date(tx.timestamp).toLocaleString() : new Date().toLocaleString(),
    txHash: tx.hash || tx.id || `tx-${idx}`,
  })) || [];

  const handleDeposit = async () => {
    if (!depositAmount) {
      toast.error(lang === "zh" ? "请输入金额" : "Please enter amount");
      return;
    }
    try {
      await depositMutation.mutateAsync({
        amount: parseInt(depositAmount),
      });
    } catch (error) {
      toast.error(lang === "zh" ? "充值失败" : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) {
      toast.error(lang === "zh" ? "请输入金额" : "Please enter amount");
      return;
    }
    try {
      await withdrawMutation.mutateAsync({
        amount: parseInt(withdrawAmount),
      });
    } catch (error) {
      toast.error(lang === "zh" ? "提现失败" : "Withdrawal failed");
    }
  };

  const handleClaimInterest = async () => {
    try {
      await claimInterestMutation.mutateAsync();
    } catch (error) {
      toast.error(lang === "zh" ? "转账失败" : "Transfer failed");
    }
  };



  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === "pending") return <Clock className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Blockchain Token Balance */}
      <Card className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100">{lang === "zh" ? "区块链 ISC 余额" : "Blockchain ISC Balance"}</p>
                <TokenDisplay className="mt-2" showDetails={true} />
              </div>
              <Wallet className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balance */}
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">{lang === "zh" ? "ISC 余额" : "ISC Balance"}</p>
                {walletLoading ? (
                  <Skeleton className="h-10 w-32 mt-1" />
                ) : (
                  <p className="text-4xl font-bold">{wallet?.iscBalance.toString() || "0"}</p>
                )}
              </div>
              <Wallet className="w-12 h-12 opacity-50" />
            </div>
            <div className="pt-4 border-t border-blue-400">
              <p className="text-sm text-blue-100">{lang === "zh" ? "钱包地址" : "Wallet Address"}</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-sm bg-blue-700 px-3 py-2 rounded flex-1 truncate">
                  0x1234567890abcdef1234567890abcdef12345678
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-blue-500 hover:bg-blue-600 border-0 text-white"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deposit */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-auto py-4 flex flex-col items-center gap-2" variant="outline">
              <Download className="w-6 h-6" />
              <span>{lang === "zh" ? "充值" : "Deposit"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === "zh" ? "充值 ISC" : "Deposit ISC"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deposit-amount">{lang === "zh" ? "存款金额" : "Deposit Amount"}</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleDeposit} disabled={depositMutation.isPending} className="w-full">
                {depositMutation.isPending ? (lang === "zh" ? "处理中..." : "Processing...") : (lang === "zh" ? "确认充值" : "Confirm Deposit")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-auto py-4 flex flex-col items-center gap-2" variant="outline">
              <Upload className="w-6 h-6" />
              <span>{lang === "zh" ? "提现" : "Withdraw"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === "zh" ? "提现 ISC" : "Withdraw ISC"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdraw-amount">{lang === "zh" ? "提现金额" : "Amount"}</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>

              <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending} className="w-full" variant="destructive">
                {withdrawMutation.isPending ? (lang === "zh" ? "处理中..." : "Processing...") : (lang === "zh" ? "确认提现" : "Confirm Withdraw")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>


      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">{lang === "zh" ? "交易记录" : "Transactions"}</TabsTrigger>
          <TabsTrigger value="details">{lang === "zh" ? "详细信息" : "Details"}</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "zh" ? "交易历史" : "Transaction History"}</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {lang === "zh" ? "暂无交易记录" : "No transactions yet"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === "zh" ? "开始存款或取款后，交易记录将显示在这里" : "Transactions will appear here after deposits or withdrawals"}
                    </p>
                  </div>
                ) : transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {tx.type === "deposit" ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {tx.type === "deposit"
                            ? lang === "zh"
                              ? "充值"
                              : "Deposit"
                            : lang === "zh"
                            ? "提现"
                            : "Withdraw"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{tx.txHash}</p>
                        <p className="text-xs text-muted-foreground">{tx.date || new Date().toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={`font-medium ${tx.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "deposit" ? "+" : "-"}
                          {tx.amount || tx.amount?.toString()}
                        </p>
                        <Badge className={getStatusColor(tx.status)} variant="outline">
                          {tx.status === "completed"
                            ? lang === "zh"
                              ? "已完成"
                              : "Completed"
                            : lang === "zh"
                            ? "待处理"
                            : "Pending"}
                        </Badge>
                      </div>
                      {getStatusIcon(tx.status)}
                    </div>
                  </div>
                ))}
              </div>
              )}
              {/* Gas Fee Notice */}
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <p className="text-xs text-yellow-300 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  {lang === "zh"
                    ? "Gas 费用由玩家承担。充值和提现操作需要支付 BNB 作为 Gas 费。"
                    : "Gas fees are paid by the player. Deposits and withdrawals require BNB for Gas."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "zh" ? "钱包详情" : "Wallet Details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "可用余额" : "Available Balance"}</p>
                    <p className="text-2xl font-bold">{wallet?.iscBalance?.toLocaleString() || "0"} ISC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "银行存款" : "Bank Balance"}</p>
                    <p className="text-2xl font-bold">{wallet?.bankBalance?.toLocaleString() || "0"} ISC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "总资产" : "Total Assets"}</p>
                    <p className="text-2xl font-bold">{wallet?.totalAssets?.toLocaleString() || "0"} ISC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "Gas 费用说明" : "Gas Fee Info"}</p>
                    <p className="text-sm font-medium text-yellow-500">{lang === "zh" ? "由玩家承担 (BNB)" : "Paid by player (BNB)"}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === "zh" ? "钱包类型" : "Wallet Type"}</span>
                    <span className="font-medium">{lang === "zh" ? "主钱包" : "Main Wallet"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === "zh" ? "创建时间" : "Created"}</span>
                    <span className="font-medium">2026-01-15 10:30:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === "zh" ? "最后更新" : "Last Updated"}</span>
                    <span className="font-medium">2026-06-22 12:00:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === "zh" ? "安全等级" : "Security Level"}</span>
                    <Badge className="bg-green-100 text-green-800">{lang === "zh" ? "高" : "High"}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
