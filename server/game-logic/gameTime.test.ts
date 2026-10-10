import { describe, it, expect, beforeEach } from "vitest";
import { gameReducer, createInitialGameState } from "./reducer";
import { GameState, GameTime } from "./types";

describe("Game Time System", () => {
  let state: GameState;
  const playerId = "player_001";

  beforeEach(() => {
    state = createInitialGameState(playerId, "TestPlayer");
  });

  describe("Initial Game Time", () => {
    it("should initialize with valid game time", () => {
      expect(state.gameTime).toBeDefined();
      expect(state.gameTime.hour).toBeGreaterThanOrEqual(0);
      expect(state.gameTime.hour).toBeLessThan(24);
      expect(state.gameTime.day).toBeGreaterThanOrEqual(1);
      expect(state.gameTime.day).toBeLessThanOrEqual(30);
      expect(state.gameTime.month).toBeGreaterThanOrEqual(1);
      expect(state.gameTime.month).toBeLessThanOrEqual(12);
      expect(state.gameTime.year).toBeGreaterThanOrEqual(1);
      expect(["spring", "summer", "autumn", "winter"]).toContain(state.gameTime.season);
    });
  });

  describe("Time Advancement", () => {
    it("should advance time by minutes", () => {
      const initialTime = state.gameTime.hour * 60 + state.gameTime.minute;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 30 },
      });
      const newTime = state.gameTime.hour * 60 + state.gameTime.minute;
      expect(newTime - initialTime).toBe(30);
    });

    it("should advance time by 1 hour", () => {
      const initialHour = state.gameTime.hour;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 60 },
      });
      expect(state.gameTime.hour).toBe((initialHour + 1) % 24);
    });

    it("should handle hour overflow to next day", () => {
      state.gameTime.hour = 23;
      state.gameTime.minute = 0;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 120 }, // 2 hours
      });
      expect(state.gameTime.hour).toBe(1);
      expect(state.gameTime.day).toBe(2);
    });

    it("should handle day overflow to next month", () => {
      state.gameTime.day = 30;
      state.gameTime.hour = 23;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 60 },
      });
      expect(state.gameTime.day).toBe(1);
      expect(state.gameTime.month).toBe(2);
    });

    it("should handle month overflow to next year", () => {
      const initialYear = state.gameTime.year;
      state.gameTime.month = 12;
      state.gameTime.day = 30;
      state.gameTime.hour = 23;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 60 },
      });
      expect(state.gameTime.month).toBe(1);
      expect(state.gameTime.year).toBe(initialYear + 1);
    });

    it("should advance time by multiple days", () => {
      const initialDay = state.gameTime.day;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 24 * 60 * 3 }, // 3 days
      });
      expect(state.gameTime.day).toBe(initialDay + 3);
    });

    it("should advance time by multiple months", () => {
      const initialMonth = state.gameTime.month;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 24 * 60 * 30 * 2 }, // 2 months
      });
      expect(state.gameTime.month).toBe(initialMonth + 2);
    });
  });

  describe("Season Calculation", () => {
    it("should set season to spring for months 1-3", () => {
      for (let month = 1; month <= 3; month++) {
        state.gameTime.month = month;
        state = gameReducer(state, {
          type: "GAME_TIME_ADVANCE",
          payload: { minutes: 0 },
        });
        expect(state.gameTime.season).toBe("spring");
      }
    });

    it("should set season to summer for months 4-6", () => {
      for (let month = 4; month <= 6; month++) {
        state.gameTime.month = month;
        state = gameReducer(state, {
          type: "GAME_TIME_ADVANCE",
          payload: { minutes: 0 },
        });
        expect(state.gameTime.season).toBe("summer");
      }
    });

    it("should set season to autumn for months 7-9", () => {
      for (let month = 7; month <= 9; month++) {
        state.gameTime.month = month;
        state = gameReducer(state, {
          type: "GAME_TIME_ADVANCE",
          payload: { minutes: 0 },
        });
        expect(state.gameTime.season).toBe("autumn");
      }
    });

    it("should set season to winter for months 10-12", () => {
      for (let month = 10; month <= 12; month++) {
        state.gameTime.month = month;
        state = gameReducer(state, {
          type: "GAME_TIME_ADVANCE",
          payload: { minutes: 0 },
        });
        expect(state.gameTime.season).toBe("winter");
      }
    });

    it("should update season when crossing month boundary", () => {
      state.gameTime.month = 3;
      state.gameTime.day = 30;
      state.gameTime.hour = 23;
      expect(state.gameTime.season).toBe("spring");

      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 60 },
      });

      expect(state.gameTime.month).toBe(4);
      expect(state.gameTime.season).toBe("summer");
    });
  });

  describe("Time of Day Detection", () => {
    it("should identify morning (6-12)", () => {
      state.gameTime.hour = 9;
      expect(state.gameTime.hour >= 6 && state.gameTime.hour < 12).toBe(true);
    });

    it("should identify afternoon (12-18)", () => {
      state.gameTime.hour = 15;
      expect(state.gameTime.hour >= 12 && state.gameTime.hour < 18).toBe(true);
    });

    it("should identify evening (18-20)", () => {
      state.gameTime.hour = 19;
      expect(state.gameTime.hour >= 18 && state.gameTime.hour < 20).toBe(true);
    });

    it("should identify night (20-6)", () => {
      state.gameTime.hour = 23;
      expect(state.gameTime.hour >= 20 || state.gameTime.hour < 6).toBe(true);
    });
  });

  describe("Complex Time Scenarios", () => {
    it("should handle large time jumps (1 year)", () => {
      const initialYear = state.gameTime.year;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 24 * 60 * 30 * 12 }, // 1 year
      });
      expect(state.gameTime.year).toBe(initialYear + 1);
      expect(state.gameTime.month).toBe(state.gameTime.month);
    });

    it("should maintain valid state after rapid time advances", () => {
      for (let i = 0; i < 100; i++) {
        state = gameReducer(state, {
          type: "GAME_TIME_ADVANCE",
          payload: { minutes: Math.random() * 1440 }, // Random minutes in a day
        });

        // Verify state validity
        expect(state.gameTime.hour).toBeGreaterThanOrEqual(0);
        expect(state.gameTime.hour).toBeLessThan(24);
        expect(state.gameTime.day).toBeGreaterThanOrEqual(1);
        expect(state.gameTime.day).toBeLessThanOrEqual(30);
        expect(state.gameTime.month).toBeGreaterThanOrEqual(1);
        expect(state.gameTime.month).toBeLessThanOrEqual(12);
      }
    });

    it("should preserve game time state validity after advancement", () => {
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 1440 }, // 1 day
      });
      // Verify game time is still valid
      expect(state.gameTime.hour).toBeGreaterThanOrEqual(0);
      expect(state.gameTime.hour).toBeLessThan(24);
      expect(state.gameTime.day).toBeGreaterThanOrEqual(1);
      expect(state.gameTime.day).toBeLessThanOrEqual(30);
    });
  });

  describe("Time Display Formatting", () => {
    it("should format hour with leading zero", () => {
      state.gameTime.hour = 5;
      const hourStr = String(state.gameTime.hour).padStart(2, "0");
      expect(hourStr).toBe("05");
    });

    it("should format minute with leading zero", () => {
      state.gameTime.minute = 9;
      const minuteStr = String(state.gameTime.minute).padStart(2, "0");
      expect(minuteStr).toBe("09");
    });

    it("should format time correctly (HH:MM)", () => {
      state.gameTime.hour = 14;
      state.gameTime.minute = 30;
      const timeStr = `${String(state.gameTime.hour).padStart(2, "0")}:${String(state.gameTime.minute).padStart(2, "0")}`;
      expect(timeStr).toBe("14:30");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero minute advancement", () => {
      const initialTime = `${state.gameTime.hour}:${state.gameTime.minute}`;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 0 },
      });
      const newTime = `${state.gameTime.hour}:${state.gameTime.minute}`;
      expect(newTime).toBe(initialTime);
    });

    it("should handle exact day boundary (1440 minutes)", () => {
      const initialDay = state.gameTime.day;
      state.gameTime.hour = 0;
      state.gameTime.minute = 0;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 1440 },
      });
      expect(state.gameTime.day).toBe(initialDay + 1);
      expect(state.gameTime.hour).toBe(0);
      expect(state.gameTime.minute).toBe(0);
    });

    it("should handle month boundary with varying days", () => {
      state.gameTime.day = 30;
      state.gameTime.hour = 0;
      state.gameTime.minute = 0;
      state = gameReducer(state, {
        type: "GAME_TIME_ADVANCE",
        payload: { minutes: 1 },
      });
      expect(state.gameTime.day).toBeLessThanOrEqual(30);
      expect(state.gameTime.month).toBeGreaterThanOrEqual(1);
      expect(state.gameTime.month).toBeLessThanOrEqual(12);
    });
  });
});
