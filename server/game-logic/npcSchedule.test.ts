import { describe, it, expect } from "vitest";
import { NPCScheduleService, NPCScheduleEntry } from "./npcSchedule";
import { GameTime } from "./types";

describe("NPCScheduleService", () => {
  const mockGameTime: GameTime = {
    hour: 10,
    day: 1,
    month: 1,
    year: 1,
    season: "spring",
  };

  const mockSchedule: NPCScheduleEntry[] = [
    {
      timeRange: { start: 6, end: 12 },
      location: "market",
      activity: "shopping",
      availability: "available",
    },
    {
      timeRange: { start: 12, end: 14 },
      location: "restaurant",
      activity: "lunch",
      availability: "busy",
    },
    {
      timeRange: { start: 14, end: 18 },
      location: "workplace",
      activity: "working",
      availability: "available",
    },
    {
      timeRange: { start: 18, end: 22 },
      location: "home",
      activity: "relaxing",
      availability: "available",
    },
    {
      timeRange: { start: 22, end: 24 },
      location: "home",
      activity: "sleeping",
      availability: "unavailable",
    },
    {
      timeRange: { start: 0, end: 6 },
      location: "home",
      activity: "sleeping",
      availability: "unavailable",
    },
  ];

  describe("getCurrentScheduleEntry", () => {
    it("should return correct schedule entry for current hour", () => {
      const entry = NPCScheduleService.getCurrentScheduleEntry(
        "npc_001",
        mockGameTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(entry).toBeDefined();
      expect(entry?.location).toBe("market");
      expect(entry?.activity).toBe("shopping");
    });

    it("should return sleeping schedule entry at night", () => {
      const lateNightTime: GameTime = { ...mockGameTime, hour: 3 };
      const entry = NPCScheduleService.getCurrentScheduleEntry(
        "npc_001",
        lateNightTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(entry).toBeDefined();
      expect(entry?.activity).toBe("sleeping");
    });
  });

  describe("getNPCLocation", () => {
    it("should return correct location for current time", () => {
      const location = NPCScheduleService.getNPCLocation(
        "npc_001",
        mockGameTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(location).toBe("market");
    });

    it("should return default schedule location when NPC not found", () => {
      const location = NPCScheduleService.getNPCLocation(
        "npc_unknown",
        mockGameTime
      );

      // Should use default schedule which has market at hour 10
      expect(location).toBe("market");
    });
  });

  describe("getNPCActivity", () => {
    it("should return correct activity for current time", () => {
      const activity = NPCScheduleService.getNPCActivity(
        "npc_001",
        mockGameTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(activity).toBe("shopping");
    });

    it("should return default schedule activity when NPC not found", () => {
      const activity = NPCScheduleService.getNPCActivity(
        "npc_unknown",
        mockGameTime
      );

      // Should use default schedule which has shopping at hour 10
      expect(activity).toBe("shopping");
    });
  });

  describe("isNPCAvailable", () => {
    it("should return true when NPC is available", () => {
      const available = NPCScheduleService.isNPCAvailable(
        "npc_001",
        mockGameTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(available).toBe(true);
    });

    it("should return false when NPC is busy", () => {
      const busyTime: GameTime = { ...mockGameTime, hour: 13 };
      const available = NPCScheduleService.isNPCAvailable(
        "npc_001",
        busyTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(available).toBe(false);
    });

    it("should return false when NPC is unavailable", () => {
      const sleepingTime: GameTime = { ...mockGameTime, hour: 2 };
      const available = NPCScheduleService.isNPCAvailable(
        "npc_001",
        sleepingTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(available).toBe(false);
    });
  });

  describe("getAvailabilityStatus", () => {
    it("should return available status", () => {
      const status = NPCScheduleService.getAvailabilityStatus(
        "npc_001",
        mockGameTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(status).toBe("available");
    });

    it("should return busy status", () => {
      const busyTime: GameTime = { ...mockGameTime, hour: 13 };
      const status = NPCScheduleService.getAvailabilityStatus(
        "npc_001",
        busyTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(status).toBe("busy");
    });

    it("should return unavailable status", () => {
      const sleepingTime: GameTime = { ...mockGameTime, hour: 23 };
      const status = NPCScheduleService.getAvailabilityStatus(
        "npc_001",
        sleepingTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(status).toBe("unavailable");
    });
  });

  describe("getTimeUntilAvailable", () => {
    it("should return hours until next available slot", () => {
      const busyTime: GameTime = { ...mockGameTime, hour: 13 };
      const timeUntil = NPCScheduleService.getTimeUntilAvailable(
        "npc_001",
        busyTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(timeUntil).toBeGreaterThan(0);
    });

    it("should return 24 if no available slots found", () => {
      const allBusySchedule: NPCScheduleEntry[] = [
        {
          timeRange: { start: 0, end: 24 },
          location: "work",
          activity: "working",
          availability: "busy",
        },
      ];

      const timeUntil = NPCScheduleService.getTimeUntilAvailable(
        "npc_001",
        mockGameTime,
        {
          npc_001: { npcId: "npc_001", schedule: allBusySchedule },
        }
      );

      expect(timeUntil).toBeGreaterThanOrEqual(24);
    });
  });

  describe("getNPCScheduleNext24Hours", () => {
    it("should return 24-hour schedule", () => {
      const schedule = NPCScheduleService.getNPCScheduleNext24Hours(
        "npc_001",
        mockGameTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[0]).toHaveProperty("time");
      expect(schedule[0]).toHaveProperty("activity");
      expect(schedule[0]).toHaveProperty("location");
      expect(schedule[0]).toHaveProperty("availability");
    });

    it("should include current hour in schedule", () => {
      const schedule = NPCScheduleService.getNPCScheduleNext24Hours(
        "npc_001",
        mockGameTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      const currentHourSchedule = schedule.find((s) => s.time === "10:00");
      expect(currentHourSchedule).toBeDefined();
    });
  });

  describe("getAvailableNPCs", () => {
    it("should return only available NPCs", () => {
      const gameState = {
        gameTime: mockGameTime,
        npcSchedules: {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
          npc_002: { npcId: "npc_002", schedule: mockSchedule },
          npc_003: {
            npcId: "npc_003",
            schedule: [
              {
                timeRange: { start: 0, end: 24 },
                location: "home",
                activity: "sleeping",
                availability: "unavailable",
              },
            ],
          },
        },
      } as any;

      const availableNPCs = NPCScheduleService.getAvailableNPCs(gameState, [
        "npc_001",
        "npc_002",
        "npc_003",
      ]);

      expect(availableNPCs).toContain("npc_001");
      expect(availableNPCs).toContain("npc_002");
      expect(availableNPCs).not.toContain("npc_003");
    });

    it("should return empty array if no NPCs available", () => {
      const gameState = {
        gameTime: mockGameTime,
        npcSchedules: {
          npc_001: {
            npcId: "npc_001",
            schedule: [
              {
                timeRange: { start: 0, end: 24 },
                location: "home",
                activity: "sleeping",
                availability: "unavailable",
              },
            ],
          },
        },
      } as any;

      const availableNPCs = NPCScheduleService.getAvailableNPCs(gameState, [
        "npc_001",
      ]);

      expect(availableNPCs).toHaveLength(0);
    });
  });

  describe("createNPCSchedule", () => {
    it("should create NPC schedule with season", () => {
      const schedule = NPCScheduleService.createNPCSchedule(
        "npc_001",
        mockSchedule,
        "summer"
      );

      expect(schedule.npcId).toBe("npc_001");
      expect(schedule.schedule).toEqual(mockSchedule);
      expect(schedule.season).toBe("summer");
    });

    it("should create NPC schedule without season", () => {
      const schedule = NPCScheduleService.createNPCSchedule(
        "npc_001",
        mockSchedule
      );

      expect(schedule.npcId).toBe("npc_001");
      expect(schedule.schedule).toEqual(mockSchedule);
      expect(schedule.season).toBeUndefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle midnight hour transition", () => {
      const midnightTime: GameTime = { ...mockGameTime, hour: 0 };
      const location = NPCScheduleService.getNPCLocation(
        "npc_001",
        midnightTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(location).toBe("home"); // sleeping schedule
    });

    it("should handle hour 23 (last hour of day)", () => {
      const lastHourTime: GameTime = { ...mockGameTime, hour: 23 };
      const location = NPCScheduleService.getNPCLocation(
        "npc_001",
        lastHourTime,
        {
          npc_001: { npcId: "npc_001", schedule: mockSchedule },
        }
      );

      expect(location).toBe("home"); // sleeping schedule
    });

    it("should handle missing NPC schedule gracefully", () => {
      const location = NPCScheduleService.getNPCLocation(
        "npc_nonexistent",
        mockGameTime,
        {}
      );

      // Should use default schedule which has market at hour 10
      expect(location).toBe("market");
    });
  });
});
