import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { GasFeeSelector } from '@/components/GasFeeSelector';
import {
  ArrowUpRight,
  DollarSign,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  Info,
  Wallet,
} from 'lucide-react';

export interface DepositOption {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  discount: number;
  popular?: boolean;
}



export interface DepositFlowProps {
  walletAddress?: string;
  walletBalance?: string;
  onDepositSuccess?: (txHash: string, amount: string) => void;
  onDepositError?: (error: string) => void;
}

const DEPOSIT_PACKAGES: DepositOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    amount: 100,
    bonus: 10,
    discount: 0,
  },
  {
    id: 'standard',
    name: 'Standard',
    amount: 500,
    bonus: 75,
    discount: 5,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    amount: 1000,
    bonus: 200,
    discount: 10,
  },
  {
    id: 'elite',
    name: 'Elite',
    amount: 5000,
    bonus: 1500,
    discount: 15,
  },
];

const GAS_PRICE_MULTIPLIER = 0.0001; // Gas fee multiplier per ISC
const BASE_GAS_FEE = 0.001; // Base gas fee in BNB

export const DepositFlow: React.FC<DepositFlowProps> = ({
  walletAddress,
  walletBalance = '0',
  onDepositSuccess,
  onDepositError,
}) => {
  const { lang } = useLanguage();
  const [step, setStep] = useState<'amount' | 'review' | 'confirm' | 'success'>('amount');
  const [depositType, setDepositType] = useState<'preset' | 'custom'>('preset');
  const [selectedPackage, setSelectedPackage] = useState<DepositOption | null>(DEPOSIT_PACKAGES[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [gasSpeed, setGasSpeed] = useState<'standard' | 'fast' | 'instant'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // tRPC mutations
  const initiateMutation = trpc.wallet.initiateDeposit.useMutation();
  const confirmMutation = trpc.wallet.confirmDeposit.useMutation();

  const currentAmount = depositType === 'preset' ? selectedPackage?.amount || 0 : parseFloat(customAmount) || 0;
  
  // Calculate estimated gas fee (simplified)
  const selectedGasFee = (() => {
    const baseGas = BASE_GAS_FEE + currentAmount * GAS_PRICE_MULTIPLIER;
    const multipliers = { standard: 1, fast: 1.5, instant: 2 };
    return (baseGas * multipliers[gasSpeed]).toFixed(6);
  })();
  
  const totalCost = (currentAmount * 0.001 + parseFloat(selectedGasFee)).toFixed(6);
  const bonus = depositType === 'preset' ? selectedPackage?.bonus || 0 : Math.floor(currentAmount * 0.1);
  const discount = depositType === 'preset' ? selectedPackage?.discount || 0 : 0;
  const finalAmount = currentAmount + bonus - discount;

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNext = () => {
    if (currentAmount <= 0) {
      toast.error(lang === 'zh' ? '请输入有效的充值金额' : 'Please enter a valid deposit amount');
      return;
    }

    if (parseFloat(walletBalance) < parseFloat(totalCost)) {
      toast.error(
        lang === 'zh'
          ? `钱包余额不足。需要 ${totalCost} BNB，当前余额 ${walletBalance} BNB`
          : `Insufficient wallet balance. Need ${totalCost} BNB, current balance ${walletBalance} BNB`
      );
      return;
    }

    setStep('review');
  };

  const handleConfirm = async () => {
    if (!agreedToTerms) {
      toast.error(lang === 'zh' ? '请同意服务条款' : 'Please agree to the terms of service');
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Initiate deposit on backend
      const initiateResult = await initiateMutation.mutateAsync({
        amount: currentAmount.toString(),
        gasPrice: selectedGasFee,
      });

      if (!initiateResult.success) {
        throw new Error('Failed to initiate deposit');
      }

      // Step 2: In a real scenario, user would sign transaction with wallet
      // For now, we simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Confirm deposit on backend
      const confirmResult = await confirmMutation.mutateAsync({
        amount: currentAmount.toString(),
      });

      if (!confirmResult.success) {
        throw new Error('Failed to confirm deposit');
      }

      const hash = `0x${Math.random().toString(16).slice(2)}`;
      setTxHash(hash);
      setStep('success');
      onDepositSuccess?.(hash, currentAmount.toString());

      toast.success(
        lang === 'zh' ? '充值成功！' : 'Deposit successful!'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      onDepositError?.(errorMessage);
      toast.error(
        lang === 'zh' ? `充值失败: ${errorMessage}` : `Deposit failed: ${errorMessage}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('amount');
    setDepositType('preset');
    setSelectedPackage(DEPOSIT_PACKAGES[1]);
    setCustomAmount('');
    setGasSpeed('standard');
    setTxHash('');
    setAgreedToTerms(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {['amount', 'review', 'confirm', 'success'].map((s, idx) => (
          <React.Fragment key={s}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                step === s
                  ? 'bg-cyan-600 text-white'
                  : ['amount', 'review', 'confirm'].indexOf(step) >= idx
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-gray-400'
              }`}
            >
              {['amount', 'review', 'confirm'].indexOf(step) > idx ? <Check size={18} /> : idx + 1}
            </div>
            {idx < 3 && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-all ${
                  ['amount', 'review', 'confirm'].indexOf(step) > idx ? 'bg-green-600' : 'bg-slate-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Amount Selection Step */}
      {step === 'amount' && (
        <Card className="border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-cyan-400">
              {lang === 'zh' ? '选择充值金额' : 'Select Deposit Amount'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deposit Type Tabs */}
            <Tabs value={depositType} onValueChange={(v) => setDepositType(v as 'preset' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="preset">{lang === 'zh' ? '预设套餐' : 'Preset'}</TabsTrigger>
                <TabsTrigger value="custom">{lang === 'zh' ? '自定义' : 'Custom'}</TabsTrigger>
              </TabsList>

              <TabsContent value="preset" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DEPOSIT_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {pkg.popular && (
                        <Badge className="mb-2 bg-orange-600">{lang === 'zh' ? '热门' : 'Popular'}</Badge>
                      )}
                      <div className="font-semibold text-white">{pkg.name}</div>
                      <div className="text-2xl font-bold text-cyan-400">{pkg.amount} ISC</div>
                      <div className="text-sm text-green-400">+{pkg.bonus} {lang === 'zh' ? '奖励' : 'Bonus'}</div>
                      {pkg.discount > 0 && (
                        <div className="text-sm text-orange-400">{pkg.discount}% {lang === 'zh' ? '折扣' : 'Discount'}</div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div>
                  <Label className="text-gray-300">{lang === 'zh' ? '输入金额' : 'Enter Amount'}</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Gas Speed Selection */}
            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <Zap size={16} />
                {lang === 'zh' ? 'Gas 费用' : 'Gas Fee'}
              </Label>
              <Tabs value={gasSpeed} onValueChange={(v) => setGasSpeed(v as 'standard' | 'fast' | 'instant')} className="mt-2">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                  <TabsTrigger value="standard">{lang === 'zh' ? '标准' : 'Standard'}</TabsTrigger>
                  <TabsTrigger value="fast">{lang === 'zh' ? '快速' : 'Fast'}</TabsTrigger>
                  <TabsTrigger value="instant">{lang === 'zh' ? '即时' : 'Instant'}</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="mt-2 text-sm text-gray-400">
                {lang === 'zh' ? '预计 Gas 费用' : 'Estimated Gas Fee'}: {selectedGasFee} BNB
              </div>
            </div>

            {/* Cost Summary */}
            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{lang === 'zh' ? '充值金额' : 'Deposit Amount'}:</span>
                  <span className="text-white font-semibold">{currentAmount} ISC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{lang === 'zh' ? 'Gas 费用' : 'Gas Fee'}:</span>
                  <span className="text-white font-semibold">{selectedGasFee} BNB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{lang === 'zh' ? '奖励' : 'Bonus'}:</span>
                  <span className="text-green-400 font-semibold">+{bonus} ISC</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{lang === 'zh' ? '折扣' : 'Discount'}:</span>
                    <span className="text-orange-400 font-semibold">-{discount}%</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="text-gray-300 font-semibold">{lang === 'zh' ? '总成本' : 'Total Cost'}:</span>
                  <span className="text-cyan-400 font-bold text-lg">{totalCost} BNB</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="text-gray-300 font-semibold">{lang === 'zh' ? '最终获得' : 'Final Amount'}:</span>
                  <span className="text-green-400 font-bold text-lg">{finalAmount} ISC</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Button
              onClick={handleNext}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
            >
              {lang === 'zh' ? '下一步' : 'Next'} <ArrowUpRight className="ml-2" size={18} />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === 'review' && (
        <Card className="border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-cyan-400">
              {lang === 'zh' ? '审核订单' : 'Review Order'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-cyan-600 bg-cyan-600/10">
              <Info size={16} className="text-cyan-400" />
              <AlertDescription className="text-gray-300">
                {lang === 'zh'
                  ? '请确认所有信息无误后点击确认进行支付'
                  : 'Please confirm all information is correct before proceeding with payment'}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-slate-800 rounded">
                <span className="text-gray-400">{lang === 'zh' ? '充值金额' : 'Deposit Amount'}:</span>
                <span className="text-cyan-400 font-semibold">{currentAmount} ISC</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded">
                <span className="text-gray-400">{lang === 'zh' ? 'Gas 费用' : 'Gas Fee'}:</span>
                <span className="text-white font-semibold">{selectedGasFee} BNB</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded">
                <span className="text-gray-400">{lang === 'zh' ? '总成本' : 'Total Cost'}:</span>
                <span className="text-cyan-400 font-bold text-lg">{totalCost} BNB</span>
              </div>
              <div className="flex justify-between p-3 bg-green-900/30 rounded border border-green-700">
                <span className="text-gray-300">{lang === 'zh' ? '最终获得' : 'Final Amount'}:</span>
                <span className="text-green-400 font-bold text-lg">{finalAmount} ISC</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                {lang === 'zh' ? '我同意服务条款和隐私政策' : 'I agree to the terms of service and privacy policy'}
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('amount')}
                variant="outline"
                className="flex-1 border-slate-700 text-gray-300 hover:bg-slate-800"
              >
                {lang === 'zh' ? '返回' : 'Back'}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing || !agreedToTerms}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={18} />
                    {lang === 'zh' ? '处理中...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    {lang === 'zh' ? '确认支付' : 'Confirm Payment'} <CheckCircle className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Step */}
      {step === 'confirm' && (
        <Card className="border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              {lang === 'zh' ? '处理中' : 'Processing'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-cyan-600 bg-cyan-600/10">
              <AlertCircle size={16} className="text-cyan-400" />
              <AlertDescription className="text-gray-300">
                {lang === 'zh'
                  ? '您的交易正在处理中，请稍候...'
                  : 'Your transaction is being processed. Please wait...'}
              </AlertDescription>
            </Alert>
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-cyan-400" size={48} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <Card className="border-green-700 bg-green-900/20">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle size={24} />
              {lang === 'zh' ? '充值成功' : 'Deposit Successful'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-600 bg-green-600/10">
              <CheckCircle size={16} className="text-green-400" />
              <AlertDescription className="text-gray-300">
                {lang === 'zh'
                  ? '您的充值已成功完成！'
                  : 'Your deposit has been completed successfully!'}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded">
                <div className="text-sm text-gray-400 mb-1">{lang === 'zh' ? '交易哈希' : 'Transaction Hash'}:</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-cyan-400 text-xs break-all">{txHash}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAddress}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800 rounded text-center">
                  <div className="text-sm text-gray-400">{lang === 'zh' ? '充值金额' : 'Amount'}</div>
                  <div className="text-xl font-bold text-cyan-400">{currentAmount} ISC</div>
                </div>
                <div className="p-3 bg-slate-800 rounded text-center">
                  <div className="text-sm text-gray-400">{lang === 'zh' ? '奖励' : 'Bonus'}</div>
                  <div className="text-xl font-bold text-green-400">+{bonus} ISC</div>
                </div>
              </div>

              <div className="p-4 bg-green-900/30 rounded border border-green-700">
                <div className="text-sm text-gray-300 mb-1">{lang === 'zh' ? '最终获得' : 'Final Balance'}:</div>
                <div className="text-2xl font-bold text-green-400">{finalAmount} ISC</div>
              </div>
            </div>

            <Button
              onClick={handleReset}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
            >
              {lang === 'zh' ? '完成' : 'Done'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
