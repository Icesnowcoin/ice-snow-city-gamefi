/**
 * 游戏内商城系统 UI
 * 支持商品分类、筛选、购买等功能
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, Star, Zap } from 'lucide-react';
import './shop-panel.css';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'coin' | 'isc' | 'exp';
  category: 'prop' | 'equipment' | 'consumable' | 'building';
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  inStock: boolean;
  quantity?: number;
  discount?: number;
  tags?: string[];
}

export interface ShopPanelProps {
  items: ShopItem[];
  playerBalance: {
    coin: number;
    isc: number;
    exp: number;
  };
  onPurchase: (itemId: string, quantity: number) => void;
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
  prop: '道具',
  equipment: '装备',
  consumable: '消耗品',
  building: '建筑',
};

const CURRENCY_LABELS: Record<string, string> = {
  coin: '金币',
  isc: 'ISC',
  exp: '经验',
};

export const ShopPanel: React.FC<ShopPanelProps> = ({
  items,
  playerBalance,
  onPurchase,
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const canAfford = (item: ShopItem): boolean => {
    const balance = playerBalance[item.currency];
    return balance >= item.price * purchaseQuantity;
  };

  const handlePurchase = (item: ShopItem) => {
    if (canAfford(item)) {
      onPurchase(item.id, purchaseQuantity);
      setPurchaseQuantity(1);
      setSelectedItem(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="shop-panel-container">
      {/* 背景遮罩 */}
      <div className="shop-overlay" onClick={onClose} />

      {/* 商城面板 */}
      <div className="shop-panel-main">
        {/* 头部 */}
        <div className="shop-header">
          <div className="shop-header-left">
            <ShoppingCart className="shop-icon" />
            <h2 className="shop-title">游戏商城</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="shop-close-btn"
          >
            ✕
          </Button>
        </div>

        {/* 玩家余额显示 */}
        <div className="shop-balance">
          <div className="balance-item">
            <span className="balance-label">金币:</span>
            <span className="balance-value">{playerBalance.coin.toLocaleString()}</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">ISC:</span>
            <span className="balance-value">{playerBalance.isc.toLocaleString()}</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">经验:</span>
            <span className="balance-value">{playerBalance.exp.toLocaleString()}</span>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="shop-search">
          <Search className="search-icon" />
          <Input
            placeholder="搜索商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shop-search-input"
          />
        </div>

        {/* 分类标签页 */}
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="shop-tabs"
        >
          <TabsList className="shop-tabs-list">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="prop">道具</TabsTrigger>
            <TabsTrigger value="equipment">装备</TabsTrigger>
            <TabsTrigger value="consumable">消耗品</TabsTrigger>
            <TabsTrigger value="building">建筑</TabsTrigger>
          </TabsList>

          {/* 商品列表 */}
          <TabsContent value={selectedCategory} className="shop-content">
            {filteredItems.length > 0 ? (
              <div className="shop-items-grid">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`shop-item-card ${!item.inStock ? 'out-of-stock' : ''} ${
                      selectedItem?.id === item.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* 物品图标 */}
                    <div className="item-icon-container">
                      {item.icon ? (
                        <img src={item.icon} alt={item.name} className="item-icon" />
                      ) : (
                        <div className="item-icon-placeholder">📦</div>
                      )}
                      {item.discount && (
                        <div className="item-discount">-{item.discount}%</div>
                      )}
                    </div>

                    {/* 物品信息 */}
                    <div className="item-info">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-description">{item.description}</p>

                      {/* 稀有度 */}
                      <div className="item-rarity" style={{ color: RARITY_COLORS[item.rarity] }}>
                        <Star className="w-3 h-3" />
                        {item.rarity}
                      </div>

                      {/* 价格 */}
                      <div className="item-price">
                        <span className="price-value">{item.price}</span>
                        <span className="price-currency">{CURRENCY_LABELS[item.currency]}</span>
                      </div>

                      {/* 库存状态 */}
                      {!item.inStock && <div className="out-of-stock-label">缺货</div>}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="shop-empty">
                <p>暂无商品</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 详情和购买面板 */}
        {selectedItem && (
          <div className="shop-detail-panel">
            <div className="detail-header">
              <h3>商品详情</h3>
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
              {/* 大图 */}
              <div className="detail-image">
                {selectedItem.icon ? (
                  <img src={selectedItem.icon} alt={selectedItem.name} />
                ) : (
                  <div className="image-placeholder">📦</div>
                )}
              </div>

              {/* 详细信息 */}
              <div className="detail-info">
                <h4 className="detail-name">{selectedItem.name}</h4>
                <p className="detail-description">{selectedItem.description}</p>

                {/* 属性标签 */}
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div className="detail-tags">
                    {selectedItem.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 价格信息 */}
                <div className="detail-price">
                  <div className="price-row">
                    <span>价格:</span>
                    <span className="price-highlight">
                      {selectedItem.price} {CURRENCY_LABELS[selectedItem.currency]}
                    </span>
                  </div>
                  {selectedItem.discount && (
                    <div className="price-row discount">
                      <span>优惠:</span>
                      <span>-{selectedItem.discount}%</span>
                    </div>
                  )}
                </div>

                {/* 数量选择 */}
                <div className="quantity-selector">
                  <label>购买数量:</label>
                  <div className="quantity-controls">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                    >
                      −
                    </Button>
                    <span className="quantity-value">{purchaseQuantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* 总价 */}
                <div className="total-price">
                  <span>总计:</span>
                  <span className="total-value">
                    {selectedItem.price * purchaseQuantity} {CURRENCY_LABELS[selectedItem.currency]}
                  </span>
                </div>

                {/* 购买按钮 */}
                <Button
                  className="purchase-btn"
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={!selectedItem.inStock || !canAfford(selectedItem)}
                >
                  {!selectedItem.inStock
                    ? '缺货'
                    : !canAfford(selectedItem)
                    ? '余额不足'
                    : '立即购买'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPanel;
