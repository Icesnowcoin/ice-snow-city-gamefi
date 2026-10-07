# 玩家 ISC 系统 - 详细技术实现指南

**文档版本**: 1.0  
**日期**: 2026-06-20  
**作者**: Manus AI  
**主题**: 玩家 ISC 赚取、消耗、存储的完整技术实现

---

## 1. 数据库设计

### 1.1 核心数据表

```sql
-- 玩家账户表
CREATE TABLE player_accounts (
  playerId VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  
  -- 钱包信息
  walletAddress VARCHAR(255) NOT NULL UNIQUE,
  walletPublicKey VARCHAR(255) NOT NULL,
  
  -- ISC 余额
  iscBalance DECIMAL(38, 18) NOT NULL DEFAULT 0,
  gameWalletBalance DECIMAL(38, 18) NOT NULL DEFAULT 0,
  lockedBalance DECIMAL(38, 18) NOT NULL DEFAULT 0,
  
  -- 统计信息
  totalEarned DECIMAL(38, 18) NOT NULL DEFAULT 0,
  totalSpent DECIMAL(38, 18) NOT NULL DEFAULT 0,
  totalTransactions INT NOT NULL DEFAULT 0,
  
  -- 状态
  status ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt TIMESTAMP,
  lastTransactionAt TIMESTAMP,
  
  INDEX idx_wallet (walletAddress),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
);

-- 玩家交易表
CREATE TABLE player_transactions (
  txId VARCHAR(255) PRIMARY KEY,
  playerId VARCHAR(255) NOT NULL,
  txType ENUM('earn', 'spend', 'transfer', 'exchange') NOT NULL,
  amount DECIMAL(38, 18) NOT NULL,
  description VARCHAR(500),
  relatedNPCId VARCHAR(255),
  relatedGameEventId VARCHAR(255),
  status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  blockchainTxHash VARCHAR(255),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP,
  
  FOREIGN KEY (playerId) REFERENCES player_accounts(playerId),
  INDEX idx_playerId (playerId),
  INDEX idx_txType (txType),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
);

-- 游戏钱包表
CREATE TABLE game_wallets (
  walletId VARCHAR(255) PRIMARY KEY,
  playerId VARCHAR(255) NOT NULL UNIQUE,
  balance DECIMAL(38, 18) NOT NULL DEFAULT 0,
  lastSyncAt TIMESTAMP,
  syncStatus ENUM('synced', 'syncing', 'pending') NOT NULL DEFAULT 'pending',
  
  FOREIGN KEY (playerId) REFERENCES player_accounts(playerId),
  INDEX idx_playerId (playerId)
);

-- 任务表
CREATE TABLE tasks (
  taskId VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reward DECIMAL(38, 18) NOT NULL,
  taskType ENUM('main', 'side', 'daily') NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  repeatable BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_taskType (taskType)
);

-- 玩家任务表
CREATE TABLE player_tasks (
  playerId VARCHAR(255) NOT NULL,
  taskId VARCHAR(255) NOT NULL,
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  completedAt TIMESTAMP,
  
  PRIMARY KEY (playerId, taskId),
  FOREIGN KEY (playerId) REFERENCES player_accounts(playerId),
  FOREIGN KEY (taskId) REFERENCES tasks(taskId),
  INDEX idx_playerId (playerId),
  INDEX idx_status (status)
);

-- 玩家与 NPC 关系表
CREATE TABLE player_npc_relationships (
  playerId VARCHAR(255) NOT NULL,
  npcId VARCHAR(255) NOT NULL,
  points INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  lastInteractionAt TIMESTAMP,
  
  PRIMARY KEY (playerId, npcId),
  FOREIGN KEY (playerId) REFERENCES player_accounts(playerId),
  INDEX idx_playerId (playerId),
  INDEX idx_level (level)
);

-- 商城商品表
CREATE TABLE shop_items (
  itemId VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(38, 18) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INT NOT NULL DEFAULT -1, -- -1 表示无限库存
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_status (status)
);

-- 玩家背包表
CREATE TABLE player_inventory (
  playerId VARCHAR(255) NOT NULL,
  itemId VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  acquiredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (playerId, itemId),
  FOREIGN KEY (playerId) REFERENCES player_accounts(playerId),
  FOREIGN KEY (itemId) REFERENCES shop_items(itemId),
  INDEX idx_playerId (playerId)
);

-- 审计日志表
CREATE TABLE audit_logs (
  logId VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  resourceId VARCHAR(255),
  status ENUM('success', 'failed') NOT NULL,
  details JSON,
  encryptedDetails LONGBLOB, -- AES-256-GCM 加密的详细信息
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_userId (userId),
  INDEX idx_action (action),
  INDEX idx_createdAt (createdAt)
);
```

---

## 2. 核心业务逻辑实现

### 2.1 玩家账户初始化

```typescript
/**
 * 玩家账户初始化服务
 */
export class PlayerAccountInitService {
  /**
   * 初始化新玩家账户
   */
  async initializePlayerAccount(
    playerId: string,
    username: string,
    email: string
  ): Promise<{
    playerId: string;
    walletAddress: string;
    iscBalance: string;
  }> {
    try {
      // 1. 验证玩家是否已存在
      const existingAccount = await db
        .select()
        .from(playerAccounts)
        .where(eq(playerAccounts.playerId, playerId))
        .limit(1);

      if (existingAccount[0]) {
        throw new Error("Player account already exists");
      }

      // 2. 为玩家创建钱包
      // 使用确定性钱包生成 (BIP-32/44)
      const wallet = this.generateDeterministicWallet(playerId);

      // 3. 在数据库中创建玩家账户
      await db.insert(playerAccounts).values({
        playerId,
        username,
        email,
        walletAddress: wallet.address,
        walletPublicKey: wallet.publicKey,
        iscBalance: "0",
        gameWalletBalance: "0",
        lockedBalance: "0",
        totalEarned: "0",
        totalSpent: "0",
        totalTransactions: 0,
        status: "active",
        createdAt: new Date(),
      });

      // 4. 创建游戏钱包
      await db.insert(gameWallets).values({
        walletId: `game_wallet_${playerId}`,
        playerId,
        balance: "0",
        syncStatus: "synced",
      });

      // 5. 记录审计日志
      await auditLogService.logAction({
        userId: playerId,
        action: "PLAYER_ACCOUNT_INITIALIZED",
        resource: "player_accounts",
        resourceId: playerId,
        status: "success",
        details: {
          username,
          email,
          walletAddress: wallet.address,
        },
      });

      return {
        playerId,
        walletAddress: wallet.address,
        iscBalance: "0",
      };
    } catch (error) {
      console.error("Player account initialization failed:", error);
      throw error;
    }
  }

  /**
   * 生成确定性钱包
   * 使用 BIP-32/44 标准
   */
  private generateDeterministicWallet(playerId: string): {
    address: string;
    publicKey: string;
  } {
    // 1. 使用 playerId 作为种子
    const seed = ethers.id(playerId);

    // 2. 从种子生成钱包
    const wallet = ethers.Wallet.fromSeed(seed);

    return {
      address: wallet.address,
      publicKey: wallet.publicKey,
    };
  }
}
```

### 2.2 玩家赚取 ISC 的实现

```typescript
/**
 * 玩家赚取 ISC 的核心服务
 */
export class PlayerEarnISCService {
  /**
   * 完成任务赚取 ISC
   */
  async completeTaskAndEarnISC(
    playerId: string,
    taskId: string
  ): Promise<{
    success: boolean;
    iscReward: string;
    newBalance: string;
    txHash: string;
  }> {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. 验证任务存在且有效
      const task = await this.validateTask(taskId);

      // 2. 验证玩家是否已完成此任务
      await this.validatePlayerTaskCompletion(playerId, taskId, task);

      // 3. 获取任务奖励
      const iscReward = task.reward;

      // 4. 创建待处理交易记录
      await this.createPendingTransaction(txId, playerId, "earn", iscReward, `Task completed: ${task.title}`, taskId);

      // 5. 执行 ISC 转账 (游戏金库 → 玩家)
      const txHash = await this.executeISCTransfer(
        GAME_TREASURY_ADDRESS,
        playerId,
        iscReward
      );

      // 6. 更新玩家账户
      const newBalance = await this.updatePlayerBalance(playerId, iscReward, "add");

      // 7. 标记任务为已完成
      await this.markTaskAsCompleted(playerId, taskId);

      // 8. 更新交易记录为成功
      await this.updateTransactionStatus(txId, "success", txHash);

      // 9. 记录审计日志
      await auditLogService.logAction({
        userId: playerId,
        action: "TASK_COMPLETED_EARN_ISC",
        resource: "tasks",
        resourceId: taskId,
        status: "success",
        details: {
          txId,
          iscReward,
          newBalance,
          txHash,
        },
      });

      return {
        success: true,
        iscReward,
        newBalance,
        txHash,
      };
    } catch (error) {
      // 更新交易记录为失败
      await this.updateTransactionStatus(txId, "failed", "");
      console.error("Complete task and earn ISC failed:", error);
      throw error;
    }
  }

  /**
   * 与 NPC 交互赚取 ISC
   */
  async interactWithNPCAndEarnISC(
    playerId: string,
    npcId: string,
    interactionType: "chat" | "service" | "trade"
  ): Promise<{
    success: boolean;
    iscReward: string;
    newBalance: string;
    npcResponse: string;
  }> {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. 验证 NPC 存在
      const npc = await this.validateNPC(npcId);

      // 2. 计算奖励
      const baseReward = this.calculateBaseReward(interactionType);
      const relationshipBonus = await this.getRelationshipBonus(playerId, npcId);
      const iscReward = this.applyBonus(baseReward, relationshipBonus);

      // 3. 创建待处理交易记录
      await this.createPendingTransaction(
        txId,
        playerId,
        "earn",
        iscReward,
        `NPC interaction: ${npc.name} (${interactionType})`,
        npcId
      );

      // 4. 执行 ISC 转账
      const txHash = await this.executeISCTransfer(
        NPC_REWARD_POOL_ADDRESS,
        playerId,
        iscReward
      );

      // 5. 更新玩家账户
      const newBalance = await this.updatePlayerBalance(playerId, iscReward, "add");

      // 6. 更新玩家与 NPC 的关系
      await this.updatePlayerNPCRelationship(playerId, npcId, 10);

      // 7. 更新交易记录为成功
      await this.updateTransactionStatus(txId, "success", txHash);

      // 8. 生成 NPC 回应
      const npcResponse = this.generateNPCResponse(npc, interactionType);

      return {
        success: true,
        iscReward,
        newBalance,
        npcResponse,
      };
    } catch (error) {
      await this.updateTransactionStatus(txId, "failed", "");
      console.error("NPC interaction earn ISC failed:", error);
      throw error;
    }
  }

  /**
   * 计算基础奖励
   */
  private calculateBaseReward(interactionType: string): string {
    const rewards = {
      chat: Math.floor(Math.random() * 15 + 5),
      service: Math.floor(Math.random() * 80 + 20),
      trade: Math.floor(Math.random() * 150 + 50),
    };
    return rewards[interactionType]?.toString() || "0";
  }

  /**
   * 获取关系加成
   */
  private async getRelationshipBonus(playerId: string, npcId: string): Promise<number> {
    const relationship = await db
      .select()
      .from(playerNPCRelationships)
      .where(
        and(
          eq(playerNPCRelationships.playerId, playerId),
          eq(playerNPCRelationships.npcId, npcId)
        )
      )
      .limit(1);

    if (relationship[0]) {
      return relationship[0].level * 0.1; // 每级 10% 加成
    }
    return 0;
  }

  /**
   * 应用加成
   */
  private applyBonus(baseReward: string, bonus: number): string {
    const reward = BigInt(baseReward);
    const bonusAmount = reward * BigInt(Math.floor(bonus * 100)) / BigInt(100);
    return (reward + bonusAmount).toString();
  }

  /**
   * 执行 ISC 转账
   */
  private async executeISCTransfer(
    from: string,
    toPlayerId: string,
    amount: string
  ): Promise<string> {
    // 1. 获取玩家钱包地址
    const playerAccount = await db
      .select()
      .from(playerAccounts)
      .where(eq(playerAccounts.playerId, toPlayerId))
      .limit(1);

    if (!playerAccount[0]) {
      throw new Error("Player account not found");
    }

    // 2. 调用智能合约进行转账
    const contract = getISCContract();
    const tx = await contract.transfer(playerAccount[0].walletAddress, amount);

    // 3. 等待交易确认
    const receipt = await tx.wait();

    return receipt.transactionHash;
  }

  /**
   * 更新玩家余额
   */
  private async updatePlayerBalance(
    playerId: string,
    amount: string,
    operation: "add" | "subtract"
  ): Promise<string> {
    const playerAccount = await db
      .select()
      .from(playerAccounts)
      .where(eq(playerAccounts.playerId, playerId))
      .limit(1);

    if (!playerAccount[0]) {
      throw new Error("Player account not found");
    }

    const currentBalance = BigInt(playerAccount[0].iscBalance);
    const amountBigInt = BigInt(amount);

    let newBalance: bigint;
    if (operation === "add") {
      newBalance = currentBalance + amountBigInt;
    } else {
      if (currentBalance < amountBigInt) {
        throw new Error("Insufficient balance");
      }
      newBalance = currentBalance - amountBigInt;
    }

    // 更新数据库
    await db
      .update(playerAccounts)
      .set({
        iscBalance: newBalance.toString(),
        totalEarned:
          operation === "add"
            ? (BigInt(playerAccount[0].totalEarned) + amountBigInt).toString()
            : playerAccount[0].totalEarned,
        totalSpent:
          operation === "subtract"
            ? (BigInt(playerAccount[0].totalSpent) + amountBigInt).toString()
            : playerAccount[0].totalSpent,
        lastTransactionAt: new Date(),
      })
      .where(eq(playerAccounts.playerId, playerId));

    return newBalance.toString();
  }

  /**
   * 创建待处理交易记录
   */
  private async createPendingTransaction(
    txId: string,
    playerId: string,
    txType: string,
    amount: string,
    description: string,
    relatedId?: string
  ): Promise<void> {
    await db.insert(playerTransactions).values({
      txId,
      playerId,
      txType,
      amount,
      description,
      relatedGameEventId: relatedId,
      status: "pending",
      createdAt: new Date(),
    });
  }

  /**
   * 更新交易状态
   */
  private async updateTransactionStatus(
    txId: string,
    status: string,
    txHash: string
  ): Promise<void> {
    await db
      .update(playerTransactions)
      .set({
        status,
        blockchainTxHash: txHash,
        completedAt: new Date(),
      })
      .where(eq(playerTransactions.txId, txId));
  }

  /**
   * 验证任务
   */
  private async validateTask(taskId: string): Promise<any> {
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.taskId, taskId))
      .limit(1);

    if (!task[0]) {
      throw new Error("Task not found");
    }

    if (task[0].status !== "active") {
      throw new Error("Task is not active");
    }

    return task[0];
  }

  /**
   * 验证玩家任务完成状态
   */
  private async validatePlayerTaskCompletion(
    playerId: string,
    taskId: string,
    task: any
  ): Promise<void> {
    const playerTask = await db
      .select()
      .from(playerTasks)
      .where(
        and(
          eq(playerTasks.playerId, playerId),
          eq(playerTasks.taskId, taskId)
        )
      )
      .limit(1);

    if (playerTask[0] && playerTask[0].status === "completed" && !task.repeatable) {
      throw new Error("Task already completed");
    }
  }

  /**
   * 标记任务为已完成
   */
  private async markTaskAsCompleted(playerId: string, taskId: string): Promise<void> {
    const playerTask = await db
      .select()
      .from(playerTasks)
      .where(
        and(
          eq(playerTasks.playerId, playerId),
          eq(playerTasks.taskId, taskId)
        )
      )
      .limit(1);

    if (playerTask[0]) {
      await db
        .update(playerTasks)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(
          and(
            eq(playerTasks.playerId, playerId),
            eq(playerTasks.taskId, taskId)
          )
        );
    } else {
      await db.insert(playerTasks).values({
        playerId,
        taskId,
        status: "completed",
        completedAt: new Date(),
      });
    }
  }

  /**
   * 验证 NPC
   */
  private async validateNPC(npcId: string): Promise<any> {
    const npc = await db
      .select()
      .from(npcProfiles)
      .where(eq(npcProfiles.npcId, npcId))
      .limit(1);

    if (!npc[0]) {
      throw new Error("NPC not found");
    }

    return npc[0];
  }

  /**
   * 更新玩家与 NPC 的关系
   */
  private async updatePlayerNPCRelationship(
    playerId: string,
    npcId: string,
    pointsToAdd: number
  ): Promise<void> {
    const relationship = await db
      .select()
      .from(playerNPCRelationships)
      .where(
        and(
          eq(playerNPCRelationships.playerId, playerId),
          eq(playerNPCRelationships.npcId, npcId)
        )
      )
      .limit(1);

    if (relationship[0]) {
      const newPoints = relationship[0].points + pointsToAdd;
      const newLevel = Math.floor(newPoints / 100) + 1;

      await db
        .update(playerNPCRelationships)
        .set({
          points: newPoints,
          level: newLevel,
          lastInteractionAt: new Date(),
        })
        .where(
          and(
            eq(playerNPCRelationships.playerId, playerId),
            eq(playerNPCRelationships.npcId, npcId)
          )
        );
    } else {
      await db.insert(playerNPCRelationships).values({
        playerId,
        npcId,
        points: pointsToAdd,
        level: 1,
        lastInteractionAt: new Date(),
      });
    }
  }

  /**
   * 生成 NPC 回应
   */
  private generateNPCResponse(npc: any, interactionType: string): string {
    const responses = {
      chat: `${npc.name}: 很高兴见到你！`,
      service: `${npc.name}: 感谢你的帮助！`,
      trade: `${npc.name}: 这是一笔不错的交易！`,
    };
    return responses[interactionType] || `${npc.name}: 你好！`;
  }
}
```

### 2.3 玩家消耗 ISC 的实现

```typescript
/**
 * 玩家消耗 ISC 的核心服务
 */
export class PlayerSpendISCService {
  /**
   * 购买商品
   */
  async purchaseItem(
    playerId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<{
    success: boolean;
    itemName: string;
    totalCost: string;
    newBalance: string;
    txHash: string;
  }> {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. 验证商品存在
      const item = await this.validateItem(itemId);

      // 2. 计算总成本
      const totalCost = BigInt(item.price) * BigInt(quantity);

      // 3. 验证玩家余额
      const playerAccount = await this.validatePlayerBalance(playerId, totalCost);

      // 4. 创建待处理交易记录
      await this.createPendingTransaction(
        txId,
        playerId,
        "spend",
        totalCost.toString(),
        `Purchase: ${item.name} x${quantity}`
      );

      // 5. 执行 ISC 转账 (玩家 → 游戏金库)
      const txHash = await this.executeISCTransfer(
        playerId,
        GAME_TREASURY_ADDRESS,
        totalCost.toString()
      );

      // 6. 更新玩家余额
      const newBalance = await this.updatePlayerBalance(playerId, totalCost.toString(), "subtract");

      // 7. 添加商品到玩家背包
      await this.addItemToInventory(playerId, itemId, quantity);

      // 8. 更新交易记录为成功
      await this.updateTransactionStatus(txId, "success", txHash);

      // 9. 记录审计日志
      await auditLogService.logAction({
        userId: playerId,
        action: "ITEM_PURCHASED",
        resource: "shop_items",
        resourceId: itemId,
        status: "success",
        details: {
          itemName: item.name,
          quantity,
          totalCost: totalCost.toString(),
          txHash,
          newBalance,
        },
      });

      return {
        success: true,
        itemName: item.name,
        totalCost: totalCost.toString(),
        newBalance,
        txHash,
      };
    } catch (error) {
      await this.updateTransactionStatus(txId, "failed", "");
      console.error("Purchase item failed:", error);
      throw error;
    }
  }

  /**
   * 验证商品
   */
  private async validateItem(itemId: string): Promise<any> {
    const item = await db
      .select()
      .from(shopItems)
      .where(eq(shopItems.itemId, itemId))
      .limit(1);

    if (!item[0]) {
      throw new Error("Item not found");
    }

    if (item[0].status !== "active") {
      throw new Error("Item is not active");
    }

    return item[0];
  }

  /**
   * 验证玩家余额
   */
  private async validatePlayerBalance(
    playerId: string,
    requiredAmount: bigint
  ): Promise<any> {
    const playerAccount = await db
      .select()
      .from(playerAccounts)
      .where(eq(playerAccounts.playerId, playerId))
      .limit(1);

    if (!playerAccount[0]) {
      throw new Error("Player account not found");
    }

    const balance = BigInt(playerAccount[0].iscBalance);
    if (balance < requiredAmount) {
      throw new Error("Insufficient ISC balance");
    }

    return playerAccount[0];
  }

  /**
   * 执行 ISC 转账
   */
  private async executeISCTransfer(
    fromPlayerId: string,
    toAddress: string,
    amount: string
  ): Promise<string> {
    // 1. 获取玩家钱包地址
    const playerAccount = await db
      .select()
      .from(playerAccounts)
      .where(eq(playerAccounts.playerId, fromPlayerId))
      .limit(1);

    if (!playerAccount[0]) {
      throw new Error("Player account not found");
    }

    // 2. 调用智能合约进行转账
    const contract = getISCContract();
    const tx = await contract.transfer(toAddress, amount);

    // 3. 等待交易确认
    const receipt = await tx.wait();

    return receipt.transactionHash;
  }

  /**
   * 添加商品到背包
   */
  private async addItemToInventory(
    playerId: string,
    itemId: string,
    quantity: number
  ): Promise<void> {
    const inventoryItem = await db
      .select()
      .from(playerInventory)
      .where(
        and(
          eq(playerInventory.playerId, playerId),
          eq(playerInventory.itemId, itemId)
        )
      )
      .limit(1);

    if (inventoryItem[0]) {
      await db
        .update(playerInventory)
        .set({
          quantity: inventoryItem[0].quantity + quantity,
        })
        .where(
          and(
            eq(playerInventory.playerId, playerId),
            eq(playerInventory.itemId, itemId)
          )
        );
    } else {
      await db.insert(playerInventory).values({
        playerId,
        itemId,
        quantity,
        acquiredAt: new Date(),
      });
    }
  }

  /**
   * 创建待处理交易记录
   */
  private async createPendingTransaction(
    txId: string,
    playerId: string,
    txType: string,
    amount: string,
    description: string
  ): Promise<void> {
    await db.insert(playerTransactions).values({
      txId,
      playerId,
      txType,
      amount,
      description,
      status: "pending",
      createdAt: new Date(),
    });
  }

  /**
   * 更新玩家余额
   */
  private async updatePlayerBalance(
    playerId: string,
    amount: string,
    operation: "add" | "subtract"
  ): Promise<string> {
    const playerAccount = await db
      .select()
      .from(playerAccounts)
      .where(eq(playerAccounts.playerId, playerId))
      .limit(1);

    if (!playerAccount[0]) {
      throw new Error("Player account not found");
    }

    const currentBalance = BigInt(playerAccount[0].iscBalance);
    const amountBigInt = BigInt(amount);

    let newBalance: bigint;
    if (operation === "add") {
      newBalance = currentBalance + amountBigInt;
    } else {
      if (currentBalance < amountBigInt) {
        throw new Error("Insufficient balance");
      }
      newBalance = currentBalance - amountBigInt;
    }

    await db
      .update(playerAccounts)
      .set({
        iscBalance: newBalance.toString(),
        totalSpent:
          operation === "subtract"
            ? (BigInt(playerAccount[0].totalSpent) + amountBigInt).toString()
            : playerAccount[0].totalSpent,
        lastTransactionAt: new Date(),
      })
      .where(eq(playerAccounts.playerId, playerId));

    return newBalance.toString();
  }

  /**
   * 更新交易状态
   */
  private async updateTransactionStatus(
    txId: string,
    status: string,
    txHash: string
  ): Promise<void> {
    await db
      .update(playerTransactions)
      .set({
        status,
        blockchainTxHash: txHash,
        completedAt: new Date(),
      })
      .where(eq(playerTransactions.txId, txId));
  }
}
```

---

## 3. tRPC 路由实现

### 3.1 玩家 ISC 路由

```typescript
/**
 * 玩家 ISC 相关的 tRPC 路由
 */
export const playerISCRouter = router({
  /**
   * 获取玩家账户信息
   */
  getPlayerAccount: protectedProcedure.query(async ({ ctx }) => {
    const playerAccount = await db
      .select()
      .from(playerAccounts)
      .where(eq(playerAccounts.playerId, ctx.user.id))
      .limit(1);

    if (!playerAccount[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Player account not found",
      });
    }

    return {
      playerId: playerAccount[0].playerId,
      username: playerAccount[0].username,
      walletAddress: playerAccount[0].walletAddress,
      iscBalance: playerAccount[0].iscBalance,
      gameWalletBalance: playerAccount[0].gameWalletBalance,
      totalEarned: playerAccount[0].totalEarned,
      totalSpent: playerAccount[0].totalSpent,
      totalTransactions: playerAccount[0].totalTransactions,
    };
  }),

  /**
   * 完成任务赚取 ISC
   */
  completeTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const earnService = new PlayerEarnISCService();
      return await earnService.completeTaskAndEarnISC(ctx.user.id, input.taskId);
    }),

  /**
   * 与 NPC 交互赚取 ISC
   */
  interactWithNPC: protectedProcedure
    .input(
      z.object({
        npcId: z.string(),
        interactionType: z.enum(["chat", "service", "trade"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const earnService = new PlayerEarnISCService();
      return await earnService.interactWithNPCAndEarnISC(
        ctx.user.id,
        input.npcId,
        input.interactionType
      );
    }),

  /**
   * 购买商品消耗 ISC
   */
  purchaseItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const spendService = new PlayerSpendISCService();
      return await spendService.purchaseItem(ctx.user.id, input.itemId, input.quantity);
    }),

  /**
   * 获取玩家交易历史
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const transactions = await db
        .select()
        .from(playerTransactions)
        .where(eq(playerTransactions.playerId, ctx.user.id))
        .orderBy(desc(playerTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return transactions.map((tx) => ({
        txId: tx.txId,
        txType: tx.txType,
        amount: tx.amount,
        description: tx.description,
        status: tx.status,
        createdAt: tx.createdAt,
      }));
    }),

  /**
   * 获取可用任务列表
   */
  getAvailableTasks: protectedProcedure.query(async ({ ctx }) => {
    const earnService = new PlayerEarnISCService();
    return await earnService.getAvailableTasks(ctx.user.id);
  }),

  /**
   * 获取商城商品列表
   */
  getShopItems: protectedProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input }) => {
      const spendService = new PlayerSpendISCService();
      return await spendService.getShopItems(input.category);
    }),

  /**
   * 同步玩家 ISC 余额
   */
  syncISCBalance: protectedProcedure.mutation(async ({ ctx }) => {
    const walletService = new PlayerWalletSystem();
    return await walletService.syncPlayerISCBalance(ctx.user.id);
  }),

  /**
   * 玩家提现
   */
  withdraw: protectedProcedure
    .input(z.object({ amount: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const walletService = new PlayerWalletSystem();
      return await walletService.playerWithdraw(ctx.user.id, input.amount);
    }),

  /**
   * 玩家充值
   */
  deposit: protectedProcedure
    .input(z.object({ txHash: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const walletService = new PlayerWalletSystem();
      return await walletService.playerDeposit(ctx.user.id, input.txHash);
    }),
});
```

---

## 4. 前端集成示例

### 4.1 React 组件示例

```typescript
/**
 * 玩家 ISC 仪表板组件
 */
export function PlayerISCDashboard() {
  const { data: playerAccount, isLoading } = trpc.playerISC.getPlayerAccount.useQuery();
  const { data: transactions } = trpc.playerISC.getTransactionHistory.useQuery({
    limit: 10,
  });

  const completeTaskMutation = trpc.playerISC.completeTask.useMutation();
  const purchaseItemMutation = trpc.playerISC.purchaseItem.useMutation();

  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await completeTaskMutation.mutateAsync({ taskId });
      toast.success(`获得 ${result.iscReward} ISC！`);
    } catch (error) {
      toast.error("任务完成失败");
    }
  };

  const handlePurchaseItem = async (itemId: string, quantity: number) => {
    try {
      const result = await purchaseItemMutation.mutateAsync({ itemId, quantity });
      toast.success(`购买成功！消耗 ${result.totalCost} ISC`);
    } catch (error) {
      toast.error("购买失败");
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">
      {/* ISC 余额卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>ISC 余额</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{playerAccount?.iscBalance} ISC</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">总赚取</p>
              <p className="text-lg font-semibold">{playerAccount?.totalEarned} ISC</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">总消耗</p>
              <p className="text-lg font-semibold">{playerAccount?.totalSpent} ISC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易历史 */}
      <Card>
        <CardHeader>
          <CardTitle>交易历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions?.map((tx) => (
              <div key={tx.txId} className="flex justify-between items-center p-2 border-b">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <div className={tx.txType === "earn" ? "text-green-600" : "text-red-600"}>
                  {tx.txType === "earn" ? "+" : "-"} {tx.amount} ISC
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 5. 工作流程总结

### 5.1 完整的玩家 ISC 交互流程

```
玩家登录
  ↓
[初始化玩家账户]
  ├─ 创建钱包
  ├─ 初始化 ISC 余额
  └─ 创建游戏钱包

玩家完成任务
  ↓
[调用 completeTask API]
  ├─ 验证任务
  ├─ 创建交易记录
  ├─ 执行区块链转账
  ├─ 更新玩家余额
  └─ 返回结果

玩家购买商品
  ↓
[调用 purchaseItem API]
  ├─ 验证商品
  ├─ 验证玩家余额
  ├─ 创建交易记录
  ├─ 执行区块链转账
  ├─ 添加商品到背包
  └─ 返回结果

玩家查看余额
  ↓
[调用 getPlayerAccount API]
  ├─ 从数据库获取缓存余额
  ├─ 从区块链同步最新余额
  ├─ 对比两个余额
  └─ 返回最新余额

玩家提现
  ↓
[调用 withdraw API]
  ├─ 验证余额
  ├─ 执行区块链转账
  ├─ 更新玩家余额
  └─ 返回结果
```

---

**文档版本**: 1.0  
**最后更新**: 2026-06-20  
**作者**: Manus AI
