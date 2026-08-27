/**
 * Entertainment Games System
 * Implements: Slot Machine, Lever Machine, Dou Dizhu, Mahjong, Match-3, Connect, Billiards
 */

export interface GameSession {
  id: string;
  playerId: string;
  gameType: string;
  startTime: number;
  endTime?: number;
  score: number;
  reward: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface GameResult {
  sessionId: string;
  playerId: string;
  gameType: string;
  score: number;
  reward: number;
  timestamp: number;
  rank?: number;
}

// Slot Machine Game
export class SlotMachineGame {
  static createSession(playerId: string): GameSession {
    return {
      id: `slot_${Date.now()}`,
      playerId,
      gameType: 'slot_machine',
      startTime: Date.now(),
      score: 0,
      reward: 0,
      status: 'active',
    };
  }

  static spin(session: GameSession, bet: number): GameResult {
    const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '💎'];
    const reels = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    let multiplier = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      if (reels[0] === '💎') multiplier = 10;
      else if (reels[0] === '⭐') multiplier = 5;
      else multiplier = 2;
    } else if (reels[0] === reels[1] || reels[1] === reels[2]) {
      multiplier = 1;
    }

    const reward = Math.floor(bet * multiplier);
    const score = multiplier * 10;

    return {
      sessionId: session.id,
      playerId: session.playerId,
      gameType: 'slot_machine',
      score,
      reward,
      timestamp: Date.now(),
    };
  }
}

// Lever Machine Game
export class LeverMachineGame {
  static createSession(playerId: string): GameSession {
    return {
      id: `lever_${Date.now()}`,
      playerId,
      gameType: 'lever_machine',
      startTime: Date.now(),
      score: 0,
      reward: 0,
      status: 'active',
    };
  }

  static pull(session: GameSession, bet: number): GameResult {
    const levels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const result = levels[Math.floor(Math.random() * levels.length)];

    const multipliers: Record<string, number> = {
      Bronze: 1,
      Silver: 2,
      Gold: 3,
      Platinum: 5,
      Diamond: 10,
    };

    const multiplier = multipliers[result];
    const reward = Math.floor(bet * multiplier);
    const score = multiplier * 15;

    return {
      sessionId: session.id,
      playerId: session.playerId,
      gameType: 'lever_machine',
      score,
      reward,
      timestamp: Date.now(),
    };
  }
}

// Dou Dizhu Game
export class DouDizhuGame {
  static createSession(playerId: string): GameSession {
    return {
      id: `doudizhu_${Date.now()}`,
      playerId,
      gameType: 'dou_dizhu',
      startTime: Date.now(),
      score: 0,
      reward: 0,
      status: 'active',
    };
  }

  static playRound(session: GameSession, bet: number): GameResult {
    // Simplified game logic
    const winChance = Math.random();
    let multiplier = 0;

    if (winChance > 0.7) multiplier = 3; // Win
    else if (winChance > 0.4) multiplier = 1; // Draw
    else multiplier = 0; // Lose

    const reward = Math.floor(bet * multiplier);
    const score = multiplier * 20;

    return {
      sessionId: session.id,
      playerId: session.playerId,
      gameType: 'dou_dizhu',
      score,
      reward,
      timestamp: Date.now(),
    };
  }
}

// Mahjong Game
export class MahjongGame {
  static createSession(playerId: string): GameSession {
    return {
      id: `mahjong_${Date.now()}`,
      playerId,
      gameType: 'mahjong',
      startTime: Date.now(),
      score: 0,
      reward: 0,
      status: 'active',
    };
  }

  static playRound(session: GameSession, bet: number): GameResult {
    // Simplified game logic
    const winChance = Math.random();
    let multiplier = 0;

    if (winChance > 0.65) multiplier = 4; // Big win
    else if (winChance > 0.35) multiplier = 1; // Small win
    else multiplier = 0; // Lose

    const reward = Math.floor(bet * multiplier);
    const score = multiplier * 25;

    return {
      sessionId: session.id,
      playerId: session.playerId,
      gameType: 'mahjong',
      score,
      reward,
      timestamp: Date.now(),
    };
  }
}

// Match-3 Game
export class Match3Game {
  static createSession(playerId: string): GameSession {
    return {
      id: `match3_${Date.now()}`,
      playerId,
      gameType: 'match3',
      startTime: Date.now(),
      score: 0,
      reward: 0,
      status: 'active',
    };
  }

  static playLevel(session: GameSession, difficulty: 'easy' | 'medium' | 'hard'): GameResult {
    const baseScore = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 300;
    const scoreVariation = Math.floor(Math.random() * (baseScore / 2));
    const score = baseScore + scoreVariation;

    const difficultyMultipliers: Record<string, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
    };

    const reward = Math.floor(score * (difficultyMultipliers[difficulty] / 10));

    return {
      sessionId: session.id,
      playerId: session.playerId,
      gameType: 'match3',
      score,
      reward,
      timestamp: Date.now(),
    };
  }
}

// Connect Game
export class ConnectGame {
  static createSession(playerId: string): GameSession {
    return {
      id: `connect_${Date.now()}`,
      playerId,
      gameType: 'connect',
      startTime: Date.now(),
      score: 0,
      reward: 0,
      status: 'active',
    };
  }

  static playGame(session: GameSession, difficulty: 'easy' | 'medium' | 'hard'): GameResult {
    const baseScore = difficulty === 'easy' ? 80 : difficulty === 'medium' ? 150 : 250;
    const scoreVariation = Math.floor(Math.random() * (baseScore / 3));
    const score = baseScore + scoreVariation;

    const difficultyMultipliers: Record<string, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
    };

    const reward = Math.floor(score * (difficultyMultipliers[difficulty] / 10));

    return {
      sessionId: session.id,
      playerId: session.playerId,
      gameType: 'connect',
      score,
      reward,
      timestamp: Date.now(),
    };
  }
}

// Billiards Game
export class BilliardsGame {
  static createSession(playerId: string): GameSession {
    return {
      id: `billiards_${Date.now()}`,
      playerId,
      gameType: 'billiards',
      startTime: Date.now(),
      score: 0,
      reward: 0,
      status: 'active',
    };
  }

  static playMatch(session: GameSession, bet: number): GameResult {
    const winChance = Math.random();
    let multiplier = 0;

    if (winChance > 0.6) multiplier = 2; // Win
    else if (winChance > 0.3) multiplier = 1; // Draw
    else multiplier = 0; // Lose

    const reward = Math.floor(bet * multiplier);
    const score = multiplier * 30;

    return {
      sessionId: session.id,
      playerId: session.playerId,
      gameType: 'billiards',
      score,
      reward,
      timestamp: Date.now(),
    };
  }
}

// Game Manager
export class EntertainmentGameManager {
  private static sessions: Map<string, GameSession> = new Map();
  private static results: GameResult[] = [];

  static createGameSession(playerId: string, gameType: string): GameSession {
    let session: GameSession;

    switch (gameType) {
      case 'slot_machine':
        session = SlotMachineGame.createSession(playerId);
        break;
      case 'lever_machine':
        session = LeverMachineGame.createSession(playerId);
        break;
      case 'dou_dizhu':
        session = DouDizhuGame.createSession(playerId);
        break;
      case 'mahjong':
        session = MahjongGame.createSession(playerId);
        break;
      case 'match3':
        session = Match3Game.createSession(playerId);
        break;
      case 'connect':
        session = ConnectGame.createSession(playerId);
        break;
      case 'billiards':
        session = BilliardsGame.createSession(playerId);
        break;
      default:
        throw new Error(`Unknown game type: ${gameType}`);
    }

    this.sessions.set(session.id, session);
    return session;
  }

  static recordResult(result: GameResult): void {
    this.results.push(result);
    const session = this.sessions.get(result.sessionId);
    if (session) {
      session.score += result.score;
      session.reward += result.reward;
    }
  }

  static completeSession(sessionId: string): GameSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = Date.now();
    }
    return session;
  }

  static getPlayerResults(playerId: string): GameResult[] {
    return this.results.filter((r) => r.playerId === playerId);
  }

  static getGameLeaderboard(gameType: string, limit: number = 10): GameResult[] {
    return this.results
      .filter((r) => r.gameType === gameType)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  static getTotalRewards(playerId: string): number {
    return this.getPlayerResults(playerId).reduce((sum, r) => sum + r.reward, 0);
  }

  static getGameStats(playerId: string, gameType: string) {
    const playerResults = this.getPlayerResults(playerId).filter((r) => r.gameType === gameType);
    const totalGames = playerResults.length;
    const totalScore = playerResults.reduce((sum, r) => sum + r.score, 0);
    const totalReward = playerResults.reduce((sum, r) => sum + r.reward, 0);
    const avgScore = totalGames > 0 ? totalScore / totalGames : 0;

    return {
      gameType,
      totalGames,
      totalScore,
      totalReward,
      avgScore,
    };
  }

  static clearSessions(): void {
    this.sessions.clear();
    this.results = [];
  }
}

// Export all games
export const EntertainmentGames = {
  SlotMachineGame,
  LeverMachineGame,
  DouDizhuGame,
  MahjongGame,
  Match3Game,
  ConnectGame,
  BilliardsGame,
  EntertainmentGameManager,
};
