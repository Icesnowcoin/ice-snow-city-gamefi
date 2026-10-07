/**
 * 好友系统管理器
 * 管理好友关系、请求、黑名单等
 */

export type FriendStatus = 'friend' | 'pending' | 'blocked' | 'none';
export type OnlineStatus = 'online' | 'offline' | 'away' | 'busy';

export interface Friend {
  id: string;
  playerId: string;
  name: string;
  avatar: string;
  level: number;
  onlineStatus: OnlineStatus;
  lastSeenAt: number;
  addedAt: number;
  notes?: string;
  isFavorite: boolean;
  /** 由玩家资料服务提供；没有该字段时不读取链上公开资产。 */
  walletAddress?: string;
  publicAssetsEnabled?: boolean;
  friendCount?: number;
  achievementCount?: number;
}

export interface FriendRequest {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  fromPlayerAvatar: string;
  toPlayerId: string;
  message?: string;
  createdAt: number;
  expiresAt: number;
}

export interface BlockedPlayer {
  id: string;
  playerId: string;
  name: string;
  avatar: string;
  blockedAt: number;
  reason?: string;
}

export interface PrivateMessage {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  content: string;
  timestamp: number;
  read: boolean;
  type: 'text' | 'gift' | 'invite' | 'system';
}

export interface ChatSession {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  onlineStatus: OnlineStatus;
  lastMessage?: PrivateMessage;
  unreadCount: number;
  messages: PrivateMessage[];
}

export type FriendEventType =
  | 'friendAdded'
  | 'friendRemoved'
  | 'friendRequestSent'
  | 'friendRequestReceived'
  | 'friendRequestAccepted'
  | 'friendRequestRejected'
  | 'playerBlocked'
  | 'playerUnblocked'
  | 'privateMessageReceived'
  | 'onlineStatusChanged'
  | 'favoriteToggled';

export interface FriendEvent {
  type: FriendEventType;
  playerId: string;
  timestamp: number;
  data: Record<string, any>;
}

type FriendEventListener = (event: FriendEvent) => void;

export class FriendManager {
  private friends: Map<string, Friend> = new Map();
  private friendRequests: Map<string, FriendRequest[]> = new Map();
  private blockedPlayers: Map<string, BlockedPlayer[]> = new Map();
  private chatSessions: Map<string, Map<string, ChatSession>> = new Map();
  private eventListeners: FriendEventListener[] = [];

  /**
   * 初始化玩家好友数据
   */
  initializePlayer(playerId: string): void {
    if (!this.friendRequests.has(playerId)) {
      this.friendRequests.set(playerId, []);
    }
    if (!this.blockedPlayers.has(playerId)) {
      this.blockedPlayers.set(playerId, []);
    }
    if (!this.chatSessions.has(playerId)) {
      this.chatSessions.set(playerId, new Map<string, ChatSession>());
    }
  }

  /**
   * 发送好友请求
   */
  sendFriendRequest(
    fromPlayerId: string,
    fromPlayerName: string,
    fromPlayerAvatar: string,
    toPlayerId: string,
    message?: string
  ): FriendRequest | null {
    this.initializePlayer(fromPlayerId);
    this.initializePlayer(toPlayerId);

    // 检查是否已经是好友
    if (this.isFriend(fromPlayerId, toPlayerId)) {
      return null;
    }

    // 检查是否已被屏蔽
    if (this.isBlocked(toPlayerId, fromPlayerId)) {
      return null;
    }

    // 检查是否已有待处理的请求
    const existingRequest = this.friendRequests.get(toPlayerId)?.find(
      (req) => req.fromPlayerId === fromPlayerId
    );
    if (existingRequest) {
      return null;
    }

    const request: FriendRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromPlayerId,
      fromPlayerName,
      fromPlayerAvatar,
      toPlayerId,
      message,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天过期
    };

    this.friendRequests.get(toPlayerId)?.push(request);

    this.emitEvent({
      type: 'friendRequestSent',
      playerId: fromPlayerId,
      timestamp: Date.now(),
      data: { toPlayerId, requestId: request.id },
    });

    this.emitEvent({
      type: 'friendRequestReceived',
      playerId: toPlayerId,
      timestamp: Date.now(),
      data: { fromPlayerId, fromPlayerName, requestId: request.id },
    });

    return request;
  }

  /**
   * 接受好友请求
   */
  acceptFriendRequest(playerId: string, requestId: string): boolean {
    this.initializePlayer(playerId);

    const requests = this.friendRequests.get(playerId);
    if (!requests) {
      return false;
    }

    const requestIndex = requests.findIndex((req) => req.id === requestId);
    if (requestIndex === -1) {
      return false;
    }

    const request = requests[requestIndex];
    requests.splice(requestIndex, 1);

    // 创建双向好友关系
    this.addFriend(playerId, request.fromPlayerId, request.fromPlayerName, request.fromPlayerAvatar);
    this.addFriend(request.fromPlayerId, playerId, '', ''); // 名字和头像需要从其他地方获取

    this.emitEvent({
      type: 'friendRequestAccepted',
      playerId,
      timestamp: Date.now(),
      data: { fromPlayerId: request.fromPlayerId },
    });

    return true;
  }

  /**
   * 拒绝好友请求
   */
  rejectFriendRequest(playerId: string, requestId: string): boolean {
    this.initializePlayer(playerId);

    const requests = this.friendRequests.get(playerId);
    if (!requests) {
      return false;
    }

    const requestIndex = requests.findIndex((req) => req.id === requestId);
    if (requestIndex === -1) {
      return false;
    }

    const request = requests[requestIndex];
    requests.splice(requestIndex, 1);

    this.emitEvent({
      type: 'friendRequestRejected',
      playerId,
      timestamp: Date.now(),
      data: { fromPlayerId: request.fromPlayerId },
    });

    return true;
  }

  /**
   * 添加好友
   */
  private addFriend(
    playerId: string,
    friendId: string,
    friendName: string,
    friendAvatar: string
  ): void {
    const friend: Friend = {
      id: friendId,
      playerId,
      name: friendName,
      avatar: friendAvatar,
      level: 1,
      onlineStatus: 'offline',
      lastSeenAt: Date.now(),
      addedAt: Date.now(),
      isFavorite: false,
    };

    this.friends.set(`${playerId}_${friendId}`, friend);

    this.emitEvent({
      type: 'friendAdded',
      playerId,
      timestamp: Date.now(),
      data: { friendId, friendName },
    });
  }

  /**
   * 删除好友
   */
  removeFriend(playerId: string, friendId: string): boolean {
    const key = `${playerId}_${friendId}`;
    if (this.friends.has(key)) {
      this.friends.delete(key);

      this.emitEvent({
        type: 'friendRemoved',
        playerId,
        timestamp: Date.now(),
        data: { friendId },
      });

      return true;
    }

    return false;
  }

  /**
   * 获取好友列表
   */
  getFriendsList(playerId: string): Friend[] {
    const friends: Friend[] = [];
    this.friends.forEach((friend) => {
      if (friend.playerId === playerId) {
        friends.push(friend);
      }
    });

    // 按在线状态和最后见面时间排序
    return friends.sort((a, b) => {
      const statusOrder = { online: 0, away: 1, busy: 2, offline: 3 };
      const statusDiff =
        statusOrder[a.onlineStatus as keyof typeof statusOrder] -
        statusOrder[b.onlineStatus as keyof typeof statusOrder];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return b.lastSeenAt - a.lastSeenAt;
    });
  }

  /**
   * 获取在线好友
   */
  getOnlineFriends(playerId: string): Friend[] {
    return this.getFriendsList(playerId).filter((f) => f.onlineStatus === 'online');
  }

  /**
   * 检查是否是好友
   */
  isFriend(playerId: string, friendId: string): boolean {
    return this.friends.has(`${playerId}_${friendId}`);
  }

  /**
   * 屏蔽玩家
   */
  blockPlayer(playerId: string, blockedId: string, blockedName: string, blockedAvatar: string, reason?: string): boolean {
    this.initializePlayer(playerId);

    // 检查是否已屏蔽
    const blocked = this.blockedPlayers.get(playerId)?.find((b) => b.playerId === blockedId);
    if (blocked) {
      return false;
    }

    const blockedPlayer: BlockedPlayer = {
      id: blockedId,
      playerId: blockedId,
      name: blockedName,
      avatar: blockedAvatar,
      blockedAt: Date.now(),
      reason,
    };

    this.blockedPlayers.get(playerId)?.push(blockedPlayer);

    // 删除好友关系
    this.removeFriend(playerId, blockedId);

    this.emitEvent({
      type: 'playerBlocked',
      playerId,
      timestamp: Date.now(),
      data: { blockedId, blockedName },
    });

    return true;
  }

  /**
   * 取消屏蔽玩家
   */
  unblockPlayer(playerId: string, blockedId: string): boolean {
    const blocked = this.blockedPlayers.get(playerId);
    if (!blocked) {
      return false;
    }

    const index = blocked.findIndex((b) => b.playerId === blockedId);
    if (index === -1) {
      return false;
    }

    blocked.splice(index, 1);

    this.emitEvent({
      type: 'playerUnblocked',
      playerId,
      timestamp: Date.now(),
      data: { blockedId },
    });

    return true;
  }

  /**
   * 获取屏蔽列表
   */
  getBlockedList(playerId: string): BlockedPlayer[] {
    return this.blockedPlayers.get(playerId) || [];
  }

  /**
   * 检查是否被屏蔽
   */
  isBlocked(playerId: string, checkId: string): boolean {
    return this.blockedPlayers.get(playerId)?.some((b) => b.playerId === checkId) || false;
  }

  /**
   * 发送私聊消息
   */
  sendPrivateMessage(
    fromPlayerId: string,
    fromPlayerName: string,
    toPlayerId: string,
    content: string,
    type: 'text' | 'gift' | 'invite' | 'system' = 'text'
  ): PrivateMessage | null {
    // 检查是否被屏蔽
    if (this.isBlocked(toPlayerId, fromPlayerId)) {
      return null;
    }

    const message: PrivateMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromPlayerId,
      fromPlayerName,
      toPlayerId,
      content,
      timestamp: Date.now(),
      read: false,
      type,
    };

    // 获取或创建聊天会话
    let session = this.getChatSession(toPlayerId, fromPlayerId);
    if (!session) {
      session = {
        playerId: fromPlayerId,
        playerName: fromPlayerName,
        playerAvatar: '',
        onlineStatus: 'offline',
        unreadCount: 0,
        messages: [],
      };
      const sessions = this.chatSessions.get(toPlayerId);
      if (sessions instanceof Map) {
        sessions.set(fromPlayerId, session);
      }
    }

    session.messages.push(message);
    session.lastMessage = message;
    session.unreadCount++;

    this.emitEvent({
      type: 'privateMessageReceived',
      playerId: toPlayerId,
      timestamp: Date.now(),
      data: { fromPlayerId, messageId: message.id, content },
    });

    return message;
  }

  /**
   * 获取聊天会话
   */
  getChatSession(playerId: string, friendId: string): ChatSession | null {
    const sessions = this.chatSessions.get(playerId);
    if (sessions instanceof Map) {
      return sessions.get(friendId) || null;
    }
    return null;
  }

  /**
   * 获取所有聊天会话
   */
  getChatSessions(playerId: string): ChatSession[] {
    const sessions = this.chatSessions.get(playerId);
    if (sessions instanceof Map) {
      const result: ChatSession[] = [];
      sessions.forEach((session) => {
        result.push(session);
      });
      return result.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        return bTime - aTime;
      });
    }
    return [];
  }

  /**
   * 标记消息为已读
   */
  markMessagesAsRead(playerId: string, friendId: string): void {
    const session = this.getChatSession(playerId, friendId);
    if (session) {
      session.messages.forEach((msg) => {
        msg.read = true;
      });
      session.unreadCount = 0;
    }
  }

  /**
   * 获取未读消息数
   */
  getUnreadCount(playerId: string): number {
    const sessions = this.chatSessions.get(playerId);
    if (sessions instanceof Map) {
      let count = 0;
      sessions.forEach((session) => {
        count += session.unreadCount;
      });
      return count;
    }
    return 0;
  }

  /**
   * 更新在线状态
   */
  updateOnlineStatus(playerId: string, status: OnlineStatus): void {
    // 更新所有包含该玩家的好友关系
    this.friends.forEach((friend) => {
      if (friend.id === playerId) {
        friend.onlineStatus = status;
        friend.lastSeenAt = Date.now();
      }
    });

    this.emitEvent({
      type: 'onlineStatusChanged',
      playerId,
      timestamp: Date.now(),
      data: { status },
    });
  }

  /**
   * 切换收藏好友
   */
  toggleFavorite(playerId: string, friendId: string): boolean {
    const key = `${playerId}_${friendId}`;
    const friend = this.friends.get(key);
    if (friend) {
      friend.isFavorite = !friend.isFavorite;

      this.emitEvent({
        type: 'favoriteToggled',
        playerId,
        timestamp: Date.now(),
        data: { friendId, isFavorite: friend.isFavorite },
      });

      return true;
    }

    return false;
  }

  /**
   * 获取待处理的好友请求
   */
  getPendingRequests(playerId: string): FriendRequest[] {
    const requests = this.friendRequests.get(playerId) || [];
    // 过滤过期的请求
    return requests.filter((req) => req.expiresAt > Date.now());
  }

  /**
   * 搜索玩家
   */
  searchFriends(playerId: string, keyword: string): Friend[] {
    const friends = this.getFriendsList(playerId);
    const lowerKeyword = keyword.toLowerCase();
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(lowerKeyword) ||
        f.id.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: FriendEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: FriendEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: FriendEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  /**
   * 获取好友统计
   */
  getFriendsStats(playerId: string): {
    totalFriends: number;
    onlineFriends: number;
    pendingRequests: number;
    blockedPlayers: number;
  } {
    return {
      totalFriends: this.getFriendsList(playerId).length,
      onlineFriends: this.getOnlineFriends(playerId).length,
      pendingRequests: this.getPendingRequests(playerId).length,
      blockedPlayers: this.getBlockedList(playerId).length,
    };
  }
}
