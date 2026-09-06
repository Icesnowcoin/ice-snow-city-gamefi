import { describe, expect, it } from "vitest";
import { createReleaseGateSummary } from "./releaseGateSummary";

const baseInput = {
  assetStatus: "pending-import" as const,
  assetAccepted: 0,
  assetTotal: 8,
  softwareBaselineSource: "ci-software" as const,
  softwareBaselineRealDeviceEvidenceRequired: true as const,
  repositorySafe: true,
  accountRotationConfirmed: false,
  realDeviceReportProvided: false,
  closureCoverage: {
    reportPath: "coverage/closure/coverage-summary.json",
    linesPct: 75.49,
    statementsPct: 73.9,
    branchesPct: 73.51,
    functionsPct: 81.39,
  },
};

describe("releaseGateSummary", () => {
  it("reports local readiness while keeping external gates pending", () => {
    const summary = createReleaseGateSummary(baseInput);

    expect(summary.overallStatus).toBe("local-ready-external-pending");
    expect(summary.gates.assets.status).toBe("pending-import");
    expect(summary.gates.softwarePerformance).toEqual({
      status: "ready",
      source: "ci-software",
      realDeviceEvidenceRequired: true,
    });
    expect(summary.gates.closureCoverage.status).toBe("ready");
    expect(summary.gates.closureCoverage.reportPath).toBe("coverage/closure/coverage-summary.json");
    expect(summary.gates.closureCoverage.metrics.functions.threshold).toBe(55);
    expect(summary.gates.realDevicePerformance.status).toBe("pending-device");
    expect(summary.gates.accountRotation.status).toBe("pending-account-action");
    expect(summary.claims.localSubstitutesDoNotProveExternalEvidence).toBe(true);
  });

  it("blocks the release when asset, repository, or coverage checks reject", () => {
    const summary = createReleaseGateSummary({
      ...baseInput,
      assetStatus: "rejected",
      repositorySafe: false,
      closureCoverage: { ...baseInput.closureCoverage, branchesPct: 49.99 },
    });

    expect(summary.overallStatus).toBe("blocked");
    expect(summary.gates.assets.status).toBe("rejected");
    expect(summary.gates.repositorySecurity.status).toBe("rejected");
    expect(summary.gates.closureCoverage.status).toBe("rejected");
  });

  it("keeps a coverage rejection independent from external asset and device evidence", () => {
    const summary = createReleaseGateSummary({
      ...baseInput,
      closureCoverage: { ...baseInput.closureCoverage, functionsPct: 54.99 },
    });

    expect(summary.overallStatus).toBe("blocked");
    expect(summary.gates.assets.status).toBe("pending-import");
    expect(summary.gates.realDevicePerformance.status).toBe("pending-device");
    expect(summary.gates.accountRotation.status).toBe("pending-account-action");
  });
});
