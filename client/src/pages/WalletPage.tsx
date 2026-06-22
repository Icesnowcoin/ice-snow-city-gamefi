import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transactions = [
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
    {
      id: 3,
      type: "deposit",
      amount: "2000.00",
      status: "pending",
      date: "2026-06-22 12:00:00",
      txHash: "0x9876543210fedcba9876543210fedcba98765432",
    },
    {
      id: 4,
      type: "withdraw",
      amount: "750.00",
      status: "completed",
      date: "2026-06-20 08:15:00",
      txHash: "0xfedcba9876543210fedcba9876543210fedcba98",
    },
    {
      id: 5,
      type: "deposit",
      amount: "1500.00",
      status: "completed",
      date: "2026-06-19 14:20:00",
      txHash: "0x5555555555555555555555555555555555555555",
    },
  ];

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
                <p className="text-4xl font-bold">1,234.56</p>
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
              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="text-muted-foreground">
                  {lang === "zh"
                    ? "Gas 费用: 0.5 USDT (由系统承担)"
                    : "Gas Fee: 0.5 USDT (covered by system)"}
                </p>
              </div>
              <Button className="w-full">{lang === "zh" ? "确认充值" : "Confirm Deposit"}</Button>
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
              <div className="bg-yellow-50 p-3 rounded text-sm space-y-1">
                <p className="text-muted-foreground">
                  {lang === "zh" ? "Gas 费用: 0.5 USDT (由玩家承担)" : "Gas Fee: 0.5 USDT (paid by player)"}
                </p>
                <p className="text-muted-foreground">
                  {lang === "zh"
                    ? "实际到账: " + (withdrawAmount ? (parseFloat(withdrawAmount) - 0.5).toFixed(2) : "0.00") + " ISC"
                    : "Actual amount: " + (withdrawAmount ? (parseFloat(withdrawAmount) - 0.5).toFixed(2) : "0.00") + " ISC"}
                </p>
              </div>
              <Button className="w-full">{lang === "zh" ? "确认提现" : "Confirm Withdraw"}</Button>
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
                <Label htmlFor="recipient">{lang === "zh" ? "收款人地址" : "Recipient Address"}</Label>
                <Input id="recipient" placeholder="0x..." />
              </div>
              <div>
                <Label htmlFor="transfer-amount">{lang === "zh" ? "转账金额" : "Amount"}</Label>
                <Input id="transfer-amount" type="number" placeholder="0.00" />
              </div>
              <Button className="w-full">{lang === "zh" ? "确认转账" : "Confirm Transfer"}</Button>
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
              <div className="space-y-3">
                {transactions.map((tx) => (
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
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={`font-medium ${tx.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "deposit" ? "+" : "-"}
                          {tx.amount}
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
