import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trees, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoggingPage() {
  const [selectedResource, setSelectedResource] = useState<"wood" | "timber" | "logs">("wood");
  const [facilityLevel, setFacilityLevel] = useState(1);

  const { data: yieldData } = trpc.production.logging.calculateYield.useQuery({
    resourceType: selectedResource,
    facilityLevel,
    efficiency: 1.0,
  });

  const startLoggingMutation = trpc.production.logging.startLogging.useMutation({
    onSuccess: (data) => {
      toast.success(`伐木已启动！预计耗时 ${Math.round(data.duration / 60)} 分钟`);
    },
    onError: (error) => {
      toast.error(`伐木失败: ${error.message}`);
    },
  });

  const handleStartLogging = () => {
    startLoggingMutation.mutate({
      resourceType: selectedResource,
      facilityLevel,
    });
  };

  const resourceInfo = {
    wood: { name: "木材", description: "用于制造建筑材料和家具" },
    timber: { name: "原木", description: "用于制造高级建筑材料" },
    logs: { name: "木料", description: "用于制造精细木制品" },
  };

  const info = resourceInfo[selectedResource];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Trees className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold">伐木场</h1>
        </div>
        <p className="text-muted-foreground">开采木材资源用于建筑和制造</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>选择伐木资源</CardTitle>
              <CardDescription>选择要伐木的资源类型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={selectedResource} onValueChange={(v) => setSelectedResource(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="wood">木材</TabsTrigger>
                  <TabsTrigger value="timber">原木</TabsTrigger>
                  <TabsTrigger value="logs">木料</TabsTrigger>
                </TabsList>

                {(["wood", "timber", "logs"] as const).map((resource) => {
                  const resInfo = resourceInfo[resource];
                  return (
                    <TabsContent key={resource} value={resource} className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{resInfo.name}</h3>
                        <p className="text-sm text-muted-foreground">{resInfo.description}</p>
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

                      {/* Start Logging Button */}
                      <Button
                        onClick={handleStartLogging}
                        disabled={startLoggingMutation.isPending}
                        className="w-full"
                        size="lg"
                      >
                        <Trees className="w-4 h-4 mr-2" />
                        {startLoggingMutation.isPending ? "伐木中..." : "开始伐木"}
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
                  <span>容量: 1200 单位</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-xs text-muted-foreground">升级成本:</p>
                <div className="text-sm space-y-1">
                  <div>木材: {80 * facilityLevel}</div>
                  <div>原木: {100 * facilityLevel}</div>
                  <div>木料: {20 * facilityLevel}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 提示: 更高等级的设施可以提高伐木效率和产量。定期维护设施可以保持最佳性能。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
