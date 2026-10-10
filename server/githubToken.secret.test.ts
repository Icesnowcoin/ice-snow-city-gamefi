import { describe, expect, it } from "vitest";

describe("ISC_GITHUB_TOKEN secret", () => {
  it.skipIf(!process.env.ISC_GITHUB_TOKEN)("authenticates against GitHub without exposing the token", async () => {
    const token = process.env.ISC_GITHUB_TOKEN;
    expect(token, "ISC_GITHUB_TOKEN must be configured").toBeTruthy();

    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.ok).toBe(true);
    const identity = (await response.json()) as { login?: string };
    expect(identity.login).toBeTruthy();
  }, 15_000);
});
