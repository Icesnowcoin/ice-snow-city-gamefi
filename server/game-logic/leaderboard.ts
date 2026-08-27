/**
 * Leaderboard System
 * Manages player rankings across different metrics
 */

import { GameState } from "./types";

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  rank: number;
  value: number;
  metadata?: Record<string, any>;
}

export type LeaderboardType = "wealth" | "level" | "progress" | "properties" | "farms";

export class LeaderboardService {
  /**
   * Calculate player wealth score
   */
  static calculateWealthScore(state: GameState): number {
    return (
      state.wallet.money +
      state.wallet.isc +
      state.bankAccount.balance +
      (state.properties?.length || 0) * 10000 +
      (state.farms?.length || 0) * 5000
    );
  }

  /**
   * Calculate player progress score
   */
  static calculateProgressScore(state: GameState): number {
    const progress = state.progress;
    return (
      progress.tasksCompleted * 10 +
      progress.npcsFriended * 20 +
      progress.propertiesOwned * 50 +
      progress.farmsCreated * 30 +
      progress.itemsTraded * 5 +
      progress.achievements.length * 100
    );
  }

  /**
   * Calculate player total score (combined)
   */
  static calculateTotalScore(state: GameState): number {
    return (
      state.player.level * 1000 +
      this.calculateWealthScore(state) +
      this.calculateProgressScore(state)
    );
  }

  /**
   * Get leaderboard entries (mock - in real implementation, would query database)
   */
  static getLeaderboard(
    type: LeaderboardType,
    gameStates: Record<string, GameState>,
    limit: number = 100
  ): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    for (const [playerId, state] of Object.entries(gameStates)) {
      let value = 0;
      let metadata: Record<string, any> = {};

      switch (type) {
        case "wealth":
          value = this.calculateWealthScore(state);
          metadata = {
            money: state.wallet.money,
            isc: state.wallet.isc,
            bankBalance: state.bankAccount.balance,
            properties: state.properties?.length || 0,
            farms: state.farms?.length || 0,
          };
          break;

        case "level":
          value = state.player.level;
          metadata = {
            experience: state.player.experience,
            totalExperience: state.player.totalExperience,
          };
          break;

        case "progress":
          value = this.calculateProgressScore(state);
          metadata = {
            tasksCompleted: state.progress.tasksCompleted,
            npcsFriended: state.progress.npcsFriended,
            propertiesOwned: state.progress.propertiesOwned,
            farmsCreated: state.progress.farmsCreated,
            achievements: state.progress.achievements.length,
          };
          break;

        case "properties":
          value = state.properties?.length || 0;
          metadata = {
            totalValue: (state.properties?.length || 0) * 10000,
            rentals: state.rentals?.length || 0,
          };
          break;

        case "farms":
          value = state.farms?.length || 0;
          metadata = {
            totalCrops: state.farms?.reduce((sum, farm) => sum + farm.crops.length, 0) || 0,
            harvests: state.harvestHistory?.length || 0,
          };
          break;
      }

      entries.push({
        playerId,
        playerName: state.player.name,
        rank: 0, // Will be set after sorting
        value,
        metadata,
      });
    }

    // Sort by value descending
    entries.sort((a, b) => b.value - a.value);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries.slice(0, limit);
  }

  /**
   * Get player rank in specific leaderboard
   */
  static getPlayerRank(
    playerId: string,
    type: LeaderboardType,
    gameStates: Record<string, GameState>
  ): LeaderboardEntry | null {
    const leaderboard = this.getLeaderboard(type, gameStates, 10000);
    return leaderboard.find((entry) => entry.playerId === playerId) || null;
  }

  /**
   * Get player percentile rank
   */
  static getPlayerPercentile(
    playerId: string,
    type: LeaderboardType,
    gameStates: Record<string, GameState>
  ): number {
    const leaderboard = this.getLeaderboard(type, gameStates, 10000);
    const playerEntry = leaderboard.find((entry) => entry.playerId === playerId);
    if (!playerEntry) return 0;

    const totalPlayers = leaderboard.length;
    return Math.round(((totalPlayers - playerEntry.rank) / totalPlayers) * 100);
  }

  /**
   * Get top 10 players in leaderboard
   */
  static getTopPlayers(
    type: LeaderboardType,
    gameStates: Record<string, GameState>
  ): LeaderboardEntry[] {
    return this.getLeaderboard(type, gameStates, 10);
  }

  /**
   * Get nearby players (player's rank ± 5)
   */
  static getNearbyPlayers(
    playerId: string,
    type: LeaderboardType,
    gameStates: Record<string, GameState>,
    range: number = 5
  ): LeaderboardEntry[] {
    const leaderboard = this.getLeaderboard(type, gameStates, 10000);
    const playerEntry = leaderboard.find((entry) => entry.playerId === playerId);
    if (!playerEntry) return [];

    const startIndex = Math.max(0, playerEntry.rank - range - 1);
    const endIndex = Math.min(leaderboard.length, playerEntry.rank + range);

    return leaderboard.slice(startIndex, endIndex);
  }

  /**
   * Get achievement-based badges
   */
  static getPlayerBadges(state: GameState): string[] {
    const badges: string[] = [];

    // Wealth badges
    if (state.wallet.isc >= 100000) badges.push("wealthy");
    if (state.wallet.isc >= 1000000) badges.push("ultra_wealthy");

    // Level badges
    if (state.player.level >= 20) badges.push("veteran");
    if (state.player.level >= 50) badges.push("master");

    // Progress badges
    if (state.progress.npcsFriended >= 10) badges.push("social_butterfly");
    if (state.progress.propertiesOwned >= 10) badges.push("real_estate_mogul");
    if (state.progress.farmsCreated >= 10) badges.push("farming_expert");
    if (state.progress.achievements.length >= 20) badges.push("achievement_hunter");

    return badges;
  }

  /**
   * Get seasonal leaderboard (for limited-time competitions)
   */
  static getSeasonalLeaderboard(
    type: LeaderboardType,
    gameStates: Record<string, GameState>,
    seasonStartDate: Date,
    limit: number = 100
  ): LeaderboardEntry[] {
    // Filter players who joined after season start
    const seasonGameStates = Object.fromEntries(
      Object.entries(gameStates).filter(
        ([, state]) => state.player.joinedAt >= seasonStartDate
      )
    );

    return this.getLeaderboard(type, seasonGameStates, limit);
  }
}
