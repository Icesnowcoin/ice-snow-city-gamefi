# Backend Integration Plan - Ice Snow City Agent

## Overview
This document outlines the backend integration strategy for connecting the frontend game systems to the database and smart contracts.

## Phase 17: Backend Integration

### 1. Database Schema Extension

#### Game Player Profile Table
```sql
CREATE TABLE game_players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  username VARCHAR(128) NOT NULL,
  level INT DEFAULT 1,
  experience BIGINT DEFAULT 0,
  totalAssets BIGINT DEFAULT 0,
  iscBalance BIGINT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

#### NPC Table
```sql
CREATE TABLE npcs (
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
```

#### Player-NPC Relationship Table
```sql
CREATE TABLE player_npc_relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playerId INT NOT NULL,
  npcId INT NOT NULL,
  relationshipValue INT DEFAULT 0,
  lastInteraction TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_player_npc (playerId, npcId),
  FOREIGN KEY (playerId) REFERENCES game_players(id),
  FOREIGN KEY (npcId) REFERENCES npcs(id)
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  description TEXT,
  npcId INT,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  reward BIGINT DEFAULT 0,
  deadline DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (npcId) REFERENCES npcs(id)
);
```

#### Player Tasks Table
```sql
CREATE TABLE player_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playerId INT NOT NULL,
  taskId INT NOT NULL,
  status ENUM('available', 'in_progress', 'completed') DEFAULT 'available',
  progress INT DEFAULT 0,
  completedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_player_task (playerId, taskId),
  FOREIGN KEY (playerId) REFERENCES game_players(id),
  FOREIGN KEY (taskId) REFERENCES tasks(id)
);
```

#### Shop Items Table
```sql
CREATE TABLE shop_items (
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
```

#### Player Inventory Table
```sql
CREATE TABLE player_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playerId INT NOT NULL,
  itemId INT NOT NULL,
  quantity INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_player_item (playerId, itemId),
  FOREIGN KEY (playerId) REFERENCES game_players(id),
  FOREIGN KEY (itemId) REFERENCES shop_items(id)
);
```

#### Properties Table
```sql
CREATE TABLE properties (
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
  FOREIGN KEY (ownerId) REFERENCES game_players(id)
);
```

#### Farms Table
```sql
CREATE TABLE farms (
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
  FOREIGN KEY (playerId) REFERENCES game_players(id)
);
```

#### Wallet Transactions Table
```sql
CREATE TABLE wallet_transactions (
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
  FOREIGN KEY (playerId) REFERENCES game_players(id)
);
```

### 2. tRPC Procedures Implementation

#### Game Player Procedures
```typescript
// Get player profile
game.player.getProfile: protectedProcedure
  .query(async ({ ctx }) => {
    // Fetch player data from database
  })

// Update player profile
game.player.updateProfile: protectedProcedure
  .input(z.object({ username: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Update player data
  })

// Get player assets
game.player.getAssets: protectedProcedure
  .query(async ({ ctx }) => {
    // Fetch player assets (wallet, properties, inventory)
  })
```

#### NPC Procedures
```typescript
// Get all NPCs
game.npc.getAll: publicProcedure
  .query(async () => {
    // Fetch all NPCs with relationships
  })

// Get NPC details
game.npc.getDetails: publicProcedure
  .input(z.object({ npcId: z.number() }))
  .query(async ({ input }) => {
    // Fetch NPC details
  })

// Interact with NPC
game.npc.interact: protectedProcedure
  .input(z.object({ npcId: z.number(), action: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Handle NPC interaction
  })
```

#### Task Procedures
```typescript
// Get player tasks
game.task.getPlayerTasks: protectedProcedure
  .query(async ({ ctx }) => {
    // Fetch player tasks
  })

// Accept task
game.task.acceptTask: protectedProcedure
  .input(z.object({ taskId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Accept task
  })

// Complete task
game.task.completeTask: protectedProcedure
  .input(z.object({ taskId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Complete task and reward player
  })
```

#### Shop Procedures
```typescript
// Get shop items
game.shop.getItems: publicProcedure
  .query(async () => {
    // Fetch shop items
  })

// Purchase item
game.shop.purchaseItem: protectedProcedure
  .input(z.object({ itemId: z.number(), quantity: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Process purchase
  })
```

#### Real Estate Procedures
```typescript
// Get properties
game.realEstate.getProperties: publicProcedure
  .query(async () => {
    // Fetch properties
  })

// Purchase property
game.realEstate.purchaseProperty: protectedProcedure
  .input(z.object({ propertyId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Process property purchase
  })
```

#### Agriculture Procedures
```typescript
// Get player farms
game.agriculture.getFarms: protectedProcedure
  .query(async ({ ctx }) => {
    // Fetch player farms
  })

// Plant crop
game.agriculture.plantCrop: protectedProcedure
  .input(z.object({ farmId: z.number(), crop: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Plant crop
  })

// Harvest crop
game.agriculture.harvestCrop: protectedProcedure
  .input(z.object({ farmId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Harvest crop and reward player
  })
```

#### Wallet Procedures
```typescript
// Get wallet balance
game.wallet.getBalance: protectedProcedure
  .query(async ({ ctx }) => {
    // Fetch wallet balance
  })

// Get transactions
game.wallet.getTransactions: protectedProcedure
  .query(async ({ ctx }) => {
    // Fetch transaction history
  })

// Deposit ISC
game.wallet.deposit: protectedProcedure
  .input(z.object({ amount: z.bigint() }))
  .mutation(async ({ ctx, input }) => {
    // Process deposit
  })

// Withdraw ISC
game.wallet.withdraw: protectedProcedure
  .input(z.object({ amount: z.bigint(), address: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Process withdrawal
  })
```

### 3. Implementation Priority

1. **Database Schema** - Create all required tables
2. **Player Management** - Implement player profile and assets
3. **NPC System** - Implement NPC data and interactions
4. **Task System** - Implement task management
5. **Shop System** - Implement shop and inventory
6. **Real Estate** - Implement property management
7. **Agriculture** - Implement farm management
8. **Wallet** - Implement wallet and transactions

### 4. Smart Contract Integration

#### ISC Token Contract (ERC-20)
- Deploy on BSC testnet
- Mint initial supply
- Set up treasury contract
- Implement game logic contract

#### Game Logic Contract
- Player registration
- Task rewards
- Property ownership
- Crop harvesting
- Treasury management

## Phase 18: Smart Contract Development

### ISC Token Contract
- ERC-20 standard implementation
- Minting and burning
- Transfer functionality
- Approval mechanism

### Game Logic Contract
- Player state management
- Task completion rewards
- Property ownership tracking
- Crop harvesting logic
- Treasury balance management

### Testing
- Unit tests for all contracts
- Integration tests
- Testnet deployment
- Mainnet preparation

## Phase 19: Integration Testing

### Frontend-Backend Integration
- Test all tRPC procedures
- Verify data consistency
- Test error handling
- Performance testing

### Smart Contract Integration
- Test contract interactions
- Verify state changes
- Test gas optimization
- Security audit

## Phase 20: Production Deployment

### Database
- Production database setup
- Backup and recovery procedures
- Monitoring and alerts

### Smart Contracts
- Mainnet deployment
- Contract verification
- Security measures

### Frontend
- Production build
- CDN deployment
- Performance optimization

## Phase 21: Post-Launch

### Monitoring
- User analytics
- Performance metrics
- Error tracking

### Updates
- Bug fixes
- Feature enhancements
- Contract upgrades

---

## Implementation Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 17: Backend Integration | 2-3 days | In Progress |
| Phase 18: Smart Contracts | 2-3 days | Planned |
| Phase 19: Integration Testing | 1-2 days | Planned |
| Phase 20: Production Deployment | 1 day | Planned |
| Phase 21: Post-Launch | Ongoing | Planned |

---

## Notes

- All timestamps use UTC
- All amounts use wei (smallest unit)
- All database operations use transactions for consistency
- All smart contract interactions are audited
- All user data is encrypted and secured
