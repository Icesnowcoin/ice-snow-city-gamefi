/**
 * ICE Snow City API 客户端
 * 提供所有游戏系统的 API 调用方法
 */

import { apiClient } from "./client";
import {
  Friend,
  FriendRequest,
  ChatMessage,
  ChatSession,
  Guild,
  GuildMember,
  PlayerCard,
  Equipment,
  PlayerEquipment,
  Achievement,
  Leaderboard,
  LeaderboardData,
  PlayerAssets,
  ShopItem,
  PurchaseResult,
  BankTransaction,
  Transaction,
  NPC,
  Dialogue,
  GameEvent,
  Quest,
  User,
  PaginatedResponse,
  ApiResponse,
} from "./ice-snow-city-types";

export class IceSnowCityApiClient {
  private baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

  // ========== 社交系统 ==========

  /**
   * 获取好友列表
   */
  async getFriendsList(
    status?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Friend>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Friend>>>(
      `/social/friends?${params}`
    );
    return response.data;
  }

  /**
   * 添加好友
   */
  async addFriend(friendId: string, message?: string): Promise<Friend> {
    const response = await apiClient.post<ApiResponse<Friend>>("/social/friends/add", {
      friendId,
      message,
    });
    return response.data;
  }

  /**
   * 删除好友
   */
  async removeFriend(friendId: string): Promise<void> {
    await apiClient.delete(`/social/friends/${friendId}`);
  }

  /**
   * 获取好友请求列表
   */
  async getFriendRequests(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<FriendRequest>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<FriendRequest>>
    >(`/social/friend-requests?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  /**
   * 接受好友请求
   */
  async acceptFriendRequest(requestId: string): Promise<Friend> {
    const response = await apiClient.post<ApiResponse<Friend>>(
      `/social/friend-requests/${requestId}/accept`
    );
    return response.data;
  }

  /**
   * 拒绝好友请求
   */
  async rejectFriendRequest(requestId: string): Promise<void> {
    await apiClient.delete(`/social/friend-requests/${requestId}`);
  }

  /**
   * 发送聊天消息
   */
  async sendChatMessage(
    recipientId: string,
    content: string,
    type: string = "text"
  ): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>(
      "/social/messages",
      {
        recipientId,
        content,
        type,
      }
    );
    return response.data;
  }

  /**
   * 获取聊天记录
   */
  async getChatHistory(
    friendId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<ChatMessage>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<ChatMessage>>
    >(`/social/messages/${friendId}?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  /**
   * 获取聊天会话列表
   */
  async getChatSessions(): Promise<ChatSession[]> {
    const response = await apiClient.get<ApiResponse<ChatSession[]>>(
      "/social/chat-sessions"
    );
    return response.data;
  }

  /**
   * 标记消息为已读
   */
  async markMessagesAsRead(friendId: string): Promise<void> {
    await apiClient.post(`/social/messages/${friendId}/read`);
  }

  /**
   * 获取工会信息
   */
  async getGuildInfo(guildId: string): Promise<Guild> {
    const response = await apiClient.get<ApiResponse<Guild>>(
      `/social/guilds/${guildId}`
    );
    return response.data;
  }

  /**
   * 创建工会
   */
  async createGuild(
    name: string,
    description?: string
  ): Promise<Guild> {
    const response = await apiClient.post<ApiResponse<Guild>>(
      "/social/guilds",
      {
        name,
        description,
      }
    );
    return response.data;
  }

  /**
   * 加入工会
   */
  async joinGuild(guildId: string, message?: string): Promise<Guild> {
    const response = await apiClient.post<ApiResponse<Guild>>(
      `/social/guilds/${guildId}/join`,
      { message }
    );
    return response.data;
  }

  /**
   * 离开工会
   */
  async leaveGuild(guildId: string): Promise<void> {
    await apiClient.delete(`/social/guilds/${guildId}/leave`);
  }

  /**
   * 获取工会成员列表
   */
  async getGuildMembers(
    guildId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<GuildMember>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<GuildMember>>
    >(`/social/guilds/${guildId}/members?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  /**
   * 获取玩家信息卡片
   */
  async getPlayerCard(userId: string): Promise<PlayerCard> {
    const response = await apiClient.get<ApiResponse<PlayerCard>>(
      `/social/players/${userId}`
    );
    return response.data;
  }

  /**
   * 屏蔽玩家
   */
  async blockPlayer(userId: string): Promise<void> {
    await apiClient.post(`/social/block/${userId}`);
  }

  /**
   * 取消屏蔽玩家
   */
  async unblockPlayer(userId: string): Promise<void> {
    await apiClient.delete(`/social/block/${userId}`);
  }

  // ========== 装备系统 ==========

  /**
   * 获取背包物品
   */
  async getEquipment(page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<Equipment>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Equipment>>
    >(`/equipment/inventory?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  /**
   * 穿戴装备
   */
  async equipItem(equipmentId: string, slot: string): Promise<Equipment> {
    const response = await apiClient.post<ApiResponse<Equipment>>(
      `/equipment/${equipmentId}/equip`,
      { slot }
    );
    return response.data;
  }

  /**
   * 卸下装备
   */
  async unequipItem(slot: string): Promise<void> {
    await apiClient.delete(`/equipment/equipped/${slot}`);
  }

  /**
   * 强化装备
   */
  async enhanceEquipment(
    equipmentId: string,
    materials?: string[],
    coins?: number
  ): Promise<Equipment> {
    const response = await apiClient.post<ApiResponse<Equipment>>(
      `/equipment/${equipmentId}/enhance`,
      { materials, coins }
    );
    return response.data;
  }

  /**
   * 修复装备
   */
  async repairEquipment(equipmentId: string): Promise<Equipment> {
    const response = await apiClient.post<ApiResponse<Equipment>>(
      `/equipment/${equipmentId}/repair`
    );
    return response.data;
  }

  /**
   * 获取装备属性总和
   */
  async getEquipmentStats(): Promise<PlayerEquipment> {
    const response = await apiClient.get<ApiResponse<PlayerEquipment>>(
      "/equipment/stats"
    );
    return response.data;
  }

  /**
   * 丢弃装备
   */
  async discardEquipment(equipmentId: string): Promise<void> {
    await apiClient.delete(`/equipment/${equipmentId}`);
  }

  // ========== 成就系统 ==========

  /**
   * 获取成就列表
   */
  async getAchievements(
    status?: string,
    category?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<Achievement>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Achievement>>
    >(`/achievements?${params}`);
    return response.data;
  }

  /**
   * 获取成就进度
   */
  async getAchievementProgress(achievementId: string): Promise<Achievement> {
    const response = await apiClient.get<ApiResponse<Achievement>>(
      `/achievements/${achievementId}`
    );
    return response.data;
  }

  /**
   * 获取排行榜
   */
  async getLeaderboard(
    type: string = "points",
    limit: number = 100,
    page: number = 1
  ): Promise<LeaderboardData> {
    const response = await apiClient.get<ApiResponse<LeaderboardData>>(
      `/achievements/leaderboard?type=${type}&limit=${limit}&page=${page}`
    );
    return response.data;
  }

  // ========== 经济系统 ==========

  /**
   * 获取玩家资产
   */
  async getPlayerAssets(): Promise<PlayerAssets> {
    const response = await apiClient.get<ApiResponse<PlayerAssets>>(
      "/economy/assets"
    );
    return response.data;
  }

  /**
   * 获取商城物品
   */
  async getShopItems(
    category?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<ShopItem>> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<ShopItem>>
    >(`/economy/shop?${params}`);
    return response.data;
  }

  /**
   * 购买物品
   */
  async buyItem(itemId: string, quantity: number = 1): Promise<PurchaseResult> {
    const response = await apiClient.post<ApiResponse<PurchaseResult>>(
      "/economy/shop/buy",
      { itemId, quantity }
    );
    return response.data;
  }

  /**
   * 存入银行
   */
  async depositToBank(amount: number): Promise<PlayerAssets> {
    const response = await apiClient.post<ApiResponse<PlayerAssets>>(
      "/economy/bank/deposit",
      { amount }
    );
    return response.data;
  }

  /**
   * 从银行提取
   */
  async withdrawFromBank(amount: number): Promise<PlayerAssets> {
    const response = await apiClient.post<ApiResponse<PlayerAssets>>(
      "/economy/bank/withdraw",
      { amount }
    );
    return response.data;
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Transaction>>
    >(`/economy/transactions?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  /**
   * 获取银行交易历史
   */
  async getBankTransactionHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<BankTransaction>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<BankTransaction>>
    >(`/economy/bank/transactions?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // ========== 游戏场景 ==========

  /**
   * 获取 NPC 列表
   */
  async getNPCList(): Promise<NPC[]> {
    const response = await apiClient.get<ApiResponse<NPC[]>>("/game/npcs");
    return response.data;
  }

  /**
   * 与 NPC 交互
   */
  async interactWithNPC(npcId: string, actionType: string = "talk"): Promise<Dialogue> {
    const response = await apiClient.post<ApiResponse<Dialogue>>(
      `/game/npcs/${npcId}/interact`,
      { actionType }
    );
    return response.data;
  }

  /**
   * 获取游戏事件
   */
  async getGameEvents(limit: number = 50): Promise<GameEvent[]> {
    const response = await apiClient.get<ApiResponse<GameEvent[]>>(
      `/game/events?limit=${limit}`
    );
    return response.data;
  }

  /**
   * 触发游戏事件
   */
  async triggerGameEvent(eventType: string, data: any): Promise<GameEvent> {
    const response = await apiClient.post<ApiResponse<GameEvent>>(
      "/game/events",
      { eventType, data }
    );
    return response.data;
  }

  /**
   * 获取任务列表
   */
  async getQuests(status?: string): Promise<Quest[]> {
    const params = status ? `?status=${status}` : "";
    const response = await apiClient.get<ApiResponse<Quest[]>>(
      `/game/quests${params}`
    );
    return response.data;
  }

  /**
   * 完成任务
   */
  async completeQuest(questId: string): Promise<Quest> {
    const response = await apiClient.post<ApiResponse<Quest>>(
      `/game/quests/${questId}/complete`
    );
    return response.data;
  }

  // ========== 用户系统 ==========

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>("/user/profile");
    return response.data;
  }

  /**
   * 更新用户设置
   */
  async updateUserSettings(settings: any): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      "/user/settings",
      settings
    );
    return response.data;
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await apiClient.post("/user/logout");
  }
}

// 导出单例
export const iceSnowCityApi = new IceSnowCityApiClient();
