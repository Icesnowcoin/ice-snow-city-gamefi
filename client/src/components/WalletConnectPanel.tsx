import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { connectWallet as connectWalletEthers, isWalletAvailable, formatAddress as formatAddressEthers, getNetworkName } from '@/lib/web3';
import { useWalletPersistence, type WalletConnectionState } from '@/hooks/useWalletPersistence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Wallet,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
  LogOut,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

// Wallet types and interfaces
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'ledger' | 'trezor';

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
  installed: boolean;
  description: string;
}

export interface ConnectedWallet {
  type: WalletType;
  address: string;
  chainId: number;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

const WALLET_CONFIGS: Record<WalletType, WalletInfo> = {
  metamask: {
    type: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    installed: typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
    description: 'Connect using MetaMask browser extension',
  },
  walletconnect: {
    type: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    installed: true,
    description: 'Scan QR code to connect mobile wallet',
  },
  coinbase: {
    type: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '₿',
    installed: typeof window !== 'undefined' && !!(window as any).coinbaseWalletExtension,
    description: 'Connect using Coinbase Wallet',
  },
  trust: {
    type: 'trust',
    name: 'Trust Wallet',
    icon: '🛡️',
    installed: typeof window !== 'undefined' && !!(window as any).trustwallet,
    description: 'Connect using Trust Wallet',
  },
  ledger: {
    type: 'ledger',
    name: 'Ledger',
    icon: '💳',
    installed: true,
    description: 'Connect using Ledger hardware wallet',
  },
  trezor: {
    type: 'trezor',
    name: 'Trezor',
    icon: '🔐',
    installed: true,
    description: 'Connect using Trezor hardware wallet',
  },
};

interface WalletConnectPanelProps {
  onWalletConnect?: (wallet: ConnectedWallet) => void;
  onWalletDisconnect?: (walletType: WalletType) => void;
}

export const WalletConnectPanel: React.FC<WalletConnectPanelProps> = ({
  onWalletConnect,
  onWalletDisconnect,
}) => {
  const { lang } = useLanguage();
  const { saveWalletConnection, getWalletConnection, clearWalletConnection, isWalletConnectionValid, getWalletConnectionRemainingTime } = useWalletPersistence();
  const [connectedWallets, setConnectedWallets] = useState<Map<WalletType, ConnectedWallet>>(new Map());
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState<WalletType | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<WalletType | null>(null);
  const [connectionExpiry, setConnectionExpiry] = useState<number | null>(null);

  // Load connected wallets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('connectedWallets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const walletMap = new Map<WalletType, ConnectedWallet>(Object.entries(parsed) as [WalletType, ConnectedWallet][]);
        setConnectedWallets(walletMap);
      } catch (error) {
        console.error('Failed to load connected wallets:', error);
      }
    }
  }, []);

  // Save connected wallets to localStorage
  useEffect(() => {
    const obj = Object.fromEntries(connectedWallets.entries());
    localStorage.setItem('connectedWallets', JSON.stringify(obj));
  }, [connectedWallets]);

  const connectWallet = async (walletType: WalletType) => {
    setIsConnecting(true);
    try {
      // Check if wallet is available
      if (!isWalletAvailable(walletType)) {
        throw new Error(`${WALLET_CONFIGS[walletType].name} is not installed`);
      }

      // Connect to wallet using ethers.js
      const connection = await connectWalletEthers(walletType);

      const wallet: ConnectedWallet = {
        type: walletType,
        address: connection.address,
        chainId: connection.chainId,
        balance: connection.balance,
        isConnected: true,
        isConnecting: false,
      };

      setConnectedWallets(prev => new Map(prev).set(walletType, wallet));
      onWalletConnect?.(wallet);

      // Save wallet connection to localStorage
      const connectionState: WalletConnectionState = {
        address: connection.address,
        walletType,
        chainId: connection.chainId,
        connectedAt: new Date().toISOString(),
      };
      saveWalletConnection(connectionState);
      setSelectedWallet(walletType);

      // Update expiry timer
      const remaining = getWalletConnectionRemainingTime();
      setConnectionExpiry(remaining);

      toast.success(
        lang === 'zh'
          ? `${WALLET_CONFIGS[walletType].name} 连接成功 (${getNetworkName(connection.chainId)})`
          : `${WALLET_CONFIGS[walletType].name} connected successfully (${getNetworkName(connection.chainId)})`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      const wallet: ConnectedWallet = {
        type: walletType,
        address: '',
        chainId: 0,
        balance: '0',
        isConnected: false,
        isConnecting: false,
        error: errorMessage,
      };
      setConnectedWallets(prev => new Map(prev).set(walletType, wallet));

      toast.error(
        lang === 'zh'
          ? `${WALLET_CONFIGS[walletType].name} 连接失败: ${errorMessage}`
          : `${WALLET_CONFIGS[walletType].name} connection failed: ${errorMessage}`
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = (walletType: WalletType) => {
    setConnectedWallets(prev => {
      const updated = new Map(prev);
      updated.delete(walletType);
      return updated;
    });
    onWalletDisconnect?.(walletType);
    setShowDisconnectConfirm(null);

    clearWalletConnection();
    setSelectedWallet(null);
    setConnectionExpiry(null);

    toast.success(
      lang === 'zh'
        ? `${WALLET_CONFIGS[walletType].name} 已断开连接`
        : `${WALLET_CONFIGS[walletType].name} disconnected`
    );
  };

  const copyAddress = (address: string, walletType: WalletType) => {
    navigator.clipboard.writeText(address);
    setCopied(walletType);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatAddressLocal = (address: string) => {
    return formatAddressEthers(address);
  };

  const getStatusIcon = (wallet: ConnectedWallet) => {
    if (wallet.error) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (wallet.isConnecting) {
      return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
    if (wallet.isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (wallet: ConnectedWallet) => {
    if (wallet.error) return 'destructive';
    if (wallet.isConnecting) return 'secondary';
    if (wallet.isConnected) return 'default';
    return 'outline';
  };

  const getStatusText = (wallet: ConnectedWallet) => {
    if (wallet.error) return lang === 'zh' ? '连接失败' : 'Connection Failed';
    if (wallet.isConnecting) return lang === 'zh' ? '连接中...' : 'Connecting...';
    if (wallet.isConnected) return lang === 'zh' ? '已连接' : 'Connected';
    return lang === 'zh' ? '未连接' : 'Not Connected';
  };

  return (
    <div className="w-full space-y-6">
      {/* Connected Wallets Section */}
      {connectedWallets.size > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              {lang === 'zh' ? '已连接的钱包' : 'Connected Wallets'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from(connectedWallets.values()).map(wallet => (
              <div
                key={wallet.type}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{WALLET_CONFIGS[wallet.type].icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{WALLET_CONFIGS[wallet.type].name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {formatAddressLocal(wallet.address)}
                      </code>
                      <button
                        onClick={() => copyAddress(wallet.address, wallet.type)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {copied === wallet.type ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{wallet.balance} BNB</div>
                    <Badge variant={getStatusColor(wallet)} className="gap-1">
                      {getStatusIcon(wallet)}
                      {getStatusText(wallet)}
                    </Badge>
                  </div>
                  <Dialog open={showDisconnectConfirm === wallet.type} onOpenChange={(open) => {
                    if (!open) setShowDisconnectConfirm(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDisconnectConfirm(wallet.type)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {lang === 'zh' ? '断开连接' : 'Disconnect Wallet'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          {lang === 'zh'
                            ? `确定要断开 ${WALLET_CONFIGS[wallet.type].name} 的连接吗？`
                            : `Are you sure you want to disconnect ${WALLET_CONFIGS[wallet.type].name}?`}
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setShowDisconnectConfirm(null)}
                          >
                            {lang === 'zh' ? '取消' : 'Cancel'}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => disconnectWallet(wallet.type)}
                          >
                            {lang === 'zh' ? '断开连接' : 'Disconnect'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Available Wallets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {lang === 'zh' ? '可用钱包' : 'Available Wallets'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.values(WALLET_CONFIGS).map(config => {
            const isConnected = connectedWallets.has(config.type);
            if (isConnected) return null; // Skip already connected wallets

            return (
              <div
                key={config.type}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{config.name}</div>
                    <div className="text-sm text-gray-600">{config.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!config.installed && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                      {lang === 'zh' ? '未安装' : 'Not Installed'}
                    </Badge>
                  )}
                  <Button
                    onClick={() => connectWallet(config.type)}
                    disabled={isConnecting || !config.installed}
                    size="sm"
                    className="gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {lang === 'zh' ? '连接中...' : 'Connecting...'}
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        {lang === 'zh' ? '连接' : 'Connect'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {lang === 'zh'
            ? '连接钱包后，您可以进行充值和提取操作。请确保您已安装相应的钱包扩展或应用程序。'
            : 'After connecting a wallet, you can perform deposit and withdrawal operations. Make sure you have installed the corresponding wallet extension or application.'}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WalletConnectPanel;
