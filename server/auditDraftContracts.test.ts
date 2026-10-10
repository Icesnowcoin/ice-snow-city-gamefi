import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
const script = path.resolve(process.cwd(), "scripts/audit-draft-contracts.mjs");

describe("draft contract audit report", () => {
  it("locks economy gates, read-only mode, and draft warning", () => {
    const report = JSON.parse(execFileSync(process.execPath, [script], { encoding: "utf8" }));
    expect(report.writeOperations).toBe(false);
    expect(report.results).toHaveLength(2);
    expect(report.results.every((result) => result.status === "static-check-passed")).toBe(true);
    expect(report.results.every((result) => result.warning.includes("第三方审计"))).toBe(true);

    const tax = report.results.find((result) => result.contract.endsWith("TaxSystem.sol"));
    expect(tax.economyChecks).toEqual([
      expect.objectContaining({ id: "tax_split_60_40", passed: true }),
    ]);

    const market = report.results.find((result) => result.contract.endsWith("ISCSeaportStyleMarketplaceOffersDraft.sol"));
    expect(market.economyChecks).toEqual([
      expect.objectContaining({ id: "market_commission_10_percent", passed: true }),
    ]);
  });
});
