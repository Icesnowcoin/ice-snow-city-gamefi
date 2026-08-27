import { describe, expect, it } from "vitest";

import { SOCIAL_ECONOMY, SocialEconomyError, splitGameConsumption } from "./socialEconomy";

describe("social economy policy", () => {
  it("keeps the published fee constants stable", () => {
    expect(SOCIAL_ECONOMY.megaphonePrice).toBe(1_000);
    expect(SOCIAL_ECONOMY.guildCreationFee).toBe(1_000_000);
    expect(SOCIAL_ECONOMY.teamCreationFee).toBe(10_000);
    expect(SOCIAL_ECONOMY.friendActivationFee).toBe(20_000);
    expect(SOCIAL_ECONOMY.teamDurationMs).toBe(30 * 60 * 1_000);
  });

  it.each([
    [1_000, 600, 400],
    [10_000, 6_000, 4_000],
    [1_000_000, 600_000, 400_000],
    [20_000, 12_000, 8_000],
  ])("splits %i ISC into 60/40 without loss", (gross, treasury, marketing) => {
    expect(splitGameConsumption(gross)).toEqual({
      grossAmount: gross,
      treasuryAmount: treasury,
      marketingAmount: marketing,
    });
    expect(treasury + marketing).toBe(gross);
  });

  it("uses remainder-safe integer accounting for odd amounts", () => {
    expect(splitGameConsumption(1)).toEqual({ grossAmount: 1, treasuryAmount: 0, marketingAmount: 1 });
    expect(splitGameConsumption(7)).toEqual({ grossAmount: 7, treasuryAmount: 4, marketingAmount: 3 });
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid amount %s", (amount) => {
    expect(() => splitGameConsumption(amount)).toThrow(SocialEconomyError);
  });
});
