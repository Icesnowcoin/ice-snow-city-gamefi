import React, { useMemo } from 'react';
import { useEquipment } from '@/hooks/useIceSnowCityApi';
import {
  Equipment as GameEquipment,
  EquipmentManager,
  EquipmentSlot,
  EquipmentStats,
  EquipmentType,
} from '@/game/equipment/EquipmentManager';
import { EquipmentPanel } from './EquipmentPanel';
import type { Equipment as ApiEquipment } from '@/lib/api/ice-snow-city-types';

const SLOT_BY_TYPE: Record<ApiEquipment['type'], EquipmentSlot> = {
  weapon: 'mainHand',
  armor: 'chest',
  accessory: 'necklace',
  shoes: 'feet',
  hat: 'head',
  ring: 'ring1',
};

const TYPE_BY_API_TYPE: Record<ApiEquipment['type'], EquipmentType> = {
  weapon: 'sword',
  armor: 'armor',
  accessory: 'necklace',
  shoes: 'boots',
  hat: 'helmet',
  ring: 'ring',
};

function toGameStats(stats: ApiEquipment['stats']): EquipmentStats {
  return {
    attack: stats.attack,
    defense: stats.defense,
    health: stats.hp,
    speed: stats.speed,
    luck: stats.luck,
    critRate: stats.critRate,
    critDamage: stats.critDamage,
    dodge: stats.dodge,
    resistance: stats.resistance,
  };
}

function toGameEquipment(item: ApiEquipment): GameEquipment {
  const slot = (item.equippedSlot as EquipmentSlot | undefined) ?? SLOT_BY_TYPE[item.type];
  const stats = toGameStats(item.stats);

  return {
    id: item.id,
    name: item.name,
    description: `${item.name}，适用于冰雪城市生活与工作场景。`,
    type: TYPE_BY_API_TYPE[item.type],
    slot,
    rarity: item.rarity === 'mythic' ? 'legendary' : item.rarity,
    level: item.level,
    requiredLevel: item.level,
    baseStats: stats,
    currentStats: stats,
    durability: item.durability,
    maxDurability: item.maxDurability,
    enhancement: item.enhanceLevel,
    setId: item.setId,
    setName: item.setName,
    icon: '/assets/equipment/default.svg',
    color: '#3b82f6',
    createdAt: 0,
    updatedAt: Date.now(),
  };
}

export interface EquipmentPanelContainerProps {
  className?: string;
}

export const EquipmentPanelContainer: React.FC<EquipmentPanelContainerProps> = ({ className }) => {
  const {
    equipment,
    loading,
    error,
    refetch,
    equipItem,
    unequipItem,
    enhanceEquipment,
    repairEquipment,
    isEnhancing,
    isRepairing,
  } = useEquipment();
  const enhancementManager = useMemo(() => new EquipmentManager(), []);

  const mappedItems = useMemo(() => equipment.map(toGameEquipment), [equipment]);
  const equippedItems = useMemo(() => {
    const equipped = new Map<EquipmentSlot, GameEquipment>();
    mappedItems.forEach((item) => {
      const source = equipment.find((candidate) => candidate.id === item.id);
      if (source?.isEquipped) equipped.set(item.slot, item);
    });
    return equipped;
  }, [equipment, mappedItems]);
  const inventoryItems = useMemo(
    () => mappedItems.filter((item) => !equipment.find((source) => source.id === item.id)?.isEquipped),
    [equipment, mappedItems]
  );
  const totalStats = useMemo(() => {
    const totals: EquipmentStats = {};
    equippedItems.forEach((item) => {
      Object.entries(item.currentStats).forEach(([key, value]) => {
        if (value === undefined) return;
        const statKey = key as keyof EquipmentStats;
        totals[statKey] = (totals[statKey] ?? 0) + value;
      });
    });
    return totals;
  }, [equippedItems]);

  const handleEnhance = async (equipmentId: string) => {
    const source = equipment.find((item) => item.id === equipmentId);
    if (!source || !enhancementManager.getEnhancementCost(source.enhanceLevel)) return false;

    const cost = enhancementManager.getEnhancementCost(source.enhanceLevel);
    if (!cost) return false;

    await enhanceEquipment({
      equipmentId,
      coins: cost.goldRequired,
      materials: Object.entries(cost.materialsRequired).flatMap(([material, amount]) =>
        Array.from({ length: amount }, () => material)
      ),
    });
    await refetch();
    return true;
  };

  if (loading) return <div className={className}>正在加载装备数据…</div>;
  if (error) return <div className={className}>装备数据加载失败，请稍后重试。</div>;

  return (
    <div className={className} data-enhancing={isEnhancing || undefined} data-repairing={isRepairing || undefined}>
      <EquipmentPanel
        equippedItems={equippedItems}
        inventoryItems={inventoryItems}
        totalStats={totalStats}
        onEquip={(item) => void equipItem({ equipmentId: item.id, slot: item.slot })}
        onUnequip={(slot) => void unequipItem(slot)}
        onEnhance={handleEnhance}
        getEnhancementCost={enhancementManager.getEnhancementCost.bind(enhancementManager)}
        onRepair={(equipmentId) => {
          void repairEquipment(equipmentId);
          void refetch();
        }}
      />
    </div>
  );
};

export default EquipmentPanelContainer;
