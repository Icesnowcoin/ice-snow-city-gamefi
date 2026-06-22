import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWalletBalance, useWalletTransactions, useDeposit, useWithdraw, useTransfer } from "@/hooks/useGameData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
  const { data: wallet, isLoading: walletLoading } = useWalletBalance();
  const { data: transactions, isLoading: transactionsLoading } = useWalletTransactions();
  const depositMutation = useDeposit();
  const withdrawMutation = useWithdraw();
  const transferMutation = useTransfer();

  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferPlayer, setTransferPlayer] = useState("");

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mockTransactions = [
    {
      id: 1,
      type: "deposit",
      amount: "1000.00",
      status: "completed",
      date: "2026-06-22 10:30:00",
      txHash: "0x1234567890abcdef1234567890abcdef12345678",
    },
    {
      id: 2,
      type: "withdraw",
      amount: "500.00",
      status: "completed",
      date: "2026-06-21 15:45:00",
      txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
    },
  ];

  const handleDeposit = async () => {
    if (!depositAmount || !depositAddress) {
      toast.error(lang === "zh" ? "请填写所有字段" : "Please fill all fields");
      return;
    }
    try {
      await depositMutation.mutateAsync({
        amount: BigInt(depositAmount),
        address: depositAddress,
      });
      toast.success(lang === "zh" ? "充值成功" : "Deposit successful");
      setDepositAmount("");
      setDepositAddress("");
    } catch (error) {
      toast.error(lang === "zh" ? "充值失败" : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) {
      toast.error(lang === "zh" ? "请填写所有字段" : "Please fill all fields");
      return;
    }
    try {
      await withdrawMutation.mutateAsync({
        amount: BigInt(withdrawAmount),
        address: withdrawAddress,
      });
      toast.success(lang === "zh" ? "提现成功" : "Withdrawal successful");
      setWithdrawAmount("");
      setWithdrawAddress("");
    } catch (error) {
      toast.error(lang === "zh" ? "提现失败" : "Withdrawal failed");
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferPlayer) {
      toast.error(lang === "zh" ? "请填写所有字段" : "Please fill all fields");
      return;
    }
    try {
      await transferMutation.mutateAsync({
        amount: BigInt(transferAmount),
        toPlayer: transferPlayer,
      });
      toast.success(lang === "zh" ? "转账成功" : "Transfer successful");
      setTransferAmount("");
      setTransferPlayer("");
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
                <Label htmlFor="deposit-amount">{lang === "zh" ? "充值金额" : "Amount"}</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="deposit-address">{lang === "zh" ? "钱包地址" : "Wallet Address"}</Label>
                <Input
                  id="deposit-address"
                  placeholder="0x..."
                  value={depositAddress}
                  onChange={(e) => setDepositAddress(e.target.value)}
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
              <div>
                <Label htmlFor="withdraw-address">{lang === "zh" ? "提现地址" : "Withdrawal Address"}</Label>
                <Input
                  id="withdraw-address"
                  placeholder="0x..."
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                />
              </div>
              <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending} className="w-full" variant="destructive">
                {withdrawMutation.isPending ? (lang === "zh" ? "处理中..." : "Processing...") : (lang === "zh" ? "确认提现" : "Confirm Withdraw")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transfer */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-auto py-4 flex flex-col items-center gap-2" variant="outline">
              <Send className="w-6 h-6" />
              <span>{lang === "zh" ? "转账" : "Transfer"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === "zh" ? "转账 ISC" : "Transfer ISC"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient">{lang === "zh" ? "玩家名称" : "Player Name"}</Label>
                <Input
                  id="recipient"
                  placeholder="Player123"
                  value={transferPlayer}
                  onChange={(e) => setTransferPlayer(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="transfer-amount">{lang === "zh" ? "转账金额" : "Amount"}</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleTransfer} disabled={transferMutation.isPending} className="w-full">
                {transferMutation.isPending ? (lang === "zh" ? "处理中..." : "Processing...") : (lang === "zh" ? "确认转账" : "Confirm Transfer")}
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
                {(transactions || mockTransactions)?.map((tx: any) => (
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
                    <p className="text-2xl font-bold">1,234.56 ISC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "冻结余额" : "Frozen Balance"}</p>
                    <p className="text-2xl font-bold">0.00 ISC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "总充值" : "Total Deposits"}</p>
                    <p className="text-2xl font-bold">5,000.00 ISC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "zh" ? "总提现" : "Total Withdrawals"}</p>
                    <p className="text-2xl font-bold">3,765.44 ISC</p>
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
