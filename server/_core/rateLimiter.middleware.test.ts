import express, { type RequestHandler } from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  createApiRateLimiter,
  createGlobalRateLimiter,
  createUserRateLimiter,
} from "./rateLimiter";

const originalNodeEnv = process.env.NODE_ENV;
const originalRedisUrl = process.env.REDIS_URL;

async function requestThroughLimiter(middleware: RequestHandler, path: string, headers: Record<string, string> = {}) {
  const app = express();
  app.use(middleware);
  app.use((_req, res) => res.status(200).send("ok"));
  const server = createServer(app);

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    throw new Error("Failed to obtain test server address");
  }

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, { headers });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

describe("rate limiter Express middleware paths", () => {
  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
  });

  it("skips the global limiter for development preview requests", async () => {
    process.env.NODE_ENV = "development";
    const response = await requestThroughLimiter(createGlobalRateLimiter(), "/game");

    expect(response.status).toBe(200);
    expect(response.headers.get("ratelimit")).toBeNull();
  });

  it("emits production global rate-limit headers", async () => {
    process.env.NODE_ENV = "production";
    const response = await requestThroughLimiter(createGlobalRateLimiter(), "/api/trpc/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("ratelimit-limit")).toBe("1000");
  });

  it("uses stricter API limits for sensitive paths and standard limits elsewhere", async () => {
    process.env.NODE_ENV = "production";
    const middleware = await createApiRateLimiter();
    const sensitive = await requestThroughLimiter(middleware, "/api/admin/settings");
    const ordinary = await requestThroughLimiter(middleware, "/api/game-state");

    expect(sensitive.headers.get("ratelimit-limit")).toBe("20");
    expect(ordinary.headers.get("ratelimit-limit")).toBe("100");
  });

  it("skips OAuth callback but limits ordinary user requests", async () => {
    process.env.NODE_ENV = "production";
    const middleware = await createUserRateLimiter();
    const callback = await requestThroughLimiter(middleware, "/api/oauth/callback");
    const ordinary = await requestThroughLimiter(middleware, "/api/trpc/profile");

    expect(callback.headers.get("ratelimit")).toBeNull();
    expect(ordinary.headers.get("ratelimit-limit")).toBe("200");
  });
});
