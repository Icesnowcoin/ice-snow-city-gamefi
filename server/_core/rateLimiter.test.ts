import { afterEach, describe, expect, it } from "vitest";
import { getClientIp, shouldSkipDevelopmentRateLimit } from "./rateLimiter";

function requestWithIp(ip: string, forwarded?: string) {
  return {
    ip,
    headers: forwarded ? { "x-forwarded-for": forwarded } : {},
  } as any;
}

describe("rate limiter client key normalization", () => {
  it("normalizes IPv6 addresses through the express-rate-limit helper", () => {
    expect(getClientIp(requestWithIp("2001:db8:abcd:0012:0000:0000:0000:0001"))).toBe(
      "2001:db8:abcd::/56",
    );
  });

  it("prefers the first forwarded address and trims whitespace", () => {
    expect(
      getClientIp(requestWithIp("127.0.0.1", " 2001:db8:abcd:0012::2, 198.51.100.4")),
    ).toBe("2001:db8:abcd::/56");
  });
});

describe("rate limiter environment safety", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("skips application limiters in development previews", () => {
    process.env.NODE_ENV = "development";
    expect(shouldSkipDevelopmentRateLimit(requestWithIp("203.0.113.10"))).toBe(true);
  });

  it("keeps ordinary production requests rate-limited", () => {
    process.env.NODE_ENV = "production";
    expect(shouldSkipDevelopmentRateLimit(requestWithIp("203.0.113.10"))).toBe(false);
    expect(shouldSkipDevelopmentRateLimit({ ...requestWithIp("203.0.113.10"), path: "/health" })).toBe(true);
  });
});
