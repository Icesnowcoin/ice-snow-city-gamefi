import { describe, it, expect, beforeEach } from 'vitest';
import { DataFilterService, FilterConfig } from '@/lib/dataFilterService';

// Mock data for testing
const mockMarketData = [
  { id: '1', name: '小麦', price: 100, change: 5, changePercent: 5, stock: 1000 },
  { id: '2', name: '玉米', price: 150, change: -10, changePercent: -6.25, stock: 800 },
  { id: '3', name: '水稻', price: 120, change: 0, changePercent: 0, stock: 1200 },
  { id: '4', name: '大豆', price: 200, change: 20, changePercent: 11.11, stock: 600 },
  { id: '5', name: '棉花', price: 80, change: -5, changePercent: -5.88, stock: 900 },
];

const mockSeasonData = [
  { id: '1', season: '春季', startDate: '2026-03-21', endDate: '2026-06-20', cropBonus: 20, priceBonus: 10 },
  { id: '2', season: '夏季', startDate: '2026-06-21', endDate: '2026-09-22', cropBonus: 10, priceBonus: 5 },
  { id: '3', season: '秋季', startDate: '2026-09-23', endDate: '2026-12-20', cropBonus: 30, priceBonus: 15 },
  { id: '4', season: '冬季', startDate: '2026-12-21', endDate: '2027-03-20', cropBonus: 5, priceBonus: 20 },
];

const mockBankData = [
  { id: '1', account: '主账户', balance: 10000, interestRate: 5.5, lastUpdate: '2026-07-24 19:00:00' },
  { id: '2', account: '储蓄账户', balance: 50000, interestRate: 8.0, lastUpdate: '2026-07-24 19:00:00' },
  { id: '3', account: '投资账户', balance: 100000, interestRate: 12.0, lastUpdate: '2026-07-24 19:00:00' },
];

describe('EconomyPanelWithFilter Integration Tests', () => {
  let filterService: DataFilterService;

  beforeEach(() => {
    filterService = new DataFilterService();
  });

  describe('Market Data Filtering and Chart Integration', () => {
    it('should filter market data by price range', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'price',
            operator: 'gte',
            value: 100,
          },
          {
            field: 'price',
            operator: 'lte',
            value: 150,
          },
        ],
        logic: 'AND',
      };

      const filtered = filterService.apply(mockMarketData, filterConfig);
      expect(filtered.length).toBe(3);
      expect(filtered.every(item => item.price >= 100 && item.price <= 150)).toBe(true);
    });

    it('should sort market data by price descending', () => {
      const filterConfig: FilterConfig = {
        sorts: [
          {
            field: 'price',
            direction: 'desc',
          },
        ],
      };

      const sorted = filterService.apply(mockMarketData, filterConfig);
      expect(sorted[0].price).toBe(200);
      expect(sorted[sorted.length - 1].price).toBe(80);
    });

    it('should transform market data for chart visualization', () => {
      const chartData = mockMarketData.map((item) => ({
        name: item.name,
        price: item.price,
        ...item,
      }));

      expect(chartData.length).toBe(5);
      expect(chartData[0]).toHaveProperty('name', '小麦');
      expect(chartData[0]).toHaveProperty('price', 100);
    });

    it('should calculate statistics from filtered market data', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'changePercent',
            operator: 'gt',
            value: 0,
          },
        ],
      };

      const filtered = filterService.apply(mockMarketData, filterConfig);
      const prices = filtered.map(d => d.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

      expect(filtered.length).toBe(2);
      expect(min).toBe(100);
      expect(max).toBe(200);
      expect(avg).toBe(150);
    });
  });

  describe('Season Data Filtering and Chart Integration', () => {
    it('should filter season data by crop bonus', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'cropBonus',
            operator: 'gte',
            value: 20,
          },
        ],
      };

      const filtered = filterService.apply(mockSeasonData, filterConfig);
      expect(filtered.length).toBe(2);
      expect(filtered.every(item => item.cropBonus >= 20)).toBe(true);
    });

    it('should sort season data by price bonus', () => {
      const filterConfig: FilterConfig = {
        sorts: [
          {
            field: 'priceBonus',
            direction: 'desc',
          },
        ],
      };

      const sorted = filterService.apply(mockSeasonData, filterConfig);
      expect(sorted[0].priceBonus).toBe(20);
      expect(sorted[sorted.length - 1].priceBonus).toBe(5);
    });

    it('should transform season data for bar chart', () => {
      const chartData = mockSeasonData.map((item) => ({
        name: item.season,
        cropBonus: item.cropBonus,
        ...item,
      }));

      expect(chartData.length).toBe(4);
      expect(chartData.map(d => d.cropBonus)).toEqual([20, 10, 30, 5]);
    });
  });

  describe('Bank Data Filtering and Chart Integration', () => {
    it('should filter bank data by balance range', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'balance',
            operator: 'gte',
            value: 50000,
          },
        ],
      };

      const filtered = filterService.apply(mockBankData, filterConfig);
      expect(filtered.length).toBe(2);
      expect(filtered.every(item => item.balance >= 50000)).toBe(true);
    });

    it('should sort bank data by interest rate', () => {
      const filterConfig: FilterConfig = {
        sorts: [
          {
            field: 'interestRate',
            direction: 'desc',
          },
        ],
      };

      const sorted = filterService.apply(mockBankData, filterConfig);
      expect(sorted[0].interestRate).toBe(12.0);
      expect(sorted[sorted.length - 1].interestRate).toBe(5.5);
    });

    it('should transform bank data for line chart', () => {
      const chartData = mockBankData.map((item) => ({
        name: item.account,
        balance: item.balance,
        ...item,
      }));

      expect(chartData.length).toBe(3);
      expect(chartData.map(d => d.balance)).toEqual([10000, 50000, 100000]);
    });
  });

  describe('Complex Filter Combinations', () => {
    it('should apply multiple filters with AND logic', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'price',
            operator: 'gte',
            value: 100,
          },
          {
            field: 'stock',
            operator: 'gte',
            value: 800,
          },
        ],
        logic: 'AND',
      };

      const filtered = filterService.apply(mockMarketData, filterConfig);
      expect(filtered.every(item => item.price >= 100 && item.stock >= 800)).toBe(true);
    });

    it('should apply multiple filters with OR logic', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'changePercent',
            operator: 'gt',
            value: 10,
          },
          {
            field: 'changePercent',
            operator: 'lt',
            value: -5,
          },
        ],
        logic: 'OR',
      };

      const filtered = filterService.apply(mockMarketData, filterConfig);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should combine filters and sorts', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'price',
            operator: 'gte',
            value: 100,
          },
        ],
        sorts: [
          {
            field: 'price',
            direction: 'desc',
          },
        ],
      };

      const result = filterService.apply(mockMarketData, filterConfig);
      expect(result.length).toBe(4);
      expect(result[0].price).toBe(200);
    });
  });

  describe('Chart Data Transformation', () => {
    it('should handle empty filtered data gracefully', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'price',
            operator: 'gt',
            value: 1000,
          },
        ],
      };

      const filtered = filterService.apply(mockMarketData, filterConfig);
      expect(filtered.length).toBe(0);

      const chartData = filtered.map((item) => ({
        name: item.name,
        price: item.price,
        ...item,
      }));

      expect(chartData.length).toBe(0);
    });

    it('should preserve all data fields during transformation', () => {
      const chartData = mockMarketData.map((item) => ({
        name: item.name,
        price: item.price,
        ...item,
      }));

      chartData.forEach((item, idx) => {
        expect(item).toHaveProperty('id', mockMarketData[idx].id);
        expect(item).toHaveProperty('name', mockMarketData[idx].name);
        expect(item).toHaveProperty('price', mockMarketData[idx].price);
        expect(item).toHaveProperty('change', mockMarketData[idx].change);
        expect(item).toHaveProperty('changePercent', mockMarketData[idx].changePercent);
        expect(item).toHaveProperty('stock', mockMarketData[idx].stock);
      });
    });

    it('should calculate aggregate statistics for charts', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'stock',
            operator: 'gte',
            value: 800,
          },
        ],
      };

      const filtered = filterService.apply(mockMarketData, filterConfig);
      const prices = filtered.map(d => d.price);
      const stocks = filtered.map(d => d.stock);

      const priceStats = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        total: prices.reduce((a, b) => a + b, 0),
      };

      const stockStats = {
        min: Math.min(...stocks),
        max: Math.max(...stocks),
        avg: stocks.reduce((a, b) => a + b, 0) / stocks.length,
        total: stocks.reduce((a, b) => a + b, 0),
      };

      expect(priceStats.min).toBe(100);
      expect(priceStats.max).toBe(200);
      expect(stockStats.total).toBe(4900);
    });
  });

  describe('Real-time Data Updates', () => {
    it('should update chart data when filters change', () => {
      let filterConfig: FilterConfig = {};
      let filtered = filterService.apply(mockMarketData, filterConfig);
      expect(filtered.length).toBe(5);

      filterConfig = {
        filters: [
          {
            field: 'price',
            operator: 'gte',
            value: 150,
          },
        ],
      };
      filtered = filterService.apply(mockMarketData, filterConfig);
      expect(filtered.length).toBe(2);
    });

    it('should update statistics when data is filtered', () => {
      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'changePercent',
            operator: 'gt',
            value: 0,
          },
        ],
      };

      const filtered = filterService.apply(mockMarketData, filterConfig);
      const prices = filtered.map(d => d.price);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

      expect(filtered.length).toBe(2);
      expect(avg).toBe(150);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `商品${i}`,
        price: Math.random() * 1000,
        change: Math.random() * 100 - 50,
        changePercent: Math.random() * 20 - 10,
        stock: Math.random() * 10000,
      }));

      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'price',
            operator: 'gte',
            value: 500,
          },
        ],
        sorts: [
          {
            field: 'price',
            direction: 'desc',
          },
        ],
      };

      const startTime = performance.now();
      const filtered = filterService.apply(largeData, filterConfig);
      const endTime = performance.now();

      expect(filtered.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle null and undefined values', () => {
      const dataWithNulls = [
        { id: '1', name: '商品A', price: 100, change: null, changePercent: 5, stock: 1000 },
        { id: '2', name: '商品B', price: undefined, change: 10, changePercent: undefined, stock: 800 },
        { id: '3', name: '商品C', price: 120, change: 0, changePercent: 0, stock: null },
      ];

      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'price',
            operator: 'gte',
            value: 100,
          },
        ],
      };

      const filtered = filterService.apply(dataWithNulls, filterConfig);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should handle special characters in data', () => {
      const specialData = [
        { id: '1', name: '小麦 (Wheat)', price: 100, change: 5, changePercent: 5, stock: 1000 },
        { id: '2', name: '玉米 & 大豆', price: 150, change: -10, changePercent: -6.25, stock: 800 },
        { id: '3', name: '水稻 "优质"', price: 120, change: 0, changePercent: 0, stock: 1200 },
      ];

      const filterConfig: FilterConfig = {
        filters: [
          {
            field: 'name',
            operator: 'contains',
            value: '玉米',
          },
        ],
      };

      const filtered = filterService.apply(specialData, filterConfig);
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toContain('玉米');
    });
  });
});
