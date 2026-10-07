/**
 * Performance Report Generator
 * Generates comprehensive performance reports comparing before/after optimization
 */

export interface PerformanceReport {
  title: string;
  timestamp: string;
  summary: {
    totalDuration: number;
    networkCallsReduction: number;
    cacheHitRate: number;
    batchingEfficiency: number;
    renderTimeImprovement: number;
  };
  metrics: {
    before: PerformanceSnapshot;
    after: PerformanceSnapshot;
    improvement: PerformanceImprovement;
  };
  recommendations: string[];
  details: string;
}

export interface PerformanceSnapshot {
  timestamp: string;
  totalRequests: number;
  cachedRequests: number;
  batchedRequests: number;
  avgNetworkTime: number;
  totalNetworkTime: number;
  renderCount: number;
  avgRenderTime: number;
  totalRenderTime: number;
  cacheHitRate: number;
  estimatedMemoryUsage: number;
}

export interface PerformanceImprovement {
  requestsReduction: number;
  requestsReductionPercent: number;
  networkTimeReduction: number;
  networkTimeReductionPercent: number;
  renderTimeReduction: number;
  renderTimeReductionPercent: number;
  cacheHitRateImprovement: number;
  memoryUsageReduction: number;
  memoryUsageReductionPercent: number;
}

/**
 * Generate performance snapshot from metrics
 */
export function createPerformanceSnapshot(metrics: any): PerformanceSnapshot {
  return {
    timestamp: new Date().toISOString(),
    totalRequests: metrics.totalRequests || 0,
    cachedRequests: metrics.cachedRequests || 0,
    batchedRequests: metrics.batchedRequests || 0,
    avgNetworkTime: metrics.avgNetworkTime || 0,
    totalNetworkTime: metrics.totalNetworkTime || 0,
    renderCount: metrics.renderCount || 0,
    avgRenderTime: metrics.avgRenderTime || 0,
    totalRenderTime: metrics.totalRenderTime || 0,
    cacheHitRate: metrics.cacheHitRate || 0,
    estimatedMemoryUsage: metrics.estimatedMemoryUsage || 0,
  };
}

/**
 * Calculate performance improvement metrics
 */
export function calculateImprovement(
  before: PerformanceSnapshot,
  after: PerformanceSnapshot
): PerformanceImprovement {
  const requestsReduction = before.totalRequests - after.totalRequests;
  const requestsReductionPercent =
    before.totalRequests > 0 ? (requestsReduction / before.totalRequests) * 100 : 0;

  const networkTimeReduction = before.totalNetworkTime - after.totalNetworkTime;
  const networkTimeReductionPercent =
    before.totalNetworkTime > 0 ? (networkTimeReduction / before.totalNetworkTime) * 100 : 0;

  const renderTimeReduction = before.totalRenderTime - after.totalRenderTime;
  const renderTimeReductionPercent =
    before.totalRenderTime > 0 ? (renderTimeReduction / before.totalRenderTime) * 100 : 0;

  const cacheHitRateImprovement = after.cacheHitRate - before.cacheHitRate;

  const memoryUsageReduction = before.estimatedMemoryUsage - after.estimatedMemoryUsage;
  const memoryUsageReductionPercent =
    before.estimatedMemoryUsage > 0 ? (memoryUsageReduction / before.estimatedMemoryUsage) * 100 : 0;

  return {
    requestsReduction,
    requestsReductionPercent,
    networkTimeReduction,
    networkTimeReductionPercent,
    renderTimeReduction,
    renderTimeReductionPercent,
    cacheHitRateImprovement,
    memoryUsageReduction,
    memoryUsageReductionPercent,
  };
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(
  before: PerformanceSnapshot,
  after: PerformanceSnapshot,
  title: string = "Performance Optimization Report"
): PerformanceReport {
  const improvement = calculateImprovement(before, after);
  const recommendations = generateRecommendations(improvement);

  return {
    title,
    timestamp: new Date().toISOString(),
    summary: {
      totalDuration: Date.now() - new Date(before.timestamp).getTime(),
      networkCallsReduction: improvement.requestsReductionPercent,
      cacheHitRate: after.cacheHitRate,
      batchingEfficiency: after.batchedRequests > 0 ? (after.batchedRequests / after.totalRequests) * 100 : 0,
      renderTimeImprovement: improvement.renderTimeReductionPercent,
    },
    metrics: {
      before,
      after,
      improvement,
    },
    recommendations,
    details: formatReportDetails(before, after, improvement),
  };
}

/**
 * Generate recommendations based on performance improvement
 */
function generateRecommendations(improvement: PerformanceImprovement): string[] {
  const recommendations: string[] = [];

  if (improvement.requestsReductionPercent > 50) {
    recommendations.push("✅ Excellent network call reduction (>50%). Consider maintaining this optimization.");
  } else if (improvement.requestsReductionPercent > 20) {
    recommendations.push("✅ Good network call reduction (>20%). Further optimization possible.");
  } else {
    recommendations.push("⚠️ Network call reduction below 20%. Consider implementing additional caching.");
  }

  if (improvement.cacheHitRateImprovement > 30) {
    recommendations.push("✅ Significant cache hit rate improvement (>30%). Cache strategy is effective.");
  } else if (improvement.cacheHitRateImprovement > 10) {
    recommendations.push("✅ Moderate cache hit rate improvement (>10%). Cache is working well.");
  } else {
    recommendations.push("⚠️ Cache hit rate improvement below 10%. Review caching strategy.");
  }

  if (improvement.renderTimeReductionPercent > 30) {
    recommendations.push("✅ Excellent render time reduction (>30%). UI is significantly faster.");
  } else if (improvement.renderTimeReductionPercent > 10) {
    recommendations.push("✅ Good render time reduction (>10%). UI performance improved.");
  } else {
    recommendations.push("⚠️ Render time reduction below 10%. Consider component optimization.");
  }

  if (improvement.memoryUsageReductionPercent > 20) {
    recommendations.push("✅ Good memory usage reduction (>20%). Memory efficiency improved.");
  } else if (improvement.memoryUsageReductionPercent > 0) {
    recommendations.push("✅ Positive memory usage reduction. Memory efficiency slightly improved.");
  } else {
    recommendations.push("⚠️ Memory usage increased. Review memory management.");
  }

  return recommendations;
}

/**
 * Format report details as human-readable text
 */
function formatReportDetails(
  before: PerformanceSnapshot,
  after: PerformanceSnapshot,
  improvement: PerformanceImprovement
): string {
  const lines: string[] = [
    "=".repeat(60),
    "PERFORMANCE OPTIMIZATION REPORT",
    "=".repeat(60),
    "",
    "NETWORK METRICS",
    "-".repeat(60),
    `Total Requests:        ${before.totalRequests} → ${after.totalRequests} (${improvement.requestsReductionPercent.toFixed(2)}% reduction)`,
    `Cached Requests:       ${before.cachedRequests} → ${after.cachedRequests}`,
    `Batched Requests:      ${before.batchedRequests} → ${after.batchedRequests}`,
    `Avg Network Time:      ${before.avgNetworkTime.toFixed(2)}ms → ${after.avgNetworkTime.toFixed(2)}ms (${improvement.networkTimeReductionPercent.toFixed(2)}% improvement)`,
    `Total Network Time:    ${before.totalNetworkTime.toFixed(2)}ms → ${after.totalNetworkTime.toFixed(2)}ms`,
    "",
    "RENDERING METRICS",
    "-".repeat(60),
    `Render Count:          ${before.renderCount} → ${after.renderCount}`,
    `Avg Render Time:       ${before.avgRenderTime.toFixed(2)}ms → ${after.avgRenderTime.toFixed(2)}ms`,
    `Total Render Time:     ${before.totalRenderTime.toFixed(2)}ms → ${after.totalRenderTime.toFixed(2)}ms (${improvement.renderTimeReductionPercent.toFixed(2)}% improvement)`,
    "",
    "CACHE METRICS",
    "-".repeat(60),
    `Cache Hit Rate:        ${before.cacheHitRate.toFixed(2)}% → ${after.cacheHitRate.toFixed(2)}% (+${improvement.cacheHitRateImprovement.toFixed(2)}%)`,
    "",
    "MEMORY METRICS",
    "-".repeat(60),
    `Estimated Memory:      ${before.estimatedMemoryUsage.toFixed(2)}MB → ${after.estimatedMemoryUsage.toFixed(2)}MB (${improvement.memoryUsageReductionPercent.toFixed(2)}% reduction)`,
    "",
    "=".repeat(60),
  ];

  return lines.join("\n");
}

/**
 * Export report as JSON
 */
export function exportReportAsJSON(report: PerformanceReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Export report as CSV
 */
export function exportReportAsCSV(report: PerformanceReport): string {
  const lines: string[] = [
    "Metric,Before,After,Improvement",
    `Total Requests,${report.metrics.before.totalRequests},${report.metrics.after.totalRequests},${report.metrics.improvement.requestsReductionPercent.toFixed(2)}%`,
    `Avg Network Time (ms),${report.metrics.before.avgNetworkTime.toFixed(2)},${report.metrics.after.avgNetworkTime.toFixed(2)},${report.metrics.improvement.networkTimeReductionPercent.toFixed(2)}%`,
    `Avg Render Time (ms),${report.metrics.before.avgRenderTime.toFixed(2)},${report.metrics.after.avgRenderTime.toFixed(2)},${report.metrics.improvement.renderTimeReductionPercent.toFixed(2)}%`,
    `Cache Hit Rate (%),${report.metrics.before.cacheHitRate.toFixed(2)},${report.metrics.after.cacheHitRate.toFixed(2)},${report.metrics.improvement.cacheHitRateImprovement.toFixed(2)}%`,
    `Memory Usage (MB),${report.metrics.before.estimatedMemoryUsage.toFixed(2)},${report.metrics.after.estimatedMemoryUsage.toFixed(2)},${report.metrics.improvement.memoryUsageReductionPercent.toFixed(2)}%`,
  ];

  return lines.join("\n");
}

/**
 * Export report as HTML
 */
export function exportReportAsHTML(report: PerformanceReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .improvement { color: green; font-weight: bold; }
    .warning { color: orange; font-weight: bold; }
    .success { color: green; }
    .recommendation { margin: 10px 0; padding: 10px; background-color: #f0f0f0; border-left: 4px solid #4CAF50; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p>Generated: ${report.timestamp}</p>
  
  <h2>Summary</h2>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Network Calls Reduction</td>
      <td class="improvement">${report.summary.networkCallsReduction.toFixed(2)}%</td>
    </tr>
    <tr>
      <td>Cache Hit Rate</td>
      <td class="improvement">${report.summary.cacheHitRate.toFixed(2)}%</td>
    </tr>
    <tr>
      <td>Batching Efficiency</td>
      <td class="improvement">${report.summary.batchingEfficiency.toFixed(2)}%</td>
    </tr>
    <tr>
      <td>Render Time Improvement</td>
      <td class="improvement">${report.summary.renderTimeImprovement.toFixed(2)}%</td>
    </tr>
  </table>

  <h2>Detailed Metrics</h2>
  <table>
    <tr>
      <th>Metric</th>
      <th>Before</th>
      <th>After</th>
      <th>Improvement</th>
    </tr>
    <tr>
      <td>Total Requests</td>
      <td>${report.metrics.before.totalRequests}</td>
      <td>${report.metrics.after.totalRequests}</td>
      <td class="improvement">${report.metrics.improvement.requestsReductionPercent.toFixed(2)}%</td>
    </tr>
    <tr>
      <td>Avg Network Time (ms)</td>
      <td>${report.metrics.before.avgNetworkTime.toFixed(2)}</td>
      <td>${report.metrics.after.avgNetworkTime.toFixed(2)}</td>
      <td class="improvement">${report.metrics.improvement.networkTimeReductionPercent.toFixed(2)}%</td>
    </tr>
    <tr>
      <td>Avg Render Time (ms)</td>
      <td>${report.metrics.before.avgRenderTime.toFixed(2)}</td>
      <td>${report.metrics.after.avgRenderTime.toFixed(2)}</td>
      <td class="improvement">${report.metrics.improvement.renderTimeReductionPercent.toFixed(2)}%</td>
    </tr>
    <tr>
      <td>Cache Hit Rate (%)</td>
      <td>${report.metrics.before.cacheHitRate.toFixed(2)}</td>
      <td>${report.metrics.after.cacheHitRate.toFixed(2)}</td>
      <td class="improvement">${report.metrics.improvement.cacheHitRateImprovement.toFixed(2)}%</td>
    </tr>
  </table>

  <h2>Recommendations</h2>
  ${report.recommendations.map((rec) => `<div class="recommendation">${rec}</div>`).join("")}

  <h2>Details</h2>
  <pre>${report.details}</pre>
</body>
</html>
  `;
}
