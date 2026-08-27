export type ShareLeaderboardTarget = "entry" | "summary";

export function getShareLeaderboardTarget(
  currentUserEntryId: number | null | undefined,
  visibleEntryIds: number[],
): ShareLeaderboardTarget {
  return currentUserEntryId !== null && currentUserEntryId !== undefined && visibleEntryIds.includes(currentUserEntryId)
    ? "entry"
    : "summary";
}

export function getShareLeaderboardLocateMessage(
  currentUserRank: number | null | undefined,
): string {
  return currentUserRank ? `已定位到你的第 ${currentUserRank} 名` : "你暂未上榜，已定位到个人邀请统计";
}
