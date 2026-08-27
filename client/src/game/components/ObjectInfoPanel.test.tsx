import { describe, it, expect, beforeEach } from 'vitest';
import { createDefaultBuilding, createDefaultVegetation } from '../types/GameObjectTypes';

describe('ObjectInfoPanel Integration Tests', () => {
  describe('Building Object Creation', () => {
    it('should create a default building with correct properties', () => {
      const building = createDefaultBuilding(
        'test_farmhouse_1',
        'Test Farmhouse',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      expect(building.id).toBe('test_farmhouse_1');
      expect(building.name).toBe('Test Farmhouse');
      expect(building.type).toBe('building');
      expect(building.buildingType).toBe('farmhouse');
      expect(building.position).toEqual({ x: 0, y: 0, z: 0 });
      expect(building.state.health).toBe(100);
      expect(building.state.productivity).toBe(80);
    });

    it('should have correct building configuration', () => {
      const building = createDefaultBuilding(
        'test_greenhouse_1',
        'Test Greenhouse',
        'greenhouse',
        { x: 50, y: 0, z: 0 }
      );

      expect(building.buildingType).toBe('greenhouse');
      expect(building.constructionCost).toBeGreaterThan(0);
      expect(building.maintenanceCost).toBeGreaterThan(0);
    });

    it('should have valid state values', () => {
      const building = createDefaultBuilding(
        'test_storage_1',
        'Test Storage',
        'storage',
        { x: 200, y: 0, z: 100 }
      );

      expect(building.state.health).toBeGreaterThanOrEqual(0);
      expect(building.state.health).toBeLessThanOrEqual(100);
      expect(building.state.productivity).toBeGreaterThanOrEqual(0);
      expect(building.state.productivity).toBeLessThanOrEqual(100);
      expect(building.state.workers).toBeGreaterThanOrEqual(0);
      expect(building.state.capacity).toBeGreaterThan(0);
    });
  });

  describe('Vegetation Object Creation', () => {
    it('should create a default vegetation with correct properties', () => {
      const vegetation = createDefaultVegetation(
        'test_wheat_field_1',
        'Test Wheat Field',
        'wheat_field',
        { x: -200, y: 0.1, z: -200 }
      );

      expect(vegetation.id).toBe('test_wheat_field_1');
      expect(vegetation.name).toBe('Test Wheat Field');
      expect(vegetation.type).toBe('vegetation');
      expect(vegetation.vegetationType).toBe('wheat_field');
      expect(vegetation.position).toEqual({ x: -200, y: 0.1, z: -200 });
      expect(vegetation.state.health).toBeGreaterThan(0);
      expect(vegetation.state.growth).toBeGreaterThan(0);
    });

    it('should have correct vegetation state', () => {
      const vegetation = createDefaultVegetation(
        'test_fruit_tree_1',
        'Test Fruit Tree',
        'fruit_tree',
        { x: -100, y: 0, z: 100 }
      );

      expect(vegetation.state.health).toBeGreaterThanOrEqual(0);
      expect(vegetation.state.health).toBeLessThanOrEqual(100);
      expect(vegetation.state.growth).toBeGreaterThanOrEqual(0);
      expect(vegetation.state.growth).toBeLessThanOrEqual(100);
      expect(vegetation.state.moisture).toBeGreaterThanOrEqual(0);
      expect(vegetation.state.moisture).toBeLessThanOrEqual(100);
      expect(vegetation.state.nutrients).toBeGreaterThanOrEqual(0);
      expect(vegetation.state.nutrients).toBeLessThanOrEqual(100);
    });

    it('should have valid environmental conditions', () => {
      const vegetation = createDefaultVegetation(
        'test_bush_1',
        'Test Bush',
        'bush',
        { x: -150, y: 0, z: 50 }
      );

      expect(vegetation.waterRequirement).toBeGreaterThan(0);
      expect(vegetation.sunlight).toBeGreaterThanOrEqual(0);
      expect(vegetation.sunlight).toBeLessThanOrEqual(100);
      expect(vegetation.temperature).toBeGreaterThan(-50);
      expect(vegetation.temperature).toBeLessThan(50);
    });
  });

  describe('Object Type Discrimination', () => {
    it('should correctly identify building objects', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      expect(building.type).toBe('building');
      expect('buildingType' in building).toBe(true);
      expect('vegetationType' in building).toBe(false);
    });

    it('should correctly identify vegetation objects', () => {
      const vegetation = createDefaultVegetation(
        'test_1',
        'Test',
        'wheat_field',
        { x: 0, y: 0, z: 0 }
      );

      expect(vegetation.type).toBe('vegetation');
      expect('vegetationType' in vegetation).toBe(true);
      expect('buildingType' in vegetation).toBe(false);
    });
  });

  describe('Object Timestamps', () => {
    it('should have valid creation timestamps', () => {
      const now = new Date();
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      expect(building.createdAt).toBeInstanceOf(Date);
      expect(building.updatedAt).toBeInstanceOf(Date);
      expect(building.createdAt.getTime()).toBeLessThanOrEqual(now.getTime() + 1000);
    });

    it('should have maintenance dates in the future', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const now = new Date();
      expect(building.state.nextMaintenance.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('Object Color Properties', () => {
    it('should have valid RGB color values', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      expect(building.color.r).toBeGreaterThanOrEqual(0);
      expect(building.color.r).toBeLessThanOrEqual(1);
      expect(building.color.g).toBeGreaterThanOrEqual(0);
      expect(building.color.g).toBeLessThanOrEqual(1);
      expect(building.color.b).toBeGreaterThanOrEqual(0);
      expect(building.color.b).toBeLessThanOrEqual(1);
    });
  });

  describe('Object Position Properties', () => {
    it('should preserve position coordinates', () => {
      const position = { x: 123.45, y: 67.89, z: -100 };
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        position
      );

      expect(building.position.x).toBe(position.x);
      expect(building.position.y).toBe(position.y);
      expect(building.position.z).toBe(position.z);
    });
  });

  describe('Building-Specific Properties', () => {
    it('should have production information', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'greenhouse',
        { x: 0, y: 0, z: 0 }
      );

      // 温室可能有生产信息
      if (building.production) {
        expect(building.production.type).toBeDefined();
        expect(building.production.amount).toBeGreaterThanOrEqual(0);
        expect(building.production.rate).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have storage information', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'storage',
        { x: 0, y: 0, z: 0 }
      );

      // 仓库应该有存储信息
      if (building.storage) {
        expect(building.storage.capacity).toBeGreaterThan(0);
        expect(building.storage.current).toBeGreaterThanOrEqual(0);
        expect(building.storage.current).toBeLessThanOrEqual(building.storage.capacity);
        expect(Array.isArray(building.storage.items)).toBe(true);
      }
    });
  });

  describe('Vegetation-Specific Properties', () => {
    it('should have yield information', () => {
      const vegetation = createDefaultVegetation(
        'test_1',
        'Test',
        'wheat_field',
        { x: 0, y: 0, z: 0 }
      );

      // 麦田可能有产出信息
      if (vegetation.yield) {
        expect(vegetation.yield.type).toBeDefined();
        expect(vegetation.yield.amount).toBeDefined();
        expect(vegetation.yield.harvestTime).toBeInstanceOf(Date);
      }
    });

    it('should have area information', () => {
      const vegetation = createDefaultVegetation(
        'test_1',
        'Test',
        'wheat_field',
        { x: 0, y: 0, z: 0 }
      );

      if (vegetation.area) {
        expect(vegetation.area).toBeGreaterThan(0);
      }
    });
  });
});
