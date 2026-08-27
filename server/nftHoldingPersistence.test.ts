import { describe, expect, it } from "vitest";
import { resolveHoldingMutation } from "./nftHoldingPersistence";

describe("nft holding persistence", () => {
  it("upserts a positive balance from a missing row", () => {
    expect(resolveHoldingMutation(null, "3")).toEqual({ kind: "upsert", amount: "3" });
  });

  it("updates partial transfers", () => {
    expect(resolveHoldingMutation("5", "-2")).toEqual({ kind: "upsert", amount: "3" });
  });

  it("deletes rows when a burn reaches zero", () => {
    expect(resolveHoldingMutation("1", "-1")).toEqual({ kind: "delete", amount: "0" });
  });

  it("rejects negative balances", () => {
    expect(() => resolveHoldingMutation("1", "-2")).toThrow("负数余额");
  });
});
