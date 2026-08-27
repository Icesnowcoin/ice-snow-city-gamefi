import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Referral attribution table - records the first successful inviter relationship for each new player.
 * The unique referredUserId index makes claiming idempotent and prevents self/duplicate attribution.
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerUserId: int("referrerUserId").notNull().references(() => users.id),
  referredUserId: int("referredUserId").notNull().references(() => users.id),
  referralCode: varchar("referralCode", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["claimed", "rejected"]).default("claimed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  referredUserUnique: uniqueIndex("referrals_referred_user_unique").on(table.referredUserId),
  referrerCreatedIdx: index("referrals_referrer_created_idx").on(table.referrerUserId, table.createdAt),
}));

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Contract events log table - stores on-chain event records.
 */
export const contractEvents = mysqlTable("contract_events", {
  id: int("id").autoincrement().primaryKey(),
  eventName: varchar("eventName", { length: 128 }).notNull(),
  txHash: varchar("txHash", { length: 66 }),
  blockNumber: bigint("blockNumber", { mode: "number" }),
  fromAddress: varchar("fromAddress", { length: 42 }),
  toAddress: varchar("toAddress", { length: 42 }),
  amount: varchar("amount", { length: 78 }),
  params: text("params"),
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractEvent = typeof contractEvents.$inferSelect;
export type InsertContractEvent = typeof contractEvents.$inferInsert;

/**
 * Contract parameters table - stores current contract configuration.
 */
export const contractParams = mysqlTable("contract_params", {
  id: int("id").autoincrement().primaryKey(),
  paramName: varchar("paramName", { length: 128 }).notNull().unique(),
  paramValue: varchar("paramValue", { length: 256 }).notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 64 }),
});

export type ContractParam = typeof contractParams.$inferSelect;
export type InsertContractParam = typeof contractParams.$inferInsert;

/**
 * Secret keys table - stores secret key hashes and history.
 */
export const secretKeys = mysqlTable("secret_keys", {
  id: int("id").autoincrement().primaryKey(),
  keyHash: varchar("keyHash", { length: 66 }).notNull(),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: varchar("createdBy", { length: 64 }),
});

export type SecretKey = typeof secretKeys.$inferSelect;
export type InsertSecretKey = typeof secretKeys.$inferInsert;

/**
 * Treasury transactions table - stores ISC flow in/out of CityTreasury.
 */
export const treasuryTransactions = mysqlTable("treasury_transactions", {
  id: int("id").autoincrement().primaryKey(),
  txType: mysqlEnum("txType", ["deposit", "withdraw"]).notNull(),
  amount: varchar("amount", { length: 78 }).notNull(),
  txHash: varchar("txHash", { length: 66 }),
  fromAddress: varchar("fromAddress", { length: 42 }),
  toAddress: varchar("toAddress", { length: 42 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TreasuryTransaction = typeof treasuryTransactions.$inferSelect;
export type InsertTreasuryTransaction = typeof treasuryTransactions.$inferInsert;

/**
 * Audit logs table - stores all administrative actions and security events.
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  resource: varchar("resource", { length: 128 }).notNull(),
  resourceId: varchar("resourceId", { length: 256 }),
  status: mysqlEnum("status", ["success", "failure"]).notNull(),
  details: text("details"), // JSON string
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;


/**
 * Recovery events table - stores automatic recovery events and metrics.
 */
export const recoveryEvents = mysqlTable("recovery_events", {
  id: int("id").autoincrement().primaryKey(),
  serviceType: varchar("serviceType", { length: 64 }).notNull(), // "blockchain", "eventListener", "monitoring", etc.
  eventType: varchar("eventType", { length: 64 }).notNull(), // "health_check", "restart", "failover", "recovery"
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  details: text("details"), // JSON stringified details
  recoveryAttempts: int("recoveryAttempts").default(0).notNull(),
  duration: int("duration"), // milliseconds
  triggeredBy: varchar("triggeredBy", { length: 64 }), // "automatic", "manual", "scheduled"
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecoveryEvent = typeof recoveryEvents.$inferSelect;
export type InsertRecoveryEvent = typeof recoveryEvents.$inferInsert;

/**
 * Recovery metrics table - stores recovery service metrics and statistics.
 */
export const recoveryMetrics = mysqlTable("recovery_metrics", {
  id: int("id").autoincrement().primaryKey(),
  serviceType: varchar("serviceType", { length: 64 }).notNull(),
  metricType: varchar("metricType", { length: 64 }).notNull(), // "uptime", "recovery_time", "error_rate", "success_rate"
  metricValue: varchar("metricValue", { length: 256 }).notNull(),
  unit: varchar("unit", { length: 32 }), // "ms", "percent", "count"
  period: varchar("period", { length: 32 }), // "1h", "1d", "1w", "1m"
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: text("details"), // JSON stringified details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RecoveryMetric = typeof recoveryMetrics.$inferSelect;
export type InsertRecoveryMetric = typeof recoveryMetrics.$inferInsert;

/**
 * Game states table - stores player game state snapshots for persistence.
 */
export const gameStates = mysqlTable("game_states", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  stateJson: text("stateJson").notNull(), // Serialized GameState object
  version: int("version").default(1).notNull(), // Version number for optimistic locking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameState = typeof gameStates.$inferSelect;
export type InsertGameState = typeof gameStates.$inferInsert;

/**
 * Game states backup table - stores versioned backups of game states.
 */
export const gameStatesBackup = mysqlTable("game_states_backup", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  stateJson: text("stateJson").notNull(), // Serialized GameState object
  version: int("version").notNull(), // Version number from game_states
  backupAt: timestamp("backupAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameStateBackup = typeof gameStatesBackup.$inferSelect;
export type InsertGameStateBackup = typeof gameStatesBackup.$inferInsert;


/**
 * Game accounts table - stores player game account with game points and blockchain balance.
 * Implements hybrid account model for Gas optimization.
 */
export const gameAccounts = mysqlTable("game_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  gamePoints: bigint("gamePoints", { mode: "number" }).default(0).notNull(),
  blockchainBalance: varchar("blockchainBalance", { length: 78 }).default("0").notNull(),
  pendingPoints: bigint("pendingPoints", { mode: "number" }).default(0).notNull(),
  lastSettled: timestamp("lastSettled").defaultNow().notNull(),
  settlementCycle: int("settlementCycle").default(24).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameAccount = typeof gameAccounts.$inferSelect;
export type InsertGameAccount = typeof gameAccounts.$inferInsert;

/**
 * Game transactions table - stores in-game transactions (0 Gas).
 */
export const gameTransactions = mysqlTable("game_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["transfer", "purchase", "sale", "reward", "penalty"]).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  description: text("description"),
  relatedUserId: int("relatedUserId").references(() => users.id),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("completed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameTransaction = typeof gameTransactions.$inferSelect;
export type InsertGameTransaction = typeof gameTransactions.$inferInsert;

/**
 * Blockchain transactions table - stores on-chain transactions (deposit/withdraw).
 */
export const blockchainTransactions = mysqlTable("blockchain_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["deposit", "withdraw"]).notNull(),
  amount: varchar("amount", { length: 78 }).notNull(),
  txHash: varchar("txHash", { length: 66 }).notNull(),
  gasUsed: varchar("gasUsed", { length: 78 }).default("0").notNull(),
  gasPrice: varchar("gasPrice", { length: 78 }).default("0").notNull(),
  fromAddress: varchar("fromAddress", { length: 42 }),
  toAddress: varchar("toAddress", { length: 42 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  confirmations: int("confirmations").default(0).notNull(),
  blockNumber: bigint("blockNumber", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
});

export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;
export type InsertBlockchainTransaction = typeof blockchainTransactions.$inferInsert;

/**
 * Players table - stores game player profiles and assets.
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  username: varchar("username", { length: 128 }).notNull(),
  level: int("level").default(1).notNull(),
  experience: int("experience").default(0).notNull(),
  totalExperience: int("totalExperience").default(0).notNull(),
  stamina: int("stamina").default(100).notNull(),
  maxStamina: int("maxStamina").default(100).notNull(),
  hunger: int("hunger").default(50).notNull(),
  thirst: int("thirst").default(50).notNull(),
  happiness: int("happiness").default(0).notNull(),
  health: int("health").default(100).notNull(),
  money: int("money").default(1000).notNull(),
  isc: int("isc").default(0).notNull(),
  bankBalance: int("bankBalance").default(0).notNull(),
  currentScene: varchar("currentScene", { length: 128 }).default("home").notNull(),
  maritalStatus: varchar("maritalStatus", { length: 32 }).default("single").notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  propertiesOwned: int("propertiesOwned").default(0).notNull(),
  farmsCreated: int("farmsCreated").default(0).notNull(),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  npcsFriended: int("npcsFriended").default(0).notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Trades table - stores player-to-player trades.
 */
export const trades = mysqlTable("trades", {
  id: varchar("id", { length: 64 }).primaryKey(),
  initiatorId: int("initiatorId").notNull().references(() => players.id),
  recipientId: int("recipientId").notNull().references(() => players.id),
  initiatorItems: text("initiatorItems").notNull(), // JSON
  recipientItems: text("recipientItems").notNull(), // JSON
  initiatorAssets: text("initiatorAssets").notNull(), // JSON
  recipientAssets: text("recipientAssets").notNull(), // JSON
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  expiresAt: bigint("expiresAt", { mode: "number" }).notNull(),
  completedAt: bigint("completedAt", { mode: "number" }),
  reason: text("reason"), // rejection reason
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;


/**
 * Player professions table - stores player profession and level progression.
 */
export const playerProfessions = mysqlTable("player_professions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  currentProfession: mysqlEnum("currentProfession", [
    "commoner",
    "merchant",
    "architect",
    "industrialist",
    "entrepreneur",
  ]).default("commoner").notNull(),
  level: int("level").default(1).notNull(), // 1-100
  experience: bigint("experience", { mode: "number" }).default(0).notNull(),
  nextLevelExperience: bigint("nextLevelExperience", { mode: "number" }).default(100).notNull(),
  totalAssets: varchar("totalAssets", { length: 78 }).default("0").notNull(), // ISC
  professionHistory: text("professionHistory").notNull(), // JSON array of profession changes
  lastProfessionChangeAt: timestamp("lastProfessionChangeAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerProfession = typeof playerProfessions.$inferSelect;
export type InsertPlayerProfession = typeof playerProfessions.$inferInsert;

/**
 * Profession achievements table - tracks profession-specific achievements.
 */
export const professionAchievements = mysqlTable("profession_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  profession: mysqlEnum("profession", [
    "commoner",
    "merchant",
    "architect",
    "industrialist",
    "entrepreneur",
  ]).notNull(),
  achievementType: varchar("achievementType", { length: 64 }).notNull(), // "first_trade", "first_building", etc.
  achievementData: text("achievementData"), // JSON with achievement details
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfessionAchievement = typeof professionAchievements.$inferSelect;
export type InsertProfessionAchievement = typeof professionAchievements.$inferInsert;

/**
 * Profession statistics table - tracks profession-specific statistics.
 */
export const professionStats = mysqlTable("profession_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  profession: mysqlEnum("profession", [
    "commoner",
    "merchant",
    "architect",
    "industrialist",
    "entrepreneur",
  ]).notNull(),
  totalProfit: varchar("totalProfit", { length: 78 }).default("0").notNull(),
  totalProduction: bigint("totalProduction", { mode: "number" }).default(0).notNull(),
  totalHarvest: bigint("totalHarvest", { mode: "number" }).default(0).notNull(),
  totalTrades: bigint("totalTrades", { mode: "number" }).default(0).notNull(),
  buildingsConstructed: int("buildingsConstructed").default(0).notNull(),
  workersEmployed: int("workersEmployed").default(0).notNull(),
  timeSpentHours: int("timeSpentHours").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfessionStats = typeof professionStats.$inferSelect;
export type InsertProfessionStats = typeof professionStats.$inferInsert;


/**
 * Player characters table - stores player character customization and appearance.
 */
export const playerCharacters = mysqlTable("player_characters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  name: varchar("name", { length: 64 }).notNull(),
  gender: mysqlEnum("gender", ["male", "female"]).notNull(),
  
  // Facial Features
  faceShape: varchar("faceShape", { length: 32 }).notNull(),
  eyeShape: varchar("eyeShape", { length: 32 }).notNull(),
  eyeColor: varchar("eyeColor", { length: 32 }).notNull(),
  noseSize: int("noseSize").default(50).notNull(), // 0-100
  mouthSize: int("mouthSize").default(50).notNull(), // 0-100
  skinTone: varchar("skinTone", { length: 32 }).notNull(),
  
  // Hair
  hairStyle: varchar("hairStyle", { length: 32 }).notNull(),
  hairColor: varchar("hairColor", { length: 32 }).notNull(),
  
  // Body
  bodyType: varchar("bodyType", { length: 32 }).notNull(),
  height: varchar("height", { length: 32 }).notNull(),
  
  // Clothing
  clothingStyle: varchar("clothingStyle", { length: 32 }).notNull(),
  clothingColor: varchar("clothingColor", { length: 7 }).notNull(), // Hex color
  
  // Accessories
  shoes: varchar("shoes", { length: 32 }).notNull(),
  shoeColor: varchar("shoeColor", { length: 7 }).notNull(), // Hex color
  accessories: text("accessories").notNull(), // JSON array
  accessoryColor: varchar("accessoryColor", { length: 7 }).notNull(), // Hex color
  
  // Position
  positionX: decimal("positionX", { precision: 10, scale: 2 }).default("0").notNull(),
  positionY: decimal("positionY", { precision: 10, scale: 2 }).default("0").notNull(),
  currentScene: varchar("currentScene", { length: 128 }).default("home").notNull(),
  
  // Appearance URLs
  modelUrl: text("modelUrl"), // 3D model URL
  thumbnailUrl: text("thumbnailUrl"), // Character thumbnail URL
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerCharacter = typeof playerCharacters.$inferSelect;
export type InsertPlayerCharacter = typeof playerCharacters.$inferInsert;

/**
 * Character appearance presets table - stores saved character presets.
 */
export const characterPresets = mysqlTable("character_presets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  customizationData: text("customizationData").notNull(), // JSON
  thumbnailUrl: text("thumbnailUrl"),
  isPublic: mysqlEnum("isPublic", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CharacterPreset = typeof characterPresets.$inferSelect;
export type InsertCharacterPreset = typeof characterPresets.$inferInsert;

/**
 * Character positions table - tracks character movement history and current positions.
 */
export const characterPositions = mysqlTable("character_positions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  scene: varchar("scene", { length: 128 }).notNull(),
  positionX: decimal("positionX", { precision: 10, scale: 2 }).notNull(),
  positionY: decimal("positionY", { precision: 10, scale: 2 }).notNull(),
  direction: varchar("direction", { length: 32 }).default("down").notNull(), // up, down, left, right
  isMoving: mysqlEnum("isMoving", ["yes", "no"]).default("no").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CharacterPosition = typeof characterPositions.$inferSelect;
export type InsertCharacterPosition = typeof characterPositions.$inferInsert;


/**
 * Daily check-in records table - stores player check-in history.
 */
export const checkinRecords = mysqlTable("checkin_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  checkinDate: date("checkinDate").notNull(),
  platform: mysqlEnum("platform", [
    "telegram",
    "whatsapp",
    "facebook",
    "instagram",
    "x",
    "zalo",
    "reddit",
    "discord",
  ]).notNull(),
  shareUrl: text("shareUrl").notNull(),
  status: mysqlEnum("status", ["pending", "verified", "claimed", "expired"]).default("pending").notNull(),
  verificationData: text("verificationData"), // JSON
  rewardAmount: int("rewardAmount").default(10).notNull(),
  consecutiveDays: int("consecutiveDays").default(1).notNull(),
  canWithdraw: mysqlEnum("canWithdraw", ["yes", "no"]).default("no").notNull(),
  withdrawalActivated: mysqlEnum("withdrawalActivated", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CheckinRecord = typeof checkinRecords.$inferSelect;
export type InsertCheckinRecord = typeof checkinRecords.$inferInsert;

/**
 * Check-in statistics table - tracks player check-in stats.
 */
export const checkinStats = mysqlTable("checkin_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  totalCheckIns: int("totalCheckIns").default(0).notNull(),
  consecutiveDays: int("consecutiveDays").default(0).notNull(),
  lastCheckInDate: date("lastCheckInDate"),
  totalRewards: int("totalRewards").default(0).notNull(),
  withdrawalEligible: mysqlEnum("withdrawalEligible", ["yes", "no"]).default("no").notNull(),
  withdrawalActivated: mysqlEnum("withdrawalActivated", ["yes", "no"]).default("no").notNull(),
  checkInsToday: int("checkInsToday").default(0).notNull(),
  lastResetDate: date("lastResetDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CheckinStats = typeof checkinStats.$inferSelect;
export type InsertCheckinStats = typeof checkinStats.$inferInsert;

/**
 * Check-in configuration table - stores system configuration.
 */
export const checkinConfig = mysqlTable("checkin_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 128 }).notNull().unique(),
  configValue: text("configValue").notNull(), // JSON
  description: text("description"),
  enabled: mysqlEnum("enabled", ["yes", "no"]).default("yes").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 64 }),
});

export type CheckinConfig = typeof checkinConfig.$inferSelect;
export type InsertCheckinConfig = typeof checkinConfig.$inferInsert;

/**
 * Share verification logs table - tracks social media share verification attempts.
 */
export const shareVerificationLogs = mysqlTable("share_verification_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  platform: mysqlEnum("platform", [
    "telegram",
    "whatsapp",
    "facebook",
    "instagram",
    "x",
    "zalo",
    "reddit",
    "discord",
  ]).notNull(),
  shareUrl: text("shareUrl").notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "success", "failed"]).default("pending").notNull(),
  verificationData: text("verificationData"), // JSON
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShareVerificationLog = typeof shareVerificationLogs.$inferSelect;
export type InsertShareVerificationLog = typeof shareVerificationLogs.$inferInsert;

/**
 * Shop items table - stores all available items in the shop.
 */
export const shopItems = mysqlTable("shop_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "hat",
    "scarf",
    "shirt",
    "pants",
    "skirt",
    "shoes",
    "socks",
    "bag",
    "ring",
    "bracelet",
    "earring",
    "glasses",
    "hairstyle",
  ]).notNull(),
  rarity: mysqlEnum("rarity", ["common", "uncommon", "rare", "epic", "legendary"]).default("common").notNull(),
  price: int("price").notNull(), // ISC price
  imageUrl: varchar("imageUrl", { length: 512 }).notNull(),
  previewUrl: varchar("previewUrl", { length: 512 }),
  attributes: text("attributes"), // JSON
  availableFrom: timestamp("availableFrom"),
  availableUntil: timestamp("availableUntil"),
  isLimited: mysqlEnum("isLimited", ["yes", "no"]).default("no").notNull(),
  stock: int("stock"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = typeof shopItems.$inferInsert;

/**
 * Player inventory table - stores player items.
 */
export const playerInventory = mysqlTable("player_inventory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  itemId: int("itemId").notNull().references(() => shopItems.id),
  quantity: int("quantity").default(1).notNull(),
  equippedSlot: varchar("equippedSlot", { length: 64 }), // 'head', 'body', 'legs', 'feet', 'hand', 'neck', 'finger', 'eyes', 'hair'
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlayerInventoryItem = typeof playerInventory.$inferSelect;
export type InsertPlayerInventoryItem = typeof playerInventory.$inferInsert;

/**
 * Player assets table - stores player financial information.
 */
export const playerAssets = mysqlTable("player_assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  iscBalance: decimal("iscBalance", { precision: 20, scale: 6 }).default("0").notNull(),
  cash: decimal("cash", { precision: 20, scale: 6 }).default("0").notNull(),
  bankBalance: decimal("bankBalance", { precision: 20, scale: 6 }).default("0").notNull(),
  bankInterest: decimal("bankInterest", { precision: 20, scale: 6 }).default("0").notNull(),
  investments: decimal("investments", { precision: 20, scale: 6 }).default("0").notNull(),
  properties: decimal("properties", { precision: 20, scale: 6 }).default("0").notNull(),
  realEstateValue: decimal("realEstateValue", { precision: 20, scale: 6 }).default("0").notNull(),
  businesses: decimal("businesses", { precision: 20, scale: 6 }).default("0").notNull(),
  businessValue: decimal("businessValue", { precision: 20, scale: 6 }).default("0").notNull(),
  totalAssets: decimal("totalAssets", { precision: 20, scale: 6 }).default("0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlayerAsset = typeof playerAssets.$inferSelect;
export type InsertPlayerAsset = typeof playerAssets.$inferInsert;

/**
 * Item purchase transactions table - logs all item purchases.
 */
export const itemPurchaseTransactions = mysqlTable("item_purchase_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  itemId: int("itemId").notNull().references(() => shopItems.id),
  quantity: int("quantity").default(1).notNull(),
  totalPrice: int("totalPrice").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});
export type ItemPurchaseTransaction = typeof itemPurchaseTransactions.$inferSelect;
export type InsertItemPurchaseTransaction = typeof itemPurchaseTransactions.$inferInsert;


/**
 * Payment orders table - stores ISC purchase and withdrawal orders
 */
export const paymentOrders = mysqlTable("payment_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  orderNo: varchar("orderNo", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["purchase", "withdrawal", "refund", "fee"]).notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(),
  usdtValue: decimal("usdtValue", { precision: 20, scale: 6 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "failed", "cancelled"]).default("pending").notNull(),
  txHash: varchar("txHash", { length: 66 }),
  fromAddress: varchar("fromAddress", { length: 42 }),
  toAddress: varchar("toAddress", { length: 42 }),
  gasUsed: decimal("gasUsed", { precision: 20, scale: 6 }),
  gasFee: decimal("gasFee", { precision: 20, scale: 6 }),
  failureReason: text("failureReason"),
  metadata: text("metadata"), // JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
});
export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type InsertPaymentOrder = typeof paymentOrders.$inferInsert;

/**
 * Withdrawal requests table - stores withdrawal requests and activation status
 */
export const withdrawalRequests = mysqlTable("withdrawal_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  requestNo: varchar("requestNo", { length: 64 }).notNull().unique(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(),
  usdtValue: decimal("usdtValue", { precision: 20, scale: 6 }).notNull(),
  chainAddress: varchar("chainAddress", { length: 42 }).notNull(),
  status: mysqlEnum("status", ["pending", "activated", "completed", "failed"]).default("pending").notNull(),
  requiresActivation: boolean("requiresActivation").default(true).notNull(),
  activationOrderId: int("activationOrderId").references(() => paymentOrders.id),
  txHash: varchar("txHash", { length: 66 }),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  activatedAt: timestamp("activatedAt"),
  completedAt: timestamp("completedAt"),
});
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

/**
 * Withdrawal activation records table - tracks 5 USDT activation purchases
 */
export const withdrawalActivations = mysqlTable("withdrawal_activations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  activationNo: varchar("activationNo", { length: 64 }).notNull().unique(),
  requiredAmount: decimal("requiredAmount", { precision: 20, scale: 6 }).notNull(), // 5 USDT
  requiredISC: decimal("requiredISC", { precision: 20, scale: 6 }).notNull(), // 50 ISC
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  txHash: varchar("txHash", { length: 66 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  failureReason: text("failureReason"),
});
export type WithdrawalActivation = typeof withdrawalActivations.$inferSelect;
export type InsertWithdrawalActivation = typeof withdrawalActivations.$inferInsert;

/**
 * Payment configuration table - stores ISC price and payment settings
 */
export const paymentConfigs = mysqlTable("payment_configs", {
  id: int("id").autoincrement().primaryKey(),
  iscPrice: decimal("iscPrice", { precision: 10, scale: 4 }).notNull(), // ISC 对 USDT 的价格
  withdrawalActivationAmount: decimal("withdrawalActivationAmount", { precision: 10, scale: 2 }).default("5").notNull(), // 5 USDT
  minPurchaseAmount: decimal("minPurchaseAmount", { precision: 20, scale: 6 }).default("1").notNull(),
  maxPurchaseAmount: decimal("maxPurchaseAmount", { precision: 20, scale: 6 }).default("100000").notNull(),
  minWithdrawalAmount: decimal("minWithdrawalAmount", { precision: 20, scale: 6 }).default("10").notNull(),
  maxWithdrawalAmount: decimal("maxWithdrawalAmount", { precision: 20, scale: 6 }).default("1000000").notNull(),
  gasMultiplier: decimal("gasMultiplier", { precision: 5, scale: 2 }).default("1.5").notNull(),
  confirmationBlocks: int("confirmationBlocks").default(12).notNull(),
  maxWithdrawalAddresses: int("maxWithdrawalAddresses").default(3).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PaymentConfig = typeof paymentConfigs.$inferSelect;
export type InsertPaymentConfig = typeof paymentConfigs.$inferInsert;

/**
 * Player payment statistics table - tracks player payment history
 */
export const playerPaymentStats = mysqlTable("player_payment_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  totalPurchased: decimal("totalPurchased", { precision: 20, scale: 6 }).default("0").notNull(),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 20, scale: 6 }).default("0").notNull(),
  totalSpent: decimal("totalSpent", { precision: 20, scale: 6 }).default("0").notNull(),
  totalGasPaid: decimal("totalGasPaid", { precision: 20, scale: 6 }).default("0").notNull(),
  withdrawalActivated: boolean("withdrawalActivated").default(false).notNull(),
  activationDate: timestamp("activationDate"),
  boundAddresses: text("boundAddresses"), // JSON array
  lastPurchaseDate: timestamp("lastPurchaseDate"),
  lastWithdrawalDate: timestamp("lastWithdrawalDate"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlayerPaymentStat = typeof playerPaymentStats.$inferSelect;
export type InsertPlayerPaymentStat = typeof playerPaymentStats.$inferInsert;

/**
 * Transaction records table - logs all ISC transactions
 */
export const transactionRecords = mysqlTable("transaction_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["purchase", "withdrawal", "refund", "fee", "income", "expense"]).notNull(),
  amount: decimal("amount", { precision: 20, scale: 6 }).notNull(),
  balance: decimal("balance", { precision: 20, scale: 6 }).notNull(),
  relatedOrderId: int("relatedOrderId").references(() => paymentOrders.id),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TransactionRecord = typeof transactionRecords.$inferSelect;
export type InsertTransactionRecord = typeof transactionRecords.$inferInsert;

/**
 * Price history table - tracks ISC price changes
 */
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  iscPrice: decimal("iscPrice", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

/**
 * KYC verification table - stores player KYC information
 */
export const kycVerifications = mysqlTable("kyc_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  realName: varchar("realName", { length: 128 }).notNull(),
  idType: mysqlEnum("idType", ["passport", "id_card", "driver_license"]).notNull(),
  idNumber: varchar("idNumber", { length: 128 }).notNull(),
  idImage: text("idImage"), // URL
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KYCVerification = typeof kycVerifications.$inferSelect;
export type InsertKYCVerification = typeof kycVerifications.$inferInsert;

/**
 * Risk assessment table - tracks player risk scores
 */
export const riskAssessments = mysqlTable("risk_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  riskScore: int("riskScore").default(0).notNull(), // 0-100
  reasons: text("reasons"), // JSON array
  requiresVerification: boolean("requiresVerification").default(false).notNull(),
  blockedUntil: timestamp("blockedUntil"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = typeof riskAssessments.$inferInsert;

/**
 * Share statistics table - tracks poster shares to different platforms
 */
export const shareStatistics = mysqlTable("share_statistics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  transactionId: int("transactionId"),
  platform: mysqlEnum("platform", ["twitter", "telegram", "clipboard", "download"]).notNull(),
  transactionType: varchar("transactionType", { length: 32 }),
  amount: varchar("amount", { length: 78 }),
  success: boolean("success").default(true).notNull(),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  
  // Indexes for common queries
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  platformIdx: index("platform_idx").on(table.platform),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  userPlatformIdx: index("user_platform_idx").on(table.userId, table.platform),
}));

export type ShareStatistic = typeof shareStatistics.$inferSelect;
export type InsertShareStatistic = typeof shareStatistics.$inferInsert;


/**
 * Social economy constants are intentionally represented in whole ISC units.
 * In-game social actions use the internal ledger and do not trigger blockchain gas.
 */
export const socialWallets = mysqlTable("social_wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  megaphones: int("megaphones").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SocialWallet = typeof socialWallets.$inferSelect;
export type InsertSocialWallet = typeof socialWallets.$inferInsert;

export const socialTransactions = mysqlTable("social_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", [
    "megaphone_purchase",
    "world_message",
    "guild_creation",
    "team_creation",
    "friend_activation",
  ]).notNull(),
  amount: int("amount").notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 20, scale: 6 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  referenceId: varchar("referenceId", { length: 64 }),
  idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["completed", "failed"]).default("completed").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index("social_transactions_user_created_idx").on(table.userId, table.createdAt),
  referenceIdx: index("social_transactions_reference_idx").on(table.referenceId),
}));
export type SocialTransaction = typeof socialTransactions.$inferSelect;
export type InsertSocialTransaction = typeof socialTransactions.$inferInsert;

export const socialMessages = mysqlTable("social_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  senderUserId: int("senderUserId").notNull().references(() => users.id),
  channelType: mysqlEnum("channelType", ["world", "guild", "team", "private", "community"]).notNull(),
  channelId: varchar("channelId", { length: 64 }),
  recipientUserId: int("recipientUserId").references(() => users.id),
  content: varchar("content", { length: 500 }).notNull(),
  megaphoneConsumed: boolean("megaphoneConsumed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  channelCreatedIdx: index("social_messages_channel_created_idx").on(table.channelType, table.channelId, table.createdAt),
  recipientCreatedIdx: index("social_messages_recipient_created_idx").on(table.recipientUserId, table.createdAt),
}));
export type SocialMessage = typeof socialMessages.$inferSelect;
export type InsertSocialMessage = typeof socialMessages.$inferInsert;

export const socialFriendships = mysqlTable("social_friendships", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userLowId: int("userLowId").notNull().references(() => users.id),
  userHighId: int("userHighId").notNull().references(() => users.id),
  initiatedByUserId: int("initiatedByUserId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["active", "blocked"]).default("active").notNull(),
  privateChatEnabled: boolean("privateChatEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  pairUnique: uniqueIndex("social_friendships_pair_unique").on(table.userLowId, table.userHighId),
  userLowIdx: index("social_friendships_low_idx").on(table.userLowId),
  userHighIdx: index("social_friendships_high_idx").on(table.userHighId),
}));
export type SocialFriendship = typeof socialFriendships.$inferSelect;
export type InsertSocialFriendship = typeof socialFriendships.$inferInsert;

export const guilds = mysqlTable("guilds", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerUserId: int("ownerUserId").notNull().references(() => users.id),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: varchar("description", { length: 300 }),
  status: mysqlEnum("status", ["active", "closed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdx: index("guilds_owner_idx").on(table.ownerUserId),
}));
export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = typeof guilds.$inferInsert;

export const guildMembers = mysqlTable("guild_members", {
  id: int("id").autoincrement().primaryKey(),
  guildId: varchar("guildId", { length: 64 }).notNull().references(() => guilds.id),
  userId: int("userId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["leader", "officer", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  guildUserUnique: uniqueIndex("guild_members_guild_user_unique").on(table.guildId, table.userId),
  userIdx: index("guild_members_user_idx").on(table.userId),
}));
export type GuildMember = typeof guildMembers.$inferSelect;
export type InsertGuildMember = typeof guildMembers.$inferInsert;

export const teams = mysqlTable("teams", {
  id: varchar("id", { length: 64 }).primaryKey(),
  creatorUserId: int("creatorUserId").notNull().references(() => users.id),
  name: varchar("name", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["active", "expired", "closed"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  creatorIdx: index("teams_creator_idx").on(table.creatorUserId),
  expiryIdx: index("teams_expiry_idx").on(table.status, table.expiresAt),
}));
export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: varchar("teamId", { length: 64 }).notNull().references(() => teams.id),
  userId: int("userId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["leader", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  teamUserUnique: uniqueIndex("team_members_team_user_unique").on(table.teamId, table.userId),
  userIdx: index("team_members_user_idx").on(table.userId),
}));
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;


/**
 * Unified in-game consumption allocation ledger.
 * This is an internal accounting record; blockchain settlement is handled separately.
 */
export const gameConsumptionAllocations = mysqlTable("game_consumption_allocations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  scene: varchar("scene", { length: 64 }).notNull(),
  sourceTransactionId: varchar("sourceTransactionId", { length: 64 }),
  grossAmount: int("grossAmount").notNull(),
  treasuryAmount: int("treasuryAmount").notNull(),
  marketingAmount: int("marketingAmount").notNull(),
  treasuryAddress: varchar("treasuryAddress", { length: 42 }).notNull(),
  marketingWalletAddress: varchar("marketingWalletAddress", { length: 42 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["recorded", "settled", "failed"]).default("recorded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userSceneIdx: index("game_consumption_user_scene_idx").on(table.userId, table.scene, table.createdAt),
  sourceIdx: index("game_consumption_source_idx").on(table.sourceTransactionId),
}));
export type GameConsumptionAllocation = typeof gameConsumptionAllocations.$inferSelect;
export type InsertGameConsumptionAllocation = typeof gameConsumptionAllocations.$inferInsert;


/**
 * Wallet ownership bindings. A row is valid only after the user signs the exact challenge.
 */
export const walletBindings = mysqlTable("wallet_bindings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  walletAddress: varchar("walletAddress", { length: 42 }).notNull(),
  chainId: int("chainId").notNull(),
  nonce: varchar("nonce", { length: 128 }).notNull(),
  issuedAt: timestamp("issuedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  walletChainKey: uniqueIndex("wallet_bindings_wallet_chain_key").on(table.walletAddress, table.chainId),
  userIndex: index("wallet_bindings_user_idx").on(table.userId),
}));
export type WalletBinding = typeof walletBindings.$inferSelect;
export type InsertWalletBinding = typeof walletBindings.$inferInsert;

/**
 * Chain-indexed NFT holdings. Rows must be populated by verified chain events or
 * an explicit reconciliation job; the table is never seeded with demo holdings.
 */
export const playerNftHoldings = mysqlTable("player_nft_holdings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  walletAddress: varchar("walletAddress", { length: 42 }).notNull(),
  chainId: int("chainId").notNull(),
  nftContract: varchar("nftContract", { length: 42 }).notNull(),
  tokenId: varchar("tokenId", { length: 78 }).notNull(),
  amount: varchar("amount", { length: 78 }).notNull(),
  lastSyncedBlock: varchar("lastSyncedBlock", { length: 78 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownershipKey: uniqueIndex("player_nft_holdings_ownership_key").on(table.walletAddress, table.chainId, table.nftContract, table.tokenId),
  userIndex: index("player_nft_holdings_user_idx").on(table.userId, table.chainId),
}));

export type PlayerNftHolding = typeof playerNftHoldings.$inferSelect;
export type InsertPlayerNftHolding = typeof playerNftHoldings.$inferInsert;

/**
 * Signed NFT orders submitted by players. This table is an order-book record only:
 * it never signs, broadcasts, or settles a blockchain transaction on behalf of a user.
 */
export const signedNftOrders = mysqlTable("signed_nft_orders", {
  orderHash: varchar("orderHash", { length: 66 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  offerer: varchar("offerer", { length: 42 }).notNull(),
  nftContract: varchar("nftContract", { length: 42 }).notNull(),
  tokenId: varchar("tokenId", { length: 78 }).notNull(),
  amount: varchar("amount", { length: 78 }).notNull(),
  price: varchar("price", { length: 78 }).notNull(),
  expiration: varchar("expiration", { length: 78 }).notNull(),
  nonce: varchar("nonce", { length: 78 }).notNull(),
  itemType: int("itemType").notNull(),
  orderType: int("orderType").default(0).notNull(),
  salt: varchar("salt", { length: 66 }).notNull(),
  signature: varchar("signature", { length: 132 }).notNull(),
  chainId: int("chainId").notNull(),
  marketplaceAddress: varchar("marketplaceAddress", { length: 42 }).notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "fulfilled", "expired"]).default("active").notNull(),
  cancelTxHash: varchar("cancelTxHash", { length: 66 }),
  fulfillTxHash: varchar("fulfillTxHash", { length: 66 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  offererStatusIdx: index("signed_nft_orders_offerer_status_idx").on(table.offerer, table.status),
  expiryIdx: index("signed_nft_orders_expiry_idx").on(table.status, table.expiration),
  collectionIdx: index("signed_nft_orders_collection_idx").on(table.nftContract, table.tokenId),
}));

export type SignedNftOrder = typeof signedNftOrders.$inferSelect;
export type InsertSignedNftOrder = typeof signedNftOrders.$inferInsert;
