import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pickaxe, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function MiningPage() {
  const [selectedResource, setSelectedResource] = useState<"sand" | "stone" | "ore">("sand");
  const [facilityLevel, setFacilityLevel] = useState(1);

  // Calculate yield for selected resource
  const { data: yieldData } = trpc.production.mining.calculateYield.useQuery({
    resourceType: selectedResource,
    facilityLevel,
    efficiency: 1.0,
  });

  // Start mining mutation
  const startMiningMutation = trpc.production.mining.startMining.useMutation({
    onSuccess: (data) => {
      toast.success(`采矿已启动！预计耗时 ${Math.round(data.duration / 60)} 分钟`);
    },
    onError: (error) => {
      toast.error(`采矿失败: ${error.message}`);
    },
  });

  const handleStartMining = () => {
    startMiningMutation.mutate({
      resourceType: selectedResource,
      facilityLevel,
    });
  };

  const resourceInfo = {
    sand: {
      name: "砂石",
      description: "用于制造建筑材料",
      color: "bg-yellow-500",
    },
    stone: {
      name: "石头",
      description: "用于制造建筑材料和工具",
      color: "bg-gray-500",
    },
    ore: {
      name: "矿石",
      description: "用于冶炼金属",
      color: "bg-orange-500",
    },
  };

  const info = resourceInfo[selectedResource];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Pickaxe className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold">采矿场</h1>
        </div>
        <p className="text-muted-foreground">开采矿产资源用于建筑和冶炼</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>选择采矿资源</CardTitle>
              <CardDescription>选择要采矿的资源类型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={selectedResource} onValueChange={(v) => setSelectedResource(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sand">砂石</TabsTrigger>
                  <TabsTrigger value="stone">石头</TabsTrigger>
                  <TabsTrigger value="ore">矿石</TabsTrigger>
                </TabsList>

                {(["sand", "stone", "ore"] as const).map((resource) => {
                  const resInfo = resourceInfo[resource];
                  return (
                  <TabsContent key={resource} value={resource} className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{resInfo.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resInfo.description}
                      </p>
                    </div>

                    {/* Facility Level Control */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">设施等级: {facilityLevel}</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={facilityLevel}
                        onChange={(e) => setFacilityLevel(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span>10</span>
                      </div>
                    </div>

                    {/* Yield Display */}
                    <div className="bg-accent/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">预计产量:</span>
                        <span className="text-lg font-bold text-accent-foreground">
                          {yieldData?.yield || 0} 单位
                        </span>
                      </div>
                    </div>

                    {/* Start Mining Button */}
                    <Button
                      onClick={handleStartMining}
                      disabled={startMiningMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      <Pickaxe className="w-4 h-4 mr-2" />
                      {startMiningMutation.isPending ? "采矿中..." : "开始采矿"}
                    </Button>
                  </TabsContent>
                );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Facility Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">设施状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">设施等级</span>
                  <Badge variant="outline">{facilityLevel}</Badge>
                </div>
                <Progress value={(facilityLevel / 10) * 100} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>效率: 100%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span>容量: 1000 单位</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-xs text-muted-foreground">升级成本:</p>
                <div className="text-sm space-y-1">
                  <div>砂石: {100 * facilityLevel}</div>
                  <div>石头: {80 * facilityLevel}</div>
                  <div>矿石: {20 * facilityLevel}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 提示: 更高等级的设施可以提高采矿效率和产量。定期维护设施可以保持最佳性能。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
