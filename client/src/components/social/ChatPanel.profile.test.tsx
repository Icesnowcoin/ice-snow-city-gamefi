import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';
import type { ChatChannel, ChatMessage } from '@/game/social/ChatManager';

const channel: ChatChannel = {
  id: 'community-1',
  type: 'community',
  name: '社区',
  members: ['me', 'player-7'],
  createdAt: 1,
  unreadCount: 0,
};

const message: ChatMessage = {
  id: 'message-1',
  senderId: 'player-7',
  senderName: '真实玩家',
  senderAvatar: 'https://example.com/avatar.png',
  channelType: 'community',
  channelId: channel.id,
  content: '欢迎来到商业帝国',
  timestamp: Date.now(),
  isRead: true,
};

describe('ChatPanel player profile wiring', () => {
  it('透传上层真实玩家资料而不是生成虚构签名或在线状态', () => {
    render(
      <ChatPanel
        channels={[channel]}
        messages={{ [channel.id]: [message] }}
        currentUserId="me"
        currentUserName="我"
        onSendMessage={vi.fn()}
        onChannelChange={vi.fn()}
        onClose={vi.fn()}
        isOpen
        playerProfiles={{
          'player-7': {
            level: 18,
            status: 'online',
            walletAddress: '0x123',
            publicAssetsEnabled: true,
            stats: { friendCount: 12, achievementCount: 7 },
          },
        }}
      />
    );

    fireEvent.click(screen.getByAltText('真实玩家'));

    expect(screen.getByText('Lv. 18')).toBeTruthy();
    expect(screen.getByText('在线')).toBeTruthy();
    expect(screen.queryByText('这是一个玩家')).toBeNull();
    expect(screen.getByText('好友')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });
});
