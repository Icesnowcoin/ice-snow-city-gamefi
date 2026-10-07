import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Clock, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NPCScheduleDisplay, { NPCStatus, NPCScheduleEntry } from "./NPCScheduleDisplay";
import NPCDetailPanel, { NPCFavorabilityData } from "./NPCDetailPanel";

export interface NPCSchedulePanelData {
  npcId: string;
  name: string;
  status: NPCStatus;
  schedule24Hours?: NPCScheduleEntry[];
  favorability?: NPCFavorabilityData;
}

interface NPCSchedulePanelProps {
  npcs: NPCSchedulePanelData[];
  availableNPCIds: string[];
  isLoading?: boolean;
  onNPCSelect?: (npcId: string) => void;
  onNPCDetailOpen?: (npcId: string) => void;
}

export const NPCSchedulePanel: React.FC<NPCSchedulePanelProps> = ({
  npcs,
  availableNPCIds,
  isLoading,
  onNPCSelect,
  onNPCDetailOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(
    npcs.length > 0 ? npcs[0].npcId : null
  );
  const [activeTab, setActiveTab] = useState("all");
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedDetailNPCId, setSelectedDetailNPCId] = useState<string | null>(null);

  const filteredNPCs = npcs.filter((npc) =>
    npc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableNPCs = filteredNPCs.filter((npc) => availableNPCIds.includes(npc.npcId));
  const busyNPCs = filteredNPCs.filter(
    (npc) => npc.status.availability === "busy" && !availableNPCIds.includes(npc.npcId)
  );
  const unavailableNPCs = filteredNPCs.filter(
    (npc) => npc.status.availability === "unavailable"
  );

  const displayedNPCs =
    activeTab === "available"
      ? availableNPCs
      : activeTab === "busy"
        ? busyNPCs
        : activeTab === "unavailable"
          ? unavailableNPCs
          : filteredNPCs;

  const selectedNPC = npcs.find((npc) => npc.npcId === selectedNPCId);
  const selectedDetailNPC = npcs.find((npc) => npc.npcId === selectedDetailNPCId);

  const handleNPCSelect = (npcId: string) => {
    setSelectedNPCId(npcId);
    onNPCSelect?.(npcId);
  };

  const handleOpenDetailPanel = (npcId: string) => {
    setSelectedDetailNPCId(npcId);
    setDetailPanelOpen(true);
    onNPCDetailOpen?.(npcId);
  };

  const handleCloseDetailPanel = () => {
    setDetailPanelOpen(false);
    setSelectedDetailNPCId(null);
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                NPC Schedule
              </CardTitle>
              <CardDescription>View NPC locations and availability</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-600">
                {availableNPCIds.length} Available
              </p>
              <p className="text-xs text-gray-500">{npcs.length} Total</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search NPCs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({filteredNPCs.length})
              </TabsTrigger>
              <TabsTrigger value="available">
                Available ({availableNPCs.length})
              </TabsTrigger>
              <TabsTrigger value="busy">
                Busy ({busyNPCs.length})
              </TabsTrigger>
              <TabsTrigger value="unavailable">
                Unavailable ({unavailableNPCs.length})
              </TabsTrigger>
            </TabsList>

            {/* NPC List */}
            <TabsContent value={activeTab} className="space-y-2 mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : displayedNPCs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No NPCs found</p>
                </div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {displayedNPCs.map((npc, index) => (
                      <motion.div
                        key={npc.npcId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex gap-2 items-center">
                          <Button
                            variant={selectedNPCId === npc.npcId ? "default" : "outline"}
                            className="w-full justify-between h-auto py-3 flex-1"
                            onClick={() => handleNPCSelect(npc.npcId)}
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{npc.name}</p>
                                <p className="text-xs opacity-75 truncate">
                                  {npc.status.location} • {npc.status.activity}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                npc.status.availability === "available"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : npc.status.availability === "busy"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                    : "bg-red-100 text-red-800 border-red-300"
                              }
                            >
                              {npc.status.availability === "available"
                                ? "✓"
                                : npc.status.availability === "busy"
                                  ? "◐"
                                  : "✗"}
                            </Badge>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-auto py-3"
                            onClick={() => handleOpenDetailPanel(npc.npcId)}
                            title="View NPC Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected NPC Details */}
      {selectedNPC && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <NPCScheduleDisplay
            npcName={selectedNPC.name}
            status={selectedNPC.status}
            schedule24Hours={selectedNPC.schedule24Hours}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {/* NPC Detail Panel */}
      {selectedDetailNPC && (
        <NPCDetailPanel
          isOpen={detailPanelOpen}
          onClose={handleCloseDetailPanel}
          npcId={selectedDetailNPC.npcId}
          npcName={selectedDetailNPC.name}
          status={selectedDetailNPC.status}
          schedule24Hours={selectedDetailNPC.schedule24Hours}
          favorability={selectedDetailNPC.favorability}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default NPCSchedulePanel;
