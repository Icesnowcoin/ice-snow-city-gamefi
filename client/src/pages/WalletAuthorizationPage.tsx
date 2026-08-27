import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WalletConnectPanel, type ConnectedWallet, type WalletType } from '@/components/WalletConnectPanel';
import { DepositFlow } from '@/components/DepositFlow';
import { WithdrawalFlow } from '@/components/WithdrawalFlow';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function WalletAuthorizationPage() {
  const { lang } = useLanguage();
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [totalBalance, setTotalBalance] = useState('0');
  const [selectedWallet, setSelectedWallet] = useState<ConnectedWallet | null>(null);

  const handleWalletConnect = (wallet: ConnectedWallet) => {
    setConnectedWallets(prev => {
      const filtered = prev.filter(w => w.type !== wallet.type);
      const updated = [...filtered, wallet];
      
      // Calculate total balance
      const total = updated.reduce((sum, w) => sum + parseFloat(w.balance || '0'), 0);
      setTotalBalance(total.toFixed(4));
      
      return updated;
    });
  };

  const handleWalletDisconnect = (walletType: WalletType) => {
    setConnectedWallets(prev => {
      const filtered = prev.filter(w => w.type !== walletType);
      
      // Recalculate total balance
      const total = filtered.reduce((sum, w) => sum + parseFloat(w.balance || '0'), 0);
      setTotalBalance(total.toFixed(4));
      
      return filtered;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Wallet className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">
              {lang === 'zh' ? '钱包授权' : 'Wallet Authorization'}
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {lang === 'zh'
              ? '连接您的加密钱包以进行充值和提取操作。支持多种钱包类型，安全可靠。'
              : 'Connect your crypto wallet to perform deposit and withdrawal operations. Supports multiple wallet types, secure and reliable.'}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    {lang === 'zh' ? '已连接钱包' : 'Connected Wallets'}
                  </span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-white">{connectedWallets.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    {lang === 'zh' ? '总余额 (BNB)' : 'Total Balance (BNB)'}
                  </span>
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-cyan-400">{totalBalance}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    {lang === 'zh' ? '授权状态' : 'Authorization Status'}
                  </span>
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-yellow-500">
                  {connectedWallets.length > 0 ? '✓' : '✗'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="connect" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger value="connect" className="data-[state=active]:bg-cyan-600">
              {lang === 'zh' ? '连接钱包' : 'Connect Wallet'}
            </TabsTrigger>
            <TabsTrigger value="deposit" className="data-[state=active]:bg-cyan-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '充值' : 'Deposit'}
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="data-[state=active]:bg-cyan-600">
              <TrendingDown className="w-4 h-4 mr-2" />
              {lang === 'zh' ? '提取' : 'Withdraw'}
            </TabsTrigger>
          </TabsList>

          {/* Connect Tab */}
          <TabsContent value="connect" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {lang === 'zh' ? '选择钱包' : 'Select Wallet'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WalletConnectPanel
                  onWalletConnect={handleWalletConnect}
                  onWalletDisconnect={handleWalletDisconnect}
                />
              </CardContent>
            </Card>

            {/* Info Alert */}
            <Alert className="bg-blue-900 border-blue-700">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                {lang === 'zh'
                  ? '提示：您可以同时连接多个钱包，系统会自动计算总余额。'
                  : 'Tip: You can connect multiple wallets at the same time, and the system will automatically calculate the total balance.'}
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-4">
            {connectedWallets.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    {lang === 'zh' ? '充值 ISC' : 'Deposit ISC'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-yellow-900 border-yellow-700">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-200">
                      {lang === 'zh'
                        ? '请先连接钱包以进行充值操作'
                        : 'Please connect a wallet first to perform deposit operations'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    {lang === 'zh' ? '充值 ISC' : 'Deposit ISC'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DepositFlow
                    walletAddress={selectedWallet?.address || connectedWallets[0]?.address}
                    walletBalance={selectedWallet?.balance || connectedWallets[0]?.balance || '0'}
                    onDepositSuccess={(txHash: string, amount: string) => {
                      console.log(`Deposit successful: ${amount} ISC, TX: ${txHash}`);
                    }}
                    onDepositError={(error: string) => {
                      console.error(`Deposit error: ${error}`);
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-4">
            {connectedWallets.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    {lang === 'zh' ? '提取 USDT' : 'Withdraw USDT'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-yellow-900 border-yellow-700">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-200">
                      {lang === 'zh'
                        ? '请先连接钱包以进行提取操作'
                        : 'Please connect a wallet first to perform withdrawal operations'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    {lang === 'zh' ? '提取 USDT' : 'Withdraw USDT'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WithdrawalFlow
                    walletAddress={selectedWallet?.address || connectedWallets[0]?.address}
                    iscBalance="10000"
                    usdtBalance="5000"
                    onWithdrawalSuccess={(txHash, amount) => {
                      console.log(`Withdrawal successful: ${amount} ISC, TX: ${txHash}`);
                    }}
                    onWithdrawalError={(error) => {
                      console.error(`Withdrawal error: ${error}`);
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Security Info */}
        <Alert className="bg-slate-800 border-slate-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-gray-300">
            {lang === 'zh'
              ? '🔒 安全提示：所有钱包连接都在本地进行，您的私钥永远不会被上传到服务器。我们使用业界标准的加密协议保护您的资产。'
              : '🔒 Security Notice: All wallet connections are performed locally. Your private keys will never be uploaded to the server. We use industry-standard encryption protocols to protect your assets.'}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
