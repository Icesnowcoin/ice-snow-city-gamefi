import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export interface PosterShareOptions {
  title?: string;
  text?: string;
  url?: string;
  hashtags?: string[];
}

export interface PosterGenerationOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  scale?: number;
  onProgress?: (progress: number) => void;
}

/**
 * 生成海报并返回 Blob 对象
 */
export async function generatePosterBlob(
  elementId: string,
  options: PosterGenerationOptions = {}
): Promise<Blob> {
  const {
    width = 1080,
    height = 1350,
    backgroundColor = '#0f172a',
    scale = 2,
    onProgress,
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // 模拟进度
  onProgress?.(10);

  try {
    const canvas = await html2canvas(element, {
      width,
      height,
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    onProgress?.(80);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.(100);
            resolve(blob);
          } else {
            reject(new Error('Failed to generate poster blob'));
          }
        },
        'image/png',
        0.95
      );
    });
  } catch (error) {
    console.error('Error generating poster:', error);
    throw error;
  }
}

/**
 * 下载海报为 PNG 文件
 */
export async function downloadPoster(
  blob: Blob,
  filename: string = 'transaction-receipt.png'
): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 分享到 Twitter
 */
export async function shareToTwitter(
  blob: Blob,
  options: PosterShareOptions = {}
): Promise<void> {
  const {
    title = 'Check out my transaction receipt!',
    text = 'I just completed a transaction on Ice Snow City',
    hashtags = ['IceSnowCity', 'Crypto', 'Web3'],
  } = options;

  const hashtag = hashtags.map((tag) => `#${tag}`).join(' ');
  const tweetText = `${text} ${hashtag}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  window.open(twitterUrl, '_blank', 'width=550,height=420');

  // 如果支持 Web Share API，尝试分享图片
  if (navigator.share && navigator.canShare) {
    try {
      const files = [
        new File([blob], 'transaction-receipt.png', { type: 'image/png' }),
      ];
      if (navigator.canShare({ files })) {
        await navigator.share({
          title,
          text: tweetText,
          files,
        });
      }
    } catch (error) {
      console.error('Error sharing to Twitter:', error);
    }
  }
}

/**
 * 分享到 Telegram
 */
export async function shareToTelegram(
  blob: Blob,
  options: PosterShareOptions = {}
): Promise<void> {
  const {
    title = 'Transaction Receipt',
    text = 'Check out my transaction receipt from Ice Snow City!',
    url = window.location.href,
  } = options;

  const message = `${title}\n\n${text}\n\n${url}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;

  window.open(telegramUrl, '_blank', 'width=550,height=420');

  // 尝试通过 Web Share API 分享
  if (navigator.share && navigator.canShare) {
    try {
      const files = [
        new File([blob], 'transaction-receipt.png', { type: 'image/png' }),
      ];
      if (navigator.canShare({ files })) {
        await navigator.share({
          title,
          text: message,
          files,
        });
      }
    } catch (error) {
      console.error('Error sharing to Telegram:', error);
    }
  }
}

/**
 * 复制海报到剪贴板
 */
export async function copyPosterToClipboard(blob: Blob): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.write) {
      const data = [
        new ClipboardItem({
          'image/png': blob,
        }),
      ];
      await navigator.clipboard.write(data);
    } else {
      throw new Error('Clipboard API not supported');
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
}

/**
 * 生成海报并分享到指定平台
 */
export async function generateAndShare(
  elementId: string,
  platform: 'twitter' | 'telegram' | 'clipboard' | 'download',
  options: PosterGenerationOptions & PosterShareOptions = {}
): Promise<void> {
  try {
    const blob = await generatePosterBlob(elementId, options);

    switch (platform) {
      case 'twitter':
        await shareToTwitter(blob, options);
        break;
      case 'telegram':
        await shareToTelegram(blob, options);
        break;
      case 'clipboard':
        await copyPosterToClipboard(blob);
        break;
      case 'download':
        await downloadPoster(blob);
        break;
    }
  } catch (error) {
    console.error(`Error sharing to ${platform}:`, error);
    throw error;
  }
}

/**
 * 获取平台特定的分享文本
 */
export function getPlatformShareText(
  platform: 'twitter' | 'telegram',
  amount: string,
  type: string
): { title: string; text: string; hashtags?: string[] } {
  const baseText = `I just completed a ${type} transaction for ${amount} ISC on Ice Snow City`;

  if (platform === 'twitter') {
    return {
      title: 'Check out my transaction receipt!',
      text: baseText,
      hashtags: ['IceSnowCity', 'Crypto', 'Web3', 'DeFi'],
    };
  } else {
    return {
      title: 'Transaction Receipt',
      text: baseText,
    };
  }
}
