/**
 * ICE Snow City API React Hooks
 * 提供简化的 API 调用和状态管理
 */

import { useState, useCallback, useEffect } from "react";
import { iceSnowCityApi } from "@/lib/api/ice-snow-city-client";
import { ApiErrorResponse } from "@/lib/api/ice-snow-city-types";
import { toast } from "sonner";

// ========== 通用 Hook ==========

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiErrorResponse | null;
}

/**
 * 通用 API 查询 Hook
 */
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await queryFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const apiError = error instanceof ApiErrorResponse
        ? error
        : new ApiErrorResponse(500, "UNKNOWN_ERROR", String(error));
      setState({ data: null, loading: false, error: apiError });
      toast.error(apiError.message);
    }
  }, [queryFn]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { ...state, refetch };
}

/**
 * 通用 API 变更 Hook
 */
export function useApiMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (params: P) => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await mutationFn(params);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const apiError = error instanceof ApiErrorResponse
          ? error
          : new ApiErrorResponse(500, "UNKNOWN_ERROR", String(error));
        setState({ data: null, loading: false, error: apiError });
        throw apiError;
      }
    },
    [mutationFn]
  );

  return { ...state, mutate };
}

// ========== 社交系统 Hook ==========

/**
 * 好友列表 Hook
 */
export function useFriends(status?: string) {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getFriendsList(status),
    [status]
  );

  const addFriend = useApiMutation(
    async (params: { friendId: string; message?: string }) =>
      iceSnowCityApi.addFriend(params.friendId, params.message)
  );

  const removeFriend = useApiMutation(
    async (friendId: string) => {
      await iceSnowCityApi.removeFriend(friendId);
      refetch();
    }
  );

  return {
    friends: data?.items || [],
    total: data?.total || 0,
    loading,
    error,
    refetch,
    addFriend: addFriend.mutate,
    removeFriend: removeFriend.mutate,
    isAddingFriend: addFriend.loading,
    isRemovingFriend: removeFriend.loading,
  };
}

/**
 * 好友请求 Hook
 */
export function useFriendRequests() {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getFriendRequests()
  );

  const acceptRequest = useApiMutation(
    async (requestId: string) => {
      await iceSnowCityApi.acceptFriendRequest(requestId);
      refetch();
    }
  );

  const rejectRequest = useApiMutation(
    async (requestId: string) => {
      await iceSnowCityApi.rejectFriendRequest(requestId);
      refetch();
    }
  );

  return {
    requests: data?.items || [],
    total: data?.total || 0,
    loading,
    error,
    refetch,
    acceptRequest: acceptRequest.mutate,
    rejectRequest: rejectRequest.mutate,
    isAccepting: acceptRequest.loading,
    isRejecting: rejectRequest.loading,
  };
}

/**
 * 聊天 Hook
 */
export function useChat(friendId: string) {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getChatHistory(friendId),
    [friendId]
  );

  const sendMessage = useApiMutation(
    async (params: { content: string; type?: string }) =>
      iceSnowCityApi.sendChatMessage(
        friendId,
        params.content,
        params.type || "text"
      )
  );

  const markAsRead = useCallback(async () => {
    await iceSnowCityApi.markMessagesAsRead(friendId);
  }, [friendId]);

  return {
    messages: data?.items || [],
    loading,
    error,
    refetch,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.loading,
    markAsRead,
  };
}

/**
 * 工会 Hook
 */
export function useGuild(guildId?: string) {
  const { data, loading, error, refetch } = useApiQuery(
    () => (guildId ? iceSnowCityApi.getGuildInfo(guildId) : Promise.resolve(null)),
    [guildId]
  );

  const createGuild = useApiMutation(
    async (params: { name: string; description?: string }) =>
      iceSnowCityApi.createGuild(params.name, params.description)
  );

  const joinGuild = useApiMutation(
    async (params: { guildId: string; message?: string }) =>
      iceSnowCityApi.joinGuild(params.guildId, params.message)
  );

  const leaveGuild = useApiMutation(
    async (guildId: string) => {
      await iceSnowCityApi.leaveGuild(guildId);
      refetch();
    }
  );

  return {
    guild: data,
    loading,
    error,
    refetch,
    createGuild: createGuild.mutate,
    joinGuild: joinGuild.mutate,
    leaveGuild: leaveGuild.mutate,
    isCreating: createGuild.loading,
    isJoining: joinGuild.loading,
    isLeaving: leaveGuild.loading,
  };
}

/**
 * 玩家卡片 Hook
 */
export function usePlayerCard(userId: string) {
  const { data, loading, error } = useApiQuery(
    () => iceSnowCityApi.getPlayerCard(userId),
    [userId]
  );

  return { playerCard: data, loading, error };
}

// ========== 装备系统 Hook ==========

/**
 * 装备 Hook
 */
export function useEquipment() {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getEquipment()
  );

  const equipItem = useApiMutation(
    async (params: { equipmentId: string; slot: string }) =>
      iceSnowCityApi.equipItem(params.equipmentId, params.slot)
  );

  const unequipItem = useApiMutation(
    async (slot: string) => {
      await iceSnowCityApi.unequipItem(slot);
      refetch();
    }
  );

  const enhanceEquipment = useApiMutation(
    async (params: { equipmentId: string; materials?: string[]; coins?: number }) =>
      iceSnowCityApi.enhanceEquipment(
        params.equipmentId,
        params.materials,
        params.coins
      )
  );

  const repairEquipment = useApiMutation(
    async (equipmentId: string) =>
      iceSnowCityApi.repairEquipment(equipmentId)
  );

  return {
    equipment: data?.items || [],
    loading,
    error,
    refetch,
    equipItem: equipItem.mutate,
    unequipItem: unequipItem.mutate,
    enhanceEquipment: enhanceEquipment.mutate,
    repairEquipment: repairEquipment.mutate,
    isEquipping: equipItem.loading,
    isUnequipping: unequipItem.loading,
    isEnhancing: enhanceEquipment.loading,
    isRepairing: repairEquipment.loading,
  };
}

/**
 * 装备属性 Hook
 */
export function useEquipmentStats() {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getEquipmentStats()
  );

  return { stats: data, loading, error, refetch };
}

// ========== 成就系统 Hook ==========

/**
 * 成就 Hook
 */
export function useAchievements(status?: string, category?: string) {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getAchievements(status, category),
    [status, category]
  );

  return {
    achievements: data?.items || [],
    total: data?.total || 0,
    loading,
    error,
    refetch,
  };
}

/**
 * 排行榜 Hook
 */
export function useLeaderboard(type: string = "points", limit: number = 100) {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getLeaderboard(type, limit),
    [type, limit]
  );

  return {
    leaderboard: data?.items || [],
    userRank: data?.userRank,
    userValue: data?.userValue,
    loading,
    error,
    refetch,
  };
}

// ========== 经济系统 Hook ==========

/**
 * 玩家资产 Hook
 */
export function usePlayerAssets() {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getPlayerAssets()
  );

  const depositToBank = useApiMutation(
    async (amount: number) => {
      await iceSnowCityApi.depositToBank(amount);
      refetch();
    }
  );

  const withdrawFromBank = useApiMutation(
    async (amount: number) => {
      await iceSnowCityApi.withdrawFromBank(amount);
      refetch();
    }
  );

  return {
    assets: data,
    loading,
    error,
    refetch,
    depositToBank: depositToBank.mutate,
    withdrawFromBank: withdrawFromBank.mutate,
    isDepositing: depositToBank.loading,
    isWithdrawing: withdrawFromBank.loading,
  };
}

/**
 * 商城 Hook
 */
export function useShop(category?: string) {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getShopItems(category),
    [category]
  );

  const buyItem = useApiMutation(
    async (params: { itemId: string; quantity?: number }) =>
      iceSnowCityApi.buyItem(params.itemId, params.quantity || 1)
  );

  return {
    items: data?.items || [],
    total: data?.total || 0,
    loading,
    error,
    refetch,
    buyItem: buyItem.mutate,
    isBuying: buyItem.loading,
  };
}

// ========== 游戏场景 Hook ==========

/**
 * NPC Hook
 */
export function useNPCs() {
  const { data, loading, error } = useApiQuery(
    () => iceSnowCityApi.getNPCList()
  );

  const interactWithNPC = useApiMutation(
    async (params: { npcId: string; actionType?: string }) =>
      iceSnowCityApi.interactWithNPC(params.npcId, params.actionType || "talk")
  );

  return {
    npcs: data || [],
    loading,
    error,
    interactWithNPC: interactWithNPC.mutate,
    isInteracting: interactWithNPC.loading,
  };
}

/**
 * 任务 Hook
 */
export function useQuests(status?: string) {
  const { data, loading, error, refetch } = useApiQuery(
    () => iceSnowCityApi.getQuests(status),
    [status]
  );

  const completeQuest = useApiMutation(
    async (questId: string) => {
      await iceSnowCityApi.completeQuest(questId);
      refetch();
    }
  );

  return {
    quests: data || [],
    loading,
    error,
    refetch,
    completeQuest: completeQuest.mutate,
    isCompleting: completeQuest.loading,
  };
}
