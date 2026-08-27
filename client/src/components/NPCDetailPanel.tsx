import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Clock, MapPin, User, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import { NPCStatus, NPCScheduleEntry } from "./NPCScheduleDisplay";

export interface NPCFavorabilityData {
  npcId: string;
  favorability: number; // 0-100
  relationship: "stranger" | "acquaintance" | "friend" | "close_friend" | "lover";
  lastInteraction: string;
  interactionCount: number;
  likes: string[];
  dislikes: string[];
}

interface NPCDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  npcId: string;
  npcName: string;
  status: NPCStatus;
  schedule24Hours?: NPCScheduleEntry[];
  favorability?: NPCFavorabilityData;
  isLoading?: boolean;
}

const getRelationshipColor = (relationship: string) => {
  switch (relationship) {
    case "lover":
      return "bg-red-100 text-red-800 border-red-300";
    case "close_friend":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "friend":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "acquaintance":
      return "bg-cyan-100 text-cyan-800 border-cyan-300";
    case "stranger":
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getRelationshipLabel = (relationship: string) => {
  switch (relationship) {
    case "lover":
      return "💕 Lover";
    case "close_friend":
      return "💜 Close Friend";
    case "friend":
      return "💙 Friend";
    case "acquaintance":
      return "👋 Acquaintance";
    case "stranger":
    default:
      return "👤 Stranger";
  }
};

const getFavorabilityLabel = (favorability: number) => {
  if (favorability >= 80) return "Excellent";
  if (favorability >= 60) return "Good";
  if (favorability >= 40) return "Fair";
  if (favorability >= 20) return "Poor";
  return "Very Poor";
};

const getFavorabilityColor = (favorability: number) => {
  if (favorability >= 80) return "bg-red-500";
  if (favorability >= 60) return "bg-purple-500";
  if (favorability >= 40) return "bg-blue-500";
  if (favorability >= 20) return "bg-yellow-500";
  return "bg-gray-500";
};

export const NPCDetailPanel: React.FC<NPCDetailPanelProps> = ({
  isOpen,
  onClose,
  npcId,
  npcName,
  status,
  schedule24Hours,
  favorability,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {npcName.charAt(0).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-2xl">{npcName}</DialogTitle>
                {favorability && (
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getRelationshipColor(favorability.relationship)}>
                      {getRelationshipLabel(favorability.relationship)}
                    </Badge>
                  </DialogDescription>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{status.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Activity</p>
                    <p className="font-semibold">{status.activity}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Availability</span>
                  <Badge
                    className={
                      status.availability === "available"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : status.availability === "busy"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                          : "bg-red-100 text-red-800 border-red-300"
                    }
                  >
                    {status.availability === "available"
                      ? "✓ Available"
                      : status.availability === "busy"
                        ? "◐ Busy"
                        : "✗ Unavailable"}
                  </Badge>
                </div>
                {status.availability !== "available" && status.timeUntilAvailable > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Available in {status.timeUntilAvailable} hours</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorability Card */}
            {favorability && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Favorability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Favorability Level</span>
                      <span className="text-sm font-semibold">{favorability.favorability}/100</span>
                    </div>
                    <Progress
                      value={favorability.favorability}
                      className="h-2"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-600">{getFavorabilityLabel(favorability.favorability)}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getFavorabilityColor(favorability.favorability)} text-white`}>
                        {favorability.favorability}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Interactions</p>
                      <p className="font-semibold text-lg">{favorability.interactionCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Last Interaction</p>
                      <p className="font-semibold text-sm">{favorability.lastInteraction}</p>
                    </div>
                  </div>

                  {/* Likes and Dislikes */}
                  <div className="space-y-3 pt-2 border-t">
                    {favorability.likes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-500" />
                          Likes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {favorability.likes.map((like) => (
                            <Badge key={like} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                              {like}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {favorability.dislikes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          Dislikes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {favorability.dislikes.map((dislike) => (
                            <Badge key={dislike} variant="outline" className="bg-red-50 text-red-800 border-red-200">
                              {dislike}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="schedule">
                  <Clock className="w-4 h-4 mr-2" />
                  24-Hour Schedule
                </TabsTrigger>
                <TabsTrigger value="info">
                  <User className="w-4 h-4 mr-2" />
                  Game Time
                </TabsTrigger>
              </TabsList>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-2 mt-4">
                {schedule24Hours && schedule24Hours.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {schedule24Hours.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Card className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{entry.time}</p>
                              <p className="text-xs text-gray-600">{entry.activity}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {entry.location}
                              </p>
                            </div>
                            <Badge
                              className={
                                entry.availability === "available"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : entry.availability === "busy"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                    : "bg-red-100 text-red-800 border-red-300"
                              }
                            >
                              {entry.availability === "available"
                                ? "✓"
                                : entry.availability === "busy"
                                  ? "◐"
                                  : "✗"}
                            </Badge>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No schedule information available</p>
                  </div>
                )}
              </TabsContent>

              {/* Game Time Tab */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Current Hour</p>
                        <p className="text-2xl font-bold">{status.currentGameTime.hour}:00</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Season</p>
                        <p className="text-2xl font-bold capitalize">{status.currentGameTime.season}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Day</p>
                        <p className="text-2xl font-bold">Day {status.currentGameTime.day}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Month</p>
                        <p className="text-2xl font-bold">Month {status.currentGameTime.month}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NPCDetailPanel;
