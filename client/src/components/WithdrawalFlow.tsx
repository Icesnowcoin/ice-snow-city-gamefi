import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import {
  ArrowDownLeft,
  DollarSign,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  TrendingDown,
  Info,
  Wallet,
  Lock,
  Clock,
} from 'lucide-react';

export interface WithdrawalFlowProps {
  walletAddress?: string;
  iscBalance?: string;
  usdtBalance?: string;
  onWithdrawalSuccess?: (txHash: string, amount: string) => void;
  onWithdrawalError?: (error: string) => void;
}

const WITHDRAWAL_LIMITS = {
  min: 10,
  max: 10000,
};

const CONVERSION_RATE = 1; // 1 ISC = 1 USDT (simplified)
const WITHDRAWAL_FEE_PERCENT = 2; // 2% withdrawal fee

export const WithdrawalFlow: React.FC<WithdrawalFlowProps> = ({
  walletAddress,
  iscBalance = '0',
  usdtBalance = '0',
  onWithdrawalSuccess,
  onWithdrawalError,
}) => {
  const { lang } = useLanguage();
  const [step, setStep] = useState<'amount' | 'verify' | 'confirm' | 'success'>('amount');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'pending' | 'verified' | 'expired'>('pending');
  const [activationTime, setActivationTime] = useState<Date | null>(null);

  // tRPC mutations
  const requestMutation = trpc.wallet.requestWithdrawal.useMutation();
  const verifyMutation = trpc.wallet.verifyWithdrawal.useMutation();
  const completeMutation = trpc.wallet.completeWithdrawal.useMutation();

  const amount = parseFloat(withdrawalAmount) || 0;
  const fee = amount * (WITHDRAWAL_FEE_PERCENT / 100);
  const netAmount = amount - fee;
  const usdtReceived = netAmount * CONVERSION_RATE;

  useEffect(() => {
    // Simulate activation time (valid for 24 hours)
    if (activationStatus === 'verified') {
      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setActivationTime(expiryTime);
    }
  }, [activationStatus]);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRequestActivation = async () => {
    if (amount < WITHDRAWAL_LIMITS.min || amount > WITHDRAWAL_LIMITS.max) {
      toast.error(
        lang === 'zh'
          ? `提取金额必须在 ${WITHDRAWAL_LIMITS.min} - ${WITHDRAWAL_LIMITS.max} ISC 之间`
          : `Withdrawal amount must be between ${WITHDRAWAL_LIMITS.min} - ${WITHDRAWAL_LIMITS.max} ISC`
      );
      return;
    }

    if (parseFloat(iscBalance) < amount) {
      toast.error(
        lang === 'zh'
          ? `ISC 余额不足。需要 ${amount} ISC，当前余额 ${iscBalance} ISC`
          : `Insufficient ISC balance. Need ${amount} ISC, current balance ${iscBalance} ISC`
      );
      return;
    }

    setIsProcessing(true);
    try {
      // Request withdrawal activation via tRPC
      const result = await requestMutation.mutateAsync({
        amount: amount.toString(),
        recipientAddress: recipientAddress || walletAddress || '',
      });

      if (!result.success) {
        throw new Error('Failed to request withdrawal');
      }

      setActivationStatus('verified');
      setStep('verify');
      toast.success(
        lang === 'zh' ? '激活请求已发送，请检查您的邮箱' : 'Activation request sent, please check your email'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Activation failed';
      toast.error(
        lang === 'zh' ? `激活失败: ${errorMessage}` : `Activation failed: ${errorMessage}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error(
        lang === 'zh' ? '请输入 6 位验证码' : 'Please enter a 6-digit verification code'
      );
      return;
    }

    if (!recipientAddress || !recipientAddress.startsWith('0x')) {
      toast.error(
        lang === 'zh' ? '请输入有效的钱包地址' : 'Please enter a valid wallet address'
      );
      return;
    }

    setIsProcessing(true);
    try {
      // Verify withdrawal via tRPC
      const result = await verifyMutation.mutateAsync({
        code: verificationCode,
        amount: amount.toString(),
        recipientAddress,
      });

      if (!result.success || !result.verified) {
        throw new Error('Verification failed');
      }

      setStep('confirm');
      toast.success(
        lang === 'zh' ? '验证成功' : 'Verification successful'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      toast.error(
        lang === 'zh' ? `验证失败: ${errorMessage}` : `Verification failed: ${errorMessage}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!agreedToTerms) {
      toast.error(lang === 'zh' ? '请同意服务条款' : 'Please agree to the terms of service');
      return;
    }

    setIsProcessing(true);
    try {
      // Complete withdrawal via tRPC
      const result = await completeMutation.mutateAsync({
        amount: amount.toString(),
        recipientAddress,
      });

      if (!result.success) {
        throw new Error('Withdrawal failed');
      }

      const hash = `0x${Math.random().toString(16).slice(2)}`;
      setTxHash(hash);
      setStep('success');
      onWithdrawalSuccess?.(hash, amount.toString());

      toast.success(
        lang === 'zh' ? '提取成功！' : 'Withdrawal successful!'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
      onWithdrawalError?.(errorMessage);
      toast.error(
        lang === 'zh' ? `提取失败: ${errorMessage}` : `Withdrawal failed: ${errorMessage}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('amount');
    setWithdrawalAmount('');
    setRecipientAddress('');
    setVerificationCode('');
    setTxHash('');
    setAgreedToTerms(false);
    setActivationStatus('pending');
  };

  return (
    <div className="w-full space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {['amount', 'verify', 'confirm', 'success'].map((s, idx) => (
          <React.Fragment key={s}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                step === s
                  ? 'bg-cyan-600 text-white'
                  : ['amount', 'verify', 'confirm'].indexOf(step) >= idx
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-gray-400'
              }`}
            >
              {['amount', 'verify', 'confirm'].indexOf(step) > idx ? <Check size={18} /> : idx + 1}
            </div>
            {idx < 3 && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-all ${
                  ['amount', 'verify', 'confirm'].indexOf(step) > idx ? 'bg-green-600' : 'bg-slate-700'
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
              {lang === 'zh' ? '选择提取金额' : 'Select Withdrawal Amount'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-cyan-600 bg-cyan-600/10">
              <Info size={16} className="text-cyan-400" />
              <AlertDescription className="text-gray-300">
                {lang === 'zh'
                  ? '提取需要激活。您将收到一封包含验证码的邮件。'
                  : 'Withdrawal requires activation. You will receive an email with a verification code.'}
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-gray-300">{lang === 'zh' ? '提取金额' : 'Withdrawal Amount'} (ISC)</Label>
              <Input
                type="number"
                placeholder="100"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="mt-2 bg-slate-800 border-slate-700 text-white"
              />
              <div className="text-xs text-gray-400 mt-1">
                {lang === 'zh'
                  ? `最小: ${WITHDRAWAL_LIMITS.min} ISC, 最大: ${WITHDRAWAL_LIMITS.max} ISC`
                  : `Min: ${WITHDRAWAL_LIMITS.min} ISC, Max: ${WITHDRAWAL_LIMITS.max} ISC`}
              </div>
            </div>

            <div>
              <Label className="text-gray-300">{lang === 'zh' ? '收款地址' : 'Recipient Address'}</Label>
              <Input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="mt-2 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Cost Summary */}
            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{lang === 'zh' ? '提取金额' : 'Withdrawal Amount'}:</span>
                  <span className="text-white font-semibold">{amount} ISC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{lang === 'zh' ? '手续费 (2%)' : 'Fee (2%)'}:</span>
                  <span className="text-orange-400 font-semibold">-{fee.toFixed(2)} ISC</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="text-gray-300 font-semibold">{lang === 'zh' ? '实际到账' : 'Net Amount'}:</span>
                  <span className="text-cyan-400 font-bold text-lg">{netAmount.toFixed(2)} ISC</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="text-gray-300 font-semibold">{lang === 'zh' ? '获得 USDT' : 'USDT Received'}:</span>
                  <span className="text-green-400 font-bold text-lg">{usdtReceived.toFixed(2)} USDT</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Button
              onClick={handleRequestActivation}
              disabled={isProcessing || amount <= 0}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  {lang === 'zh' ? '请求中...' : 'Requesting...'}
                </>
              ) : (
                <>
                  {lang === 'zh' ? '请求激活' : 'Request Activation'} <ArrowDownLeft className="ml-2" size={18} />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Step */}
      {step === 'verify' && (
        <Card className="border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Lock size={20} />
              {lang === 'zh' ? '验证身份' : 'Verify Identity'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-600 bg-blue-600/10">
              <Info size={16} className="text-blue-400" />
              <AlertDescription className="text-gray-300">
                {lang === 'zh'
                  ? '我们已向您的邮箱发送了验证码。请输入验证码以继续。'
                  : 'We have sent a verification code to your email. Please enter it to continue.'}
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-gray-300">{lang === 'zh' ? '验证码' : 'Verification Code'}</Label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                maxLength={6}
                className="mt-2 bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
              />
            </div>

            <div>
              <Label className="text-gray-300">{lang === 'zh' ? '收款地址' : 'Recipient Address'}</Label>
              <Input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="mt-2 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Summary */}
            <div className="space-y-2 p-3 bg-slate-800 rounded">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{lang === 'zh' ? '提取金额' : 'Amount'}:</span>
                <span className="text-cyan-400 font-semibold">{amount} ISC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{lang === 'zh' ? '手续费' : 'Fee'}:</span>
                <span className="text-orange-400 font-semibold">-{fee.toFixed(2)} ISC</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between">
                <span className="text-gray-300 font-semibold">{lang === 'zh' ? '到账金额' : 'Net Amount'}:</span>
                <span className="text-green-400 font-bold">{netAmount.toFixed(2)} ISC</span>
              </div>
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
                onClick={handleVerify}
                disabled={isProcessing || verificationCode.length !== 6}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={18} />
                    {lang === 'zh' ? '验证中...' : 'Verifying...'}
                  </>
                ) : (
                  <>
                    {lang === 'zh' ? '验证' : 'Verify'} <CheckCircle className="ml-2" size={18} />
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
            <CardTitle className="text-cyan-400">
              {lang === 'zh' ? '确认提取' : 'Confirm Withdrawal'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-cyan-600 bg-cyan-600/10">
              <Info size={16} className="text-cyan-400" />
              <AlertDescription className="text-gray-300">
                {lang === 'zh'
                  ? '请确认所有信息无误后点击确认进行提取'
                  : 'Please confirm all information is correct before proceeding with withdrawal'}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-slate-800 rounded">
                <span className="text-gray-400">{lang === 'zh' ? '提取金额' : 'Amount'}:</span>
                <span className="text-cyan-400 font-semibold">{amount} ISC</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded">
                <span className="text-gray-400">{lang === 'zh' ? '手续费' : 'Fee'}:</span>
                <span className="text-orange-400 font-semibold">-{fee.toFixed(2)} ISC</span>
              </div>
              <div className="flex justify-between p-3 bg-green-900/30 rounded border border-green-700">
                <span className="text-gray-300">{lang === 'zh' ? '到账金额' : 'Net Amount'}:</span>
                <span className="text-green-400 font-bold text-lg">{netAmount.toFixed(2)} ISC</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded">
                <span className="text-gray-400">{lang === 'zh' ? '收款地址' : 'Recipient'}:</span>
                <span className="text-white font-semibold text-xs break-all">{recipientAddress}</span>
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
                onClick={() => setStep('verify')}
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
                    {lang === 'zh' ? '确认提取' : 'Confirm Withdrawal'} <CheckCircle className="ml-2" size={18} />
                  </>
                )}
              </Button>
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
              {lang === 'zh' ? '提取成功' : 'Withdrawal Successful'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-600 bg-green-600/10">
              <CheckCircle size={16} className="text-green-400" />
              <AlertDescription className="text-gray-300">
                {lang === 'zh'
                  ? '您的提取请求已成功提交！资金将在 1-3 个工作日内到账。'
                  : 'Your withdrawal request has been submitted successfully! Funds will arrive within 1-3 business days.'}
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
                  <div className="text-sm text-gray-400">{lang === 'zh' ? '提取金额' : 'Amount'}</div>
                  <div className="text-xl font-bold text-cyan-400">{amount} ISC</div>
                </div>
                <div className="p-3 bg-slate-800 rounded text-center">
                  <div className="text-sm text-gray-400">{lang === 'zh' ? '手续费' : 'Fee'}</div>
                  <div className="text-xl font-bold text-orange-400">-{fee.toFixed(2)} ISC</div>
                </div>
              </div>

              <div className="p-4 bg-green-900/30 rounded border border-green-700">
                <div className="text-sm text-gray-300 mb-1">{lang === 'zh' ? '预计到账' : 'Expected Amount'}:</div>
                <div className="text-2xl font-bold text-green-400">{netAmount.toFixed(2)} ISC</div>
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
