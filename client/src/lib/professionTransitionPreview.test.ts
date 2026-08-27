import { describe, expect, it } from "vitest";
import { ProfessionType } from "../../../shared/types/profession";
import { getProfessionTransitionPreview } from "./professionTransitionPreview";

describe("profession transition preview", () => {
  it("reports both asset and level shortfalls", () => {
    const preview = getProfessionTransitionPreview(ProfessionType.COMMONER, 10_000, 1);
    expect(preview.canUpgrade).toBe(false);
    expect(preview.assetShortfall).toBe(290_000);
    expect(preview.levelShortfall).toBe(9);
  });

  it("allows a merchant transition only when both gates are met", () => {
    const preview = getProfessionTransitionPreview(ProfessionType.COMMONER, 300_000, 10);
    expect(preview.canUpgrade).toBe(true);
    expect(preview.next?.type).toBe(ProfessionType.MERCHANT);
    expect(preview.assetShortfall).toBe(0);
    expect(preview.levelShortfall).toBe(0);
  });

  it("does not offer a transition from the maximum profession", () => {
    const preview = getProfessionTransitionPreview(ProfessionType.ENTREPRENEUR, 10_000_000, 100);
    expect(preview.canUpgrade).toBe(false);
    expect(preview.next).toBeUndefined();
    expect(preview.reason).toContain("maximum");
  });
});
