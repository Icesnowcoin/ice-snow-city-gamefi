import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  X,
  Phone,
  Video,
  MoreVertical,
  Gift,
  Smile,
  Paperclip,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatSession, PrivateMessage, OnlineStatus } from '@/game/social/FriendManager';
import './private-chat-panel.css';

// 消息类型
type MessageType = 'text' | 'gift' | 'invite' | 'system';

interface PrivateChatPanelProps {
  chatSession: ChatSession;
  currentPlayerId: string;
  isTyping?: boolean;
  onSendMessage?: (content: string) => void;
  onClose?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onSendGift?: () => void;
  onBlock?: () => void;
  onTyping?: (isTyping: boolean) => void;
}

const ONLINE_STATUS_LABELS: Record<OnlineStatus, string> = {
  online: '在线',
  offline: '离线',
  away: '离开',
  busy: '忙碌',
};

const ONLINE_STATUS_COLORS: Record<OnlineStatus, string> = {
  online: '#10b981',
  offline: '#64748b',
  away: '#f59e0b',
  busy: '#ef4444',
};

export const PrivateChatPanel: React.FC<PrivateChatPanelProps> = ({
  chatSession,
  currentPlayerId,
  isTyping = false,
  onSendMessage,
  onClose,
  onCall,
  onVideoCall,
  onSendGift,
  onBlock,
  onTyping,
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localIsTyping, setLocalIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [chatSession.messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage?.(messageInput);
      setMessageInput('');
      setShowEmojiPicker(false);
      setLocalIsTyping(false);
      onTyping?.(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理输入框变化，发送正在输入状态
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // 清除之前的超时
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 如果开始输入
    if (value.length > 0 && !localIsTyping) {
      setLocalIsTyping(true);
      onTyping?.(true);
    }

    // 设置超时，3 秒后停止显示正在输入
    typingTimeoutRef.current = setTimeout(() => {
      setLocalIsTyping(false);
      onTyping?.(false);
    }, 3000);
  };

  const renderMessage = (message: PrivateMessage) => {
    const isCurrentPlayer = message.fromPlayerId === currentPlayerId;

    return (
      <div
        key={message.id}
        className={`message-item ${isCurrentPlayer ? 'sent' : 'received'}`}
      >
        {!isCurrentPlayer && (
          <Avatar className="message-avatar">
            <AvatarImage src={chatSession.playerAvatar} alt={chatSession.playerName} />
            <AvatarFallback>{chatSession.playerName.charAt(0)}</AvatarFallback>
          </Avatar>
        )}

        <div className="message-content-wrapper">
          {message.type === 'text' && (
            <div className="message-bubble">
              <p className="message-text">{message.content}</p>
            </div>
          )}

          {message.type === 'gift' && (
            <div className="message-bubble gift-message">
              <span className="gift-icon">🎁</span>
              <p className="message-text">{message.content}</p>
            </div>
          )}

          {message.type === 'invite' && (
            <div className="message-bubble invite-message">
              <span className="invite-icon">👥</span>
              <p className="message-text">{message.content}</p>
            </div>
          )}

          {message.type === 'system' && (
            <div className="message-bubble system-message">
              <p className="message-text">{message.content}</p>
            </div>
          )}

          <div className="message-time">
            {formatMessageTime(message.timestamp)}
          </div>
        </div>

        {isCurrentPlayer && (
          <Avatar className="message-avatar">
            <AvatarFallback>我</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <div className="private-chat-panel">
      {/* 头部 */}
      <div className="chat-header">
        <div className="chat-header-left">
          <Avatar className="chat-avatar">
            <AvatarImage src={chatSession.playerAvatar} alt={chatSession.playerName} />
            <AvatarFallback>{chatSession.playerName.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="chat-player-info">
            <div className="chat-player-name">{chatSession.playerName}</div>
            <div
              className="chat-player-status"
              style={{ color: ONLINE_STATUS_COLORS[chatSession.onlineStatus] }}
            >
              {ONLINE_STATUS_LABELS[chatSession.onlineStatus]}
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCall}
            className="action-btn call-btn"
            title="语音通话"
          >
            <Phone className="icon" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onVideoCall}
            className="action-btn video-btn"
            title="视频通话"
          >
            <Video className="icon" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="action-btn">
                <MoreVertical className="icon" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSendGift}>
                <Gift className="icon" />
                送礼物
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBlock} className="danger">
                <X className="icon" />
                屏蔽此玩家
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="close-btn"
          >
            <X className="icon" />
          </Button>
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="chat-messages" ref={scrollAreaRef}>
        <div className="messages-container">
          {chatSession.messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-icon">💬</div>
              <p>开始聊天吧</p>
            </div>
          ) : (
            <>
              {chatSession.messages.map((message) => renderMessage(message))}
              {isTyping && (
                <div className="typing-indicator">
                  <div className="typing-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                  <p className="typing-text">对方正在输入...</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="chat-input-area">
        <div className="input-toolbar">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="toolbar-btn emoji-btn"
            title="表情"
          >
            <Smile className="icon" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onSendGift}
            className="toolbar-btn gift-btn"
            title="送礼物"
          >
            <Gift className="icon" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="toolbar-btn file-btn"
            title="发送文件"
          >
            <Paperclip className="icon" />
          </Button>
        </div>

        {/* 表情选择器 */}
        {showEmojiPicker && (
          <div className="emoji-picker">
            {['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '🎉', '🎁'].map((emoji) => (
              <button
                key={emoji}
                className="emoji-btn"
                onClick={() => {
                  setMessageInput(messageInput + emoji);
                  setShowEmojiPicker(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* 消息输入框 */}
        <div className="input-wrapper">
          <Input
            placeholder="输入消息..."
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="message-input"
            maxLength={500}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="send-btn"
          >
            <Send className="icon" />
            发送
          </Button>
        </div>

        <div className="input-hint">
          {messageInput.length}/500 · 按 Enter 发送
        </div>
      </div>
    </div>
  );
};

/**
 * 格式化消息时间
 */
function formatMessageTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${hours}h`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export default PrivateChatPanel;
