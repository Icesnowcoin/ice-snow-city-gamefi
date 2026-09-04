import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = {
  user: null,
  req: { protocol: "https", headers: {} },
  res: {},
} as TrpcContext;

describe("launchNotifications.subscribe", () => {
  it("rejects malformed emails before any subscription write", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.launchNotifications.subscribe({ email: "not-an-email" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects overlong emails at the public boundary", async () => {
    const caller = appRouter.createCaller(ctx);
    const email = `${"a".repeat(310)}@example.com`;
    await expect(caller.launchNotifications.subscribe({ email })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
