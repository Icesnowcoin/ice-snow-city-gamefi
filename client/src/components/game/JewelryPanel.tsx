/**
 * Jewelry Panel Component
 * Displays and manages jewelry items (rings, bracelets, earrings, glasses, bags)
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

interface JewelryPanelProps {
  onEquipItem: (category: string, item: Item) => void;
  equippedItems: Record<string, any>;
}

const JEWELRY_CATEGORIES = [
  { id: 'ring', label: '戒指', icon: '💍' },
  { id: 'bracelet', label: '手镯', icon: '⌚' },
  { id: 'earring', label: '耳环', icon: '👂' },
  { id: 'glasses', label: '眼镜', icon: '👓' },
  { id: 'bag', label: '包包', icon: '👜' },
];

// Mock jewelry items
const MOCK_JEWELRY_ITEMS: Record<string, Item[]> = {
  ring: [
    { id: 1, name: '银戒指', category: 'ring', price: 100, rarity: 'common' },
    { id: 2, name: '钻石戒指', category: 'ring', price: 500, rarity: 'rare' },
    { id: 3, name: '皇家宝石戒', category: 'ring', price: 1000, rarity: 'legendary' },
  ],
  bracelet: [
    { id: 4, name: '珍珠手镯', category: 'bracelet', price: 150, rarity: 'uncommon' },
    { id: 5, name: '金手镯', category: 'bracelet', price: 300, rarity: 'rare' },
    { id: 6, name: '钻石手镯', category: 'bracelet', price: 800, rarity: 'epic' },
  ],
  earring: [
    { id: 7, name: '珍珠耳环', category: 'earring', price: 120, rarity: 'uncommon' },
    { id: 8, name: '钻石耳环', category: 'earring', price: 400, rarity: 'rare' },
    { id: 9, name: '蓝宝石耳环', category: 'earring', price: 600, rarity: 'epic' },
  ],
  glasses: [
    { id: 10, name: '黑框眼镜', category: 'glasses', price: 80, rarity: 'common' },
    { id: 11, name: '太阳镜', category: 'glasses', price: 150, rarity: 'uncommon' },
    { id: 12, name: '金框眼镜', category: 'glasses', price: 300, rarity: 'rare' },
  ],
  bag: [
    { id: 13, name: '棕色皮包', category: 'bag', price: 200, rarity: 'common' },
    { id: 14, name: '黑色手提包', category: 'bag', price: 350, rarity: 'uncommon' },
    { id: 15, name: '金色晚宴包', category: 'bag', price: 700, rarity: 'rare' },
  ],
};

export const JewelryPanel: React.FC<JewelryPanelProps> = ({
  onEquipItem,
  equippedItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ring');

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
        <TabsList className="grid w-full grid-cols-5 bg-slate-700 border border-slate-600">
          {JEWELRY_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              {cat.icon}
            </TabsTrigger>
          ))}
        </TabsList>

        {JEWELRY_CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_JEWELRY_ITEMS[cat.id]?.map((item) => (
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
