import { describe, expect, it } from "vitest";
import {
  CHARACTER_VIEWER_ENVIRONMENTS,
  getCharacterViewerEnvironmentConfig,
} from "./characterViewerEnvironments";

describe("character viewer environments", () => {
  it("provides snow, indoor and night presets", () => {
    expect(CHARACTER_VIEWER_ENVIRONMENTS.map((item) => item.id)).toEqual(["snow", "indoor", "night"]);
  });

  it("keeps environment parameters distinct", () => {
    const snow = getCharacterViewerEnvironmentConfig("snow");
    const indoor = getCharacterViewerEnvironmentConfig("indoor");
    const night = getCharacterViewerEnvironmentConfig("night");
    expect(snow.groundMaterial).toBe("snow");
    expect(indoor.groundMaterial).toBe("wood");
    expect(night.groundMaterial).toBe("asphalt");
    expect(snow.directionalDiffuse).not.toEqual(indoor.directionalDiffuse);
  });

  it("falls back to the winter snow preset for an invalid runtime value", () => {
    expect(getCharacterViewerEnvironmentConfig("invalid" as never).id).toBe("snow");
  });
});
