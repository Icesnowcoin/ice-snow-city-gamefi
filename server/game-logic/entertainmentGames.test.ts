import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SlotMachineGame,
  LeverMachineGame,
  DouDizhuGame,
  MahjongGame,
  Match3Game,
  ConnectGame,
  BilliardsGame,
  EntertainmentGameManager,
} from './entertainmentGames';

describe('Entertainment Games', () => {
  beforeEach(() => {
    EntertainmentGameManager.clearSessions();
  });

  afterEach(() => {
    EntertainmentGameManager.clearSessions();
  });

  describe('Slot Machine Game', () => {
    it('should create a slot machine session', () => {
      const session = SlotMachineGame.createSession('player1');
      expect(session.playerId).toBe('player1');
      expect(session.gameType).toBe('slot_machine');
      expect(session.status).toBe('active');
      expect(session.score).toBe(0);
    });

    it('should spin and get result', () => {
      const session = SlotMachineGame.createSession('player1');
      const result = SlotMachineGame.spin(session, 100);
      expect(result.playerId).toBe('player1');
      expect(result.gameType).toBe('slot_machine');
      expect(result.reward).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple spins', () => {
      const session = SlotMachineGame.createSession('player1');
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(SlotMachineGame.spin(session, 100));
      }
      expect(results.length).toBe(10);
    });
  });

  describe('Lever Machine Game', () => {
    it('should create a lever machine session', () => {
      const session = LeverMachineGame.createSession('player1');
      expect(session.playerId).toBe('player1');
      expect(session.gameType).toBe('lever_machine');
      expect(session.status).toBe('active');
    });

    it('should pull lever and get result', () => {
      const session = LeverMachineGame.createSession('player1');
      const result = LeverMachineGame.pull(session, 100);
      expect(result.playerId).toBe('player1');
      expect(result.gameType).toBe('lever_machine');
      expect(result.reward).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dou Dizhu Game', () => {
    it('should create a dou dizhu session', () => {
      const session = DouDizhuGame.createSession('player1');
      expect(session.playerId).toBe('player1');
      expect(session.gameType).toBe('dou_dizhu');
    });

    it('should play a round', () => {
      const session = DouDizhuGame.createSession('player1');
      const result = DouDizhuGame.playRound(session, 100);
      expect(result.playerId).toBe('player1');
      expect(result.gameType).toBe('dou_dizhu');
      expect(result.reward).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Mahjong Game', () => {
    it('should create a mahjong session', () => {
      const session = MahjongGame.createSession('player1');
      expect(session.playerId).toBe('player1');
      expect(session.gameType).toBe('mahjong');
    });

    it('should play a round', () => {
      const session = MahjongGame.createSession('player1');
      const result = MahjongGame.playRound(session, 100);
      expect(result.playerId).toBe('player1');
      expect(result.gameType).toBe('mahjong');
      expect(result.reward).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Match-3 Game', () => {
    it('should create a match-3 session', () => {
      const session = Match3Game.createSession('player1');
      expect(session.playerId).toBe('player1');
      expect(session.gameType).toBe('match3');
    });

    it('should play easy level', () => {
      const session = Match3Game.createSession('player1');
      const result = Match3Game.playLevel(session, 'easy');
      expect(result.score).toBeGreaterThan(0);
      expect(result.reward).toBeGreaterThanOrEqual(0);
    });

    it('should play medium level', () => {
      const session = Match3Game.createSession('player1');
      const result = Match3Game.playLevel(session, 'medium');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should play hard level', () => {
      const session = Match3Game.createSession('player1');
      const result = Match3Game.playLevel(session, 'hard');
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Connect Game', () => {
    it('should create a connect session', () => {
      const session = ConnectGame.createSession('player1');
      expect(session.playerId).toBe('player1');
      expect(session.gameType).toBe('connect');
    });

    it('should play game with different difficulties', () => {
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
      difficulties.forEach((difficulty) => {
        const session = ConnectGame.createSession('player1');
        const result = ConnectGame.playGame(session, difficulty);
        expect(result.score).toBeGreaterThan(0);
      });
    });
  });

  describe('Billiards Game', () => {
    it('should create a billiards session', () => {
      const session = BilliardsGame.createSession('player1');
      expect(session.playerId).toBe('player1');
      expect(session.gameType).toBe('billiards');
    });

    it('should play a match', () => {
      const session = BilliardsGame.createSession('player1');
      const result = BilliardsGame.playMatch(session, 100);
      expect(result.reward).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Entertainment Game Manager', () => {
    it('should create game session', () => {
      const session = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      expect(session.playerId).toBe('player1');
      expect(session.gameType).toBe('slot_machine');
    });

    it('should create different game types', () => {
      const gameTypes = ['slot_machine', 'lever_machine', 'dou_dizhu', 'mahjong', 'match3', 'connect', 'billiards'];
      gameTypes.forEach((gameType) => {
        const session = EntertainmentGameManager.createGameSession('player1', gameType);
        expect(session.gameType).toBe(gameType);
      });
    });

    it('should record game result', () => {
      const session = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      const result = SlotMachineGame.spin(session, 100);
      EntertainmentGameManager.recordResult(result);

      const playerResults = EntertainmentGameManager.getPlayerResults('player1');
      expect(playerResults.length).toBe(1);
    });

    it('should complete game session', () => {
      const session = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      const completed = EntertainmentGameManager.completeSession(session.id);
      expect(completed?.status).toBe('completed');
      expect(completed?.endTime).toBeDefined();
    });

    it('should get player results', () => {
      const session1 = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      const session2 = EntertainmentGameManager.createGameSession('player2', 'slot_machine');

      const result1 = SlotMachineGame.spin(session1, 100);
      const result2 = SlotMachineGame.spin(session2, 100);

      EntertainmentGameManager.recordResult(result1);
      EntertainmentGameManager.recordResult(result2);

      const player1Results = EntertainmentGameManager.getPlayerResults('player1');
      const player2Results = EntertainmentGameManager.getPlayerResults('player2');

      expect(player1Results.length).toBe(1);
      expect(player2Results.length).toBe(1);
    });

    it('should get game leaderboard', () => {
      for (let i = 0; i < 5; i++) {
        const session = EntertainmentGameManager.createGameSession(`player${i}`, 'slot_machine');
        const result = SlotMachineGame.spin(session, 100);
        EntertainmentGameManager.recordResult(result);
      }

      const leaderboard = EntertainmentGameManager.getGameLeaderboard('slot_machine', 10);
      expect(leaderboard.length).toBeLessThanOrEqual(5);
    });

    it('should calculate total rewards', () => {
      const session = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      const result1 = SlotMachineGame.spin(session, 100);
      const result2 = SlotMachineGame.spin(session, 100);

      EntertainmentGameManager.recordResult(result1);
      EntertainmentGameManager.recordResult(result2);

      const totalRewards = EntertainmentGameManager.getTotalRewards('player1');
      expect(totalRewards).toBe(result1.reward + result2.reward);
    });

    it('should get game stats', () => {
      const session = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      const result = SlotMachineGame.spin(session, 100);
      EntertainmentGameManager.recordResult(result);

      const stats = EntertainmentGameManager.getGameStats('player1', 'slot_machine');
      expect(stats.gameType).toBe('slot_machine');
      expect(stats.totalGames).toBe(1);
      expect(stats.totalScore).toBe(result.score);
      expect(stats.totalReward).toBe(result.reward);
    });

    it('should handle multiple games per player', () => {
      const session = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      const results = [];

      for (let i = 0; i < 5; i++) {
        const result = SlotMachineGame.spin(session, 100);
        results.push(result);
        EntertainmentGameManager.recordResult(result);
      }

      const playerResults = EntertainmentGameManager.getPlayerResults('player1');
      expect(playerResults.length).toBe(5);

      const stats = EntertainmentGameManager.getGameStats('player1', 'slot_machine');
      expect(stats.totalGames).toBe(5);
    });

    it('should clear all sessions', () => {
      EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      EntertainmentGameManager.createGameSession('player2', 'mahjong');

      EntertainmentGameManager.clearSessions();

      const player1Results = EntertainmentGameManager.getPlayerResults('player1');
      expect(player1Results.length).toBe(0);
    });
  });

  describe('Cross-Game Tests', () => {
    it('should handle multiple game types for same player', () => {
      const games = [
        'slot_machine',
        'lever_machine',
        'dou_dizhu',
        'mahjong',
        'match3',
        'connect',
        'billiards',
      ];

      games.forEach((gameType) => {
        const session = EntertainmentGameManager.createGameSession('player1', gameType);
        expect(session.gameType).toBe(gameType);
      });
    });

    it('should track results across different games', () => {
      const session1 = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      const session2 = EntertainmentGameManager.createGameSession('player1', 'mahjong');

      const result1 = SlotMachineGame.spin(session1, 100);
      const result2 = MahjongGame.playRound(session2, 100);

      EntertainmentGameManager.recordResult(result1);
      EntertainmentGameManager.recordResult(result2);

      const playerResults = EntertainmentGameManager.getPlayerResults('player1');
      expect(playerResults.length).toBe(2);
      expect(playerResults.some((r) => r.gameType === 'slot_machine')).toBe(true);
      expect(playerResults.some((r) => r.gameType === 'mahjong')).toBe(true);
    });

    it('should calculate stats for each game type', () => {
      const session1 = EntertainmentGameManager.createGameSession('player1', 'slot_machine');
      const session2 = EntertainmentGameManager.createGameSession('player1', 'mahjong');

      const result1 = SlotMachineGame.spin(session1, 100);
      const result2 = MahjongGame.playRound(session2, 100);

      EntertainmentGameManager.recordResult(result1);
      EntertainmentGameManager.recordResult(result2);

      const slotStats = EntertainmentGameManager.getGameStats('player1', 'slot_machine');
      const mahjongStats = EntertainmentGameManager.getGameStats('player1', 'mahjong');

      expect(slotStats.totalGames).toBe(1);
      expect(mahjongStats.totalGames).toBe(1);
    });
  });
});
