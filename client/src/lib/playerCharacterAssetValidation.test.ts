import { describe, expect, it } from "vitest";
import { PlayerCharacterModel } from "@/game/models/PlayerCharacterModel";
import {
  PLAYER_CHARACTER_ASSET_TARGET,
  validatePlayerCharacterModel,
} from "./playerCharacterAssetValidation";

describe("PlayerCharacterAssetValidation", () => {
  it("inspects the procedural player model and keeps prototype status honest", () => {
    const model = new PlayerCharacterModel();
    const report = validatePlayerCharacterModel(model);

    expect(report.modelPath).toBe(PLAYER_CHARACTER_ASSET_TARGET.modelPath);
    expect(report.meshCount).toBeGreaterThan(0);
    expect(report.boneCount).toBeGreaterThan(0);
    expect(report.hasSkeleton).toBe(true);
    expect(report.hasValidBoneHierarchy).toBe(true);
    expect(report.hasAnimationEntryPoint).toBe(true);
    expect(report.status).toBe("prototype-needs-upgrade");
    expect(report.skinnedMeshCount).toBe(0);
    expect(report.notes.join(" ")).toContain("SkinnedMesh");

    model.dispose();
  });

  it("exposes measurable geometry and skeleton metrics instead of hardcoded readiness", () => {
    const model = new PlayerCharacterModel({ scale: 1.1 });
    const report = validatePlayerCharacterModel(model);

    expect(report.triangleCount).toBeGreaterThan(0);
    expect(report.triangleCount).toBeLessThan(
      PLAYER_CHARACTER_ASSET_TARGET.maxTriangles
    );
    expect(report.boneCount).toBe(model.getBones().length);
    expect(report.hasSkeleton).toBe(
      model.getSkeleton()?.bones.length === model.getBones().length
    );

    model.dispose();
  });
});
