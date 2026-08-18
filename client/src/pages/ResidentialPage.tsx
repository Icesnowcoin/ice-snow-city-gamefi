import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { Home, Building2, Hotel, Plus, Wrench, Users } from "lucide-react";
import { toast } from "sonner";

export default function ResidentialPage() {
  const [selectedPropertyType, setSelectedPropertyType] = useState<"apartment" | "villa" | "hotel" | null>(null);

  // 获取玩家的物业
  const { data: propertiesData, isLoading: propertiesLoading } = trpc.residential.getProperties.useQuery();

  // 获取可用物业
  const { data: availableProperties, isLoading: availableLoading } = trpc.residential.getAvailableProperties.useQuery({
    propertyType: selectedPropertyType || undefined,
  });

  // 购买物业
  const purchaseMutation = trpc.residential.purchaseProperty.useMutation({
    onSuccess: () => {
      toast.success("物业购买成功！");
    },
    onError: (error) => {
      toast.error(`购买失败: ${error.message}`);
    },
  });

  // 升级物业
  const upgradeMutation = trpc.residential.upgradeProperty.useMutation({
    onSuccess: () => {
      toast.success("物业升级成功！");
    },
    onError: (error) => {
      toast.error(`升级失败: ${error.message}`);
    },
  });

  // 执行维护
  const maintenanceMutation = trpc.residential.performMaintenance.useMutation({
    onSuccess: () => {
      toast.success("维护完成！");
    },
    onError: (error) => {
      toast.error(`维护失败: ${error.message}`);
    },
  });

  const handlePurchase = (propertyType: "apartment" | "villa" | "hotel") => {
    purchaseMutation.mutate({
      propertyType,
      locationX: Math.floor(Math.random() * 100),
      locationY: Math.floor(Math.random() * 100),
    });
  };

  const handleUpgrade = (propertyId: string) => {
    upgradeMutation.mutate({ propertyId });
  };

  const handleMaintenance = (propertyId: string) => {
    maintenanceMutation.mutate({ propertyId });
  };

  const propertyTypeConfig = {
    apartment: { icon: Home, label: "公寓", color: "bg-blue-500" },
    villa: { icon: Building2, label: "别墅", color: "bg-green-500" },
    hotel: { icon: Hotel, label: "酒店", color: "bg-purple-500" },
  };

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 标题 */}
      <div>
        <h1 className="text-4xl font-bold">住宅管理系统</h1>
        <p className="text-gray-500 mt-2">购买、出租和管理您的房产</p>
      </div>

      {/* 统计信息 */}
      {propertiesData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总物业数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propertiesData.properties.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总资产价值</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propertiesData.totalValue.toLocaleString()} ISC</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">月收入</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{propertiesData.totalMonthlyIncome.toLocaleString()} ISC
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 选项卡 */}
      <Tabs defaultValue="my-properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-properties">我的物业</TabsTrigger>
          <TabsTrigger value="buy-property">购买物业</TabsTrigger>
        </TabsList>

        {/* 我的物业 */}
        <TabsContent value="my-properties" className="space-y-4">
          {propertiesData?.properties.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">您还没有购买任何物业</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {propertiesData?.properties.map((property) => {
                const config = propertyTypeConfig[property.propertyType];
                const Icon = config.icon;

                return (
                  <Card key={property.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <CardTitle className="text-lg">{config.label}</CardTitle>
                        </div>
                        <Badge variant="outline">等级 {property.level}</Badge>
                      </div>
                      <CardDescription>
                        位置: ({property.locationX}, {property.locationY})
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 状态 */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">状态:</span>
                        <Badge
                          variant={
                            property.status === "active"
                              ? "default"
                              : property.status === "maintenance"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {property.status === "active"
                            ? "活跃"
                            : property.status === "maintenance"
                              ? "维护中"
                              : "已放弃"}
                        </Badge>
                      </div>

                      {/* 入住率 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">入住率:</span>
                          <span>
                            {property.occupancy}/{property.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(property.occupancy / property.capacity) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 状况 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">状况:</span>
                          <span>{property.conditionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              property.conditionPercentage > 70
                                ? "bg-green-500"
                                : property.conditionPercentage > 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${property.conditionPercentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 收入 */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">月收入:</span>
                        <span className="text-green-600 font-semibold">
                          {property.monthlyRevenue.toLocaleString()} ISC
                        </span>
                      </div>

                      {/* 按钮 */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpgrade(property.id)}
                          disabled={upgradeMutation.isPending}
                          className="flex-1"
                        >
                          升级
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMaintenance(property.id)}
                          disabled={maintenanceMutation.isPending}
                          className="flex-1"
                        >
                          <Wrench className="w-4 h-4 mr-1" />
                          维护
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 购买物业 */}
        <TabsContent value="buy-property" className="space-y-4">
          {/* 物业类型筛选 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedPropertyType === null ? "default" : "outline"}
              onClick={() => setSelectedPropertyType(null)}
            >
              全部
            </Button>
            <Button
              variant={selectedPropertyType === "apartment" ? "default" : "outline"}
              onClick={() => setSelectedPropertyType("apartment")}
            >
              公寓
            </Button>
            <Button
              variant={selectedPropertyType === "villa" ? "default" : "outline"}
              onClick={() => setSelectedPropertyType("villa")}
            >
              别墅
            </Button>
            <Button
              variant={selectedPropertyType === "hotel" ? "default" : "outline"}
              onClick={() => setSelectedPropertyType("hotel")}
            >
              酒店
            </Button>
          </div>

          {/* 可用物业列表 */}
          {availableLoading ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : availableProperties?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">暂无可购买的物业</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableProperties?.map((property) => {
                const config = propertyTypeConfig[property.propertyType];
                const Icon = config.icon;

                return (
                  <Card key={property.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <CardTitle className="text-lg">{config.label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">购买价格:</span>
                        <span className="font-semibold">{property.purchasePrice.toLocaleString()} ISC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">容量:</span>
                        <span>{property.capacity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">月收入:</span>
                        <span className="text-green-600">{property.monthlyRevenue.toLocaleString()} ISC</span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(property.propertyType)}
                        disabled={purchaseMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        购买
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
