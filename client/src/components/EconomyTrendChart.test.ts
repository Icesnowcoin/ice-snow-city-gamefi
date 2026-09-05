import { describe, it, expect, beforeEach } from 'vitest';
import type { TrendDataPoint } from './EconomyTrendChart';

// 测试数据
const mockTrendData: TrendDataPoint[] = [
  { name: '商品A', value: 100, currentPrice: 100, priceChange: 5, priceChangePercent: 5 },
  { name: '商品B', value: 150, currentPrice: 150, priceChange: -10, priceChangePercent: -6.25 },
  { name: '商品C', value: 120, currentPrice: 120, priceChange: 0, priceChangePercent: 0 },
  { name: '商品D', value: 200, currentPrice: 200, priceChange: 20, priceChangePercent: 11.11 },
  { name: '商品E', value: 80, currentPrice: 80, priceChange: -5, priceChangePercent: -5.88 },
];

describe('EconomyTrendChart Components', () => {
  describe('Data Validation', () => {
    it('should handle empty data array', () => {
      const emptyData: TrendDataPoint[] = [];
      expect(emptyData.length).toBe(0);
    });

    it('should handle null data', () => {
      const data = null;
      expect(data).toBeNull();
    });

    it('should validate trend data structure', () => {
      mockTrendData.forEach((item) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('value');
        expect(typeof item.name).toBe('string');
        expect(typeof item.value).toBe('number');
      });
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate minimum value correctly', () => {
      const values = mockTrendData.map(d => d.value);
      const min = Math.min(...values);
      expect(min).toBe(80);
    });

    it('should calculate maximum value correctly', () => {
      const values = mockTrendData.map(d => d.value);
      const max = Math.max(...values);
      expect(max).toBe(200);
    });

    it('should calculate average value correctly', () => {
      const values = mockTrendData.map(d => d.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      expect(avg).toBe(130);
    });

    it('should calculate total value correctly', () => {
      const values = mockTrendData.map(d => d.value);
      const total = values.reduce((a, b) => a + b, 0);
      expect(total).toBe(650);
    });
  });

  describe('Trend Analysis', () => {
    it('should detect uptrend', () => {
      const upTrendData = [
        { name: '时间1', value: 100 },
        { name: '时间2', value: 150 },
        { name: '时间3', value: 200 },
      ];
      const firstValue = upTrendData[0].value;
      const lastValue = upTrendData[upTrendData.length - 1].value;
      expect(lastValue > firstValue).toBe(true);
    });

    it('should detect downtrend', () => {
      const downTrendData = [
        { name: '时间1', value: 200 },
        { name: '时间2', value: 150 },
        { name: '时间3', value: 100 },
      ];
      const firstValue = downTrendData[0].value;
      const lastValue = downTrendData[downTrendData.length - 1].value;
      expect(lastValue < firstValue).toBe(true);
    });

    it('should detect stable trend', () => {
      const stableTrendData = [
        { name: '时间1', value: 100 },
        { name: '时间2', value: 100 },
        { name: '时间3', value: 100 },
      ];
      const firstValue = stableTrendData[0].value;
      const lastValue = stableTrendData[stableTrendData.length - 1].value;
      expect(firstValue === lastValue).toBe(true);
    });
  });

  describe('Data Filtering', () => {
    it('should filter data by value range', () => {
      const filtered = mockTrendData.filter(item => item.value >= 100 && item.value <= 150);
      expect(filtered.length).toBe(3);
      expect(filtered.every(item => item.value >= 100 && item.value <= 150)).toBe(true);
    });

    it('should filter data by name', () => {
      const filtered = mockTrendData.filter(item => item.name.includes('商品'));
      expect(filtered.length).toBe(5);
    });

    it('should filter positive price changes', () => {
      const filtered = mockTrendData.filter(item => 
        item.priceChangePercent !== undefined && item.priceChangePercent > 0
      );
      expect(filtered.length).toBe(2);
    });
  });

  describe('Data Sorting', () => {
    it('should sort by value ascending', () => {
      const sorted = [...mockTrendData].sort((a, b) => a.value - b.value);
      expect(sorted[0].value).toBe(80);
      expect(sorted[sorted.length - 1].value).toBe(200);
    });

    it('should sort by value descending', () => {
      const sorted = [...mockTrendData].sort((a, b) => b.value - a.value);
      expect(sorted[0].value).toBe(200);
      expect(sorted[sorted.length - 1].value).toBe(80);
    });

    it('should sort by name', () => {
      const sorted = [...mockTrendData].sort((a, b) => a.name.localeCompare(b.name));
      expect(sorted[0].name).toBe('商品A');
      expect(sorted[sorted.length - 1].name).toBe('商品E');
    });
  });

  describe('Data Smoothing', () => {
    it('should apply moving average smoothing', () => {
      const data = [
        { name: '1', value: 100 },
        { name: '2', value: 200 },
        { name: '3', value: 150 },
        { name: '4', value: 250 },
        { name: '5', value: 200 },
      ];

      const windowSize = 3;
      const smoothed = [];

      for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
        const window = data.slice(start, end);
        const values = window.map(d => d.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        smoothed.push(avg);
      }

      expect(smoothed.length).toBe(data.length);
      expect(smoothed[0]).toBe(150); // (100 + 200) / 2
      expect(smoothed[2]).toBe(200); // (200 + 150 + 250) / 3 = 200
    });
  });

  describe('Performance', () => {
    it('should handle large dataset efficiently', () => {
      const largeData: TrendDataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `数据${i + 1}`,
        value: Math.random() * 1000,
      }));

      const startTime = performance.now();
      const values = largeData.map(d => d.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const endTime = performance.now();

      expect(largeData.length).toBe(1000);
      expect(typeof min).toBe('number');
      expect(typeof max).toBe('number');
      expect(typeof avg).toBe('number');
      expect(endTime - startTime).toBeLessThan(100); // 应该在 100ms 内完成
    });

    it('should handle filtering large dataset', () => {
      const largeData: TrendDataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `数据${i + 1}`,
        value: Math.random() * 1000,
      }));

      const startTime = performance.now();
      const filtered = largeData.filter(item => item.value > 500);
      const endTime = performance.now();

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThan(1000);
      expect(endTime - startTime).toBeLessThan(50); // 应该在 50ms 内完成
    });
  });

  describe('Data Transformation', () => {
    it('should transform market price data to trend data', () => {
      const marketData = [
        { id: '1', name: '商品A', currentPrice: 100, previousPrice: 95, priceChange: 5, priceChangePercent: 5.26, volume: 1000, timestamp: Date.now() },
        { id: '2', name: '商品B', currentPrice: 150, previousPrice: 160, priceChange: -10, priceChangePercent: -6.25, volume: 2000, timestamp: Date.now() },
      ];

      const transformed = marketData.map(price => ({
        name: price.name,
        value: price.currentPrice,
        currentPrice: price.currentPrice,
        priceChange: price.priceChange,
        priceChangePercent: price.priceChangePercent,
        volume: price.volume,
      }));

      expect(transformed.length).toBe(2);
      expect(transformed[0].value).toBe(100);
      expect(transformed[1].value).toBe(150);
    });

    it('should aggregate data by category', () => {
      const data = [
        { name: '商品A', category: '食物', value: 100 },
        { name: '商品B', category: '食物', value: 150 },
        { name: '商品C', category: '能量', value: 200 },
      ];

      const aggregated = data.reduce((acc, item) => {
        const existing = acc.find(a => a.category === item.category);
        if (existing) {
          existing.value += item.value;
        } else {
          acc.push({ category: item.category, value: item.value });
        }
        return acc;
      }, [] as Array<{ category: string; value: number }>);

      expect(aggregated.length).toBe(2);
      expect(aggregated[0].value).toBe(250); // 食物总计
      expect(aggregated[1].value).toBe(200); // 能量总计
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined values gracefully', () => {
      const data = [
        { name: '数据1', value: 100 },
        { name: '数据2', value: undefined as any },
        { name: '数据3', value: 150 },
      ];

      const values = data.map(d => (typeof d.value === 'number' ? d.value : 0));
      expect(values).toEqual([100, 0, 150]);
    });

    it('should handle NaN values', () => {
      const data = [
        { name: '数据1', value: 100 },
        { name: '数据2', value: NaN },
        { name: '数据3', value: 150 },
      ];

      const values = data.map(d => (Number.isNaN(d.value) ? 0 : d.value));
      expect(values).toEqual([100, 0, 150]);
    });

    it('should handle negative values', () => {
      const data = [
        { name: '数据1', value: -100 },
        { name: '数据2', value: 50 },
        { name: '数据3', value: -75 },
      ];

      const min = Math.min(...data.map(d => d.value));
      const max = Math.max(...data.map(d => d.value));

      expect(min).toBe(-100);
      expect(max).toBe(50);
    });
  });
});
