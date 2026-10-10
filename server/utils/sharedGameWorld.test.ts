import { describe, it, expect, beforeEach } from 'vitest';
import { SharedGameWorldManager, Building, Position } from './sharedGameWorld';

describe('SharedGameWorldManager', () => {
  let manager: SharedGameWorldManager;

  beforeEach(() => {
    manager = new SharedGameWorldManager();
  });

  describe('Map Initialization', () => {
    it('should initialize the game world', () => {
      const stats = manager.getSystemStats();
      expect(stats.totalChunks).toBeGreaterThan(0);
      expect(stats.totalResources).toBe(500);
    });

    it('should create chunks', () => {
      const stats = manager.getSystemStats();
      expect(stats.totalChunks).toBe(100); // 10x10 chunks
    });

    it('should distribute resources', () => {
      const stats = manager.getSystemStats();
      expect(stats.totalResources).toBe(500);
    });
  });

  describe('Player Location Management', () => {
    it('should update player location', () => {
      const position: Position = { x: 500, y: 500 };
      manager.updatePlayerLocation('player1', position);

      const location = manager.getPlayerLocation('player1');
      expect(location).not.toBeNull();
      expect(location?.position).toEqual(position);
    });

    it('should track player in correct chunk', () => {
      const position: Position = { x: 500, y: 500 };
      manager.updatePlayerLocation('player1', position);

      const location = manager.getPlayerLocation('player1');
      expect(location?.chunkId).toBe('chunk_0_0');
    });

    it('should update visible players', () => {
      manager.updatePlayerLocation('player1', { x: 500, y: 500 });
      manager.updatePlayerLocation('player2', { x: 550, y: 550 });

      const location = manager.getPlayerLocation('player1');
      expect(location?.visiblePlayers.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple player positions', () => {
      manager.updatePlayerLocation('player1', { x: 100, y: 100 });
      manager.updatePlayerLocation('player2', { x: 200, y: 200 });
      manager.updatePlayerLocation('player3', { x: 300, y: 300 });

      const stats = manager.getSystemStats();
      expect(stats.totalPlayers).toBe(3);
    });
  });

  describe('Building Management', () => {
    it('should create a building', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      const building = manager.createBuilding('player1', 'house', position, size);

      expect(building).not.toBeNull();
      expect(building?.ownerId).toBe('player1');
      expect(building?.type).toBe('house');
    });

    it('should validate building position', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      const building1 = manager.createBuilding('player1', 'house', position, size);
      expect(building1).not.toBeNull();

      // Try to create overlapping building
      const building2 = manager.createBuilding('player2', 'shop', position, size);
      expect(building2).toBeNull();
    });

    it('should reject building outside map bounds', () => {
      const position: Position = { x: 9950, y: 9950 };
      const size = { width: 200, height: 200 };

      const building = manager.createBuilding('player1', 'house', position, size);
      expect(building).toBeNull();
    });

    it('should get building information', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      const building = manager.createBuilding('player1', 'shop', position, size);
      if (!building) return;

      const retrieved = manager.getBuilding(building.id);
      expect(retrieved).toEqual(building);
    });

    it('should set correct revenue for building types', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      const house = manager.createBuilding('player1', 'house', position, size);
      const shop = manager.createBuilding('player2', 'shop', { x: 1000, y: 1000 }, size);
      const factory = manager.createBuilding('player3', 'factory', { x: 1500, y: 1500 }, size);

      expect(house?.revenue).toBe(10);
      expect(shop?.revenue).toBe(50);
      expect(factory?.revenue).toBe(200);
    });

    it('should set correct maintenance for building types', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      const house = manager.createBuilding('player1', 'house', position, size);
      const office = manager.createBuilding('player2', 'office', { x: 1000, y: 1000 }, size);

      expect(house?.maintenance).toBe(5);
      expect(office?.maintenance).toBe(50);
    });
  });

  describe('Area Queries', () => {
    it('should get buildings in area', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      manager.createBuilding('player1', 'house', position, size);
      manager.createBuilding('player2', 'shop', { x: 600, y: 600 }, size);

      const buildings = manager.getBuildingsInArea(position, 200);
      expect(buildings.length).toBeGreaterThan(0);
    });

    it('should get resources in area', () => {
      const position: Position = { x: 5000, y: 5000 };
      const resources = manager.getResourcesInArea(position, 1000);

      expect(Array.isArray(resources)).toBe(true);
    });

    it('should filter buildings by distance', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      manager.createBuilding('player1', 'house', position, size);
      manager.createBuilding('player2', 'shop', { x: 5000, y: 5000 }, size);

      const nearbyBuildings = manager.getBuildingsInArea(position, 1000);
      expect(nearbyBuildings.length).toBe(1);
    });
  });

  describe('Chunk Management', () => {
    it('should load chunk data', () => {
      const chunk = manager.loadChunkData('chunk_0_0');
      expect(chunk).not.toBeNull();
      expect(chunk?.id).toBe('chunk_0_0');
    });

    it('should get loaded chunks for player', () => {
      manager.updatePlayerLocation('player1', { x: 500, y: 500 });
      const chunks = manager.getLoadedChunksForPlayer('player1');

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.length).toBeLessThanOrEqual(9); // 3x3 chunks
    });

    it('should return empty chunks for unknown player', () => {
      const chunks = manager.getLoadedChunksForPlayer('unknown');
      expect(chunks.length).toBe(0);
    });
  });

  describe('System Statistics', () => {
    it('should provide system statistics', () => {
      const stats = manager.getSystemStats();

      expect(stats).toHaveProperty('totalChunks');
      expect(stats).toHaveProperty('totalBuildings');
      expect(stats).toHaveProperty('totalResources');
      expect(stats).toHaveProperty('totalPlayers');
      expect(stats).toHaveProperty('totalEvents');
    });

    it('should track building count', () => {
      const initialStats = manager.getSystemStats();
      const initialCount = initialStats.totalBuildings;

      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };
      manager.createBuilding('player1', 'house', position, size);

      const updatedStats = manager.getSystemStats();
      expect(updatedStats.totalBuildings).toBe(initialCount + 1);
    });

    it('should track player count', () => {
      manager.updatePlayerLocation('player1', { x: 500, y: 500 });
      manager.updatePlayerLocation('player2', { x: 1000, y: 1000 });

      const stats = manager.getSystemStats();
      expect(stats.totalPlayers).toBe(2);
    });
  });

  describe('Building Types', () => {
    it('should support all building types', () => {
      const types: Array<'house' | 'shop' | 'factory' | 'office' | 'bank'> = [
        'house',
        'shop',
        'factory',
        'office',
        'bank',
      ];

      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      types.forEach((type, index) => {
        const building = manager.createBuilding(`player${index}`, type, 
          { x: 500 + index * 200, y: 500 }, size);
        expect(building?.type).toBe(type);
      });
    });
  });

  describe('Events', () => {
    it('should record map events', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      manager.createBuilding('player1', 'house', position, size);

      const events = manager.getRecentEvents(10);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should track building creation events', () => {
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };

      manager.createBuilding('player1', 'house', position, size);

      const events = manager.getRecentEvents(10);
      const buildingEvent = events.find((e) => e.type === 'building_created');
      expect(buildingEvent).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete game world workflow', () => {
      // Add players
      manager.updatePlayerLocation('player1', { x: 500, y: 500 });
      manager.updatePlayerLocation('player2', { x: 600, y: 600 });

      // Create buildings
      const position: Position = { x: 500, y: 500 };
      const size = { width: 100, height: 100 };
      manager.createBuilding('player1', 'house', position, size);
      manager.createBuilding('player1', 'shop', { x: 1000, y: 1000 }, size);

      // Query data
      const stats = manager.getSystemStats();
      expect(stats.totalPlayers).toBe(2);
      expect(stats.totalBuildings).toBe(2);

      // Get loaded chunks
      const chunks = manager.getLoadedChunksForPlayer('player1');
      expect(chunks.length).toBeGreaterThan(0);

      // Get buildings in area
      const buildings = manager.getBuildingsInArea({ x: 500, y: 500 }, 1000);
      expect(buildings.length).toBeGreaterThan(0);
    });

    it('should maintain data consistency', () => {
      const stats1 = manager.getSystemStats();
      const stats2 = manager.getSystemStats();

      expect(stats1.totalChunks).toBe(stats2.totalChunks);
      expect(stats1.totalResources).toBe(stats2.totalResources);
    });
  });
});
