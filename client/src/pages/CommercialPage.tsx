import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, TrendingUp, Users, Home } from "lucide-react";
import { toast } from "sonner";

export default function CommercialPage() {
  const [selectedCategory, setSelectedCategory] = useState<"production" | "service" | "rental">(
    "service"
  );
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [facilityLevel, setFacilityLevel] = useState(1);
  const [occupancyRate, setOccupancyRate] = useState(1.0);

  // Fetch facilities by category
  const { data: facilities = [] } = trpc.commercial.getFacilitiesByCategory.useQuery(
    selectedCategory
  );

  // Calculate revenue
  const { data: financials } = trpc.commercial.calculateRevenue.useQuery(
    {
      type: (selectedFacility || "fast_food") as any,
      level: facilityLevel,
      efficiency: 1.0,
      occupancyRate,
    },
    { enabled: !!selectedFacility }
  );

  // Start operation mutation
  const startOperationMutation = trpc.commercial.startOperation.useMutation({
    onSuccess: (data) => {
      toast.success(`设施已启动运营！预计耗时 ${Math.round(data.duration / 60)} 分钟`);
    },
    onError: (error) => {
      toast.error(`启动失败: ${error.message}`);
    },
  });

  const handleStartOperation = () => {
    if (!selectedFacility) {
      toast.error("请先选择设施");
      return;
    }

    startOperationMutation.mutate({
      facilityId: `facility_${selectedFacility}`,
      type: selectedFacility as any,
      level: facilityLevel,
      efficiency: 1.0,
      occupancyRate,
    });
  };

  const categoryIcons = {
    production: <Building2 className="w-5 h-5" />,
    service: <Users className="w-5 h-5" />,
    rental: <Home className="w-5 h-5" />,
  };

  const categoryNames = {
    production: "制造业",
    service: "服务业",
    rental: "房产业",
  };

  const selectedFacilityData = facilities.find((f) => f.type === selectedFacility);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">商业设施</h1>
        </div>
        <p className="text-muted-foreground">管理和运营各类商业设施</p>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="production">制造业</TabsTrigger>
          <TabsTrigger value="service">服务业</TabsTrigger>
          <TabsTrigger value="rental">房产业</TabsTrigger>
        </TabsList>

        {(["production", "service", "rental"] as const).map((category) => (
          <TabsContent key={category} value={category} className="space-y-6">
            {/* Facility Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {facilities.map((facility) => (
                <Card
                  key={facility.type}
                  className={`cursor-pointer transition-all ${
                    selectedFacility === facility.type
                      ? "ring-2 ring-primary"
                      : "hover:shadow-lg"
                  }`}
                  onClick={() => setSelectedFacility(facility.type)}
                >
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl">{facility.config.icon}</div>
                      <h3 className="font-semibold text-sm">{facility.config.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {facility.config.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Facility Details */}
            {selectedFacilityData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Control Panel */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedFacilityData.config.name}</CardTitle>
                      <CardDescription>{selectedFacilityData.config.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Facility Level */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">设施等级: {facilityLevel}</label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={facilityLevel}
                          onChange={(e) => setFacilityLevel(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Occupancy Rate */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          入住率: {Math.round(occupancyRate * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          value={occupancyRate * 100}
                          onChange={(e) => setOccupancyRate(parseInt(e.target.value) / 100)}
                          className="w-full"
                        />
                      </div>

                      {/* Financial Summary */}
                      {financials && (
                        <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">收入:</span>
                            <span className="font-bold text-green-600">
                              {financials.revenue} ISC
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">支出:</span>
                            <span className="font-bold text-red-600">
                              {financials.expense} ISC
                            </span>
                          </div>
                          <div className="border-t pt-2 flex justify-between">
                            <span className="text-sm font-medium">利润:</span>
                            <span
                              className={`font-bold ${
                                financials.profit >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {financials.profit} ISC
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Start Operation Button */}
                      <Button
                        onClick={handleStartOperation}
                        disabled={startOperationMutation.isPending}
                        className="w-full"
                        size="lg"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {startOperationMutation.isPending ? "运营中..." : "启动运营"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Facility Info */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">设施信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">容量</p>
                        <p className="text-lg font-bold">{selectedFacilityData.config.capacity}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">基础收入</p>
                        <p className="text-lg font-bold">
                          {selectedFacilityData.config.baseRevenue} ISC
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">基础支出</p>
                        <p className="text-lg font-bold">
                          {selectedFacilityData.config.baseExpense} ISC
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">运营时间</p>
                        <p className="text-lg font-bold">
                          {Math.round(selectedFacilityData.config.operationTime / 3600)} 小时
                        </p>
                      </div>

                      <div className="pt-4 border-t space-y-2">
                        <p className="text-xs text-muted-foreground">升级成本</p>
                        <p className="text-sm font-medium">
                          {1000 * facilityLevel} ISC
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 提示: 更高等级的设施可以提高收入。定期维护设施可以保持最佳效率。选择合适的入住率可以优化利润。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
