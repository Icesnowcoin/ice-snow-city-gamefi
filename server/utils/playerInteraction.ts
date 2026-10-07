/**
 * 玩家交互和竞争机制 (Phase 87)
 */

export interface PlayerInteraction {
  id: string;
  type: 'trade' | 'competition' | 'alliance' | 'conflict';
  initiator: string;
  target: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  data: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
}

export interface CompetitionRanking {
  playerId: string;
  rank: number;
  score: number;
  wealth: number;
  properties: number;
  level: number;
}

export class PlayerInteractionManager {
  private interactions: Map<string, PlayerInteraction> = new Map();
  private rankings: Map<string, CompetitionRanking> = new Map();
  private playerScores: Map<string, number> = new Map();

  createInteraction(
    type: PlayerInteraction['type'],
    initiator: string,
    target: string,
    data: Record<string, unknown>
  ): PlayerInteraction {
    const interaction: PlayerInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      initiator,
      target,
      status: 'pending',
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    this.interactions.set(interaction.id, interaction);
    return interaction;
  }

  acceptInteraction(interactionId: string): boolean {
    const interaction = this.interactions.get(interactionId);
    if (!interaction) return false;

    interaction.status = 'accepted';
    return true;
  }

  rejectInteraction(interactionId: string): boolean {
    const interaction = this.interactions.get(interactionId);
    if (!interaction) return false;

    interaction.status = 'rejected';
    return true;
  }

  completeInteraction(interactionId: string): boolean {
    const interaction = this.interactions.get(interactionId);
    if (!interaction) return false;

    interaction.status = 'completed';
    return true;
  }

  getPlayerInteractions(playerId: string): PlayerInteraction[] {
    const interactions: PlayerInteraction[] = [];
    this.interactions.forEach((interaction) => {
      if (interaction.initiator === playerId || interaction.target === playerId) {
        interactions.push(interaction);
      }
    });
    return interactions;
  }

  updatePlayerScore(playerId: string, points: number): void {
    const current = this.playerScores.get(playerId) || 0;
    this.playerScores.set(playerId, current + points);
  }

  updateRankings(): void {
    const rankings: Array<[string, number]> = Array.from(this.playerScores.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    rankings.forEach(([playerId, score], index) => {
      this.rankings.set(playerId, {
        playerId,
        rank: index + 1,
        score,
        wealth: 0,
        properties: 0,
        level: 0,
      });
    });
  }

  getRankings(limit: number = 100): CompetitionRanking[] {
    const rankingsArray = Array.from(this.rankings.values());
    return rankingsArray.slice(0, limit);
  }

  getPlayerRanking(playerId: string): CompetitionRanking | null {
    return this.rankings.get(playerId) || null;
  }

  getSystemStats() {
    return {
      totalInteractions: this.interactions.size,
      totalPlayers: this.playerScores.size,
      topPlayer: this.rankings.get(Array.from(this.rankings.keys())[0]) || null,
    };
  }
}

export default PlayerInteractionManager;
