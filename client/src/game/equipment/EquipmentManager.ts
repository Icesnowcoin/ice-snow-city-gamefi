/**
 * 装备系统管理器
 * 管理装备数据、穿戴、强化、套装效果等
 */

export type EquipmentSlot = 
  | 'head'      // 头部
  | 'chest'     // 胸部
  | 'hands'     // 手部
  | 'legs'      // 腿部
  | 'feet'      // 脚部
  | 'mainHand'  // 主手
  | 'offHand'   // 副手
  | 'ring1'     // 戒指1
  | 'ring2'     // 戒指2
  | 'necklace'  // 项链
  | 'back';     // 背部

export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type EquipmentType = 
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'pants'
  | 'boots'
  | 'sword'
  | 'shield'
  | 'ring'
  | 'necklace'
  | 'cloak';

export interface EquipmentStats {
  attack?: number;      // 攻击力
  defense?: number;     // 防御力
  health?: number;      // 生命值
  mana?: number;        // 魔法值
  speed?: number;       // 速度
  luck?: number;        // 幸运值
  critRate?: number;    // 暴击率 (%)
  critDamage?: number;  // 暴击伤害 (%)
  dodge?: number;       // 闪避 (%)
  resistance?: number;  // 抗性 (%)
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  type: EquipmentType;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  level: number;           // 装备等级
  requiredLevel: number;   // 需要的玩家等级
  baseStats: EquipmentStats;
  currentStats: EquipmentStats;
  durability: number;      // 耐久度 (0-100)
  maxDurability: number;
  enhancement: number;     // 强化等级 (0-10)
  setId?: string;          // 套装ID
  setName?: string;        // 套装名称
  icon: string;
  color: string;           // 品质颜色
  createdAt: number;
  updatedAt: number;
}

export interface EquipmentSet {
  id: string;
  name: string;
  description: string;
  icon: string;
  pieces: Equipment[];
  bonusStats: {
    twopiece?: EquipmentStats;
    fourpiece?: EquipmentStats;
    sixpiece?: EquipmentStats;
  };
}

export interface PlayerEquipment {
  playerId: string;
  equipped: Map<EquipmentSlot, Equipment>;
  inventory: Equipment[];
  sets: Map<string, EquipmentSet>;
}

export interface EnhancementCost {
  level: number;
  goldRequired: number;
  materialsRequired: { [key: string]: number };
  successRate: number; // 成功率 (%)
  breakRate: number;   // 破碎率 (%)
}

export type EquipmentEventType = 
  | 'equipmentEquipped'
  | 'equipmentUnequipped'
  | 'equipmentEnhanced'
  | 'equipmentBroken'
  | 'equipmentRepaired'
  | 'setBonus'
  | 'equipmentUpgraded';

export interface EquipmentEvent {
  type: EquipmentEventType;
  playerId: string;
  equipment?: Equipment;
  timestamp: number;
  data: Record<string, any>;
}

type EquipmentEventListener = (event: EquipmentEvent) => void;

export class EquipmentManager {
  private playerEquipment: Map<string, PlayerEquipment> = new Map();
  private equipmentDatabase: Map<string, Equipment> = new Map();
  private equipmentSets: Map<string, EquipmentSet> = new Map();
  private enhancementCosts: EnhancementCost[] = [];
  private eventListeners: EquipmentEventListener[] = [];

  constructor() {
    this.initializeEnhancementCosts();
  }

  /**
   * 初始化强化成本表
   */
  private initializeEnhancementCosts(): void {
    this.enhancementCosts = [
      { level: 0, goldRequired: 0, materialsRequired: {}, successRate: 100, breakRate: 0 },
      { level: 1, goldRequired: 1000, materialsRequired: { 'stone': 5 }, successRate: 95, breakRate: 0 },
      { level: 2, goldRequired: 2000, materialsRequired: { 'stone': 10 }, successRate: 90, breakRate: 0 },
      { level: 3, goldRequired: 5000, materialsRequired: { 'stone': 15, 'crystal': 3 }, successRate: 85, breakRate: 5 },
      { level: 4, goldRequired: 10000, materialsRequired: { 'stone': 20, 'crystal': 5 }, successRate: 80, breakRate: 5 },
      { level: 5, goldRequired: 20000, materialsRequired: { 'stone': 30, 'crystal': 10, 'essence': 2 }, successRate: 75, breakRate: 10 },
      { level: 6, goldRequired: 50000, materialsRequired: { 'stone': 40, 'crystal': 15, 'essence': 5 }, successRate: 70, breakRate: 15 },
      { level: 7, goldRequired: 100000, materialsRequired: { 'stone': 50, 'crystal': 20, 'essence': 10 }, successRate: 65, breakRate: 20 },
      { level: 8, goldRequired: 200000, materialsRequired: { 'stone': 60, 'crystal': 30, 'essence': 15 }, successRate: 60, breakRate: 25 },
      { level: 9, goldRequired: 500000, materialsRequired: { 'stone': 80, 'crystal': 50, 'essence': 20 }, successRate: 50, breakRate: 30 },
      { level: 10, goldRequired: 1000000, materialsRequired: { 'stone': 100, 'crystal': 100, 'essence': 50 }, successRate: 40, breakRate: 40 },
    ];
  }

  /**
   * 创建玩家装备数据
   */
  initializePlayerEquipment(playerId: string): void {
    if (!this.playerEquipment.has(playerId)) {
      this.playerEquipment.set(playerId, {
        playerId,
        equipped: new Map(),
        inventory: [],
        sets: new Map(),
      });
    }
  }

  /**
   * 注册套装定义
   */
  registerSet(set: EquipmentSet): void {
    this.equipmentSets.set(set.id, set);
  }

  /**
   * 穿戴装备
   */
  equipItem(playerId: string, equipment: Equipment): boolean {
    const playerEq = this.playerEquipment.get(playerId);
    if (!playerEq) {
      return false;
    }

    // 检查装备是否在背包中
    const inventoryIndex = playerEq.inventory.findIndex((e) => e.id === equipment.id);
    if (inventoryIndex === -1) {
      return false;
    }

    // 检查该位置是否已有装备
    const previousEquipment = playerEq.equipped.get(equipment.slot);

    // 穿戴新装备
    playerEq.equipped.set(equipment.slot, equipment);
    playerEq.inventory.splice(inventoryIndex, 1);

    // 如果有之前的装备，放回背包
    if (previousEquipment) {
      playerEq.inventory.push(previousEquipment);
    }

    this.emitEvent({
      type: 'equipmentEquipped',
      playerId,
      equipment,
      timestamp: Date.now(),
      data: { slot: equipment.slot },
    });

    // 检查套装效果
    this.checkSetBonuses(playerId);

    return true;
  }

  /**
   * 卸下装备
   */
  unequipItem(playerId: string, slot: EquipmentSlot): boolean {
    const playerEq = this.playerEquipment.get(playerId);
    if (!playerEq) {
      return false;
    }

    const equipment = playerEq.equipped.get(slot);
    if (!equipment) {
      return false;
    }

    playerEq.equipped.delete(slot);
    playerEq.inventory.push(equipment);

    this.emitEvent({
      type: 'equipmentUnequipped',
      playerId,
      equipment,
      timestamp: Date.now(),
      data: { slot },
    });

    // 检查套装效果
    this.checkSetBonuses(playerId);

    return true;
  }

  /**
   * 强化装备
   */
  enhanceEquipment(
    playerId: string,
    equipmentId: string,
    gold: number,
    materials: { [key: string]: number }
  ): { success: boolean; broken: boolean; newEnhancement?: number } {
    const playerEq = this.playerEquipment.get(playerId);
    if (!playerEq) {
      return { success: false, broken: false };
    }

    // 查找装备
    let equipment: Equipment | undefined;
    let isEquipped = false;

    // 检查穿戴的装备
    playerEq.equipped.forEach((eq) => {
      if (eq.id === equipmentId) {
        equipment = eq;
        isEquipped = true;
      }
    });

    // 检查背包中的装备
    if (!equipment) {
      equipment = playerEq.inventory.find((e) => e.id === equipmentId);
    }

    if (!equipment || equipment.enhancement >= 10) {
      return { success: false, broken: false };
    }

    const cost = this.enhancementCosts[equipment.enhancement + 1];
    if (!cost) {
      return { success: false, broken: false };
    }

    // 检查资源是否足够
    if (gold < cost.goldRequired) {
      return { success: false, broken: false };
    }

    for (const [material, required] of Object.entries(cost.materialsRequired)) {
      if ((materials[material] || 0) < required) {
        return { success: false, broken: false };
      }
    }

    // 计算强化结果
    const random = Math.random() * 100;
    const isBroken = random < cost.breakRate;
    const isSuccess = random < cost.successRate;

    if (isBroken) {
      // 装备破碎
      equipment.enhancement = Math.max(0, equipment.enhancement - 1);
      equipment.durability = 0;

      this.emitEvent({
        type: 'equipmentBroken',
        playerId,
        equipment,
        timestamp: Date.now(),
        data: { enhancement: equipment.enhancement },
      });

      return { success: false, broken: true };
    }

    if (isSuccess) {
      // 强化成功
      equipment.enhancement += 1;
      this.updateEquipmentStats(equipment);

      this.emitEvent({
        type: 'equipmentEnhanced',
        playerId,
        equipment,
        timestamp: Date.now(),
        data: { newEnhancement: equipment.enhancement },
      });

      return { success: true, broken: false, newEnhancement: equipment.enhancement };
    }

    // 强化失败但未破碎
    return { success: false, broken: false };
  }

  /**
   * 修复装备
   */
  repairEquipment(playerId: string, equipmentId: string, gold: number): boolean {
    const playerEq = this.playerEquipment.get(playerId);
    if (!playerEq) {
      return false;
    }

    let equipment: Equipment | undefined;

    playerEq.equipped.forEach((eq) => {
      if (eq.id === equipmentId) {
        equipment = eq;
      }
    });

    if (!equipment) {
      equipment = playerEq.inventory.find((e) => e.id === equipmentId);
    }

    if (!equipment || equipment.durability === equipment.maxDurability) {
      return false;
    }

    const repairCost = Math.floor((equipment.maxDurability - equipment.durability) * 10);
    if (gold < repairCost) {
      return false;
    }

    equipment.durability = equipment.maxDurability;

    this.emitEvent({
      type: 'equipmentRepaired',
      playerId,
      equipment,
      timestamp: Date.now(),
      data: { cost: repairCost },
    });

    return true;
  }

  /**
   * 更新装备属性（基于强化等级）
   */
  private updateEquipmentStats(equipment: Equipment): void {
    const enhancementBonus = 1 + equipment.enhancement * 0.1;

    equipment.currentStats = {
      attack: equipment.baseStats.attack
        ? Math.floor(equipment.baseStats.attack * enhancementBonus)
        : undefined,
      defense: equipment.baseStats.defense
        ? Math.floor(equipment.baseStats.defense * enhancementBonus)
        : undefined,
      health: equipment.baseStats.health
        ? Math.floor(equipment.baseStats.health * enhancementBonus)
        : undefined,
      mana: equipment.baseStats.mana
        ? Math.floor(equipment.baseStats.mana * enhancementBonus)
        : undefined,
      speed: equipment.baseStats.speed
        ? Math.floor(equipment.baseStats.speed * enhancementBonus)
        : undefined,
      luck: equipment.baseStats.luck
        ? Math.floor(equipment.baseStats.luck * enhancementBonus)
        : undefined,
      critRate: equipment.baseStats.critRate
        ? Math.floor(equipment.baseStats.critRate * enhancementBonus * 100) / 100
        : undefined,
      critDamage: equipment.baseStats.critDamage
        ? Math.floor(equipment.baseStats.critDamage * enhancementBonus * 100) / 100
        : undefined,
      dodge: equipment.baseStats.dodge
        ? Math.floor(equipment.baseStats.dodge * enhancementBonus * 100) / 100
        : undefined,
      resistance: equipment.baseStats.resistance
        ? Math.floor(equipment.baseStats.resistance * enhancementBonus * 100) / 100
        : undefined,
    };
  }

  /**
   * 检查套装效果
   */
  private checkSetBonuses(playerId: string): void {
    const playerEq = this.playerEquipment.get(playerId);
    if (!playerEq) {
      return;
    }

    // 统计已穿戴的套装件数
    const setCount: { [setId: string]: number } = {};

    playerEq.equipped.forEach((equipment) => {
      if (equipment.setId) {
        setCount[equipment.setId] = (setCount[equipment.setId] || 0) + 1;
      }
    });

    // 触发套装效果事件
    for (const [setId, count] of Object.entries(setCount)) {
      if (count >= 2 || count >= 4 || count >= 6) {
        this.emitEvent({
          type: 'setBonus',
          playerId,
          timestamp: Date.now(),
          data: { setId, count },
        });
      }
    }
  }

  /**
   * 获取玩家穿戴的装备
   */
  getEquippedItems(playerId: string): Map<EquipmentSlot, Equipment> | undefined {
    return this.playerEquipment.get(playerId)?.equipped;
  }

  /**
   * 获取玩家背包装备
   */
  getInventoryItems(playerId: string): Equipment[] {
    return this.playerEquipment.get(playerId)?.inventory || [];
  }

  /**
   * 获取玩家当前已激活的套装及对应的激活件数
   */
  getActiveSetBonuses(playerId: string): Array<{ setId: string; setName: string; count: number; bonus: EquipmentStats }> {
    const playerEq = this.playerEquipment.get(playerId);
    if (!playerEq) return [];

    const setCount: { [setId: string]: number } = {};
    playerEq.equipped.forEach((equipment) => {
      if (equipment.setId) {
        setCount[equipment.setId] = (setCount[equipment.setId] || 0) + 1;
      }
    });

    const activeBonuses: Array<{ setId: string; setName: string; count: number; bonus: EquipmentStats }> = [];
    for (const [setId, count] of Object.entries(setCount)) {
      const setDef = playerEq.sets.get(setId) || this.equipmentSets.get(setId);
      if (!setDef) continue;

      let combinedBonus: EquipmentStats = {};
      if (count >= 2 && setDef.bonusStats.twopiece) {
        for (const [k, v] of Object.entries(setDef.bonusStats.twopiece)) {
          const key = k as keyof EquipmentStats;
          if (v !== undefined) combinedBonus[key] = (combinedBonus[key] || 0) + v;
        }
      }
      if (count >= 4 && setDef.bonusStats.fourpiece) {
        for (const [k, v] of Object.entries(setDef.bonusStats.fourpiece)) {
          const key = k as keyof EquipmentStats;
          if (v !== undefined) combinedBonus[key] = (combinedBonus[key] || 0) + v;
        }
      }
      if (count >= 6 && setDef.bonusStats.sixpiece) {
        for (const [k, v] of Object.entries(setDef.bonusStats.sixpiece)) {
          const key = k as keyof EquipmentStats;
          if (v !== undefined) combinedBonus[key] = (combinedBonus[key] || 0) + v;
        }
      }

      if (Object.keys(combinedBonus).length > 0) {
        activeBonuses.push({
          setId,
          setName: setDef.name,
          count,
          bonus: combinedBonus,
        });
      }
    }

    return activeBonuses;
  }

  /**
   * 获取玩家总属性（穿戴装备的属性和 + 激活的套装奖励）
   */
  getTotalStats(playerId: string): EquipmentStats {
    const equipped = this.getEquippedItems(playerId);
    if (!equipped) {
      return {};
    }

    const totalStats: EquipmentStats = {};

    equipped.forEach((equipment) => {
      for (const [key, value] of Object.entries(equipment.currentStats)) {
        if (value !== undefined) {
          const currentValue = totalStats[key as keyof EquipmentStats] || 0;
          totalStats[key as keyof EquipmentStats] = (currentValue as number) + (value as number);
        }
      }
    });

    const activeBonuses = this.getActiveSetBonuses(playerId);
    activeBonuses.forEach((ab) => {
      for (const [key, value] of Object.entries(ab.bonus)) {
        if (value !== undefined) {
          const statKey = key as keyof EquipmentStats;
          const currentValue = totalStats[statKey] || 0;
          totalStats[statKey] = (currentValue as number) + (value as number);
        }
      }
    });

    return totalStats;
  }

  /**
   * 获取强化成本
   */
  getEnhancementCost(currentLevel: number): EnhancementCost | undefined {
    if (currentLevel >= 10) {
      return undefined;
    }
    return this.enhancementCosts[currentLevel + 1];
  }

  /**
   * 添加装备到背包
   */
  addToInventory(playerId: string, equipment: Equipment): boolean {
    const playerEq = this.playerEquipment.get(playerId);
    if (!playerEq) {
      return false;
    }

    playerEq.inventory.push(equipment);
    return true;
  }

  /**
   * 从背包移除装备
   */
  removeFromInventory(playerId: string, equipmentId: string): boolean {
    const playerEq = this.playerEquipment.get(playerId);
    if (!playerEq) {
      return false;
    }

    const index = playerEq.inventory.findIndex((e) => e.id === equipmentId);
    if (index === -1) {
      return false;
    }

    playerEq.inventory.splice(index, 1);
    return true;
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: EquipmentEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: EquipmentEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: EquipmentEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }
}
