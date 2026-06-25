/**
 * Game Logic Types - Central type definitions for all game mechanics
 * Based on Farmhand architecture patterns and Ice Snow City requirements
 */

// ============================================================================
// PLAYER TYPES
// ============================================================================

export interface PlayerProfile {
  id: string;
  name: string;
  level: number;
  experience: number;
  totalExperience: number;
  joinedAt: Date;
  lastActiveAt: Date;
  avatar?: string;
  bio?: string;
}

export interface PlayerAssets {
  money: number;
  isc: number;
  energy: number;
  food: number;
  water: number;
  population: number;
  reputation: number;
}

export interface PlayerProgress {
  tasksCompleted: number;
  npcsFriended: number;
  propertiesOwned: number;
  farmsCreated: number;
  itemsTraded: number;
  achievements: string[];
}

// ============================================================================
// NPC TYPES
// ============================================================================

export interface NPCProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  profession: string;
  personality: string;
  bio: string;
  avatar?: string;
  location: string;
  schedule: NPCSchedule;
}

export interface NPCSchedule {
  [day: string]: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
}

export interface NPCRelationship {
  npcId: string;
  favorability: number; // 0-100
  relationship: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'lover';
  lastInteraction: Date;
  interactionCount: number;
  likes: string[];
  dislikes: string[];
}

export interface NPCInteraction {
  type: 'greet' | 'talk' | 'gift' | 'date' | 'trade' | 'quest';
  timestamp: Date;
  favorabilityChange: number;
  result: string;
}

// ============================================================================
// ECONOMY TYPES
// ============================================================================

export interface Wallet {
  playerId: string;
  money: number;
  isc: number;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  playerId: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'purchase' | 'sale' | 'reward' | 'penalty';
  amount: number;
  currency: 'money' | 'isc';
  description: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface BankAccount {
  playerId: string;
  balance: number;
  depositCount: number;
  totalDeposited: number;
  interestRate: number; // APY percentage
  lastInterestPaid: Date;
  accountCreatedAt: Date;
}

export interface MarketPrice {
  itemId: string;
  basePrice: number;
  currentPrice: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

// ============================================================================
// PROPERTY TYPES
// ============================================================================

export interface Property {
  id: string;
  ownerId: string | null;
  name: string;
  type: 'house' | 'apartment' | 'shop' | 'warehouse' | 'farm';
  location: string;
  price: number;
  rentalIncome: number;
  isRented: boolean;
  rentedBy?: string;
  rentEndDate?: Date;
  purchaseDate?: Date;
  condition: number; // 0-100
}

export interface PropertyRental {
  propertyId: string;
  renterId: string;
  ownerId: string;
  monthlyRent: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'ended' | 'cancelled';
}

// ============================================================================
// FARM TYPES
// ============================================================================

export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  size: number; // in plots
  totalPlots: number;
  availablePlots: number;
  crops: Crop[];
  createdAt: Date;
}

export interface Crop {
  id: string;
  farmId: string;
  type: string;
  plantedAt: Date;
  harvestDate: Date;
  status: 'growing' | 'ready' | 'harvested' | 'dead';
  yield: number;
  quality: number; // 0-100
}

export interface HarvestResult {
  cropId: string;
  quantity: number;
  quality: number;
  profit: number;
  timestamp: Date;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export interface Task {
  id: string;
  npcId: string;
  playerId?: string;
  title: string;
  description: string;
  type: 'fetch' | 'delivery' | 'combat' | 'social' | 'farming' | 'trading';
  status: 'available' | 'accepted' | 'in_progress' | 'completed' | 'failed';
  reward: TaskReward;
  difficulty: 'easy' | 'normal' | 'hard' | 'legendary';
  dueDate?: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface TaskReward {
  money: number;
  isc: number;
  experience: number;
  items?: string[];
  favorability?: number;
}

// ============================================================================
// SHOP TYPES
// ============================================================================

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'decoration' | 'seed' | 'tool';
  price: number;
  currency: 'money' | 'isc';
  stock: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface PlayerInventory {
  playerId: string;
  items: InventoryItem[];
  capacity: number;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  acquiredAt: Date;
}

// ============================================================================
// GAME STATE TYPES
// ============================================================================

export interface GameState {
  // Player data
  player: PlayerProfile;
  assets: PlayerAssets;
  progress: PlayerProgress;
  wallet: Wallet;
  inventory: PlayerInventory;

  // NPC data
  npcRelationships: NPCRelationship[];
  npcInteractionHistory: NPCInteraction[];

  // Economy data
  transactions: Transaction[];
  bankAccount: BankAccount;
  marketPrices: MarketPrice[];

  // Property data
  properties: Property[];
  rentals: PropertyRental[];

  // Farm data
  farms: Farm[];
  harvestHistory: HarvestResult[];

  // Tasks
  tasks: Task[];

  // Game meta
  gameTime: GameTime;
  lastSaved: Date;
  version: string;
}

export interface GameTime {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

// ============================================================================
// GAME ACTION TYPES
// ============================================================================

export type GameAction =
  // Player actions
  | { type: 'PLAYER_GAIN_EXPERIENCE'; payload: { amount: number } }
  | { type: 'PLAYER_LEVEL_UP'; payload: { newLevel: number } }
  | { type: 'PLAYER_UPDATE_PROFILE'; payload: Partial<PlayerProfile> }

  // Asset actions
  | { type: 'ASSET_ADD_MONEY'; payload: { amount: number } }
  | { type: 'ASSET_REMOVE_MONEY'; payload: { amount: number } }
  | { type: 'ASSET_ADD_ISC'; payload: { amount: number } }
  | { type: 'ASSET_REMOVE_ISC'; payload: { amount: number } }
  | { type: 'ASSET_ADD_ENERGY'; payload: { amount: number } }
  | { type: 'ASSET_REMOVE_ENERGY'; payload: { amount: number } }
  | { type: 'ASSET_ADD_FOOD'; payload: { amount: number } }
  | { type: 'ASSET_REMOVE_FOOD'; payload: { amount: number } }
  | { type: 'ASSET_ADD_POPULATION'; payload: { amount: number } }
  | { type: 'ASSET_REMOVE_POPULATION'; payload: { amount: number } }

  // NPC actions
  | { type: 'NPC_INTERACT'; payload: { npcId: string; type: NPCInteraction['type'] } }
  | { type: 'NPC_UPDATE_RELATIONSHIP'; payload: { npcId: string; favorabilityChange: number } }
  | { type: 'NPC_GIFT'; payload: { npcId: string; itemId: string } }
  | { type: 'NPC_DATE'; payload: { npcId: string; location: string } }

  // Economy actions
  | { type: 'WALLET_DEPOSIT'; payload: { amount: number; currency: 'money' | 'isc' } }
  | { type: 'WALLET_WITHDRAW'; payload: { amount: number; currency: 'money' | 'isc' } }
  | { type: 'WALLET_TRANSFER'; payload: { toPlayerId: string; amount: number; currency: 'money' | 'isc' } }
  | { type: 'TRANSACTION_ADD'; payload: Transaction }
  | { type: 'BANK_DEPOSIT'; payload: { amount: number } }
  | { type: 'BANK_WITHDRAW'; payload: { amount: number } }
  | { type: 'BANK_CLAIM_INTEREST'; payload: { amount: number } }

  // Property actions
  | { type: 'PROPERTY_PURCHASE'; payload: { propertyId: string; price: number } }
  | { type: 'PROPERTY_SELL'; payload: { propertyId: string; price: number } }
  | { type: 'PROPERTY_RENT'; payload: { propertyId: string; renterId: string; monthlyRent: number } }
  | { type: 'PROPERTY_COLLECT_RENT'; payload: { propertyId: string; amount: number } }

  // Farm actions
  | { type: 'FARM_CREATE'; payload: Farm }
  | { type: 'FARM_PLANT'; payload: { farmId: string; cropType: string; quantity: number } }
  | { type: 'FARM_HARVEST'; payload: { farmId: string; cropId: string; yield: number } }
  | { type: 'FARM_WATER'; payload: { farmId: string; quantity: number } }
  | { type: 'FARM_FERTILIZE'; payload: { farmId: string; quantity: number } }

  // Task actions
  | { type: 'TASK_ACCEPT'; payload: { taskId: string } }
  | { type: 'TASK_COMPLETE'; payload: { taskId: string; reward: TaskReward } }
  | { type: 'TASK_FAIL'; payload: { taskId: string } }
  | { type: 'TASK_ABANDON'; payload: { taskId: string } }

  // Shop actions
  | { type: 'SHOP_PURCHASE'; payload: { itemId: string; quantity: number; cost: number } }
  | { type: 'INVENTORY_ADD'; payload: { itemId: string; quantity: number } }
  | { type: 'INVENTORY_REMOVE'; payload: { itemId: string; quantity: number } }

  // Game meta actions
  | { type: 'GAME_TIME_ADVANCE'; payload: { minutes: number } }
  | { type: 'GAME_SAVE'; payload: { timestamp: Date } }
  | { type: 'GAME_LOAD'; payload: GameState };

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GameActionResult extends ServiceResult<Partial<GameState>> {
  actionType: GameAction['type'];
  stateChanges: Partial<GameState>;
}
