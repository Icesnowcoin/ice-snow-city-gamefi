import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWalletPersistence } from '@/hooks/useWalletPersistence';
import { MobileWalletConnect } from '@/components/MobileWalletConnect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Smartphone,
  Wallet,
  Copy,
  Check,
  LogOut,
  RefreshCw,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const MobileWalletPage: React.FC = () => {
  const { lang } = useLanguage();
  const { getWalletConnection, clearWalletConnection, getWalletConnectionRemainingTime } = useWalletPersistence();
  const [walletConnection, setWalletConnection] = useState<any>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiryTime, setExpiryTime] = useState<string>('');

  // Load wallet connection
  useEffect(() => {
    const connection = getWalletConnection();
    setWalletConnection(connection);
  }, [getWalletConnection]);

  // Update expiry time
  useEffect(() => {
    if (!walletConnection) return;

    const updateExpiryDisplay = () => {
      const remaining = getWalletConnectionRemainingTime();
      if (remaining <= 0) {
        setExpiryTime('');
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setExpiryTime(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setExpiryTime(`${hours}h ${minutes}m`);
      } else {
        setExpiryTime(`${minutes}m`);
      }
    };

    updateExpiryDisplay();
    const interval = setInterval(updateExpiryDisplay, 60000);
    return () => clearInterval(interval);
  }, [walletConnection, getWalletConnectionRemainingTime]);

  const handleCopyAddress = () => {
    if (!walletConnection?.address) return;
    navigator.clipboard.writeText(walletConnection.address);
    setCopied(true);
    toast.success(lang === 'zh' ? '地址已复制' : 'Address copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    clearWalletConnection();
    setWalletConnection(null);
    toast.success(lang === 'zh' ? '钱包已断开连接' : 'Wallet disconnected');
  };

  const handleWalletConnect = (address: string, walletType: string) => {
    // Update wallet connection state
    setWalletConnection({
      address,
      walletType,
      chainId: 56, // Default to BSC
      connectedAt: new Date().toISOString(),
    });
    setShowConnectModal(false);
    toast.success(lang === 'zh' ? '钱包连接成功' : 'Wallet connected successfully');
  };

  if (!walletConnection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Wallet className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {lang === 'zh' ? '连接您的钱包' : 'Connect Your Wallet'}
            </h1>
            <p className="text-gray-400">
              {lang === 'zh'
                ? '开始探索 Ice Snow City 游戏世界'
                : 'Start exploring the Ice Snow City game world'}
            </p>
          </div>

          {/* Features */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-300">
                    {lang === 'zh' ? '安全的钱包连接' : 'Secure wallet connection'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-300">
                    {lang === 'zh' ? '支持多种钱包' : 'Support multiple wallets'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-300">
                    {lang === 'zh' ? '快速二维码扫描' : 'Fast QR code scanning'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connect Button */}
          <Button
            onClick={() => setShowConnectModal(true)}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-6"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            {lang === 'zh' ? '连接钱包' : 'Connect Wallet'}
          </Button>

          {/* Info */}
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-400">
              {lang === 'zh'
                ? '首次连接需要授权，后续访问将自动恢复连接'
                : 'First connection requires authorization. Subsequent visits will automatically restore the connection'}
            </AlertDescription>
          </Alert>
        </div>

        {/* Connect Modal */}
        {showConnectModal && (
          <MobileWalletConnect
            onWalletConnect={handleWalletConnect}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </div>
    );
  }

  // Connected state
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">
          {lang === 'zh' ? '钱包已连接' : 'Wallet Connected'}
        </h1>
        <p className="text-gray-400">
          {lang === 'zh' ? '您可以开始游戏了' : 'You can start playing now'}
        </p>
      </div>

      {/* Wallet Info Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {lang === 'zh' ? '钱包信息' : 'Wallet Info'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Type */}
          <div>
            <p className="text-sm text-gray-400 mb-1">
              {lang === 'zh' ? '钱包类型' : 'Wallet Type'}
            </p>
            <Badge variant="secondary" className="capitalize">
              {walletConnection.walletType}
            </Badge>
          </div>

          {/* Address */}
          <div>
            <p className="text-sm text-gray-400 mb-2">
              {lang === 'zh' ? '钱包地址' : 'Wallet Address'}
            </p>
            <div className="bg-slate-900 rounded p-3 flex items-center justify-between">
              <code className="text-xs text-gray-300 break-all">
                {walletConnection.address}
              </code>
              <button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-slate-800 rounded transition-colors flex-shrink-0 ml-2"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Session Expiry */}
          {expiryTime && (
            <div>
              <p className="text-sm text-gray-400 mb-1">
                {lang === 'zh' ? '会话有效期' : 'Session Expires'}
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">{expiryTime}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => setShowConnectModal(true)}
          variant="outline"
          className="flex items-center justify-center gap-2 py-6"
        >
          <RefreshCw className="w-4 h-4" />
          {lang === 'zh' ? '切换钱包' : 'Switch Wallet'}
        </Button>
        <Button
          onClick={handleDisconnect}
          variant="destructive"
          className="flex items-center justify-center gap-2 py-6"
        >
          <LogOut className="w-4 h-4" />
          {lang === 'zh' ? '断开连接' : 'Disconnect'}
        </Button>
      </div>

      {/* Game Links */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg">
            {lang === 'zh' ? '游戏导航' : 'Game Navigation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="/"
            className="block p-3 bg-slate-900 hover:bg-slate-800 rounded transition-colors text-blue-400"
          >
            {lang === 'zh' ? '返回游戏' : 'Back to Game'}
          </a>
          <a
            href="/wallet-auth"
            className="block p-3 bg-slate-900 hover:bg-slate-800 rounded transition-colors text-blue-400"
          >
            {lang === 'zh' ? '充值/提取' : 'Deposit/Withdraw'}
          </a>
        </CardContent>
      </Card>

      {/* Connect Modal */}
      {showConnectModal && (
        <MobileWalletConnect
          onWalletConnect={handleWalletConnect}
          onClose={() => setShowConnectModal(false)}
        />
      )}
    </div>
  );
};

export default MobileWalletPage;
