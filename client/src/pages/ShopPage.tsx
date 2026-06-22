import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  ShoppingCart,
  Star,
  TrendingUp,
  Package,
  Filter,
} from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
}

const mockItems: ShopItem[] = [
  {
    id: "1",
    name: "优质布料",
    category: "材料",
    price: 50,
    stock: 100,
    rating: 4.5,
    reviews: 234,
    image: "🧵",
    description: "高质量的布料，适合制作衣服和家纺",
  },
  {
    id: "2",
    name: "香料套装",
    category: "食品",
    price: 120,
    stock: 45,
    rating: 4.8,
    reviews: 567,
    image: "🌶️",
    description: "精选香料组合，增强食物风味",
  },
  {
    id: "3",
    name: "工具包",
    category: "工具",
    price: 200,
    stock: 30,
    rating: 4.6,
    reviews: 189,
    image: "🔧",
    description: "专业工具套装，适合各种工作",
  },
  {
    id: "4",
    name: "种子套装",
    category: "农业",
    price: 80,
    stock: 200,
    rating: 4.7,
    reviews: 345,
    image: "🌱",
    description: "优质农作物种子，高产量",
  },
  {
    id: "5",
    name: "木材",
    category: "材料",
    price: 60,
    stock: 150,
    rating: 4.4,
    reviews: 123,
    image: "🪵",
    description: "优质木材，适合制作家具",
  },
  {
    id: "6",
    name: "草药包",
    category: "医疗",
    price: 150,
    stock: 50,
    rating: 4.9,
    reviews: 456,
    image: "🌿",
    description: "精选草药，具有治疗效果",
  },
  {
    id: "7",
    name: "颜料盒",
    category: "艺术",
    price: 180,
    stock: 25,
    rating: 4.7,
    reviews: 234,
    image: "🎨",
    description: "专业艺术颜料，色彩鲜艳",
  },
  {
    id: "8",
    name: "金属锭",
    category: "材料",
    price: 250,
    stock: 40,
    rating: 4.8,
    reviews: 345,
    image: "⚙️",
    description: "高纯度金属锭，用于制造",
  },
];

export default function ShopPage() {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const categories = ["all", ...Array.from(new Set(mockItems.map((item) => item.category)))];

  const filteredItems = mockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = () => {
    console.log(`Added ${quantity} x ${selectedItem?.name} to cart`);
    setQuantity(1);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={lang === "zh" ? "搜索商品..." : "Search items..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? (lang === "zh" ? "全部" : "All") : category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <CardContent className="pt-6 flex-1 flex flex-col">
              <div className="space-y-3 flex-1">
                {/* Image */}
                <div className="text-5xl text-center">{item.image}</div>

                {/* Name and Category */}
                <div>
                  <h3 className="font-bold text-sm">{item.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(item.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.rating} ({item.reviews})
                  </span>
                </div>

                {/* Stock */}
                <div className="flex items-center gap-2 text-xs">
                  <Package className="w-3 h-3" />
                  <span>
                    {lang === "zh" ? "库存" : "Stock"}: {item.stock}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-orange-600">{item.price}</span>
                  <span className="text-sm text-muted-foreground">ISC</span>
                </div>
              </div>

              {/* Action Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="w-full mt-4 gap-2"
                    onClick={() => setSelectedItem(item)}
                    disabled={item.stock === 0}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {lang === "zh" ? "购买" : "Buy"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedItem?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-center text-6xl">{selectedItem?.image}</div>

                    <div>
                      <p className="text-sm font-medium mb-2">{lang === "zh" ? "商品描述" : "Description"}</p>
                      <p className="text-sm text-muted-foreground">{selectedItem?.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{lang === "zh" ? "价格" : "Price"}</p>
                        <p className="text-xl font-bold text-orange-600">{selectedItem?.price} ISC</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{lang === "zh" ? "库存" : "Stock"}</p>
                        <p className="text-xl font-bold">{selectedItem?.stock}</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="quantity">{lang === "zh" ? "购买数量" : "Quantity"}</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          -
                        </Button>
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="text-center"
                          min="1"
                          max={selectedItem?.stock || 1}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setQuantity(Math.min(selectedItem?.stock || 1, quantity + 1))
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm">
                        {lang === "zh" ? "总价" : "Total"}:{" "}
                        <span className="font-bold text-orange-600">
                          {(selectedItem?.price || 0) * quantity} ISC
                        </span>
                      </p>
                    </div>

                    <Button className="w-full" onClick={handleAddToCart}>
                      {lang === "zh" ? "加入购物车" : "Add to Cart"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {lang === "zh" ? "没有找到匹配的商品" : "No items found"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{lang === "zh" ? "商城统计" : "Shop Statistics"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{mockItems.length}</p>
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "总商品数" : "Total Items"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {mockItems.reduce((sum, item) => sum + item.stock, 0)}
              </p>
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "总库存" : "Total Stock"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {new Set(mockItems.map((item) => item.category)).size}
              </p>
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "商品分类" : "Categories"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {(mockItems.reduce((sum, item) => sum + item.rating, 0) / mockItems.length).toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "平均评分" : "Avg Rating"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
