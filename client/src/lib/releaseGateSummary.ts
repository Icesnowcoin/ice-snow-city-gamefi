export type ReleaseGateStatus = "ready" | "pending-import" | "pending-device" | "pending-account-action" | "rejected";

export type ReleaseGateSummaryInput = {
  assetStatus: "ready" | "pending-import" | "rejected";
  assetAccepted: number;
  assetTotal: number;
  softwareBaselineSource: "ci-software";
  softwareBaselineRealDeviceEvidenceRequired: true;
  repositorySafe: boolean;
  accountRotationConfirmed: boolean;
  realDeviceReportProvided: boolean;
};

export type ReleaseGateSummary = {
  generatedAt: string;
  overallStatus: "local-ready-external-pending" | "blocked";
  gates: {
    assets: { status: ReleaseGateStatus; accepted: number; total: number };
    softwarePerformance: { status: "ready"; source: "ci-software"; realDeviceEvidenceRequired: true };
    repositorySecurity: { status: "ready" | "rejected" };
    realDevicePerformance: { status: "ready" | "pending-device" };
    accountRotation: { status: "ready" | "pending-account-action" };
  };
  claims: {
    localSubstitutesDoNotProveExternalEvidence: true;
  };
};

export function createReleaseGateSummary(
  input: ReleaseGateSummaryInput,
  generatedAt = "2026-09-05T00:00:00.000Z",
): ReleaseGateSummary {
  const assetsReady = input.assetStatus === "ready";
  const repositoryReady = input.repositorySafe;
  const deviceReady = input.realDeviceReportProvided;
  const accountReady = input.accountRotationConfirmed;
  const hasRejectedGate = input.assetStatus === "rejected" || !repositoryReady;
  return {
    generatedAt,
    overallStatus: hasRejectedGate ? "blocked" : "local-ready-external-pending",
    gates: {
      assets: {
        status: input.assetStatus,
        accepted: input.assetAccepted,
        total: input.assetTotal,
      },
      softwarePerformance: {
        status: "ready",
        source: input.softwareBaselineSource,
        realDeviceEvidenceRequired: input.softwareBaselineRealDeviceEvidenceRequired,
      },
      repositorySecurity: { status: repositoryReady ? "ready" : "rejected" },
      realDevicePerformance: { status: deviceReady ? "ready" : "pending-device" },
      accountRotation: { status: accountReady ? "ready" : "pending-account-action" },
    },
    claims: { localSubstitutesDoNotProveExternalEvidence: true },
  };
}
