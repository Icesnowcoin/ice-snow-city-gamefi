import { describe, it, expect, beforeEach } from 'vitest';
import EconomicCycleSystem from './economicCycle';

describe('Economic Cycle System', () => {
  let economy: EconomicCycleSystem;

  beforeEach(() => {
    economy = new EconomicCycleSystem();
  });

  describe('Market Item Management', () => {
    it('should register item', () => {
      const item = economy.registerItem('item1', 'Gold', 100, 1000, 500);
      expect(item.itemId).toBe('item1');
      expect(item.basePrice).toBe(100);
      expect(item.currentPrice).toBe(100);
    });

    it('should get item', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      const item = economy.getItem('item1');
      expect(item).toBeDefined();
      expect(item?.itemName).toBe('Gold');
    });

    it('should get all items', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.registerItem('item2', 'Silver', 50, 2000, 1000);
      const items = economy.getAllItems();
      expect(items.length).toBe(2);
    });
  });

  describe('Supply and Demand', () => {
    it('should update supply and demand', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      const updated = economy.updateSupplyDemand('item1', 100, 200);
      expect(updated).toBe(true);

      const item = economy.getItem('item1');
      expect(item?.supply).toBe(1100);
      expect(item?.demand).toBe(700);
    });

    it('should adjust price based on supply and demand', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      const oldPrice = economy.getItem('item1')?.currentPrice;

      // 增加需求，价格应该上升
      economy.updateSupplyDemand('item1', 0, 1000);
      const newPrice = economy.getItem('item1')?.currentPrice;

      expect(newPrice).toBeGreaterThan(oldPrice!);
    });
  });

  describe('Economic Cycles', () => {
    it('should create economic cycle', () => {
      const cycle = economy.createEconomicCycle('Expansion', 'expansion', 24, 0.05, 0.03);
      expect(cycle.cycleName).toBe('Expansion');
      expect(cycle.phase).toBe('expansion');
    });

    it('should get current cycle', () => {
      economy.createEconomicCycle('Expansion', 'expansion', 24, 0.05, 0.03);
      const cycle = economy.getCurrentCycle();
      expect(cycle).toBeDefined();
      expect(cycle?.phase).toBe('expansion');
    });

    it('should apply economic cycle effects', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.createEconomicCycle('Expansion', 'expansion', 24, 0.05, 0.03);

      const oldSupply = economy.getItem('item1')?.supply;
      const oldDemand = economy.getItem('item1')?.demand;

      economy.applyEconomicCycleEffect();

      const newSupply = economy.getItem('item1')?.supply;
      const newDemand = economy.getItem('item1')?.demand;

      expect(newSupply).toBeGreaterThan(oldSupply!);
      expect(newDemand).toBeGreaterThan(oldDemand!);
    });
  });

  describe('Market Trends', () => {
    it('should create market trend', () => {
      const trend = economy.createMarketTrend('item1', 'bullish', 80, 24);
      expect(trend.itemId).toBe('item1');
      expect(trend.trend).toBe('bullish');
      expect(trend.strength).toBe(80);
    });

    it('should get item trends', () => {
      economy.createMarketTrend('item1', 'bullish', 80, 24);
      economy.createMarketTrend('item1', 'bearish', 60, 12);
      const trends = economy.getItemTrends('item1');
      expect(trends.length).toBe(2);
    });

    it('should apply market trends', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.createMarketTrend('item1', 'bullish', 100, 24);

      const oldDemand = economy.getItem('item1')?.demand;
      economy.applyMarketTrends();
      const newDemand = economy.getItem('item1')?.demand;

      expect(newDemand).toBeGreaterThan(oldDemand!);
    });
  });

  describe('Price History', () => {
    it('should track price history', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.updateSupplyDemand('item1', 100, 200);
      economy.updateSupplyDemand('item1', 100, 200);

      const history = economy.getPriceHistory('item1', 24);
      expect(history.length).toBeGreaterThan(1);
    });

    it('should get price fluctuations', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.updateSupplyDemand('item1', 100, 200);

      const fluctuations = economy.getPriceFluctuations('item1', 24);
      expect(fluctuations.length).toBeGreaterThan(0);
    });

    it('should calculate average price', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.updateSupplyDemand('item1', 100, 200);
      economy.updateSupplyDemand('item1', 100, 200);

      const avgPrice = economy.getAveragePrice('item1', 24);
      expect(avgPrice).toBeGreaterThan(0);
    });

    it('should calculate price volatility', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.updateSupplyDemand('item1', 100, 200);
      economy.updateSupplyDemand('item1', -100, -200);
      economy.updateSupplyDemand('item1', 100, 200);

      const volatility = economy.getPriceVolatility('item1', 24);
      expect(volatility).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Market Report', () => {
    it('should generate market report', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.registerItem('item2', 'Silver', 50, 2000, 1000);
      economy.createEconomicCycle('Expansion', 'expansion', 24, 0.05, 0.03);

      const report = economy.getMarketReport();
      expect(report.totalItems).toBe(2);
      expect(report.currentCycle).toBeDefined();
    });

    it('should identify top gainers and losers', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.registerItem('item2', 'Silver', 50, 2000, 1000);

      // 增加 item1 的需求
      economy.updateSupplyDemand('item1', 0, 1000);

      // 减少 item2 的需求
      economy.updateSupplyDemand('item2', 1000, 0);

      const report = economy.getMarketReport();
      expect(report.topGainers.length).toBeGreaterThan(0);
      expect(report.topLosers.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should clear all data', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 500);
      economy.createEconomicCycle('Expansion', 'expansion', 24, 0.05, 0.03);
      economy.createMarketTrend('item1', 'bullish', 80, 24);

      economy.clear();

      expect(economy.getAllItems().length).toBe(0);
      expect(economy.getCurrentCycle()).toBeNull();
    });
  });

  describe('Price Constraints', () => {
    it('should not allow negative supply', () => {
      economy.registerItem('item1', 'Gold', 100, 100, 500);
      economy.updateSupplyDemand('item1', -200, 0);

      const item = economy.getItem('item1');
      expect(item?.supply).toBe(0);
    });

    it('should not allow negative demand', () => {
      economy.registerItem('item1', 'Gold', 100, 1000, 100);
      economy.updateSupplyDemand('item1', 0, -200);

      const item = economy.getItem('item1');
      expect(item?.demand).toBe(0);
    });
  });
});
