export interface PlayerInfoStats {
  friendCount?: number;
  achievementCount?: number;
}

export interface VisiblePlayerStat {
  key: 'friendCount' | 'achievementCount';
  label: string;
  value: number;
}

export function getVisiblePlayerStats(stats?: PlayerInfoStats): VisiblePlayerStat[] {
  if (!stats) return [];

  const visible: VisiblePlayerStat[] = [];
  if (typeof stats.friendCount === 'number' && Number.isFinite(stats.friendCount) && stats.friendCount >= 0) {
    visible.push({ key: 'friendCount', label: '好友', value: stats.friendCount });
  }
  if (
    typeof stats.achievementCount === 'number' &&
    Number.isFinite(stats.achievementCount) &&
    stats.achievementCount >= 0
  ) {
    visible.push({ key: 'achievementCount', label: '成就', value: stats.achievementCount });
  }
  return visible;
}
