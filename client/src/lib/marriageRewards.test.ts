import { describe, expect, it } from "vitest";
import { getMarriageRewardPreview, getUnclaimedEligibleMarriageMilestones } from "./marriageRewards";

const NOW = Date.UTC(2026, 7, 26);

describe("marriage reward preview", () => {
  it("does not mark rewards eligible for a single player", () => {
    const result = getMarriageRewardPreview({ status: "single", hasSharedSpace: true, interactionCount: 20, now: NOW });
    expect(result.every((item) => !item.eligible)).toBe(true);
  });

  it("marks the anniversary milestone after 365 married days", () => {
    const result = getMarriageRewardPreview({
      status: "married",
      marriedAt: NOW - 365 * 24 * 60 * 60 * 1000,
      hasSharedSpace: false,
      interactionCount: 0,
      now: NOW,
    });
    expect(result.find((item) => item.id === "first-anniversary")?.eligible).toBe(true);
  });

  it("requires real shared-space and interaction signals", () => {
    const result = getMarriageRewardPreview({ status: "married", marriedAt: NOW, hasSharedSpace: true, interactionCount: 10, now: NOW });
    expect(result.filter((item) => item.eligible).map((item) => item.id)).toEqual(["shared-space", "social-interaction"]);
  });

  it("filters only eligible and unclaimed milestones", () => {
    const result = getUnclaimedEligibleMarriageMilestones({
      status: "married",
      marriedAt: NOW - 365 * 24 * 60 * 60 * 1000,
      hasSharedSpace: true,
      interactionCount: 10,
      claimedMilestones: ["shared-space"],
      now: NOW,
    });
    expect(result.map((item) => item.id)).toEqual(["first-anniversary", "social-interaction"]);
  });
});
