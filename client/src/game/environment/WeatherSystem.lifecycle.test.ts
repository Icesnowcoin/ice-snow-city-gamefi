import { describe, expect, it, vi } from "vitest";
import { disposeWeatherParticleResources } from "./WeatherSystem";

describe("WeatherSystem particle lifecycle", () => {
  it("disposes particle and dynamic texture resources together", () => {
    const particle = { dispose: vi.fn() };
    const texture = { dispose: vi.fn() };

    disposeWeatherParticleResources(particle, texture);

    expect(particle.dispose).toHaveBeenCalledOnce();
    expect(texture.dispose).toHaveBeenCalledOnce();
  });

  it("accepts cleared resources without throwing", () => {
    expect(() => disposeWeatherParticleResources(null, null)).not.toThrow();
  });
});
