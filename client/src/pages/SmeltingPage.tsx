import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SmeltingPage() {
  const [inputType, setInputType] = useState<"ore" | "iron" | "copper">("ore");
  const [outputType, setOutputType] = useState<"iron" | "copper" | "gold" | "steel" | "bronze">("iron");
  const [inputQuantity, setInputQuantity] = useState(10);
  const [furnaceLevel, setFurnaceLevel] = useState(1);

  const { data: outputData } = trpc.production.smelting.calculateOutput.useQuery({
    inputType,
    outputType,
    inputQuantity,
    furnaceLevel,
    efficiency: 1.0,
  });

  const startSmeltingMutation = trpc.production.smelting.startSmelting.useMutation({
    onSuccess: (data) => {
      toast.success(`冶炼已启动！预计耗时 ${Math.round(data.duration / 60)} 分钟`);
    },
    onError: (error) => {
      toast.error(`冶炼失败: ${error.message}`);
    },
  });

  const handleStartSmelting = () => {
    startSmeltingMutation.mutate({
      inputType,
      outputType,
      inputQuantity,
      furnaceLevel,
    });
  };

  const materials = {
    input: { ore: "矿石", iron: "铁", copper: "铜" },
    output: { iron: "铁", copper: "铜", gold: "金", steel: "钢", bronze: "青铜" },
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">冶炼厂</h1>
        </div>
        <p className="text-muted-foreground">冶炼矿石和金属制造高级材料</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smelting Control */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>冶炼操作</CardTitle>
              <CardDescription>选择输入和输出材料进行冶炼</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">输入材料</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ore", "iron", "copper"] as const).map((type) => (
                    <Button
                      key={type}
                      variant={inputType === type ? "default" : "outline"}
                      onClick={() => setInputType(type)}
                      className="w-full"
                    >
                      {materials.input[type]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium">输入数量: {inputQuantity}</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Output Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">输出材料</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["iron", "copper", "gold", "steel", "bronze"] as const).map((type) => (
                    <Button
                      key={type}
                      variant={outputType === type ? "default" : "outline"}
                      onClick={() => setOutputType(type)}
                      className="w-full text-xs"
                    >
                      {materials.output[type]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Furnace Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">熔炉等级: {furnaceLevel}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={furnaceLevel}
                  onChange={(e) => setFurnaceLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Output Display */}
              <div className="bg-accent/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">预计产出:</span>
                  <span className="text-lg font-bold text-accent-foreground">
                    {outputData?.output || 0} {materials.output[outputType]}
                  </span>
                </div>
              </div>

              {/* Start Smelting Button */}
              <Button
                onClick={handleStartSmelting}
                disabled={startSmeltingMutation.isPending}
                className="w-full"
                size="lg"
              >
                <Flame className="w-4 h-4 mr-2" />
                {startSmeltingMutation.isPending ? "冶炼中..." : "开始冶炼"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Furnace Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">熔炉状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">熔炉等级</span>
                  <Badge variant="outline">{furnaceLevel}</Badge>
                </div>
                <Progress value={(furnaceLevel / 10) * 100} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span>温度: {1000 + furnaceLevel * 100}°C</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>效率: 100%</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-xs text-muted-foreground">升级成本:</p>
                <div className="text-sm space-y-1">
                  <div>铁: {50 * furnaceLevel}</div>
                  <div>铜: {30 * furnaceLevel}</div>
                  <div>金: {10 * furnaceLevel}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 提示: 更高等级的熔炉可以提高冶炼效率和产出。定期维护熔炉可以保持最佳性能。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
