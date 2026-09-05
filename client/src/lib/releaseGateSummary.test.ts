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
    expect(summary.gates.realDevicePerformance.status).toBe("pending-device");
    expect(summary.gates.accountRotation.status).toBe("pending-account-action");
    expect(summary.claims.localSubstitutesDoNotProveExternalEvidence).toBe(true);
  });

  it("blocks the release when asset or repository checks reject", () => {
    const summary = createReleaseGateSummary({
      ...baseInput,
      assetStatus: "rejected",
      repositorySafe: false,
    });

    expect(summary.overallStatus).toBe("blocked");
    expect(summary.gates.assets.status).toBe("rejected");
    expect(summary.gates.repositorySecurity.status).toBe("rejected");
  });
});
