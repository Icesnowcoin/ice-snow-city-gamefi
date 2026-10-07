import { describe, expect, it } from "vitest";

import { evaluatePerformanceBudget, type BenchmarkSuite } from "./performanceBenchmark";

function suite(overrides: Partial<BenchmarkSuite> = {}): BenchmarkSuite {
  return {
    name: "test",
    timestamp: new Date().toISOString(),
    results: [
      { name: "NPC Without", duration: 100, memoryBefore: 0, memoryAfter: 0, operationsPerSecond: 1, success: true },
      { name: "NPC With", duration: 50, memoryBefore: 0, memoryAfter: 0, operationsPerSecond: 2, success: true },
      { name: "Economy Without", duration: 100, memoryBefore: 0, memoryAfter: 0, operationsPerSecond: 1, success: true },
      { name: "Economy With", duration: 60, memoryBefore: 0, memoryAfter: 0, operationsPerSecond: 2, success: true },
      { name: "Concurrent Without", duration: 100, memoryBefore: 0, memoryAfter: 0, operationsPerSecond: 1, success: true },
      { name: "Concurrent With", duration: 40, memoryBefore: 0, memoryAfter: 0, operationsPerSecond: 2, success: true },
    ],
    summary: { totalDuration: 450, averageOperationsPerSecond: 1.5, successRate: 100, failureCount: 0 },
    ...overrides,
  };
}

describe("evaluatePerformanceBudget", () => {
  it("passes when all optimization gates beat their baselines", () => {
    const result = evaluatePerformanceBudget(suite());
    expect(result.passed).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.optimizationChecks).toEqual({
      npcOptimization: true,
      economyOptimization: true,
      requestDeduplication: true,
    });
  });

  it("reports failed operations and memory growth without hiding the failure", () => {
    const result = evaluatePerformanceBudget(suite({
      results: suite().results.map((item, index) => index === 0 ? { ...item, success: false, memoryAfter: 10 } : item),
      summary: { totalDuration: 450, averageOperationsPerSecond: 1.5, successRate: 80, failureCount: 1 },
    }));
    expect(result.passed).toBe(false);
    expect(result.memoryGrowthCount).toBe(1);
    expect(result.warnings).toContain("Benchmark suite contains failed operations.");
    expect(result.warnings).toContain("1 benchmark operation(s) increased measured memory usage.");
  });
});
