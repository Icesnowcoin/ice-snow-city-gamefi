import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Sprout,
  Droplet,
  Sun,
  TrendingUp,
  Leaf,
  AlertCircle,
} from "lucide-react";

interface Farm {
  id: string;
  name: string;
  crop: string;
  area: number;
  status: "empty" | "planting" | "growing" | "ready" | "harvested";
  plantedAt: string;
  harvestAt: string;
  growth: number;
  expectedYield: number;
  currentYield: number;
  image: string;
}

const mockFarms: Farm[] = [
  {
    id: "1",
    name: "田地 1",
    crop: "小麦",
    area: 100,
    status: "ready",
    plantedAt: "2026-06-01",
    harvestAt: "2026-06-22",
    growth: 100,
    expectedYield: 500,
    currentYield: 500,
    image: "🌾",
  },
  {
    id: "2",
    name: "田地 2",
    crop: "玉米",
    area: 100,
    status: "growing",
    plantedAt: "2026-06-08",
    harvestAt: "2026-06-29",
    growth: 65,
    expectedYield: 600,
    currentYield: 0,
    image: "🌽",
  },
  {
    id: "3",
    name: "田地 3",
    crop: "蔬菜",
    area: 50,
    status: "growing",
    plantedAt: "2026-06-10",
    harvestAt: "2026-06-25",
    growth: 45,
    expectedYield: 300,
    currentYield: 0,
    image: "🥬",
  },
  {
    id: "4",
    name: "田地 4",
    crop: "水稻",
    area: 150,
    status: "planting",
    plantedAt: "2026-06-20",
    harvestAt: "2026-07-10",
    growth: 10,
    expectedYield: 800,
    currentYield: 0,
    image: "🍚",
  },
  {
    id: "5",
    name: "田地 5",
    crop: "空地",
    area: 100,
    status: "empty",
    plantedAt: "",
    harvestAt: "",
    growth: 0,
    expectedYield: 0,
    currentYield: 0,
    image: "🌍",
  },
];

export default function AgriculturePage() {
  const { lang } = useLanguage();
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredFarms = mockFarms.filter((farm) =>
    filterStatus === "all" ? true : farm.status === filterStatus
  );

  const stats = {
    totalArea: mockFarms.reduce((sum, f) => sum + f.area, 0),
    totalYield: mockFarms.reduce((sum, f) => sum + f.currentYield, 0),
    readyToHarvest: mockFarms.filter((f) => f.status === "ready").length,
    growing: mockFarms.filter((f) => f.status === "growing").length,
  };

  const getStatusLabel = (status: string) => {
    if (status === "empty") return lang === "zh" ? "空地" : "Empty";
    if (status === "planting") return lang === "zh" ? "种植中" : "Planting";
    if (status === "growing") return lang === "zh" ? "生长中" : "Growing";
    if (status === "ready") return lang === "zh" ? "可收获" : "Ready";
    return lang === "zh" ? "已收获" : "Harvested";
  };

  const getStatusColor = (status: string) => {
    if (status === "empty") return "bg-gray-100 text-gray-800";
    if (status === "planting") return "bg-blue-100 text-blue-800";
    if (status === "growing") return "bg-green-100 text-green-800";
    if (status === "ready") return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  const getGrowthColor = (growth: number) => {
    if (growth < 25) return "from-red-400 to-red-600";
    if (growth < 50) return "from-yellow-400 to-yellow-600";
    if (growth < 75) return "from-green-400 to-green-600";
    return "from-green-500 to-green-700";
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalArea}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "总面积" : "Total Area"} m²</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalYield}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "总收获" : "Total Yield"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.readyToHarvest}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "可收获" : "Ready to Harvest"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.growing}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "生长中" : "Growing"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            {["all", "empty", "planting", "growing", "ready", "harvested"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === "all" ? (lang === "zh" ? "全部" : "All") : getStatusLabel(status)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFarms.map((farm) => (
          <Card key={farm.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{farm.name}</h3>
                    <Badge className={getStatusColor(farm.status)}>
                      {getStatusLabel(farm.status)}
                    </Badge>
                  </div>
                  <div className="text-4xl">{farm.image}</div>
                </div>

                {/* Crop Info */}
                {farm.status !== "empty" && (
                  <div>
                    <p className="text-sm font-medium mb-2">{lang === "zh" ? "作物" : "Crop"}: {farm.crop}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-blue-50 px-2 py-1 rounded">{farm.area} m²</span>
                      <span className="bg-green-50 px-2 py-1 rounded">
                        {lang === "zh" ? "预期产量" : "Expected"}: {farm.expectedYield}
                      </span>
                    </div>
                  </div>
                )}

                {/* Growth Progress */}
                {farm.status !== "empty" && farm.status !== "harvested" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium">{lang === "zh" ? "生长进度" : "Growth"}</p>
                      <p className="text-xs font-bold">{farm.growth}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${getGrowthColor(farm.growth)} h-2 rounded-full`}
                        style={{ width: `${farm.growth}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {farm.status !== "empty" && (
                  <div className="space-y-1 text-xs">
                    {farm.plantedAt && (
                      <p className="text-muted-foreground">
                        {lang === "zh" ? "种植日期" : "Planted"}: {farm.plantedAt}
                      </p>
                    )}
                    {farm.harvestAt && (
                      <p className="text-muted-foreground">
                        {lang === "zh" ? "收获日期" : "Harvest"}: {farm.harvestAt}
                      </p>
                    )}
                  </div>
                )}

                {/* Yield Info */}
                {farm.currentYield > 0 && (
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "当前产量" : "Current Yield"}</p>
                    <p className="font-bold text-green-600">{farm.currentYield}</p>
                  </div>
                )}

                {/* Actions */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedFarm(farm)}
                    >
                      {lang === "zh" ? "查看详情" : "View Details"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{selectedFarm?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-center text-6xl">{selectedFarm?.image}</div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{lang === "zh" ? "面积" : "Area"}</p>
                          <p className="font-bold">{selectedFarm?.area} m²</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{lang === "zh" ? "状态" : "Status"}</p>
                          <p className="font-bold">{getStatusLabel(selectedFarm?.status || "empty")}</p>
                        </div>
                        {selectedFarm?.status !== "empty" && (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">{lang === "zh" ? "作物" : "Crop"}</p>
                              <p className="font-bold">{selectedFarm?.crop}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{lang === "zh" ? "生长进度" : "Growth"}</p>
                              <p className="font-bold">{selectedFarm?.growth}%</p>
                            </div>
                          </>
                        )}
                      </div>

                      {selectedFarm?.status === "empty" && (
                        <Button className="w-full">{lang === "zh" ? "种植作物" : "Plant Crop"}</Button>
                      )}
                      {selectedFarm?.status === "ready" && (
                        <Button className="w-full">{lang === "zh" ? "收获作物" : "Harvest Crop"}</Button>
                      )}
                      {selectedFarm?.status === "growing" && (
                        <Button variant="outline" className="w-full" disabled>
                          {lang === "zh" ? "生长中..." : "Growing..."}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredFarms.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Sprout className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {lang === "zh" ? "没有找到匹配的田地" : "No farms found"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {lang === "zh" ? "农业提示" : "Agriculture Tips"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            {lang === "zh"
              ? "• 不同作物有不同的生长周期，选择合适的作物可以提高收益"
              : "• Different crops have different growth cycles, choosing the right crop can increase profits"}
          </p>
          <p>
            {lang === "zh"
              ? "• 定期浇水和施肥可以加快作物生长"
              : "• Regular watering and fertilizing can speed up crop growth"}
          </p>
          <p>
            {lang === "zh"
              ? "• 及时收获可以避免作物腐烂和产量损失"
              : "• Timely harvesting can prevent crop rot and yield loss"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
