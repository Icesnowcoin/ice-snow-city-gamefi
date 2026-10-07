/**
 * Entertainment City Games System
 * Supports: Slot Machines, Dice Games, Card Games (Dou Dizhu, Mahjong), Casual Games (Match-3, Connect, Billiards)
 */

export interface GameSession {
  id: string;
  playerId: string;
  gameType: string;
  startTime: number;
  endTime?: number;
  bet: number;
  winnings: number;
  status: 'playing' | 'won' | 'lost' | 'abandoned';
  score?: number;
  level?: number;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  totalBet: number;
  totalWinnings: number;
  winRate: number;
  averageWinnings: number;
  level: number;
  experience: number;
}

export class EntertainmentGamesSystem {
  /**
   * Slot Machine Game
   */
  static playSlotMachine(bet: number): { result: string[]; winnings: number; multiplier: number } {
    const symbols = ['🍎', '🍊', '🍋', '🍌', '🍉', '💎'];
    const result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    let multiplier = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
      multiplier = 10; // Jackpot
    } else if (result[0] === result[1] || result[1] === result[2]) {
      multiplier = 2; // Two matches
    }

    return {
      result,
      winnings: Math.floor(bet * multiplier),
      multiplier
    };
  }

  /**
   * Dice Machine Game
   */
  static playDiceMachine(bet: number): { dice: number[]; winnings: number; multiplier: number } {
    const dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];

    const sum = dice.reduce((a, b) => a + b, 0);
    let multiplier = 0;

    if (sum >= 16) multiplier = 3;
    else if (sum >= 12) multiplier = 2;
    else if (sum >= 10) multiplier = 1.5;

    return {
      dice,
      winnings: Math.floor(bet * multiplier),
      multiplier
    };
  }

  /**
   * Dou Dizhu (Landlord) Game
   */
  static playDouDizhu(bet: number, playerCards: number[], opponentCards: number[]): { result: 'win' | 'lose'; winnings: number; score: number } {
    // Simplified logic: higher card count wins
    const playerScore = playerCards.reduce((a, b) => a + b, 0);
    const opponentScore = opponentCards.reduce((a, b) => a + b, 0);

    const result = playerScore > opponentScore ? 'win' : 'lose';
    const multiplier = result === 'win' ? 2 : 0;

    return {
      result,
      winnings: Math.floor(bet * multiplier),
      score: playerScore
    };
  }

  /**
   * Mahjong Game
   */
  static playMahjong(bet: number): { result: 'win' | 'lose'; winnings: number; combination: string } {
    const combinations = ['Pung', 'Kong', 'Chow', 'Eye', 'Winning Hand'];
    const randomCombination = combinations[Math.floor(Math.random() * combinations.length)];
    const isWin = Math.random() > 0.4; // 60% win rate

    return {
      result: isWin ? 'win' : 'lose',
      winnings: isWin ? Math.floor(bet * 1.5) : 0,
      combination: randomCombination
    };
  }

  /**
   * Match-3 Game (Candy Crush style)
   */
  static playMatch3(bet: number, moves: number): { result: 'win' | 'lose'; winnings: number; score: number; level: number } {
    // Simplified: more moves = higher score
    const score = moves * 100 + Math.floor(Math.random() * 500);
    const level = Math.floor(score / 1000) + 1;
    const isWin = score > 2000;

    return {
      result: isWin ? 'win' : 'lose',
      winnings: isWin ? Math.floor(bet * (1 + level * 0.5)) : 0,
      score,
      level
    };
  }

  /**
   * Connect Game (Connect-4 style)
   */
  static playConnect(bet: number): { result: 'win' | 'lose'; winnings: number; score: number } {
    const score = Math.floor(Math.random() * 1000);
    const isWin = score > 500;

    return {
      result: isWin ? 'win' : 'lose',
      winnings: isWin ? Math.floor(bet * 1.5) : 0,
      score
    };
  }

  /**
   * Billiards Game
   */
  static playBilliards(bet: number, difficulty: 'easy' | 'medium' | 'hard'): { result: 'win' | 'lose'; winnings: number; score: number } {
    const difficultyMultiplier = { easy: 0.6, medium: 0.4, hard: 0.2 }[difficulty];
    const isWin = Math.random() < difficultyMultiplier;
    const score = Math.floor(Math.random() * 100);

    return {
      result: isWin ? 'win' : 'lose',
      winnings: isWin ? Math.floor(bet * (2 + (difficulty === 'hard' ? 1 : 0))) : 0,
      score
    };
  }

  /**
   * Create game session
   */
  static createSession(playerId: string, gameType: string, bet: number): GameSession {
    return {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      gameType,
      startTime: Date.now(),
      bet,
      winnings: 0,
      status: 'playing'
    };
  }

  /**
   * Complete game session
   */
  static completeSession(session: GameSession, winnings: number, won: boolean): GameSession {
    session.endTime = Date.now();
    session.winnings = winnings;
    session.status = won ? 'won' : 'lost';
    return session;
  }

  /**
   * Calculate player stats
   */
  static calculateStats(sessions: GameSession[]): GameStats {
    const wins = sessions.filter(s => s.status === 'won').length;
    const losses = sessions.filter(s => s.status === 'lost').length;
    const totalBet = sessions.reduce((sum, s) => sum + s.bet, 0);
    const totalWinnings = sessions.reduce((sum, s) => sum + s.winnings, 0);

    return {
      totalGames: sessions.length,
      wins,
      losses,
      totalBet,
      totalWinnings,
      winRate: sessions.length > 0 ? (wins / sessions.length) * 100 : 0,
      averageWinnings: sessions.length > 0 ? totalWinnings / sessions.length : 0,
      level: Math.floor(totalWinnings / 10000) + 1,
      experience: totalWinnings % 10000
    };
  }

  /**
   * Get leaderboard
   */
  static getLeaderboard(allStats: Map<string, GameStats>, limit: number = 10): Array<{ playerId: string; stats: GameStats }> {
    return Array.from(allStats.entries())
      .map(([playerId, stats]) => ({ playerId, stats }))
      .sort((a, b) => b.stats.totalWinnings - a.stats.totalWinnings)
      .slice(0, limit);
  }
}
