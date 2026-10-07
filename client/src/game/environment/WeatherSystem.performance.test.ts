import { describe, expect, it } from "vitest";
import { getWeatherParticleBudget } from "./WeatherSystem";

describe("WeatherSystem mobile particle budgets", () => {
  it("reduces snow particle capacity and texture size on low quality", () => {
    const low = getWeatherParticleBudget("snowy", 1, "low");
    const medium = getWeatherParticleBudget("snowy", 1, "medium");
    const high = getWeatherParticleBudget("snowy", 1, "high");

    expect(low).toEqual({ maxParticles: 600, emitRate: 240, textureSize: 32 });
    expect(medium).toEqual({ maxParticles: 1500, emitRate: 240, textureSize: 48 });
    expect(high).toEqual({ maxParticles: 3000, emitRate: 240, textureSize: 64 });
    expect(low.maxParticles).toBeLessThan(medium.maxParticles);
    expect(medium.maxParticles).toBeLessThan(high.maxParticles);
  });

  it("clamps intensity and keeps rain below the legacy high-quality budget", () => {
    expect(getWeatherParticleBudget("rainy", -1, "low")).toEqual({
      maxParticles: 900,
      emitRate: 220,
      textureSize: 32,
    });
    expect(getWeatherParticleBudget("rainy", 2, "high")).toEqual({
      maxParticles: 5000,
      emitRate: 500,
      textureSize: 64,
    });
  });
});
