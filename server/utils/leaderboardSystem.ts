/**
 * 实时排行榜和统计系统 (Phase 88)
 */

export interface PlayerStats {
  playerId: string;
  username: string;
  level: number;
  totalWealth: number;
  properties: number;
  trades: number;
  victories: number;
  defeats: number;
  joinedAt: number;
}

export interface Leaderboard {
  type: 'wealth' | 'level' | 'properties' | 'victories' | 'trades';
  entries: Array<PlayerStats & { rank: number }>;
  lastUpdate: number;
}

export class LeaderboardSystem {
  private playerStats: Map<string, PlayerStats> = new Map();
  private leaderboards: Map<string, Leaderboard> = new Map();

  updatePlayerStats(playerId: string, stats: Partial<PlayerStats>): void {
    const current = this.playerStats.get(playerId) || {
      playerId,
      username: `Player_${playerId}`,
      level: 1,
      totalWealth: 0,
      properties: 0,
      trades: 0,
      victories: 0,
      defeats: 0,
      joinedAt: Date.now(),
    };

    this.playerStats.set(playerId, { ...current, ...stats });
  }

  recordTrade(playerId: string): void {
    const stats = this.playerStats.get(playerId);
    if (stats) {
      stats.trades += 1;
    }
  }

  recordVictory(playerId: string): void {
    const stats = this.playerStats.get(playerId);
    if (stats) {
      stats.victories += 1;
    }
  }

  recordDefeat(playerId: string): void {
    const stats = this.playerStats.get(playerId);
    if (stats) {
      stats.defeats += 1;
    }
  }

  generateLeaderboard(type: Leaderboard['type'], limit: number = 100): Leaderboard {
    const statsArray = Array.from(this.playerStats.values());

    let sorted: PlayerStats[] = [];
    switch (type) {
      case 'wealth':
        sorted = statsArray.sort((a, b) => b.totalWealth - a.totalWealth);
        break;
      case 'level':
        sorted = statsArray.sort((a, b) => b.level - a.level);
        break;
      case 'properties':
        sorted = statsArray.sort((a, b) => b.properties - a.properties);
        break;
      case 'victories':
        sorted = statsArray.sort((a, b) => b.victories - a.victories);
        break;
      case 'trades':
        sorted = statsArray.sort((a, b) => b.trades - a.trades);
        break;
    }

    const leaderboard: Leaderboard = {
      type,
      entries: sorted.slice(0, limit).map((stats, index) => ({
        ...stats,
        rank: index + 1,
      })),
      lastUpdate: Date.now(),
    };

    this.leaderboards.set(type, leaderboard);
    return leaderboard;
  }

  getLeaderboard(type: Leaderboard['type']): Leaderboard | null {
    return this.leaderboards.get(type) || null;
  }

  getPlayerStats(playerId: string): PlayerStats | null {
    return this.playerStats.get(playerId) || null;
  }

  getPlayerRank(playerId: string, type: Leaderboard['type']): number {
    const leaderboard = this.leaderboards.get(type);
    if (!leaderboard) return -1;

    const entry = leaderboard.entries.find((e) => e.playerId === playerId);
    return entry?.rank || -1;
  }

  getSystemStats() {
    return {
      totalPlayers: this.playerStats.size,
      totalLeaderboards: this.leaderboards.size,
      averageWealth: this.calculateAverageWealth(),
      averageLevel: this.calculateAverageLevel(),
    };
  }

  private calculateAverageWealth(): number {
    const stats = Array.from(this.playerStats.values());
    if (stats.length === 0) return 0;
    const total = stats.reduce((sum, s) => sum + s.totalWealth, 0);
    return total / stats.length;
  }

  private calculateAverageLevel(): number {
    const stats = Array.from(this.playerStats.values());
    if (stats.length === 0) return 0;
    const total = stats.reduce((sum, s) => sum + s.level, 0);
    return total / stats.length;
  }
}

export default LeaderboardSystem;
