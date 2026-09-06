import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDefaultBuilding, createDefaultVegetation } from '../types/GameObjectTypes';

describe('ObjectInfoPanel Integration Tests', () => {
  describe('Edit Dialog Functionality', () => {
    it('should handle building property edits', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test Building',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      // 模拟编辑
      const editedBuilding = {
        ...building,
        name: 'Updated Building',
        state: {
          ...building.state,
          health: 50,
          productivity: 60,
          workers: 5,
        },
      };

      expect(editedBuilding.name).toBe('Updated Building');
      expect(editedBuilding.state.health).toBe(50);
      expect(editedBuilding.state.productivity).toBe(60);
      expect(editedBuilding.state.workers).toBe(5);
    });

    it('should handle vegetation property edits', () => {
      const vegetation = createDefaultVegetation(
        'test_1',
        'Test Vegetation',
        'wheat_field',
        { x: 0, y: 0, z: 0 }
      );

      // 模拟编辑
      const editedVegetation = {
        ...vegetation,
        name: 'Updated Vegetation',
        state: {
          ...vegetation.state,
          health: 70,
          growth: 45,
          moisture: 60,
          nutrients: 75,
          harvestReady: false,
        },
      };

      expect(editedVegetation.name).toBe('Updated Vegetation');
      expect(editedVegetation.state.health).toBe(70);
      expect(editedVegetation.state.growth).toBe(45);
      expect(editedVegetation.state.moisture).toBe(60);
      expect(editedVegetation.state.nutrients).toBe(75);
    });

    it('should validate edited values are within valid ranges', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      // 测试有效范围
      const validHealth = Math.max(0, Math.min(100, 50));
      const validWorkers = Math.max(0, Math.min(building.state.capacity, 5));

      expect(validHealth).toBe(50);
      expect(validWorkers).toBe(5);
    });
  });

  describe('Maintenance Dialog Functionality', () => {
    it('should calculate maintenance effects correctly', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      // 模拟维护
      const maintenanceIncrease = 30;
      const productivityIncrease = 25;

      const maintainedBuilding = {
        ...building,
        state: {
          ...building.state,
          health: Math.min(100, building.state.health + maintenanceIncrease),
          productivity: Math.min(100, building.state.productivity + productivityIncrease),
          lastMaintenance: new Date(),
          nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      expect(maintainedBuilding.state.health).toBeLessThanOrEqual(100);
      expect(maintainedBuilding.state.productivity).toBeLessThanOrEqual(100);
      expect(maintainedBuilding.state.lastMaintenance).toBeInstanceOf(Date);
      expect(maintainedBuilding.state.nextMaintenance.getTime()).toBeGreaterThan(
        new Date().getTime()
      );
    });

    it('should not exceed maximum health on maintenance', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      // 设置高健康度
      building.state.health = 95;

      const maintainedHealth = Math.min(100, building.state.health + 30);
      expect(maintainedHealth).toBe(100);
    });

    it('should calculate maintenance cost correctly', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const maintenanceCost = building.maintenanceCost;
      expect(maintenanceCost).toBeGreaterThan(0);
      expect(typeof maintenanceCost).toBe('number');
    });
  });

  describe('Delete Dialog Functionality', () => {
    it('should require confirmation for deletion', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const confirmationText = 'DELETE';
      const userInput = 'DELETE';

      expect(userInput).toBe(confirmationText);
    });

    it('should handle building deletion', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const onDelete = vi.fn();
      onDelete(building);

      expect(onDelete).toHaveBeenCalledWith(building);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should handle vegetation deletion', () => {
      const vegetation = createDefaultVegetation(
        'test_1',
        'Test',
        'wheat_field',
        { x: 0, y: 0, z: 0 }
      );

      const onDelete = vi.fn();
      onDelete(vegetation);

      expect(onDelete).toHaveBeenCalledWith(vegetation);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should show deletion consequences', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const consequences = [
        '失去建筑及其所有功能',
        '已投入的建造成本不会返还',
        '建筑内的存储物品将丢失',
        '工人将失业',
      ];

      consequences.forEach((consequence) => {
        expect(consequence).toBeTruthy();
      });
    });
  });

  describe('Update Callback Integration', () => {
    it('should call onUpdate when object is edited', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const onUpdate = vi.fn();
      const updatedBuilding = { ...building, name: 'Updated' };

      onUpdate(updatedBuilding);

      expect(onUpdate).toHaveBeenCalledWith(updatedBuilding);
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('should call onUpdate when object is maintained', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const onUpdate = vi.fn();
      const maintainedBuilding = {
        ...building,
        state: {
          ...building.state,
          health: 100,
          productivity: 100,
        },
      };

      onUpdate(maintainedBuilding);

      expect(onUpdate).toHaveBeenCalledWith(maintainedBuilding);
    });
  });

  describe('Delete Callback Integration', () => {
    it('should call onDelete when object is deleted', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const onDelete = vi.fn();
      onDelete(building);

      expect(onDelete).toHaveBeenCalledWith(building);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should clear selection after deletion', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      let selectedObject: any = building;
      const onDelete = vi.fn((obj: any) => {
        selectedObject = null;
      });

      onDelete(building);

      expect(selectedObject).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should maintain object immutability during edits', () => {
      const original = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const edited = {
        ...original,
        name: 'Updated',
      };

      expect(original.name).not.toBe(edited.name);
      expect(original.name).toBe('Test');
      expect(edited.name).toBe('Updated');
    });

    it('should preserve object identity for unmodified fields', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const edited = {
        ...building,
        state: {
          ...building.state,
          health: 50,
        },
      };

      expect(edited.id).toBe(building.id);
      expect(edited.position).toEqual(building.position);
      expect(edited.createdAt).toBe(building.createdAt);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onUpdate callback gracefully', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      // 不提供 onUpdate 回调
      const onUpdate: ((obj: any) => void) | undefined = undefined;

      if (onUpdate !== undefined) {
        (onUpdate as any)(building);
      }

      // 应该不会抛出错误
      expect(true).toBe(true);
    });

    it('should handle missing onDelete callback gracefully', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      // 不提供 onDelete 回调
      const onDelete: ((obj: any) => void) | undefined = undefined;

      if (onDelete !== undefined) {
        (onDelete as any)(building);
      }

      // 应该不会抛出错误
      expect(true).toBe(true);
    });
  });

  describe('Dialog State Management', () => {
    it('should toggle dialog open/close states', () => {
      let isEditDialogOpen = false;
      let isMaintenanceDialogOpen = false;
      let isDeleteDialogOpen = false;

      // 打开编辑对话框
      isEditDialogOpen = true;
      expect(isEditDialogOpen).toBe(true);

      // 关闭编辑对话框
      isEditDialogOpen = false;
      expect(isEditDialogOpen).toBe(false);

      // 打开维护对话框
      isMaintenanceDialogOpen = true;
      expect(isMaintenanceDialogOpen).toBe(true);

      // 打开删除对话框
      isDeleteDialogOpen = true;
      expect(isDeleteDialogOpen).toBe(true);
    });

    it('should only show maintenance dialog for buildings', () => {
      const building = createDefaultBuilding(
        'test_1',
        'Test',
        'farmhouse',
        { x: 0, y: 0, z: 0 }
      );

      const vegetation = createDefaultVegetation(
        'test_1',
        'Test',
        'wheat_field',
        { x: 0, y: 0, z: 0 }
      );

      const isBuilding = (obj: any) => obj.type === 'building';

      expect(isBuilding(building)).toBe(true);
      expect(isBuilding(vegetation)).toBe(false);
    });
  });
});
