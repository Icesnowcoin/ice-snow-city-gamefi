/**
 * NPC Schedule System
 * Manages NPC availability, location, and activities based on game time
 */

import { GameState, GameTime } from "./types";

export interface NPCScheduleEntry {
  timeRange: { start: number; end: number }; // hour in 24-hour format
  location: string;
  activity: string;
  availability: "available" | "busy" | "unavailable";
}

export interface NPCDailySchedule {
  npcId: string;
  schedule: NPCScheduleEntry[];
  season?: "spring" | "summer" | "autumn" | "winter";
}

/**
 * Default NPC schedules - can be customized per NPC
 */
const DEFAULT_NPC_SCHEDULES: Record<string, NPCScheduleEntry[]> = {
  morning: [
    { timeRange: { start: 6, end: 9 }, location: "home", activity: "sleeping", availability: "unavailable" },
    { timeRange: { start: 9, end: 12 }, location: "market", activity: "shopping", availability: "available" },
  ],
  afternoon: [
    { timeRange: { start: 12, end: 14 }, location: "restaurant", activity: "lunch", availability: "busy" },
    { timeRange: { start: 14, end: 18 }, location: "workplace", activity: "working", availability: "available" },
  ],
  evening: [
    { timeRange: { start: 18, end: 20 }, location: "home", activity: "cooking", availability: "busy" },
    { timeRange: { start: 20, end: 22 }, location: "park", activity: "relaxing", availability: "available" },
  ],
  night: [
    { timeRange: { start: 22, end: 6 }, location: "home", activity: "sleeping", availability: "unavailable" },
  ],
};

export class NPCScheduleService {
  /**
   * Get current NPC schedule entry based on game time
   */
  static getCurrentScheduleEntry(
    npcId: string,
    gameTime: GameTime,
    npcSchedules?: Record<string, NPCDailySchedule>
  ): NPCScheduleEntry | null {
    const schedule = npcSchedules?.[npcId]?.schedule || this.getDefaultSchedule();
    const currentHour = gameTime.hour;

    for (const entry of schedule) {
      if (currentHour >= entry.timeRange.start && currentHour < entry.timeRange.end) {
        return entry;
      }
    }

    return null;
  }

  /**
   * Get NPC current location
   */
  static getNPCLocation(
    npcId: string,
    gameTime: GameTime,
    npcSchedules?: Record<string, NPCDailySchedule>
  ): string {
    const entry = this.getCurrentScheduleEntry(npcId, gameTime, npcSchedules);
    return entry?.location || "home";
  }

  /**
   * Get NPC current activity
   */
  static getNPCActivity(
    npcId: string,
    gameTime: GameTime,
    npcSchedules?: Record<string, NPCDailySchedule>
  ): string {
    const entry = this.getCurrentScheduleEntry(npcId, gameTime, npcSchedules);
    return entry?.activity || "idle";
  }

  /**
   * Check if NPC is available for interaction
   */
  static isNPCAvailable(
    npcId: string,
    gameTime: GameTime,
    npcSchedules?: Record<string, NPCDailySchedule>
  ): boolean {
    const entry = this.getCurrentScheduleEntry(npcId, gameTime, npcSchedules);
    return entry?.availability === "available";
  }

  /**
   * Get availability status
   */
  static getAvailabilityStatus(
    npcId: string,
    gameTime: GameTime,
    npcSchedules?: Record<string, NPCDailySchedule>
  ): "available" | "busy" | "unavailable" {
    const entry = this.getCurrentScheduleEntry(npcId, gameTime, npcSchedules);
    return entry?.availability || "unavailable";
  }

  /**
   * Get time until NPC becomes available
   */
  static getTimeUntilAvailable(
    npcId: string,
    gameTime: GameTime,
    npcSchedules?: Record<string, NPCDailySchedule>
  ): number {
    const schedule = npcSchedules?.[npcId]?.schedule || this.getDefaultSchedule();
    const currentHour = gameTime.hour;

    for (const entry of schedule) {
      if (entry.availability === "available" && currentHour < entry.timeRange.start) {
        return entry.timeRange.start - currentHour;
      }
    }

    // Check next day
    for (const entry of schedule) {
      if (entry.availability === "available") {
        return 24 - currentHour + entry.timeRange.start;
      }
    }

    return 24; // Default to 24 hours if no available slot found
  }

  /**
   * Get default schedule for NPC
   */
  private static getDefaultSchedule(): NPCScheduleEntry[] {
    return [
      ...DEFAULT_NPC_SCHEDULES.morning,
      ...DEFAULT_NPC_SCHEDULES.afternoon,
      ...DEFAULT_NPC_SCHEDULES.evening,
      ...DEFAULT_NPC_SCHEDULES.night,
    ];
  }

  /**
   * Create custom NPC schedule
   */
  static createNPCSchedule(
    npcId: string,
    schedule: NPCScheduleEntry[],
    season?: "spring" | "summer" | "autumn" | "winter"
  ): NPCDailySchedule {
    return {
      npcId,
      schedule,
      season,
    };
  }

  /**
   * Get all NPCs available at current time
   */
  static getAvailableNPCs(
    gameState: GameState,
    npcIds: string[]
  ): string[] {
    return npcIds.filter((npcId) =>
      this.isNPCAvailable(npcId, gameState.gameTime, gameState.npcSchedules)
    );
  }

  /**
   * Get NPC schedule for next 24 hours
   */
  static getNPCScheduleNext24Hours(
    npcId: string,
    gameTime: GameTime,
    npcSchedules?: Record<string, NPCDailySchedule>
  ): Array<{ time: string; activity: string; location: string; availability: string }> {
    const schedule = npcSchedules?.[npcId]?.schedule || this.getDefaultSchedule();
    const result: Array<{ time: string; activity: string; location: string; availability: string }> = [];

    for (let hour = gameTime.hour; hour < gameTime.hour + 24; hour++) {
      const normalizedHour = hour % 24;
      const entry = schedule.find(
        (e) => normalizedHour >= e.timeRange.start && normalizedHour < e.timeRange.end
      );

      if (entry) {
        result.push({
          time: `${String(normalizedHour).padStart(2, "0")}:00`,
          activity: entry.activity,
          location: entry.location,
          availability: entry.availability,
        });
      }
    }

    return result;
  }
}
