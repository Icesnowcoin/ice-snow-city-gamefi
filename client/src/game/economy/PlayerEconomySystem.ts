/**
 * 玩家经济系统 - 管理玩家的金币、经验、物品等资源
 */

export type CurrencyType = 'coin' | 'experience' | 'isc' | 'energy' | 'water';

export interface CurrencyBalance {
  type: CurrencyType;
  amount: number;
  lastUpdated: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  type: 'material' | 'tool' | 'seed' | 'equipment' | 'consumable';
}

export interface TransactionRecord {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  currencyType: CurrencyType;
  amount: number;
  reason: string;
  timestamp: number;
  relatedQuestId?: string;
  relatedNpcId?: string;
}

export interface PlayerEconomyData {
  playerId: string;
  currencies: Map<CurrencyType, number>;
  inventory: Map<string, InventoryItem>;
  transactions: TransactionRecord[];
  totalEarned: Map<CurrencyType, number>;
  totalSpent: Map<CurrencyType, number>;
  lastSyncTime: number;
}

export class PlayerEconomySystem {
  private data: PlayerEconomyData;
  private maxTransactionHistory: number = 1000;
  private onBalanceChangeCallbacks: Array<(currency: CurrencyType, newBalance: number) => void> = [];
  private onInventoryChangeCallbacks: Array<(itemId: string, newQuantity: number) => void> = [];

  constructor(playerId: string) {
    this.data = {
      playerId,
      currencies: new Map([
        ['coin', 1000],
        ['experience', 0],
        ['isc', 0],
        ['energy', 100],
        ['water', 100],
      ]),
      inventory: new Map(),
      transactions: [],
      totalEarned: new Map([
        ['coin', 0],
        ['experience', 0],
        ['isc', 0],
        ['energy', 0],
        ['water', 0],
      ]),
      totalSpent: new Map([
        ['coin', 0],
        ['experience', 0],
        ['isc', 0],
        ['energy', 0],
        ['water', 0],
      ]),
      lastSyncTime: Date.now(),
    };
  }

  /**
   * 获取玩家的货币余额
   */
  getBalance(currencyType: CurrencyType): number {
    return this.data.currencies.get(currencyType) || 0;
  }

  /**
   * 获取所有货币余额
   */
  getAllBalances(): Record<CurrencyType, number> {
    const balances: Record<CurrencyType, number> = {
      coin: 0,
      experience: 0,
      isc: 0,
      energy: 0,
      water: 0,
    };

    this.data.currencies.forEach((value, key) => {
      balances[key] = value;
    });

    return balances;
  }

  /**
   * 增加货币
   */
  addCurrency(currencyType: CurrencyType, amount: number, reason: string, relatedQuestId?: string, relatedNpcId?: string): boolean {
    if (amount <= 0) {
      console.warn('Cannot add negative or zero amount');
      return false;
    }

    const currentBalance = this.getBalance(currencyType);
    const newBalance = currentBalance + amount;

    this.data.currencies.set(currencyType, newBalance);

    // 记录交易
    this.recordTransaction({
      type: 'income',
      currencyType,
      amount,
      reason,
      relatedQuestId,
      relatedNpcId,
    });

    // 更新总收入
    const totalEarned = this.data.totalEarned.get(currencyType) || 0;
    this.data.totalEarned.set(currencyType, totalEarned + amount);

    // 触发回调
    this.onBalanceChangeCallbacks.forEach((callback) => {
      callback(currencyType, newBalance);
    });

    return true;
  }

  /**
   * 扣除货币
   */
  subtractCurrency(currencyType: CurrencyType, amount: number, reason: string, relatedQuestId?: string, relatedNpcId?: string): boolean {
    if (amount <= 0) {
      console.warn('Cannot subtract negative or zero amount');
      return false;
    }

    const currentBalance = this.getBalance(currencyType);

    if (currentBalance < amount) {
      console.warn(`Insufficient ${currencyType}. Current: ${currentBalance}, Required: ${amount}`);
      return false;
    }

    const newBalance = currentBalance - amount;
    this.data.currencies.set(currencyType, newBalance);

    // 记录交易
    this.recordTransaction({
      type: 'expense',
      currencyType,
      amount,
      reason,
      relatedQuestId,
      relatedNpcId,
    });

    // 更新总支出
    const totalSpent = this.data.totalSpent.get(currencyType) || 0;
    this.data.totalSpent.set(currencyType, totalSpent + amount);

    // 触发回调
    this.onBalanceChangeCallbacks.forEach((callback) => {
      callback(currencyType, newBalance);
    });

    return true;
  }

  /**
   * 转移货币
   */
  transferCurrency(currencyType: CurrencyType, amount: number, reason: string): boolean {
    if (amount <= 0) {
      console.warn('Cannot transfer negative or zero amount');
      return false;
    }

    const currentBalance = this.getBalance(currencyType);

    if (currentBalance < amount) {
      console.warn(`Insufficient ${currencyType} for transfer`);
      return false;
    }

    const newBalance = currentBalance - amount;
    this.data.currencies.set(currencyType, newBalance);

    // 记录交易
    this.recordTransaction({
      type: 'transfer',
      currencyType,
      amount,
      reason,
    });

    // 触发回调
    this.onBalanceChangeCallbacks.forEach((callback) => {
      callback(currencyType, newBalance);
    });

    return true;
  }

  /**
   * 获取物品
   */
  getItem(itemId: string): InventoryItem | undefined {
    return this.data.inventory.get(itemId);
  }

  /**
   * 获取所有物品
   */
  getAllItems(): InventoryItem[] {
    return Array.from(this.data.inventory.values());
  }

  /**
   * 添加物品到背包
   */
  addItem(item: InventoryItem, quantity: number = 1): boolean {
    if (quantity <= 0) {
      console.warn('Cannot add negative or zero quantity');
      return false;
    }

    const existingItem = this.data.inventory.get(item.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      item.quantity = quantity;
      this.data.inventory.set(item.id, item);
    }

    // 触发回调
    this.onInventoryChangeCallbacks.forEach((callback) => {
      callback(item.id, this.data.inventory.get(item.id)?.quantity || 0);
    });

    return true;
  }

  /**
   * 移除物品
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    if (quantity <= 0) {
      console.warn('Cannot remove negative or zero quantity');
      return false;
    }

    const item = this.data.inventory.get(itemId);

    if (!item) {
      console.warn(`Item ${itemId} not found in inventory`);
      return false;
    }

    if (item.quantity < quantity) {
      console.warn(`Insufficient quantity of ${itemId}`);
      return false;
    }

    item.quantity -= quantity;

    if (item.quantity === 0) {
      this.data.inventory.delete(itemId);
    }

    // 触发回调
    this.onInventoryChangeCallbacks.forEach((callback) => {
      callback(itemId, item.quantity);
    });

    return true;
  }

  /**
   * 记录交易
   */
  private recordTransaction(transaction: Omit<TransactionRecord, 'id' | 'timestamp'>): void {
    const record: TransactionRecord = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...transaction,
      timestamp: Date.now(),
    };

    this.data.transactions.push(record);

    // 限制交易历史大小
    if (this.data.transactions.length > this.maxTransactionHistory) {
      this.data.transactions = this.data.transactions.slice(-this.maxTransactionHistory);
    }
  }

  /**
   * 获取交易历史
   */
  getTransactionHistory(limit: number = 50): TransactionRecord[] {
    return this.data.transactions.slice(-limit).reverse();
  }

  /**
   * 获取交易统计
   */
  getTransactionStats(): {
    totalIncome: Record<CurrencyType, number>;
    totalExpense: Record<CurrencyType, number>;
    netIncome: Record<CurrencyType, number>;
  } {
    const totalIncome: Record<CurrencyType, number> = {
      coin: 0,
      experience: 0,
      isc: 0,
      energy: 0,
      water: 0,
    };
    const totalExpense: Record<CurrencyType, number> = {
      coin: 0,
      experience: 0,
      isc: 0,
      energy: 0,
      water: 0,
    };

    this.data.totalEarned.forEach((value, key) => {
      totalIncome[key] = value;
    });

    this.data.totalSpent.forEach((value, key) => {
      totalExpense[key] = value;
    });

    const netIncome: Record<CurrencyType, number> = {
      coin: totalIncome.coin - totalExpense.coin,
      experience: totalIncome.experience - totalExpense.experience,
      isc: totalIncome.isc - totalExpense.isc,
      energy: totalIncome.energy - totalExpense.energy,
      water: totalIncome.water - totalExpense.water,
    };

    return { totalIncome, totalExpense, netIncome };
  }

  /**
   * 注册余额变化回调
   */
  onBalanceChange(callback: (currency: CurrencyType, newBalance: number) => void): void {
    this.onBalanceChangeCallbacks.push(callback);
  }

  /**
   * 注册物品变化回调
   */
  onInventoryChange(callback: (itemId: string, newQuantity: number) => void): void {
    this.onInventoryChangeCallbacks.push(callback);
  }

  /**
   * 导出数据
   */
  export(): PlayerEconomyData {
    return {
      ...this.data,
      currencies: new Map(this.data.currencies),
      inventory: new Map(this.data.inventory),
      totalEarned: new Map(this.data.totalEarned),
      totalSpent: new Map(this.data.totalSpent),
    };
  }

  /**
   * 导入数据
   */
  import(data: PlayerEconomyData): void {
    this.data = {
      ...data,
      currencies: new Map(data.currencies),
      inventory: new Map(data.inventory),
      totalEarned: new Map(data.totalEarned),
      totalSpent: new Map(data.totalSpent),
    };
    this.data.lastSyncTime = Date.now();
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.data.currencies.clear();
    this.data.currencies.set('coin', 1000);
    this.data.currencies.set('experience', 0);
    this.data.currencies.set('isc', 0);
    this.data.currencies.set('energy', 100);
    this.data.currencies.set('water', 100);
    this.data.inventory.clear();
    this.data.transactions = [];
    this.data.totalEarned.clear();
    this.data.totalSpent.clear();
  }
}
