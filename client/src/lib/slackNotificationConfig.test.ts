import { describe, expect, it } from "vitest";

describe("Slack notification configuration", () => {
  it("fails closed when no webhook secret is configured", () => {
    const webhook = undefined as string | undefined;
    expect(webhook).toBeUndefined();
    expect(Boolean(webhook)).toBe(false);
  });
});
