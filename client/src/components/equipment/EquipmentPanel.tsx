import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Sword,
  Shield,
  Zap,
  Heart,
  Zap as Speed,
  Sparkles,
  Trash2,
  Wrench,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import {
  Equipment,
  EquipmentSlot,
  EquipmentStats,
  EnhancementCost,
} from '@/game/equipment/EquipmentManager';
import './equipment-panel.css';

interface EquipmentPanelProps {
  equippedItems: Map<EquipmentSlot, Equipment>;
  inventoryItems: Equipment[];
  totalStats: EquipmentStats;
  onEquip?: (equipment: Equipment) => void;
  onUnequip?: (slot: EquipmentSlot) => void;
  onEnhance?: (equipmentId: string) => void | Promise<boolean | void>;
  enhancementCost?: EnhancementCost;
  getEnhancementCost?: (currentLevel: number) => EnhancementCost | undefined;
  onRepair?: (equipmentId: string) => void;
  onDiscard?: (equipmentId: string) => void;
}

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: '头部',
  chest: '胸部',
  hands: '手部',
  legs: '腿部',
  feet: '脚部',
  mainHand: '主手',
  offHand: '副手',
  ring1: '戒指1',
  ring2: '戒指2',
  necklace: '项链',
  back: '背部',
};

const SLOT_ORDER: EquipmentSlot[] = [
  'head',
  'chest',
  'hands',
  'legs',
  'feet',
  'mainHand',
  'offHand',
  'necklace',
  'ring1',
  'ring2',
  'back',
];

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
};

export const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  equippedItems,
  inventoryItems,
  totalStats,
  onEquip,
  onUnequip,
  onEnhance,
  enhancementCost,
  getEnhancementCost,
  onRepair,
  onDiscard,
}) => {
  const [activeTab, setActiveTab] = useState('equipped');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [enhancementState, setEnhancementState] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const selectedEnhancementCost = selectedEquipment
    ? enhancementCost ?? getEnhancementCost?.(selectedEquipment.enhancement)
    : enhancementCost;

  const renderEquipmentSlot = (slot: EquipmentSlot) => {
    const equipment = equippedItems.get(slot);

    return (
      <div key={slot} className="equipment-slot">
        <div className="slot-label">{SLOT_LABELS[slot]}</div>
        {equipment ? (
          <div
            className="slot-content equipped"
            style={{ borderColor: RARITY_COLORS[equipment.rarity] }}
            onClick={() => setSelectedEquipment(equipment)}
          >
            <img src={equipment.icon} alt={equipment.name} className="slot-icon" />
            <div className="slot-info">
              <div className="slot-name">{equipment.name}</div>
              <div className="slot-enhancement">+{equipment.enhancement}</div>
            </div>
          </div>
        ) : (
          <div className="slot-content empty">
            <div className="slot-placeholder">空</div>
          </div>
        )}
      </div>
    );
  };

  const handleEnhance = async () => {
    if (!selectedEquipment || !onEnhance || selectedEquipment.enhancement >= 10) return;

    setEnhancementState('loading');
    try {
      const result = await onEnhance(selectedEquipment.id);
      setEnhancementState(result === false ? 'failed' : 'success');
    } catch {
      setEnhancementState('failed');
    }
  };

  const renderStatRow = (label: string, value: number | undefined, icon: React.ReactNode) => {
    if (value === undefined || value === 0) return null;

    return (
      <div key={label} className="stat-row">
        <div className="stat-icon">{icon}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    );
  };

  return (
    <div className="equipment-panel">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="equipment-tabs">
        <TabsList>
          <TabsTrigger value="equipped">穿戴装备</TabsTrigger>
          <TabsTrigger value="inventory">背包 ({inventoryItems.length})</TabsTrigger>
          <TabsTrigger value="stats">属性</TabsTrigger>
        </TabsList>

        {/* 穿戴装备标签页 */}
        <TabsContent value="equipped" className="tab-content">
          <div className="equipped-grid">
            {SLOT_ORDER.map((slot) => renderEquipmentSlot(slot))}
          </div>
        </TabsContent>

        {/* 背包标签页 */}
        <TabsContent value="inventory" className="tab-content">
          <ScrollArea className="inventory-list">
            {inventoryItems.length === 0 ? (
              <div className="empty-state">
                <Sword className="empty-icon" />
                <p>背包为空</p>
              </div>
            ) : (
              inventoryItems.map((equipment) => (
                <div
                  key={equipment.id}
                  className="inventory-item"
                  style={{ borderLeftColor: RARITY_COLORS[equipment.rarity] }}
                  onClick={() => setSelectedEquipment(equipment)}
                >
                  <img src={equipment.icon} alt={equipment.name} className="item-icon" />
                  <div className="item-info">
                    <div className="item-name">{equipment.name}</div>
                    <div className="item-details">
                      <Badge variant="outline" className="item-type">
                        {equipment.type}
                      </Badge>
                      <span className="item-level">Lv.{equipment.level}</span>
                      {equipment.enhancement > 0 && (
                        <Badge className="item-enhancement">+{equipment.enhancement}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEquip?.(equipment);
                      }}
                    >
                      穿戴
                    </Button>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>

        {/* 属性标签页 */}
        <TabsContent value="stats" className="tab-content">
          <Card className="stats-card">
            <h3>总属性</h3>
            <div className="stats-grid">
              {renderStatRow('攻击力', totalStats.attack, <Sword className="icon" />)}
              {renderStatRow('防御力', totalStats.defense, <Shield className="icon" />)}
              {renderStatRow('生命值', totalStats.health, <Heart className="icon" />)}
              {renderStatRow('魔法值', totalStats.mana, <Zap className="icon" />)}
              {renderStatRow('速度', totalStats.speed, <Speed className="icon" />)}
              {renderStatRow('幸运值', totalStats.luck, <Sparkles className="icon" />)}
              {totalStats.critRate !== undefined && totalStats.critRate > 0 && (
                <div className="stat-row">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-label">暴击率</div>
                  <div className="stat-value">{totalStats.critRate}%</div>
                </div>
              )}
              {totalStats.dodge !== undefined && totalStats.dodge > 0 && (
                <div className="stat-row">
                  <div className="stat-icon">🛡️</div>
                  <div className="stat-label">闪避</div>
                  <div className="stat-value">{totalStats.dodge}%</div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 装备详情面板 */}
      {selectedEquipment && (
        <div className="equipment-detail">
          <div className="detail-header">
            <img src={selectedEquipment.icon} alt={selectedEquipment.name} className="detail-icon" />
            <div className="detail-title">
              <h3>{selectedEquipment.name}</h3>
              <Badge style={{ backgroundColor: RARITY_COLORS[selectedEquipment.rarity] }}>
                {selectedEquipment.rarity}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEquipment(null)}
              className="close-btn"
            >
              ✕
            </Button>
          </div>

          <div className="detail-content">
            <div className="detail-section">
              <h4>基本信息</h4>
              <div className="info-row">
                <span>类型</span>
                <span>{selectedEquipment.type}</span>
              </div>
              <div className="info-row">
                <span>等级</span>
                <span>{selectedEquipment.level}</span>
              </div>
              <div className="info-row">
                <span>强化</span>
                <span>+{selectedEquipment.enhancement}/10</span>
              </div>
              <div className="info-row">
                <span>耐久度</span>
                <div className="durability-bar">
                  <Progress
                    value={(selectedEquipment.durability / selectedEquipment.maxDurability) * 100}
                  />
                  <span className="durability-text">
                    {selectedEquipment.durability}/{selectedEquipment.maxDurability}
                  </span>
                </div>
              </div>
            </div>

            {selectedEnhancementCost && selectedEquipment.enhancement < 10 && (
              <div className="detail-section enhancement-cost-panel">
                <div className="enhancement-cost-header">
                  <h4>下一阶强化成本</h4>
                  <Badge variant="outline">成功率 {selectedEnhancementCost.successRate}%</Badge>
                </div>
                <div className="enhancement-cost-row">
                  <span>金币</span>
                  <strong>{selectedEnhancementCost.goldRequired.toLocaleString()}</strong>
                </div>
                <div className="enhancement-cost-row">
                  <span>材料</span>
                  <strong>
                    {Object.entries(selectedEnhancementCost.materialsRequired)
                      .map(([material, amount]) => `${material} ×${amount}`)
                      .join('、') || '无'}
                  </strong>
                </div>
                {selectedEnhancementCost.breakRate > 0 && (
                  <div className="enhancement-warning">失败时有 {selectedEnhancementCost.breakRate}% 概率降低强化等级并损坏装备。</div>
                )}
              </div>
            )}

            {enhancementState !== 'idle' && (
              <div className={`enhancement-feedback ${enhancementState}`} role="status">
                {enhancementState === 'loading' && '正在提交强化…'}
                {enhancementState === 'success' && '强化请求已提交，请等待后端返回最新装备状态。'}
                {enhancementState === 'failed' && '强化未完成，请检查资源、装备状态或网络后重试。'}
              </div>
            )}

            <div className="detail-section">
              <h4>属性</h4>
              <div className="stats-list">
                {selectedEquipment.currentStats.attack && (
                  <div className="stat-item">
                    <span>攻击力</span>
                    <span className="stat-value">+{selectedEquipment.currentStats.attack}</span>
                  </div>
                )}
                {selectedEquipment.currentStats.defense && (
                  <div className="stat-item">
                    <span>防御力</span>
                    <span className="stat-value">+{selectedEquipment.currentStats.defense}</span>
                  </div>
                )}
                {selectedEquipment.currentStats.health && (
                  <div className="stat-item">
                    <span>生命值</span>
                    <span className="stat-value">+{selectedEquipment.currentStats.health}</span>
                  </div>
                )}
                {selectedEquipment.currentStats.critRate && (
                  <div className="stat-item">
                    <span>暴击率</span>
                    <span className="stat-value">+{selectedEquipment.currentStats.critRate}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-actions">
              <Button
                onClick={() => void handleEnhance()}
                className="action-btn enhance"
                disabled={!onEnhance || selectedEquipment.enhancement >= 10 || enhancementState === 'loading'}
              >
                <TrendingUp className="icon" />
                {enhancementState === 'loading' ? '强化中…' : selectedEquipment.enhancement >= 10 ? '已满级' : '强化'}
              </Button>
              <Button
                onClick={() => onRepair?.(selectedEquipment.id)}
                className="action-btn repair"
              >
                <Wrench className="icon" />
                修复
              </Button>
              <Button
                onClick={() => onDiscard?.(selectedEquipment.id)}
                className="action-btn discard"
              >
                <Trash2 className="icon" />
                丢弃
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPanel;
