import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Building2,
  TrendingUp,
  Download,
  Upload,
  Clock,
  Calculator,
  Wallet,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Percent,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

export default function BankPage() {
  const { lang } = useLanguage();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [calcAmount, setCalcAmount] = useState("10000");
  const [calcDays, setCalcDays] = useState("365");

  // Fetch bank info from backend
  const { data: bankInfo, isLoading, refetch } = trpc.game.economy.getBankInfo.useQuery(undefined, {
    staleTime: 10000,
  });

  // Mutations
  const depositMutation = trpc.game.economy.deposit.useMutation({
    onSuccess: (data) => {
      toast.success(lang === "zh" ? `存款成功！新余额: ${data.newBalance} ISC` : `Deposit successful! New balance: ${data.newBalance} ISC`);
      setDepositAmount("");
      refetch();
    },
    onError: (error) => {
      toast.error(lang === "zh" ? `存款失败: ${error.message}` : `Deposit failed: ${error.message}`);
    },
  });

  const withdrawMutation = trpc.game.economy.withdraw.useMutation({
    onSuccess: (data) => {
      toast.success(lang === "zh" ? `取款成功！新余额: ${data.newBalance} ISC` : `Withdrawal successful! New balance: ${data.newBalance} ISC`);
      setWithdrawAmount("");
      refetch();
    },
    onError: (error) => {
      toast.error(lang === "zh" ? `取款失败: ${error.message}` : `Withdrawal failed: ${error.message}`);
    },
  });

  const claimInterestMutation = trpc.game.economy.claimInterest.useMutation({
    onSuccess: (data) => {
      toast.success(lang === "zh" ? `利息领取成功！+${data.interest} ISC` : `Interest claimed! +${data.interest} ISC`);
      refetch();
    },
    onError: (error) => {
      toast.error(lang === "zh" ? `领取失败: ${error.message}` : `Claim failed: ${error.message}`);
    },
  });

  // Interest calculator
  const calculatedInterest = useMemo(() => {
    const amount = parseFloat(calcAmount) || 0;
    const days = parseInt(calcDays) || 0;
    const rate = bankInfo?.interestRate || 5;
    const dailyRate = rate / 365 / 100;
    const interest = Math.floor(amount * dailyRate * days);
    const total = amount + interest;
    return { interest, total, dailyEarning: Math.floor(amount * dailyRate) };
  }, [calcAmount, calcDays, bankInfo?.interestRate]);

  const handleDeposit = () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) {
      toast.error(lang === "zh" ? "请输入有效金额" : "Please enter a valid amount");
      return;
    }
    if (amount < 100) {
      toast.error(lang === "zh" ? "最低存款 100 ISC" : "Minimum deposit is 100 ISC");
      return;
    }
    depositMutation.mutate({ amount });
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error(lang === "zh" ? "请输入有效金额" : "Please enter a valid amount");
      return;
    }
    if (amount > (bankInfo?.balance || 0)) {
      toast.error(lang === "zh" ? "余额不足" : "Insufficient balance");
      return;
    }
    withdrawMutation.mutate({ amount });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Header */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {lang === "zh" ? "冰雪城银行" : "Ice Snow City Bank"}
              </p>
              <p className="text-4xl font-bold mt-2">
                {bankInfo?.balance?.toLocaleString() || "0"} <span className="text-xl">ISC</span>
              </p>
              <p className="text-emerald-200 text-sm mt-1">
                {lang === "zh" ? `年化利率: ${bankInfo?.interestRate || 5}% APY` : `Annual Rate: ${bankInfo?.interestRate || 5}% APY`}
              </p>
            </div>
            <PiggyBank className="w-14 h-14 opacity-50" />
          </div>
          
          {/* Pending Interest */}
          {(bankInfo?.pendingInterest || 0) > 0 && (
            <div className="mt-4 p-3 bg-emerald-700/50 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs">{lang === "zh" ? "待领取利息" : "Pending Interest"}</p>
                <p className="text-lg font-bold text-yellow-300">+{bankInfo?.pendingInterest} ISC</p>
              </div>
              <Button
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                onClick={() => claimInterestMutation.mutate()}
                disabled={!bankInfo?.canClaimInterest || claimInterestMutation.isPending}
              >
                {claimInterestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  lang === "zh" ? "领取" : "Claim"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">{lang === "zh" ? "日收益" : "Daily"}</p>
                <p className="font-bold text-green-600">+{bankInfo?.dailyInterest || 0} ISC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">{lang === "zh" ? "月收益" : "Monthly"}</p>
                <p className="font-bold text-blue-600">+{bankInfo?.monthlyInterest || 0} ISC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">{lang === "zh" ? "年收益" : "Yearly"}</p>
                <p className="font-bold text-purple-600">+{bankInfo?.yearlyInterest || 0} ISC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-cyan-500" />
              <div>
                <p className="text-xs text-muted-foreground">{lang === "zh" ? "总存入" : "Total In"}</p>
                <p className="font-bold">{bankInfo?.totalDeposited?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposit">{lang === "zh" ? "存款" : "Deposit"}</TabsTrigger>
          <TabsTrigger value="withdraw">{lang === "zh" ? "取款" : "Withdraw"}</TabsTrigger>
          <TabsTrigger value="calculator">{lang === "zh" ? "计算器" : "Calculator"}</TabsTrigger>
        </TabsList>

        {/* Deposit Tab */}
        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-green-500" />
                {lang === "zh" ? "存入 ISC" : "Deposit ISC"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deposit-amount">{lang === "zh" ? "存款金额" : "Deposit Amount"}</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder={lang === "zh" ? "最低 100 ISC" : "Min 100 ISC"}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min={100}
                />
              </div>
              
              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[1000, 5000, 10000, 50000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(String(amt))}
                    className="text-xs"
                  >
                    {amt >= 10000 ? `${amt / 10000}W` : amt.toLocaleString()}
                  </Button>
                ))}
              </div>

              {depositAmount && parseInt(depositAmount) >= 100 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === "zh" ? "预计日收益" : "Est. Daily"}</span>
                    <span className="text-green-600 font-medium">
                      +{Math.floor(parseInt(depositAmount) * (bankInfo?.interestRate || 5) / 365 / 100)} ISC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === "zh" ? "预计月收益" : "Est. Monthly"}</span>
                    <span className="text-green-600 font-medium">
                      +{Math.floor(parseInt(depositAmount) * (bankInfo?.interestRate || 5) / 12 / 100)} ISC
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleDeposit}
                disabled={depositMutation.isPending || !depositAmount}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {depositMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {lang === "zh" ? "确认存款" : "Confirm Deposit"}
              </Button>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {lang === "zh" ? "存款即时到账，随时可取。利息每日结算，需手动领取。" : "Deposits are instant. Interest accrues daily, claim manually."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-red-500" />
                {lang === "zh" ? "取出 ISC" : "Withdraw ISC"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="withdraw-amount">{lang === "zh" ? "取款金额" : "Withdraw Amount"}</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder={lang === "zh" ? `最多 ${bankInfo?.balance?.toLocaleString() || 0} ISC` : `Max ${bankInfo?.balance?.toLocaleString() || 0} ISC`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={bankInfo?.balance || 0}
                />
              </div>

              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "25%", value: Math.floor((bankInfo?.balance || 0) * 0.25) },
                  { label: "50%", value: Math.floor((bankInfo?.balance || 0) * 0.5) },
                  { label: "75%", value: Math.floor((bankInfo?.balance || 0) * 0.75) },
                  { label: lang === "zh" ? "全部" : "All", value: bankInfo?.balance || 0 },
                ].map((opt) => (
                  <Button
                    key={opt.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount(String(opt.value))}
                    className="text-xs"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>

              {withdrawAmount && parseInt(withdrawAmount) > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === "zh" ? "取款后余额" : "After Withdrawal"}</span>
                    <span className="font-medium">
                      {((bankInfo?.balance || 0) - parseInt(withdrawAmount)).toLocaleString()} ISC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === "zh" ? "日收益减少" : "Daily Loss"}</span>
                    <span className="text-red-600 font-medium">
                      -{Math.floor(parseInt(withdrawAmount) * (bankInfo?.interestRate || 5) / 365 / 100)} ISC/day
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || !withdrawAmount}
                className="w-full"
                variant="destructive"
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {lang === "zh" ? "确认取款" : "Confirm Withdrawal"}
              </Button>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {lang === "zh" ? "取款即时到账，无手续费。取款后利息按新余额计算。" : "Withdrawals are instant, no fees. Interest recalculates on new balance."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-500" />
                {lang === "zh" ? "收益计算器" : "Interest Calculator"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{lang === "zh" ? "存款金额 (ISC)" : "Deposit Amount (ISC)"}</Label>
                <Input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label>{lang === "zh" ? "存款天数" : "Days"}</Label>
                <Input
                  type="number"
                  value={calcDays}
                  onChange={(e) => setCalcDays(e.target.value)}
                  placeholder="365"
                />
              </div>

              {/* Quick day buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[30, 90, 180, 365].map((d) => (
                  <Button
                    key={d}
                    variant="outline"
                    size="sm"
                    onClick={() => setCalcDays(String(d))}
                    className="text-xs"
                  >
                    {d}{lang === "zh" ? "天" : "d"}
                  </Button>
                ))}
              </div>

              {/* Results */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg space-y-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{lang === "zh" ? "预计总收益" : "Estimated Total Interest"}</p>
                  <p className="text-3xl font-bold text-purple-600">{calculatedInterest.interest.toLocaleString()} ISC</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "日收益" : "Daily"}</p>
                    <p className="font-bold text-green-600">+{calculatedInterest.dailyEarning}</p>
                  </div>
                  <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded">
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "到期总额" : "Total"}</p>
                    <p className="font-bold">{calculatedInterest.total.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    APY: {bankInfo?.interestRate || 5}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{lang === "zh" ? "账户信息" : "Account Info"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === "zh" ? "账户状态" : "Status"}</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {lang === "zh" ? "正常" : "Active"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === "zh" ? "年化利率" : "APY"}</span>
              <span className="font-medium text-green-600">{bankInfo?.interestRate || 5}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === "zh" ? "存款次数" : "Deposits"}</span>
              <span className="font-medium">{bankInfo?.depositCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === "zh" ? "累计存入" : "Total Deposited"}</span>
              <span className="font-medium">{bankInfo?.totalDeposited?.toLocaleString() || 0} ISC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === "zh" ? "上次领息" : "Last Interest"}</span>
              <span className="font-medium text-xs">
                {bankInfo?.lastInterestPaid ? new Date(bankInfo.lastInterestPaid).toLocaleDateString() : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === "zh" ? "开户时间" : "Opened"}</span>
              <span className="font-medium text-xs">
                {bankInfo?.accountCreatedAt ? new Date(bankInfo.accountCreatedAt).toLocaleDateString() : "-"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Rules */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === "zh"
              ? "冰雪城银行规则：1) 最低存款 100 ISC；2) 利息每日结算，需手动领取；3) 取款无手续费，即时到账；4) APY 可能随市场变化调整；5) 银行操作需要输入交易密码。"
              : "Bank Rules: 1) Min deposit 100 ISC; 2) Interest accrues daily, claim manually; 3) No withdrawal fees, instant; 4) APY may adjust with market; 5) Bank operations require transaction password."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
