import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShareStatistics } from '@/hooks/useShareStatistics';
import { ShareSuccessFeedback, CompactShareSuccess } from './ShareSuccessFeedback';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  Twitter, 
  Send, 
  Copy, 
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generateAndShare,
  getPlatformShareText,
} from '@/lib/enhancedPosterGenerator';

interface PosterShareMenuProps {
  elementId: string;
  amount?: string;
  type?: string;
  disabled?: boolean;
  onShareStart?: () => void;
  onShareComplete?: () => void;
}

export const PosterShareMenu: React.FC<PosterShareMenuProps> = ({
  elementId,
  amount = '0',
  type = 'transaction',
  disabled = false,
  onShareStart,
  onShareComplete,
}) => {
  const { lang } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [successPlatform, setSuccessPlatform] = useState<string | null>(null);
  const [showFullscreenFeedback, setShowFullscreenFeedback] = useState(false);
  const { recordShare } = useShareStatistics();

  const handleShare = async (platform: 'twitter' | 'telegram' | 'clipboard' | 'download') => {
    try {
      setIsLoading(true);
      setLoadingPlatform(platform);
      onShareStart?.();

      const shareText = getPlatformShareText(
        platform as 'twitter' | 'telegram',
        amount,
        type
      );

      await generateAndShare(elementId, platform, {
        title: shareText.title,
        text: shareText.text,
        hashtags: shareText.hashtags,
      });

      // Record share statistics
      try {
        await recordShare({
          platform,
          transactionType: type,
          amount: amount,
        });
      } catch (statsError) {
        console.warn('Failed to record share statistics:', statsError);
        // Don't fail the share operation if stats recording fails
      }

      // Show success feedback
      setSuccessPlatform(platform);
      setShowFullscreenFeedback(true);

      const messages = {
        twitter: lang === 'zh' ? '已打开 Twitter 分享' : 'Opened Twitter share',
        telegram: lang === 'zh' ? '已打开 Telegram 分享' : 'Opened Telegram share',
        clipboard: lang === 'zh' ? '已复制到剪贴板' : 'Copied to clipboard',
        download: lang === 'zh' ? '海报已下载' : 'Poster downloaded',
      };

      // Enhanced toast with custom styling
      toast.success(messages[platform], {
        description: lang === 'zh' ? '分享记录已保存' : 'Share recorded',
        duration: 3000,
        className: 'bg-gradient-to-r from-green-900/20 to-green-900/10 border-green-500/30',
      });

      onShareComplete?.();

      // Auto-hide success feedback after animation
      setTimeout(() => {
        setShowFullscreenFeedback(false);
        setSuccessPlatform(null);
      }, 2500);
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      const errorMessages = {
        twitter: lang === 'zh' ? 'Twitter 分享失败' : 'Failed to share to Twitter',
        telegram: lang === 'zh' ? 'Telegram 分享失败' : 'Failed to share to Telegram',
        clipboard: lang === 'zh' ? '复制失败' : 'Failed to copy',
        download: lang === 'zh' ? '下载失败' : 'Failed to download',
      };
      toast.error(errorMessages[platform], {
        description: lang === 'zh' ? '请稍后重试' : 'Please try again',
        duration: 3000,
        className: 'bg-gradient-to-r from-red-900/20 to-red-900/10 border-red-500/30',
      });
    } finally {
      setIsLoading(false);
      setLoadingPlatform(null);
    }
  };

  return (
    <>
      {/* Fullscreen success feedback */}
      {successPlatform && (
        <ShareSuccessFeedback
          platform={successPlatform as 'twitter' | 'telegram' | 'clipboard' | 'download'}
          isVisible={showFullscreenFeedback}
          onComplete={() => setShowFullscreenFeedback(false)}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isLoading}
            className="gap-2 border-slate-600 hover:bg-slate-800 transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {lang === 'zh' ? '分享' : 'Share'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
          {/* Twitter */}
          <DropdownMenuItem
            onClick={() => handleShare('twitter')}
            disabled={isLoading}
            className="gap-2 cursor-pointer hover:bg-slate-700 relative group"
          >
            {loadingPlatform === 'twitter' ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <Twitter className="w-4 h-4 text-blue-400" />
            )}
            <span>{lang === 'zh' ? '分享到 Twitter' : 'Share to Twitter'}</span>
            {successPlatform === 'twitter' && !isLoading && (
              <CompactShareSuccess platform="twitter" isVisible={true} />
            )}
          </DropdownMenuItem>

          {/* Telegram */}
          <DropdownMenuItem
            onClick={() => handleShare('telegram')}
            disabled={isLoading}
            className="gap-2 cursor-pointer hover:bg-slate-700 relative group"
          >
            {loadingPlatform === 'telegram' ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Send className="w-4 h-4 text-cyan-400" />
            )}
            <span>{lang === 'zh' ? '分享到 Telegram' : 'Share to Telegram'}</span>
            {successPlatform === 'telegram' && !isLoading && (
              <CompactShareSuccess platform="telegram" isVisible={true} />
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-700" />

          {/* Copy to Clipboard */}
          <DropdownMenuItem
            onClick={() => handleShare('clipboard')}
            disabled={isLoading}
            className="gap-2 cursor-pointer hover:bg-slate-700 relative group"
          >
            {loadingPlatform === 'clipboard' ? (
              <Loader2 className="w-4 h-4 animate-spin text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-green-400" />
            )}
            <span>{lang === 'zh' ? '复制到剪贴板' : 'Copy to Clipboard'}</span>
            {successPlatform === 'clipboard' && !isLoading && (
              <CompactShareSuccess platform="clipboard" isVisible={true} />
            )}
          </DropdownMenuItem>

          {/* Download */}
          <DropdownMenuItem
            onClick={() => handleShare('download')}
            disabled={isLoading}
            className="gap-2 cursor-pointer hover:bg-slate-700 relative group"
          >
            {loadingPlatform === 'download' ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <Download className="w-4 h-4 text-purple-400" />
            )}
            <span>{lang === 'zh' ? '下载海报' : 'Download Poster'}</span>
            {successPlatform === 'download' && !isLoading && (
              <CompactShareSuccess platform="download" isVisible={true} />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
