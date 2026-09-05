/**
 * 玩家信息卡片组件
 * 显示玩家详细信息、操作按钮等
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, MessageCircle, UserPlus, UserCheck, Loader, CheckCircle, Share2, Download, Copy } from 'lucide-react';
import { downloadProfilePoster, shareProfilePoster, generateProfilePosterDataUrl, openSocialShareUrl, copyProfileUrlToClipboard, getTwitterDefaultShareText, getRandomTwitterShareText, openCustomTwitterShare } from '@/lib/profilePoster';
import { getVisiblePlayerStats, type PlayerInfoStats } from '@/lib/playerInfoStats';
import PublicNFTAssetsOverview from './PublicNFTAssetsOverview';
import { useProfileBackground, type ProfileBackground } from '@/hooks/useProfileBackground';
import type { PublicNFTAsset } from '@/hooks/usePublicNFTAssets';
import './player-info-card.css';

export interface PlayerInfo {
  userId: string;
  userName: string;
  level: number;
  avatar?: string;
  status: 'online' | 'offline';
  lastSeen?: number;
  signature?: string;
  isFriend?: boolean;
  isBlocked?: boolean;
  walletAddress?: string;
  publicAssetsEnabled?: boolean;
  profileBackground?: ProfileBackground | null;
  stats?: PlayerInfoStats;
}

export interface PlayerInfoCardProps {
  player: PlayerInfo;
  currentUserId: string;
  onClose: () => void;
  onSendMessage?: (userId: string) => void;
  onAddFriend?: (userId: string) => void;
  onRemoveFriend?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onUnblock?: (userId: string) => void;
  isOpen: boolean;
}

export const PlayerInfoCard: React.FC<PlayerInfoCardProps> = ({
  player,
  currentUserId,
  onClose,
  onSendMessage,
  onAddFriend,
  onRemoveFriend,
  onBlock,
  onUnblock,
  isOpen,
}) => {
  const [loadingState, setLoadingState] = useState<{
    message?: boolean;
    friend?: boolean;
    block?: boolean;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets'>('overview');
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewPosterUrl, setPreviewPosterUrl] = useState<string | null>(null);
  const [copiedToastActive, setCopiedToastActive] = useState(false);
  const [twitterModalOpen, setTwitterModalOpen] = useState(false);
  const [customTwitterText, setCustomTwitterText] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleInsertSnippet = (snippet: string) => {
    if (customTwitterText.includes(snippet)) {
      setSuccessMessage(`文案中已包含 "${snippet}"`);
      setTimeout(() => setSuccessMessage(null), 2000);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      setCustomTwitterText((prev) => prev + ' ' + snippet);
      return;
    }

    const start = textarea.selectionStart ?? customTwitterText.length;
    const end = textarea.selectionEnd ?? customTwitterText.length;
    const newText = customTwitterText.substring(0, start) + ' ' + snippet + ' ' + customTwitterText.substring(end);
    setCustomTwitterText(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + snippet.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  const isOwnProfile = player.userId === currentUserId;
  const { background: ownBackground, setBackgroundFromAsset } = useProfileBackground(player.userId);
  const displayedBackground = isOwnProfile ? ownBackground : player.profileBackground ?? null;

  if (!isOpen) return null;
  const statusText = player.status === 'online' ? '在线' : '离线';
  const statusColor = player.status === 'online' ? 'online' : 'offline';

  const handleSetBackground = (asset: PublicNFTAsset) => {
    if (!isOwnProfile) return;
    setBackgroundFromAsset(asset);
    setSuccessMessage(`已将 ${asset.name} 设为个人主页背景`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const getPosterOptions = () => {
    const statsRec = (player.stats || {}) as Record<string, any>;
    const pAssets = (player as any).publicAssets || [];
    const landCount = pAssets.filter((a: any) => a.kind === 'land').length || statsRec.landCount || statsRec.lands || 0;
    const buildingCount = pAssets.filter((a: any) => a.kind === 'building').length || statsRec.buildingCount || statsRec.buildings || 0;
    const totalAssets = landCount + buildingCount;
    return { player, background: displayedBackground, assetSummary: { landCount, buildingCount, totalAssets } };
  };

  const handleShareProfile = async () => {
    try {
      setIsSharing(true);
      const result = await shareProfilePoster(getPosterOptions());
      if (result.method === 'native') {
        setSuccessMessage('主页海报已成功拉起系统分享！');
      } else {
        setSuccessMessage('主页海报已生成并自动下载到您的设备！');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSuccessMessage(err instanceof Error ? err.message : '海报分享失败');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadProfile = async () => {
    try {
      setIsDownloading(true);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      downloadProfilePoster(getPosterOptions());
      setSuccessMessage('最新主页海报已保存到您的设备！');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSuccessMessage(err instanceof Error ? err.message : '海报下载失败');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreviewPoster = () => {
    const url = generateProfilePosterDataUrl(getPosterOptions());
    setPreviewPosterUrl(url);
  };

  const handleDownloadPreview = () => {
    if (!previewPosterUrl) return;
    try {
      downloadProfilePoster(getPosterOptions(), previewPosterUrl);
      setSuccessMessage('海报图片已保存到您的设备！');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSuccessMessage(err instanceof Error ? err.message : '海报下载失败');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'telegram') => {
    if (platform === 'twitter') {
      const defaultText = getTwitterDefaultShareText(getPosterOptions());
      setCustomTwitterText(defaultText);
      setTwitterModalOpen(true);
      return;
    }

    try {
      openSocialShareUrl(platform, getPosterOptions());
      setSuccessMessage('已成功拉起 Telegram 预设文案分享！');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSuccessMessage(err instanceof Error ? err.message : '社交分享跳转失败');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleConfirmTwitterShare = () => {
    if (!customTwitterText.trim() || customTwitterText.length > 280) return;
    try {
      openCustomTwitterShare(customTwitterText);
      setTwitterModalOpen(false);
      setSuccessMessage('已成功跳转至 Twitter (X) 分享自定义文案！');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSuccessMessage(err instanceof Error ? err.message : 'Twitter 分享跳转失败');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCopyLink = async () => {
    try {
      const success = await copyProfileUrlToClipboard(player.userId);
      if (success) {
        setCopiedToastActive(true);
        setTimeout(() => setCopiedToastActive(false), 2200);
      } else {
        setSuccessMessage('复制链接失败，请手动复制');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setSuccessMessage(err instanceof Error ? err.message : '复制链接失败');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // 处理私聊
  const handleSendMessage = async () => {
    try {
      setLoadingState((prev) => ({ ...prev, message: true }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSendMessage?.(player.userId);
      setSuccessMessage(`已与 ${player.userName} 开启私聊`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } finally {
      setLoadingState((prev) => ({ ...prev, message: false }));
    }
  };

  // 处理关注
  const handleToggleFriend = async () => {
    try {
      setLoadingState((prev) => ({ ...prev, friend: true }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (player.isFriend) {
        onRemoveFriend?.(player.userId);
        setSuccessMessage(`已取消关注 ${player.userName}`);
      } else {
        onAddFriend?.(player.userId);
        setSuccessMessage(`已关注 ${player.userName}`);
      }
      setTimeout(() => setSuccessMessage(null), 2000);
    } finally {
      setLoadingState((prev) => ({ ...prev, friend: false }));
    }
  };

  // 处理屏蔽
  const handleToggleBlock = async () => {
    try {
      setLoadingState((prev) => ({ ...prev, block: true }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (player.isBlocked) {
        onUnblock?.(player.userId);
        setSuccessMessage(`已取消屏蔽 ${player.userName}`);
      } else {
        onBlock?.(player.userId);
        setSuccessMessage(`已屏蔽 ${player.userName}`);
      }
      setTimeout(() => setSuccessMessage(null), 2000);
    } finally {
      setLoadingState((prev) => ({ ...prev, block: false }));
    }
  };

  return (
    <div className="player-info-overlay" onClick={onClose}>
      <Card className="player-info-card" onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button className="close-btn" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        {/* 头部背景 */}
        <div
          className={`card-header-bg ${displayedBackground ? 'has-nft-background' : ''} ${displayedBackground?.kind ?? ''}`}
          role={displayedBackground ? 'img' : undefined}
          aria-label={displayedBackground ? `个人主页背景：${displayedBackground.name}` : undefined}
        >
          {displayedBackground && (
            <span className="card-header-bg-label">
              {displayedBackground.kind === 'land' ? '土地背景' : '建筑背景'} · #{displayedBackground.tokenId}
            </span>
          )}
        </div>

        {/* 玩家头像 */}
        <div className="player-avatar-container">
          {player.avatar ? (
            <img src={player.avatar} alt={player.userName} className="player-avatar" />
          ) : (
            <div className="avatar-placeholder">
              {player.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`status-indicator ${statusColor}`} />
        </div>

        {/* 玩家信息 */}
        <div className="player-info-content">
          <h2 className="player-name">{player.userName}</h2>
          <p className="player-level">Lv. {player.level}</p>
          <p className={`player-status ${statusColor}`}>{statusText}</p>

          {player.signature && (
            <div className="player-signature">
              <p className="signature-text">"{player.signature}"</p>
            </div>
          )}

          <div className="profile-tabs" role="tablist" aria-label="玩家资料标签">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              概览
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'assets'}
              className={`profile-tab ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              拥有的 NFT 资产
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="profile-tab-panel">
              {/* 成功提示 */}
              {successMessage && (
            <div className="success-message">
              <CheckCircle className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 操作按钮 */}
          {!isOwnProfile && (
            <div className="action-buttons">
              {/* 私聊按钮 */}
              <Button
                className="action-btn message-btn"
                onClick={handleSendMessage}
                disabled={loadingState.message}
              >
                {loadingState.message ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                <span>{loadingState.message ? '发起中...' : '私聊'}</span>
              </Button>

              {/* 好友按钮 */}
              {player.isFriend ? (
                <Button
                  className="action-btn friend-btn active"
                  onClick={handleToggleFriend}
                  disabled={loadingState.friend}
                >
                  {loadingState.friend ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>{loadingState.friend ? '处理中...' : '已关注'}</span>
                </Button>
              ) : (
                <Button
                  className="action-btn friend-btn"
                  onClick={handleToggleFriend}
                  disabled={loadingState.friend}
                >
                  {loadingState.friend ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{loadingState.friend ? '处理中...' : '关注'}</span>
                </Button>
              )}

              {/* 屏蔽按钮 */}
              {player.isBlocked ? (
                <Button
                  className="action-btn block-btn active"
                  onClick={handleToggleBlock}
                  disabled={loadingState.block}
                >
                  <span>{loadingState.block ? '处理中...' : '已屏蔽'}</span>
                </Button>
              ) : (
                <Button
                  className="action-btn block-btn"
                  onClick={handleToggleBlock}
                  disabled={loadingState.block}
                >
                  <span>{loadingState.block ? '处理中...' : '屏蔽'}</span>
                </Button>
              )}
            </div>
          )}

              {/* 自己的资料 */}
              {isOwnProfile && (
                <div className="own-profile-hint">
                  <p>这是你的个人资料</p>
                </div>
              )}

              {/* 分享我的主页按钮 */}
              <div className="share-profile-section">
                <Button
                  type="button"
                  variant="outline"
                  className="share-profile-btn"
                  onClick={handleShareProfile}
                  disabled={isSharing || isDownloading}
                >
                  {isSharing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                  {isSharing ? '正在生成海报...' : '分享我的主页海报'}
                </Button>
                <Button
                  type="button"
                  className="download-profile-btn"
                  onClick={handleDownloadProfile}
                  disabled={isSharing || isDownloading}
                  aria-label="一键下载个人资料卡片海报"
                >
                  {isDownloading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  {isDownloading ? '正在保存海报...' : '一键下载海报'}
                </Button>
                <div className="social-share-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="social-share-chip twitter-chip"
                    onClick={() => handleSocialShare('twitter')}
                    title="分享到 Twitter / X"
                  >
                    <span className="font-bold mr-1">𝕏</span> Twitter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="social-share-chip telegram-chip"
                    onClick={() => handleSocialShare('telegram')}
                    title="分享到 Telegram"
                  >
                    <span className="text-sky-400 font-bold mr-1">✈</span> Telegram
                  </Button>
                  <div className="relative inline-flex flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="social-share-chip copy-chip w-full"
                      onClick={handleCopyLink}
                      title="一键复制专属主页链接"
                      aria-label="一键复制专属主页链接"
                    >
                      {copiedToastActive ? <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copiedToastActive ? '已复制' : '复制链接'}
                    </Button>
                    {copiedToastActive && (
                      <div 
                        role="status" 
                        aria-live="polite"
                        className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg animate-in fade-in zoom-in-95 duration-150"
                      >
                        链接已复制！
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="preview-poster-link"
                  onClick={handlePreviewPoster}
                >
                  预览海报
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <PublicNFTAssetsOverview
              playerName={player.userName}
              walletAddress={player.walletAddress}
              publicAssetsEnabled={player.publicAssetsEnabled}
              canSetAsBackground={isOwnProfile}
              currentBackground={displayedBackground}
              onSetAsBackground={isOwnProfile ? handleSetBackground : undefined}
            />
          )}
        </div>

        {/* Twitter 文案自定义模态框 */}
        {twitterModalOpen && (
          <div className="poster-preview-overlay" onClick={() => setTwitterModalOpen(false)}>
            <div className="poster-preview-modal p-4" onClick={(e) => e.stopPropagation()}>
              <div className="poster-preview-header mb-3">
                <h3 className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <span className="text-white">𝕏</span> 自定义 Twitter 宣传文案
                </h3>
                <button type="button" className="close-btn" onClick={() => setTwitterModalOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-xs text-slate-300 font-medium">您可以自由修改或添加个性化描述：</label>
                <textarea
                  ref={textareaRef}
                  value={customTwitterText}
                  onChange={(e) => setCustomTwitterText(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
                  placeholder="输入您的分享文案..."
                />
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">快捷插入热门话题与表情：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['#CryptoGaming', '#Metaverse', '#NFTCommunity', '#Solana', '#Web3Gaming', '#ISC', '🏙️', '🚀', '💎', '🔥'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleInsertSnippet(item)}
                        className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-cyan-300 hover:bg-slate-700 hover:text-cyan-200 transition-colors"
                        title={`点击插入 ${item}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] px-0.5 pt-1">
                  <div className="flex items-center gap-2">
                    {/* 环形字数进度条 SVG */}
                    {(() => {
                      const len = customTwitterText.length;
                      const max = 280;
                      const percentage = Math.min(len / max, 1);
                      const radius = 9;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - percentage * circumference;
                      const isOver = len > max;
                      const isNear = len >= 240 && !isOver;
                      const strokeColor = isOver ? '#f87171' : isNear ? '#fbbf24' : '#22d3ee';

                      return (
                        <div className="relative flex items-center justify-center w-6 h-6">
                          <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                            <circle
                              cx="12"
                              cy="12"
                              r={radius}
                              stroke="currentColor"
                              strokeWidth="2.5"
                              fill="none"
                              className="text-slate-800"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r={radius}
                              stroke={strokeColor}
                              strokeWidth="2.5"
                              fill="none"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.2s ease' }}
                            />
                          </svg>
                          <span className={`absolute text-[9px] font-bold ${isOver ? 'text-red-400' : 'text-slate-300'}`}>
                            {max - len < 0 ? max - len : max - len <= 20 ? max - len : ''}
                          </span>
                        </div>
                      );
                    })()}
                    <span className={customTwitterText.length > 280 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                      {customTwitterText.length} / 280 {customTwitterText.length > 280 && '(超出限制！)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-amber-400 hover:underline font-medium"
                      onClick={() => setCustomTwitterText(getRandomTwitterShareText(getPosterOptions()))}
                      title="随机切换宣传文案模板"
                    >
                      🎲 随机生成
                    </button>
                    <button
                      type="button"
                      className="text-cyan-400 hover:underline"
                      onClick={() => setCustomTwitterText(getTwitterDefaultShareText(getPosterOptions()))}
                    >
                      恢复默认
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setTwitterModalOpen(false)}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={customTwitterText.length > 280 || !customTwitterText.trim()}
                  className={`font-bold ${customTwitterText.length > 280 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'}`}
                  onClick={handleConfirmTwitterShare}
                >
                  确认分享到 Twitter 𝕏
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 海报预览模态框 */}
        {previewPosterUrl && (
          <div className="poster-preview-overlay" onClick={() => setPreviewPosterUrl(null)}>
            <div className="poster-preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="poster-preview-header">
                <h3>个人名片海报预览</h3>
                <button type="button" className="close-btn" onClick={() => setPreviewPosterUrl(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="poster-preview-body">
                <img src={previewPosterUrl} alt="主页海报预览" className="poster-preview-image" />
              </div>
              <div className="poster-preview-footer">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadPreview}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  下载海报图片
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewPosterUrl(null)}
                >
                  关闭
                </Button>
              </div>
            </div>
          </div>
        )}

        {getVisiblePlayerStats(player.stats).length > 0 && (
          <div className="player-stats" aria-label="玩家真实统计">
            {getVisiblePlayerStats(player.stats).map((stat, index) => (
              <React.Fragment key={stat.key}>
                {index > 0 && <div className="stat-divider" />}
                <div className="stat-item">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{stat.value}</span>
                </div>
              </React.Fragment>
            ))}
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">等级</span>
              <span className="stat-value">{player.level}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlayerInfoCard;
