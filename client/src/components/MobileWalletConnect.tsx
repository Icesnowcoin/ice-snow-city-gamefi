import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  QrCode,
  Smartphone,
  Wallet,
  Copy,
  Check,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';

export interface MobileWalletConnectProps {
  onWalletConnect?: (address: string, walletType: string) => void;
  onClose?: () => void;
}

const WALLET_APPS = [
  {
    name: 'MetaMask',
    icon: '🦊',
    deepLink: 'metamask://wc',
    appStore: 'https://apps.apple.com/app/metamask/id1438144202',
    playStore: 'https://play.google.com/store/apps/details?id=io.metamask',
  },
  {
    name: 'Trust Wallet',
    icon: '🛡️',
    deepLink: 'trust://wc',
    appStore: 'https://apps.apple.com/app/trust-wallet/id1288339409',
    playStore: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
  },
  {
    name: 'Coinbase Wallet',
    icon: '₿',
    deepLink: 'coinbase://wc',
    appStore: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
    playStore: 'https://play.google.com/store/apps/details?id=org.toshi',
  },
  {
    name: 'OKX Wallet',
    icon: '🔷',
    deepLink: 'okx://wc',
    appStore: 'https://apps.apple.com/app/okx-web3-wallet/id1625902211',
    playStore: 'https://play.google.com/store/apps/details?id=com.okex.wallet',
  },
];

export const MobileWalletConnect: React.FC<MobileWalletConnectProps> = ({
  onWalletConnect,
  onClose,
}) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'qr' | 'apps'>('qr');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize QR code scanner
  useEffect(() => {
    if (activeTab === 'qr' && !scannerReady && containerRef.current) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error('Failed to clear scanner:', err);
        });
      }
    };
  }, [activeTab, scannerReady]);

  const initializeScanner = () => {
    try {
      const scanner = new Html5QrcodeScanner(
        'qr-scanner-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleQrCodeScan(decodedText);
          scanner.clear().catch(err => console.error('Failed to clear scanner:', err));
        },
        (error) => {
          console.debug('QR Code scan error:', error);
        }
      );

      scannerRef.current = scanner;
      setScannerReady(true);
      setIsScanning(true);
    } catch (error) {
      console.error('Failed to initialize scanner:', error);
      toast.error(
        lang === 'zh'
          ? '无法初始化二维码扫描器，请检查摄像头权限'
          : 'Failed to initialize QR code scanner. Please check camera permissions.'
      );
    }
  };

  const handleQrCodeScan = (decodedText: string) => {
    setScannedData(decodedText);
    setIsScanning(false);

    // Parse WalletConnect URI
    if (decodedText.startsWith('wc:')) {
      toast.success(
        lang === 'zh'
          ? '二维码已识别，正在连接...'
          : 'QR code recognized. Connecting...'
      );
      // Trigger wallet connection with the scanned data
      onWalletConnect?.(decodedText, 'walletconnect');
    } else {
      toast.error(
        lang === 'zh'
          ? '无效的二维码，请扫描 WalletConnect 二维码'
          : 'Invalid QR code. Please scan a WalletConnect QR code.'
      );
      setIsScanning(true);
    }
  };

  const handleStopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => {
        console.error('Failed to stop scanner:', err);
      });
      setScannerReady(false);
      setIsScanning(false);
    }
  };

  const handleCopyScannedData = () => {
    navigator.clipboard.writeText(scannedData);
    setCopied(true);
    toast.success(lang === 'zh' ? '已复制' : 'Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWalletAppClick = (app: typeof WALLET_APPS[0]) => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      window.location.href = app.appStore;
    } else if (isAndroid) {
      window.location.href = app.playStore;
    } else {
      // Desktop fallback
      window.open(app.appStore, '_blank');
    }

    toast.info(
      lang === 'zh'
        ? `正在打开 ${app.name}...`
        : `Opening ${app.name}...`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            {lang === 'zh' ? '移动钱包连接' : 'Mobile Wallet Connect'}
          </CardTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'qr' | 'apps')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                {lang === 'zh' ? '扫描' : 'Scan'}
              </TabsTrigger>
              <TabsTrigger value="apps" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {lang === 'zh' ? '应用' : 'Apps'}
              </TabsTrigger>
            </TabsList>

            {/* QR Code Scanner Tab */}
            <TabsContent value="qr" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {lang === 'zh'
                    ? '使用您的钱包应用扫描下方二维码进行连接'
                    : 'Use your wallet app to scan the QR code below to connect'}
                </AlertDescription>
              </Alert>

              <div
                ref={containerRef}
                id="qr-scanner-container"
                className="w-full bg-slate-900 rounded-lg overflow-hidden"
                style={{ minHeight: '300px' }}
              />

              {scannerReady && (
                <div className="flex gap-2">
                  {isScanning ? (
                    <Button
                      onClick={handleStopScanning}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {lang === 'zh' ? '停止扫描' : 'Stop Scanning'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={initializeScanner}
                        variant="default"
                        className="flex-1"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        {lang === 'zh' ? '重新扫描' : 'Scan Again'}
                      </Button>
                      {scannedData && (
                        <Button
                          onClick={handleCopyScannedData}
                          variant="outline"
                          size="sm"
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}

              {scannedData && (
                <div className="bg-slate-900 rounded p-3 break-all text-xs text-gray-400">
                  {scannedData}
                </div>
              )}
            </TabsContent>

            {/* Wallet Apps Tab */}
            <TabsContent value="apps" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {lang === 'zh'
                    ? '选择您的钱包应用进行连接'
                    : 'Select your wallet app to connect'}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-3">
                {WALLET_APPS.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => handleWalletAppClick(app)}
                    className="p-4 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center gap-2"
                  >
                    <span className="text-3xl">{app.icon}</span>
                    <span className="text-sm font-medium text-center">{app.name}</span>
                  </button>
                ))}
              </div>

              <div className="text-xs text-gray-400 text-center">
                {lang === 'zh'
                  ? '如果您未安装钱包应用，点击按钮将跳转到应用商店'
                  : 'If you don\'t have a wallet app installed, clicking will redirect to the app store'}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileWalletConnect;
