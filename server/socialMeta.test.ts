import { describe, expect, it } from "vitest";
import express from "express";
import { renderGameSocialMeta } from "./socialMeta";

describe("renderGameSocialMeta", () => {
  const requestFor = (path: string) => {
    const app = express();
    const request = { path, protocol: "https", get: (name: string) => (name === "host" ? "game.example.com" : undefined), headers: {} } as unknown as express.Request;
    return request;
  };

  it("renders absolute OG and Twitter Card metadata for /game", () => {
    const html = renderGameSocialMeta(requestFor("/game"));
    expect(html).toContain('property="og:url" content="https://game.example.com/game"');
    expect(html).toContain('property="og:image" content="https://game.example.com/manus-storage/isc_opening_hero_recomposed_v2_48a42ac8.webp"');
    expect(html).toContain('property="og:image:width" content="1280"');
    expect(html).toContain('property="og:image:height" content="720"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain("Ice Snow City");
  });

  it("does not inject game metadata into other routes", () => {
    expect(renderGameSocialMeta(requestFor("/"))).toBe("");
  });
});
