import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Equipment,
  EquipmentManager,
} from './EquipmentManager';

function createEquipment(enhancement = 0): Equipment {
  return {
    id: `equipment-${enhancement}`,
    name: '冬季防护外套',
    description: '适合冰雪城市工作的保暖装备。',
    type: 'armor',
    slot: 'chest',
    rarity: 'rare',
    level: 1,
    requiredLevel: 1,
    baseStats: { attack: 10, defense: 20 },
    currentStats: { attack: 10, defense: 20 },
    durability: 100,
    maxDurability: 100,
    enhancement,
    icon: '/assets/equipment/winter-coat.png',
    color: '#3b82f6',
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('EquipmentManager enhancement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the next enhancement cost and stops at max level', () => {
    const manager = new EquipmentManager();

    expect(manager.getEnhancementCost(0)).toMatchObject({
      level: 1,
      goldRequired: 1000,
      successRate: 95,
      breakRate: 0,
    });
    expect(manager.getEnhancementCost(10)).toBeUndefined();
  });

  it('rejects an enhancement when the player lacks required resources', () => {
    const manager = new EquipmentManager();
    manager.initializePlayerEquipment('player-1');
    manager.addToInventory('player-1', createEquipment());

    const result = manager.enhanceEquipment('player-1', 'equipment-0', 999, { stone: 5 });

    expect(result).toEqual({ success: false, broken: false });
    expect(manager.getInventoryItems('player-1')[0].enhancement).toBe(0);
  });

  it('enhances an inventory item and recalculates its stats', () => {
    const manager = new EquipmentManager();
    manager.initializePlayerEquipment('player-1');
    manager.addToInventory('player-1', createEquipment());
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = manager.enhanceEquipment('player-1', 'equipment-0', 1000, { stone: 5 });
    const enhanced = manager.getInventoryItems('player-1')[0];

    expect(result).toEqual({ success: true, broken: false, newEnhancement: 1 });
    expect(enhanced.enhancement).toBe(1);
    expect(enhanced.currentStats).toEqual({ attack: 11, defense: 22 });
  });

  it('reduces enhancement and durability when a break roll occurs', () => {
    const manager = new EquipmentManager();
    manager.initializePlayerEquipment('player-1');
    manager.addToInventory('player-1', createEquipment(3));
    vi.spyOn(Math, 'random').mockReturnValue(0.02);

    const result = manager.enhanceEquipment('player-1', 'equipment-3', 10000, {
      stone: 20,
      crystal: 5,
    });
    const damaged = manager.getInventoryItems('player-1')[0];

    expect(result).toEqual({ success: false, broken: true });
    expect(damaged.enhancement).toBe(2);
    expect(damaged.durability).toBe(0);
  });
});
