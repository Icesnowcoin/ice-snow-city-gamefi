-- Game Players Table
CREATE TABLE IF NOT EXISTS game_players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  username VARCHAR(128) NOT NULL,
  level INT DEFAULT 1,
  experience BIGINT DEFAULT 0,
  totalAssets BIGINT DEFAULT 0,
  iscBalance BIGINT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- NPCs Table
CREATE TABLE IF NOT EXISTS npcs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  profession VARCHAR(64) NOT NULL,
  location VARCHAR(128),
  status ENUM('available', 'busy', 'offline') DEFAULT 'available',
  relationshipBase INT DEFAULT 0,
  image VARCHAR(256),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player-NPC Relationships Table
CREATE TABLE IF NOT EXISTS player_npc_relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playerId INT NOT NULL,
  npcId INT NOT NULL,
  relationshipValue INT DEFAULT 0,
  lastInteraction TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_player_npc (playerId, npcId),
  FOREIGN KEY (playerId) REFERENCES game_players(id) ON DELETE CASCADE,
  FOREIGN KEY (npcId) REFERENCES npcs(id) ON DELETE CASCADE
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  description TEXT,
  npcId INT,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  reward BIGINT DEFAULT 0,
  deadline DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (npcId) REFERENCES npcs(id) ON DELETE SET NULL
);

-- Player Tasks Table
CREATE TABLE IF NOT EXISTS player_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playerId INT NOT NULL,
  taskId INT NOT NULL,
  status ENUM('available', 'in_progress', 'completed') DEFAULT 'available',
  progress INT DEFAULT 0,
  completedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_player_task (playerId, taskId),
  FOREIGN KEY (playerId) REFERENCES game_players(id) ON DELETE CASCADE,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Shop Items Table
CREATE TABLE IF NOT EXISTS shop_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  category VARCHAR(64),
  price BIGINT NOT NULL,
  stock INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews INT DEFAULT 0,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player Inventory Table
CREATE TABLE IF NOT EXISTS player_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playerId INT NOT NULL,
  itemId INT NOT NULL,
  quantity INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_player_item (playerId, itemId),
  FOREIGN KEY (playerId) REFERENCES game_players(id) ON DELETE CASCADE,
  FOREIGN KEY (itemId) REFERENCES shop_items(id) ON DELETE CASCADE
);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  location VARCHAR(128),
  type ENUM('residential', 'commercial', 'industrial') DEFAULT 'residential',
  price BIGINT NOT NULL,
  area INT,
  monthlyIncome BIGINT DEFAULT 0,
  occupancy INT DEFAULT 0,
  status ENUM('available', 'owned', 'rented') DEFAULT 'available',
  ownerId INT,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES game_players(id) ON DELETE SET NULL
);

-- Farms Table
CREATE TABLE IF NOT EXISTS farms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playerId INT NOT NULL,
  name VARCHAR(128),
  crop VARCHAR(64),
  area INT,
  status ENUM('empty', 'planting', 'growing', 'ready', 'harvested') DEFAULT 'empty',
  plantedAt TIMESTAMP,
  harvestAt TIMESTAMP,
  growth INT DEFAULT 0,
  expectedYield BIGINT DEFAULT 0,
  currentYield BIGINT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playerId) REFERENCES game_players(id) ON DELETE CASCADE
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playerId INT NOT NULL,
  type ENUM('deposit', 'withdraw', 'transfer', 'purchase', 'reward') DEFAULT 'transfer',
  amount BIGINT NOT NULL,
  fromAddress VARCHAR(42),
  toAddress VARCHAR(42),
  txHash VARCHAR(66),
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playerId) REFERENCES game_players(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_game_players_userId ON game_players(userId);
CREATE INDEX idx_player_npc_relationships_playerId ON player_npc_relationships(playerId);
CREATE INDEX idx_player_tasks_playerId ON player_tasks(playerId);
CREATE INDEX idx_player_inventory_playerId ON player_inventory(playerId);
CREATE INDEX idx_properties_ownerId ON properties(ownerId);
CREATE INDEX idx_farms_playerId ON farms(playerId);
CREATE INDEX idx_wallet_transactions_playerId ON wallet_transactions(playerId);
