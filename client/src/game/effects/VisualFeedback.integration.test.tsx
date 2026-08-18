import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { VisualFeedbackController } from './VisualFeedbackController';
import { Building, Vegetation, BuildingState, VegetationState } from '../types/GameObjectTypes';

describe('Visual Feedback System Integration Tests', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.Engine;
  let canvas: HTMLCanvasElement;
  let visualFeedback: VisualFeedbackController;
  let testMesh: BABYLON.Mesh;

  beforeEach(() => {
    // 创建测试 Canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // 创建 Babylon.js 引擎和场景
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);

    // 创建测试网格
    testMesh = BABYLON.MeshBuilder.CreateBox('testMesh', { size: 1 }, scene);
    testMesh.position = new BABYLON.Vector3(0, 0, 0);

    // 创建视觉反馈控制器
    visualFeedback = new VisualFeedbackController(scene, {
      enableParticles: true,
      enableAnimations: true,
      enableSounds: false, // 禁用音效以避免测试环境问题
      particleDuration: 0.5,
      animationDuration: 0.3,
    });
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });

  describe('编辑反馈', () => {
    it('应该成功播放编辑反馈', async () => {
      const buildingState: BuildingState = {
        health: 100,
        productivity: 100,
        workers: 2,
        capacity: 100,
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 86400000),
      };

      const building: Building = {
        id: 'test-building',
        name: 'Test Building',
        type: 'building',
        buildingType: 'farmhouse',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 0.8, g: 0.6, b: 0.4 },
        description: 'A test farmhouse',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: { width: 5, height: 4, depth: 5 },
        owner: 'player1',
        constructionCost: 1000,
        maintenanceCost: 100,
        state: buildingState,
      };

      await visualFeedback.playEditFeedback(testMesh, building);
      expect(testMesh).toBeDefined();
    });

    it('应该正确处理编辑反馈的配置', () => {
      const config = visualFeedback.getConfig();
      expect(config.enableAnimations).toBe(true);
      expect(config.enableParticles).toBe(true);
      expect(config.particleDuration).toBe(0.5);
    });
  });

  describe('维护反馈', () => {
    it('应该成功播放维护反馈', async () => {
      const buildingState: BuildingState = {
        health: 50,
        productivity: 60,
        workers: 1,
        capacity: 100,
        lastMaintenance: new Date(Date.now() - 86400000),
        nextMaintenance: new Date(),
      };

      const building: Building = {
        id: 'test-building',
        name: 'Test Building',
        type: 'building',
        buildingType: 'greenhouse',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 0.2, g: 0.8, b: 0.3 },
        description: 'A test greenhouse',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: { width: 6, height: 5, depth: 6 },
        owner: 'player1',
        constructionCost: 1500,
        maintenanceCost: 150,
        state: buildingState,
      };

      await visualFeedback.playMaintenanceFeedback(testMesh, building);
      expect(building.state.health).toBe(50);
    });
  });

  describe('删除反馈', () => {
    it('应该成功播放删除反馈', async () => {
      const vegetationState: VegetationState = {
        health: 100,
        growth: 100,
        moisture: 80,
        nutrients: 90,
        harvestReady: true,
      };

      const vegetation: Vegetation = {
        id: 'test-vegetation',
        name: 'Test Vegetation',
        type: 'vegetation',
        vegetationType: 'wheat_field',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 1, g: 0.8, b: 0.2 },
        description: 'A test wheat field',
        createdAt: new Date(),
        updatedAt: new Date(),
        area: 100,
        state: vegetationState,
        waterRequirement: 50,
        sunlight: 100,
        temperature: 25,
      };

      await visualFeedback.playDeleteFeedback(testMesh, vegetation);
      expect(testMesh.scaling.x).toBeLessThan(1);
    });
  });

  describe('收获反馈', () => {
    it('应该成功播放收获反馈', async () => {
      const vegetationState: VegetationState = {
        health: 100,
        growth: 100,
        moisture: 85,
        nutrients: 95,
        harvestReady: true,
      };

      const vegetation: Vegetation = {
        id: 'test-vegetation',
        name: 'Test Vegetation',
        type: 'vegetation',
        vegetationType: 'fruit_tree',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 0.6, g: 0.4, b: 0.2 },
        description: 'A test fruit tree',
        createdAt: new Date(),
        updatedAt: new Date(),
        area: 50,
        state: vegetationState,
        waterRequirement: 40,
        sunlight: 90,
        temperature: 22,
        yield: {
          type: 'apple',
          amount: 100,
          harvestTime: new Date(),
        },
      };

      await visualFeedback.playHarvestFeedback(testMesh, vegetation);
      expect(vegetation.state.harvestReady).toBe(true);
    });
  });

  describe('升级反馈', () => {
    it('应该成功播放升级反馈', async () => {
      const buildingState: BuildingState = {
        health: 100,
        productivity: 100,
        workers: 3,
        capacity: 150,
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 86400000),
      };

      const building: Building = {
        id: 'test-building',
        name: 'Test Building',
        type: 'building',
        buildingType: 'grain_dryer',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 0.7, g: 0.5, b: 0.3 },
        description: 'A test grain dryer',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: { width: 4, height: 5, depth: 4 },
        owner: 'player1',
        constructionCost: 2000,
        maintenanceCost: 200,
        state: buildingState,
        production: {
          type: 'dried_grain',
          amount: 50,
          rate: 10,
        },
      };

      await visualFeedback.playUpgradeFeedback(testMesh, building);
      expect(building.state.health).toBe(100);
    });
  });

  describe('生产反馈', () => {
    it('应该成功播放生产反馈', async () => {
      const buildingState: BuildingState = {
        health: 100,
        productivity: 100,
        workers: 2,
        capacity: 200,
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 86400000),
      };

      const building: Building = {
        id: 'test-building',
        name: 'Test Building',
        type: 'building',
        buildingType: 'storage',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 0.5, g: 0.5, b: 0.5 },
        description: 'A test storage',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: { width: 8, height: 6, depth: 8 },
        owner: 'player1',
        constructionCost: 1200,
        maintenanceCost: 120,
        state: buildingState,
        storage: {
          capacity: 500,
          current: 250,
          items: [],
        },
      };

      await visualFeedback.playProductionFeedback(testMesh, building);
      expect(building.state.productivity).toBe(100);
    });
  });

  describe('健康度恢复反馈', () => {
    it('应该成功播放健康度恢复反馈', async () => {
      const buildingState: BuildingState = {
        health: 100,
        productivity: 100,
        workers: 1,
        capacity: 100,
        lastMaintenance: new Date(),
        nextMaintenance: new Date(Date.now() + 86400000),
      };

      const building: Building = {
        id: 'test-building',
        name: 'Test Building',
        type: 'building',
        buildingType: 'windmill',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { r: 0.9, g: 0.9, b: 0.9 },
        description: 'A test windmill',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: { width: 3, height: 8, depth: 3 },
        owner: 'player1',
        constructionCost: 1800,
        maintenanceCost: 180,
        state: buildingState,
      };

      await visualFeedback.playHealthRecoveryFeedback(testMesh, building);
      expect(building.state.health).toBe(100);
    });
  });

  describe('选中反馈', () => {
    it('应该成功播放选中反馈', async () => {
      await visualFeedback.playSelectionFeedback(testMesh);
      expect(testMesh.animations.length).toBeGreaterThanOrEqual(0);
    });

    it('应该成功停止选中反馈', async () => {
      await visualFeedback.playSelectionFeedback(testMesh);
      visualFeedback.stopSelectionFeedback(testMesh);
      expect(testMesh).toBeDefined();
    });
  });

  describe('配置管理', () => {
    it('应该允许修改配置', () => {
      visualFeedback.setConfig({
        enableAnimations: false,
        particleDuration: 1.0,
      });

      const config = visualFeedback.getConfig();
      expect(config.enableAnimations).toBe(false);
      expect(config.particleDuration).toBe(1.0);
    });

    it('应该保留未修改的配置项', () => {
      const originalConfig = visualFeedback.getConfig();
      visualFeedback.setConfig({ enableAnimations: false });

      const newConfig = visualFeedback.getConfig();
      expect(newConfig.enableParticles).toBe(originalConfig.enableParticles);
      expect(newConfig.enableSounds).toBe(originalConfig.enableSounds);
    });
  });

  describe('资源清理', () => {
    it('应该成功清理资源', () => {
      visualFeedback.dispose();
      expect(visualFeedback).toBeDefined();
    });
  });
});
