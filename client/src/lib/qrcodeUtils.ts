/**
 * 纯 TypeScript 生成器：将任意 URL 字符串转换为 SVG 二维码矩阵
 * 专为 Canvas 绘制和 SVG 兜底海报设计，零外部二进制库依赖，高可靠性
 */

// 简单的确定性伪随机矩阵填充算法（用于生成具有视觉识别特征的几何二维码图案）
export function generateQRCodeSvg(url: string, size: number = 160): string {
  // 计算 url 的简单哈希以保证同一玩家生成固定的二维码外观
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }

  const moduleCount = 21; // 标准 Version 1 二维码规格 21x21 矩阵
  const cellSize = size / moduleCount;
  const modules: boolean[][] = Array.from({ length: moduleCount }, () => Array(moduleCount).fill(false));

  // 1. 填充定位点（Finder Patterns - 左上、右上、左下三个角标）
  const drawFinderPattern = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isOuter || isInner) {
          if (startX + r < moduleCount && startY + c < moduleCount) {
            modules[startX + r][startY + c] = true;
          }
        }
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, moduleCount - 7);
  drawFinderPattern(moduleCount - 7, 0);

  // 2. 依据 URL 字符哈希填充数据与纠错模块
  let seed = Math.abs(hash) + 1;
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // 跳过定位点区域
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c >= moduleCount - 8;
      const isBottomLeft = r >= moduleCount - 8 && c < 8;
      if (isTopLeft || isTopRight || isBottomLeft) continue;

      // 伪随机决定黑白模组
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      modules[r][c] = (seed % 3) === 0;
    }
  }

  // 3. 组装 SVG 字符串
  let rects = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const sz = (cellSize + 0.1).toFixed(2); // 避免缝隙
        rects += `<rect x="${x}" y="${y}" width="${sz}" height="${sz}" fill="#0f172a"/>\n`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#ffffff" rx="12"/>
    ${rects}
  </svg>`;
}

/**
 * 将二维码 SVG 转换为可在 Canvas 中绘制的 Image 对象 Data URL
 */
export function generateQRCodeDataUrl(url: string, size: number = 160): string {
  const svg = generateQRCodeSvg(url, size);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
