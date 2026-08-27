/**
 * 好友系统管理器
 * 管理好友列表、好友请求、黑名单等
 */

export type FriendStatus = 'online' | 'offline' | 'busy' | 'away';

export interface Friend {
  id: string;
  name: string;
  level: number;
  status: FriendStatus;
  lastSeen: number;
  avatar?: string;
  signature?: string;
  addedAt: number;
  isFavorite: boolean;
  tags?: string[];
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  message?: string;
  createdAt: number;
}

export interface BlockedUser {
  id: string;
  name: string;
  blockedAt: number;
}

export class FriendsManager {
  private friends: Map<string, Friend> = new Map();
  private friendRequests: Map<string, FriendRequest> = new Map();
  private blockedUsers: Map<string, BlockedUser> = new Map();
  private listeners: {
    onFriendsChange: Array<(friends: Friend[]) => void>;
    onRequestsChange: Array<(requests: FriendRequest[]) => void>;
    onBlockedChange: Array<(blocked: BlockedUser[]) => void>;
    onFriendStatusChange: Array<(friendId: string, status: FriendStatus) => void>;
  } = {
    onFriendsChange: [],
    onRequestsChange: [],
    onBlockedChange: [],
    onFriendStatusChange: [],
  };

  /**
   * 添加好友
   */
  addFriend(friend: Friend): void {
    this.friends.set(friend.id, friend);
    this.notifyListeners('onFriendsChange', this.getFriends());
  }

  /**
   * 移除好友
   */
  removeFriend(friendId: string): void {
    this.friends.delete(friendId);
    this.notifyListeners('onFriendsChange', this.getFriends());
  }

  /**
   * 获取好友列表
   */
  getFriends(): Friend[] {
    return Array.from(this.friends.values());
  }

  /**
   * 获取在线好友
   */
  getOnlineFriends(): Friend[] {
    return this.getFriends().filter((f) => f.status === 'online');
  }

  /**
   * 获取离线好友
   */
  getOfflineFriends(): Friend[] {
    return this.getFriends().filter((f) => f.status === 'offline');
  }

  /**
   * 获取收藏的好友
   */
  getFavoriteFriends(): Friend[] {
    return this.getFriends().filter((f) => f.isFavorite);
  }

  /**
   * 切换好友收藏状态
   */
  toggleFavoriteFriend(friendId: string): void {
    const friend = this.friends.get(friendId);
    if (friend) {
      friend.isFavorite = !friend.isFavorite;
      this.notifyListeners('onFriendsChange', this.getFriends());
    }
  }

  /**
   * 添加好友标签
   */
  addFriendTag(friendId: string, tag: string): void {
    const friend = this.friends.get(friendId);
    if (friend) {
      if (!friend.tags) {
        friend.tags = [];
      }
      if (!friend.tags.includes(tag)) {
        friend.tags.push(tag);
        this.notifyListeners('onFriendsChange', this.getFriends());
      }
    }
  }

  /**
   * 移除好友标签
   */
  removeFriendTag(friendId: string, tag: string): void {
    const friend = this.friends.get(friendId);
    if (friend && friend.tags) {
      friend.tags = friend.tags.filter((t) => t !== tag);
      this.notifyListeners('onFriendsChange', this.getFriends());
    }
  }

  /**
   * 更新好友状态
   */
  updateFriendStatus(friendId: string, status: FriendStatus): void {
    const friend = this.friends.get(friendId);
    if (friend) {
      friend.status = status;
      if (status !== 'offline') {
        friend.lastSeen = Date.now();
      }
      this.notifyListeners('onFriendsChange', this.getFriends());
      this.notifyListeners('onFriendStatusChange', friendId, status);
    }
  }

  /**
   * 添加好友请求
   */
  addFriendRequest(request: FriendRequest): void {
    this.friendRequests.set(request.id, request);
    this.notifyListeners('onRequestsChange', this.getFriendRequests());
  }

  /**
   * 获取好友请求列表
   */
  getFriendRequests(): FriendRequest[] {
    return Array.from(this.friendRequests.values());
  }

  /**
   * 接受好友请求
   */
  acceptFriendRequest(requestId: string): Friend | null {
    const request = this.friendRequests.get(requestId);
    if (!request) return null;

    const newFriend: Friend = {
      id: request.fromId,
      name: request.fromName,
      level: 1,
      status: 'offline',
      lastSeen: Date.now(),
      avatar: request.fromAvatar,
      addedAt: Date.now(),
      isFavorite: false,
    };

    this.addFriend(newFriend);
    this.friendRequests.delete(requestId);
    this.notifyListeners('onRequestsChange', this.getFriendRequests());

    return newFriend;
  }

  /**
   * 拒绝好友请求
   */
  rejectFriendRequest(requestId: string): void {
    this.friendRequests.delete(requestId);
    this.notifyListeners('onRequestsChange', this.getFriendRequests());
  }

  /**
   * 屏蔽用户
   */
  blockUser(userId: string, userName: string): void {
    const blocked: BlockedUser = {
      id: userId,
      name: userName,
      blockedAt: Date.now(),
    };
    this.blockedUsers.set(userId, blocked);
    this.notifyListeners('onBlockedChange', this.getBlockedUsers());
  }

  /**
   * 取消屏蔽用户
   */
  unblockUser(userId: string): void {
    this.blockedUsers.delete(userId);
    this.notifyListeners('onBlockedChange', this.getBlockedUsers());
  }

  /**
   * 获取屏蔽列表
   */
  getBlockedUsers(): BlockedUser[] {
    return Array.from(this.blockedUsers.values());
  }

  /**
   * 检查用户是否被屏蔽
   */
  isUserBlocked(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  /**
   * 获取好友数量
   */
  getFriendCount(): number {
    return this.friends.size;
  }

  /**
   * 获取在线好友数量
   */
  getOnlineFriendCount(): number {
    return this.getOnlineFriends().length;
  }

  /**
   * 搜索好友
   */
  searchFriends(query: string): Friend[] {
    const lowerQuery = query.toLowerCase();
    return this.getFriends().filter(
      (f) =>
        f.name.toLowerCase().includes(lowerQuery) ||
        (f.tags && f.tags.some((t) => t.toLowerCase().includes(lowerQuery)))
    );
  }

  /**
   * 订阅好友列表变化
   */
  onFriendsChange(listener: (friends: Friend[]) => void): () => void {
    this.listeners.onFriendsChange.push(listener);
    return () => {
      this.listeners.onFriendsChange = this.listeners.onFriendsChange.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅好友请求变化
   */
  onRequestsChange(listener: (requests: FriendRequest[]) => void): () => void {
    this.listeners.onRequestsChange.push(listener);
    return () => {
      this.listeners.onRequestsChange = this.listeners.onRequestsChange.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅屏蔽列表变化
   */
  onBlockedChange(listener: (blocked: BlockedUser[]) => void): () => void {
    this.listeners.onBlockedChange.push(listener);
    return () => {
      this.listeners.onBlockedChange = this.listeners.onBlockedChange.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅好友状态变化
   */
  onFriendStatusChange(
    listener: (friendId: string, status: FriendStatus) => void
  ): () => void {
    this.listeners.onFriendStatusChange.push(listener);
    return () => {
      this.listeners.onFriendStatusChange = this.listeners.onFriendStatusChange.filter(
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
let friendsManagerInstance: FriendsManager | null = null;

export function getFriendsManager(): FriendsManager {
  if (!friendsManagerInstance) {
    friendsManagerInstance = new FriendsManager();
  }
  return friendsManagerInstance;
}
