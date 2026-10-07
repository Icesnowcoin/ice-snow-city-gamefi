export type ReleaseGateStatus = "ready" | "pending-import" | "pending-device" | "pending-account-action" | "rejected";

export const CLOSURE_COVERAGE_THRESHOLDS = {
  lines: 50,
  statements: 50,
  branches: 50,
  functions: 55,
} as const;

type CoverageMetric = {
  pct: number;
  threshold: number;
};

export type ClosureCoverageInput = {
  reportPath: string;
  linesPct: number;
  statementsPct: number;
  branchesPct: number;
  functionsPct: number;
};

export type ReleaseGateSummaryInput = {
  assetStatus: "ready" | "pending-import" | "rejected";
  assetAccepted: number;
  assetTotal: number;
  softwareBaselineSource: "ci-software";
  softwareBaselineRealDeviceEvidenceRequired: true;
  repositorySafe: boolean;
  accountRotationConfirmed: boolean;
  realDeviceReportProvided: boolean;
  closureCoverage: ClosureCoverageInput;
};

export type ReleaseGateSummary = {
  generatedAt: string;
  overallStatus: "local-ready-external-pending" | "blocked";
  gates: {
    assets: { status: ReleaseGateStatus; accepted: number; total: number };
    softwarePerformance: { status: "ready"; source: "ci-software"; realDeviceEvidenceRequired: true };
    closureCoverage: {
      status: "ready" | "rejected";
      reportPath: string;
      metrics: {
        lines: CoverageMetric;
        statements: CoverageMetric;
        branches: CoverageMetric;
        functions: CoverageMetric;
      };
    };
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
  const coverageMetrics = {
    lines: { pct: input.closureCoverage.linesPct, threshold: CLOSURE_COVERAGE_THRESHOLDS.lines },
    statements: { pct: input.closureCoverage.statementsPct, threshold: CLOSURE_COVERAGE_THRESHOLDS.statements },
    branches: { pct: input.closureCoverage.branchesPct, threshold: CLOSURE_COVERAGE_THRESHOLDS.branches },
    functions: { pct: input.closureCoverage.functionsPct, threshold: CLOSURE_COVERAGE_THRESHOLDS.functions },
  };
  const coverageReady = Object.values(coverageMetrics).every((metric) => metric.pct >= metric.threshold);
  const hasRejectedGate = input.assetStatus === "rejected" || !repositoryReady || !coverageReady;
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
      closureCoverage: {
        status: coverageReady ? "ready" : "rejected",
        reportPath: input.closureCoverage.reportPath,
        metrics: coverageMetrics,
      },
      repositorySecurity: { status: repositoryReady ? "ready" : "rejected" },
      realDevicePerformance: { status: deviceReady ? "ready" : "pending-device" },
      accountRotation: { status: accountReady ? "ready" : "pending-account-action" },
    },
    claims: { localSubstitutesDoNotProveExternalEvidence: true },
  };
}
