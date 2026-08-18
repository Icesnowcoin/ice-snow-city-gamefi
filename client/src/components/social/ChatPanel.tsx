/**
 * 聊天面板 UI 组件
 * 支持多频道切换、消息展示、消息输入
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, X, Users, Hash, Zap } from 'lucide-react';
import type { ChatChannel, ChatMessage } from '@/game/social/ChatManager';
import type { PlayerInfo } from './PlayerInfoCard';
import { PlayerInfoCard } from './PlayerInfoCard';
import './chat-panel.css';

export interface ChatPanelProps {
  channels: ChatChannel[];
  messages: Record<string, ChatMessage[]>;
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (channelId: string, content: string) => void;
  onChannelChange: (channelId: string) => void;
  onClose: () => void;
  isOpen: boolean;
  onStartPrivateChat?: (userId: string) => void;
  onAddFriend?: (userId: string) => void;
  onRemoveFriend?: (userId: string) => void;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  private: '💬',
  public: <Hash className="w-4 h-4" />,
  team: <Users className="w-4 h-4" />,
  guild: <Zap className="w-4 h-4" />,
  community: '🌐',
};

const CHANNEL_LABELS: Record<string, string> = {
  private: '私聊',
  public: '公频',
  team: '团队',
  guild: '工会',
  community: '社区',
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  channels,
  messages,
  currentUserId,
  currentUserName,
  onSendMessage,
  onChannelChange,
  onClose,
  isOpen,
  onStartPrivateChat,
  onAddFriend,
  onRemoveFriend,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    channels[0]?.id || ''
  );
  const [messageInput, setMessageInput] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const [showPlayerInfo, setShowPlayerInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[selectedChannelId]]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(selectedChannelId, messageInput);
      setMessageInput('');
    }
  };

  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId);
    onChannelChange(channelId);
  };

  const currentChannel = channels.find((c) => c.id === selectedChannelId);
  const currentMessages = messages[selectedChannelId] || [];

  if (!isOpen) return null;

  return (
    <div className="chat-panel-container">
      {/* 背景遮罩 */}
      <div className="chat-overlay" onClick={onClose} />

      {/* 玩家信息卡片 */}
      {selectedPlayer && (
        <PlayerInfoCard
          player={selectedPlayer}
          currentUserId={currentUserId}
          isOpen={showPlayerInfo}
          onClose={() => setShowPlayerInfo(false)}
          onSendMessage={(userId) => {
            onStartPrivateChat?.(userId);
            setShowPlayerInfo(false);
          }}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      )}

      {/* 聊天面板 */}
      <div className="chat-panel">
        {/* 头部 */}
        <div className="chat-header">
          <div className="header-left">
            <div className="channel-icon">
              {CHANNEL_ICONS[currentChannel?.type || 'private']}
            </div>
            <div className="header-info">
              <h2 className="channel-name">{currentChannel?.name || '聊天'}</h2>
              <p className="channel-members">
                {currentChannel?.members.length || 0} 人
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="chat-close-btn"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 频道标签页 */}
        <Tabs
          value={selectedChannelId}
          onValueChange={handleChannelChange}
          className="chat-tabs"
        >
          <TabsList className="chat-tabs-list">
            {channels.map((channel) => (
              <TabsTrigger
                key={channel.id}
                value={channel.id}
                className="chat-tab-trigger"
              >
                <span className="tab-icon">
                  {CHANNEL_ICONS[channel.type]}
                </span>
                <span className="tab-label">
                  {CHANNEL_LABELS[channel.type]}
                </span>
                {channel.unreadCount > 0 && (
                  <span className="unread-badge">{channel.unreadCount}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 消息内容 */}
          <TabsContent value={selectedChannelId} className="chat-content">
            <div className="messages-container">
              {currentMessages.length === 0 ? (
                <div className="messages-empty">
                  <p>暂无消息</p>
                  <p className="empty-hint">开始聊天吧！</p>
                </div>
              ) : (
                <div className="messages-list">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-item ${
                        msg.senderId === currentUserId ? 'own-message' : ''
                      }`}
                    >
                      {msg.senderId !== currentUserId && (
                        <div
                          className="message-avatar"
                          onClick={() => {
                            setSelectedPlayer({
                              userId: msg.senderId,
                              userName: msg.senderName,
                              level: 1,
                              avatar: msg.senderAvatar,
                              status: 'online',
                              signature: '这是一个玩家',
                            });
                            setShowPlayerInfo(true);
                          }}
                        >
                          {msg.senderAvatar ? (
                            <img
                              src={msg.senderAvatar}
                              alt={msg.senderName}
                              className="avatar-img"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {msg.senderName.charAt(0)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="message-content">
                        {msg.senderId !== currentUserId && (
                          <p className="message-sender">{msg.senderName}</p>
                        )}
                        <div className="message-bubble">
                          <p className="message-text">{msg.content}</p>
                          <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* 消息输入框 */}
            <div className="message-input-area">
              <div className="input-wrapper">
                <Input
                  placeholder="输入消息..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="message-input"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="send-btn"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="input-hint">按 Enter 发送，Shift+Enter 换行</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatPanel;
