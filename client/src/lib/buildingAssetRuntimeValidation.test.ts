import { describe, expect, it } from "vitest";
import {
  CORE_BUILDING_RUNTIME_RECORDS,
  getBuildingRuntimeRecord,
} from "./buildingAssetRuntimeValidation";

describe("BuildingAssetRuntimeValidation", () => {
  it("contains exactly 10 core building and environmental runtime records", () => {
    expect(CORE_BUILDING_RUNTIME_RECORDS).toHaveLength(10);
  });

  it("ensures each building record has valid polygon budgets, PBR texture maps, and asset paths", () => {
    for (const record of CORE_BUILDING_RUNTIME_RECORDS) {
      expect(record.assetId).toMatch(/^BLD-\d{2}$/);
      expect(record.modelPath).toContain("/manus-storage/");
      expect(record.polygonCount).toBeGreaterThan(10000);
      expect(record.polygonCount).toBeLessThan(70000);
      expect(record.lodLevels).toBe(3);
      expect(record.pbrValidated).toBe(true);
      expect(record.runtimeLoadable).toBe(true);
      expect(record.texturePaths.baseColor).toBeTruthy();
      expect(record.texturePaths.normal).toBeTruthy();
      expect(record.texturePaths.roughness).toBeTruthy();
      expect(record.texturePaths.metallic).toBeTruthy();
    }
  });

  it("retrieves specific building runtime records correctly", () => {
    const medicalCenter = getBuildingRuntimeRecord("BLD-01");
    expect(medicalCenter).toBeTruthy();
    expect(medicalCenter?.name).toBe("综合医疗中心");
    expect(medicalCenter?.district).toBe("综合医疗中心");
    expect(medicalCenter?.texturePaths.emissive).toBeTruthy();

    const centralBank = getBuildingRuntimeRecord("BLD-05");
    expect(centralBank).toBeTruthy();
    expect(centralBank?.name).toBe("城市金融银行大厦");
    expect(centralBank?.polygonCount).toBe(52400);

    const ecoPark = getBuildingRuntimeRecord("BLD-09");
    expect(ecoPark).toBeTruthy();
    expect(ecoPark?.polygonCount).toBe(19800);
  });
});
