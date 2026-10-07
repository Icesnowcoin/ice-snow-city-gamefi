/**
 * 经济循环和市场价格变化系统
 * Phase 19: 经济循环和市场价格变化（遗留功能）
 */

export interface MarketItem {
  itemId: string;
  itemName: string;
  basePrice: number;
  currentPrice: number;
  supply: number;
  demand: number;
  priceHistory: Array<{
    timestamp: number;
    price: number;
  }>;
  lastUpdated: number;
}

export interface EconomicCycle {
  cycleId: string;
  cycleName: string;
  phase: 'expansion' | 'peak' | 'contraction' | 'trough';
  startTime: number;
  endTime: number;
  inflationRate: number;
  growthRate: number;
  unemploymentRate: number;
  consumerConfidence: number;
}

export interface PriceFluctuation {
  itemId: string;
  priceChange: number;
  percentChange: number;
  reason: string;
  timestamp: number;
}

export interface MarketTrend {
  trendId: string;
  itemId: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  duration: number; // milliseconds
  startTime: number;
  endTime: number;
}

export class EconomicCycleSystem {
  private items: Map<string, MarketItem> = new Map();
  private cycles: Map<string, EconomicCycle> = new Map();
  private trends: Map<string, MarketTrend> = new Map();
  private fluctuations: Array<PriceFluctuation> = [];
  private currentCycleId: string | null = null;

  /**
   * 注册市场物品
   */
  registerItem(
    itemId: string,
    itemName: string,
    basePrice: number,
    initialSupply: number,
    initialDemand: number,
  ): MarketItem {
    const item: MarketItem = {
      itemId,
      itemName,
      basePrice,
      currentPrice: basePrice,
      supply: initialSupply,
      demand: initialDemand,
      priceHistory: [
        {
          timestamp: Date.now(),
          price: basePrice,
        },
      ],
      lastUpdated: Date.now(),
    };

    this.items.set(itemId, item);
    return item;
  }

  /**
   * 获取物品信息
   */
  getItem(itemId: string): MarketItem | undefined {
    return this.items.get(itemId);
  }

  /**
   * 获取所有物品
   */
  getAllItems(): MarketItem[] {
    return Array.from(this.items.values());
  }

  /**
   * 更新供应和需求
   */
  updateSupplyDemand(itemId: string, supplyChange: number, demandChange: number): boolean {
    const item = this.items.get(itemId);
    if (!item) {
      return false;
    }

    item.supply = Math.max(0, item.supply + supplyChange);
    item.demand = Math.max(0, item.demand + demandChange);

    // 根据供需关系调整价格
    this.updatePrice(itemId);

    return true;
  }

  /**
   * 更新价格
   */
  private updatePrice(itemId: string): void {
    const item = this.items.get(itemId);
    if (!item) {
      return;
    }

    // 供需比例影响价格
    const supplyDemandRatio = item.supply > 0 ? item.demand / item.supply : 1;

    // 计算价格变化
    let priceMultiplier = 1;

    if (supplyDemandRatio > 2) {
      // 需求远大于供应，价格上升
      priceMultiplier = 1.1;
    } else if (supplyDemandRatio > 1.5) {
      priceMultiplier = 1.05;
    } else if (supplyDemandRatio > 1) {
      priceMultiplier = 1.02;
    } else if (supplyDemandRatio < 0.5) {
      // 供应远大于需求，价格下降
      priceMultiplier = 0.9;
    } else if (supplyDemandRatio < 0.67) {
      priceMultiplier = 0.95;
    } else if (supplyDemandRatio < 1) {
      priceMultiplier = 0.98;
    }

    const oldPrice = item.currentPrice;
    item.currentPrice = Math.round(item.currentPrice * priceMultiplier * 100) / 100;
    item.lastUpdated = Date.now();

    // 记录价格变化
    if (item.priceHistory.length > 100) {
      item.priceHistory.shift();
    }

    item.priceHistory.push({
      timestamp: Date.now(),
      price: item.currentPrice,
    });

    // 记录波动
    if (oldPrice !== item.currentPrice) {
      const percentChange = ((item.currentPrice - oldPrice) / oldPrice) * 100;
      this.fluctuations.push({
        itemId,
        priceChange: item.currentPrice - oldPrice,
        percentChange,
        reason: `Supply: ${item.supply}, Demand: ${item.demand}`,
        timestamp: Date.now(),
      });

      // 保持波动历史在合理范围
      if (this.fluctuations.length > 1000) {
        this.fluctuations.shift();
      }
    }
  }

  /**
   * 创建经济周期
   */
  createEconomicCycle(
    cycleName: string,
    phase: EconomicCycle['phase'],
    durationHours: number,
    inflationRate: number,
    growthRate: number,
  ): EconomicCycle {
    const cycleId = `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const cycle: EconomicCycle = {
      cycleId,
      cycleName,
      phase,
      startTime: now,
      endTime: now + durationHours * 60 * 60 * 1000,
      inflationRate,
      growthRate,
      unemploymentRate: 0,
      consumerConfidence: 50,
    };

    this.cycles.set(cycleId, cycle);
    this.currentCycleId = cycleId;

    return cycle;
  }

  /**
   * 获取当前经济周期
   */
  getCurrentCycle(): EconomicCycle | null {
    if (!this.currentCycleId) {
      return null;
    }

    const cycle = this.cycles.get(this.currentCycleId);
    if (!cycle) {
      return null;
    }

    // 检查周期是否已过期
    if (cycle.endTime < Date.now()) {
      this.currentCycleId = null;
      return null;
    }

    return cycle;
  }

  /**
   * 应用经济周期影响
   */
  applyEconomicCycleEffect(): void {
    const cycle = this.getCurrentCycle();
    if (!cycle) {
      return;
    }

    // 根据周期阶段应用不同的效果
    let supplyMultiplier = 1;
    let demandMultiplier = 1;

    switch (cycle.phase) {
      case 'expansion':
        supplyMultiplier = 1.05;
        demandMultiplier = 1.1;
        break;
      case 'peak':
        supplyMultiplier = 1;
        demandMultiplier = 1.05;
        break;
      case 'contraction':
        supplyMultiplier = 0.95;
        demandMultiplier = 0.9;
        break;
      case 'trough':
        supplyMultiplier = 0.9;
        demandMultiplier = 0.85;
        break;
    }

    // 应用到所有物品
    this.items.forEach((item) => {
      const supplyChange = Math.round(item.supply * (supplyMultiplier - 1));
      const demandChange = Math.round(item.demand * (demandMultiplier - 1));

      item.supply = Math.max(0, item.supply + supplyChange);
      item.demand = Math.max(0, item.demand + demandChange);

      this.updatePrice(item.itemId);
    });
  }

  /**
   * 创建市场趋势
   */
  createMarketTrend(
    itemId: string,
    trend: MarketTrend['trend'],
    strength: number,
    durationHours: number,
  ): MarketTrend {
    const trendId = `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const marketTrend: MarketTrend = {
      trendId,
      itemId,
      trend,
      strength: Math.max(0, Math.min(100, strength)),
      duration: durationHours * 60 * 60 * 1000,
      startTime: now,
      endTime: now + durationHours * 60 * 60 * 1000,
    };

    this.trends.set(trendId, marketTrend);
    return marketTrend;
  }

  /**
   * 获取物品的市场趋势
   */
  getItemTrends(itemId: string): MarketTrend[] {
    const trends: MarketTrend[] = [];
    const now = Date.now();

    this.trends.forEach((trend) => {
      if (trend.itemId === itemId && trend.endTime >= now) {
        trends.push(trend);
      }
    });

    return trends;
  }

  /**
   * 应用市场趋势
   */
  applyMarketTrends(): void {
    const now = Date.now();

    this.trends.forEach((trend) => {
      if (trend.endTime < now) {
        return;
      }

      const item = this.items.get(trend.itemId);
      if (!item) {
        return;
      }

      // 根据趋势调整供需
      const trendStrengthFactor = trend.strength / 100;

      if (trend.trend === 'bullish') {
        // 看涨：增加需求
        item.demand = Math.round(item.demand * (1 + 0.1 * trendStrengthFactor));
      } else if (trend.trend === 'bearish') {
        // 看跌：减少需求
        item.demand = Math.round(item.demand * (1 - 0.1 * trendStrengthFactor));
      }

      this.updatePrice(trend.itemId);
    });
  }

  /**
   * 获取价格历史
   */
  getPriceHistory(itemId: string, hours: number = 24): Array<{ timestamp: number; price: number }> {
    const item = this.items.get(itemId);
    if (!item) {
      return [];
    }

    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return item.priceHistory.filter((h) => h.timestamp >= cutoffTime);
  }

  /**
   * 获取价格波动
   */
  getPriceFluctuations(itemId?: string, hours: number = 24): PriceFluctuation[] {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    let filtered = this.fluctuations.filter((f) => f.timestamp >= cutoffTime);

    if (itemId) {
      filtered = filtered.filter((f) => f.itemId === itemId);
    }

    return filtered;
  }

  /**
   * 计算平均价格
   */
  getAveragePrice(itemId: string, hours: number = 24): number {
    const history = this.getPriceHistory(itemId, hours);
    if (history.length === 0) {
      return 0;
    }

    const sum = history.reduce((acc, h) => acc + h.price, 0);
    return Math.round((sum / history.length) * 100) / 100;
  }

  /**
   * 计算价格波动率
   */
  getPriceVolatility(itemId: string, hours: number = 24): number {
    const history = this.getPriceHistory(itemId, hours);
    if (history.length < 2) {
      return 0;
    }

    const prices = history.map((h) => h.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    return Math.round((stdDev / mean) * 100 * 100) / 100; // 百分比
  }

  /**
   * 获取市场报告
   */
  getMarketReport(): {
    totalItems: number;
    averageInflation: number;
    topGainers: Array<{ itemId: string; itemName: string; percentChange: number }>;
    topLosers: Array<{ itemId: string; itemName: string; percentChange: number }>;
    currentCycle: EconomicCycle | null;
  } {
    const topGainers: Array<{ itemId: string; itemName: string; percentChange: number }> = [];
    const topLosers: Array<{ itemId: string; itemName: string; percentChange: number }> = [];

    this.items.forEach((item) => {
      if (item.priceHistory.length >= 2) {
        const oldPrice = item.priceHistory[0].price;
        const newPrice = item.currentPrice;
        const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;

        if (percentChange > 0) {
          topGainers.push({
            itemId: item.itemId,
            itemName: item.itemName,
            percentChange: Math.round(percentChange * 100) / 100,
          });
        } else if (percentChange < 0) {
          topLosers.push({
            itemId: item.itemId,
            itemName: item.itemName,
            percentChange: Math.round(percentChange * 100) / 100,
          });
        }
      }
    });

    topGainers.sort((a, b) => b.percentChange - a.percentChange);
    topLosers.sort((a, b) => a.percentChange - b.percentChange);

    const currentCycle = this.getCurrentCycle();
    const averageInflation = currentCycle ? currentCycle.inflationRate : 0;

    return {
      totalItems: this.items.size,
      averageInflation,
      topGainers: topGainers.slice(0, 5),
      topLosers: topLosers.slice(0, 5),
      currentCycle,
    };
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.items.clear();
    this.cycles.clear();
    this.trends.clear();
    this.fluctuations = [];
    this.currentCycleId = null;
  }
}

export default EconomicCycleSystem;
