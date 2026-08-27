/**
 * Outfit Share Card Component
 * Generates beautiful shareable outfit cards with character image and equipment list
 */

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, QrCode } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

interface EquippedItem {
  id: number;
  name: string;
  category: string;
  rarity: string;
  price: number;
  imageUrl?: string;
}

interface OutfitShareCardProps {
  characterName: string;
  characterImage: string;
  equippedItems: Record<string, EquippedItem | undefined>;
  totalValue: number;
  onShare?: (imageUrl: string) => void;
}

const getRarityColor = (rarity: string) => {
  const colors: Record<string, string> = {
    common: 'bg-slate-400',
    uncommon: 'bg-green-400',
    rare: 'bg-blue-400',
    epic: 'bg-purple-400',
    legendary: 'bg-yellow-400',
  };
  return colors[rarity.toLowerCase()] || 'bg-slate-400';
};

const getRarityTextColor = (rarity: string) => {
  const colors: Record<string, string> = {
    common: 'text-slate-600',
    uncommon: 'text-green-600',
    rare: 'text-blue-600',
    epic: 'text-purple-600',
    legendary: 'text-yellow-600',
  };
  return colors[rarity.toLowerCase()] || 'text-slate-600';
};

export const OutfitShareCard: React.FC<OutfitShareCardProps> = ({
  characterName,
  characterImage,
  equippedItems,
  totalValue,
  onShare,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);

  const equippedList = Object.entries(equippedItems)
    .filter(([_, item]) => item !== undefined)
    .map(([category, item]) => ({
      category,
      ...item,
    }));

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
      } as any);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${characterName}-outfit-${Date.now()}.png`;
      link.click();

      // Also generate blob URL for sharing
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          setShareUrl(blobUrl);
          onShare?.(blobUrl);
        }
      });
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyShareLink = async () => {
    const shareLink = `${window.location.origin}/outfit/${characterName}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareLink);
        alert('分享链接已复制到剪贴板！');
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShareToSocial = (platform: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareLink = `${origin}/outfit/${characterName}`;
    const message = `查看我在 Ice Snow City 的装扮：${characterName}`;

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + shareLink)}`,
    };

    if (urls[platform] && typeof window !== 'undefined') {
      window.open(urls[platform], '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Share Card Preview */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 border border-cyan-500/20"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">
            {characterName}
          </h2>
          <p className="text-slate-400 text-sm">Ice Snow City 装扮分享</p>
        </div>

        {/* Character Image */}
        <div className="flex justify-center mb-8">
          <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-cyan-400/30 bg-slate-800 flex items-center justify-center">
            {characterImage ? (
              <img
                src={characterImage}
                alt={characterName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-slate-500 text-center">
                <p>角色形象</p>
              </div>
            )}
          </div>
        </div>

        {/* Equipment List */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">装备列表</h3>
          <div className="grid grid-cols-2 gap-3">
            {equippedList.map((item) => (
              <div
                key={`${item.category}-${item.id}`}
                className="bg-slate-700/50 rounded-lg p-3 border border-slate-600"
              >
            <p className="text-xs text-slate-400 mb-1">{item.category}</p>
            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${getRarityColor(
                  item.rarity || 'common'
                )} ${getRarityTextColor(item.rarity || 'common')}`}
              >
                {item.rarity || 'common'}
              </span>
              <span className="text-xs text-cyan-400">¥{item.price || 0}</span>
            </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-lg p-4 border border-cyan-400/30 mb-6">
          <p className="text-slate-300 text-sm mb-1">总价值</p>
          <p className="text-2xl font-bold text-cyan-400">¥{totalValue.toLocaleString()}</p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            生成于 {new Date().toLocaleDateString('zh-CN')}
          </p>
          <p className="text-xs text-slate-600 mt-2">www.icesnowcity.com</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Download Button */}
        <Button
          onClick={handleDownloadImage}
          disabled={isGenerating}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          {isGenerating ? '生成中...' : '保存为图片'}
        </Button>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleCopyShareLink}
            variant="outline"
            className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            复制链接
          </Button>

          <Button
            onClick={() => setShowQR(!showQR)}
            variant="outline"
            className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
          >
            <QrCode className="w-4 h-4 mr-2" />
            二维码
          </Button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'X', platform: 'twitter', emoji: '𝕏' },
            { name: 'FB', platform: 'facebook', emoji: 'f' },
            { name: 'TG', platform: 'telegram', emoji: '✈️' },
            { name: 'WA', platform: 'whatsapp', emoji: '💬' },
          ].map((social) => (
            <Button
              key={social.platform}
              onClick={() => handleShareToSocial(social.platform)}
              variant="outline"
              className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white text-sm"
            >
              {social.emoji}
            </Button>
          ))}
        </div>
      </div>

      {/* QR Code Section */}
      {showQR && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">分享二维码</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? `${window.location.origin}/outfit/${characterName}` : 'loading'}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-slate-400 text-xs text-center">
              分享链接：{typeof window !== 'undefined' ? `${window.location.origin}/outfit/${characterName}` : 'loading...'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Share Tips */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">分享提示</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-300 text-sm space-y-2">
          <p>• 下载图片分享到社交媒体获得更多关注</p>
          <p>• 复制链接分享给好友查看你的装扮</p>
          <p>• 使用二维码快速分享到手机</p>
          <p>• 精美的装扮可能被推荐到排行榜</p>
        </CardContent>
      </Card>
    </div>
  );
};
