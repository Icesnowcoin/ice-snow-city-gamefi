import React, { useState, useEffect, useCallback } from 'react';
import { FriendManager, Friend, FriendRequest, BlockedPlayer, FriendEvent } from '@/game/social/FriendManager';
import FriendsList from './FriendsList';
import { toastService } from '@/lib/toast-service';

interface FriendsListContainerProps {
  playerId: string;
  friendManager: FriendManager;
  onOpenChat?: (friendId: string, friendName: string) => void;
}

export const FriendsListContainer: React.FC<FriendsListContainerProps> = ({
  playerId,
  friendManager,
  onOpenChat,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [onlineFriends, setOnlineFriends] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [blockedPlayers, setBlockedPlayers] = useState<BlockedPlayer[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // 初始化玩家数据
  useEffect(() => {
    friendManager.initializePlayer(playerId);
    updateFriendsData();

    // 监听事件
    const handleEvent = (event: FriendEvent) => {
      if (event.playerId === playerId || event.data.playerId === playerId) {
        updateFriendsData();
      }
    };

    friendManager.addEventListener(handleEvent);

    return () => {
      friendManager.removeEventListener(handleEvent);
    };
  }, [playerId, friendManager]);

  /**
   * 更新好友数据
   */
  const updateFriendsData = useCallback(() => {
    const friendsList = friendManager.getFriendsList(playerId);
    const onlineCount = friendManager.getOnlineFriends(playerId).length;
    const requests = friendManager.getPendingRequests(playerId);
    const blocked = friendManager.getBlockedList(playerId);

    setFriends(friendsList);
    setOnlineFriends(onlineCount);
    setPendingRequests(requests);
    setBlockedPlayers(blocked);
  }, [playerId, friendManager]);

  /**
   * 设置加载状态
   */
  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  /**
   * 添加好友
   */
  const handleAddFriend = useCallback(
    async (targetPlayerId: string, targetPlayerName: string, targetPlayerAvatar: string) => {
      if (!targetPlayerId.trim()) {
        toastService.warning('请输入玩家 ID');
        return;
      }

      const key = `add-${targetPlayerId}`;
      setLoading(key, true);
      const toastId = toastService.loading('正在发送好友请求...');

      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 500));

        const request = friendManager.sendFriendRequest(
          playerId,
          '当前玩家',
          '',
          targetPlayerId,
          '我想加你为好友'
        );

        if (request) {
          toastService.update(toastId, '好友请求已发送', 'success');
          updateFriendsData();
        } else {
          toastService.update(
            toastId,
            '无法发送好友请求（可能已是好友、已屏蔽或已有待处理请求）',
            'error'
          );
        }
      } catch (error) {
        toastService.update(toastId, '发送好友请求失败', 'error');
      } finally {
        setLoading(key, false);
      }
    },
    [playerId, friendManager, setLoading, updateFriendsData]
  );

  /**
   * 删除好友
   */
  const handleRemoveFriend = useCallback(
    async (friendId: string) => {
      const key = `remove-${friendId}`;
      setLoading(key, true);
      const toastId = toastService.loading('正在删除好友...');

      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 500));

        const success = friendManager.removeFriend(playerId, friendId);
        if (success) {
          updateFriendsData();
          toastService.update(toastId, '好友已删除', 'success');
        } else {
          toastService.update(toastId, '删除好友失败', 'error');
        }
      } catch (error) {
        toastService.update(toastId, '删除好友失败', 'error');
      } finally {
        setLoading(key, false);
      }
    },
    [playerId, friendManager, setLoading, updateFriendsData]
  );

  /**
   * 接受好友请求
   */
  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      const key = `accept-${requestId}`;
      setLoading(key, true);
      const toastId = toastService.loading('正在接受好友请求...');

      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 500));

        const success = friendManager.acceptFriendRequest(playerId, requestId);
        if (success) {
          updateFriendsData();
          toastService.update(toastId, '好友请求已接受', 'success');
        } else {
          toastService.update(toastId, '接受好友请求失败', 'error');
        }
      } catch (error) {
        toastService.update(toastId, '接受好友请求失败', 'error');
      } finally {
        setLoading(key, false);
      }
    },
    [playerId, friendManager, setLoading, updateFriendsData]
  );

  /**
   * 拒绝好友请求
   */
  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      const key = `reject-${requestId}`;
      setLoading(key, true);
      const toastId = toastService.loading('正在拒绝好友请求...');

      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 500));

        const success = friendManager.rejectFriendRequest(playerId, requestId);
        if (success) {
          updateFriendsData();
          toastService.update(toastId, '好友请求已拒绝', 'success');
        } else {
          toastService.update(toastId, '拒绝好友请求失败', 'error');
        }
      } catch (error) {
        toastService.update(toastId, '拒绝好友请求失败', 'error');
      } finally {
        setLoading(key, false);
      }
    },
    [playerId, friendManager, setLoading, updateFriendsData]
  );

  /**
   * 屏蔽玩家
   */
  const handleBlockPlayer = useCallback(
    async (friendId: string, friendName: string, friendAvatar: string) => {
      const key = `block-${friendId}`;
      setLoading(key, true);
      const toastId = toastService.loading(`正在屏蔽 ${friendName}...`);

      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 500));

        const success = friendManager.blockPlayer(
          playerId,
          friendId,
          friendName,
          friendAvatar,
          '用户屏蔽'
        );
        if (success) {
          updateFriendsData();
          toastService.update(toastId, `已屏蔽 ${friendName}`, 'success');
        } else {
          toastService.update(toastId, '屏蔽失败', 'error');
        }
      } catch (error) {
        toastService.update(toastId, '屏蔽失败', 'error');
      } finally {
        setLoading(key, false);
      }
    },
    [playerId, friendManager, setLoading, updateFriendsData]
  );

  /**
   * 取消屏蔽玩家
   */
  const handleUnblockPlayer = useCallback(
    async (blockedPlayerId: string) => {
      const key = `unblock-${blockedPlayerId}`;
      setLoading(key, true);
      const toastId = toastService.loading('正在解除屏蔽...');

      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 500));

        const success = friendManager.unblockPlayer(playerId, blockedPlayerId);
        if (success) {
          updateFriendsData();
          toastService.update(toastId, '屏蔽已解除', 'success');
        } else {
          toastService.update(toastId, '解除屏蔽失败', 'error');
        }
      } catch (error) {
        toastService.update(toastId, '解除屏蔽失败', 'error');
      } finally {
        setLoading(key, false);
      }
    },
    [playerId, friendManager, setLoading, updateFriendsData]
  );

  /**
   * 打开聊天
   */
  const handleOpenChat = useCallback(
    (friendId: string, friendName: string) => {
      toastService.info(`正在打开与 ${friendName} 的聊天`);
      onOpenChat?.(friendId, friendName);
    },
    [onOpenChat]
  );

  /**
   * 切换收藏好友
   */
  const handleToggleFavorite = useCallback(
    async (friendId: string) => {
      const friend = friends.find((f) => f.id === friendId);
      const key = `favorite-${friendId}`;
      setLoading(key, true);

      const toastId = toastService.loading(
        friend?.isFavorite ? '正在取消收藏...' : '正在收藏...'
      );

      try {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 300));

        const success = friendManager.toggleFavorite(playerId, friendId);
        if (success) {
          updateFriendsData();
          const message = friend?.isFavorite ? '已取消收藏' : '已收藏';
          toastService.update(toastId, message, 'success');
        } else {
          toastService.update(toastId, '操作失败', 'error');
        }
      } catch (error) {
        toastService.update(toastId, '操作失败', 'error');
      } finally {
        setLoading(key, false);
      }
    },
    [playerId, friendManager, friends, setLoading, updateFriendsData]
  );

  return (
    <FriendsList
      friends={friends}
      onlineFriends={onlineFriends}
      pendingRequests={pendingRequests}
      blockedPlayers={blockedPlayers}
      onAddFriend={handleAddFriend}
      onRemoveFriend={handleRemoveFriend}
      onBlockPlayer={handleBlockPlayer}
      onUnblockPlayer={handleUnblockPlayer}
      onAcceptRequest={handleAcceptRequest}
      onRejectRequest={handleRejectRequest}
      onOpenChat={handleOpenChat}
      onToggleFavorite={handleToggleFavorite}
      currentPlayerId={playerId}
    />
  );
};

export default FriendsListContainer;
