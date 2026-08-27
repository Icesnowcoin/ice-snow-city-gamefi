/**
 * 购物车系统管理器
 * 管理购物车物品、计算价格、处理结算
 */

export interface CartItem {
  itemId: string;
  quantity: number;
  price: number;
  discount?: number;
  addedAt: number;
}

export interface CartSummary {
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  itemCount: number;
}

export class ShoppingCartManager {
  private cart: Map<string, CartItem> = new Map();
  private listeners: Array<(cart: CartItem[]) => void> = [];

  /**
   * 添加物品到购物车
   */
  addItem(itemId: string, quantity: number, price: number, discount?: number): void {
    const existing = this.cart.get(itemId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.set(itemId, {
        itemId,
        quantity,
        price,
        discount,
        addedAt: Date.now(),
      });
    }

    this.notifyListeners();
  }

  /**
   * 移除购物车中的物品
   */
  removeItem(itemId: string): void {
    this.cart.delete(itemId);
    this.notifyListeners();
  }

  /**
   * 更新购物车物品数量
   */
  updateQuantity(itemId: string, quantity: number): void {
    const item = this.cart.get(itemId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemId);
      } else {
        item.quantity = quantity;
        this.notifyListeners();
      }
    }
  }

  /**
   * 清空购物车
   */
  clear(): void {
    this.cart.clear();
    this.notifyListeners();
  }

  /**
   * 获取购物车物品列表
   */
  getItems(): CartItem[] {
    return Array.from(this.cart.values());
  }

  /**
   * 获取购物车物品数量
   */
  getItemCount(): number {
    return this.cart.size;
  }

  /**
   * 获取购物车总物品数
   */
  getTotalQuantity(): number {
    let total = 0;
    this.cart.forEach((item) => {
      total += item.quantity;
    });
    return total;
  }

  /**
   * 计算购物车摘要
   */
  getSummary(): CartSummary {
    let subtotal = 0;
    let discountAmount = 0;

    this.cart.forEach((item) => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;

      if (item.discount) {
        const itemDiscount = (itemSubtotal * item.discount) / 100;
        discountAmount += itemDiscount;
      }
    });

    const total = subtotal - discountAmount;

    return {
      totalItems: subtotal,
      subtotal,
      discountAmount,
      total,
      itemCount: this.cart.size,
    };
  }

  /**
   * 获取单个物品的总价（含折扣）
   */
  getItemTotal(itemId: string): number {
    const item = this.cart.get(itemId);
    if (!item) return 0;

    const subtotal = item.price * item.quantity;
    if (item.discount) {
      return subtotal * (1 - item.discount / 100);
    }
    return subtotal;
  }

  /**
   * 检查购物车是否为空
   */
  isEmpty(): boolean {
    return this.cart.size === 0;
  }

  /**
   * 订阅购物车变化
   */
  onCartChange(listener: (cart: CartItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const items = this.getItems();
    this.listeners.forEach((listener) => listener(items));
  }

  /**
   * 获取购物车快照（用于结算）
   */
  getCheckoutData(): {
    items: CartItem[];
    summary: CartSummary;
  } {
    return {
      items: this.getItems(),
      summary: this.getSummary(),
    };
  }

  /**
   * 结算后清空购物车
   */
  checkout(): CartItem[] {
    const items = this.getItems();
    this.clear();
    return items;
  }
}

// 全局单例
let cartManagerInstance: ShoppingCartManager | null = null;

export function getShoppingCartManager(): ShoppingCartManager {
  if (!cartManagerInstance) {
    cartManagerInstance = new ShoppingCartManager();
  }
  return cartManagerInstance;
}
