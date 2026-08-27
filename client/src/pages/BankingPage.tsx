import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ISCAmount } from '@/components/ISCLogo';

export const BankingPage: React.FC = () => {
  const { lang } = useLanguage();
  
  // State
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const { data: account, isLoading: accountLoading, refetch: refetchAccount } = trpc.banking.getAccount.useQuery();
  const { data: interestStats } = trpc.banking.getInterestStats.useQuery();
  const { data: apyConfig } = trpc.banking.getAPYConfig.useQuery();
  const { data: interestRecords } = trpc.banking.getInterestRecords.useQuery({ limit: 10 });

  // Mutations
  const depositMutation = trpc.banking.deposit.useMutation({
    onSuccess: (data) => {
      toast.success(lang === 'zh' ? '存款成功' : 'Deposit Successful');
      setDepositAmount('');
      refetchAccount();
    },
    onError: (error) => {
      toast.error(lang === 'zh' ? '存款失败' : 'Deposit Failed');
    },
  });

  const withdrawMutation = trpc.banking.withdraw.useMutation({
    onSuccess: (data) => {
      toast.success(lang === 'zh' ? '取款成功' : 'Withdrawal Successful');
      setWithdrawAmount('');
      refetchAccount();
    },
    onError: (error) => {
      toast.error(lang === 'zh' ? '取款失败' : 'Withdrawal Failed');
    },
  });

  const claimInterestMutation = trpc.banking.claimInterest.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(lang === 'zh' ? '利息已领取' : 'Interest Claimed');
      } else {
        toast.info(lang === 'zh' ? '暂无利息' : 'No Interest Available');
      }
      refetchAccount();
    },
    onError: (error) => {
      toast.error(lang === 'zh' ? '领取失败' : 'Claim Failed');
    },
  });

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error(lang === 'zh' ? '请输入有效的存款金额' : 'Please enter a valid deposit amount');
      return;
    }

    setIsProcessing(true);
    try {
      await depositMutation.mutateAsync({ amount: parseFloat(depositAmount) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error(lang === 'zh' ? '请输入有效的取款金额' : 'Please enter a valid withdrawal amount');
      return;
    }

    setIsProcessing(true);
    try {
      await withdrawMutation.mutateAsync({ amount: parseFloat(withdrawAmount) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimInterest = async () => {
    setIsProcessing(true);
    try {
      await claimInterestMutation.mutateAsync();
    } finally {
      setIsProcessing(false);
    }
  };

  if (accountLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  const totalAPY = (apyConfig?.baseAPY || 0) + (apyConfig?.bonusAPY || 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {lang === 'zh' ? '银行系统' : 'Banking System'}
        </h1>
        <p className="text-muted-foreground">
          {lang === 'zh' 
            ? '存入 ISC 获得利息收益' 
            : 'Deposit ISC to earn interest'}
        </p>
      </div>

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {lang === 'zh' ? '账户余额' : 'Account Balance'}
            </p>
            <ISCAmount amount={account?.balance.toFixed(3) || '0.000'} size="lg" className="font-bold text-cyan-400" />
            <p className="text-xs text-muted-foreground">
              {lang === 'zh' ? '可用余额' : 'Available Balance'}
            </p>
          </div>
        </Card>

        {/* Total Deposited */}
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {lang === 'zh' ? '总存入' : 'Total Deposited'}
            </p>
            <ISCAmount amount={account?.totalDeposited.toFixed(3) || '0.000'} size="lg" className="font-bold text-green-400" />
            <p className="text-xs text-muted-foreground">
              {lang === 'zh' ? '历史累计' : 'Cumulative'}
            </p>
          </div>
        </Card>

        {/* Interest Earned */}
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {lang === 'zh' ? '已赚利息' : 'Interest Earned'}
            </p>
            <ISCAmount amount={account?.interestEarned.toFixed(3) || '0.000'} size="lg" className="font-bold text-yellow-400" />
            <p className="text-xs text-muted-foreground">
              {lang === 'zh' ? '累计收益' : 'Total Earnings'}
            </p>
          </div>
        </Card>

        {/* APY Rate */}
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {lang === 'zh' ? '年化收益率' : 'APY Rate'}
            </p>
            <p className="text-2xl font-bold text-purple-400">
              {totalAPY.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === 'zh' ? `${apyConfig?.baseAPY}% + ${apyConfig?.bonusAPY}%` : `${apyConfig?.baseAPY}% + ${apyConfig?.bonusAPY}%`}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Operations */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations">
            {lang === 'zh' ? '操作' : 'Operations'}
          </TabsTrigger>
          <TabsTrigger value="interest">
            {lang === 'zh' ? '利息' : 'Interest'}
          </TabsTrigger>
          <TabsTrigger value="history">
            {lang === 'zh' ? '历史' : 'History'}
          </TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deposit Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {lang === 'zh' ? '存款' : 'Deposit'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {lang === 'zh' ? '存款金额 (ISC)' : 'Deposit Amount (ISC)'}
                  </label>
                  <Input
                    type="number"
                    placeholder="0.000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isProcessing}
                    className="mt-2"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="flex items-center gap-1"><span>{lang === 'zh' ? '最小存款额：' : 'Minimum Deposit: '}</span><ISCAmount amount={String(apyConfig?.minDeposit ?? 0)} size="xs" /></p>
                  <p className="flex items-center gap-1"><span>{lang === 'zh' ? '最大存款额：' : 'Maximum Deposit: '}</span><ISCAmount amount={String(apyConfig?.maxDeposit ?? 0)} size="xs" /></p>
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={isProcessing || !depositAmount}
                  className="w-full"
                >
                  {isProcessing ? <Spinner className="mr-2" /> : null}
                  {lang === 'zh' ? '确认存款' : 'Confirm Deposit'}
                </Button>
              </div>
            </Card>

            {/* Withdrawal Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {lang === 'zh' ? '取款' : 'Withdraw'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {lang === 'zh' ? '取款金额 (ISC)' : 'Withdrawal Amount (ISC)'}
                  </label>
                  <Input
                    type="number"
                    placeholder="0.000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isProcessing}
                    className="mt-2"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="flex items-center gap-1"><span>{lang === 'zh' ? '可用余额：' : 'Available: '}</span><ISCAmount amount={account?.balance?.toFixed(3) || '0.000'} size="xs" /></p>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={isProcessing || !withdrawAmount || (account?.balance || 0) < parseFloat(withdrawAmount || '0')}
                  className="w-full"
                  variant="outline"
                >
                  {isProcessing ? <Spinner className="mr-2" /> : null}
                  {lang === 'zh' ? '确认取款' : 'Confirm Withdrawal'}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Interest Tab */}
        <TabsContent value="interest" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {lang === 'zh' ? '利息统计' : 'Interest Statistics'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {lang === 'zh' ? '总利息' : 'Total Interest'}
                </p>
                <ISCAmount amount={interestStats?.totalInterest?.toFixed(3) || '0.000'} size="lg" className="font-bold text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {lang === 'zh' ? '平均日利息' : 'Average Daily Interest'}
                </p>
                <ISCAmount amount={interestStats?.averageDailyInterest?.toFixed(6) || '0.000000'} size="lg" className="font-bold text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {lang === 'zh' ? '计息次数' : 'Interest Records'}
                </p>
                <p className="text-2xl font-bold text-blue-400">
                  {interestStats?.recordCount || 0}
                </p>
              </div>
            </div>

            <Button
              onClick={handleClaimInterest}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? <Spinner className="mr-2" /> : null}
              {lang === 'zh' ? '领取今日利息' : 'Claim Daily Interest'}
            </Button>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {lang === 'zh' ? '利息记录' : 'Interest Records'}
            </h3>
            {interestRecords && interestRecords.length > 0 ? (
              <div className="space-y-2">
                {interestRecords.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-muted rounded">
                    <div>
                      <ISCAmount amount={`+${record.amount.toFixed(6)}`} size="sm" className="font-medium" />
                      <p className="text-sm text-muted-foreground">
                        {lang === 'zh' ? `${record.period}天 @ ${record.rate}% APY` : `${record.period} days @ ${record.rate}% APY`}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.calculatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {lang === 'zh' ? '暂无利息记录' : 'No interest records yet'}
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankingPage;
