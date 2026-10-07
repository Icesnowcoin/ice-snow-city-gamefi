import { describe, expect, it } from "vitest";
import { getShareLeaderboardLocateMessage, getShareLeaderboardTarget } from "./shareLeaderboardUtils";

describe("share leaderboard location helpers", () => {
  it("targets the visible current-user entry when it is in the loaded page", () => {
    expect(getShareLeaderboardTarget(42, [7, 42, 99])).toBe("entry");
  });

  it("targets the personal summary when the current user is outside the loaded page", () => {
    expect(getShareLeaderboardTarget(42, [7, 99])).toBe("summary");
    expect(getShareLeaderboardTarget(null, [7, 99])).toBe("summary");
  });

  it("returns accessible status messages for ranked and unranked players", () => {
    expect(getShareLeaderboardLocateMessage(3)).toBe("已定位到你的第 3 名");
    expect(getShareLeaderboardLocateMessage(null)).toBe("你暂未上榜，已定位到个人邀请统计");
  });
});
