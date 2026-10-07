/**
 * 聊天系统管理器
 * 管理私聊、公频、团队频道、工会频道等多种聊天窗口
 */

export type ChatChannelType = 'private' | 'public' | 'team' | 'guild' | 'community';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  channelType: ChatChannelType;
  channelId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  reactions?: Record<string, string[]>; // emoji -> userIds
}

export interface ChatChannel {
  id: string;
  type: ChatChannelType;
  name: string;
  members: string[];
  createdAt: number;
  lastMessageTime?: number;
  unreadCount: number;
}

export interface PrivateChat extends ChatChannel {
  type: 'private';
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
}

export interface TeamChannel extends ChatChannel {
  type: 'team';
  leaderId: string;
  maxMembers: number;
}

export interface GuildChannel extends ChatChannel {
  type: 'guild';
  guildId: string;
  guildName: string;
}

export class ChatManager {
  private channels: Map<string, ChatChannel> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private listeners: {
    onMessageReceived: Array<(message: ChatMessage) => void>;
    onChannelCreated: Array<(channel: ChatChannel) => void>;
    onChannelDeleted: Array<(channelId: string) => void>;
    onUnreadChange: Array<(channelId: string, unreadCount: number) => void>;
  } = {
    onMessageReceived: [],
    onChannelCreated: [],
    onChannelDeleted: [],
    onUnreadChange: [],
  };

  /**
   * 创建私聊频道
   */
  createPrivateChat(
    userId: string,
    userName: string,
    otherUserId: string,
    otherUserName: string,
    otherUserAvatar?: string
  ): PrivateChat {
    const channelId = `private_${[userId, otherUserId].sort().join('_')}`;

    if (this.channels.has(channelId)) {
      return this.channels.get(channelId) as PrivateChat;
    }

    const channel: PrivateChat = {
      id: channelId,
      type: 'private',
      name: otherUserName,
      members: [userId, otherUserId],
      createdAt: Date.now(),
      unreadCount: 0,
      otherUserId,
      otherUserName,
      otherUserAvatar,
    };

    this.channels.set(channelId, channel);
    this.messages.set(channelId, []);
    this.notifyListeners('onChannelCreated', channel);

    return channel;
  }

  /**
   * 创建团队频道
   */
  createTeamChannel(
    teamId: string,
    teamName: string,
    leaderId: string,
    members: string[],
    maxMembers: number = 4
  ): TeamChannel {
    const channelId = `team_${teamId}`;

    const channel: TeamChannel = {
      id: channelId,
      type: 'team',
      name: teamName,
      members,
      createdAt: Date.now(),
      unreadCount: 0,
      leaderId,
      maxMembers,
    };

    this.channels.set(channelId, channel);
    this.messages.set(channelId, []);
    this.notifyListeners('onChannelCreated', channel);

    return channel;
  }

  /**
   * 创建工会频道
   */
  createGuildChannel(
    guildId: string,
    guildName: string,
    members: string[]
  ): GuildChannel {
    const channelId = `guild_${guildId}`;

    const channel: GuildChannel = {
      id: channelId,
      type: 'guild',
      name: guildName,
      members,
      createdAt: Date.now(),
      unreadCount: 0,
      guildId,
      guildName,
    };

    this.channels.set(channelId, channel);
    this.messages.set(channelId, []);
    this.notifyListeners('onChannelCreated', channel);

    return channel;
  }

  /**
   * 发送消息
   */
  sendMessage(
    channelId: string,
    senderId: string,
    senderName: string,
    content: string,
    senderAvatar?: string
  ): ChatMessage {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName,
      senderAvatar,
      channelType: (this.channels.get(channelId)?.type || 'private') as ChatChannelType,
      channelId,
      content,
      timestamp: Date.now(),
      isRead: false,
    };

    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }

    this.messages.get(channelId)!.push(message);

    const channel = this.channels.get(channelId);
    if (channel) {
      channel.lastMessageTime = message.timestamp;
    }

    this.notifyListeners('onMessageReceived', message);

    return message;
  }

  /**
   * 获取频道消息
   */
  getMessages(channelId: string, limit: number = 50): ChatMessage[] {
    const messages = this.messages.get(channelId) || [];
    return messages.slice(-limit);
  }

  /**
   * 标记消息已读
   */
  markMessageAsRead(messageId: string): void {
    this.messages.forEach((messages: ChatMessage[]) => {
      const message = messages.find((m: ChatMessage) => m.id === messageId);
      if (message) {
        message.isRead = true;
      }
    });
  }

  /**
   * 标记频道已读
   */
  markChannelAsRead(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      const messages = this.messages.get(channelId) || [];
      messages.forEach((m: ChatMessage) => {
        m.isRead = true;
      });
      channel.unreadCount = 0;
      this.notifyListeners('onUnreadChange', channelId, 0);
    }
  }

  /**
   * 增加未读消息计数
   */
  incrementUnreadCount(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.unreadCount++;
      this.notifyListeners('onUnreadChange', channelId, channel.unreadCount);
    }
  }

  /**
   * 获取频道
   */
  getChannel(channelId: string): ChatChannel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * 获取所有频道
   */
  getChannels(): ChatChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * 获取私聊频道
   */
  getPrivateChats(): PrivateChat[] {
    return Array.from(this.channels.values()).filter(
      (c) => c.type === 'private'
    ) as PrivateChat[];
  }

  /**
   * 获取团队频道
   */
  getTeamChannels(): TeamChannel[] {
    return Array.from(this.channels.values()).filter(
      (c) => c.type === 'team'
    ) as TeamChannel[];
  }

  /**
   * 获取工会频道
   */
  getGuildChannels(): GuildChannel[] {
    return Array.from(this.channels.values()).filter(
      (c) => c.type === 'guild'
    ) as GuildChannel[];
  }

  /**
   * 删除频道
   */
  deleteChannel(channelId: string): void {
    this.channels.delete(channelId);
    this.messages.delete(channelId);
    this.notifyListeners('onChannelDeleted', channelId);
  }

  /**
   * 添加团队成员
   */
  addTeamMember(channelId: string, userId: string): void {
    const channel = this.channels.get(channelId);
    if (channel && channel.type === 'team') {
      const teamChannel = channel as TeamChannel;
      if (!teamChannel.members.includes(userId) && teamChannel.members.length < teamChannel.maxMembers) {
        teamChannel.members.push(userId);
      }
    }
  }

  /**
   * 移除团队成员
   */
  removeTeamMember(channelId: string, userId: string): void {
    const channel = this.channels.get(channelId);
    if (channel && channel.type === 'team') {
      const teamChannel = channel as TeamChannel;
      teamChannel.members = teamChannel.members.filter((id) => id !== userId);
    }
  }

  /**
   * 获取总未读消息数
   */
  getTotalUnreadCount(): number {
    let total = 0;
    this.channels.forEach((channel) => {
      total += channel.unreadCount;
    });
    return total;
  }

  /**
   * 订阅消息接收
   */
  onMessageReceived(listener: (message: ChatMessage) => void): () => void {
    this.listeners.onMessageReceived.push(listener);
    return () => {
      this.listeners.onMessageReceived = this.listeners.onMessageReceived.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅频道创建
   */
  onChannelCreated(listener: (channel: ChatChannel) => void): () => void {
    this.listeners.onChannelCreated.push(listener);
    return () => {
      this.listeners.onChannelCreated = this.listeners.onChannelCreated.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅频道删除
   */
  onChannelDeleted(listener: (channelId: string) => void): () => void {
    this.listeners.onChannelDeleted.push(listener);
    return () => {
      this.listeners.onChannelDeleted = this.listeners.onChannelDeleted.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅未读消息变化
   */
  onUnreadChange(
    listener: (channelId: string, unreadCount: number) => void
  ): () => void {
    this.listeners.onUnreadChange.push(listener);
    return () => {
      this.listeners.onUnreadChange = this.listeners.onUnreadChange.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: keyof typeof this.listeners, ...args: any[]): void {
    const listeners = this.listeners[event] as any[];
    listeners.forEach((listener) => {
      listener(...args);
    });
  }
}

// 全局单例
let chatManagerInstance: ChatManager | null = null;

export function getChatManager(): ChatManager {
  if (!chatManagerInstance) {
    chatManagerInstance = new ChatManager();
  }
  return chatManagerInstance;
}
