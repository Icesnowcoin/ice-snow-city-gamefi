import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const referralMocks = vi.hoisted(() => ({
  claimReferral: vi.fn(),
  getReferralLeaderboard: vi.fn(),
}));

vi.mock("./db", async () => ({
  ...(await vi.importActual<typeof import("./db")>("./db")),
  ...referralMocks,
}));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 42): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `referral-test-${userId}`,
    email: `${userId}@example.com`,
    name: `测试玩家 ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("referrals router", () => {
  it("rejects a referral code that does not match the inviter id", async () => {
    const caller = appRouter.createCaller(createAuthContext(42));

    await expect(
      caller.referrals.claim({ referrerUserId: 7, referralCode: "wrong-code" }),
    ).resolves.toEqual({ claimed: false, reason: "invalid_code" });
    expect(referralMocks.claimReferral).not.toHaveBeenCalled();
  });

  it("claims a valid referral for the authenticated user", async () => {
    referralMocks.claimReferral.mockResolvedValueOnce({ claimed: true, reason: "claimed" });
    const caller = appRouter.createCaller(createAuthContext(42));

    await expect(
      caller.referrals.claim({ referrerUserId: 7, referralCode: "7" }),
    ).resolves.toEqual({ claimed: true, reason: "claimed" });
    expect(referralMocks.claimReferral).toHaveBeenCalledWith({
      referrerUserId: 7,
      referredUserId: 42,
      referralCode: "7",
    });
  });

  it("requests a bounded leaderboard for the current user", async () => {
    referralMocks.getReferralLeaderboard.mockResolvedValueOnce({
      entries: [],
      currentUserRank: null,
      currentUserInvitations: 0,
    });
    const caller = appRouter.createCaller(createAuthContext(42));

    await expect(caller.referrals.leaderboard({ limit: 20 })).resolves.toEqual({
      entries: [],
      currentUserRank: null,
      currentUserInvitations: 0,
    });
    expect(referralMocks.getReferralLeaderboard).toHaveBeenCalledWith(42, 20);
  });
});
