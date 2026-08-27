/**
 * Shoe Cabinet Panel Component
 * Displays and manages shoe and sock items
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

interface ShoeCabinetPanelProps {
  onEquipItem: (category: string, item: Item) => void;
  equippedItems: Record<string, any>;
}

const SHOE_CABINET_CATEGORIES = [
  { id: 'shoes', label: '鞋子', icon: '👠' },
  { id: 'socks', label: '袜子', icon: '🧦' },
];

// Mock shoe cabinet items
const MOCK_SHOE_ITEMS: Record<string, Item[]> = {
  shoes: [
    { id: 1, name: '白色高跟鞋', category: 'shoes', price: 120, rarity: 'common' },
    { id: 2, name: '黑色皮鞋', category: 'shoes', price: 150, rarity: 'uncommon' },
    { id: 3, name: '金色高跟鞋', category: 'shoes', price: 500, rarity: 'legendary' },
    { id: 4, name: '运动鞋', category: 'shoes', price: 80, rarity: 'common' },
  ],
  socks: [
    { id: 5, name: '白色棉袜', category: 'socks', price: 20, rarity: 'common' },
    { id: 6, name: '黑色丝袜', category: 'socks', price: 60, rarity: 'uncommon' },
    { id: 7, name: '彩色条纹袜', category: 'socks', price: 40, rarity: 'common' },
  ],
};

export const ShoeCabinetPanel: React.FC<ShoeCabinetPanelProps> = ({
  onEquipItem,
  equippedItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('shoes');

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
        <TabsList className="grid w-full grid-cols-2 bg-slate-700 border border-slate-600">
          {SHOE_CABINET_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              {cat.icon} {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SHOE_CABINET_CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_SHOE_ITEMS[cat.id]?.map((item) => (
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
