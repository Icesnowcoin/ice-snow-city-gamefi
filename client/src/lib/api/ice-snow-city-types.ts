/**
 * ICE Snow City API 类型定义
 * 所有 API 响应数据的 TypeScript 类型
 */

// ========== 基础类型 ==========

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  type: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ========== 社交系统类型 ==========

export interface Friend {
  id: string;
  name: string;
  level: number;
  avatar: string;
  isOnline: boolean;
  lastOnlineAt: string;
  isFavorite: boolean;
  status: "online" | "offline" | "away" | "busy";
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  createdAt: string;
  message?: string;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  content: string;
  type: "text" | "emoji" | "gift" | "system";
  timestamp: string;
  isRead: boolean;
}

export interface ChatSession {
  id: string;
  friendId: string;
  friendName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isPinned: boolean;
}

export interface Guild {
  id: string;
  name: string;
  level: number;
  leader: string;
  leaderName: string;
  memberCount: number;
  maxMembers: number;
  funds: number;
  announcement: string;
  createdAt: string;
  description?: string;
  logo?: string;
}

export interface GuildMember {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  role: "leader" | "officer" | "member";
  joinedAt: string;
  level: number;
  contribution: number;
}

export interface PlayerCard {
  id: string;
  name: string;
  level: number;
  avatar: string;
  title: string;
  signature: string;
  joinedAt: string;
  totalAssets: number;
  achievements: number;
  friends: number;
  guildId?: string;
  guildName?: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  totalExp: number;
  totalCoins: number;
  totalGems: number;
  totalISC: number;
  achievementPoints: number;
  playtime: number; // 分钟
}

// ========== 装备系统类型 ==========

export interface Equipment {
  id: string;
  name: string;
  type: "weapon" | "armor" | "accessory" | "shoes" | "hat" | "ring";
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  level: number;
  stats: EquipmentStats;
  enhanceLevel: number;
  durability: number;
  maxDurability: number;
  isEquipped: boolean;
  equippedSlot?: string;
  setId?: string;
  setName?: string;
}

export interface EquipmentStats {
  attack?: number;
  defense?: number;
  hp?: number;
  speed?: number;
  luck?: number;
  critRate?: number;
  critDamage?: number;
  dodge?: number;
  resistance?: number;
}

export interface EquipmentSet {
  id: string;
  name: string;
  items: Equipment[];
  bonus: EquipmentStats;
  isActive: boolean;
}

export interface EquipmentSlot {
  slot: string;
  equipment: Equipment | null;
  level: number;
}

export interface PlayerEquipment {
  totalStats: EquipmentStats;
  equippedItems: EquipmentSlot[];
  totalEnhanceLevel: number;
  setEffects: EquipmentSet[];
}

// ========== 成就系统类型 ==========

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  maxProgress: number;
  percentage: number;
  lastUpdatedAt: string;
}

export interface Leaderboard {
  rank: number;
  userId: string;
  userName: string;
  avatar: string;
  value: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

export interface LeaderboardData {
  items: Leaderboard[];
  total: number;
  userRank: number;
  userValue: number;
}

// ========== 经济系统类型 ==========

export interface PlayerAssets {
  coins: number;
  gems: number;
  iscTokens: number;
  bankBalance: number;
  bankInterestRate: number;
  totalAssets: number;
  properties: Property[];
}

export interface Property {
  id: string;
  name: string;
  type: "house" | "shop" | "factory" | "farm";
  value: number;
  location: string;
  level: number;
  income: number; // 每天收入
  workers: number;
  maxWorkers: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "coins" | "gems" | "isc";
  image: string;
  category: string;
  quantity?: number;
  stock: number;
  discount?: number;
}

export interface PurchaseResult {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  totalCost: number;
  currency: string;
  remainingBalance: number;
}

export interface BankTransaction {
  id: string;
  type: "deposit" | "withdraw" | "interest";
  amount: number;
  balance: number;
  timestamp: string;
  description: string;
}

export interface Transaction {
  id: string;
  type: "buy" | "sell" | "transfer" | "reward" | "cost";
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
  relatedUserId?: string;
}

// ========== 游戏场景类型 ==========

export interface NPC {
  id: string;
  name: string;
  position: [number, number, number];
  dialogueId: string;
  questId?: string;
  isInteractable: boolean;
  model: string;
  animation: string;
}

export interface Dialogue {
  id: string;
  text: string;
  options: DialogueOption[];
  rewards?: DialogueReward;
}

export interface DialogueOption {
  id: string;
  text: string;
  nextDialogueId?: string;
  action?: string;
}

export interface DialogueReward {
  exp: number;
  coins: number;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

export interface GameEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  userId?: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  npcId: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  isCompleted: boolean;
  progress: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  targetCount: number;
  currentCount: number;
}

export interface QuestReward {
  exp: number;
  coins: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

// ========== 用户系统类型 ==========

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  exp: number;
  joinedAt: string;
  lastLoginAt: string;
  settings: UserSettings;
}

export interface UserSettings {
  language: string;
  theme: "light" | "dark";
  notifications: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  privacy: "public" | "friends" | "private";
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

// ========== WebSocket 事件类型 ==========

export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

export interface FriendStatusChanged {
  friendId: string;
  status: "online" | "offline" | "away" | "busy";
  changedAt: string;
}

export interface NewMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  content: string;
  timestamp: string;
}

export interface GuildNotification {
  guildId: string;
  type: "member_joined" | "member_left" | "announcement" | "funds_updated";
  data: Record<string, any>;
  timestamp: string;
}

export interface AchievementUnlocked {
  achievementId: string;
  name: string;
  points: number;
  unlockedAt: string;
}

// ========== 分页和搜索类型 ==========

export interface SearchParams {
  query: string;
  page?: number;
  pageSize?: number;
  sort?: "recent" | "popular" | "relevance";
}

export interface FilterParams {
  status?: string;
  category?: string;
  rarity?: string;
  level?: number;
  page?: number;
  pageSize?: number;
}

// ========== 错误类型 ==========

export class ApiErrorResponse extends Error {
  constructor(
    public code: number,
    public errorType: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiErrorResponse";
  }
}

// ========== 响应包装类型 ==========

export type ApiResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ApiErrorResponse;
};
