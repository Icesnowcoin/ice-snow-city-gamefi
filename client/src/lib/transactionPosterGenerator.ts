import html2canvas from 'html2canvas';

export interface PosterConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  quality?: number;
}

const DEFAULT_CONFIG: PosterConfig = {
  width: 1080,
  height: 1350,
  backgroundColor: '#0f172a',
  quality: 0.95,
};

/**
 * 生成交易凭证海报
 */
export async function generateTransactionPoster(
  elementId: string,
  config: PosterConfig = {}
): Promise<string> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // 创建临时容器用于渲染
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = `${finalConfig.width}px`;
    tempContainer.style.height = `${finalConfig.height}px`;
    tempContainer.style.backgroundColor = finalConfig.backgroundColor || '#0f172a';
    tempContainer.style.padding = '0';
    tempContainer.style.margin = '0';
    tempContainer.style.overflow = 'hidden';

    // 克隆元素到临时容器
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.width = '100%';
    clonedElement.style.height = '100%';
    clonedElement.style.padding = '40px';
    clonedElement.style.boxSizing = 'border-box';
    clonedElement.style.overflow = 'hidden';

    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // 使用 html2canvas 生成图片
    const canvas = await html2canvas(tempContainer, {
      width: finalConfig.width,
      height: finalConfig.height,
      backgroundColor: finalConfig.backgroundColor,
      scale: 2,
      logging: false,
      allowTaint: true,
      useCORS: true,
    });

    // 清理临时元素
    document.body.removeChild(tempContainer);

    // 返回数据 URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating transaction poster:', error);
    throw error;
  }
}

/**
 * 下载海报为图片
 */
export async function downloadTransactionPoster(
  dataUrl: string,
  filename: string = `transaction-${Date.now()}.png`
): Promise<void> {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 分享海报到社交媒体（需要用户手动复制）
 */
export async function shareTransactionPoster(
  dataUrl: string,
  title: string = 'Check out my transaction!'
): Promise<void> {
  // 尝试使用 Web Share API
  if (navigator.share) {
    try {
      // 将 dataUrl 转换为 Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `transaction-${Date.now()}.png`, {
        type: 'image/png',
      });

      await navigator.share({
        title,
        text: 'Check out my transaction on Ice Snow City!',
        files: [file],
      });
    } catch (error) {
      console.error('Error sharing poster:', error);
      // 降级处理：复制到剪贴板
      await copyPosterToClipboard(dataUrl);
    }
  } else {
    // 降级处理：复制到剪贴板
    await copyPosterToClipboard(dataUrl);
  }
}

/**
 * 复制海报到剪贴板
 */
export async function copyPosterToClipboard(dataUrl: string): Promise<void> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // 使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
    } else {
      // 降级处理：复制图片链接
      await navigator.clipboard.writeText(dataUrl);
    }
  } catch (error) {
    console.error('Error copying poster to clipboard:', error);
    throw error;
  }
}

/**
 * 获取海报的 Blob 对象
 */
export async function getPosterBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
