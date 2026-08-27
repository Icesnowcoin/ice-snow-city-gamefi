/**
 * 好友列表 UI 组件
 * 显示好友列表、好友请求、屏蔽列表
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  UserPlus,
  MessageCircle,
  Trash2,
  Search,
  Star,
  Shield,
  Send,
  X,
  Clock,
  MoreVertical,
  Circle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Friend, FriendRequest, BlockedPlayer, OnlineStatus } from '@/game/social/FriendManager';
import { EmptyState, OnlineIndicator, StatusBadge, StatusGroupHeader } from './EmptyState';
import PlayerInfoCard from './PlayerInfoCard';
import './friends-list.css';

export interface FriendsListProps {
  friends: Friend[];
  onlineFriends: number;
  pendingRequests: FriendRequest[];
  blockedPlayers: BlockedPlayer[];
  onAddFriend?: (userId: string, userName: string, userAvatar: string) => void;
  onRemoveFriend?: (friendId: string) => void;
  onBlockPlayer?: (friendId: string, friendName: string, friendAvatar: string) => void;
  onUnblockPlayer?: (playerId: string) => void;
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onOpenChat?: (friendId: string, friendName: string) => void;
  onToggleFavorite?: (friendId: string) => void;
  currentPlayerId?: string;
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

export const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  onlineFriends,
  pendingRequests,
  blockedPlayers,
  onAddFriend,
  onRemoveFriend,
  onBlockPlayer,
  onUnblockPlayer,
  onAcceptRequest,
  onRejectRequest,
  onOpenChat,
  onToggleFavorite,
  currentPlayerId,
}) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendId, setAddFriendId] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // 分类好友列表
  const favoriteFriends = useMemo(
    () => friends.filter((f) => f.isFavorite),
    [friends]
  );

  const onlineFriendsList = useMemo(
    () => friends.filter((f) => f.onlineStatus === 'online'),
    [friends]
  );

  const offlineFriendsList = useMemo(
    () => friends.filter((f) => f.onlineStatus === 'offline'),
    [friends]
  );

  // 搜索过滤
  const filteredFriends = useMemo(() => {
    const keyword = searchKeyword.toLowerCase();
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(keyword) ||
        f.id.toLowerCase().includes(keyword)
    );
  }, [friends, searchKeyword]);

  const renderFriendItem = (friend: Friend) => (
    <React.Fragment key={friend.id}>
      <div className={`friend-item status-${friend.onlineStatus}`}>
      <div className="friend-avatar-wrapper">
        <Avatar className="friend-avatar">
          <AvatarImage src={friend.avatar} alt={friend.name} />
          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <OnlineIndicator status={friend.onlineStatus} size="md" animated />
      </div>

      <div className="friend-info">
        <div className="friend-header">
          <button
            type="button"
            className="friend-name text-left"
            onClick={() => setSelectedFriendId(friend.id)}
          >
            {friend.name}
          </button>
          <Badge variant="outline" className="friend-level">
            Lv.{friend.level}
          </Badge>
        </div>
        <div className="friend-status-wrapper">
          <StatusBadge status={friend.onlineStatus} showLabel size="sm" />
          {friend.onlineStatus === 'offline' && friend.lastSeenAt && (
            <span className="last-seen-time">
              最后在线 {formatTime(friend.lastSeenAt)}
            </span>
          )}
        </div>
      </div>

      <div className="friend-actions">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpenChat?.(friend.id, friend.name)}
          className="action-btn chat-btn"
          title="私聊"
        >
          <MessageCircle className="icon" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleFavorite?.(friend.id)}
          className={`action-btn favorite-btn ${friend.isFavorite ? 'active' : ''}`}
          title="收藏"
        >
          <Star className="icon" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="action-btn">
              <MoreVertical className="icon" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemoveFriend?.(friend.id)}>
              <Trash2 className="icon" />
              删除好友
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBlockPlayer?.(friend.id, friend.name, friend.avatar)}>
              <Shield className="icon" />
              屏蔽玩家
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
      {selectedFriendId === friend.id && (
        <PlayerInfoCard
          isOpen
          currentUserId={currentPlayerId ?? ''}
          player={{
            userId: friend.playerId,
            userName: friend.name,
            level: friend.level,
            avatar: friend.avatar,
            status: friend.onlineStatus === 'online' ? 'online' : 'offline',
            lastSeen: friend.lastSeenAt,
            isFriend: true,
            walletAddress: friend.walletAddress,
            publicAssetsEnabled: friend.publicAssetsEnabled,
            stats: {
              friendCount: friend.friendCount,
              achievementCount: friend.achievementCount,
            },
          }}
          onClose={() => setSelectedFriendId(null)}
          onSendMessage={(userId) => onOpenChat?.(userId, friend.name)}
          onRemoveFriend={onRemoveFriend}
          onBlock={(userId) => onBlockPlayer?.(userId, friend.name, friend.avatar)}
        />
      )}
    </React.Fragment>
  );

  const renderRequestItem = (request: FriendRequest) => (
    <div key={request.id} className="request-item">
      <div className="request-avatar-wrapper">
        <Avatar className="request-avatar">
          <AvatarImage src={request.fromPlayerAvatar} alt={request.fromPlayerName} />
          <AvatarFallback>{request.fromPlayerName.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="request-info">
        <div className="request-name">{request.fromPlayerName}</div>
        {request.message && (
          <div className="request-message">{request.message}</div>
        )}
        <div className="request-time">
          <Clock className="icon" />
          {formatTime(request.createdAt)}
        </div>
      </div>

      <div className="request-actions">
        <Button
          size="sm"
          onClick={() => onAcceptRequest?.(request.id)}
          className="accept-btn"
        >
          接受
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRejectRequest?.(request.id)}
          className="reject-btn"
        >
          拒绝
        </Button>
      </div>
    </div>
  );

  const renderBlockedItem = (blocked: BlockedPlayer) => (
    <div key={blocked.id} className="blocked-item">
      <div className="blocked-avatar-wrapper">
        <Avatar className="blocked-avatar">
          <AvatarImage src={blocked.avatar} alt={blocked.name} />
          <AvatarFallback>{blocked.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="blocked-info">
        <div className="blocked-name">{blocked.name}</div>
        {blocked.reason && (
          <div className="blocked-reason">原因: {blocked.reason}</div>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => onUnblockPlayer?.(blocked.playerId)}
        className="unblock-btn"
      >
        解除屏蔽
      </Button>
    </div>
  );

  return (
    <div className="friends-list">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="friends-tabs">
        <TabsList>
          <TabsTrigger value="friends">
            <Users className="icon" />
            好友 ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <UserPlus className="icon" />
            请求 ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="blocked">
            <Shield className="icon" />
            屏蔽 ({blockedPlayers.length})
          </TabsTrigger>
        </TabsList>

        {/* 好友标签页 */}
        <TabsContent value="friends" className="tab-content">
          <div className="friends-header">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <Input
                placeholder="搜索好友..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
              />
            </div>
            <Button
              onClick={() => setShowAddFriend(!showAddFriend)}
              className="add-friend-btn"
            >
              <UserPlus className="icon" />
              添加好友
            </Button>
          </div>

          {showAddFriend && (
            <Card className="add-friend-card">
              <div className="add-friend-form">
                <Input
                  placeholder="输入玩家 ID..."
                  value={addFriendId}
                  onChange={(e) => setAddFriendId(e.target.value)}
                  className="friend-id-input"
                />
                <div className="add-friend-actions">
                  <Button
                    onClick={() => {
                      onAddFriend?.(addFriendId, '玩家', '');
                      setAddFriendId('');
                      setShowAddFriend(false);
                    }}
                    className="send-btn"
                  >
                    <Send className="icon" />
                    发送请求
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddFriend(false)}
                    className="cancel-btn"
                  >
                    <X className="icon" />
                    取消
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 在线状态统计 */}
          <div className="friends-stats">
            <div className="stat-item">
              <div className="stat-label">在线好友</div>
              <div className="stat-value">{onlineFriends}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">总好友数</div>
              <div className="stat-value">{friends.length}</div>
            </div>
          </div>

            {/* 收藏好友 */}
          {favoriteFriends.length > 0 && (
            <div className="friends-section">
              <StatusGroupHeader status="favorites" count={favoriteFriends.length} />
              <ScrollArea className="friends-scroll">
                {favoriteFriends.map((friend) => renderFriendItem(friend))}
              </ScrollArea>
            </div>
          )}

          {/* 在线好友 */}
          {onlineFriendsList.length > 0 && (
            <div className="friends-section">
              <StatusGroupHeader status="online" count={onlineFriendsList.length} />
              <ScrollArea className="friends-scroll">
                {onlineFriendsList.map((friend) => renderFriendItem(friend))}
              </ScrollArea>
            </div>
          )}

          {/* 离线好友 */}
          {offlineFriendsList.length > 0 && (
            <div className="friends-section">
              <StatusGroupHeader status="offline" count={offlineFriendsList.length} />
              <ScrollArea className="friends-scroll">
                {offlineFriendsList.map((friend) => renderFriendItem(friend))}
              </ScrollArea>
            </div>
          )}

          {/* 搜索结果 */}
          {searchKeyword && filteredFriends.length > 0 && (
            <div className="friends-section">
              <h4 className="section-title">搜索结果 ({filteredFriends.length})</h4>
              <ScrollArea className="friends-scroll">
                {filteredFriends.map((friend) => renderFriendItem(friend))}
              </ScrollArea>
            </div>
          )}

          {/* 搜索空状态 */}
          {searchKeyword && filteredFriends.length === 0 && (
            <EmptyState type="search-empty" />
          )}

          {friends.length === 0 && !showAddFriend && (
            <EmptyState
              type="no-friends"
              onAction={() => setShowAddFriend(true)}
            />
          )}
        </TabsContent>

        {/* 请求标签页 */}
        <TabsContent value="requests" className="tab-content">
          <ScrollArea className="requests-scroll">
            {pendingRequests.length === 0 ? (
              <EmptyState type="no-requests" />
            ) : (
              pendingRequests.map((request) => renderRequestItem(request))
            )}
          </ScrollArea>
        </TabsContent>

        {/* 屏蔽标签页 */}
        <TabsContent value="blocked" className="tab-content">
          <ScrollArea className="blocked-scroll">
            {blockedPlayers.length === 0 ? (
              <EmptyState type="no-blocked" />
            ) : (
              blockedPlayers.map((blocked) => renderBlockedItem(blocked))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * 格式化时间显示
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes} 分钟前`;
  } else if (hours < 24) {
    return `${hours} 小时前`;
  } else if (days < 7) {
    return `${days} 天前`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  }
}

export default FriendsList;
