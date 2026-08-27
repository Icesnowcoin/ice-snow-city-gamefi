/**
 * Wardrobe Panel Component
 * Displays and manages wardrobe items (hats, scarves, shirts, pants, skirts, hairstyles)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Item {
  id: number;
  name: string;
  category: string;
  price: number;
  rarity: string;
  imageUrl?: string;
}

interface WardrobePanelProps {
  onEquipItem: (category: string, item: Item) => void;
  equippedItems: Record<string, any>;
}

const WARDROBE_CATEGORIES = [
  { id: 'hat', label: '帽子', icon: '🎩' },
  { id: 'scarf', label: '围巾', icon: '🧣' },
  { id: 'shirt', label: '衣服', icon: '👕' },
  { id: 'pants', label: '裤子', icon: '👖' },
  { id: 'skirt', label: '裙子', icon: '👗' },
  { id: 'hairstyle', label: '发型', icon: '💇' },
];

// Mock wardrobe items
const MOCK_WARDROBE_ITEMS: Record<string, Item[]> = {
  hat: [
    { id: 1, name: '冬季帽', category: 'hat', price: 50, rarity: 'common' },
    { id: 2, name: '皮帽', category: 'hat', price: 150, rarity: 'rare' },
    { id: 3, name: '王冠', category: 'hat', price: 500, rarity: 'legendary' },
  ],
  scarf: [
    { id: 4, name: '羊毛围巾', category: 'scarf', price: 40, rarity: 'common' },
    { id: 5, name: '丝绸围巾', category: 'scarf', price: 200, rarity: 'epic' },
  ],
  shirt: [
    { id: 6, name: '蓝色连衣裙', category: 'shirt', price: 100, rarity: 'common' },
    { id: 7, name: '白色衬衫', category: 'shirt', price: 120, rarity: 'uncommon' },
    { id: 8, name: '金色礼服', category: 'shirt', price: 800, rarity: 'legendary' },
  ],
  pants: [
    { id: 9, name: '黑色牛仔裤', category: 'pants', price: 80, rarity: 'common' },
    { id: 10, name: '运动裤', category: 'pants', price: 100, rarity: 'uncommon' },
  ],
  skirt: [
    { id: 11, name: '蓝色短裙', category: 'skirt', price: 90, rarity: 'common' },
    { id: 12, name: '蕾丝长裙', category: 'skirt', price: 300, rarity: 'rare' },
  ],
  hairstyle: [
    { id: 13, name: '长直发', category: 'hairstyle', price: 0, rarity: 'common' },
    { id: 14, name: '卷发', category: 'hairstyle', price: 100, rarity: 'uncommon' },
    { id: 15, name: '双马尾', category: 'hairstyle', price: 150, rarity: 'rare' },
  ],
};

export const WardrobePanel: React.FC<WardrobePanelProps> = ({
  onEquipItem,
  equippedItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('hat');

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-gray-500',
      uncommon: 'bg-green-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500',
    };
    return colors[rarity] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6 bg-slate-700 border border-slate-600">
          {WARDROBE_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              {cat.icon}
            </TabsTrigger>
          ))}
        </TabsList>

        {WARDROBE_CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_WARDROBE_ITEMS[cat.id]?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition cursor-pointer"
                      onClick={() => onEquipItem(cat.id, item)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">{item.name}</h4>
                        {equippedItems[cat.id]?.id === item.id && (
                          <Badge className="bg-cyan-500 text-white text-xs">已装备</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-xs">¥{item.price}</span>
                        <Badge className={`${getRarityColor(item.rarity)} text-white text-xs`}>
                          {item.rarity}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 bg-cyan-600/20 border-cyan-600/50 text-cyan-300 hover:bg-cyan-600/30 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEquipItem(cat.id, item);
                        }}
                      >
                        装备
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
