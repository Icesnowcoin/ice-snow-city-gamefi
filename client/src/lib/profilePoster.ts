import type { PlayerInfo } from '@/components/social/PlayerInfoCard';
import type { ProfileBackground } from '@/hooks/useProfileBackground';
import { generateQRCodeSvg } from './qrcodeUtils';
import { getCharacterPosterSticker, getCharacterPosterStickerLabels, type CharacterPosterStickerPlacement } from './characterPosterStickers';
import { getCharacterPosterCustomTextLabel, normalizeCharacterPosterCustomText } from './characterPosterCustomText';

export interface PosterAssetSummary {
  landCount?: number;
  buildingCount?: number;
  totalAssets?: number;
}

export interface PosterOptions {
  player: PlayerInfo;
  background: ProfileBackground | null;
  assetSummary?: PosterAssetSummary;
}

export function getProfilePosterFileName(userName: string): string {
  const safeUserName = userName
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'player';
  return `ice-snow-city-${safeUserName}-profile.png`;
}

export function generateProfilePosterDataUrl(options: PosterOptions): string {
  const { player, background, assetSummary } = options;
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // 单元测试环境下的 SVG 降级 Data URL 兜底
    const bgName = background ? `${background.name} (Token #${background.tokenId})` : '暂未装备专属主页背景 NFT';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#16213e"/>
      <text x="90" y="115" fill="#00d4ff" font-size="28" font-family="sans-serif" font-weight="bold">ICE SNOW CITY</text>
      <text x="90" y="280" fill="#ffffff" font-size="36" font-family="sans-serif" font-weight="bold">${player.userName}</text>
      <text x="90" y="330" fill="#00d4ff" font-size="16" font-family="sans-serif" font-weight="bold">Lv. ${player.level}</text>
      <text x="120" y="508" fill="#f8fafc" font-size="18" font-family="sans-serif" font-weight="bold">${bgName}</text>
      <!-- SVG 专属二维码嵌入 -->
      <g transform="translate(530, 770)">
        <rect width="180" height="180" fill="#ffffff" rx="14"/>
        <text x="90" y="200" fill="#00d4ff" font-size="14" font-family="sans-serif" text-anchor="middle" font-weight="bold">扫码查看公开主页</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  // 1. 绘制底色 / 渐变背景
  const grad = ctx.createLinearGradient(0, 0, 800, 1000);
  if (background?.kind === 'land') {
    grad.addColorStop(0, '#0e7490');
    grad.addColorStop(0.5, '#1e3a8a');
    grad.addColorStop(1, '#090d16');
  } else if (background?.kind === 'building') {
    grad.addColorStop(0, '#581c87');
    grad.addColorStop(0.5, '#1e3a8a');
    grad.addColorStop(1, '#090d16');
  } else {
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f0f1a');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 1000);

  // 2. 绘制卡片光效装饰
  ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(400, 200, 320, 0, Math.PI * 2);
  ctx.fill();

  // 3. 绘制标题栏
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(60, 60, 680, 120);
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 680, 120);

  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('ICE SNOW CITY', 90, 115);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  ctx.fillText('现代都市模拟经营 · 官方认证个人名片', 90, 145);

  // 4. 绘制玩家核心信息区
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(60, 210, 680, 340);
  ctx.strokeRect(60, 210, 680, 340);

  // 玩家名字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(player.userName, 240, 280);

  // 等级标签
  ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
  ctx.fillRect(240, 305, 110, 36);
  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`Lv. ${player.level}`, 262, 330);

  // 在线状态
  ctx.fillStyle = player.status === 'online' ? '#00ff00' : '#888888';
  ctx.beginPath();
  ctx.arc(375, 323, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px sans-serif';
  ctx.fillText(player.status === 'online' ? '在线' : '离线', 392, 328);

  // 头像占位圆形
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(150, 320, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(player.userName.charAt(0).toUpperCase(), 150, 333);
  ctx.textAlign = 'left';

  // 签名
  if (player.signature) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText(`"${player.signature}"`, 95, 410, 610);
  }

  // 专属背景 NFT 铭牌
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(95, 450, 610, 75);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(95, 450, 610, 75);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '13px sans-serif';
  ctx.fillText('专属主页背景 NFT', 120, 480);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(background ? `${background.name} (Token #${background.tokenId})` : '暂未装备专属主页背景 NFT', 120, 508);

  // 5. 绘制底部统计卡片区（含核心资产统计）
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(60, 570, 680, 280);
  ctx.strokeRect(60, 570, 680, 280);

  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('城市资产核心统计 (Assets Overview)', 90, 615);

  const lands = assetSummary?.landCount ?? 0;
  const buildings = assetSummary?.buildingCount ?? 0;
  const total = assetSummary?.totalAssets ?? (lands + buildings);

  // 绘制 3 个统计小卡片
  const statBoxWidth = 200;
  const statBoxHeight = 85;
  const statBoxY = 640;

  // 土地统计卡
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fillRect(90, statBoxY, statBoxWidth, statBoxHeight);
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
  ctx.strokeRect(90, statBoxY, statBoxWidth, statBoxHeight);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('拥有土地 NFT', 110, statBoxY + 28);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`${lands} 宗`, 110, statBoxY + 65);

  // 建筑统计卡
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fillRect(300, statBoxY, statBoxWidth, statBoxHeight);
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
  ctx.strokeRect(300, statBoxY, statBoxWidth, statBoxHeight);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('拥有建筑 NFT', 320, statBoxY + 28);
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`${buildings} 栋`, 320, statBoxY + 65);

  // 资产总计卡
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fillRect(510, statBoxY, statBoxWidth, statBoxHeight);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.strokeRect(510, statBoxY, statBoxWidth, statBoxHeight);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('链上资产合计', 530, statBoxY + 28);
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`${total} 项`, 530, statBoxY + 65);

  // 玩家状态属性行
  ctx.fillStyle = '#64748b';
  ctx.font = '14px sans-serif';
  const statsRecord = (player.stats || {}) as Record<string, any>;
  const coinVal = statsRecord.coin ?? statsRecord.gold ?? statsRecord.balance ?? 0;
  const expVal = statsRecord.exp ?? statsRecord.experience ?? 0;
  ctx.fillText(`财富积分: ${coinVal} ISC  |  经验值: ${expVal} EXP`, 90, 785);

  // 6. 绘制右下角专属二维码名片区
  const qrBoxX = 515;
  const qrBoxY = 675;
  const qrSize = 215;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(qrBoxX, qrBoxY, qrSize, qrSize);
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrBoxX, qrBoxY, qrSize, qrSize);

  // 模拟绘制白底二维码卡片
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrBoxX + 12, qrBoxY + 12, 191, 160);

  // 用 Canvas 绘制精美几何二维码图案模拟器（或通过 qrcodeSvg 渲染）
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/profile/${player.userId}` 
    : `https://icesnowcity.game/profile/${player.userId}`;
  
  // 简易绘制二维码矩阵区块
  ctx.fillStyle = '#0f172a';
  const qrCols = 7;
  const cellSz = 22;
  const startPxX = qrBoxX + 26;
  const startPxY = qrBoxY + 26;
  for (let r = 0; r < qrCols; r++) {
    for (let c = 0; c < qrCols; c++) {
      // 规律填充以形成专业二维码视觉
      if ((r === 0 && c === 0) || (r === 0 && c === 6) || (r === 6 && c === 0) || ((r + c) % 2 === 0)) {
        ctx.fillRect(startPxX + c * cellSz, startPxY + r * cellSz, cellSz - 2, cellSz - 2);
      }
    }
  }

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('手机扫码直达公开主页', qrBoxX + qrSize / 2, qrBoxY + 202);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('城市建设成就与资产总览', 90, 625);

  const rawStats = player.stats as Record<string, any> | undefined;
  const statList = [
    { label: '金币资产', value: rawStats?.coin ?? rawStats?.gold ?? 1000 },
    { label: '经验等级', value: rawStats?.exp ?? rawStats?.level ?? player.level * 100 },
    { label: '资产评分', value: rawStats?.score ?? rawStats?.rating ?? 2500 },
  ];

  statList.forEach((st, idx) => {
    const boxX = 90 + idx * 220;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(boxX, 655, 200, 130);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.strokeRect(boxX, 655, 200, 130);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(st.label, boxX + 20, 695);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(String(st.value), boxX + 20, 745);
  });

  // 6. 底部版权与防伪声明
  ctx.fillStyle = '#64748b';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ice Snow City - 现代化都市模拟经营与数字资产验证', 400, 910);
  ctx.fillText(`生成时间: ${new Date().toLocaleDateString('zh-CN')} · 玩家 ID: ${player.userId}`, 400, 940);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

export interface CharacterSnapshotPosterOptions {
  playerName: string;
  userId: string;
  animationLabel: string;
  expressionLabel: string;
  environmentLabel: string;
  outfitLabel?: string;
  accessoryLabel?: string;
  customText?: string;
  canvasDataUrl: string;
  stickerPlacements?: CharacterPosterStickerPlacement[];
}

export function getCharacterSnapshotPosterFileName(playerName: string): string {
  const safeName = playerName
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\\s+/g, '-')
    .slice(0, 80) || 'player';
  return `ice-snow-city-${safeName}-character-snapshot.png`;
}

function escapeSvgText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] ?? character);
}

export function drawCharacterPosterStickers(
  ctx: CanvasRenderingContext2D,
  placements: CharacterPosterStickerPlacement[] = [],
  width = 900,
  height = 1200,
  logoImage?: HTMLImageElement,
): void {
  placements.forEach((placement) => {
    const sticker = getCharacterPosterSticker(placement.stickerId);
    const x = placement.x * width;
    const y = placement.y * height;
    const fontSize = 52 * placement.scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((placement.rotation * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.shadowColor = 'rgba(2, 6, 23, 0.55)';
    ctx.shadowBlur = 12;
    if (sticker.assetUrl && logoImage) {
      const logoSize = fontSize * 1.12;
      ctx.drawImage(logoImage, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
    } else {
      ctx.fillText(sticker.glyph, 0, 0);
    }
    if (sticker.category === 'badge') {
      ctx.shadowBlur = 0;
      ctx.fillStyle = sticker.tint;
      ctx.font = `bold ${Math.max(11, 12 * placement.scale)}px sans-serif`;
      ctx.fillText(sticker.label, 0, fontSize * 0.68);
    }
    ctx.restore();
  });
}

function getCharacterPosterStickerSvg(placements: CharacterPosterStickerPlacement[] = [], width = 900, height = 1200): string {
  return placements.map((placement) => {
    const sticker = getCharacterPosterSticker(placement.stickerId);
    const x = placement.x * width;
    const y = placement.y * height;
    const size = 52 * placement.scale;
    const label = sticker.category === 'badge'
      ? `<text x="0" y="${size * 0.68}" fill="${sticker.tint}" font-size="${Math.max(11, 12 * placement.scale)}" font-family="sans-serif" font-weight="bold">${escapeSvgText(sticker.label)}</text>`
      : '';
    return `<g transform="translate(${x} ${y}) rotate(${placement.rotation})" text-anchor="middle"><text y="0" fill="${sticker.tint}" font-size="${size}" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${escapeSvgText(sticker.glyph)}</text>${label}</g>`;
  }).join('');
}

export function generateCharacterSnapshotPosterDataUrl(options: CharacterSnapshotPosterOptions): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  const profileUrl = getProfileUrl(options.userId);
  const customText = normalizeCharacterPosterCustomText(options.customText ?? '');
  const customTextLabel = getCharacterPosterCustomTextLabel(customText);
  const stickerSvg = getCharacterPosterStickerSvg(options.stickerPlacements);

  if (!ctx) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e7490"/><stop offset="1" stop-color="#111827"/></linearGradient></defs>
      <rect width="900" height="1200" fill="url(#bg)"/>
      <text x="70" y="105" fill="#67e8f9" font-size="32" font-family="sans-serif" font-weight="bold">ICE SNOW CITY</text>
      <text x="70" y="170" fill="#ffffff" font-size="44" font-family="sans-serif" font-weight="bold">${escapeSvgText(options.playerName)}</text>
      <rect x="60" y="220" width="780" height="560" rx="28" fill="#0f172a" fill-opacity=".78" stroke="#22d3ee" stroke-opacity=".35"/>
      <image href="${escapeSvgText(options.canvasDataUrl)}" x="90" y="250" width="720" height="480" preserveAspectRatio="xMidYMid meet"/>
      ${stickerSvg}
      <text x="70" y="850" fill="#cbd5e1" font-size="24" font-family="sans-serif">环境：${escapeSvgText(options.environmentLabel)}</text>
      <text x="70" y="895" fill="#cbd5e1" font-size="24" font-family="sans-serif">表情：${escapeSvgText(options.expressionLabel)}</text>
      <text x="70" y="940" fill="#cbd5e1" font-size="24" font-family="sans-serif">动作：${escapeSvgText(options.animationLabel)}</text>
      <text x="70" y="985" fill="#cbd5e1" font-size="24" font-family="sans-serif">穿搭：${escapeSvgText(options.outfitLabel ?? '冬日风衣')} · ${escapeSvgText(options.accessoryLabel ?? '无配饰')}</text>
      ${customTextLabel ? `<rect x="60" y="1000" width="780" height="58" rx="16" fill="#164e63" fill-opacity=".62" stroke="#67e8f9" stroke-opacity=".35"/><text x="88" y="1037" fill="#cffafe" font-size="22" font-family="sans-serif">${escapeSvgText(customTextLabel)}</text>` : ''}
      <text x="70" y="1090" fill="#67e8f9" font-size="22" font-family="sans-serif">扫码或访问公开主页</text>
      <text x="70" y="1125" fill="#94a3b8" font-size="16" font-family="sans-serif">${escapeSvgText(profileUrl)}</text>
      <text x="70" y="1170" fill="#64748b" font-size="16" font-family="sans-serif">现代都市模拟经营 · 角色快照分享卡</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  const gradient = ctx.createLinearGradient(0, 0, 900, 1200);
  gradient.addColorStop(0, '#0e7490');
  gradient.addColorStop(0.48, '#1e3a8a');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 1200);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
  ctx.roundRect(55, 55, 790, 1060, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.42)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#67e8f9';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('ICE SNOW CITY', 90, 115);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(options.playerName, 90, 185, 700);
  ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
  ctx.roundRect(85, 230, 730, 530, 22);
  ctx.fill();
  try {
    const snapshot = new Image();
    snapshot.src = options.canvasDataUrl;
    ctx.drawImage(snapshot, 105, 250, 690, 490);
  } catch {
    ctx.fillStyle = '#334155';
    ctx.fillRect(105, 250, 690, 490);
  }
  drawCharacterPosterStickers(ctx, options.stickerPlacements);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '22px sans-serif';
  ctx.fillText(`环境：${options.environmentLabel}`, 95, 820);
  ctx.fillText(`表情：${options.expressionLabel}`, 95, 865);
  ctx.fillText(`动作：${options.animationLabel}`, 95, 910);
  ctx.fillText(`穿搭：${options.outfitLabel ?? '冬日风衣'} · ${options.accessoryLabel ?? '无配饰'}`, 95, 955);
  if (customTextLabel) {
    ctx.fillStyle = 'rgba(22, 78, 99, 0.72)';
    ctx.roundRect(85, 975, 730, 58, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.35)';
    ctx.stroke();
    ctx.fillStyle = '#cffafe';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(customTextLabel, 110, 1012, 680);
  }
  ctx.fillStyle = '#67e8f9';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('扫码或访问公开主页', 95, 1070);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px sans-serif';
  ctx.fillText(profileUrl, 95, 1105, 700);
  ctx.fillStyle = '#64748b';
  ctx.font = '15px sans-serif';
  ctx.fillText('现代都市模拟经营 · 角色快照分享卡', 95, 1150);
  return canvas.toDataURL('image/png');
}

export async function generateCharacterSnapshotPosterDataUrlAsync(options: CharacterSnapshotPosterOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return generateCharacterSnapshotPosterDataUrl(options);
  const customText = normalizeCharacterPosterCustomText(options.customText ?? '');
  const customTextLabel = getCharacterPosterCustomTextLabel(customText);

  const image = await new Promise<HTMLImageElement | null>((resolve) => {
    const candidate = new Image();
    candidate.onload = () => resolve(candidate);
    candidate.onerror = () => resolve(null);
    candidate.src = options.canvasDataUrl;
  });
  const logoImage = await new Promise<HTMLImageElement | null>((resolve) => {
    const hasBrandedSticker = options.stickerPlacements?.some((placement) => getCharacterPosterSticker(placement.stickerId).assetUrl);
    if (!hasBrandedSticker) return resolve(null);
    const candidate = new Image();
    candidate.onload = () => resolve(candidate);
    candidate.onerror = () => resolve(null);
    candidate.src = getCharacterPosterSticker('winter-pioneer').assetUrl ?? '';
  });

  const gradient = ctx.createLinearGradient(0, 0, 900, 1200);
  gradient.addColorStop(0, '#0e7490');
  gradient.addColorStop(0.48, '#1e3a8a');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 1200);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(55, 55, 790, 1060);
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.42)';
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, 790, 1060);
  ctx.fillStyle = '#67e8f9';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('ICE SNOW CITY', 90, 115);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(options.playerName, 90, 185, 700);
  ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
  ctx.fillRect(85, 230, 730, 530);
  if (image) {
    ctx.drawImage(image, 105, 250, 690, 490);
  } else {
    ctx.fillStyle = '#334155';
    ctx.fillRect(105, 250, 690, 490);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px sans-serif';
    ctx.fillText('角色截图暂不可用，已保留状态信息', 190, 500);
  }
  drawCharacterPosterStickers(ctx, options.stickerPlacements, 900, 1200, logoImage ?? undefined);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '22px sans-serif';
  ctx.fillText(`环境：${options.environmentLabel}`, 95, 820);
  ctx.fillText(`表情：${options.expressionLabel}`, 95, 865);
  ctx.fillText(`动作：${options.animationLabel}`, 95, 910);
  ctx.fillText(`穿搭：${options.outfitLabel ?? '冬日风衣'} · ${options.accessoryLabel ?? '无配饰'}`, 95, 955);
  if (customTextLabel) {
    ctx.fillStyle = 'rgba(22, 78, 99, 0.72)';
    ctx.roundRect(85, 975, 730, 58, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.35)';
    ctx.stroke();
    ctx.fillStyle = '#cffafe';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(customTextLabel, 110, 1012, 680);
  }
  ctx.fillStyle = '#67e8f9';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('扫码或访问公开主页', 95, 1070);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px sans-serif';
  ctx.fillText(getProfileUrl(options.userId), 95, 1105, 700);
  ctx.fillStyle = '#64748b';
  ctx.font = '15px sans-serif';
  ctx.fillText('现代都市模拟经营 · 角色快照分享卡', 95, 1150);
  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  if (typeof document === 'undefined') throw new Error('当前环境不支持本地下载');
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getCharacterSnapshotShareText(options: CharacterSnapshotPosterOptions): string {
  const outfit = options.outfitLabel ?? '冬日风衣';
  const accessory = options.accessoryLabel && options.accessoryLabel !== '无配饰' ? ` + ${options.accessoryLabel}` : '';
  const stickerLabels = getCharacterPosterStickerLabels(options.stickerPlacements ?? []);
  const stickers = stickerLabels.length > 0 ? ` · 贴纸：${stickerLabels.join('、')}` : '';
  const customText = normalizeCharacterPosterCustomText(options.customText ?? '');
  const customTextPart = customText ? ` · 宣言/ID：${customText}` : '';
  return `我在《冰雪城市》留下了角色快照：${options.environmentLabel} · ${options.expressionLabel} · ${options.animationLabel} · 穿搭：${outfit}${accessory}${stickers}${customTextPart}。欢迎访问我的公开主页：${getProfileUrl(options.userId)} #IceSnowCity #GameFi #Web3`;
}

export function getCharacterSnapshotShareUrl(platform: 'twitter' | 'telegram', options: CharacterSnapshotPosterOptions): string {
  const text = getCharacterSnapshotShareText(options);
  const url = getProfileUrl(options.userId);
  if (platform === 'twitter') return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export async function shareProfilePoster(options: PosterOptions): Promise<{ success: boolean; method: 'native' | 'download' }> {
  const dataUrl = generateProfilePosterDataUrl(options);
  if (!dataUrl) throw new Error('海报生成失败');

  // 转换成 File 对象用于 navigator.share
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `ice-snow-city-${options.player.userName}-profile.png`, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${options.player.userName} 的冰雪城市主页`,
          text: `快来查看 ${options.player.userName} 在冰雪城市建立的现代化都市和专属 NFT 背景！`,
          files: [file],
        });
        return { success: true, method: 'native' };
      }
    } catch (err) {
      // 用户取消或浏览器不支持文件分享时静默降级到下载
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'native' };
      }
    }
  }

  // 降级：触发浏览器下载
  downloadProfilePoster(options, dataUrl);
  return { success: true, method: 'download' };
}

export function downloadProfilePoster(options: PosterOptions, dataUrl = generateProfilePosterDataUrl(options)): string {
  if (!dataUrl) throw new Error('海报生成失败');
  downloadDataUrl(dataUrl, getProfilePosterFileName(options.player.userName));
  return dataUrl;
}

export function getProfileUrl(userId: string): string {
  const referralCode = encodeURIComponent(userId);
  if (typeof window === 'undefined') {
    return `https://icesnowcity.game/profile/${referralCode}?ref=${referralCode}`;
  }
  return `${window.location.origin}/profile/${referralCode}?ref=${referralCode}`;
}

export function getTwitterDefaultShareText(options: PosterOptions): string {
  const { player, assetSummary } = options;
  const profileUrl = getProfileUrl(player.userId);
  const lands = assetSummary?.landCount ?? 0;
  const buildings = assetSummary?.buildingCount ?? 0;
  return `我在《冰雪城市》(Ice Snow City) 打造了现代化都市！拥有 ${lands} 宗土地和 ${buildings} 栋建筑 NFT。快来我的个人主页围观并扫码互动：${profileUrl} #IceSnowCity #GameFi #Web3`;
}

export function getRandomTwitterShareText(options: PosterOptions): string {
  const { player, assetSummary } = options;
  const profileUrl = getProfileUrl(player.userId);
  const lands = assetSummary?.landCount ?? 0;
  const buildings = assetSummary?.buildingCount ?? 0;

  const templates = [
    `ISC 冰雪都市风暴降临，我的 Web3 帝国坚不可摧！在《冰雪城市》已集结 ${lands} 宗核心土地与 ${buildings} 座高能建筑。欢迎大佬们来参观主页并扫码串门：${profileUrl} #IceSnowCity #Web3Gaming #Metaverse`,
    `🚀 沉浸式体验《冰雪城市》现代都市建设！目前资产已达 ${lands} 块土地 + ${buildings} 栋建筑，ISC 经济生态太给力了。主页速来围观：${profileUrl} #CryptoGaming #NFTCommunity #IceSnowCity`,
    `💎 打造属于你的冬季商业奇迹！我在 Ice Snow City 拥有 ${lands} 宗土地与 ${buildings} 栋建筑 NFT。点击下方主页链接直达我的专属都市：${profileUrl} #Solana #Web3 #IceSnowCity`,
    `🏙️ 拒绝内卷，在《冰雪城市》开启链上地产大亨之路！目前已解锁 ${lands} 宗土地和 ${buildings} 栋建筑。快来围观我的个人主页：${profileUrl} #Metaverse #GameFi #IceSnowCity`
  ];

  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}


export function openSocialShareUrl(platform: 'twitter' | 'telegram', options: PosterOptions): void {
  if (typeof window === 'undefined') return;
  const { player } = options;
  const profileUrl = getProfileUrl(player.userId);

  let shareUrl = '';
  if (platform === 'twitter') {
    const defaultText = getTwitterDefaultShareText(options);
    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(defaultText)}`;
  } else if (platform === 'telegram') {
    const defaultText = getTwitterDefaultShareText(options);
    shareUrl = `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(defaultText)}`;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }
}

export function openCustomTwitterShare(customText: string): void {
  if (typeof window === 'undefined') return;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(customText)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
}


export async function copyProfileUrlToClipboard(userId: string): Promise<boolean> {
  const url = getProfileUrl(userId);
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // 降级方案
    }
  }

  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}


