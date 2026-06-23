import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
  unique,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================================
// PLAYER SYSTEM
// ============================================================================

export const players = sqliteTable(
  "players",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    username: text("username").notNull(),
    level: integer("level").default(1).notNull(),
    experience: integer("experience").default(0).notNull(),
    stamina: integer("stamina").default(100).notNull(), // 0-100
    maxStamina: integer("max_stamina").default(100).notNull(),
    hunger: integer("hunger").default(100).notNull(), // 0-100
    thirst: integer("thirst").default(100).notNull(), // 0-100
    happiness: integer("happiness").default(50).notNull(), // 0-100
    health: integer("health").default(100).notNull(), // 0-100
    money: real("money").default(1000).notNull(), // ISC
    bankBalance: real("bank_balance").default(0).notNull(), // ISC in bank
    currentScene: text("current_scene").default("home").notNull(),
    homeId: text("home_id"), // Reference to property
    maritalStatus: text("marital_status").default("single").notNull(), // single, married, divorced
    spouseId: text("spouse_id"), // Reference to other player
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("players_user_id_idx").on(table.userId),
    sceneIdx: index("players_scene_idx").on(table.currentScene),
  })
);

export const playerRelations = relations(players, ({ many, one }) => ({
  inventory: many(playerInventory),
  tasks: many(playerTasks),
  npcRelationships: many(playerNpcRelationships),
  properties: many(properties),
  farms: many(farms),
  businesses: many(businesses),
  walletTransactions: many(walletTransactions),
  spouse: one(players, {
    fields: [players.spouseId],
    references: [players.id],
  }),
}));

// ============================================================================
// NPC SYSTEM
// ============================================================================

export const npcs = sqliteTable(
  "npcs",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    title: text("title").notNull(), // e.g., "Bank Manager", "Farmer"
    profession: text("profession").notNull(), // e.g., "banker", "farmer", "merchant"
    description: text("description").notNull(),
    avatar: text("avatar"), // URL to avatar image
    currentScene: text("current_scene").notNull(),
    currentX: integer("current_x").default(0).notNull(),
    currentY: integer("current_y").default(0).notNull(),
    money: real("money").default(0).notNull(), // ISC (data only, not real)
    inventory: text("inventory").default("{}").notNull(), // JSON
    personality: text("personality").notNull(), // e.g., "friendly", "strict", "cheerful"
    backstory: text("backstory").notNull(),
    schedule: text("schedule").notNull(), // JSON schedule
    isActive: integer("is_active").default(1).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    professionIdx: index("npcs_profession_idx").on(table.profession),
    sceneIdx: index("npcs_scene_idx").on(table.currentScene),
  })
);

export const npcRelations = relations(npcs, ({ many }) => ({
  playerRelationships: many(playerNpcRelationships),
  dialogues: many(npcDialogues),
  tasks: many(tasks),
}));

// ============================================================================
// NPC RELATIONSHIP SYSTEM
// ============================================================================

export const playerNpcRelationships = sqliteTable(
  "player_npc_relationships",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id").notNull(),
    npcId: text("npc_id").notNull(),
    affinity: integer("affinity").default(0).notNull(), // -100 to 100
    intimacy: integer("intimacy").default(0).notNull(), // 0 to 100
    status: text("status").default("stranger").notNull(), // stranger, acquaintance, friend, close_friend, lover
    lastInteraction: integer("last_interaction"),
    interactionCount: integer("interaction_count").default(0).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    playerNpcIdx: unique("player_npc_relationship_unique").on(
      table.playerId,
      table.npcId
    ),
  })
);

export const playerNpcRelationshipsRelations = relations(
  playerNpcRelationships,
  ({ one }) => ({
    player: one(players, {
      fields: [playerNpcRelationships.playerId],
      references: [players.id],
    }),
    npc: one(npcs, {
      fields: [playerNpcRelationships.npcId],
      references: [npcs.id],
    }),
  })
);

// ============================================================================
// NPC DIALOGUE SYSTEM
// ============================================================================

export const npcDialogues = sqliteTable(
  "npc_dialogues",
  {
    id: text("id").primaryKey(),
    npcId: text("npc_id").notNull(),
    dialogueText: text("dialogue_text").notNull(),
    dialogueType: text("dialogue_type").notNull(), // greeting, task, trade, advice, romance
    affinity_min: integer("affinity_min").default(0).notNull(),
    affinity_max: integer("affinity_max").default(100).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    npcIdx: index("npc_dialogues_npc_idx").on(table.npcId),
  })
);

export const npcDialoguesRelations = relations(npcDialogues, ({ one }) => ({
  npc: one(npcs, {
    fields: [npcDialogues.npcId],
    references: [npcs.id],
  }),
}));

// ============================================================================
// TASK SYSTEM
// ============================================================================

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    npcId: text("npc_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    taskType: text("task_type").notNull(), // fetch, deliver, produce, trade, explore
    reward_isc: real("reward_isc").default(0).notNull(),
    reward_exp: integer("reward_exp").default(0).notNull(),
    difficulty: text("difficulty").notNull(), // easy, medium, hard
    affinity_reward: integer("affinity_reward").default(10).notNull(),
    isActive: integer("is_active").default(1).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    npcIdx: index("tasks_npc_idx").on(table.npcId),
  })
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  npc: one(npcs, {
    fields: [tasks.npcId],
    references: [npcs.id],
  }),
  playerTasks: many(playerTasks),
}));

export const playerTasks = sqliteTable(
  "player_tasks",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id").notNull(),
    taskId: text("task_id").notNull(),
    status: text("status").default("pending").notNull(), // pending, in_progress, completed, failed
    progress: integer("progress").default(0).notNull(), // 0-100
    acceptedAt: integer("accepted_at"),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    playerTaskIdx: unique("player_task_unique").on(table.playerId, table.taskId),
  })
);

export const playerTasksRelations = relations(playerTasks, ({ one }) => ({
  player: one(players, {
    fields: [playerTasks.playerId],
    references: [players.id],
  }),
  task: one(tasks, {
    fields: [playerTasks.taskId],
    references: [tasks.id],
  }),
}));

// ============================================================================
// INVENTORY SYSTEM
// ============================================================================

export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    itemType: text("item_type").notNull(), // food, tool, furniture, crop, product
    basePrice: real("base_price").default(0).notNull(),
    rarity: text("rarity").default("common").notNull(), // common, uncommon, rare, epic, legendary
    createdAt: integer("created_at").notNull(),
  }
);

export const playerInventory = sqliteTable(
  "player_inventory",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id").notNull(),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    acquiredAt: integer("acquired_at").notNull(),
  },
  (table) => ({
    playerItemIdx: unique("player_item_unique").on(table.playerId, table.itemId),
  })
);

export const playerInventoryRelations = relations(
  playerInventory,
  ({ one }) => ({
    player: one(players, {
      fields: [playerInventory.playerId],
      references: [players.id],
    }),
    item: one(items, {
      fields: [playerInventory.itemId],
      references: [items.id],
    }),
  })
);

// ============================================================================
// PROPERTY SYSTEM
// ============================================================================

export const properties = sqliteTable(
  "properties",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    propertyType: text("property_type").notNull(), // house, apartment, shop, farm, factory
    name: text("name").notNull(),
    location: text("location").notNull(), // scene name
    purchasePrice: real("purchase_price").notNull(),
    currentValue: real("current_value").notNull(),
    monthlyMaintenance: real("monthly_maintenance").default(0).notNull(),
    monthlyRent: real("monthly_rent").default(0).notNull(), // if rented out
    isRented: integer("is_rented").default(0).notNull(),
    renterId: text("renter_id"), // if rented
    lastMaintenanceDate: integer("last_maintenance_date"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    ownerIdx: index("properties_owner_idx").on(table.ownerId),
    typeIdx: index("properties_type_idx").on(table.propertyType),
  })
);

export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(players, {
    fields: [properties.ownerId],
    references: [players.id],
  }),
}));

// ============================================================================
// FARM SYSTEM
// ============================================================================

export const farms = sqliteTable(
  "farms",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    propertyId: text("property_id").notNull(),
    name: text("name").notNull(),
    totalArea: integer("total_area").default(100).notNull(), // in square meters
    usedArea: integer("used_area").default(0).notNull(),
    cropType: text("crop_type"), // wheat, corn, tomato, etc.
    plantedAt: integer("planted_at"),
    harvestAt: integer("harvest_at"),
    harvestQuantity: integer("harvest_quantity").default(0).notNull(),
    lastHarvestDate: integer("last_harvest_date"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    ownerIdx: index("farms_owner_idx").on(table.ownerId),
  })
);

export const farmsRelations = relations(farms, ({ one }) => ({
  owner: one(players, {
    fields: [farms.ownerId],
    references: [players.id],
  }),
}));

// ============================================================================
// BUSINESS SYSTEM
// ============================================================================

export const businesses = sqliteTable(
  "businesses",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    propertyId: text("property_id").notNull(),
    businessType: text("business_type").notNull(), // shop, restaurant, cafe, factory
    name: text("name").notNull(),
    monthlyRevenue: real("monthly_revenue").default(0).notNull(),
    monthlyExpense: real("monthly_expense").default(0).notNull(),
    employees: integer("employees").default(0).notNull(),
    reputation: integer("reputation").default(50).notNull(), // 0-100
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    ownerIdx: index("businesses_owner_idx").on(table.ownerId),
  })
);

export const businessesRelations = relations(businesses, ({ one }) => ({
  owner: one(players, {
    fields: [businesses.ownerId],
    references: [players.id],
  }),
}));

// ============================================================================
// BANK SYSTEM
// ============================================================================

export const bankAccounts = sqliteTable(
  "bank_accounts",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id").notNull().unique(),
    balance: real("balance").default(0).notNull(),
    apy: real("apy").default(0.05).notNull(), // 5% default
    lastInterestDate: integer("last_interest_date"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  }
);

export const bankAccountsRelations = relations(bankAccounts, ({ one }) => ({
  player: one(players, {
    fields: [bankAccounts.playerId],
    references: [players.id],
  }),
}));

// ============================================================================
// WALLET & TRANSACTION SYSTEM
// ============================================================================

export const walletTransactions = sqliteTable(
  "wallet_transactions",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id").notNull(),
    type: text("type").notNull(), // deposit, withdraw, transfer, payment, reward
    amount: real("amount").notNull(),
    description: text("description"),
    relatedNpcId: text("related_npc_id"), // if transaction with NPC
    relatedPlayerId: text("related_player_id"), // if transfer between players
    status: text("status").default("completed").notNull(), // pending, completed, failed
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    playerIdx: index("transactions_player_idx").on(table.playerId),
    typeIdx: index("transactions_type_idx").on(table.type),
  })
);

export const walletTransactionsRelations = relations(
  walletTransactions,
  ({ one }) => ({
    player: one(players, {
      fields: [walletTransactions.playerId],
      references: [players.id],
    }),
  })
);

// ============================================================================
// MARKET SYSTEM
// ============================================================================

export const marketListings = sqliteTable(
  "market_listings",
  {
    id: text("id").primaryKey(),
    sellerId: text("seller_id").notNull(),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").notNull(),
    pricePerUnit: real("price_per_unit").notNull(),
    status: text("status").default("active").notNull(), // active, sold, cancelled
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    sellerIdx: index("listings_seller_idx").on(table.sellerId),
    statusIdx: index("listings_status_idx").on(table.status),
  })
);

export const marketTransactions = sqliteTable(
  "market_transactions",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id").notNull(),
    buyerId: text("buyer_id").notNull(),
    sellerId: text("seller_id").notNull(),
    quantity: integer("quantity").notNull(),
    totalPrice: real("total_price").notNull(),
    createdAt: integer("created_at").notNull(),
  }
);

// ============================================================================
// SCENE SYSTEM
// ============================================================================

export const scenes = sqliteTable(
  "scenes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    description: text("description").notNull(),
    sceneType: text("scene_type").notNull(), // bank, plaza, cafe, shop, farm, home, etc.
    maxPlayers: integer("max_players").default(100).notNull(),
    createdAt: integer("created_at").notNull(),
  }
);

// ============================================================================
// GAME STATE
// ============================================================================

export const gameState = sqliteTable(
  "game_state",
  {
    id: text("id").primaryKey().default("global"),
    currentDay: integer("current_day").default(1).notNull(),
    currentHour: integer("current_hour").default(0).notNull(), // 0-23
    gameSpeed: integer("game_speed").default(100).notNull(), // 100x speed
    iscPrice: real("isc_price").default(1.0).notNull(),
    totalPlayers: integer("total_players").default(0).notNull(),
    totalNpcs: integer("total_npcs").default(0).notNull(),
    lastUpdated: integer("last_updated").notNull(),
  }
);
