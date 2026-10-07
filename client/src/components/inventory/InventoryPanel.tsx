/**
 * 玩家背包系统 UI
 * 显示玩家拥有的物品、装备和消耗品
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Backpack, Trash2, Gift } from 'lucide-react';
import './inventory-panel.css';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'equipment' | 'consumable' | 'material' | 'quest';
  quantity: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  equipped?: boolean;
  stats?: Record<string, number>;
  sellPrice?: number;
}

export interface InventoryPanelProps {
  items: InventoryItem[];
  maxCapacity: number;
  onUseItem: (itemId: string) => void;
  onEquipItem: (itemId: string) => void;
  onSellItem: (itemId: string, quantity: number) => void;
  onDropItem: (itemId: string, quantity: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#999',
  rare: '#0ff',
  epic: '#f0f',
  legendary: '#ff0',
};

const CATEGORY_LABELS: Record<string, string> = {
  equipment: '装备',
  consumable: '消耗品',
  material: '材料',
  quest: '任务物品',
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  items,
  maxCapacity,
  onUseItem,
  onEquipItem,
  onSellItem,
  onDropItem,
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return selectedCategory === 'all' || item.category === selectedCategory;
    });
  }, [items, selectedCategory]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const capacityPercentage = (totalItems / maxCapacity) * 100;

  const handleUseItem = (item: InventoryItem) => {
    if (item.category === 'consumable') {
      onUseItem(item.id);
      setSelectedItem(null);
    } else if (item.category === 'equipment') {
      onEquipItem(item.id);
    }
  };

  const handleSellItem = (item: InventoryItem) => {
    if (item.sellPrice) {
      onSellItem(item.id, sellQuantity);
      setSellQuantity(1);
      setSelectedItem(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="inventory-container">
      {/* 背景遮罩 */}
      <div className="inventory-overlay" onClick={onClose} />

      {/* 背包面板 */}
      <div className="inventory-panel">
        {/* 头部 */}
        <div className="inventory-header">
          <div className="header-left">
            <Backpack className="inventory-icon" />
            <h2 className="inventory-title">背包</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="inventory-close-btn"
          >
            ✕
          </Button>
        </div>

        {/* 容量显示 */}
        <div className="inventory-capacity">
          <div className="capacity-info">
            <span className="capacity-label">背包容量:</span>
            <span className="capacity-value">
              {totalItems}/{maxCapacity}
            </span>
          </div>
          <div className="capacity-bar">
            <div
              className="capacity-fill"
              style={{
                width: `${capacityPercentage}%`,
                backgroundColor:
                  capacityPercentage > 90
                    ? '#ff6464'
                    : capacityPercentage > 70
                    ? '#ffc800'
                    : '#00ff88',
              }}
            />
          </div>
        </div>

        {/* 分类标签页 */}
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="inventory-tabs"
        >
          <TabsList className="inventory-tabs-list">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="equipment">装备</TabsTrigger>
            <TabsTrigger value="consumable">消耗品</TabsTrigger>
            <TabsTrigger value="material">材料</TabsTrigger>
            <TabsTrigger value="quest">任务物品</TabsTrigger>
          </TabsList>

          {/* 物品列表 */}
          <TabsContent value={selectedCategory} className="inventory-content">
            {filteredItems.length > 0 ? (
              <div className="inventory-items">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`inventory-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* 物品图标 */}
                    <div className="item-icon-wrapper">
                      {item.icon ? (
                        <img src={item.icon} alt={item.name} className="item-icon" />
                      ) : (
                        <div className="item-icon-placeholder">📦</div>
                      )}
                      {item.equipped && <div className="equipped-badge">已装备</div>}
                    </div>

                    {/* 物品信息 */}
                    <div className="item-details">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-quantity">数量: {item.quantity}</p>
                      <div
                        className="item-rarity"
                        style={{ color: RARITY_COLORS[item.rarity] }}
                      >
                        {item.rarity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="inventory-empty">
                <p>此分类无物品</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 物品详情面板 */}
        {selectedItem && (
          <div className="inventory-detail">
            <div className="detail-header">
              <h3>物品详情</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="detail-close"
              >
                ✕
              </Button>
            </div>

            <div className="detail-content">
              {/* 物品图标 */}
              <div className="detail-image">
                {selectedItem.icon ? (
                  <img src={selectedItem.icon} alt={selectedItem.name} />
                ) : (
                  <div className="image-placeholder">📦</div>
                )}
              </div>

              {/* 物品信息 */}
              <h4 className="detail-name">{selectedItem.name}</h4>
              <p className="detail-description">{selectedItem.description}</p>

              {/* 属性 */}
              {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
                <div className="detail-stats">
                  <h5>属性</h5>
                  {Object.entries(selectedItem.stats).map(([key, value]) => (
                    <div key={key} className="stat-row">
                      <span className="stat-name">{key}:</span>
                      <span className="stat-value">+{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 数量 */}
              <div className="detail-quantity">
                <span>拥有数量:</span>
                <span className="quantity-value">{selectedItem.quantity}</span>
              </div>

              {/* 操作按钮 */}
              <div className="detail-actions">
                {selectedItem.category === 'consumable' && (
                  <Button
                    className="action-btn use-btn"
                    onClick={() => handleUseItem(selectedItem)}
                  >
                    使用
                  </Button>
                )}

                {selectedItem.category === 'equipment' && (
                  <Button
                    className="action-btn equip-btn"
                    onClick={() => handleUseItem(selectedItem)}
                  >
                    {selectedItem.equipped ? '卸下' : '装备'}
                  </Button>
                )}

                {selectedItem.sellPrice && (
                  <div className="sell-section">
                    <div className="sell-price">
                      <span>售价:</span>
                      <span className="price-value">{selectedItem.sellPrice} 金币</span>
                    </div>
                    <div className="sell-controls">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                      >
                        −
                      </Button>
                      <span className="sell-quantity">{sellQuantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSellQuantity(Math.min(selectedItem.quantity, sellQuantity + 1))
                        }
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      className="action-btn sell-btn"
                      onClick={() => handleSellItem(selectedItem)}
                    >
                      <Gift className="w-4 h-4" />
                      出售 ({selectedItem.sellPrice * sellQuantity})
                    </Button>
                  </div>
                )}

                <Button
                  className="action-btn drop-btn"
                  onClick={() => {
                    onDropItem(selectedItem.id, 1);
                    setSelectedItem(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  丢弃
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;
