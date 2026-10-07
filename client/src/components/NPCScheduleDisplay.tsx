import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export interface NPCStatus {
  npcId: string;
  location: string;
  activity: string;
  availability: "available" | "busy" | "unavailable";
  timeUntilAvailable: number;
  currentGameTime: {
    hour: number;
    day: number;
    month: number;
    season: string;
  };
}

export interface NPCScheduleEntry {
  time: string;
  activity: string;
  location: string;
  availability: string;
}

interface NPCScheduleDisplayProps {
  npcName: string;
  status: NPCStatus;
  schedule24Hours?: NPCScheduleEntry[];
  isLoading?: boolean;
}

const getAvailabilityColor = (availability: string) => {
  switch (availability) {
    case "available":
      return "bg-green-100 text-green-800";
    case "busy":
      return "bg-yellow-100 text-yellow-800";
    case "unavailable":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getAvailabilityLabel = (availability: string) => {
  switch (availability) {
    case "available":
      return "Available";
    case "busy":
      return "Busy";
    case "unavailable":
      return "Unavailable";
    default:
      return "Unknown";
  }
};

const formatGameTime = (hour: number) => {
  return `${String(hour).padStart(2, "0")}:00`;
};

export const NPCScheduleDisplay: React.FC<NPCScheduleDisplayProps> = ({
  npcName,
  status,
  schedule24Hours,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentHour = status.currentGameTime.hour;
  const availabilityColor = getAvailabilityColor(status.availability);
  const availabilityLabel = getAvailabilityLabel(status.availability);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">{npcName}</CardTitle>
                <CardDescription>Current Status & Schedule</CardDescription>
              </div>
            </div>
            <Badge className={availabilityColor}>{availabilityLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Current Status Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Current Status</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Location */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
              >
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">Location</p>
                  <p className="font-medium text-sm capitalize truncate">{status.location}</p>
                </div>
              </motion.div>

              {/* Activity */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg"
              >
                <Clock className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">Activity</p>
                  <p className="font-medium text-sm capitalize truncate">{status.activity}</p>
                </div>
              </motion.div>
            </div>

            {/* Time Until Available */}
            {status.availability !== "available" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Available in <span className="font-semibold">{status.timeUntilAvailable} hours</span>
                </p>
              </motion.div>
            )}
          </div>

          {/* Game Time Section */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Game Time</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">
                {formatGameTime(currentHour)}
              </span>
              <span className="text-xs text-gray-500">
                Day {status.currentGameTime.day} • Month {status.currentGameTime.month} •{" "}
                <span className="capitalize">{status.currentGameTime.season}</span>
              </span>
            </div>
          </div>

          {/* 24-Hour Schedule */}
          {schedule24Hours && schedule24Hours.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">24-Hour Schedule</h3>

              <div className="max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {schedule24Hours.map((entry, index) => {
                    const isCurrentHour =
                      parseInt(entry.time.split(":")[0]) === currentHour;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex items-center gap-2 p-2 rounded text-xs ${
                          isCurrentHour
                            ? "bg-blue-100 border border-blue-300"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <span className="font-mono font-semibold w-12 text-gray-700">
                          {entry.time}
                        </span>
                        <span className="flex-1 capitalize text-gray-600">{entry.activity}</span>
                        <span className="text-gray-500 capitalize">{entry.location}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            entry.availability === "available"
                              ? "border-green-300 text-green-700"
                              : entry.availability === "busy"
                                ? "border-yellow-300 text-yellow-700"
                                : "border-red-300 text-red-700"
                          }`}
                        >
                          {entry.availability === "available"
                            ? "✓"
                            : entry.availability === "busy"
                              ? "◐"
                              : "✗"}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NPCScheduleDisplay;
