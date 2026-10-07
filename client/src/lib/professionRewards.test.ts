import { describe, expect, it } from "vitest";
import { ProfessionType } from "../../../shared/types/profession";
import { getProfessionRewardPreview, getUnclaimedEligibleProfessionMilestones } from "./professionRewards";

describe("profession reward preview", () => {
  it("keeps all milestones unavailable for a new player", () => {
    const result = getProfessionRewardPreview({ profession: ProfessionType.COMMONER, level: 1, upgradeCount: 0 });
    expect(result.every((item) => !item.eligible)).toBe(true);
  });

  it("reveals level and upgrade milestones from real progression signals", () => {
    const result = getProfessionRewardPreview({ profession: ProfessionType.MERCHANT, level: 30, upgradeCount: 1 });
    expect(result.filter((item) => item.eligible).map((item) => item.id)).toEqual(["level-10", "level-30", "profession-upgrade"]);
    expect(result.find((item) => item.id === "profession-upgrade")?.description).toContain("商人");
  });

  it("filters already claimed milestones", () => {
    const result = getUnclaimedEligibleProfessionMilestones({
      profession: ProfessionType.ENTREPRENEUR,
      level: 90,
      upgradeCount: 4,
      claimedMilestones: ["level-10", "level-30", "level-60", "level-90"],
    });
    expect(result.map((item) => item.id)).toEqual(["profession-upgrade"]);
  });
});
