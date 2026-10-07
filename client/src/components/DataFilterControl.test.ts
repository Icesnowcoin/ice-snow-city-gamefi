import { describe, it, expect, beforeEach } from 'vitest';
import { DataFilterService, FilterCondition, SortRule, FilterConfig } from '@/lib/dataFilterService';

describe('DataFilterControl - Filtering and Sorting', () => {
  let filterService: DataFilterService;
  let testData: Record<string, any>[];

  beforeEach(() => {
    filterService = new DataFilterService();
    testData = [
      { id: 1, name: 'Apple', price: 100, category: 'Fruit', stock: 50 },
      { id: 2, name: 'Banana', price: 50, category: 'Fruit', stock: 100 },
      { id: 3, name: 'Carrot', price: 30, category: 'Vegetable', stock: 200 },
      { id: 4, name: 'Date', price: 200, category: 'Fruit', stock: 10 },
      { id: 5, name: 'Eggplant', price: 40, category: 'Vegetable', stock: 150 },
    ];
  });

  describe('Single Condition Filtering', () => {
    it('should filter by equals operator', () => {
      const conditions: FilterCondition[] = [
        { field: 'category', operator: 'equals', value: 'Fruit' },
      ];
      const result = filterService.filter(testData, conditions);
      expect(result).toHaveLength(3);
      expect(result.every((r) => r.category === 'Fruit')).toBe(true);
    });

    it('should filter by contains operator', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'contains', value: 'a' },
      ];
      const result = filterService.filter(testData, conditions);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((r) => r.name.toLowerCase().includes('a'))).toBe(true);
    });

    it('should filter by greaterThan operator', () => {
      const conditions: FilterCondition[] = [
        { field: 'price', operator: 'greaterThan', value: '100' },
      ];
      const result = filterService.filter(testData, conditions);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((r) => r.price > 100)).toBe(true);
    });

    it('should filter by between operator', () => {
      const conditions: FilterCondition[] = [
        { field: 'price', operator: 'between', value: '50', value2: '150' },
      ];
      const result = filterService.filter(testData, conditions);
      expect(result.every((r) => r.price >= 50 && r.price <= 150)).toBe(true);
    });

    it('should filter by in operator', () => {
      const conditions: FilterCondition[] = [
        { field: 'id', operator: 'in', value: [1, 3, 5] },
      ];
      const result = filterService.filter(testData, conditions);
      expect(result).toHaveLength(3);
      expect(result.every((r) => [1, 3, 5].includes(r.id))).toBe(true);
    });

    it('should filter by regex operator', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'regex', value: '^[A-C]' },
      ];
      const result = filterService.filter(testData, conditions);
      expect(result.every((r) => /^[A-C]/.test(r.name))).toBe(true);
    });
  });

  describe('Multiple Conditions Filtering', () => {
    it('should apply multiple conditions (AND logic)', () => {
      const conditions: FilterCondition[] = [
        { field: 'category', operator: 'equals', value: 'Fruit' },
        { field: 'price', operator: 'greaterThan', value: '50' },
      ];
      const result = filterService.filter(testData, conditions);
      expect(result.every((r) => r.category === 'Fruit' && r.price > 50)).toBe(true);
    });

    it('should handle empty conditions', () => {
      const result = filterService.filter(testData, []);
      expect(result).toEqual(testData);
    });
  });

  describe('Sorting', () => {
    it('should sort by single field ascending', () => {
      const sorts: SortRule[] = [{ field: 'price', direction: 'asc' }];
      const result = filterService.sort(testData, sorts);
      expect(result[0].price).toBeLessThanOrEqual(result[1].price);
      expect(result[result.length - 1].price).toBeGreaterThanOrEqual(result[result.length - 2].price);
    });

    it('should sort by single field descending', () => {
      const sorts: SortRule[] = [{ field: 'price', direction: 'desc' }];
      const result = filterService.sort(testData, sorts);
      expect(result[0].price).toBeGreaterThanOrEqual(result[1].price);
    });

    it('should sort by multiple fields with priority', () => {
      const testData2 = [
        { category: 'Fruit', price: 100 },
        { category: 'Vegetable', price: 50 },
        { category: 'Fruit', price: 50 },
        { category: 'Vegetable', price: 100 },
      ];

      const sorts: SortRule[] = [
        { field: 'category', direction: 'asc', priority: 0 },
        { field: 'price', direction: 'desc', priority: 1 },
      ];

      const result = filterService.sort(testData2, sorts);
      expect(result[0].category).toBe('Fruit');
      expect(result[1].category).toBe('Fruit');
      expect(result[0].price).toBeGreaterThanOrEqual(result[1].price);
    });

    it('should handle empty sorts', () => {
      const result = filterService.sort(testData, []);
      expect(result).toHaveLength(testData.length);
    });
  });

  describe('Combined Filtering and Sorting', () => {
    it('should apply filters and sorts together', () => {
      const config: FilterConfig = {
        filters: [{ field: 'category', operator: 'equals', value: 'Fruit' }],
        sorts: [{ field: 'price', direction: 'asc' }],
      };

      const result = filterService.apply(testData, config);
      expect(result.every((r) => r.category === 'Fruit')).toBe(true);
      expect(result[0].price).toBeLessThanOrEqual(result[1].price);
    });

    it('should apply pagination', () => {
      const config: FilterConfig = {
        limit: 2,
        offset: 1,
      };

      const result = filterService.apply(testData, config);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(testData[1].id);
    });

    it('should apply complete config', () => {
      const config: FilterConfig = {
        filters: [{ field: 'price', operator: 'greaterThan', value: '30' }],
        sorts: [{ field: 'price', direction: 'asc' }],
        limit: 2,
      };

      const result = filterService.apply(testData, config);
      expect(result.length).toBeLessThanOrEqual(2);
      expect(result.every((r) => r.price > 30)).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should get unique values', () => {
      const values = filterService.getUniqueValues(testData, 'category');
      expect(values).toContain('Fruit');
      expect(values).toContain('Vegetable');
      expect(values.length).toBe(2);
    });

    it('should calculate statistics', () => {
      const stats = filterService.getStatistics(testData, 'price');
      expect(stats.min).toBe(30);
      expect(stats.max).toBe(200);
      expect(stats.count).toBe(5);
      expect(stats.sum).toBe(420);
      expect(stats.avg).toBe(84);
    });

    it('should validate config', () => {
      const validConfig: FilterConfig = {
        filters: [{ field: 'name', operator: 'equals', value: 'test' }],
      };
      const { valid, errors } = filterService.validateConfig(validConfig);
      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid config', () => {
      const invalidConfig: FilterConfig = {
        filters: [{ field: '', operator: 'equals', value: 'test' }],
      };
      const { valid, errors } = filterService.validateConfig(invalidConfig);
      expect(valid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Case Sensitivity', () => {
    it('should respect case sensitivity flag', () => {
      const conditions: FilterCondition[] = [
        { field: 'name', operator: 'equals', value: 'apple', caseSensitive: false },
      ];
      const result = filterService.filter(testData, conditions);
      expect(result.length).toBeGreaterThan(0);

      const caseSensitiveConditions: FilterCondition[] = [
        { field: 'name', operator: 'equals', value: 'apple', caseSensitive: true },
      ];
      const caseSensitiveResult = filterService.filter(testData, caseSensitiveConditions);
      expect(caseSensitiveResult).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        price: Math.random() * 1000,
        category: i % 2 === 0 ? 'A' : 'B',
      }));

      const startTime = performance.now();
      const result = filterService.apply(largeData, {
        filters: [{ field: 'category', operator: 'equals', value: 'A' }],
        sorts: [{ field: 'price', direction: 'asc' }],
      });
      const endTime = performance.now();

      expect(result.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
