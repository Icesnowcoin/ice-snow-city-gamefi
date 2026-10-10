/**
 * 玩家间交易系统
 * Phase 15: 玩家间交易系统（遗留功能）
 */

export interface TradeItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface TradeOffer {
  offerId: string;
  sellerId: string;
  buyerId?: string;
  sellerItems: TradeItem[];
  buyerItems: TradeItem[];
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  cancelReason?: string;
}

export interface TradeHistory {
  tradeId: string;
  sellerId: string;
  buyerId: string;
  sellerItems: TradeItem[];
  buyerItems: TradeItem[];
  totalValue: number;
  completedAt: number;
  rating?: {
    sellerRating: number;
    buyerRating: number;
    sellerComment?: string;
    buyerComment?: string;
  };
}

export interface PlayerTradeStats {
  playerId: string;
  totalTrades: number;
  completedTrades: number;
  cancelledTrades: number;
  totalItemsSold: number;
  totalItemsBought: number;
  totalValueSold: number;
  totalValueBought: number;
  averageRating: number;
  ratingCount: number;
  lastTradeAt?: number;
}

export class PlayerTradingSystem {
  private offers: Map<string, TradeOffer> = new Map();
  private history: Map<string, TradeHistory[]> = new Map();
  private stats: Map<string, PlayerTradeStats> = new Map();
  private playerOffers: Map<string, string[]> = new Map();

  /**
   * 创建交易提议
   */
  createOffer(
    sellerId: string,
    sellerItems: TradeItem[],
    buyerItems: TradeItem[],
    expirationHours: number = 24,
  ): TradeOffer {
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const offer: TradeOffer = {
      offerId,
      sellerId,
      sellerItems,
      buyerItems,
      status: 'pending',
      createdAt: now,
      expiresAt: now + expirationHours * 60 * 60 * 1000,
    };

    this.offers.set(offerId, offer);

    if (!this.playerOffers.has(sellerId)) {
      this.playerOffers.set(sellerId, []);
    }
    this.playerOffers.get(sellerId)!.push(offerId);

    return offer;
  }

  /**
   * 获取交易提议
   */
  getOffer(offerId: string): TradeOffer | undefined {
    return this.offers.get(offerId);
  }

  /**
   * 获取玩家的所有交易提议
   */
  getPlayerOffers(playerId: string, status?: TradeOffer['status']): TradeOffer[] {
    const offerIds = this.playerOffers.get(playerId) || [];
    const offers = offerIds
      .map((id) => this.offers.get(id))
      .filter((o) => o !== undefined) as TradeOffer[];

    if (status) {
      return offers.filter((o) => o.status === status);
    }

    return offers;
  }

  /**
   * 接受交易提议
   */
  acceptOffer(offerId: string, buyerId: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || offer.status !== 'pending') {
      return false;
    }

    // 检查过期
    if (offer.expiresAt < Date.now()) {
      offer.status = 'expired';
      return false;
    }

    offer.buyerId = buyerId;
    offer.status = 'accepted';
    offer.acceptedAt = Date.now();

    if (!this.playerOffers.has(buyerId)) {
      this.playerOffers.set(buyerId, []);
    }
    this.playerOffers.get(buyerId)!.push(offerId);

    return true;
  }

  /**
   * 完成交易
   */
  completeOffer(offerId: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || offer.status !== 'accepted' || !offer.buyerId) {
      return false;
    }

    offer.status = 'completed';
    offer.completedAt = Date.now();

    // 计算交易价值
    const sellerValue = offer.sellerItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const buyerValue = offer.buyerItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalValue = Math.max(sellerValue, buyerValue);

    // 记录交易历史
    const history: TradeHistory = {
      tradeId: offerId,
      sellerId: offer.sellerId,
      buyerId: offer.buyerId,
      sellerItems: offer.sellerItems,
      buyerItems: offer.buyerItems,
      totalValue,
      completedAt: offer.completedAt,
    };

    if (!this.history.has(offer.sellerId)) {
      this.history.set(offer.sellerId, []);
    }
    this.history.get(offer.sellerId)!.push(history);

    if (!this.history.has(offer.buyerId)) {
      this.history.set(offer.buyerId, []);
    }
    this.history.get(offer.buyerId)!.push(history);

    // 更新统计
    this.updateStats(offer.sellerId, 'seller', totalValue, offer.sellerItems.length);
    this.updateStats(offer.buyerId, 'buyer', totalValue, offer.buyerItems.length);

    return true;
  }

  /**
   * 取消交易提议
   */
  cancelOffer(offerId: string, playerId: string, reason?: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || (offer.sellerId !== playerId && offer.buyerId !== playerId)) {
      return false;
    }

    if (offer.status !== 'pending' && offer.status !== 'accepted') {
      return false;
    }

    offer.status = 'cancelled';
    offer.cancelledAt = Date.now();
    offer.cancelReason = reason;

    return true;
  }

  /**
   * 更新交易统计
   */
  private updateStats(
    playerId: string,
    role: 'seller' | 'buyer',
    totalValue: number,
    itemCount: number,
  ): void {
    if (!this.stats.has(playerId)) {
      this.stats.set(playerId, {
        playerId,
        totalTrades: 0,
        completedTrades: 0,
        cancelledTrades: 0,
        totalItemsSold: 0,
        totalItemsBought: 0,
        totalValueSold: 0,
        totalValueBought: 0,
        averageRating: 0,
        ratingCount: 0,
      });
    }

    const stat = this.stats.get(playerId)!;
    stat.totalTrades++;
    stat.completedTrades++;
    stat.lastTradeAt = Date.now();

    if (role === 'seller') {
      stat.totalItemsSold += itemCount;
      stat.totalValueSold += totalValue;
    } else {
      stat.totalItemsBought += itemCount;
      stat.totalValueBought += totalValue;
    }
  }

  /**
   * 评分交易
   */
  rateOffer(offerId: string, playerId: string, rating: number, comment?: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || offer.status !== 'completed') {
      return false;
    }

    const history = this.history.get(playerId)?.find((h) => h.tradeId === offerId);
    if (!history) {
      return false;
    }

    if (!history.rating) {
      history.rating = {
        sellerRating: 0,
        buyerRating: 0,
      };
    }

    if (playerId === offer.sellerId) {
      history.rating.buyerRating = Math.max(1, Math.min(5, rating));
      history.rating.buyerComment = comment;
    } else if (playerId === offer.buyerId) {
      history.rating.sellerRating = Math.max(1, Math.min(5, rating));
      history.rating.sellerComment = comment;
    } else {
      return false;
    }

    // 更新平均评分
    this.updateAverageRating(offer.sellerId);
    if (offer.buyerId) {
      this.updateAverageRating(offer.buyerId);
    }

    return true;
  }

  /**
   * 更新平均评分
   */
  private updateAverageRating(playerId: string): void {
    const playerHistory = this.history.get(playerId) || [];
    let totalRating = 0;
    let ratingCount = 0;

    playerHistory.forEach((history) => {
      if (history.rating && history.buyerId && history.sellerId) {
        if (history.sellerId === playerId && history.rating.buyerRating > 0) {
          totalRating += history.rating.buyerRating;
          ratingCount++;
        } else if (history.buyerId === playerId && history.rating.sellerRating > 0) {
          totalRating += history.rating.sellerRating;
          ratingCount++;
        }
      }
    });

    const stat = this.stats.get(playerId);
    if (stat) {
      stat.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      stat.ratingCount = ratingCount;
    }
  }

  /**
   * 获取交易历史
   */
  getTradeHistory(playerId: string): TradeHistory[] {
    return this.history.get(playerId) || [];
  }

  /**
   * 获取交易统计
   */
  getTradeStats(playerId: string): PlayerTradeStats | undefined {
    return this.stats.get(playerId);
  }

  /**
   * 获取所有待处理交易
   */
  getPendingOffers(): TradeOffer[] {
    const pending: TradeOffer[] = [];
    this.offers.forEach((offer) => {
      if (offer.status === 'pending' && offer.expiresAt >= Date.now()) {
        pending.push(offer);
      }
    });
    return pending;
  }

  /**
   * 清理过期的交易提议
   */
  cleanupExpiredOffers(): number {
    const now = Date.now();
    let cleaned = 0;

    this.offers.forEach((offer) => {
      if (offer.status === 'pending' && offer.expiresAt < now) {
        offer.status = 'expired';
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * 获取交易排行榜
   */
  getTradeLeaderboard(limit: number = 10): PlayerTradeStats[] {
    const stats = Array.from(this.stats.values());
    return stats
      .sort((a, b) => {
        // 按完成交易数排序，其次按总交易价值排序
        if (b.completedTrades !== a.completedTrades) {
          return b.completedTrades - a.completedTrades;
        }
        return b.totalValueSold + b.totalValueBought - (a.totalValueSold + a.totalValueBought);
      })
      .slice(0, limit);
  }

  /**
   * 获取评分最高的玩家
   */
  getTopRatedPlayers(limit: number = 10): PlayerTradeStats[] {
    const stats = Array.from(this.stats.values()).filter((s) => s.ratingCount > 0);
    return stats
      .sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.ratingCount - a.ratingCount;
      })
      .slice(0, limit);
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.offers.clear();
    this.history.clear();
    this.stats.clear();
    this.playerOffers.clear();
  }
}

export default PlayerTradingSystem;
