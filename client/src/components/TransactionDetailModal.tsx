import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TransactionPosterTemplate } from '@/components/TransactionPosterTemplate';
import { PosterShareMenu } from '@/components/PosterShareMenu';
import { PosterLoadingAnimation } from '@/components/PosterLoadingAnimation';
import {
  generateTransactionPoster,
  downloadTransactionPoster,
  shareTransactionPoster,
} from '@/lib/transactionPosterGenerator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  DollarSign,
  Hash,
  Calendar,
  MapPin,
  Download,
  Share2,
  Image,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

export interface TransactionDetail {
  id: number;
  type: 'deposit' | 'withdrawal' | 'refund' | 'fee' | 'income' | 'expense';
  amount: string;
  balance: string;
  description: string;
  createdAt: Date;
  status: 'success' | 'pending' | 'failed';
  txHash?: string;
  gasFee?: string;
  blockNumber?: number;
  from?: string;
  to?: string;
  network?: 'bsc' | 'ethereum' | 'polygon';
  confirmations?: number;
}

interface TransactionDetailModalProps {
  transaction: TransactionDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const NETWORK_CONFIG: Record<string, { name: string; explorer: string; color: string }> = {
  bsc: {
    name: 'BSC',
    explorer: 'https://bscscan.com',
    color: 'bg-yellow-500',
  },
  ethereum: {
    name: 'Ethereum',
    explorer: 'https://etherscan.io',
    color: 'bg-purple-500',
  },
  polygon: {
    name: 'Polygon',
    explorer: 'https://polygonscan.com',
    color: 'bg-indigo-500',
  },
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { lang } = useLanguage();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterProgress, setPosterProgress] = useState(0);
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const [showPosterActions, setShowPosterActions] = useState(false);

  if (!transaction) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(lang === 'zh' ? '已复制到剪贴板' : 'Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGeneratePoster = async () => {
    try {
      setIsGeneratingPoster(true);
      const dataUrl = await generateTransactionPoster("transaction-poster-template");
      await downloadTransactionPoster(dataUrl);
      toast.success(lang === "zh" ? "海报已下载" : "Poster downloaded successfully");
    } catch (error) {
      console.error("Error generating poster:", error);
      toast.error(lang === "zh" ? "生成海报失败" : "Failed to generate poster");
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const handleSharePoster = async () => {
    try {
      setIsGeneratingPoster(true);
      const dataUrl = await generateTransactionPoster("transaction-poster-template");
      await shareTransactionPoster(dataUrl);
      toast.success(lang === "zh" ? "海报已分享" : "Poster shared successfully");
    } catch (error) {
      console.error("Error sharing poster:", error);
      toast.error(lang === "zh" ? "分享海报失败" : "Failed to share poster");
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusLabel = () => {
    switch (transaction.status) {
      case 'success':
        return lang === 'zh' ? '成功' : 'Success';
      case 'pending':
        return lang === 'zh' ? '待处理' : 'Pending';
      case 'failed':
        return lang === 'zh' ? '失败' : 'Failed';
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
  };

  const networkConfig = transaction.network
    ? NETWORK_CONFIG[transaction.network]
    : null;
  const explorerUrl = transaction.txHash && networkConfig
    ? `${networkConfig.explorer}/tx/${transaction.txHash}`
    : null;

  const DetailRow: React.FC<{
    label: string;
    value: string;
    icon?: React.ReactNode;
    copyable?: boolean;
    link?: string;
  }> = ({ label, value, icon, copyable, link }) => (
    <div className="flex items-center justify-between py-3 px-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && <div className="text-gray-400 flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-mono text-white truncate">{value}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {copyable && (
          <button
            onClick={() => handleCopy(value, label)}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title={lang === 'zh' ? '复制' : 'Copy'}
          >
            {copiedField === label ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400 hover:text-gray-200" />
            )}
          </button>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title={lang === 'zh' ? '在区块浏览器中查看' : 'View on explorer'}
          >
            <ExternalLink className="w-4 h-4 text-blue-400 hover:text-blue-300" />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl text-cyan-400">
                {lang === 'zh' ? '交易详情' : 'Transaction Details'}
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                {transaction.description}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge className={`${getStatusColor()} border`}>
                {getStatusLabel()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Amount Section */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {lang === 'zh' ? '交易金额' : 'Transaction Amount'}
                </p>
                <p className="text-3xl font-bold text-cyan-400">
                  {parseFloat(transaction.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8,
                  })}
                  {' '}
                  <span className="text-lg text-gray-400">ISC</span>
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-cyan-500 opacity-50" />
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">
              {lang === 'zh' ? '基本信息' : 'Basic Information'}
            </h3>
            <DetailRow
              label={lang === 'zh' ? '交易ID' : 'Transaction ID'}
              value={transaction.id.toString()}
              icon={<Hash className="w-4 h-4" />}
              copyable
            />
            <DetailRow
              label={lang === 'zh' ? '创建时间' : 'Created At'}
              value={new Date(transaction.createdAt).toLocaleString()}
              icon={<Calendar className="w-4 h-4" />}
            />
            {transaction.balance && (
              <DetailRow
                label={lang === 'zh' ? '余额' : 'Balance'}
                value={`${parseFloat(transaction.balance).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })} ISC`}
                icon={<DollarSign className="w-4 h-4" />}
              />
            )}
          </div>

          {/* Blockchain Information */}
          {transaction.txHash && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">
                {lang === 'zh' ? '区块链信息' : 'Blockchain Information'}
              </h3>
              <DetailRow
                label={lang === 'zh' ? '交易哈希' : 'Transaction Hash'}
                value={transaction.txHash}
                icon={<Hash className="w-4 h-4" />}
                copyable
                link={explorerUrl || undefined}
              />
              {transaction.network && (
                <DetailRow
                  label={lang === 'zh' ? '网络' : 'Network'}
                  value={NETWORK_CONFIG[transaction.network]?.name || transaction.network}
                  icon={<MapPin className="w-4 h-4" />}
                />
              )}
              {transaction.blockNumber && (
                <DetailRow
                  label={lang === 'zh' ? '区块号' : 'Block Number'}
                  value={transaction.blockNumber.toString()}
                  icon={<Hash className="w-4 h-4" />}
                  copyable
                />
              )}
              {transaction.confirmations !== undefined && (
                <DetailRow
                  label={lang === 'zh' ? '确认数' : 'Confirmations'}
                  value={`${transaction.confirmations} ${lang === 'zh' ? '个' : ''}`}
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              )}
            </div>
          )}

          {/* Address Information */}
          {(transaction.from || transaction.to) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">
                {lang === 'zh' ? '地址信息' : 'Address Information'}
              </h3>
              {transaction.from && (
                <DetailRow
                  label={lang === 'zh' ? '发送者' : 'From'}
                  value={transaction.from}
                  icon={<MapPin className="w-4 h-4" />}
                  copyable
                />
              )}
              {transaction.to && (
                <DetailRow
                  label={lang === 'zh' ? '接收者' : 'To'}
                  value={transaction.to}
                  icon={<MapPin className="w-4 h-4" />}
                  copyable
                />
              )}
            </div>
          )}

          {/* Fee Information */}
          {transaction.gasFee && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">
                {lang === 'zh' ? '费用信息' : 'Fee Information'}
              </h3>
              <DetailRow
                label={lang === 'zh' ? 'Gas费用' : 'Gas Fee'}
                value={`${parseFloat(transaction.gasFee).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })} ISC`}
                icon={<Zap className="w-4 h-4" />}
              />
            </div>
          )}

          {/* Poster Preview */}
          {showPosterPreview && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <TransactionPosterTemplate transaction={transaction} lang={lang} id="transaction-poster-template" />
            </div>
          )}

          {/* Poster Actions */}
          <div className="flex gap-2 pt-4 border-t border-slate-700 mb-4">
            <Button
              variant="outline"
              onClick={() => setShowPosterPreview(!showPosterPreview)}
              className="flex-1 gap-2 border-slate-600 hover:bg-slate-800"
              disabled={isGeneratingPoster}
            >
              {showPosterPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {lang === 'zh' ? (showPosterPreview ? '隐藏预览' : '预览海报') : (showPosterPreview ? 'Hide Preview' : 'Preview Poster')}
            </Button>
            <PosterShareMenu
              elementId="transaction-poster-template"
              amount={transaction.amount}
              type={transaction.type}
              disabled={isGeneratingPoster}
              onShareStart={() => {
                setIsGeneratingPoster(true);
                setPosterProgress(0);
              }}
              onShareComplete={() => {
                setIsGeneratingPoster(false);
                setPosterProgress(0);
              }}
            />
          </div>

          {/* Loading Animation */}
          <PosterLoadingAnimation isLoading={isGeneratingPoster} progress={posterProgress} />
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-700">
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="outline"
                  className="w-full gap-2 border-slate-600 hover:bg-slate-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  {lang === 'zh' ? '在区块浏览器中查看' : 'View on Explorer'}
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 hover:bg-slate-800"
            >
              {lang === 'zh' ? '关闭' : 'Close'}
            </Button>
          </div>
        </div>
      {/* Hidden Poster Template for Generation */}
      <div style={{ display: "none" }}>
        <TransactionPosterTemplate id="transaction-poster-template" transaction={transaction} lang={lang} />
      </div>
      </DialogContent>
    </Dialog>
  );
};
