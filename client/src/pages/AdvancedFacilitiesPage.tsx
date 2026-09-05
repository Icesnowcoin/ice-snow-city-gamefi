import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ISCAmount } from "@/components/ISCLogo";
import {
  Building2,
  Utensils,
  Coffee,
  BookOpen,
  Landmark,
  Megaphone,
  Flower2,
  Gamepad2,
  Users,
  TrendingUp,
} from "lucide-react";

interface Facility {
  id: string;
  type: string;
  level: number;
  revenue: number;
  capacity: number;
  workers: number;
  status: string;
}

interface GameSession {
  gameType: string;
  bet: number;
  result: "win" | "lose";
  winnings: number;
}

const FACILITY_ICONS: Record<string, React.ReactNode> = {
  restaurant: <Utensils className="w-6 h-6" />,
  cafe: <Coffee className="w-6 h-6" />,
  library: <BookOpen className="w-6 h-6" />,
  landmark: <Landmark className="w-6 h-6" />,
  ads: <Megaphone className="w-6 h-6" />,
  garden: <Flower2 className="w-6 h-6" />,
  flower_shop: <Flower2 className="w-6 h-6" />,
};

const FACILITY_NAMES: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe",
  library: "Library",
  landmark: "City Landmark",
  ads: "Ad Space",
  garden: "Garden",
  flower_shop: "Flower Shop",
};

export default function AdvancedFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("slot");
  const [bet, setBet] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState(false);

  const createFacilityMutation = trpc.advancedFacilities.createFacility.useMutation({
    onSuccess: (data) => {
      setFacilities([...facilities, data as Facility]);
      toast.success(`Created ${FACILITY_NAMES[data.type]}`);
    },
    onError: () => {
      toast.error("Failed to create facility");
    },
  });

  const playGameMutation = trpc.advancedFacilities.playSlotMachine.useMutation({
    onSuccess: (data) => {
      const session: GameSession = {
        gameType: selectedGame,
        bet,
        result: data.multiplier > 0 ? "win" : "lose",
        winnings: data.winnings,
      };
      setGameSessions([...gameSessions, session]);
      setIsPlaying(false);
      toast.success(`${session.result === "win" ? "Won" : "Lost"} ${session.winnings} ISC!`);
    },
    onError: () => {
      setIsPlaying(false);
      toast.error("Game error");
    },
  });

  const handleCreateFacility = (type: string) => {
    createFacilityMutation.mutate({ type });
  };

  const handlePlayGame = async () => {
    setIsPlaying(true);
    playGameMutation.mutate({ bet });
  };

  const totalFacilityRevenue = facilities.reduce((sum, f) => sum + f.revenue, 0);
  const totalGameWinnings = gameSessions.reduce((sum, s) => sum + s.winnings, 0);
  const gameWinRate = gameSessions.length > 0 ? (gameSessions.filter(s => s.result === "win").length / gameSessions.length) * 100 : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Advanced Facilities & Games</h1>
        <p className="text-gray-600">Manage your businesses and play entertainment games</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities.length}</div>
            <ISCAmount amount={String(totalFacilityRevenue)} size="xs" className="text-gray-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Games Played</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameSessions.length}</div>
            <p className="text-xs text-gray-500">Win Rate: {gameWinRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Game Winnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ISCAmount amount={String(totalGameWinnings)} size="lg" className="font-bold" />
            <p className="text-xs text-gray-500">Total earnings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="facilities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>

        {/* Facilities Tab */}
        <TabsContent value="facilities" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {Object.entries(FACILITY_NAMES).map(([type, name]) => (
              <Button
                key={type}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => handleCreateFacility(type)}
                disabled={createFacilityMutation.isPending}
              >
                {FACILITY_ICONS[type]}
                <span className="text-xs text-center">{name}</span>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((facility) => (
              <Card key={facility.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {FACILITY_ICONS[facility.type]}
                      <CardTitle className="text-lg">{FACILITY_NAMES[facility.type]}</CardTitle>
                    </div>
                    <Badge>{facility.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Level</p>
                      <p className="font-bold">{facility.level}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <ISCAmount amount={String(facility.revenue)} size="sm" className="font-bold" />
                    </div>
                    <div>
                      <p className="text-gray-600">Capacity</p>
                      <p className="font-bold">{facility.capacity}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Workers</p>
                      <p className="font-bold">{facility.workers}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Collect
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Upgrade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entertainment Games</CardTitle>
              <CardDescription>Play games and win ISC</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Game Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Select Game</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: "slot", name: "Slot Machine", icon: "🎰" },
                    { id: "dice", name: "Dice Machine", icon: "🎲" },
                    { id: "douzhu", name: "Dou Dizhu", icon: "🃏" },
                    { id: "mahjong", name: "Mahjong", icon: "🀄" },
                    { id: "match3", name: "Match-3", icon: "🎮" },
                    { id: "connect", name: "Connect", icon: "🎯" },
                    { id: "billiards", name: "Billiards", icon: "🎱" },
                  ].map((game) => (
                    <Button
                      key={game.id}
                      variant={selectedGame === game.id ? "default" : "outline"}
                      className="h-auto flex-col gap-1 p-3"
                      onClick={() => setSelectedGame(game.id)}
                    >
                      <span className="text-xl">{game.icon}</span>
                      <span className="text-xs">{game.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bet Amount */}
              <div>
                <label className="text-sm font-medium mb-2 block">Bet Amount (ISC)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Math.max(10, parseInt(e.target.value) || 10))}
                    className="flex-1 px-3 py-2 border rounded-md"
                    min="10"
                    step="10"
                  />
                  <Button onClick={handlePlayGame} disabled={isPlaying || createFacilityMutation.isPending}>
                    {isPlaying ? "Playing..." : "Play"}
                  </Button>
                </div>
              </div>

              {/* Game History */}
              {gameSessions.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">Recent Games</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {gameSessions.slice(-5).reverse().map((session, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{session.gameType}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${session.result === "win" ? "text-green-600" : "text-red-600"}`}>
                            {session.result === "win" ? "+" : "-"}{session.winnings}
                          </span>
                          <Badge variant={session.result === "win" ? "default" : "secondary"}>
                            {session.result}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
