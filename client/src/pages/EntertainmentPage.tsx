import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles, Music, Users, Plus, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";

export default function EntertainmentPage() {
  const [selectedFacilityType, setSelectedFacilityType] = useState<
    "park" | "entertainment_center" | "nightclub" | "bar" | null
  >(null);

  // 获取玩家的设施
  const { data: facilitiesData, isLoading: facilitiesLoading } =
    trpc.entertainment.getFacilities.useQuery();

  // 获取可用设施
  const { data: availableFacilities, isLoading: availableLoading } =
    trpc.entertainment.getAvailableFacilities.useQuery({
      facilityType: selectedFacilityType || undefined,
    });

  // 建造设施
  const buildMutation = trpc.entertainment.buildFacility.useMutation({
    onSuccess: () => {
      toast.success("设施建造成功！");
    },
    onError: (error) => {
      toast.error(`建造失败: ${error.message}`);
    },
  });

  // 升级设施
  const upgradeMutation = trpc.entertainment.upgradeFacility.useMutation({
    onSuccess: () => {
      toast.success("设施升级成功！");
    },
    onError: (error) => {
      toast.error(`升级失败: ${error.message}`);
    },
  });

  // 举办活动
  const hostEventMutation = trpc.entertainment.hostEvent.useMutation({
    onSuccess: () => {
      toast.success("活动已启动！");
    },
    onError: (error) => {
      toast.error(`活动启动失败: ${error.message}`);
    },
  });

  const handleBuild = (
    facilityType: "park" | "entertainment_center" | "nightclub" | "bar"
  ) => {
    buildMutation.mutate({
      facilityType,
      locationX: Math.floor(Math.random() * 100),
      locationY: Math.floor(Math.random() * 100),
    });
  };

  const handleUpgrade = (facilityId: string) => {
    upgradeMutation.mutate({ facilityId });
  };

  const handleHostEvent = (facilityId: string) => {
    hostEventMutation.mutate({
      facilityId,
      eventType: "party",
      eventName: "特别活动",
      durationHours: 4,
    });
  };

  const facilityTypeConfig = {
    park: { icon: Sparkles, label: "公园", color: "bg-green-500" },
    entertainment_center: { icon: Music, label: "娱乐中心", color: "bg-purple-500" },
    nightclub: { icon: Zap, label: "夜店", color: "bg-pink-500" },
    bar: { icon: Users, label: "酒吧", color: "bg-orange-500" },
  };

  if (facilitiesLoading) {
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
        <h1 className="text-4xl font-bold">娱乐设施管理</h1>
        <p className="text-gray-500 mt-2">建造和管理各种娱乐设施</p>
      </div>

      {/* 统计信息 */}
      {facilitiesData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">设施总数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facilitiesData.facilities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总资产价值</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facilitiesData.totalValue.toLocaleString()} ISC</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">日收入</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{facilitiesData.totalDailyRevenue.toLocaleString()} ISC
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 选项卡 */}
      <Tabs defaultValue="my-facilities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-facilities">我的设施</TabsTrigger>
          <TabsTrigger value="build-facility">建造设施</TabsTrigger>
        </TabsList>

        {/* 我的设施 */}
        <TabsContent value="my-facilities" className="space-y-4">
          {facilitiesData?.facilities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">您还没有建造任何设施</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilitiesData?.facilities.map((facility) => {
                const config = facilityTypeConfig[facility.facilityType];
                const Icon = config.icon;

                return (
                  <Card key={facility.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <CardTitle className="text-lg">{config.label}</CardTitle>
                        </div>
                        <Badge variant="outline">等级 {facility.level}</Badge>
                      </div>
                      <CardDescription>
                        位置: ({facility.locationX}, {facility.locationY})
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 状态 */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">状态:</span>
                        <Badge
                          variant={
                            facility.status === "open"
                              ? "default"
                              : facility.status === "maintenance"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {facility.status === "open"
                            ? "营业中"
                            : facility.status === "maintenance"
                              ? "维护中"
                              : "已关闭"}
                        </Badge>
                      </div>

                      {/* 访客数 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">访客数:</span>
                          <span>
                            {facility.currentVisitors}/{facility.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(facility.currentVisitors / facility.capacity) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 氛围 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">氛围:</span>
                          <span>{facility.atmosphere}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${facility.atmosphere}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 声誉 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">声誉:</span>
                          <span>{facility.reputation}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${facility.reputation}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* 日收入 */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">日收入:</span>
                        <span className="text-green-600 font-semibold">
                          {facility.dailyRevenue.toLocaleString()} ISC
                        </span>
                      </div>

                      {/* 按钮 */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpgrade(facility.id)}
                          disabled={upgradeMutation.isPending}
                          className="flex-1"
                        >
                          升级
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleHostEvent(facility.id)}
                          disabled={hostEventMutation.isPending}
                          className="flex-1"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          活动
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 建造设施 */}
        <TabsContent value="build-facility" className="space-y-4">
          {/* 设施类型筛选 */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={selectedFacilityType === null ? "default" : "outline"}
              onClick={() => setSelectedFacilityType(null)}
            >
              全部
            </Button>
            <Button
              variant={selectedFacilityType === "park" ? "default" : "outline"}
              onClick={() => setSelectedFacilityType("park")}
            >
              公园
            </Button>
            <Button
              variant={selectedFacilityType === "entertainment_center" ? "default" : "outline"}
              onClick={() => setSelectedFacilityType("entertainment_center")}
            >
              娱乐中心
            </Button>
            <Button
              variant={selectedFacilityType === "nightclub" ? "default" : "outline"}
              onClick={() => setSelectedFacilityType("nightclub")}
            >
              夜店
            </Button>
            <Button
              variant={selectedFacilityType === "bar" ? "default" : "outline"}
              onClick={() => setSelectedFacilityType("bar")}
            >
              酒吧
            </Button>
          </div>

          {/* 可用设施列表 */}
          {availableLoading ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : availableFacilities?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">暂无可建造的设施</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableFacilities?.map((facility) => {
                const config = facilityTypeConfig[facility.facilityType];
                const Icon = config.icon;

                return (
                  <Card key={facility.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <CardTitle className="text-lg">{config.label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">建造价格:</span>
                        <span className="font-semibold">{facility.purchasePrice.toLocaleString()} ISC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">容量:</span>
                        <span>{facility.capacity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">日收入:</span>
                        <span className="text-green-600">{facility.dailyRevenue.toLocaleString()} ISC</span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleBuild(facility.facilityType)}
                        disabled={buildMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        建造
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
