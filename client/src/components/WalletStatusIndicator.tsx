import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatAddress as formatAddressEthers, getNetworkName } from '@/lib/web3';
import { switchNetwork, getMainnetNetworks, getNetworkIcon } from '@/lib/networkSwitcher';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Wallet,
  Copy,
  Check,
  LogOut,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export interface WalletStatusProps {
  address?: string;
  chainId?: number;
  walletType?: 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'ledger' | 'trezor';
  isConnected?: boolean;
  connectionExpiryTime?: number;
  onDisconnect?: () => void;
  onSwitchWallet?: () => void;
  onRefreshBalance?: () => void;
}

const NETWORK_COLORS: Record<number, string> = {
  1: 'bg-blue-500',
  56: 'bg-yellow-500',
  97: 'bg-orange-500',
  137: 'bg-purple-500',
  80001: 'bg-pink-500',
};

const WALLET_ICONS: Record<string, string> = {
  metamask: '🦊',
  walletconnect: '🔗',
  coinbase: '₿',
  trust: '🛡️',
  ledger: '💳',
  trezor: '🔐',
};

export const WalletStatusIndicator: React.FC<WalletStatusProps> = ({
  address,
  chainId = 0,
  walletType = 'metamask',
  isConnected = false,
  connectionExpiryTime,
  onDisconnect,
  onSwitchWallet,
  onRefreshBalance,
}) => {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [expiryTimeLeft, setExpiryTimeLeft] = useState<string>('');
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  useEffect(() => {
    if (!connectionExpiryTime) return;

    const updateExpiryDisplay = () => {
      const now = new Date().getTime();
      const remaining = connectionExpiryTime - now;

      if (remaining <= 0) {
        setExpiryTimeLeft('');
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setExpiryTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setExpiryTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setExpiryTimeLeft(`${minutes}m`);
      }

      if (remaining < 60 * 60 * 1000) {
        setShowExpiryWarning(true);
      } else {
        setShowExpiryWarning(false);
      }
    };

    updateExpiryDisplay();
    const interval = setInterval(updateExpiryDisplay, 60000);

    return () => clearInterval(interval);
  }, [connectionExpiryTime]);

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success(lang === 'zh' ? '地址已复制' : 'Address copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    onDisconnect?.();
    toast.success(
      lang === 'zh' ? '钱包已断开连接' : 'Wallet disconnected'
    );
  };

  const handleNetworkSwitch = async (newChainId: number) => {
    setIsSwitchingNetwork(true);
    try {
      const success = await switchNetwork(newChainId);
      if (success) {
        toast.success(
          lang === 'zh'
            ? `已切换到 ${getNetworkName(newChainId)}`
            : `Switched to ${getNetworkName(newChainId)}`
        );
      } else {
        toast.error(
          lang === 'zh'
            ? '网络切换失败，请重试'
            : 'Failed to switch network. Please try again.'
        );
      }
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error(
        lang === 'zh'
          ? '网络切换出错'
          : 'Error switching network'
      );
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        {lang === 'zh' ? '连接钱包' : 'Connect Wallet'}
      </Button>
    );
  }

  const networkName = getNetworkName(chainId);
  const networkColor = NETWORK_COLORS[chainId] || 'bg-gray-500';
  const walletIcon = WALLET_ICONS[walletType] || '👛';
  const displayAddress = formatAddressEthers(address);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 px-2 hover:bg-slate-800"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${networkColor}`} />
            <span className="text-xs font-medium hidden sm:inline">{networkName}</span>
          </div>

          <span className="font-mono text-sm">{displayAddress}</span>

          {showExpiryWarning && (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}

          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-3 space-y-2 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{walletIcon}</span>
              <div>
                <p className="text-sm font-semibold">
                  {lang === 'zh' ? '已连接' : 'Connected'}
                </p>
                <p className="text-xs text-gray-400">
                  {walletType.charAt(0).toUpperCase() + walletType.slice(1)}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {networkName}
            </Badge>
          </div>

          <div className="bg-slate-900 rounded px-3 py-2 flex items-center justify-between">
            <span className="font-mono text-sm text-gray-300">{displayAddress}</span>
            <button
              onClick={handleCopyAddress}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {expiryTimeLeft && (
            <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
              showExpiryWarning
                ? 'bg-yellow-500/10 text-yellow-600'
                : 'bg-blue-500/10 text-blue-600'
            }`}>
              <Clock className="w-3 h-3" />
              <span>
                {lang === 'zh' ? '会话有效期: ' : 'Session expires: '}
                {expiryTimeLeft}
              </span>
            </div>
          )}
        </div>

        <DropdownMenuItem onClick={onRefreshBalance} className="gap-2 cursor-pointer">
          <RefreshCw className="w-4 h-4" />
          <span>{lang === 'zh' ? '刷新余额' : 'Refresh Balance'}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSwitchWallet} className="gap-2 cursor-pointer">
          <Wallet className="w-4 h-4" />
          <span>{lang === 'zh' ? '切换钱包' : 'Switch Wallet'}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            const explorerUrl = getExplorerUrl(chainId, address);
            if (explorerUrl) window.open(explorerUrl, '_blank');
          }}
          className="gap-2 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>{lang === 'zh' ? '在浏览器中查看' : 'View on Explorer'}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Network Switch Section */}
        <div className="px-2 py-2">
          <p className="text-xs font-semibold text-gray-400 mb-2">
            {lang === 'zh' ? '切换网络' : 'Switch Network'}
          </p>
          <div className="space-y-1">
            {getMainnetNetworks().map((network) => (
              <button
                key={network.chainId}
                onClick={() => handleNetworkSwitch(network.chainId)}
                disabled={isSwitchingNetwork || chainId === network.chainId}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                  chainId === network.chainId
                    ? 'bg-blue-500/20 text-blue-400 cursor-default'
                    : 'hover:bg-slate-800 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <span className="text-lg">{getNetworkIcon(network.chainId)}</span>
                <span className="flex-1">{network.name}</span>
                {isSwitchingNetwork && chainId !== network.chainId && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDisconnect}
          className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
        >
          <LogOut className="w-4 h-4" />
          <span>{lang === 'zh' ? '断开连接' : 'Disconnect'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function getExplorerUrl(chainId: number, address: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/address/',
    56: 'https://bscscan.com/address/',
    97: 'https://testnet.bscscan.com/address/',
    137: 'https://polygonscan.com/address/',
    80001: 'https://mumbai.polygonscan.com/address/',
  };

  const baseUrl = explorers[chainId];
  return baseUrl ? `${baseUrl}${address}` : '';
}

export default WalletStatusIndicator;
