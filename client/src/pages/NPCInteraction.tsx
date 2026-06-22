import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Search,
  Heart,
  MessageCircle,
  ShoppingCart,
  Briefcase,
  Users,
  MapPin,
} from "lucide-react";

interface NPC {
  id: string;
  name: string;
  profession: string;
  location: string;
  relationship: number;
  avatar: string;
  status: "available" | "busy" | "offline";
  dailyTasks: number;
  tradingGoods: string[];
}

const mockNPCs: NPC[] = [
  {
    id: "1",
    name: "李商人",
    profession: "商人",
    location: "商业广场",
    relationship: 75,
    avatar: "👨‍💼",
    status: "available",
    dailyTasks: 3,
    tradingGoods: ["布料", "香料", "工具"],
  },
  {
    id: "2",
    name: "王农民",
    profession: "农民",
    location: "农业区",
    relationship: 60,
    avatar: "👨‍🌾",
    status: "available",
    dailyTasks: 2,
    tradingGoods: ["小麦", "玉米", "蔬菜"],
  },
  {
    id: "3",
    name: "张工匠",
    profession: "工匠",
    location: "工坊",
    relationship: 45,
    avatar: "👨‍🔧",
    status: "busy",
    dailyTasks: 1,
    tradingGoods: ["木制品", "金属制品"],
  },
  {
    id: "4",
    name: "陈艺术家",
    profession: "艺术家",
    location: "艺术馆",
    relationship: 30,
    avatar: "🎨",
    status: "available",
    dailyTasks: 4,
    tradingGoods: ["画作", "雕塑", "手工艺品"],
  },
  {
    id: "5",
    name: "刘医生",
    profession: "医生",
    location: "诊所",
    relationship: 55,
    avatar: "👨‍⚕️",
    status: "available",
    dailyTasks: 2,
    tradingGoods: ["药品", "医疗用品"],
  },
];

export default function NPCInteraction() {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [filterProfession, setFilterProfession] = useState<string>("all");

  const filteredNPCs = mockNPCs.filter((npc) => {
    const matchesSearch = npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.profession.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProfession = filterProfession === "all" || npc.profession === filterProfession;
    return matchesSearch && matchesProfession;
  });

  const professions = ["all", ...Array.from(new Set(mockNPCs.map((npc) => npc.profession)))];

  const getStatusColor = (status: string) => {
    if (status === "available") return "bg-green-100 text-green-800";
    if (status === "busy") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    if (status === "available") return lang === "zh" ? "可交互" : "Available";
    if (status === "busy") return lang === "zh" ? "忙碌中" : "Busy";
    return lang === "zh" ? "离线" : "Offline";
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
                placeholder={lang === "zh" ? "搜索 NPC 名字或职业..." : "Search NPC name or profession..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {professions.map((profession: string) => (
              <Button
                key={profession}
                variant={filterProfession === profession ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterProfession(profession)}
              >
                {profession === "all" ? (lang === "zh" ? "全部" : "All") : profession}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NPC Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNPCs.map((npc) => (
          <Card key={npc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{npc.avatar}</div>
                    <div>
                      <h3 className="font-bold text-lg">{npc.name}</h3>
                      <p className="text-sm text-muted-foreground">{npc.profession}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(npc.status)}>
                    {getStatusLabel(npc.status)}
                  </Badge>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{npc.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="w-4 h-4" />
                    <span>
                      {lang === "zh" ? "好感度" : "Relationship"}: {npc.relationship}/100
                    </span>
                  </div>
                </div>

                {/* Relationship Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full"
                    style={{ width: `${npc.relationship}%` }}
                  />
                </div>

                {/* Trading Goods */}
                <div>
                  <p className="text-sm font-medium mb-2">{lang === "zh" ? "交易商品" : "Trading Goods"}:</p>
                  <div className="flex flex-wrap gap-1">
                    {npc.tradingGoods.map((good) => (
                      <Badge key={good} variant="outline" className="text-xs">
                        {good}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Daily Tasks */}
                <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
                  <Briefcase className="w-4 h-4" />
                  <span>
                    {lang === "zh" ? `${npc.dailyTasks} 个每日任务` : `${npc.dailyTasks} daily tasks`}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setSelectedNPC(npc)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">{lang === "zh" ? "对话" : "Chat"}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {lang === "zh" ? "与" : "Chat with"} {selectedNPC?.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-gray-100 p-4 rounded min-h-[200px] max-h-[300px] overflow-y-auto">
                          <p className="text-sm text-muted-foreground">
                            {lang === "zh"
                              ? "对话系统开发中..."
                              : "Chat system under development..."}
                          </p>
                        </div>
                        <Input
                          placeholder={lang === "zh" ? "输入消息..." : "Type message..."}
                          disabled
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={npc.dailyTasks === 0}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="hidden sm:inline">{lang === "zh" ? "任务" : "Task"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={npc.tradingGoods.length === 0}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden sm:inline">{lang === "zh" ? "交易" : "Trade"}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredNPCs.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {lang === "zh" ? "没有找到匹配的 NPC" : "No NPCs found"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* NPC Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{lang === "zh" ? "NPC 统计" : "NPC Statistics"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{mockNPCs.length}</p>
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "总 NPC 数" : "Total NPCs"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {mockNPCs.filter((n) => n.status === "available").length}
              </p>
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "可交互" : "Available"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Array.from(new Set(mockNPCs.map((n) => n.profession))).length}
              </p>
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "职业类型" : "Professions"}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {mockNPCs.reduce((sum, n) => sum + n.dailyTasks, 0)}
              </p>
              <p className="text-sm text-muted-foreground">{lang === "zh" ? "总任务数" : "Total Tasks"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
