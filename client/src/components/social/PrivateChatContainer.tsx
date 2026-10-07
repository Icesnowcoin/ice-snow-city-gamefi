import React, { useState, useEffect, useCallback } from 'react';
import { getChatManager } from '@/game/social/ChatManager';
import type { ChatSession } from '@/game/social/FriendManager';
import PrivateChatPanel from './PrivateChatPanel';
import type { PrivateMessage } from '@/game/social/FriendManager';
import { toastService } from '@/lib/toast-service';

interface PrivateChatContainerProps {
  playerId: string;
  friendId: string;
  friendName: string;
  friendAvatar: string;
  onClose?: () => void;
}

/**
 * 私聊容器组件
 * 管理聊天状态和消息交互
 */
export const PrivateChatContainer: React.FC<PrivateChatContainerProps> = ({
  playerId,
  friendId,
  friendName,
  friendAvatar,
  onClose,
}) => {
  const chatManager = getChatManager();
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);

  // 初始化聊天会话
  useEffect(() => {
    // 创建或获取聊天会话
    const session = chatManager.createPrivateChat(
      playerId,
      '当前玩家',
      friendId,
      friendName,
      friendAvatar
    );

    // 获取聊天记录
    const chatMessages = chatManager.getMessages(session.id, 50);
    setMessages(chatMessages);

    // 标记所有消息为已读
    chatMessages.forEach((msg) => {
      if (!msg.isRead) {
        chatManager.markMessageAsRead(msg.id);
      }
    });

    // 监听消息事件
    const unsubscribe = chatManager.onMessageReceived((message) => {
      if (message.channelId === session.id) {
        setMessages((prev: any[]) => [...prev, message]);
        setFriendIsTyping(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [playerId, friendId, friendName, friendAvatar, chatManager]);

  /**
   * 处理正在输入状态
   */
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      // 模拟向服务器发送正在输入状态
    },
    []
  );

  /**
   * 发送消息
   */
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) {
        toastService.warning('消息不能为空');
        return;
      }

      setIsLoading(true);
      const toastId = toastService.loading('正在发送消息...');

      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 300));

        const session = chatManager.getPrivateChats().find(
          (s) => s.otherUserId === friendId
        );

        if (session) {
          const message = chatManager.sendMessage(
            session.id,
            playerId,
            '当前玩家',
            content
          );

          setMessages((prev: any[]) => [...prev, message]);
          toastService.update(toastId, '消息已发送', 'success');
        } else {
          toastService.update(toastId, '聊天会话不存在', 'error');
        }
      } catch (error) {
        toastService.update(toastId, '发送消息失败', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [playerId, friendId, chatManager]
  );

  /**
   * 语音通话
   */
  const handleCall = useCallback(() => {
    toastService.info(`正在呼叫 ${friendName}...`);
    setFriendIsTyping(true);
    setTimeout(() => setFriendIsTyping(false), 2000);
  }, [friendName]);

  /**
   * 视频通话
   */
  const handleVideoCall = useCallback(() => {
    toastService.info(`正在发起视频通话 ${friendName}...`);
    setFriendIsTyping(true);
    setTimeout(() => setFriendIsTyping(false), 2000);
  }, [friendName]);

  /**
   * 发送礼物
   */
  const handleSendGift = useCallback(() => {
    toastService.info('礼物功能开发中...');
    setFriendIsTyping(true);
    setTimeout(() => setFriendIsTyping(false), 1500);
  }, []);

  /**
   * 屏蔽玩家
   */
  const handleBlock = useCallback(() => {
    toastService.warning(`已屏蔽 ${friendName}`);
    setFriendIsTyping(false);
  }, [friendName]);

  // 创建聊天会话对象
  const chatSession: any = {
    id: `${playerId}-${friendId}`,
    playerId: playerId,
    playerName: friendName,
    playerAvatar: friendAvatar,
    onlineStatus: 'online' as const,
    messages,
    unreadCount: 0,
    isTyping: friendIsTyping,
  };

  return (
    <PrivateChatPanel
      chatSession={chatSession}
      currentPlayerId={playerId}
      isTyping={friendIsTyping}
      onSendMessage={handleSendMessage}
      onClose={onClose}
      onCall={handleCall}
      onVideoCall={handleVideoCall}
      onSendGift={handleSendGift}
      onBlock={handleBlock}
      onTyping={handleTyping}
    />
  );
};

export default PrivateChatContainer;
