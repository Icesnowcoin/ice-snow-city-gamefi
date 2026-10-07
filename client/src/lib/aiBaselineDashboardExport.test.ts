import { describe, expect, it } from "vitest";
import { BASELINE_ASSETS, DASHBOARD_META, PERFORMANCE_SNAPSHOTS } from "./aiBaselineDashboardData";
import { buildBaselineCsv, buildBaselinePdf } from "./aiBaselineDashboardExport";

const input = {
  assets: BASELINE_ASSETS.slice(0, 1),
  performance: PERFORMANCE_SNAPSHOTS,
  meta: DASHBOARD_META,
};

describe("aiBaselineDashboardExport", () => {
  it("exports current asset checks and performance snapshots as UTF-8 CSV", () => {
    const csv = buildBaselineCsv(input);
    expect(csv.startsWith("\uFEFFreport_type,ai_baseline_asset_quality")).toBe(true);
    expect(csv).toContain("player-character-baseline");
    expect(csv).toContain("fileIntegrity");
    expect(csv).toContain("PENDING_EVIDENCE");
    expect(csv).toContain("CI 软件验证 · 2026-09-16");
    expect(csv).toContain("58,52,22.5,28,0.01");
  });

  it("keeps evidence boundaries in the PDF export and produces a valid PDF header", () => {
    const pdf = buildBaselinePdf(input);
    const text = new TextDecoder().decode(pdf);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("procedural-baseline");
    expect(text).toContain("ci-software");
    expect(text).toContain("Real device evidence required: true");
    expect(text).toContain("xref");
    expect(text).toContain("%%EOF");
  });

  it("supports an empty filtered asset set without dropping performance data", () => {
    const csv = buildBaselineCsv({ ...input, assets: [] });
    expect(csv).not.toContain("player-character-baseline");
    expect(csv).toContain("performance_label");
    expect(csv).toContain("58,52,22.5,28,0.01");
  });
});
