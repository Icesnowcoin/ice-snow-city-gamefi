import { describe, it, expect } from 'vitest';
import { EquipmentManager, Equipment } from './EquipmentManager';

describe('EquipmentManager Set Bonuses Integration', () => {
  it('correctly aggregates set bonus stats into total stats when enough items are equipped', () => {
    const manager = new EquipmentManager();
    const playerId = 'test-player-set';
    manager.initializePlayerEquipment(playerId);

    const iceSet = {
      id: 'ice_king_set',
      name: '冰霜之王套装',
      pieces: ['helm_1', 'armor_1', 'boots_1'],
      bonusStats: {
        twopiece: { attack: 50, defense: 30 },
        fourpiece: { hp: 500, critRate: 10 },
      },
    };
    manager.registerSet(iceSet);

    const helm: Equipment = {
      id: 'helm_1',
      name: '冰霜头盔',
      description: 'Test helm',
      type: 'helmet',
      slot: 'head',
      rarity: 'epic',
      level: 10,
      requiredLevel: 10,
      baseStats: { defense: 20 },
      currentStats: { defense: 20 },
      durability: 100,
      maxDurability: 100,
      enhancement: 0,
      setId: 'ice_king_set',
      setName: '冰霜之王套装',
      icon: '',
      color: '#000',
      createdAt: 0,
      updatedAt: 0,
    };

    const armor: Equipment = {
      id: 'armor_1',
      name: '冰霜胸甲',
      description: 'Test armor',
      type: 'armor',
      slot: 'chest',
      rarity: 'epic',
      level: 10,
      requiredLevel: 10,
      baseStats: { defense: 50 },
      currentStats: { defense: 50 },
      durability: 100,
      maxDurability: 100,
      enhancement: 0,
      setId: 'ice_king_set',
      setName: '冰霜之王套装',
      icon: '',
      color: '#000',
      createdAt: 0,
      updatedAt: 0,
    };

    // 穿戴 1 件：先加入背包再穿戴
    manager.addToInventory(playerId, helm);
    manager.addToInventory(playerId, armor);
    manager.equipItem(playerId, helm);
    let stats = manager.getTotalStats(playerId);
    expect(stats.defense).toBe(20);
    expect(manager.getActiveSetBonuses(playerId)).toHaveLength(0);

    // 穿戴第 2 件：激活 2 件套奖励（+50 攻击，+30 防御）
    manager.equipItem(playerId, armor);
    stats = manager.getTotalStats(playerId);
    expect(stats.defense).toBe(20 + 50 + 30); // 20(helm) + 50(armor) + 30(set bonus) = 100
    expect(stats.attack).toBe(50); // set bonus attack = 50

    const activeBonuses = manager.getActiveSetBonuses(playerId);
    expect(activeBonuses).toHaveLength(1);
    expect(activeBonuses[0].count).toBe(2);
    expect(activeBonuses[0].bonus.attack).toBe(50);
  });
});
